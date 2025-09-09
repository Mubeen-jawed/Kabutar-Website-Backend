# S3 Setup Instructions

## Environment Variables Required

Add these environment variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket_name
```

## AWS S3 Setup Steps

1. **Create an S3 Bucket:**
   - Go to AWS S3 Console
   - Create a new bucket with a unique name
   - Choose a region (e.g., us-east-1)
   - Enable public read access for uploaded images

2. **Create IAM User:**
   - Go to AWS IAM Console
   - Create a new user with programmatic access
   - Attach a policy with these permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

3. **Configure Bucket Policy:**
   - Add this bucket policy to allow public read access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

4. **Install Dependencies:**
   ```bash
   npm install
   ```

## Migration from Local Storage

If you have existing images in your local uploads folder, you can:

1. Upload them manually to your S3 bucket
2. Update the database URLs to point to S3 URLs
3. Or create a migration script to upload existing files

## Testing

After setup, test the upload functionality:
1. Try uploading an image through the article editor
2. Check that the image URL in the response is an S3 URL
3. Verify the image displays correctly in the article
