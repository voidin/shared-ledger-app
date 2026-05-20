const { query } = require('../config/database.js');

const TransactionImageModel = {
  async create(imageData) {
    const { transaction_id, url, sort_order = 0, uploaded_by } = imageData;
    const sql = "INSERT INTO transaction_images (transaction_id, url, sort_order, uploaded_by, status, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [transaction_id, url, sort_order, uploaded_by]);
    return this.findById(result[0].insertId);
  },

  async findById(id) {
    const sql = 'SELECT * FROM transaction_images WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByTransactionId(transaction_id) {
    const sql = 'SELECT * FROM transaction_images WHERE transaction_id = ? AND status = 1 ORDER BY sort_order ASC';
    return await query(sql, [transaction_id]);
  },

  async delete(id) {
    const sql = "UPDATE transaction_images SET status = 0, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [id]);
    return result.changes > 0;
  },

  async deleteByTransactionId(transaction_id) {
    const sql = "UPDATE transaction_images SET status = 0, updated_at = datetime('now') WHERE transaction_id = ? AND status = 1";
    const result = await query(sql, [transaction_id]);
    return result.changes > 0;
  }
};

module.exports = TransactionImageModel;
