// routes/articles.js
const express = require("express");
const router = express.Router();
const Article = require("../models/Article");

// Create draft (expects JSON names: slug?, title, author, cover, body, date?, category?, tags?, excerpt?)
router.post("/", async (req, res) => {
  try {
    const {
      slug, title, author, cover, body,
      date, category, tags, excerpt
    } = req.body;

    if (!title || !author || !cover || !body) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const doc = await Article.create({
      slug: slug || Article.slugify(title),
      title, author, cover, body,
      date: date ? new Date(date) : undefined,
      category: category || "",
      tags: Array.isArray(tags) ? tags : [],
      excerpt: excerpt || ""
    });

    res.json({ success: true, article: doc });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update draft
router.patch("/:id", async (req, res) => {
  try {
    const u = { ...req.body };
    if (u.date) u.date = new Date(u.date);
    const updated = await Article.findByIdAndUpdate(req.params.id, u, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, article: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Submit for review
router.post("/:id/submit", async (req, res) => {
  try {
    const art = await Article.findById(req.params.id);
    if (!art) return res.status(404).json({ success: false, message: "Not found" });
    art.status = "submitted";
    await art.save();
    res.json({ success: true, message: "Submitted for review", article: art });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Public: published feed
router.get("/published", async (req, res) => {
    try {
      const { q, category } = req.query;
  
      const filter = { published: true, status: "approved" }; // add status gate
      if (category && category !== "All") filter.category = category;
      if (q) {
        const rx = new RegExp(q.trim(), "i");
        filter.$or = [
          { title: rx },
          { author: rx },
          { category: rx },
          { tags: rx },
        ];
      }
  
      const qDocs = await Article.find(filter)
        .sort({ date: -1, publishedAt: -1, createdAt: -1 })
        .select("slug title author date category tags cover body") // only what UI needs
        .lean();
  
      res.json({ success: true, articles: qDocs });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  router.get("/published/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const doc = await Article.findOne({
        slug,
        published: true,
        status: "approved",
      }).lean();
      if (!doc) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      return res.json({ success: true, article: doc });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
module.exports = router;
