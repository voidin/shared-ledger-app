const { query } = require('../config/database.js');

const VirtualMemberModel = {
  async create(data) {
    const { ledger_id, name, avatar, type = 'expense', status = 1 } = data;
    const sql = `
      INSERT INTO virtual_members (ledger_id, name, avatar, type, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const result = await query(sql, [ledger_id, name, avatar || null, type, status]);
    return {
      id: result.insertId,
      ledger_id,
      name,
      avatar: avatar || null,
      type,
      status,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async findById(id) {
    const sql = 'SELECT * FROM virtual_members WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledgerId, options = {}) {
    const { type, status = 1 } = options;
    let sql = 'SELECT * FROM virtual_members WHERE ledger_id = ? AND status = ?';
    const params = [ledgerId, status];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query(sql, params);
    return rows;
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name);
    }
    if (updateData.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updateData.avatar);
    }
    if (updateData.type !== undefined) {
      fields.push('type = ?');
      values.push(updateData.type);
    }
    if (updateData.status !== undefined) {
      fields.push('status = ?');
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE virtual_members SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  },

  async delete(id) {
    const sql = 'UPDATE virtual_members SET status = 0, updated_at = NOW() WHERE id = ? AND status = 1';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  async hasAssociatedEntries(memberId) {
    const entrySql = `
      SELECT COUNT(*) as count FROM expense_entries 
      WHERE payer_member_id = ? OR payee_member_id = ? AND status = 1
    `;
    const entryRows = await query(entrySql, [memberId, memberId]);
    if (entryRows[0].count > 0) {
      return { hasEntries: true, count: entryRows[0].count, type: 'expense' };
    }

    const incomeSql = `
      SELECT COUNT(*) as count FROM income_entries 
      WHERE payer_member_id = ? OR payee_member_id = ? AND status = 1
    `;
    const incomeRows = await query(incomeSql, [memberId, memberId]);
    if (incomeRows[0].count > 0) {
      return { hasEntries: true, count: incomeRows[0].count, type: 'income' };
    }

    return { hasEntries: false, count: 0, type: null };
  },

  async getPayeesByLedgerId(ledgerId) {
    const sql = `
      SELECT 
        id,
        name,
        avatar,
        'real' as member_type,
        NULL as virtual_member_id
      FROM ledger_members 
      WHERE ledger_id = ? AND status = 1
      UNION ALL
      SELECT 
        id,
        name,
        avatar,
        'virtual' as member_type,
        id as virtual_member_id
      FROM virtual_members 
      WHERE ledger_id = ? AND type = 'payee' AND status = 1
      ORDER BY member_type DESC, name ASC
    `;
    const rows = await query(sql, [ledgerId, ledgerId]);
    return rows;
  },

  async findByNameAndLedgerId(name, ledgerId, excludeId = null) {
    let sql = 'SELECT * FROM virtual_members WHERE name = ? AND ledger_id = ? AND status = 1';
    const params = [name, ledgerId];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const rows = await query(sql, params);
    return rows[0] || null;
  }
};

module.exports = {
  VirtualMemberModel,
  ...VirtualMemberModel
};
