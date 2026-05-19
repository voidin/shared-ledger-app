const { query } = require('../config/database.js');
const { success, error } = require('../utils/response.js');

async function getLedgerById(ledgerId) {
  const sql = 'SELECT * FROM ledgers WHERE id = ?';
  const rows = await query(sql, [ledgerId]);
  return rows[0] || null;
}

async function updateLockStatus(ledgerId, isLocked, lockedAt = null) {
  const sql = `
    UPDATE ledgers 
    SET is_locked = ?, locked_at = ?, updated_at = NOW()
    WHERE id = ?
  `;
  const result = await query(sql, [isLocked ? 1 : 0, lockedAt, ledgerId]);
  return result.changes > 0;
}

async function updateLockSettings(ledgerId, settings) {
  const sql = `
    UPDATE ledgers 
    SET auto_lock_enabled = ?, auto_lock_at = ?, auto_lock_type = ?, updated_at = NOW()
    WHERE id = ?
  `;
  const result = await query(sql, [
    settings.auto_lock_enabled ? 1 : 0,
    settings.auto_lock_at || null,
    settings.auto_lock_type || 'once',
    ledgerId
  ]);
  return result.changes > 0;
}

async function lockLedger(req, res) {
  try {
    const { id } = req.params;
    const { is_locked } = req.body;
    const userId = req.user.userId;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    if (ledger.creator_id !== userId) {
      return error(res, '只有账本创建者才能锁定或解锁账本', 403);
    }

    const lockedAt = is_locked ? new Date() : null;
    const updateSuccess = await updateLockStatus(id, is_locked, lockedAt);

    if (!updateSuccess) {
      return error(res, '更新锁定状态失败', 500);
    }

    const updatedLedger = await getLedgerById(id);
    return success(res, {
      id: updatedLedger.id,
      name: updatedLedger.name,
      is_locked: updatedLedger.is_locked === 1,
      locked_at: updatedLedger.locked_at,
      auto_lock_enabled: updatedLedger.auto_lock_enabled === 1,
      auto_lock_at: updatedLedger.auto_lock_at,
      auto_lock_type: updatedLedger.auto_lock_type
    }, is_locked ? '账本已锁定' : '账本已解锁');
  } catch (err) {
    console.error('Lock ledger error:', err);
    return error(res, '操作失败，请稍后重试', 500);
  }
}

async function updateLockSettingsHandler(req, res) {
  try {
    const { id } = req.params;
    const { auto_lock_enabled, auto_lock_at, auto_lock_type } = req.body;
    const userId = req.user.userId;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    if (ledger.creator_id !== userId) {
      return error(res, '只有账本创建者才能设置自动锁定规则', 403);
    }

    const settings = {
      auto_lock_enabled: auto_lock_enabled !== undefined ? auto_lock_enabled : ledger.auto_lock_enabled === 1,
      auto_lock_at: auto_lock_at !== undefined ? auto_lock_at : ledger.auto_lock_at,
      auto_lock_type: auto_lock_type || 'once'
    };

    if (settings.auto_lock_enabled && !settings.auto_lock_at) {
      return error(res, '启用自动锁定时必须指定锁定时间', 400);
    }

    const updateSuccess = await updateLockSettings(id, settings);
    if (!updateSuccess) {
      return error(res, '更新自动锁定设置失败', 500);
    }

    const updatedLedger = await getLedgerById(id);
    return success(res, {
      id: updatedLedger.id,
      name: updatedLedger.name,
      is_locked: updatedLedger.is_locked === 1,
      locked_at: updatedLedger.locked_at,
      auto_lock_enabled: updatedLedger.auto_lock_enabled === 1,
      auto_lock_at: updatedLedger.auto_lock_at,
      auto_lock_type: updatedLedger.auto_lock_type
    }, '自动锁定设置已更新');
  } catch (err) {
    console.error('Update lock settings error:', err);
    return error(res, '操作失败，请稍后重试', 500);
  }
}

async function getLockStatus(req, res) {
  try {
    const { id } = req.params;

    const ledger = await getLedgerById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    return success(res, {
      id: ledger.id,
      name: ledger.name,
      is_locked: ledger.is_locked === 1,
      locked_at: ledger.locked_at,
      locked_by: ledger.locked_by,
      auto_lock_enabled: ledger.auto_lock_enabled === 1,
      auto_lock_at: ledger.auto_lock_at,
      auto_lock_type: ledger.auto_lock_type,
      creator_id: ledger.creator_id,
      is_creator: req.user && ledger.creator_id === req.user.userId
    });
  } catch (err) {
    console.error('Get lock status error:', err);
    return error(res, '查询失败，请稍后重试', 500);
  }
}

module.exports = {
  lockLedger,
  updateLockSettings: updateLockSettingsHandler,
  getLockStatus
};
