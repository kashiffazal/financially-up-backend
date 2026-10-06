/**
 * Global Application Search Service
 * =================================
 * Powers the admin header search (`GET /api/search`).
 *
 * - SEARCH_REGISTRY holds one entry per application module: which columns are
 *   searchable, how to build the display title / reference, and which
 *   permission gates it. Adding a module = adding one registry entry.
 * - Query interpretation: legacy references (GST-12), flagship references
 *   (CREG-2026-00012 / NENG-…), emails, phone / ABN / ACN digit strings
 *   (matched against space/dash-stripped columns) and multi-word free text.
 * - Sensitive values (TFN, DOB, Medicare card numbers, addresses) are
 *   deliberately NOT searchable.
 */

const { Op, fn, col, where: sqlWhere } = require("sequelize");
const models = require("../models");

// ============================
// Module Registry
// ============================

const joinName = (...parts) => parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

/**
 * Field kinds:
 * - text:  free-text LIKE match
 * - email: LIKE match, also used exclusively for queries containing "@"
 * - phone / number: LIKE match + digit-normalised match (spaces, dashes, brackets, "+" stripped)
 */
const SEARCH_REGISTRY = [
  {
    key: "new-company",
    name: "Company Registration",
    model: "NewCompanyRegistration",
    route: "/admin/company-registration-new",
    color: "#008043",
    permission: "company.registration.view",
    refField: "referenceNumber",
    refFallbackPrefix: "CR",
    fields: [
      { col: "companyName1", label: "Company Name", kind: "text" },
      { col: "companyName2", label: "Company Name (Option 2)", kind: "text" },
      { col: "companyName3", label: "Company Name (Option 3)", kind: "text" },
      { col: "contactName", label: "Contact", kind: "text" },
      { col: "contactEmail", label: "Email", kind: "email" },
      { col: "contactMobile", label: "Phone", kind: "phone" },
      { col: "proposedBusinessName", label: "Business Name", kind: "text" },
      { col: "trustName", label: "Trust Name", kind: "text" },
      { col: "ultimateHoldingAcn", label: "Holding Company ACN", kind: "number" },
      { col: "authorisedRecipientName", label: "Authorised Recipient", kind: "text" },
      { col: "authorisedRecipientEmail", label: "Recipient Email", kind: "email" },
      { col: "authorisedRecipientPhone", label: "Recipient Phone", kind: "phone" },
    ],
    // Officeholders (directors / secretaries) live in their own table
    related: {
      model: "NewCompanyOfficeholder",
      foreignKey: "registrationId",
      labelPrefix: "Officeholder",
      fields: [
        { col: "fullName", label: "Name", kind: "text" },
        { col: "firstName", label: "Name", kind: "text" },
        { col: "lastName", label: "Name", kind: "text" },
        { col: "email", label: "Email", kind: "email" },
        { col: "mobile", label: "Phone", kind: "phone" },
      ],
    },
    extraAttributes: ["companyType", "jurisdictionState"],
    title: (r) => r.companyName1 || r.contactName || "New Company Registration",
    subtitle: (r) => joinName(r.companyType, r.jurisdictionState && `(${r.jurisdictionState})`) || "Company Registration",
  },
  {
    key: "new-individual",
    name: "Individual Engagement",
    model: "NewIndividualEngagement",
    route: "/admin/individual-engagement-new",
    color: "#10b981",
    permission: "individual.engagement.view",
    refField: "referenceNumber",
    refFallbackPrefix: "IE",
    fields: [
      { col: "existingAbn", label: "ABN", kind: "number" },
      { col: "gstAbn", label: "GST ABN", kind: "number" },
      { col: "accountName", label: "Account Name", kind: "text" },
      { col: "spouseName", label: "Spouse", kind: "text" },
      { col: "previousNames", label: "Previous Names", kind: "text" },
    ],
    // Client identity lives in new_individual_clients (engagement.clientId → client.id)
    client: {
      model: "NewIndividualClient",
      localKey: "clientId",
      fields: [
        { col: "fullName", label: "Client", kind: "text" },
        { col: "firstName", label: "Client", kind: "text" },
        { col: "lastName", label: "Client", kind: "text" },
        { col: "email", label: "Email", kind: "email" },
        { col: "mobile", label: "Phone", kind: "phone" },
      ],
    },
    extraAttributes: ["clientId", "taxResidency"],
    title: (r) =>
      r.__client?.fullName || joinName(r.__client?.firstName, r.__client?.lastName) || "Individual Engagement",
    // entityService holds a Yes/No answer, not a service name — show residency instead
    subtitle: (r) => r.taxResidency || "Individual Tax Engagement",
  },
  {
    key: "legacy-company",
    name: "Company Registration (Legacy)",
    model: "CompanyRegistration",
    route: "/admin/company-registration",
    color: "#047857",
    permission: "company.registration.view",
    refPrefix: "COMP",
    fields: [
      { col: "companyName", label: "Company Name", kind: "text" },
      { col: "proposed_name", label: "Proposed Name", kind: "text" },
      { col: "isFirst_name", label: "Applicant", kind: "text" },
      { col: "isLast_name", label: "Applicant", kind: "text" },
      { col: "email", label: "Email", kind: "email" },
      { col: "asic_mobile", label: "Phone", kind: "phone" },
      { col: "name_ABN", label: "ABN", kind: "number" },
    ],
    title: (r) => r.companyName || r.proposed_name || joinName(r.isFirst_name, r.isLast_name) || "Company Registration",
    subtitle: () => "Legacy Company Registration",
  },
  {
    key: "legacy-individual",
    name: "Individual Engagement (Legacy)",
    model: "IndividualEngagement",
    route: "/admin/individual-engagement",
    color: "#059669",
    permission: "individual.engagement.view",
    refPrefix: "ENG",
    fields: [
      { col: "FirstName", label: "Name", kind: "text" },
      { col: "LastName", label: "Name", kind: "text" },
      { col: "ClientName", label: "Client", kind: "text" },
      { col: "email", label: "Email", kind: "email" },
      { col: "PhoneNumber", label: "Phone", kind: "phone" },
      { col: "ABN", label: "ABN", kind: "number" },
      { col: "NameOfAccount", label: "Account Name", kind: "text" },
      { col: "SpouseFname", label: "Spouse", kind: "text" },
      { col: "SpouseLname", label: "Spouse", kind: "text" },
    ],
    title: (r) => joinName(r.FirstName, r.LastName) || r.ClientName || "Individual Engagement",
    subtitle: () => "Legacy Individual Engagement",
  },
  {
    key: "entity-engagements",
    name: "Entity Engagement",
    model: "EntityEngagement",
    route: "/admin/entity-engagements",
    color: "#3b82f6",
    permission: "individual.engagement.view",
    refPrefix: "ENT",
    fields: [
      { col: "LegalName", label: "Legal Name", kind: "text" },
      { col: "TradingName", label: "Trading Name", kind: "text" },
      { col: "ABN", label: "ABN", kind: "number" },
      { col: "email", label: "Email", kind: "email" },
      { col: "PhoneNumber", label: "Phone", kind: "phone" },
      { col: "NameOfAccount", label: "Account Name", kind: "text" },
    ],
    extraAttributes: ["TypeOfEntity"],
    title: (r) => r.LegalName || r.TradingName || "Entity Engagement",
    subtitle: (r) => r.TypeOfEntity || "Entity Engagement",
  },
  {
    key: "changes-company",
    name: "Changes to Company Details",
    model: "ChangesToCompanyDetails",
    route: "/admin/changes-to-company-details",
    color: "#14b8a6",
    permission: "company.registration.view",
    refPrefix: "CHG",
    fields: [
      { col: "NameOfCompany", label: "Company Name", kind: "text" },
      { col: "ACNorABN", label: "ACN / ABN", kind: "number" },
      { col: "fname", label: "Name", kind: "text" },
      { col: "lname", label: "Name", kind: "text" },
      { col: "fname1", label: "Officeholder", kind: "text" },
      { col: "lname1", label: "Officeholder", kind: "text" },
      { col: "YourName", label: "Submitted By", kind: "text" },
      { col: "email", label: "Email", kind: "email" },
      { col: "email1", label: "Officeholder Email", kind: "email" },
    ],
    title: (r) => r.NameOfCompany || joinName(r.fname, r.lname) || "Company Change Request",
    subtitle: () => "ASIC Company Change",
  },
  {
    key: "gst",
    name: "GST Registration",
    model: "GstRegistration",
    route: "/admin/gst-registrations",
    color: "#f59e0b",
    permission: "gst.registration.view",
    refPrefix: "GST",
    fields: [
      { col: "firstName", label: "Name", kind: "text" },
      { col: "lastName", label: "Name", kind: "text" },
      { col: "abn", label: "ABN", kind: "number" },
      { col: "email", label: "Email", kind: "email" },
      { col: "phone", label: "Phone", kind: "phone" },
    ],
    extraAttributes: ["businessStructure"],
    title: (r) => joinName(r.firstName, r.lastName) || "GST Applicant",
    subtitle: (r) => r.businessStructure || "GST Registration",
  },
  {
    key: "medicare",
    name: "Medicare Exemption",
    model: "Medicare",
    route: "/admin/medicare",
    color: "#ef4444",
    permission: "gst.registration.view",
    refPrefix: "MED",
    fields: [
      { col: "firstName", label: "Name", kind: "text" },
      { col: "familyName", label: "Name", kind: "text" },
      { col: "FullName", label: "Name", kind: "text" },
      { col: "email", label: "Email", kind: "email" },
      { col: "phone", label: "Phone", kind: "phone" },
      { col: "nameOfCompany", label: "Company", kind: "text" },
    ],
    title: (r) => joinName(r.firstName, r.familyName) || r.FullName || "Medicare Applicant",
    subtitle: (r) => r.nameOfCompany || "Medicare Levy Exemption",
  },
  {
    key: "trust",
    name: "Trust Establishment",
    model: "TrustRegistration",
    route: "/admin/trust-registrations",
    color: "#06b6d4",
    permission: "gst.registration.view",
    refPrefix: "TRU",
    fields: [
      { col: "TrustName", label: "Trust Name", kind: "text" },
      { col: "fname", label: "Trustee", kind: "text" },
      { col: "lname", label: "Trustee", kind: "text" },
      { col: "fname1", label: "Appointor", kind: "text" },
      { col: "lname1", label: "Appointor", kind: "text" },
    ],
    extraAttributes: ["TypeOfTrust"],
    title: (r) => r.TrustName || joinName(r.fname, r.lname) || "Trust Registration",
    subtitle: (r) => r.TypeOfTrust || "Trust Establishment",
  },
  {
    key: "smsf",
    name: "SMSF Registration",
    model: "SmsfRegistration",
    route: "/admin/smsf-registrations",
    color: "#8b5cf6",
    permission: "gst.registration.view",
    refPrefix: "SMSF",
    fields: [
      { col: "NameOfSMSF", label: "Fund Name", kind: "text" },
      { col: "NameOfIndividual", label: "Member", kind: "text" },
      { col: "CompanyName", label: "Trustee Company", kind: "text" },
      { col: "ACN", label: "ACN", kind: "number" },
      { col: "Companyabn", label: "ABN", kind: "number" },
      { col: "NameClient", label: "Client", kind: "text" },
      { col: "mobileNumber", label: "Phone", kind: "phone" },
    ],
    title: (r) => r.NameOfSMSF || r.NameClient || r.NameOfIndividual || "SMSF Registration",
    subtitle: (r) => r.CompanyName || "Self-Managed Super Fund",
  },
  {
    key: "business-names",
    name: "Business Name Registration",
    model: "BusinessNameRegistration",
    route: "/admin/business-name-registrations",
    color: "#ec4899",
    permission: "gst.registration.view",
    refPrefix: "BN",
    fields: [
      { col: "businessProposeName", label: "Business Name", kind: "text" },
      { col: "Name", label: "Applicant", kind: "text" },
      { col: "ABN", label: "ABN", kind: "number" },
      { col: "email", label: "Email", kind: "email" },
      { col: "PhoneNumber", label: "Phone", kind: "phone" },
      { col: "phone", label: "Phone", kind: "phone" },
    ],
    title: (r) => r.businessProposeName || r.Name || "Business Name Registration",
    subtitle: (r) => (r.Name ? `Applicant: ${r.Name}` : "Business Name Registration"),
  },
  {
    key: "apply-tfn",
    name: "Apply TFN / ABN",
    model: "ApplyTfnAbns",
    route: "/admin/apply-tfn-abns",
    color: "#6366f1",
    permission: "gst.registration.view",
    refPrefix: "TFN",
    fields: [
      { col: "firstName", label: "Name", kind: "text" },
      { col: "lastName", label: "Name", kind: "text" },
      { col: "email", label: "Email", kind: "email" },
      { col: "phoneNumber", label: "Phone", kind: "phone" },
      { col: "firstName_Sole", label: "Sole Trader", kind: "text" },
      { col: "lastName_Sole", label: "Sole Trader", kind: "text" },
      { col: "email_Sole", label: "Email", kind: "email" },
      { col: "phoneNumber_Sole", label: "Phone", kind: "phone" },
      { col: "firstName_CompanyABN", label: "Company Contact", kind: "text" },
      { col: "lastName_CompanyABN", label: "Company Contact", kind: "text" },
      { col: "email_CompanyABN", label: "Email", kind: "email" },
      { col: "phoneNumber_CompanyABN", label: "Phone", kind: "phone" },
      { col: "TrustName_TrustABN", label: "Trust Name", kind: "text" },
      { col: "firstName_TrustABN", label: "Trust Contact", kind: "text" },
      { col: "lastName_TrustABN", label: "Trust Contact", kind: "text" },
      { col: "email_TrustABN", label: "Email", kind: "email" },
      { col: "phoneNumber_TrustABN", label: "Phone", kind: "phone" },
      { col: "firstName_PartnershipABN", label: "Partner", kind: "text" },
      { col: "lastName_PartnershipABN", label: "Partner", kind: "text" },
      { col: "email_PartnershipABN", label: "Email", kind: "email" },
      { col: "phoneNumber_PartnershipABN", label: "Phone", kind: "phone" },
    ],
    title: (r) =>
      joinName(r.firstName, r.lastName) ||
      joinName(r.firstName_Sole, r.lastName_Sole) ||
      r.TrustName_TrustABN ||
      joinName(r.firstName_CompanyABN, r.lastName_CompanyABN) ||
      joinName(r.firstName_PartnershipABN, r.lastName_PartnershipABN) ||
      "TFN / ABN Applicant",
    subtitle: () => "TFN / ABN Application",
  },
];

