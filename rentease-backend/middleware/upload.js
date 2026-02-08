// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "rentease_properties",
//     allowed_formats: ["jpg", "jpeg", "png"],
//   },
// });

// const upload = multer({ storage });

// export default upload;

import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadToCloudinaryArray = (fieldName = "images", folder = "rentease_properties") => {
  const multerMiddleware = upload.array(fieldName, 5);
  
  return (req, res, next) => {
    console.log("DEBUG [Upload]: Received request for field:", fieldName);
    multerMiddleware(req, res, async (err) => {
      if (err) {
        console.error("DEBUG [Multer Error]:", err);
        return res.status(400).json({ message: "Multer Error", error: err.message });
      }
      
      console.log("DEBUG [Files]:", req.files ? req.files.length : 0, "files received");
      if (!req.files || req.files.length === 0) {
        return next();
      }
      
      try {
        const uploadPromises = req.files.map((file, idx) => {
          console.log(`DEBUG [Cloudinary Start]: Uploading file ${idx+1}/${req.files.length}`);
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder, resource_type: "image", allowed_formats: ["jpg", "jpeg", "png"] },
              (error, result) => {
                if (error) {
                  console.error(`DEBUG [Cloudinary Error] File ${idx+1}:`, error);
                  reject(error);
                } else {
                  console.log(`DEBUG [Cloudinary Success] File ${idx+1}:`, result.secure_url);
                  resolve(result);
                }
              }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
        });
        
        const results = await Promise.all(uploadPromises);
        req.files.forEach((file, index) => {
          file.path = results[index].secure_url;
        });
        
        console.log("DEBUG [Upload Finish]: All images processed");
        next();
      } catch (err) {
        console.error("DEBUG [Catch Cloudinary]:", err);
        return res.status(500).json({ message: "Cloudinary processing failed", error: err.message });
      }
    });
  };
};

export default upload;