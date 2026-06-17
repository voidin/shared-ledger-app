const { query } = require('../config/database.js');

const ExportModel = {
  async create(exportData) {
    const { ledger_id, type, file_url, created_by, params } = exportData;
    const sql = "INSERT INTO exports (ledger_id, type, file_url, created_by, params, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [ledger_id, type, file_url, created_by, JSON.stringify(params || {})]);
    return this.findById(result[0].insertId);
  },

  async findById(id) {
    const sql = 'SELECT * FROM exports WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledger_id) {
    const sql = "SELECT e.*, u.nickname as creator_nickname, u.avatar as creator_avatar FROM exports e LEFT JOIN users u ON e.created_by = u.id WHERE e.ledger_id = ? AND e.status = 1 ORDER BY e.created_at DESC";
    return await query(sql, [ledger_id]);
  },

  async delete(id) {
    const sql = "UPDATE exports SET status = 0, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [id]);
    return result.changes > 0;
  }
};

module.exports = ExportModel;
