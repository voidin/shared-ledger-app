const { query } = require('../config/database.js');
const crypto = require('crypto');

const LedgerModel = {
  async create(ledgerData) {
    const { name, description, type, creatorId, autoLockDays } = ledgerData;
    const invite_code = crypto.randomBytes(6).toString('hex').substring(0, 12);
    
    const sql = "INSERT INTO ledgers (name, description, type, invite_code, creator_id, auto_lock_days, is_locked, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [name, description || null, type || 1, invite_code, creatorId, autoLockDays || null]);
    
    const newLedger = await this.findById(result[0].insertId);
    
    return newLedger;
  },

  async findUserLedgers(userId) {
    return await this.findByUserId(userId);
  },

  async findById(id) {
    const sql = "SELECT l.*, u.nickname as creator_nickname, u.avatar as creator_avatar FROM ledgers l LEFT JOIN users u ON l.creator_id = u.id WHERE l.id = ? AND l.status = 1";
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByInviteCode(invite_code) {
    const sql = 'SELECT * FROM ledgers WHERE invite_code = ? AND status = 1';
    const rows = await query(sql, [invite_code]);
    return rows[0] || null;
  },

  async findByUserId(user_id) {
    const sql = "SELECT l.* FROM ledgers l JOIN ledger_members lm ON l.id = lm.ledger_id WHERE lm.user_id = ? AND l.status = 1 ORDER BY l.created_at DESC";
    return await query(sql, [user_id]);
  },

  async addMember(ledger_id, user_id, role = 3) {
    const existing = await this.getMember(ledger_id, user_id);
    if (existing) {
      return existing;
    }
    
    const sql = "INSERT INTO ledger_members (ledger_id, user_id, role, joined_at, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'))";
    await query(sql, [ledger_id, user_id, role]);
    
    return this.getMember(ledger_id, user_id);
  },

  async getMember(ledger_id, user_id) {
    const sql = "SELECT lm.*, u.nickname, u.avatar FROM ledger_members lm JOIN users u ON lm.user_id = u.id WHERE lm.ledger_id = ? AND lm.user_id = ?";
    const rows = await query(sql, [ledger_id, user_id]);
    return rows[0] || null;
  },

  async getMembers(ledger_id) {
    const sql = "SELECT lm.*, u.nickname, u.avatar FROM ledger_members lm JOIN users u ON lm.user_id = u.id WHERE lm.ledger_id = ? ORDER BY lm.role ASC, lm.joined_at ASC";
    return await query(sql, [ledger_id]);
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
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push("updated_at = datetime('now')");
    values.push(id);
    
    const sql = `UPDATE ledgers SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  async delete(id) {
    const sql = "UPDATE ledgers SET status = 0, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [id]);
    return result.changes > 0;
  },

  async lock(id, locked_by = null) {
    const sql = "UPDATE ledgers SET is_locked = 1, locked_at = datetime('now'), locked_by = ?, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [locked_by, id]);
    return result.changes > 0;
  },

  async unlock(id) {
    const sql = "UPDATE ledgers SET is_locked = 0, locked_at = NULL, locked_by = NULL, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [id]);
    return result.changes > 0;
  }
};

module.exports = LedgerModel;
