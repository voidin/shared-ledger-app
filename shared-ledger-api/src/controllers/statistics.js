const { query } = require('../config/database.js');
const { success, error } = require('../utils/response.js');

async function getLedgerById(ledgerId) {
  const sql = 'SELECT * FROM ledgers WHERE id = ?';
  const rows = await query(sql, [ledgerId]);
  return rows[0] || null;
}

async function getMembersByLedgerId(ledgerId) {
  const sql = `
    SELECT id, name, type, avatar, user_id, created_at
    FROM ledger_members 
    WHERE ledger_id = ? AND status = 1
  `;
  return await query(sql, [ledgerId]);
}

async function getVirtualMembersByLedgerId(ledgerId) {
  const sql = `
    SELECT id, name, type, avatar, user_id, created_at
    FROM ledger_members 
    WHERE ledger_id = ? AND type = 'virtual' AND status = 1
  `;
  return await query(sql, [ledgerId]);
}

async function checkUserAccess(ledgerId, userId) {
  const memberSql = `
    SELECT id FROM ledger_members 
    WHERE ledger_id = ? AND user_id = ? AND status = 1
    LIMIT 1
  `;
  const rows = await query(memberSql, [ledgerId, userId]);
  return rows.length > 0;
}

async function getSummaryStats(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { start_date, end_date } = req.query;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(id, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    let whereClause = 'ledger_id = ?';
    const params = [id];

    if (start_date) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }

    const summarySql = `
      SELECT 
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' AND reimbursement_status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN type = 'expense' AND reimbursement_status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN type = 'expense' AND reimbursement_status = 'rejected' THEN amount ELSE 0 END) as rejected_amount,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count
      FROM expenses
      WHERE ${whereClause}
    `;

    const [summary] = await query(summarySql, params);

    const recordCountSql = `
      SELECT COUNT(*) as total_records
      FROM expenses
      WHERE ${whereClause}
    `;
    const [countResult] = await query(recordCountSql, params);

    return success(res, {
      ledger_id: parseInt(id),
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
    const { id } = req.params;
    const userId = req.user.userId;
    const { start_date, end_date } = req.query;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(id, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    const members = await getMembersByLedgerId(id);

    let whereClause = 'e.ledger_id = ?';
    const params = [id];

    if (start_date) {
      whereClause += ' AND DATE(e.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(e.created_at) <= ?';
      params.push(end_date);
    }

    const memberStatsSql = `
      SELECT 
        m.id as member_id,
        m.name as member_name,
        m.type as member_type,
        m.user_id,
        m.avatar,
        COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN e.type = 'expense' AND e.payer_id = m.user_id THEN e.amount ELSE 0 END), 0) as paid_by_member,
        COALESCE(SUM(CASE WHEN e.type = 'expense' AND e.reimbursement_status = 'pending' THEN e.amount ELSE 0 END), 0) as pending_reimbursement,
        COALESCE(SUM(CASE WHEN e.type = 'expense' AND e.reimbursement_status = 'approved' THEN e.amount ELSE 0 END), 0) as approved_reimbursement,
        COALESCE(SUM(CASE WHEN e.type = 'expense' AND e.reimbursement_status = 'rejected' THEN e.amount ELSE 0 END), 0) as rejected_reimbursement,
        COUNT(DISTINCT CASE WHEN e.type = 'expense' THEN e.id END) as expense_count,
        COUNT(DISTINCT CASE WHEN e.type = 'income' THEN e.id END) as income_count
      FROM ledger_members m
      LEFT JOIN expenses e ON e.ledger_id = m.ledger_id AND (
        e.payer_id = m.user_id 
        OR FIND_IN_SET(m.id, e.split_member_ids)
      )
      WHERE m.ledger_id = ? AND m.status = 1
      GROUP BY m.id, m.name, m.type, m.user_id, m.avatar
      ORDER BY total_expense DESC
    `;

    const stats = await query(memberStatsSql, [id]);

    const virtualMembers = await getVirtualMembersByLedgerId(id);
    const virtualMemberIds = virtualMembers.map(vm => vm.id);

    if (virtualMemberIds.length > 0) {
      const virtualStatsSql = `
        SELECT 
          'virtual' as member_type,
          GROUP_CONCAT(DISTINCT vm.name) as member_names,
          COALESCE(SUM(e.amount), 0) as total_expense,
          COALESCE(SUM(CASE WHEN e.reimbursement_status = 'pending' THEN e.amount ELSE 0 END), 0) as pending_reimbursement,
          COALESCE(SUM(CASE WHEN e.reimbursement_status = 'approved' THEN e.amount ELSE 0 END), 0) as approved_reimbursement,
          COALESCE(SUM(CASE WHEN e.reimbursement_status = 'rejected' THEN e.amount ELSE 0 END), 0) as rejected_reimbursement,
          COUNT(e.id) as expense_count
        FROM expenses e
        JOIN ledger_members vm ON FIND_IN_SET(vm.id, e.split_member_ids) > 0 AND vm.ledger_id = e.ledger_id
        WHERE e.ledger_id = ? AND vm.type = 'virtual'
        ${start_date ? 'AND DATE(e.created_at) >= ?' : ''}
        ${end_date ? 'AND DATE(e.created_at) <= ?' : ''}
        GROUP BY vm.type
      `;
      
      const vParams = [id];
      if (start_date) vParams.push(start_date);
      if (end_date) vParams.push(end_date);

      const [virtualStats] = await query(virtualStatsSql, vParams);
      
      if (virtualStats) {
        stats.push({
          member_id: 'virtual_total',
          member_name: '虚拟成员汇总',
          member_type: 'virtual',
          user_id: null,
          avatar: null,
          total_expense: parseFloat(virtualStats.total_expense) || 0,
          total_income: 0,
          paid_by_member: 0,
          pending_reimbursement: parseFloat(virtualStats.pending_reimbursement) || 0,
          approved_reimbursement: parseFloat(virtualStats.approved_reimbursement) || 0,
          rejected_reimbursement: parseFloat(virtualStats.rejected_reimbursement) || 0,
          expense_count: parseInt(virtualStats.expense_count) || 0,
          income_count: 0
        });
      }
    }

    return success(res, {
      ledger_id: parseInt(id),
      ledger_name: ledger.name,
      period: {
        start_date: start_date || null,
        end_date: end_date || null
      },
      members: stats.map(s => ({
        ...s,
        member_id: s.member_id === 'virtual_total' ? 'virtual_total' : parseInt(s.member_id),
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
    const { id } = req.params;
    const userId = req.user.userId;
    const { start_date, end_date, type } = req.query;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(id, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    let whereClause = 'e.ledger_id = ?';
    const params = [id];

    if (start_date) {
      whereClause += ' AND DATE(e.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(e.created_at) <= ?';
      params.push(end_date);
    }
    if (type) {
      whereClause += ' AND e.type = ?';
      params.push(type);
    }

    const categoryStatsSql = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.parent_id,
        COALESCE(SUM(e.amount), 0) as total_amount,
        COUNT(e.id) as record_count,
        COALESCE(SUM(CASE WHEN e.reimbursement_status = 'pending' THEN e.amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN e.reimbursement_status = 'approved' THEN e.amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN e.reimbursement_status = 'rejected' THEN e.amount ELSE 0 END), 0) as rejected_amount
      FROM categories c
      LEFT JOIN expenses e ON e.category_id = c.id AND ${whereClause}
      WHERE c.ledger_id = ? AND c.status = 1
      GROUP BY c.id, c.name, c.icon, c.color, c.parent_id
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `;

    params.push(id);
    const categories = await query(categoryStatsSql, params);

    const totalSql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE ${whereClause}
    `;
    const [totalResult] = await query(totalSql, [id, ...(start_date ? [start_date] : []), ...(end_date ? [end_date] : [])]);

    const total = parseFloat(totalResult.total) || 0;

    return success(res, {
      ledger_id: parseInt(id),
      ledger_name: ledger.name,
      period: {
        start_date: start_date || null,
        end_date: end_date || null,
        type: type || null
      },
      total_amount: total,
      categories: categories.map(c => ({
        category_id: parseInt(c.category_id),
        category_name: c.category_name,
        category_icon: c.category_icon,
        category_color: c.category_color,
        parent_id: c.parent_id,
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
    const { id } = req.params;
    const userId = req.user.userId;
    const { start_date, end_date, group_by = 'day' } = req.query;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(id, userId);
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

    let whereClause = 'ledger_id = ?';
    const params = [id];

    if (start_date) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }

    const timelineSql = `
      SELECT 
        DATE_FORMAT(created_at, '${dateFormat}') as period,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count
      FROM expenses
      WHERE ${whereClause}
      GROUP BY period
      ORDER BY period ASC
    `;

    const timeline = await query(timelineSql, params);

    return success(res, {
      ledger_id: parseInt(id),
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
