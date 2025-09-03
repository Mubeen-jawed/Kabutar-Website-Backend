// scripts/importArticleJSON.js
/**
 * Usage:
 *   node scripts/importArticleJSON.js ../Kabutar-Website/articles.json
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Article = require("../models/Article"); // uses your schema posted above

function toISODate(d) {
  if (!d) return undefined;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? undefined : dt;
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    // split any accidental "a, b, c" single string into tokens
    if (tags.length === 1 && typeof tags[0] === "string" && tags[0].includes(",")) {
      return tags[0].split(",").map(s => s.trim()).filter(Boolean);
    }
    return tags.map(t => String(t).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

(async () => {
  try {
    const file = process.argv[2];
    if (!file) throw new Error("Pass path to JSON file");
    const json = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));

    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || "kabutar" });

    const items = Array.isArray(json) ? json : [json];
    for (const item of items) {
      // Validate required fields for your schema
      const required = ["slug", "title", "author", "cover", "body"];
      const missing = required.filter(k => !item[k] || String(item[k]).trim() === "");
      if (missing.length) {
        console.log(`Skipping (missing fields: ${missing.join(", ")}) — ${item.title || item.slug}`);
        continue;
      }

      const doc = {
        slug: String(item.slug).trim(),
        title: String(item.title).trim(),
        author: String(item.author).trim(),
        cover: String(item.cover).trim(),
        body: String(item.body), // you put "data" here for now

        // optional / normalized
        date: toISODate(item.date) || undefined,
        category: item.category || "",
        tags: normalizeTags(item.tags),

        // admin/moderation
        status: item.status || "approved",
        published: typeof item.published === "boolean" ? item.published : true,
        publishedAt: toISODate(item.publishedAt) || toISODate(item.date) || new Date(),

        // meta (createdAt/updatedAt handled by schema defaults)
      };

      await Article.findOneAndUpdate({ slug: doc.slug }, doc, { upsert: true, new: true });
      console.log("Imported/Updated:", doc.slug);
    }

    await mongoose.disconnect();
    console.log("Import complete.");
  } catch (err) {
    console.error("Import failed:", err);
    process.exit(1);
  }
})();
