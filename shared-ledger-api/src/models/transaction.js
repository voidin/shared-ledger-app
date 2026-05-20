const { query } = require('../config/database.js');

const TransactionModel = {
  async create(transactionData) {
    const { 
      ledger_id, 
      user_id,
      type = 1, 
      amount, 
      category_id,
      category_name,
      remark,
      transaction_date,
      payee_id,
      is_virtual_payee = 0,
      reimburse_status = 0
    } = transactionData;
    
    const sql = "INSERT INTO transactions (ledger_id, user_id, type, amount, category_id, category_name, remark, transaction_date, payee_id, is_virtual_payee, reimburse_status, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))";
    const result = await query(sql, [
      ledger_id, 
      user_id, 
      type, 
      amount.toString(), 
      category_id || null, 
      category_name || null, 
      remark || null, 
      transaction_date || new Date().toISOString().split('T')[0], 
      payee_id || null, 
      is_virtual_payee, 
      reimburse_status
    ]);
    
    return this.findById(result[0].insertId);
  },

  async findById(id) {
    const sql = "SELECT * FROM transactions WHERE id = ? AND status = 1";
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledger_id, options = {}) {
    let sql = "SELECT * FROM transactions WHERE ledger_id = ? AND status = 1";
    const params = [ledger_id];
    
    if (options.type !== undefined) {
      sql += " AND type = ?";
      params.push(options.type);
    }
    if (options.category_id) {
      sql += " AND category_id = ?";
      params.push(options.category_id);
    }
    
    sql += " ORDER BY transaction_date DESC, created_at DESC";
    
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
      values.push(updateData.amount.toString());
    }
    if (updateData.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(updateData.category_id);
    }
    if (updateData.category_name !== undefined) {
      fields.push('category_name = ?');
      values.push(updateData.category_name);
    }
    if (updateData.remark !== undefined) {
      fields.push('remark = ?');
      values.push(updateData.remark);
    }
    if (updateData.transaction_date !== undefined) {
      fields.push('transaction_date = ?');
      values.push(updateData.transaction_date);
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
      sql += " AND transaction_date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      sql += " AND transaction_date <= ?";
      params.push(endDate);
    }
    
    sql += " GROUP BY type";
    
    return await query(sql, params);
  }
};

module.exports = TransactionModel;
