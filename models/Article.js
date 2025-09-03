// models/Article.js
const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  // Public / content fields (matching your JSON)
  slug:      { type: String, required: true, unique: true }, // maps JSON "id"
  title:     { type: String, required: true },
  author:    { type: String, required: true },
  date:      { type: Date,   default: Date.now },            // JSON "date"
  category:  { type: String, default: "" },                  // e.g., "Science"
  tags:      { type: [String], default: [] },                // ["cosmology", ...]
  cover:     { type: String, required: true },               // cover image URL
  body:      { type: String, required: true },               // HTML content

  // Admin / moderation fields (kept from your current model)
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "draft" },
  feedback:    { type: String },
  published:   { type: Boolean, default: false },
  publishedAt: { type: Date },
  reviewer:    { type: String },

  // Meta
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

// Keep updatedAt fresh
ArticleSchema.pre("save", function(next){
  this.updatedAt = new Date();
  next();
});

// Helper: generate a slug if missing
ArticleSchema.statics.slugify = function (s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

ArticleSchema.pre("validate", function(next) {
  if (!this.slug && this.title) {
    this.slug = this.constructor.slugify(this.title);
  }
  next();
});

// Useful indexes
ArticleSchema.index({ slug: 1 }, { unique: true });
ArticleSchema.index({ published: 1, date: -1 });
ArticleSchema.index({ category: 1, date: -1 });
ArticleSchema.index({ tags: 1 });

module.exports = mongoose.model("Article", ArticleSchema);
