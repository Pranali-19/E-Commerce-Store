import cloudinary from "../config/cloudinary.js";

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return null;

  try {
    const result = await cloudinary.uploader.destroy(
      publicId
    );

    return result;
  } catch (error) {
    console.error(
      "Cloudinary image deletion failed:",
      error.message
    );

    return null;
  }
};

export default deleteCloudinaryImage;