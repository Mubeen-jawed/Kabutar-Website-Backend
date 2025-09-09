const fs = require('fs');
const path = require('path');
const { uploadToS3 } = require('../config/s3');
const Article = require('../models/Article');
require('dotenv').config();

// Connect to MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { dbName: "kabutar" })
  .then(() => console.log("MongoDB connected"))
  .catch(e => console.error(e));

async function migrateImagesToS3() {
  try {
    console.log('Starting migration of images to S3...');
    
    // Get all articles
    const articles = await Article.find({});
    console.log(`Found ${articles.length} articles to process`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const article of articles) {
      try {
        let needsUpdate = false;
        const updates = {};
        
        // Check cover image
        if (article.cover && article.cover.startsWith('/uploads/')) {
          const localPath = path.join(__dirname, '..', 'uploads', path.basename(article.cover));
          
          if (fs.existsSync(localPath)) {
            console.log(`Migrating cover image: ${article.cover}`);
            
            // Read the file
            const fileBuffer = fs.readFileSync(localPath);
            const fileName = path.basename(article.cover);
            const file = {
              buffer: fileBuffer,
              originalname: fileName,
              mimetype: 'image/jpeg' // You might want to detect this properly
            };
            
            // Upload to S3
            const result = await uploadToS3(file, 'uploads');
            updates.cover = result.url;
            needsUpdate = true;
            
            console.log(`Cover migrated: ${result.url}`);
          } else {
            console.log(`Cover file not found: ${localPath}`);
          }
        }
        
        // Check body content for inline images
        if (article.body && article.body.includes('/uploads/')) {
          let updatedBody = article.body;
          const imageMatches = article.body.match(/\/uploads\/[^"'\s>]+/g);
          
          if (imageMatches) {
            for (const imagePath of imageMatches) {
              const localPath = path.join(__dirname, '..', 'uploads', path.basename(imagePath));
              
              if (fs.existsSync(localPath)) {
                console.log(`Migrating inline image: ${imagePath}`);
                
                // Read the file
                const fileBuffer = fs.readFileSync(localPath);
                const fileName = path.basename(imagePath);
                const file = {
                  buffer: fileBuffer,
                  originalname: fileName,
                  mimetype: 'image/jpeg' // You might want to detect this properly
                };
                
                // Upload to S3
                const result = await uploadToS3(file, 'uploads');
                
                // Replace the URL in the body
                updatedBody = updatedBody.replace(imagePath, result.url);
                needsUpdate = true;
                
                console.log(`Inline image migrated: ${result.url}`);
              } else {
                console.log(`Inline image file not found: ${localPath}`);
              }
            }
            
            if (needsUpdate) {
              updates.body = updatedBody;
            }
          }
        }
        
        // Update the article if needed
        if (needsUpdate) {
          await Article.findByIdAndUpdate(article._id, updates);
          migratedCount++;
          console.log(`Article ${article._id} updated successfully`);
        }
        
      } catch (error) {
        console.error(`Error processing article ${article._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\nMigration completed!`);
    console.log(`Articles migrated: ${migratedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
migrateImagesToS3();
