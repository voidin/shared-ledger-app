const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database.js');
const { success, error } = require('../utils/response.js');
const ExportModel = require('../models/export.js');

async function getLedgerById(ledgerId) {
  const sql = 'SELECT * FROM ledgers WHERE id = ?';
  const rows = await query(sql, [ledgerId]);
  return rows[0] || null;
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

async function getExportData(ledgerId, filters = {}) {
  let whereClause = 'e.ledger_id = ?';
  const params = [ledgerId];

  if (filters.start_date) {
    whereClause += ' AND DATE(e.created_at) >= ?';
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    whereClause += ' AND DATE(e.created_at) <= ?';
    params.push(filters.end_date);
  }
  if (filters.reimbursement_status) {
    whereClause += ' AND e.reimbursement_status = ?';
    params.push(filters.reimbursement_status);
  }
  if (filters.type) {
    whereClause += ' AND e.type = ?';
    params.push(filters.type);
  }

  const sql = `
    SELECT 
      e.id,
      e.description,
      e.amount,
      e.type,
      e.reimbursement_status,
      e.paid_by_name,
      e.payer_id,
      e.split_type,
      e.split_member_ids,
      e.split_amounts,
      e.notes,
      e.created_at,
      c.name as category_name,
      c.icon as category_icon,
      u.nickname as creator_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE ${whereClause}
    ORDER BY e.created_at DESC
  `;

  return await query(sql, params);
}

async function getLedgerMembers(ledgerId) {
  const sql = `
    SELECT id, name, user_id, type 
    FROM ledger_members 
    WHERE ledger_id = ? AND status = 1
  `;
  return await query(sql, [ledgerId]);
}

async function exportExpenses(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { 
      start_date, 
      end_date, 
      reimbursement_status,
      type,
      format = 'excel'
    } = req.body;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(id, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    const filters = {
      start_date,
      end_date,
      reimbursement_status,
      type
    };

    const expenses = await getExportData(id, filters);
    const members = await getLedgerMembers(id);

    const memberMap = {};
    members.forEach(m => {
      memberMap[m.id] = m.name;
    });

    const exportId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `expenses_${ledger.name}_${timestamp}.xlsx`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'exports');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Shared Ledger API';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('汇总');
    summarySheet.columns = [
      { header: '项目', key: 'item', width: 20 },
      { header: '数值', key: 'value', width: 30 }
    ];

    const totalExpense = expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const pendingAmount = expenses
      .filter(e => e.reimbursement_status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const approvedAmount = expenses
      .filter(e => e.reimbursement_status === 'approved')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    summarySheet.addRow({ item: '账本名称', value: ledger.name });
    summarySheet.addRow({ item: '导出时间', value: new Date().toLocaleString('zh-CN') });
    summarySheet.addRow({ item: '导出记录数', value: expenses.length });
    summarySheet.addRow({ item: '时间范围', value: `${start_date || '不限'} - ${end_date || '不限'}` });
    summarySheet.addRow({ item: '报销状态筛选', value: reimbursement_status || '全部' });
    summarySheet.addRow({ item: '支出总额', value: totalExpense.toFixed(2) });
    summarySheet.addRow({ item: '收入总额', value: totalIncome.toFixed(2) });
    summarySheet.addRow({ item: '净额', value: (totalIncome - totalExpense).toFixed(2) });
    summarySheet.addRow({ item: '待报销金额', value: pendingAmount.toFixed(2) });
    summarySheet.addRow({ item: '已报销金额', value: approvedAmount.toFixed(2) });

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const expenseSheet = workbook.addWorksheet('支出明细');
    expenseSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '日期', key: 'date', width: 20 },
      { header: '描述', key: 'description', width: 30 },
      { header: '金额', key: 'amount', width: 15 },
      { header: '类型', key: 'type', width: 10 },
      { header: '分类', key: 'category', width: 15 },
      { header: '付款人', key: 'payer', width: 15 },
      { header: '报销状态', key: 'reimbursement_status', width: 15 },
      { header: '分摊方式', key: 'split_type', width: 12 },
      { header: '分摊成员', key: 'split_members', width: 25 },
      { header: '备注', key: 'notes', width: 30 },
      { header: '创建人', key: 'creator', width: 15 }
    ];

    expenses.forEach((expense, index) => {
      let splitMembers = '';
      if (expense.split_member_ids) {
        const memberIds = expense.split_member_ids.split(',').map(id => id.trim());
        splitMembers = memberIds.map(id => memberMap[parseInt(id)] || id).join(', ');
      }

      expenseSheet.addRow({
        id: expense.id,
        date: new Date(expense.created_at).toLocaleString('zh-CN'),
        description: expense.description || '',
        amount: parseFloat(expense.amount),
        type: expense.type === 'expense' ? '支出' : '收入',
        category: expense.category_name || '未分类',
        payer: expense.paid_by_name || '',
        reimbursement_status: getStatusText(expense.reimbursement_status),
        split_type: expense.split_type === 'equal' ? '平均分摊' : expense.split_type === 'custom' ? '自定义' : '个人',
        split_members: splitMembers,
        notes: expense.notes || '',
        creator: expense.creator_name || ''
      });

      const row = expenseSheet.getRow(index + 2);
      if (expense.type === 'expense') {
        row.getCell(4).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE6E6' }
        };
      } else {
        row.getCell(4).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6FFE6' }
        };
      }
    });

    expenseSheet.getRow(1).font = { bold: true };
    expenseSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    expenseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    expenseSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    const categorySheet = workbook.addWorksheet('分类统计');
    categorySheet.columns = [
      { header: '分类', key: 'category', width: 20 },
      { header: '记录数', key: 'count', width: 15 },
      { header: '金额', key: 'amount', width: 15 },
      { header: '占比', key: 'percentage', width: 15 },
      { header: '待报销', key: 'pending', width: 15 },
      { header: '已报销', key: 'approved', width: 15 }
    ];

    const categoryStats = {};
    expenses.forEach(e => {
      const cat = e.category_name || '未分类';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, amount: 0, pending: 0, approved: 0 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].amount += parseFloat(e.amount);
      if (e.reimbursement_status === 'pending') {
        categoryStats[cat].pending += parseFloat(e.amount);
      } else if (e.reimbursement_status === 'approved') {
        categoryStats[cat].approved += parseFloat(e.amount);
      }
    });

    Object.entries(categoryStats)
      .sort((a, b) => b[1].amount - a[1].amount)
      .forEach(([category, stats]) => {
        const percentage = totalExpense > 0 ? ((stats.amount / totalExpense) * 100).toFixed(2) + '%' : '0%';
        categorySheet.addRow({
          category,
          count: stats.count,
          amount: stats.amount.toFixed(2),
          percentage,
          pending: stats.pending.toFixed(2),
          approved: stats.approved.toFixed(2)
        });
      });

    categorySheet.getRow(1).font = { bold: true };
    categorySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    categorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    await workbook.xlsx.writeFile(filePath);

    const exportRecord = await ExportModel.create({
      id: exportId,
      ledger_id: parseInt(id),
      user_id: userId,
      filename,
      file_path: filePath,
      record_count: expenses.length,
      filters: JSON.stringify(filters),
      file_size: fs.statSync(filePath).size
    });

    return success(res, {
      export_id: exportId,
      filename,
      download_url: `/api/exports/${exportId}/download`,
      record_count: expenses.length,
      total_expense: totalExpense,
      total_income: totalIncome,
      pending_amount: pendingAmount,
      approved_amount: approvedAmount,
      file_size: fs.statSync(filePath).size
    }, '导出成功');
  } catch (err) {
    console.error('Export expenses error:', err);
    return error(res, '导出失败，请稍后重试', 500);
  }
}

