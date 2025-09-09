// routes/uploads.js
const express = require("express");
const multer = require("multer");
const { uploadToS3 } = require("../config/s3");

const router = express.Router();

// Configure multer to store files in memory for S3 upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Images only"));
    cb(null, true);
  },
});

router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Upload to S3
    const result = await uploadToS3(req.file, 'uploads');
    
    res.json({ 
      success: true, 
      url: result.url,
      key: result.key,
      fileName: result.fileName
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Upload failed", 
      error: error.message 
    });
  }
});

module.exports = router;
