/**
 * Secure Existing Uploads (runs on every start, does nothing once done)
 * ====================================================================
 * Older client files were saved in public/uploads (which the web server serves
 * to anyone) with guessable names (e.g. NENG-2026-4302_Client_Engagement.pdf).
 * For every client file a record links to, this:
 *   1. copies it to storage/uploads (private) under a name with a random part,
 *   2. updates every stored link to the new name (all application tables),
 *   3. deletes the old public copy.
 * Any other file left in public/uploads (except blog images) is then moved to
 * storage/uploads, so nothing private stays where the web server can serve it.
 */

const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");
const { getFileSources } = require("./fileOwnership");
const { PRIVATE_UPLOADS_DIR, PUBLIC_UPLOADS_DIR, SECURE_NAME, randomToken } = require("./privateFiles");

// "uploads/<path>.<ext>" inside any stored value (plain, list, JSON or full URL)
const LINK_PATTERN = /uploads\/([^\s"'<>,;)\]?#\\]+\.[A-Za-z0-9]{2,5})/g;
const PDF_TABLE_MODELS = ["NewIndividualPdf", "NewCompanyPdf"];

const isPrivateRel = (rel) => !rel.startsWith("blog/") && !rel.split("/").includes("..");

/** Existing copy of a file (private first, then public), or null. */
const findFile = (rel) => {
  for (const root of [PRIVATE_UPLOADS_DIR, PUBLIC_UPLOADS_DIR]) {
    const full = path.resolve(root, rel);
    if (full.startsWith(root + path.sep) && fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
};

const withSecureName = (rel) => {
  const ext = path.posix.extname(rel);
  return `${rel.slice(0, rel.length - ext.length)}_${randomToken()}${ext}`;
};

const copyInto = (src, rel) => {
  const dest = path.join(PRIVATE_UPLOADS_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return dest;
};

const removeQuietly = (file) => {
  try {
    if (file && fs.existsSync(file)) fs.unlinkSync(file);
  } catch (error) {
    console.warn(`[Uploads] could not delete ${file}:`, error.message);
  }
};

/**
 * Every non-blog upload path any application record links to, plus the
 * tables / columns that hold links (only those are updated later).
 */
const collectLinkedPaths = async (sequelize, sources) => {
  const found = new Set();
  const holders = new Map(); // table -> Set(columns)
  for (const source of sources) {
    const where = source.columns.map((c) => `CAST(\`${c}\` AS CHAR) LIKE '%uploads/%'`).join(" OR ");
    const cols = source.columns.map((c) => `CAST(\`${c}\` AS CHAR) AS \`${c}\``).join(", ");
    let rows = [];
    try {
      rows = await sequelize.query(`SELECT ${cols} FROM \`${source.table}\` WHERE ${where}`, { type: QueryTypes.SELECT });
    } catch (error) {
      if (!/doesn't exist/i.test(error.message)) console.error(`[Uploads] reading ${source.table}:`, error.message);
      continue;
    }
    for (const row of rows) {
      for (const [column, value] of Object.entries(row)) {
        if (typeof value !== "string") continue;
        for (const match of value.matchAll(LINK_PATTERN)) {
          if (!isPrivateRel(match[1])) continue;
          found.add(match[1]);
          if (!holders.has(source.table)) holders.set(source.table, new Set());
          holders.get(source.table).add(column);
        }
      }
    }
  }
  return {
    found,
    holders: [...holders].map(([table, columns]) => ({ table, columns: [...columns] })),
  };
};

/** Replace one link everywhere it is stored (one transaction). */
const replaceLink = async (sequelize, sources, pdfTables, oldRel, newRel) => {
  const oldLink = `uploads/${oldRel}`;
  const newLink = `uploads/${newRel}`;
  const like = `%${oldLink.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  await sequelize.transaction(async (transaction) => {
    for (const source of sources) {
      for (const column of source.columns) {
        await sequelize.query(
          `UPDATE \`${source.table}\` SET \`${column}\` = REPLACE(CAST(\`${column}\` AS CHAR), :oldLink, :newLink) WHERE CAST(\`${column}\` AS CHAR) LIKE :like`,
          { replacements: { oldLink, newLink, like }, transaction }
        );
      }
    }
    // PDF history tables also keep the bare file name
    for (const table of pdfTables) {
      await sequelize.query(`UPDATE \`${table}\` SET fileName = :newName WHERE fileName = :oldName AND filePath LIKE :newLike`, {
        replacements: {
          newName: path.posix.basename(newRel),
          oldName: path.posix.basename(oldRel),
          newLike: `%${newLink.replace(/[\\%_]/g, (c) => `\\${c}`)}%`,
        },
        transaction,
      });
    }
  });
};

/** Move whatever is left in public/uploads (except blog/) into the private folder. */
const sweepPublicFolder = () => {
  let moved = 0;
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(PUBLIC_UPLOADS_DIR, full).split(path.sep).join("/");
      if (rel === "blog" || rel.startsWith("blog/")) continue;
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name === ".gitkeep") continue;
      const dest = path.join(PRIVATE_UPLOADS_DIR, rel);
      if (fs.existsSync(dest)) {
        removeQuietly(full); // already private
      } else {
        copyInto(full, rel);
        removeQuietly(full);
      }
      moved += 1;
    }
  };
  walk(PUBLIC_UPLOADS_DIR);
  return moved;
};

const secureExistingUploads = async () => {
  const models = require("../models");
  const { sequelize } = models;
  const sources = getFileSources();
  const pdfTables = PDF_TABLE_MODELS.filter((name) => models[name]).map((name) => models[name].getTableName());

  const { found: linked, holders } = await collectLinkedPaths(sequelize, sources);
  let renamed = 0;
  let failed = 0;

  // Longest first, so a path that starts with another one is replaced before it
  for (const rel of [...linked].sort((a, b) => b.length - a.length)) {
    const source = findFile(rel);

    // Already unguessable: only make sure it is not in the public folder
    if (SECURE_NAME.test(rel)) {
      if (source && source.startsWith(PUBLIC_UPLOADS_DIR + path.sep)) {
        copyInto(source, rel);
        removeQuietly(source);
      }
      continue;
    }

    const newRel = withSecureName(rel);
    const htmlRel = rel.endsWith(".pdf") ? rel.replace(/\.pdf$/, ".html") : null;
    const htmlSource = htmlRel ? findFile(htmlRel) : null;
    const copies = [];
    try {
      if (source) copies.push(copyInto(source, newRel));
      if (htmlSource) copies.push(copyInto(htmlSource, newRel.replace(/\.pdf$/, ".html")));
      await replaceLink(sequelize, holders, pdfTables, rel, newRel);
      removeQuietly(source);
      removeQuietly(htmlSource);
      renamed += 1;
    } catch (error) {
      copies.forEach(removeQuietly);
      failed += 1;
      console.error(`[Uploads] could not secure ${rel}:`, error.message);
    }
  }

  const swept = sweepPublicFolder();
  if (renamed || swept || failed) {
    console.log(`🔒 Uploads secured: ${renamed} file link(s) renamed, ${swept} file(s) moved out of public/${failed ? `, ${failed} failed` : ""}.`);
  }
  return { renamed, swept, failed };
};

module.exports = { secureExistingUploads };