// ============================
// Query Interpretation
// ============================

const LEGACY_PREFIXES = SEARCH_REGISTRY.filter((m) => m.refPrefix).map((m) => m.refPrefix);
const LEGACY_REF_REGEX = new RegExp(`^(${LEGACY_PREFIXES.join("|")})[\\s-]?0*(\\d{1,9})$`, "i");

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const MIN_DIGITS_FOR_NUMERIC = 4;
const FETCH_POOL_PER_MODULE = 25;
// IDs returned for "View all" (module page filters its table to exactly these)
const MAX_MATCH_IDS = 200;

/** Escape LIKE wildcards so user input is matched literally. */
const escapeLike = (value) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

/** Strip everything but digits. */
const digitsOf = (value) => String(value ?? "").replace(/\D/g, "");

/**
 * Parse the raw query into the search strategies that apply to it.
 */
const interpretQuery = (raw) => {
  const query = String(raw || "").trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
  const lower = query.toLowerCase();

  const legacyMatch = query.match(LEGACY_REF_REGEX);
  const legacyRef = legacyMatch
    ? { prefix: legacyMatch[1].toUpperCase(), id: parseInt(legacyMatch[2], 10) }
    : null;

  const isEmail = query.includes("@");

  // Numeric-looking query: phone / ABN / ACN typed with spaces, dashes, brackets or "+"
  const looksNumeric = /^[\d\s+\-()]+$/.test(query);
  const digits = digitsOf(query);
  const digitVariants = [];
  if (looksNumeric && digits.length >= MIN_DIGITS_FOR_NUMERIC) {
    digitVariants.push(digits);
    // +61 4xx xxx xxx  →  04xx xxx xxx
    if (digits.startsWith("61") && digits.length >= 11) digitVariants.push(`0${digits.slice(2)}`);
    // 04xx xxx xxx     →  614xx xxx xxx
    if (digits.startsWith("0") && digits.length >= 9) digitVariants.push(`61${digits.slice(1)}`);
  }

  // Numeric queries match as one phrase (plus the digit-normalised variants);
  // splitting "0412 345 678" into words would match unrelated records.
  const words = looksNumeric ? [lower] : lower.split(" ").filter(Boolean);

  return { query, lower, words, legacyRef, isEmail, looksNumeric, digitVariants };
};

