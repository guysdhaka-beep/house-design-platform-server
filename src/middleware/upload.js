const multer = require("multer");

// Store all uploaded files temporarily in memory.
// Images will be uploaded to Cloudinary.
// Videos will be uploaded to Cloudflare R2.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    return cb(null, true);
  }

  return cb(
    new Error("Only image and video files are allowed."),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

module.exports = upload;