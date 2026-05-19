const { query, transaction } = require('../config/database.js');

const PermissionModel = {
  async findByMemberId(userId, ledgerId) {
    const sql = `
      SELECT * FROM ledger_permissions 
      WHERE user_id = ? AND ledger_id = ? AND status = 1
    `;
    const rows = await query(sql, [userId, ledgerId]);
    return rows[0] || null;
  },

  async findByLedgerId(ledgerId) {
    const sql = `
      SELECT lp.*, u.nickname, u.avatar, u.phone 
      FROM ledger_permissions lp
      LEFT JOIN users u ON lp.user_id = u.id AND u.status = 1
      WHERE lp.ledger_id = ? AND lp.status = 1
      ORDER BY lp.role ASC, lp.created_at DESC
    `;
    const rows = await query(sql, [ledgerId]);
    return rows;
  },

  async create(data) {
    const {
      ledger_id,
      user_id,
      role = 2,
      can_add = 1,
      can_edit = 1,
      can_delete = 1,
      can_reimburse = 1,
      can_export = 1,
      status = 1
    } = data;

    const sql = `
      INSERT INTO ledger_permissions (
        ledger_id, user_id, role, can_add, can_edit, can_delete, 
        can_reimburse, can_export, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    const result = await query(sql, [
      ledger_id, user_id, role, can_add, can_edit, can_delete,
      can_reimburse, can_export, status
    ]);

    return {
      id: result.insertId,
      ledger_id,
      user_id,
      role,
      can_add,
      can_edit,
      can_delete,
      can_reimburse,
      can_export,
      status,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(userId, ledgerId, updateData) {
    const fields = [];
    const values = [];

    if (updateData.role !== undefined) {
      fields.push('role = ?');
      values.push(updateData.role);
    }
    if (updateData.can_add !== undefined) {
      fields.push('can_add = ?');
      values.push(updateData.can_add);
    }
    if (updateData.can_edit !== undefined) {
      fields.push('can_edit = ?');
      values.push(updateData.can_edit);
    }
    if (updateData.can_delete !== undefined) {
      fields.push('can_delete = ?');
      values.push(updateData.can_delete);
    }
    if (updateData.can_reimburse !== undefined) {
      fields.push('can_reimburse = ?');
      values.push(updateData.can_reimburse);
    }
    if (updateData.can_export !== undefined) {
      fields.push('can_export = ?');
      values.push(updateData.can_export);
    }
    if (updateData.status !== undefined) {
      fields.push('status = ?');
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = datetime('now')');
    values.push(userId);
    values.push(ledgerId);

    const sql = `
      UPDATE ledger_permissions 
      SET ${fields.join(', ')} 
      WHERE user_id = ? AND ledger_id = ? AND status = 1
    `;
    const result = await query(sql, values);

    if (result.changes === 0) {
      return null;
    }

    return this.findByMemberId(userId, ledgerId);
  },

  async deleteByMemberId(userId, ledgerId) {
    const sql = `
      UPDATE ledger_permissions 
      SET status = 0, updated_at = datetime('now') 
      WHERE user_id = ? AND ledger_id = ? AND status = 1
    `;
    const result = await query(sql, [userId, ledgerId]);
    return result.changes > 0;
  },

  async deleteByLedgerId(ledgerId) {
    const sql = `
      UPDATE ledger_permissions 
      SET status = 0, updated_at = datetime('now') 
      WHERE ledger_id = ? AND status = 1
    `;
    const result = await query(sql, [ledgerId]);
    return result.changes;
  },

  async isCreator(userId, ledgerId) {
    const sql = `
      SELECT role FROM ledger_permissions 
      WHERE user_id = ? AND ledger_id = ? AND status = 1
    `;
    const rows = await query(sql, [userId, ledgerId]);
    if (rows.length === 0) {
      return false;
    }
    return rows[0].role === 1;
  },

  async getUserRole(userId, ledgerId) {
    const permission = await this.findByMemberId(userId, ledgerId);
    return permission ? permission.role : null;
  },

  async batchUpdate(ledgerId, permissions) {
    return await transaction(async (conn) => {
      for (const perm of permissions) {
        const [existing] = await conn.execute(
          'SELECT id FROM ledger_permissions WHERE user_id = ? AND ledger_id = ? AND status = 1',
          [perm.user_id, ledgerId]
        );

        if (existing.length > 0) {
          await conn.execute(
            `UPDATE ledger_permissions 
             SET role = ?, can_add = ?, can_edit = ?, can_delete = ?, 
                 can_reimburse = ?, can_export = ?, updated_at = datetime('now')
             WHERE user_id = ? AND ledger_id = ? AND status = 1`,
            [perm.role, perm.can_add, perm.can_edit, perm.can_delete,
             perm.can_reimburse, perm.can_export, perm.user_id, ledgerId]
          );
        } else {
          await conn.execute(
            `INSERT INTO ledger_permissions 
             (ledger_id, user_id, role, can_add, can_edit, can_delete, 
              can_reimburse, can_export, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            [ledgerId, perm.user_id, perm.role, perm.can_add, perm.can_edit,
             perm.can_delete, perm.can_reimburse, perm.can_export]
          );
        }
      }
      return true;
    });
  }
};

module.exports = {
  PermissionModel,
  ...PermissionModel
};
