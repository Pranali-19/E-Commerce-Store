import asyncHandler from "express-async-handler";

export const uploadProductImages = asyncHandler( async (req, res) => {
   if (!req.files || req.files.length === 0) { 
    res.status(400); 
    throw new Error("Please select at least one image."); 
  } 

  const images = req.files.map((file) => ({
    url: file.path, 
    publicId: file.filename,
    originalName: file.originalname, 
  })); 

  res.status(200).json({
    success: true, 
    message: "Images uploaded successfully.", 
    data: { 
      images, 
    }, 
  }); 
  } 
); 

export const uploadCategoryImage = asyncHandler( async (req, res) => { 
  if (!req.file) { 
    res.status(400); 
    throw new Error("Please select an image."); 
  } 
  res.status(200).json({
    success: true, 
    message: "Category image uploaded successfully.", 
    data: {
      image: { 
        url: req.file.path, 
        publicId: req.file.filename, 
        originalName: req.file.originalname, 
      }, 
    }, 
  }); 
 }
);