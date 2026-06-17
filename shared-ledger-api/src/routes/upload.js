const express = require('express');
const router = express.Router();
const { 
  uploadImage, 
  uploadMultipleImages, 
  deleteFile,
  getFileInfo 
} = require('../controllers/upload.js');
const { authenticate } = require('../middleware/auth.js');
const { 
  uploadImage: uploadImageMiddleware,
  uploadMultipleImages: uploadMultipleMiddleware,
  handleMulterError 
} = require('../middleware/upload.js');

router.post(
  '/image', 
  authenticate, 
  uploadImageMiddleware.single('image'), 
  handleMulterError, 
  uploadImage
);

router.post(
  '/images', 
  authenticate, 
  uploadMultipleMiddleware.array('images', 10), 
  handleMulterError, 
  uploadMultipleImages
);

router.delete('/:fileId', authenticate, deleteFile);

router.get('/:fileId', getFileInfo);

module.exports = router;
