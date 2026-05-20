const { query } = require('../config/database.js');

const TransactionModel = {
  async create(transactionData) {
    const { 
      ledger_id, 
      type, 
      amount, 
      category_id, 
      category_name, 
      description, 
      transacted_at, 
      created_by, 
      image_urls = null
    } = transactionData;
    
    const sql = "INSERT INTO transactions (ledger_id, type, amount, category_id, category_name, description, transacted_at, created_by, image_urls, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [
      ledger_id, type, amount, category_id || null, 
      category_name || null, description || null, 
      transacted_at, created_by, JSON.stringify(image_urls || [])
    ]);
    
    return this.findById(result[0].insertId);
  },

  async findById(id) {
    const sql = "SELECT t.*, u.nickname as creator_nickname, u.avatar as creator_avatar FROM transactions t LEFT JOIN users u ON t.created_by = u.id WHERE t.id = ? AND t.status = 1";
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledger_id, options = {}) {
    let sql = "SELECT t.*, u.nickname as creator_nickname, u.avatar as creator_avatar FROM transactions t LEFT JOIN users u ON t.created_by = u.id WHERE t.ledger_id = ? AND t.status = 1";
    const params = [ledger_id];
    
    if (options.type) {
      sql += " AND t.type = ?";
      params.push(options.type);
    }
    if (options.category_id) {
      sql += " AND t.category_id = ?";
      params.push(options.category_id);
    }
    if (options.keyword) {
      sql += " AND (t.description LIKE ? OR t.category_name LIKE ?)";
      params.push('%' + options.keyword + '%', '%' + options.keyword + '%');
    }
    
    sql += " ORDER BY t.transacted_at DESC, t.created_at DESC";
    
    if (options.limit) {
      sql += " LIMIT ?";
      params.push(options.limit);
    }
    
    if (options.offset) {
      sql += " OFFSET ?";
      params.push(options.offset);
    }
    
    return await query(sql, params);
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];
    
    if (updateData.type !== undefined) {
      fields.push('type = ?');
      values.push(updateData.type);
    }
    if (updateData.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updateData.amount);
    }
    if (updateData.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(updateData.category_id);
    }
    if (updateData.category_name !== undefined) {
      fields.push('category_name = ?');
      values.push(updateData.category_name);
    }
    if (updateData.description !== undefined) {
      fields.push('description = ?');
      values.push(updateData.description);
    }
    if (updateData.transacted_at !== undefined) {
      fields.push('transacted_at = ?');
      values.push(updateData.transacted_at);
    }
    if (updateData.image_urls !== undefined) {
      fields.push('image_urls = ?');
      values.push(JSON.stringify(updateData.image_urls || []));
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push("updated_at = datetime('now')");
    values.push(id);
    
    const sql = `UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  async delete(id) {
    const sql = "UPDATE transactions SET status = 0, updated_at = datetime('now') WHERE id = ? AND status = 1";
    const result = await query(sql, [id]);
    return result.changes > 0;
  },

  async getSummaryByLedgerId(ledger_id, startDate, endDate) {
    let sql = "SELECT type, SUM(amount) as total_amount FROM transactions WHERE ledger_id = ? AND status = 1";
    const params = [ledger_id];
    
    if (startDate) {
      sql += " AND transacted_at >= ?";
      params.push(startDate);
    }
    if (endDate) {
      sql += " AND transacted_at <= ?";
      params.push(endDate);
    }
    
    sql += " GROUP BY type";
    
    return await query(sql, params);
  }
};

module.exports = TransactionModel;