// ============================
// SQL Condition Builders
// ============================

/** REPLACE(REPLACE(...(`col`, ' ', ''), '-', '')...) — digits-only view of a column. */
const strippedColumn = (column) =>
  [" ", "-", "(", ")", "+", "."].reduce((expr, ch) => fn("REPLACE", expr, ch, ""), col(column));

/**
 * Build the OR-conditions that match `fields` against the interpreted query.
 * Returns null when no field can match.
 */
const buildFieldConditions = (fields, q) => {
  const conditions = [];

  if (q.isEmail) {
    const emailFields = fields.filter((f) => f.kind === "email");
    emailFields.forEach((f) => {
      conditions.push({ [f.col]: { [Op.like]: `%${escapeLike(q.lower)}%` } });
    });
    return conditions.length ? conditions : null;
  }

  // Every word must appear in at least one field (multi-word name search)
  if (q.words.length > 0) {
    const perWord = q.words.map((word) => ({
      [Op.or]: fields.map((f) => ({ [f.col]: { [Op.like]: `%${escapeLike(word)}%` } })),
    }));
    conditions.push(perWord.length === 1 ? perWord[0] : { [Op.and]: perWord });
  }

  // Digit-normalised phone / ABN / ACN match
  if (q.digitVariants.length) {
    fields
      .filter((f) => f.kind === "phone" || f.kind === "number")
      .forEach((f) => {
        q.digitVariants.forEach((variant) => {
          conditions.push(sqlWhere(strippedColumn(f.col), { [Op.like]: `%${variant}%` }));
        });
      });
  }

  return conditions.length ? conditions : null;
};

