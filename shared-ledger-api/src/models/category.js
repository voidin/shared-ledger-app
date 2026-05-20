const { query } = require('../config/database.js');

const CategoryModel = {
  async create(categoryData) {
    const { ledger_id, name, icon, type, sort_order = 0, created_by } = categoryData;
    const sql = "INSERT INTO categories (ledger_id, name, icon, type, sort_order, created_by, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [ledger_id, name, icon, type, sort_order, created_by]);
    return this.findById(result[0].insertId);
  },

  async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledger_id) {
    const sql = 'SELECT * FROM categories WHERE ledger_id = ? AND status = 1 ORDER BY type ASC, sort_order ASC';
    return await query(sql, [ledger_id]);
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];
    
    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name);
    }
    if (updateData.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updateData.icon);
    }
    if (updateData.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(updateData.sort_order);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push("updated_at = datetime('now')");
    values.push(id);
    
    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  async delete(id) {
    const sql = "UPDATE categories SET status = 0, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [id]);
    return result.changes > 0;
  }
};

module.exports = CategoryModel;
