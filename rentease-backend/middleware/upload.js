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
  
  return async (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({ message: "File upload failed", error: err.message });
      }
      
      if (!req.files || req.files.length === 0) {
        console.log("No files to upload");
        return next();
      }
      
      try {
        console.log(`Starting Cloudinary upload for ${req.files.length} files...`);
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder, resource_type: "image", allowed_formats: ["jpg", "jpeg", "png"] },
              (error, result) => (error ? reject(error) : resolve(result))
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
        });
        
        const results = await Promise.all(uploadPromises);
        console.log("☁️ Cloudinary results:", results.map(r => r.secure_url));
        
        req.files.forEach((file, index) => {
          file.path = results[index].secure_url;
        });
        
        next();
      } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        return res.status(500).json({ message: "Image upload failed", error: err.message });
      }
    });
  };
};

export default upload;