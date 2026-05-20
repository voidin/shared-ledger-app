const { query } = require('../config/database.js');

const UserModel = {
  async findByPhone(phone) {
    const sql = 'SELECT * FROM users WHERE phone = ? AND status = 1';
    const rows = await query(sql, [phone]);
    return rows[0] || null;
  },

  async findById(id) {
    const sql = 'SELECT id, openid, unionid, phone, nickname, avatar, status, created_at, updated_at FROM users WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByOpenid(openid) {
    const sql = 'SELECT * FROM users WHERE openid = ? AND status = 1';
    const rows = await query(sql, [openid]);
    return rows[0] || null;
  },

  async create(userData) {
    const { openid, unionid, phone, nickname, avatar } = userData;
    const sql = "INSERT INTO users (openid, unionid, phone, nickname, avatar, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [openid || null, unionid || null, phone || null, nickname || null, avatar || null]);
    return {
      id: result[0].insertId,
      ...userData,
      status: 1
    };
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(updateData.nickname);
    }
    if (updateData.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updateData.avatar);
    }
    if (updateData.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updateData.phone);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND status = 1';
    const result = await query(sql, values);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  },

  async updatePassword(id, hashedPassword) {
    const sql = "UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [hashedPassword, id]);
    return result.changes > 0;
  }
};

module.exports = {
  UserModel,
  ...UserModel
};