// ============================
// Match Scoring (which field matched & how well)
// ============================

const SCORE = {
  REFERENCE_EXACT: 1000,
  REFERENCE_PARTIAL: 500,
  EXACT: 300,
  DIGITS_EXACT: 280,
  STARTS_WITH: 200,
  WORD_STARTS_WITH: 150,
  DIGITS_CONTAINS: 120,
  CONTAINS: 100,
  ALL_WORDS: 60,
};

/** Score a single value against the query; returns 0 if no match. */
const scoreValue = (value, field, q) => {
  if (value === null || value === undefined || value === "") return 0;
  const str = String(value);
  const lower = str.toLowerCase();

  if (lower === q.lower) return SCORE.EXACT;
  if (lower.startsWith(q.lower)) return SCORE.STARTS_WITH;
  if (lower.split(/[\s@._-]+/).some((part) => part && part.startsWith(q.lower))) return SCORE.WORD_STARTS_WITH;
  if (lower.includes(q.lower)) return SCORE.CONTAINS;

  if (q.digitVariants.length && (field.kind === "phone" || field.kind === "number")) {
    const valueDigits = digitsOf(str);
    if (q.digitVariants.some((v) => v === valueDigits)) return SCORE.DIGITS_EXACT;
    if (q.digitVariants.some((v) => valueDigits.includes(v))) return SCORE.DIGITS_CONTAINS;
  }

  if (!q.isEmail && q.words.length > 1 && q.words.some((w) => lower.includes(w))) return SCORE.ALL_WORDS;
  return 0;
};

