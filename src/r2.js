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

// ===============================
// Upload Video
// ===============================

async function uploadVideoToR2(file) {
  const ext = path.extname(file.originalname);

  const key = `videos/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}

// ===============================
// Delete Video
// ===============================

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
  } catch (err) {
    console.error("Delete R2 Video Error:", err);
  }
}

module.exports = {
  r2,
  uploadVideoToR2,
  deleteVideoFromR2,
};