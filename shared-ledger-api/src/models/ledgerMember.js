const { query, transaction } = require('../config/database.js');

const LedgerMemberModel = {
  async addMember(ledgerId, userId, role = 3) {
    const existing = await this.findByLedgerAndUser(ledgerId, userId);
    if (existing) {
      if (existing.status === 0) {
        const updateSql = `
          UPDATE ledger_members 
          SET role = ?, joined_at = NOW(), updated_at = NOW()
          WHERE id = ?
        `;
        await query(updateSql, [role, existing.id]);
        return { id: existing.id, ledger_id: ledgerId, user_id: userId, role };
      }
      throw new Error('用户已是账本成员');
    }

    const sql = `
      INSERT INTO ledger_members (ledger_id, user_id, role, joined_at, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW(), NOW())
    `;
    const result = await query(sql, [ledgerId, userId, role]);
    
    await this.createDefaultPermissions(result.insertId, role);
    
    return {
      id: result.insertId,
      ledger_id: ledgerId,
      user_id: userId,
      role
    };
  },

  async removeMember(ledgerId, userId) {
    const member = await this.findByLedgerAndUser(ledgerId, userId);
    if (!member) {
      throw new Error('成员不存在');
    }
    
    if (member.role === 1) {
      throw new Error('无法移除创建者');
    }

    await query('DELETE FROM ledger_permissions WHERE member_id = ?', [member.id]);
    
    const sql = 'DELETE FROM ledger_members WHERE ledger_id = ? AND user_id = ? AND role != 1';
    const result = await query(sql, [ledgerId, userId]);
    return result.affectedRows > 0;
  },

  async updateRole(ledgerId, userId, newRole) {
    const member = await this.findByLedgerAndUser(ledgerId, userId);
    if (!member) {
      throw new Error('成员不存在');
    }
    
    if (member.role === 1) {
      throw new Error('无法修改创建者角色');
    }

    if (newRole < 1 || newRole > 3) {
      throw new Error('无效的角色值');
    }

    const sql = 'UPDATE ledger_members SET role = ?, updated_at = NOW() WHERE ledger_id = ? AND user_id = ? AND role != 1';
    const result = await query(sql, [newRole, ledgerId, userId]);
    
    if (result.affectedRows > 0) {
      await this.updatePermissionsByRole(member.id, newRole);
    }
    
    return result.affectedRows > 0;
  },

  async findByLedgerId(ledgerId) {
    const sql = `
      SELECT lm.*, u.nickname, u.avatar, u.phone
      FROM ledger_members lm
      INNER JOIN users u ON lm.user_id = u.id
      WHERE lm.ledger_id = ?
      ORDER BY lm.role ASC, lm.joined_at ASC
    `;
    return await query(sql, [ledgerId]);
  },

  async findByUserId(userId) {
    const sql = `
      SELECT lm.*, l.name as ledger_name, l.type as ledger_type
      FROM ledger_members lm
      INNER JOIN ledgers l ON lm.ledger_id = l.id
      WHERE lm.user_id = ? AND l.status = 1
      ORDER BY lm.joined_at DESC
    `;
    return await query(sql, [userId]);
  },

  async findByLedgerAndUser(ledgerId, userId) {
    const sql = `
      SELECT lm.*, u.nickname, u.avatar, u.phone
      FROM ledger_members lm
      INNER JOIN users u ON lm.user_id = u.id
      WHERE lm.ledger_id = ? AND lm.user_id = ?
    `;
    const rows = await query(sql, [ledgerId, userId]);
    return rows[0] || null;
  },

  async getMemberRole(ledgerId, userId) {
    const member = await this.findByLedgerAndUser(ledgerId, userId);
    return member ? member.role : null;
  },

  async createDefaultPermissions(memberId, role) {
    let canAdd = 1;
    let canEdit = 2;
    let canDelete = 2;
    let canReimburse = role === 2 ? 0 : 2;
    let canExport = 1;

    const sql = `
      INSERT INTO ledger_permissions (ledger_id, member_id, can_add, can_edit, can_delete, can_reimburse, can_export, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const member = await this.findByMemberId(memberId);
    await query(sql, [member.ledger_id, memberId, canAdd, canEdit, canDelete, canReimburse, canExport]);
  },

  async findByMemberId(memberId) {
    const sql = 'SELECT * FROM ledger_members WHERE id = ?';
    const rows = await query(sql, [memberId]);
    return rows[0] || null;
  },

  async updatePermissionsByRole(memberId, role) {
    let canReimburse = role === 2 ? 0 : 2;
    
    const sql = `
      UPDATE ledger_permissions 
      SET can_reimburse = ?, updated_at = NOW()
      WHERE member_id = ?
    `;
    await query(sql, [canReimburse, memberId]);
  },

  async getPermissions(memberId) {
    const sql = 'SELECT * FROM ledger_permissions WHERE member_id = ?';
    const rows = await query(sql, [memberId]);
    return rows[0] || null;
  },

  async updatePermissions(memberId, permissions) {
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
      return this.getPermissions(memberId);
    }

    fields.push('updated_at = NOW()');
    values.push(memberId);

    const sql = `UPDATE ledger_permissions SET ${fields.join(', ')} WHERE member_id = ?`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
      return null;
    }

    return this.getPermissions(memberId);
  }
};

module.exports = {
  LedgerMemberModel,
  ...LedgerMemberModel
};
