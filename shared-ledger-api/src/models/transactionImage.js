const { query } = require('../config/database.js');

const TransactionImageModel = {
  async findById(id) {
    const sql = 'SELECT * FROM transaction_images WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByTransactionId(transactionId) {
    const sql = `
      SELECT * FROM transaction_images 
      WHERE transaction_id = ? AND status = 1 
      ORDER BY sort ASC, created_at ASC
    `;
    return await query(sql, [transactionId]);
  },

  async create(imageData) {
    const { transaction_id, url, filename, sort } = imageData;
    const sql = `
      INSERT INTO transaction_images (transaction_id, url, filename, sort, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, NOW(), NOW())
    `;
    const result = await query(sql, [
      transaction_id,
      url,
      filename || null,
      sort || 0
    ]);
    return {
      id: result.insertId,
      ...imageData,
      status: 1
    };
  },

  async createBatch(images) {
    if (!images || images.length === 0) {
      return [];
    }

    const sql = `
      INSERT INTO transaction_images (transaction_id, url, filename, sort, status, created_at, updated_at)
      VALUES ?
    `;
    
    const values = images.map((img, index) => [
      img.transaction_id,
      img.url,
      img.filename || null,
      img.sort || index,
      1,
      new Date(),
      new Date()
    ]);

    const result = await query(sql, [values]);
    
    return images.map((img, index) => ({
      id: result.insertId + index,
      ...img,
      status: 1
    }));
  },

  async delete(id) {
    const sql = 'UPDATE transaction_images SET status = 0, updated_at = NOW() WHERE id = ? AND status = 1';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  async deleteByTransactionId(transactionId) {
    const sql = 'UPDATE transaction_images SET status = 0, updated_at = NOW() WHERE transaction_id = ? AND status = 1';
    const result = await query(sql, [transactionId]);
    return result.affectedRows;
  },

  async countByTransactionId(transactionId) {
    const sql = 'SELECT COUNT(*) as count FROM transaction_images WHERE transaction_id = ? AND status = 1';
    const rows = await query(sql, [transactionId]);
    return rows[0].count;
  }
};

module.exports = {
  TransactionImageModel,
  ...TransactionImageModel
};
