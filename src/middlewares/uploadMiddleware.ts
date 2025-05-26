import multer from 'multer';
import path from 'path';
import { CustomError } from './errorHandler';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../configs/storage';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = 'general';
    if (file.fieldname === 'profileImage') {
      folderName = 'profile_images';
    } else if (file.fieldname === 'images') {
      folderName = 'product_images';
    } else if (file.fieldname === 'videos') {
      folderName = 'product_videos';
    } else if (file.fieldname === 'messageFile') {
      folderName = 'message_files';
    }

    return {
      folder: `dezenmart/${folderName}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4'],
      // transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional: transformations
      public_id: `${file.fieldname}-${Date.now()}-${path.parse(file.originalname).name}`,
    };
  },
});


// File filter function (optional but recommended)
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(
    new CustomError(
      `File upload only supports the following filetypes - ${allowedTypes}`,
      400,
      'fail',
    ),
  );
};

// Configure Multer instance
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Example: 5MB file size limit
  fileFilter: fileFilter,
});

// Middleware for single file upload
export const uploadSingleImage = (fieldName: string) =>
  upload.single(fieldName);

// Middleware for multiple file uploads (useful for product images)
export const uploadMultipleImages = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);
