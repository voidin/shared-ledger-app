const { query } = require('../config/database.js');

const CategoryModel = {
  async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledgerId) {
    const sql = `
      SELECT * FROM categories 
      WHERE ledger_id = ? AND status = 1 
      ORDER BY sort ASC, created_at ASC
    `;
    return await query(sql, [ledgerId]);
  },

  async findByLedgerIdWithSystem(ledgerId) {
    const sql = `
      SELECT * FROM (
        SELECT id, ledger_id, name, icon, color, sort, is_system, created_at, updated_at 
        FROM categories 
        WHERE ledger_id = ? AND status = 1
        
        UNION ALL
        
        SELECT id, ledger_id, name, icon, color, sort, is_system, created_at, updated_at 
        FROM categories 
        WHERE ledger_id IS NULL AND is_system = 1 AND status = 1
      ) AS combined
      ORDER BY is_system DESC, sort ASC, created_at ASC
    `;
    return await query(sql, [ledgerId]);
  },

  async create(categoryData) {
    const { ledger_id, name, icon, color, sort, is_system } = categoryData;
    const sql = `
      INSERT INTO categories (ledger_id, name, icon, color, sort, is_system, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;
    const result = await query(sql, [
      ledger_id || null,
      name,
      icon || null,
      color || null,
      sort || 0,
      is_system ? 1 : 0
    ]);
    return {
      id: result.insertId,
      ...categoryData,
      is_system: is_system ? 1 : 0,
      status: 1
    };
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
    if (updateData.color !== undefined) {
      fields.push('color = ?');
      values.push(updateData.color);
    }
    if (updateData.sort !== undefined) {
      fields.push('sort = ?');
      values.push(updateData.sort);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  },

  async delete(id) {
    const sql = 'UPDATE categories SET status = 0, updated_at = NOW() WHERE id = ? AND status = 1 AND is_system = 0';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  async countByLedgerId(ledgerId) {
    const sql = 'SELECT COUNT(*) as count FROM categories WHERE ledger_id = ? AND status = 1';
    const rows = await query(sql, [ledgerId]);
    return rows[0].count;
  },

  async findAll(type) {
    let sql = 'SELECT * FROM categories WHERE status = 1';
    const params = [];
    
    if (type !== undefined) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY is_system DESC, sort ASC, created_at ASC';
    return await query(sql, params);
  }
};

module.exports = {
  CategoryModel,
  ...CategoryModel
};
