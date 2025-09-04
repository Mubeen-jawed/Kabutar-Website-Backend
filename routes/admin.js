const express = require("express");
const jwt = require("jsonwebtoken");
const requireAdmin = require("../middleware/requireAdmin");
const Article = require("../models/Article");
const router = express.Router();

/** LOGIN
 * POST /api/admin/login { username, password }
 * Compares to env ADMIN_USER / ADMIN_PASS (hashing skipped for simplicity)
 */
router.post("/login", (req, res) => {
    const { username, password } = req.body || {};
    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASS
    ) {
      const token = jwt.sign(
        { username },
        process.env.ADMIN_JWT_SECRET || "devsecret",
        { expiresIn: "2d" }
      );
      res.cookie("admintoken", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: true, // set true in production with HTTPS
        sameSite: "none",        // allow cross-sitesecure: true,            // required with 
        partitioned: true,
        maxAge: 1000 * 60 * 60 * 24 * 2,
        path: "/", // make it visible to all paths
      });
      return res.json({ success: true, username });
    }
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  });

router.post("/logout", requireAdmin, (req, res) => {
    res.clearCookie("admintoken", {
        path: "/",
        sameSite: "none",
        secure: true,
        partitioned: true,
      });
      res.json({ success: true });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

/** LISTS
 * GET /api/admin/articles?tab=published|for-approval
 */
router.get("/articles", requireAdmin, async (req, res) => {
  try {
    const { tab } = req.query;
    let filter = {};
    if (tab === "published") filter = { published: true };
    else if (tab === "for-approval") filter = { status: "submitted", published: false };
    const list = await Article.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, articles: list });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET single article */
router.get("/articles/:id", requireAdmin, async (req, res) => {
  const art = await Article.findById(req.params.id);
  if (!art) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, article: art });
});

/** APPROVE */
router.post("/articles/:id/approve", requireAdmin, async (req, res) => {
    try {
      const art = await Article.findById(req.params.id);
      if (!art) return res.status(404).json({ success: false, message: "Not found" });
      art.status = "approved";
      art.published = true;
      art.publishedAt = new Date();
      art.reviewer = req.admin?.username;
      // If missing date, set it on publish
      if (!art.date) art.date = new Date();
      await art.save();
      res.json({ success: true, article: art });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });   /** REJECT (with feedback) */
router.post("/articles/:id/reject", requireAdmin, async (req, res) => {
  try {
    const art = await Article.findById(req.params.id);
    if (!art) return res.status(404).json({ success: false, message: "Not found" });
    art.status = "rejected";
    art.published = false;
    art.publishedAt = undefined;
    art.reviewer = req.admin?.username;
    art.feedback = req.body?.feedback || "";
    await art.save();
    res.json({ success: true, article: art });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
