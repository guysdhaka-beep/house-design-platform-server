const cloudinary = require("./cloudinary");

const uploadImageToCloudinary = async (file) => {
  try {
    const base64 = file.buffer.toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64}`;

    const folder =
      file.fieldname === "image3d"
        ? "house-design/3d"
        : "house-design/2d";

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: "image",
      public_id: `${Date.now()}-${Math.round(Math.random() * 1000000)}`,
    });

    return result.secure_url;
  } catch (error) {
    throw new Error(`Cloudinary Upload Failed: ${error.message}`);
  }
};

module.exports = uploadImageToCloudinary;