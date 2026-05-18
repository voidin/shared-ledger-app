import { query, transaction } from '../config/database.js';

export const LedgerModel = {
  async create({ name, description, type, creatorId, autoLockDays = null }) {
    const inviteCode = generateInviteCode();
    const autoLockAt = autoLockDays ? calculateAutoLockAt(autoLockDays) : null;

    const sql = `
      INSERT INTO ledgers (name, description, type, invite_code, creator_id, auto_lock_days, auto_lock_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;
    const result = await query(sql, [name, description || null, type || 1, inviteCode, creatorId, autoLockDays, autoLockAt]);
    return {
      id: result.insertId,
      name,
      description,
      type,
      invite_code: inviteCode,
      creator_id: creatorId,
      auto_lock_days: autoLockDays,
      auto_lock_at: autoLockAt,
      status: 1
    };
  },

  async findById(id) {
    const sql = `
      SELECT l.*, u.nickname as creator_nickname, u.avatar as creator_avatar,
             (SELECT COUNT(*) FROM ledger_members WHERE ledger_id = l.id) as member_count
      FROM ledgers l
      LEFT JOIN users u ON l.creator_id = u.id
      WHERE l.id = ? AND l.status = 1
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByInviteCode(inviteCode) {
    const sql = `
      SELECT l.*, u.nickname as creator_nickname, u.avatar as creator_avatar,
             (SELECT COUNT(*) FROM ledger_members WHERE ledger_id = l.id) as member_count
      FROM ledgers l
      LEFT JOIN users u ON l.creator_id = u.id
      WHERE l.invite_code = ? AND l.status = 1
    `;
    const rows = await query(sql, [inviteCode]);
    return rows[0] || null;
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      fields.push('description = ?');
      values.push(updateData.description);
    }
    if (updateData.type !== undefined) {
      fields.push('type = ?');
      values.push(updateData.type);
    }
    if (updateData.auto_lock_days !== undefined) {
      fields.push('auto_lock_days = ?');
      values.push(updateData.auto_lock_days);
      if (updateData.auto_lock_days !== null) {
        fields.push('auto_lock_at = ?');
        values.push(calculateAutoLockAt(updateData.auto_lock_days));
      } else {
        fields.push('auto_lock_at = NULL');
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE ledgers SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  },

  async delete(id) {
    const sql = 'UPDATE ledgers SET status = 0, updated_at = NOW() WHERE id = ? AND status = 1';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  async lock(id, userId) {
    const sql = `
      UPDATE ledgers 
      SET is_locked = 1, locked_at = NOW(), locked_by = ?, updated_at = NOW()
      WHERE id = ? AND status = 1
    `;
    const result = await query(sql, [userId, id]);
    return result.affectedRows > 0;
  },

  async unlock(id) {
    const sql = `
      UPDATE ledgers 
      SET is_locked = 0, locked_at = NULL, locked_by = NULL, updated_at = NOW()
      WHERE id = ? AND status = 1
    `;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  async findUserLedgers(userId) {
    const sql = `
      SELECT l.*, u.nickname as creator_nickname, u.avatar as creator_avatar,
             lm.role,
             (SELECT COUNT(*) FROM ledger_members WHERE ledger_id = l.id) as member_count
      FROM ledger_members lm
      INNER JOIN ledgers l ON lm.ledger_id = l.id
      LEFT JOIN users u ON l.creator_id = u.id
      WHERE lm.user_id = ? AND l.status = 1
      ORDER BY lm.joined_at DESC
    `;
    return await query(sql, [userId]);
  },

  async isInviteCodeExists(inviteCode, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM ledgers WHERE invite_code = ? AND status = 1';
    const params = [inviteCode];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const rows = await query(sql, params);
    return rows[0].count > 0;
  },

  async findAutoLockLedgers() {
    const sql = `
      UPDATE ledgers 
      SET is_locked = 1, locked_at = NOW(), locked_by = NULL, updated_at = NOW()
      WHERE auto_lock_at <= NOW() AND is_locked = 0 AND status = 1
    `;
    const result = await query(sql);
    return result.affectedRows;
  }
};

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function calculateAutoLockAt(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export default LedgerModel;
