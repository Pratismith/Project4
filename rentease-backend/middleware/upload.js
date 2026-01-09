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

export const uploadToCloudinary = (fieldName = "image", folder = "rentease_properties") => {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image", allowed_formats: ["jpg", "jpeg", "png"] },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
        req.file.cloudinary = result;
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
};

export default upload;