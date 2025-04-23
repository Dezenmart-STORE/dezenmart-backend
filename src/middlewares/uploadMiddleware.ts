import multer from 'multer';
import path from 'path';
import { CustomError } from './errorHandler';

// Configure Multer storage (Example: memory storage, better for cloud uploads)
// const storage = multer.memoryStorage(); // Keeps files in memory as Buffers

// Configure Multer storage (Example: disk storage, for local saving)
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure 'uploads/' directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// File filter function (optional but recommended)
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
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
  storage: diskStorage, // Use memoryStorage for cloud uploads, diskStorage for local
  limits: { fileSize: 5 * 1024 * 1024 }, // Example: 5MB file size limit
  fileFilter: fileFilter,
});

// Middleware for single file upload
export const uploadSingleImage = (fieldName: string) =>
  upload.single(fieldName);

// Middleware for multiple file uploads (useful for product images)
export const uploadMultipleImages = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);