function getStatusText(status) {
  const statusMap = {
    'pending': '待报销',
    'approved': '已报销',
    'rejected': '已拒绝',
    'none': '无需报销'
  };
  return statusMap[status] || status;
}

async function downloadExport(req, res) {
  try {
    const { exportId } = req.params;
    const userId = req.user ? req.user.userId : null;

    const exportRecord = await ExportModel.findById(exportId);
    if (!exportRecord) {
      return error(res, '导出记录不存在', 404);
    }

    if (userId && exportRecord.user_id !== userId) {
      return error(res, '无权下载该文件', 403);
    }

    if (!fs.existsSync(exportRecord.file_path)) {
      return error(res, '文件不存在或已过期', 404);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(exportRecord.filename)}"`);

    const fileStream = fs.createReadStream(exportRecord.file_path);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download export error:', err);
    return error(res, '下载失败，请稍后重试', 500);
  }
}

async function getExportHistory(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const hasAccess = await checkUserAccess(id, userId);
    if (!hasAccess) {
      return error(res, '无权访问该账本', 403);
    }

    const historySql = `
      SELECT 
        e.id,
        e.filename,
        e.record_count,
        e.file_size,
        e.filters,
        e.created_at,
        u.nickname as creator_name
      FROM export_records e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.ledger_id = ?
      ORDER BY e.created_at DESC
      LIMIT 50
    `;

    const records = await query(historySql, [id]);

    return success(res, {
      ledger_id: parseInt(id),
      records: records.map(r => ({
        export_id: r.id,
        filename: r.filename,
        record_count: r.record_count,
        file_size: r.file_size,
        filters: r.filters ? JSON.parse(r.filters) : {},
        created_at: r.created_at,
        creator_name: r.creator_name
      }))
    });
  } catch (err) {
    console.error('Get export history error:', err);
    return error(res, '查询失败，请稍后重试', 500);
  }
}

async function deleteExport(req, res) {
  try {
    const { exportId } = req.params;
    const userId = req.user.userId;

    const exportRecord = await ExportModel.findById(exportId);
    if (!exportRecord) {
      return error(res, '导出记录不存在', 404);
    }

    if (exportRecord.user_id !== userId) {
      return error(res, '无权删除该记录', 403);
    }

    if (fs.existsSync(exportRecord.file_path)) {
      fs.unlinkSync(exportRecord.file_path);
    }

    const deleteSql = 'DELETE FROM export_records WHERE id = ?';
    await query(deleteSql, [exportId]);

    return success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete export error:', err);
    return error(res, '删除失败，请稍后重试', 500);
  }
}

module.exports = {
  exportExpenses,
  downloadExport,
  getExportHistory,
  deleteExport
};
