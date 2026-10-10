/**
 * Blog Admin Routes
 * =================
 * Base path: /api/blog-admin — login required.
 * Reading needs `blog.view`; every change needs `blog.manage`.
 *
 * Posts
 *   GET    /posts?status=&search=&categoryId=   list + tab counts
 *   GET    /posts/:id                            one post (editor)
 *   POST   /posts                                create
 *   PUT    /posts/:id                            update
 *   PUT    /posts/:id/featured                   { featured } (only one featured post)
 *   POST   /posts/:id/trash                      move to Trash
 *   POST   /posts/:id/restore                    restore from Trash
 *   DELETE /posts/:id                            delete permanently (Trash only)
 * Categories / Tags
 *   GET | POST /categories, PUT | DELETE /categories/:id
 *   GET | POST /tags,       PUT | DELETE /tags/:id
 * Media / Authors
 *   POST /media   (multipart "file")   GET /authors
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const upload = require("../middleware/upload");
const c = require("../controllers/blogAdmin.controller");

router.use(authenticate);

const canView = authorize("blog.view");
const canManage = authorize("blog.manage");

// Posts
router.get("/posts", canView, c.listPosts);
router.get("/posts/:id", canView, c.getPost);
router.post("/posts", canManage, c.createPost);
router.put("/posts/:id", canManage, c.updatePost);
router.put("/posts/:id/featured", canManage, c.setFeatured);
router.post("/posts/:id/trash", canManage, c.trashPost);
router.post("/posts/:id/restore", canManage, c.restorePost);
router.delete("/posts/:id", canManage, c.deletePost);

// Categories
router.get("/categories", canView, c.listCategories);
router.post("/categories", canManage, c.createCategory);
router.put("/categories/:id", canManage, c.updateCategory);
router.delete("/categories/:id", canManage, c.deleteCategory);

// Tags
router.get("/tags", canView, c.listTags);
router.post("/tags", canManage, c.createTag);
router.put("/tags/:id", canManage, c.updateTag);
router.delete("/tags/:id", canManage, c.deleteTag);

// Media (multer errors -> 400 with a readable message)
router.post(
  "/media",
  canManage,
  (req, res, next) =>
    upload.blogImage.single("file")(req, res, (err) =>
      err ? res.status(400).json({ success: false, message: err.code === "LIMIT_FILE_SIZE" ? "Image must be 8MB or smaller." : err.message }) : next()
    ),
  c.uploadImage
);

// Authors
router.get("/authors", canView, c.listAuthors);

module.exports = router;
