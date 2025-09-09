const AWS = require('aws-sdk');
require('dotenv').config();

// Configure R2 (S3-compatible)
const s3 = new AWS.S3({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: `https://pub-ca69aad99cee4c8ba79b57a1915d9c4a.r2.dev/`,
  region: 'auto', // R2 always uses 'auto'
  signatureVersion: 'v4'
});

// Bucket configuration
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Generate a unique filename
const generateFileName = (originalName) => {
  const ext = originalName.split('.').pop();
  const base = originalName.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
  return `${Date.now()}_${base}.${ext}`;
};

// Upload file to R2
const uploadToS3 = (file, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const fileName = generateFileName(file.originalname);
    const key = `${folder}/${fileName}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // Construct public URL
        const url = `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
        resolve({
          url,
          key,
          fileName
        });
      }
    });
  });
};

// Delete file from R2
const deleteFromS3 = (key) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports = {
  s3,
  uploadToS3,
  deleteFromS3,
  BUCKET_NAME
};
