const { query } = require('../config/database.js');

const LedgerMemberModel = {
  async addMember(ledgerId, userId, role = 3) {
    const existing = await this.findByLedgerAndUser(ledgerId, userId);
    if (existing) {
      return existing;
    }

    const sql = "INSERT INTO ledger_members (ledger_id, user_id, role, joined_at, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'))";
    const result = await query(sql, [ledgerId, userId, role]);
    
    return {
      id: result[0].insertId,
      ledger_id: ledgerId,
      user_id: userId,
      role
    };
  },

  async removeMember(ledgerId, userId) {
    const sql = 'DELETE FROM ledger_members WHERE ledger_id = ? AND user_id = ? AND role != 1';
    const result = await query(sql, [ledgerId, userId]);
    return result.changes > 0;
  },

  async updateRole(ledgerId, userId, newRole) {
    const sql = "UPDATE ledger_members SET role = ?, updated_at = datetime('now') WHERE ledger_id = ? AND user_id = ? AND role != 1";
    const result = await query(sql, [newRole, ledgerId, userId]);
    return result.changes > 0;
  },

  async findByLedgerId(ledgerId) {
    const sql = "SELECT lm.*, u.nickname, u.avatar, u.phone FROM ledger_members lm INNER JOIN users u ON lm.user_id = u.id WHERE lm.ledger_id = ? ORDER BY lm.role ASC, lm.joined_at ASC";
    return await query(sql, [ledgerId]);
  },

  async findByUserId(userId) {
    const sql = "SELECT lm.*, l.name as ledger_name, l.type as ledger_type FROM ledger_members lm INNER JOIN ledgers l ON lm.ledger_id = l.id WHERE lm.user_id = ? AND l.status = 1 ORDER BY lm.joined_at DESC";
    return await query(sql, [userId]);
  },

  async findByLedgerAndUser(ledgerId, userId) {
    const sql = "SELECT lm.*, u.nickname, u.avatar, u.phone FROM ledger_members lm INNER JOIN users u ON lm.user_id = u.id WHERE lm.ledger_id = ? AND lm.user_id = ?";
    const rows = await query(sql, [ledgerId, userId]);
    return rows[0] || null;
  },

  async getMemberRole(ledgerId, userId) {
    const member = await this.findByLedgerAndUser(ledgerId, userId);
    return member ? member.role : null;
  },

  async findByMemberId(memberId) {
    const sql = 'SELECT * FROM ledger_members WHERE id = ?';
    const rows = await query(sql, [memberId]);
    return rows[0] || null;
  }
};

module.exports = {
  LedgerMemberModel,
  ...LedgerMemberModel
};
