import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanFileName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.txt', '.pdf', '.docx', '.doc', '.md'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) || file.mimetype.includes('text') || file.mimetype.includes('pdf') || file.mimetype.includes('word')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type (${ext}). Please upload a TXT, PDF, or DOCX document.`), false);
  }
};

const groupFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.md', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (
    allowedExtensions.includes(ext) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.includes('pdf') ||
    file.mimetype.includes('word') ||
    file.mimetype.includes('presentation') ||
    file.mimetype.includes('powerpoint') ||
    file.mimetype.includes('text')
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type (${ext}). Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, PNG, WEBP.`), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: fileFilter,
});

export const groupUpload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: groupFileFilter,
});
