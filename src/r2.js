const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const path = require("path");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ===================================
// Upload Video to Cloudflare R2
// ===================================
async function uploadVideoToR2(file) {
  console.log("========== R2 UPLOAD ==========");
  console.log("Bucket:", process.env.R2_BUCKET_NAME);
  console.log("R2_PUBLIC_DOMAIN =", process.env.R2_PUBLIC_DOMAIN);
  console.log("Account:", process.env.R2_ACCOUNT_ID);
  console.log("File:", file.originalname);
  console.log("Size:", file.size);

  const ext = path.extname(file.originalname);

  const key = `videos/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${ext}`;

  console.log("Key:", key);

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  // Public URL
  const url = `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;

  console.log("Upload Success:", url);

  return url;
}

// ===================================
// Delete Video from Cloudflare R2
// ===================================
async function deleteVideoFromR2(videoUrl) {
  if (!videoUrl) return;

  try {
    const url = new URL(videoUrl);

    const key = url.pathname.replace(/^\/+/, "");

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );

    console.log("Deleted:", key);
  } catch (err) {
    console.error("Delete R2 Video Error:", err);
  }
}

module.exports = {
  r2,
  uploadVideoToR2,
  deleteVideoFromR2,
};