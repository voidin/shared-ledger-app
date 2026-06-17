const { query } = require('../config/database.js');

const VirtualMemberModel = {
  async create(memberData) {
    const { ledger_id, name, role = 3, created_by } = memberData;
    const sql = "INSERT INTO virtual_members (ledger_id, name, role, created_by, status, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [ledger_id, name, role, created_by]);
    return this.findById(result[0].insertId);
  },

  async findById(id) {
    const sql = 'SELECT * FROM virtual_members WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledger_id) {
    const sql = 'SELECT * FROM virtual_members WHERE ledger_id = ? AND status = 1 ORDER BY role ASC, created_at ASC';
    return await query(sql, [ledger_id]);
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];
    
    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name);
    }
    if (updateData.role !== undefined) {
      fields.push('role = ?');
      values.push(updateData.role);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push("updated_at = datetime('now')");
    values.push(id);
    
    const sql = `UPDATE virtual_members SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  async delete(id) {
    const sql = "UPDATE virtual_members SET status = 0, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [id]);
    return result.changes > 0;
  }
};

module.exports = VirtualMemberModel;
