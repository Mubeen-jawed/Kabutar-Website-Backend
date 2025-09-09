const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// S3 bucket configuration
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const BUCKET_REGION = process.env.AWS_REGION || 'us-east-1';

// Generate a unique filename
const generateFileName = (originalName) => {
  const ext = originalName.split('.').pop();
  const base = originalName.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
  return `${Date.now()}_${base}.${ext}`;
};

// Upload file to S3
const uploadToS3 = (file, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const fileName = generateFileName(file.originalname);
    const key = `${folder}/${fileName}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' // Make the file publicly accessible
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          url: data.Location,
          key: key,
          fileName: fileName
        });
      }
    });
  });
};

// Delete file from S3
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
  BUCKET_NAME,
  BUCKET_REGION
};