/** Find the best-matching field in a row. */
const bestFieldMatch = (row, fields, q, labelPrefix = "") => {
  let best = null;
  fields.forEach((f) => {
    const score = scoreValue(row?.[f.col], f, q);
    if (score > 0 && (!best || score > best.score)) {
      best = {
        score,
        field: f.col,
        label: labelPrefix && f.label !== labelPrefix ? `${labelPrefix} ${f.label}`.trim() : f.label,
        value: String(row[f.col]),
      };
    }
  });
  return best;
};

// ============================
// Module Search
// ============================

const uniq = (arr) => [...new Set(arr.filter(Boolean))];

/**
 * Search one module. Returns { group } or null when nothing matched.
 */
const searchModule = async (mod, q, perModule) => {
  const Model = models[mod.model];
  if (!Model) return null;

  const orConditions = [];

  // 1. Reference conditions
  let referenceId = null;
  if (mod.refPrefix && q.legacyRef && q.legacyRef.prefix === mod.refPrefix) {
    referenceId = q.legacyRef.id;
    orConditions.push({ id: referenceId });
  }
  if (mod.refField && !q.isEmail) {
    orConditions.push({ [mod.refField]: { [Op.like]: `%${escapeLike(q.query)}%` } });
  }

  // A legacy reference for a *different* module should not trigger fuzzy matches
  // here (e.g. "GST-12" must not match phone numbers containing "12").
  const skipFuzzy = Boolean(q.legacyRef);

  // 2. Own-column conditions
  if (!skipFuzzy) {
    const own = buildFieldConditions(mod.fields, q);
    if (own) orConditions.push(...own);
  }

  // 3. Related-table conditions (flagship modules)
  let relatedRows = [];
  let clientRows = [];
  if (!skipFuzzy && mod.related) {
    const RelatedModel = models[mod.related.model];
    const relConds = RelatedModel && buildFieldConditions(mod.related.fields, q);
    if (relConds) {
      relatedRows = await RelatedModel.findAll({
        where: { [Op.or]: relConds },
        attributes: [mod.related.foreignKey, ...uniq(mod.related.fields.map((f) => f.col))],
        limit: 200,
        raw: true,
      });
      const ids = uniq(relatedRows.map((r) => r[mod.related.foreignKey]));
      if (ids.length) orConditions.push({ id: { [Op.in]: ids } });
    }
  }
  if (!skipFuzzy && mod.client) {
    const ClientModel = models[mod.client.model];
    const clientConds = ClientModel && buildFieldConditions(mod.client.fields, q);
    if (clientConds) {
      clientRows = await ClientModel.findAll({
        where: { [Op.or]: clientConds },
        attributes: ["id"],
        limit: 200,
        raw: true,
      });
      const ids = uniq(clientRows.map((c) => c.id));
      if (ids.length) orConditions.push({ [mod.client.localKey]: { [Op.in]: ids } });
    }
  }

  if (!orConditions.length) return null;

  const whereClause = { [Op.or]: orConditions };
  const attributes = uniq([
    "id",
    "status",
    "createdAt",
    mod.refField,
    ...mod.fields.map((f) => f.col),
    ...(mod.extraAttributes || []),
  ]);

  const [rows, total] = await Promise.all([
    Model.findAll({
      where: whereClause,
      attributes,
      order: [["createdAt", "DESC"]],
      limit: FETCH_POOL_PER_MODULE,
      raw: true,
    }),
    Model.count({ where: whereClause }),
  ]);

  if (!rows.length) return null;

  // Every matching ID (capped) so "View all" can show exactly what search found
  let matchIds = null;
  if (total > perModule) {
    const idRows = await Model.findAll({
      where: whereClause,
      attributes: ["id"],
      order: [["createdAt", "DESC"]],
      limit: MAX_MATCH_IDS,
      raw: true,
    });
    matchIds = idRows.map((r) => r.id);
  }

  // Hydrate related data for display + match explanation
  const relatedByParent = {};
  if (mod.related && rows.length) {
    const RelatedModel = models[mod.related.model];
    const allRelated = await RelatedModel.findAll({
      where: { [mod.related.foreignKey]: { [Op.in]: rows.map((r) => r.id) } },
      attributes: [mod.related.foreignKey, ...uniq(mod.related.fields.map((f) => f.col))],
      raw: true,
    });
    allRelated.forEach((r) => {
      const key = r[mod.related.foreignKey];
      (relatedByParent[key] = relatedByParent[key] || []).push(r);
    });
  }
  const clientById = {};
  if (mod.client && rows.length) {
    const ClientModel = models[mod.client.model];
    const clients = await ClientModel.findAll({
      where: { id: { [Op.in]: uniq(rows.map((r) => r[mod.client.localKey])) } },
      attributes: ["id", ...uniq(mod.client.fields.map((f) => f.col))],
      raw: true,
    });
    clients.forEach((c) => {
      clientById[c.id] = c;
    });
  }

  // Score + format
  const results = rows.map((row) => {
    if (mod.client) row.__client = clientById[row[mod.client.localKey]] || null;

    const reference = mod.refField
      ? row[mod.refField] || `${mod.refFallbackPrefix}-${row.id}`
      : `${mod.refPrefix}-${row.id}`;

    let match = null;
    if (referenceId !== null && row.id === referenceId) {
      match = { score: SCORE.REFERENCE_EXACT, field: "reference", label: "Reference", value: reference };
    } else if (mod.refField && row[mod.refField]) {
      const refLower = String(row[mod.refField]).toLowerCase();
      if (refLower === q.lower) {
        match = { score: SCORE.REFERENCE_EXACT, field: "reference", label: "Reference", value: reference };
      } else if (refLower.includes(q.lower)) {
        match = { score: SCORE.REFERENCE_PARTIAL, field: "reference", label: "Reference", value: reference };
      }
    }

    const title = mod.title(row);
    const candidates = [match, bestFieldMatch(row, mod.fields, q)];
    // Multi-word names ("john smith") are often split across first/last columns —
    // explain the match using the composed display name when it contains every word.
    if (q.words.length > 1 && q.words.every((w) => title.toLowerCase().includes(w))) {
      candidates.push({ score: SCORE.CONTAINS + 1, field: "name", label: "Name", value: title });
    }
    if (mod.client && row.__client) candidates.push(bestFieldMatch(row.__client, mod.client.fields, q));
    if (mod.related) {
      (relatedByParent[row.id] || []).forEach((rel) => {
        candidates.push(bestFieldMatch(rel, mod.related.fields, q, mod.related.labelPrefix));
      });
    }
    const best = candidates.filter(Boolean).sort((a, b) => b.score - a.score)[0] || {
      score: 1,
      field: null,
      label: null,
      value: null,
    };

    return {
      id: row.id,
      reference,
      title,
      subtitle: mod.subtitle(row),
      status: row.status || null,
      createdAt: row.createdAt,
      matchedField: best.field,
      matchedLabel: best.label,
      matchedValue: best.value,
      score: best.score,
      url: `${mod.route}?open=${row.id}`,
    };
  });

  results.sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt));

  return {
    moduleKey: mod.key,
    moduleName: mod.name,
    color: mod.color,
    route: mod.route,
    count: total,
    matchIds,
    topScore: results[0].score,
    results: results.slice(0, perModule),
  };
};

