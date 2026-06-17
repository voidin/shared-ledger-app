const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/response.js');
const { query } = require('../config/database.js');

function validateImage(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: '只支持 JPG 和 PNG 格式的图片' };
  }

  if (file.size > maxSize) {
    return { valid: false, message: '图片大小不能超过 5MB' };
  }

  return { valid: true };
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return error(res, '请上传图片文件', 400);
    }

    const userId = req.user.userId;
    const file = req.file;

    const validation = validateImage(file);
    if (!validation.valid) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return error(res, validation.message, 400);
    }

    const id = uuidv4();
    const originalName = file.originalname;
    const storedFilename = file.filename;
    const fileSize = file.size;
    const mimeType = file.mimetype;

    const sql = `
      INSERT INTO uploaded_files 
      (id, user_id, original_name, stored_name, file_path, file_size, mime_type, file_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'image', NOW())
    `;

    await query(sql, [
      id,
      userId,
      originalName,
      storedFilename,
      file.path,
      fileSize,
      mimeType
    ]);

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${baseUrl}/uploads/images/${storedFilename}`;

    return success(res, {
      id,
      original_name: originalName,
      url: downloadUrl,
      file_size: fileSize,
      mime_type: mimeType,
      created_at: new Date().toISOString()
    }, '上传成功');
  } catch (err) {
    console.error('Upload image error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return error(res, '上传失败，请稍后重试', 500);
  }
}

async function uploadMultipleImages(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '请上传图片文件', 400);
    }

    const userId = req.user.userId;
    const results = [];
    const errors = [];

    for (const file of req.files) {
      const validation = validateImage(file);
      
      if (!validation.valid) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        errors.push({
          original_name: file.originalname,
          error: validation.message
        });
        continue;
      }

      try {
        const id = uuidv4();
        const sql = `
          INSERT INTO uploaded_files 
          (id, user_id, original_name, stored_name, file_path, file_size, mime_type, file_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'image', NOW())
        `;

        await query(sql, [
          id,
          userId,
          file.originalname,
          file.filename,
          file.path,
          file.size,
          file.mimetype
        ]);

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const downloadUrl = `${baseUrl}/uploads/images/${file.filename}`;

        results.push({
          id,
          original_name: file.originalname,
          url: downloadUrl,
          file_size: file.size,
          mime_type: file.mimetype
        });
      } catch (err) {
        console.error(`Failed to save file record: ${file.originalname}`, err);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        errors.push({
          original_name: file.originalname,
          error: '保存失败'
        });
      }
    }

    return success(res, {
      uploaded: results,
      failed: errors,
      total: req.files.length,
      success_count: results.length,
      failed_count: errors.length
    }, `上传完成，成功 ${results.length} 个，失败 ${errors.length} 个`);
  } catch (err) {
    console.error('Upload multiple images error:', err);
    return error(res, '批量上传失败，请稍后重试', 500);
  }
}

async function deleteFile(req, res) {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;

    const sql = 'SELECT * FROM uploaded_files WHERE id = ? AND user_id = ?';
    const rows = await query(sql, [fileId, userId]);
    
    if (rows.length === 0) {
      return error(res, '文件不存在或无权删除', 404);
    }

    const file = rows[0];

    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    const deleteSql = 'DELETE FROM uploaded_files WHERE id = ?';
    await query(deleteSql, [fileId]);

    return success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete file error:', err);
    return error(res, '删除失败，请稍后重试', 500);
  }
}

async function getFileInfo(req, res) {
  try {
    const { fileId } = req.params;

    const sql = 'SELECT * FROM uploaded_files WHERE id = ?';
    const rows = await query(sql, [fileId]);
    
    if (rows.length === 0) {
      return error(res, '文件不存在', 404);
    }

    const file = rows[0];
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    return success(res, {
      id: file.id,
      original_name: file.original_name,
      url: `${baseUrl}/uploads/images/${file.stored_name}`,
      file_size: file.file_size,
      mime_type: file.mime_type,
      file_type: file.file_type,
      created_at: file.created_at
    });
  } catch (err) {
    console.error('Get file info error:', err);
    return error(res, '查询失败，请稍后重试', 500);
  }
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteFile,
  getFileInfo
};
