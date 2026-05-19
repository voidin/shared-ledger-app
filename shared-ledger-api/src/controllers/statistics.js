const { query } = require('../config/database.js');
const { success, error } = require('../utils/response.js');

async function getLedgerById(ledgerId) {
  const sql = 'SELECT * FROM ledgers WHERE id = ?';
  const rows = await query(sql, [ledgerId]);
  return rows[0] || null;
}

async function checkUserAccess(ledgerId, userId) {
  const memberSql = `
    SELECT id FROM ledger_members 
    WHERE ledger_id = ? AND user_id = ?
    LIMIT 1
  `;
  const rows = await query(memberSql, [ledgerId, userId]);
  return rows.length > 0;
}

async function getSummaryStats(req, res) {
  try {
    const ledgerId = req.params.ledgerId;
    const userId = req.user.userId;
    const { start_date, end_date } = req.query;

    const ledger = await getLedgerById(ledgerId);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(ledgerId, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    let whereClause = 't.ledger_id = ? AND t.status = 1';
    const params = [ledgerId];

    if (start_date) {
      whereClause += ' AND DATE(t.transaction_date) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(t.transaction_date) <= ?';
      params.push(end_date);
    }

    const summarySql = `
      SELECT 
        SUM(CASE WHEN t.type = 1 THEN t.amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN t.type = 2 THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 1 AND t.reimburse_status = 1 THEN t.amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN t.type = 1 AND t.reimburse_status = 2 THEN t.amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN t.type = 1 AND t.reimburse_status = 3 THEN t.amount ELSE 0 END) as rejected_amount,
        COUNT(CASE WHEN t.type = 1 THEN 1 END) as expense_count,
        COUNT(CASE WHEN t.type = 2 THEN 1 END) as income_count
      FROM transactions t
      WHERE ${whereClause}
    `;

    const [summary] = await query(summarySql, params);

    const recordCountSql = `
      SELECT COUNT(*) as total_records
      FROM transactions t
      WHERE ${whereClause}
    `;
    const [countResult] = await query(recordCountSql, params);

    return success(res, {
      ledger_id: parseInt(ledgerId),
      ledger_name: ledger.name,
      period: {
        start_date: start_date || null,
        end_date: end_date || null
      },
      summary: {
        total_expense: parseFloat(summary.total_expense) || 0,
        total_income: parseFloat(summary.total_income) || 0,
        net_amount: (parseFloat(summary.total_income) || 0) - (parseFloat(summary.total_expense) || 0),
        pending_amount: parseFloat(summary.pending_amount) || 0,
        approved_amount: parseFloat(summary.approved_amount) || 0,
        rejected_amount: parseFloat(summary.rejected_amount) || 0,
        expense_count: parseInt(summary.expense_count) || 0,
        income_count: parseInt(summary.income_count) || 0,
        total_records: parseInt(countResult.total_records) || 0
      }
    });
  } catch (err) {
    console.error('Get summary stats error:', err);
    return error(res, '查询失败，请稍后重试', 500);
  }
}

async function getMemberStats(req, res) {
  try {
    const ledgerId = req.params.ledgerId;
    const userId = req.user.userId;
    const { start_date, end_date } = req.query;

    const ledger = await getLedgerById(ledgerId);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(ledgerId, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    const membersSql = `
      SELECT 
        m.id as member_id,
        u.nickname as member_name,
        m.user_id,
        u.avatar,
        COALESCE(SUM(CASE WHEN t.type = 1 THEN t.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN t.type = 2 THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 1 AND t.creator_id = m.user_id THEN t.amount ELSE 0 END), 0) as paid_by_member,
        COALESCE(SUM(CASE WHEN t.type = 1 AND t.reimburse_status = 1 THEN t.amount ELSE 0 END), 0) as pending_reimbursement,
        COALESCE(SUM(CASE WHEN t.type = 1 AND t.reimburse_status = 2 THEN t.amount ELSE 0 END), 0) as approved_reimbursement,
        COALESCE(SUM(CASE WHEN t.type = 1 AND t.reimburse_status = 3 THEN t.amount ELSE 0 END), 0) as rejected_reimbursement,
        COUNT(DISTINCT CASE WHEN t.type = 1 THEN t.id END) as expense_count,
        COUNT(DISTINCT CASE WHEN t.type = 2 THEN t.id END) as income_count
      FROM ledger_members m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN transactions t ON t.ledger_id = m.ledger_id AND t.creator_id = m.user_id
      WHERE m.ledger_id = ?
      GROUP BY m.id, u.nickname, m.user_id, u.avatar
      ORDER BY total_expense DESC
    `;

    const stats = await query(membersSql, [ledgerId]);

    return success(res, {
      ledger_id: parseInt(ledgerId),
      ledger_name: ledger.name,
      period: {
        start_date: start_date || null,
        end_date: end_date || null
      },
      members: stats.map(s => ({
        member_id: s.member_id,
        member_name: s.member_name,
        user_id: s.user_id,
        avatar: s.avatar,
        total_expense: parseFloat(s.total_expense) || 0,
        total_income: parseFloat(s.total_income) || 0,
        paid_by_member: parseFloat(s.paid_by_member) || 0,
        pending_reimbursement: parseFloat(s.pending_reimbursement) || 0,
        approved_reimbursement: parseFloat(s.approved_reimbursement) || 0,
        rejected_reimbursement: parseFloat(s.rejected_reimbursement) || 0,
        expense_count: parseInt(s.expense_count) || 0,
        income_count: parseInt(s.income_count) || 0
      }))
    });
  } catch (err) {
    console.error('Get member stats error:', err);
    return error(res, '查询失败，请稍后重试', 500);
  }
}

async function getCategoryStats(req, res) {
  try {
    const ledgerId = req.params.ledgerId;
    const userId = req.user.userId;
    const { start_date, end_date, type } = req.query;

    const ledger = await getLedgerById(ledgerId);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(ledgerId, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    let whereClause = 't.ledger_id = ? AND t.status = 1';
    const params = [ledgerId];

    if (start_date) {
      whereClause += ' AND DATE(t.transaction_date) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(t.transaction_date) <= ?';
      params.push(end_date);
    }
    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(parseInt(type));
    }

    const categoryStatsSql = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(t.id) as record_count,
        COALESCE(SUM(CASE WHEN t.reimburse_status = 1 THEN t.amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN t.reimburse_status = 2 THEN t.amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN t.reimburse_status = 3 THEN t.amount ELSE 0 END), 0) as rejected_amount
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id AND ${whereClause}
      WHERE c.status = 1 AND (c.ledger_id IS NULL OR c.ledger_id = ?)
      GROUP BY c.id, c.name, c.icon, c.color
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `;

    const categoryParams = [...params, ledgerId];
    const categories = await query(categoryStatsSql, categoryParams);

    const totalSql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions t
      WHERE ${whereClause}
    `;
    const [totalResult] = await query(totalSql, params);

    const total = parseFloat(totalResult.total) || 0;

    return success(res, {
      ledger_id: parseInt(ledgerId),
      ledger_name: ledger.name,
      period: {
        start_date: start_date || null,
        end_date: end_date || null,
        type: type || null
      },
      total_amount: total,
      categories: categories.map(c => ({
        category_id: c.category_id,
        category_name: c.category_name,
        category_icon: c.category_icon,
        category_color: c.category_color,
        total_amount: parseFloat(c.total_amount) || 0,
        record_count: parseInt(c.record_count) || 0,
        percentage: total > 0 ? ((parseFloat(c.total_amount) || 0) / total * 100).toFixed(2) : 0,
        pending_amount: parseFloat(c.pending_amount) || 0,
        approved_amount: parseFloat(c.approved_amount) || 0,
        rejected_amount: parseFloat(c.rejected_amount) || 0
      }))
    });
  } catch (err) {
    console.error('Get category stats error:', err);
    return error(res, '查询失败，请稍后重试', 500);
  }
}

async function getTimelineStats(req, res) {
  try {
    const ledgerId = req.params.ledgerId;
    const userId = req.user.userId;
    const { start_date, end_date, group_by = 'day' } = req.query;

    const ledger = await getLedgerById(ledgerId);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(ledgerId, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    let dateFormat;
    switch (group_by) {
      case 'week':
        dateFormat = '%Y-W%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    let whereClause = 'ledger_id = ? AND status = 1';
    const params = [ledgerId];

    if (start_date) {
      whereClause += ' AND DATE(transaction_date) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(transaction_date) <= ?';
      params.push(end_date);
    }

    const timelineSql = `
      SELECT 
        DATE_FORMAT(transaction_date, '${dateFormat}') as period,
        SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 2 THEN amount ELSE 0 END) as income,
        COUNT(CASE WHEN type = 1 THEN 1 END) as expense_count,
        COUNT(CASE WHEN type = 2 THEN 1 END) as income_count
      FROM transactions
      WHERE ${whereClause}
      GROUP BY period
      ORDER BY period ASC
    `;

    const timeline = await query(timelineSql, params);

    return success(res, {
      ledger_id: parseInt(ledgerId),
      ledger_name: ledger.name,
      period: {
        start_date: start_date || null,
        end_date: end_date || null,
        group_by
      },
      timeline: timeline.map(t => ({
        period: t.period,
        expense: parseFloat(t.expense) || 0,
        income: parseFloat(t.income) || 0,
        expense_count: parseInt(t.expense_count) || 0,
        income_count: parseInt(t.income_count) || 0
      }))
    });
  } catch (err) {
    console.error('Get timeline stats error:', err);
    return error(res, '查询失败，请稍后重试', 500);
  }
}

module.exports = {
  getSummaryStats,
  getMemberStats,
  getCategoryStats,
  getTimelineStats
};