/**
 * Run the global search across every module the user may view.
 *
 * @param {string} rawQuery
 * @param {object} options { perModule, permissions, isSuperAdmin }
 */
const globalSearch = async (rawQuery, { perModule = 5, permissions = [], isSuperAdmin = false } = {}) => {
  const q = interpretQuery(rawQuery);

  if (q.query.length < MIN_QUERY_LENGTH) {
    return { query: q.query, total: 0, groups: [] };
  }

  const visibleModules = SEARCH_REGISTRY.filter(
    (m) => isSuperAdmin || !m.permission || permissions.includes(m.permission)
  );

  // A legacy reference only needs its own module
  const targetModules = q.legacyRef
    ? visibleModules.filter((m) => m.refPrefix === q.legacyRef.prefix)
    : visibleModules;

  const settled = await Promise.allSettled(targetModules.map((m) => searchModule(m, q, perModule)));

  const groups = [];
  settled.forEach((outcome, idx) => {
    if (outcome.status === "fulfilled" && outcome.value) {
      groups.push(outcome.value);
    } else if (outcome.status === "rejected") {
      console.error(`[GlobalSearch] Module "${targetModules[idx].key}" failed:`, outcome.reason?.message);
    }
  });

  // Best-matching modules first, then by result volume
  groups.sort((a, b) => b.topScore - a.topScore || b.count - a.count);

  const total = groups.reduce((sum, g) => sum + g.count, 0);
  return {
    query: q.query,
    total,
    groups: groups.map(({ topScore, ...g }) => ({
      ...g,
      results: g.results.map(({ score, ...r }) => r),
    })),
  };
};

module.exports = {
  globalSearch,
  interpretQuery,
  SEARCH_REGISTRY,
  MIN_QUERY_LENGTH,
  MAX_QUERY_LENGTH,
};
