const { query } = require('../config/database.js');

const LedgerPermissionModel = {
  async create(permissionData) {
    const { ledger_id, member_id, can_add, can_edit, can_delete, can_reimburse, can_export } = permissionData;
    const sql = "INSERT INTO ledger_permissions (ledger_id, member_id, can_add, can_edit, can_delete, can_reimburse, can_export, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))";
    await query(sql, [ledger_id, member_id, can_add || 1, can_edit || 2, can_delete || 2, can_reimburse || 2, can_export || 1]);
    return this.findByMemberId(member_id);
  },

  async findByMemberId(member_id) {
    const sql = 'SELECT * FROM ledger_permissions WHERE member_id = ?';
    const rows = await query(sql, [member_id]);
    return rows[0] || null;
  },

  async update(member_id, permissions) {
    const fields = [];
    const values = [];
    
    if (permissions.can_add !== undefined) {
      fields.push('can_add = ?');
      values.push(permissions.can_add);
    }
    if (permissions.can_edit !== undefined) {
      fields.push('can_edit = ?');
      values.push(permissions.can_edit);
    }
    if (permissions.can_delete !== undefined) {
      fields.push('can_delete = ?');
      values.push(permissions.can_delete);
    }
    if (permissions.can_reimburse !== undefined) {
      fields.push('can_reimburse = ?');
      values.push(permissions.can_reimburse);
    }
    if (permissions.can_export !== undefined) {
      fields.push('can_export = ?');
      values.push(permissions.can_export);
    }
    
    if (fields.length === 0) {
      return this.findByMemberId(member_id);
    }
    
    fields.push("updated_at = datetime('now')");
    values.push(member_id);
    
    const sql = `UPDATE ledger_permissions SET ${fields.join(', ')} WHERE member_id = ?`;
    const result = await query(sql, values);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.findByMemberId(member_id);
  },

  async deleteByMemberId(member_id) {
    const sql = 'DELETE FROM ledger_permissions WHERE member_id = ?';
    const result = await query(sql, [member_id]);
    return result.changes > 0;
  }
};

module.exports = LedgerPermissionModel;
