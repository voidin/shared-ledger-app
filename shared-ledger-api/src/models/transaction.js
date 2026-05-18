const { query, transaction } = require('../config/database.js');

const TransactionModel = {
  async findById(id) {
    const sql = 'SELECT * FROM transactions WHERE id = ? AND status = 1';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByIdWithDetails(id) {
    const sql = `
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.nickname as creator_nickname,
        u.avatar as creator_avatar,
        p.nickname as payee_nickname,
        p.avatar as payee_avatar
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN users p ON t.payee_id = p.id
      WHERE t.id = ? AND t.status = 1
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByLedgerId(ledgerId, options = {}) {
    const { page = 1, pageSize = 20, categoryId, startDate, endDate, reimburseStatus, keyword } = options;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE t.ledger_id = ? AND t.status = 1';
    const params = [ledgerId];

    if (categoryId) {
      whereClause += ' AND t.category_id = ?';
      params.push(categoryId);
    }

    if (startDate) {
      whereClause += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }

    if (reimburseStatus !== undefined && reimburseStatus !== null) {
      whereClause += ' AND t.reimburse_status = ?';
      params.push(reimburseStatus);
    }

    if (keyword) {
      whereClause += ' AND (t.description LIKE ? OR t.remark LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countSql = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.nickname as creator_nickname,
        u.avatar as creator_avatar,
        p.nickname as payee_nickname,
        p.avatar as payee_avatar
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN users p ON t.payee_id = p.id
      ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query(sql, [...params, pageSize, offset]);

    return {
      list: rows,
      total,
      page,
      pageSize
    };
  },

  async create(transactionData) {
    const {
      ledger_id,
      category_id,
      creator_id,
      amount,
      type,
      transaction_date,
      description,
      remark,
      payee_id,
      is_virtual_payee,
      virtual_payee_name,
      reimburse_status
    } = transactionData;

    const sql = `
      INSERT INTO transactions (
        ledger_id, category_id, creator_id, amount, type, 
        transaction_date, description, remark, 
        payee_id, is_virtual_payee, virtual_payee_name,
        reimburse_status, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;

    const result = await query(sql, [
      ledger_id,
      category_id,
      creator_id,
      amount,
      type,
      transaction_date || new Date(),
      description || '',
      remark || null,
      payee_id || null,
      is_virtual_payee ? 1 : 0,
      virtual_payee_name || null,
      reimburse_status !== undefined ? reimburse_status : (type === 2 ? 1 : 0)
    ]);

    return {
      id: result.insertId,
      ...transactionData,
      reimburse_status: reimburse_status !== undefined ? reimburse_status : (type === 2 ? 1 : 0),
      status: 1
    };
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(updateData.category_id);
    }
    if (updateData.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updateData.amount);
    }
    if (updateData.type !== undefined) {
      fields.push('type = ?');
      values.push(updateData.type);
    }
    if (updateData.transaction_date !== undefined) {
      fields.push('transaction_date = ?');
      values.push(updateData.transaction_date);
    }
    if (updateData.description !== undefined) {
      fields.push('description = ?');
      values.push(updateData.description);
    }
    if (updateData.remark !== undefined) {
      fields.push('remark = ?');
      values.push(updateData.remark);
    }
    if (updateData.payee_id !== undefined) {
      fields.push('payee_id = ?');
      values.push(updateData.payee_id);
    }
    if (updateData.is_virtual_payee !== undefined) {
      fields.push('is_virtual_payee = ?');
      values.push(updateData.is_virtual_payee ? 1 : 0);
    }
    if (updateData.virtual_payee_name !== undefined) {
      fields.push('virtual_payee_name = ?');
      values.push(updateData.virtual_payee_name);
    }
    if (updateData.reimburse_status !== undefined) {
      fields.push('reimburse_status = ?');
      values.push(updateData.reimburse_status);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND status = 1`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  },

  async delete(id) {
    const sql = 'UPDATE transactions SET status = 0, updated_at = NOW() WHERE id = ? AND status = 1';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  async markReimbursed(id, reimburseStatus) {
    const sql = 'UPDATE transactions SET reimburse_status = ?, updated_at = NOW() WHERE id = ? AND status = 1';
    const result = await query(sql, [reimburseStatus, id]);
    return result.affectedRows > 0;
  },

  async countByLedgerId(ledgerId) {
    const sql = 'SELECT COUNT(*) as count FROM transactions WHERE ledger_id = ? AND status = 1';
    const rows = await query(sql, [ledgerId]);
    return rows[0].count;
  },

  async getSummaryByLedgerId(ledgerId, startDate, endDate) {
    const params = [ledgerId];
    let dateFilter = '';
    
    if (startDate) {
      dateFilter += ' AND transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND transaction_date <= ?';
      params.push(endDate);
    }

    const sql = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM transactions 
      WHERE ledger_id = ? AND status = 1 ${dateFilter}
      GROUP BY type
    `;
    return await query(sql, params);
  }
};

module.exports = {
  TransactionModel,
  ...TransactionModel
};
