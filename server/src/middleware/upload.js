const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function buildStorage(subfolder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(__dirname, '../../uploads', subfolder));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    }
  });
}

const videoUpload = multer({
  storage: buildStorage('videos'),
  limits: { fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 524288000 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'video/mp4' || file.originalname.toLowerCase().endsWith('.mp4')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos MP4'));
    }
  }
});

const presentationUpload = multer({
  storage: buildStorage('presentations'),
  limits: { fileSize: parseInt(process.env.MAX_PRESENTATION_SIZE) || 104857600 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.ppt', '.pptx', '.pdf'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PPT, PPTX o PDF'));
    }
  }
});

module.exports = { videoUpload, presentationUpload };
