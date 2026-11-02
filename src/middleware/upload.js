const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    let folder = "house-design";

    if (file.fieldname === "image3d") {
      folder = "house-design/3d";
    } else if (file.fieldname === "image2d") {
      folder = "house-design/2d";
    }

    return {
      folder,
      resource_type: "image",
      public_id: `${Date.now()}-${Math.round(Math.random() * 1000000)}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});