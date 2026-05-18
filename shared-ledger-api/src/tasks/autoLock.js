const cron = require('node-cron');
const { query } = require('../config/database.js');

let isRunning = false;

async function lockExpiredLedgers() {
  if (isRunning) {
    console.log('[AutoLock] Task is already running, skipping...');
    return;
  }

  isRunning = true;
  console.log('[AutoLock] Starting auto-lock check...');

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const sql = `
      SELECT id, name, creator_id, auto_lock_type
      FROM ledgers 
      WHERE auto_lock_enabled = 1 
        AND auto_lock_at IS NOT NULL 
        AND auto_lock_at <= ?
        AND is_locked = 0
    `;
    
    const ledgers = await query(sql, [now]);
    
    if (ledgers.length === 0) {
      console.log('[AutoLock] No ledgers to lock.');
      return;
    }

    console.log(`[AutoLock] Found ${ledgers.length} ledger(s) to lock.`);
    
    for (const ledger of ledgers) {
      try {
        await lockLedger(ledger);
      } catch (err) {
        console.error(`[AutoLock] Failed to lock ledger ${ledger.id}:`, err.message);
      }
    }
    
    console.log(`[AutoLock] Auto-lock task completed.`);
  } catch (err) {
    console.error('[AutoLock] Auto-lock task error:', err);
  } finally {
    isRunning = false;
  }
}

async function lockLedger(ledger) {
  const connection = await require('../config/database.js').getConnection();
  
  try {
    await connection.beginTransaction();
    
    const updateSql = `
      UPDATE ledgers 
      SET is_locked = 1, 
          locked_at = NOW(), 
          locked_by = NULL,
          updated_at = NOW()
      WHERE id = ? AND is_locked = 0
    `;
    
    await connection.execute(updateSql, [ledger.id]);
    
    const ledgerHistorySql = `
      INSERT INTO ledger_history (ledger_id, action, actor_id, details, created_at)
      VALUES (?, 'auto_lock', NULL, ?, NOW())
    `;
    
    const details = JSON.stringify({
      type: 'auto_lock',
      auto_lock_type: ledger.auto_lock_type,
      triggered_at: new Date().toISOString()
    });
    
    await connection.execute(ledgerHistorySql, [ledger.id, details]);
    
    await connection.commit();
    
    console.log(`[AutoLock] Ledger ${ledger.id} (${ledger.name}) has been auto-locked.`);
    
    if (ledger.auto_lock_type === 'once') {
      const disableSql = `
        UPDATE ledgers 
        SET auto_lock_enabled = 0, updated_at = NOW()
        WHERE id = ?
      `;
      await connection.execute(disableSql, [ledger.id]);
      console.log(`[AutoLock] Auto-lock disabled for ledger ${ledger.id} (one-time).`);
    }
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

function startAutoLockScheduler() {
  console.log('[AutoLock] Initializing auto-lock scheduler...');
  
  cron.schedule('* * * * *', async () => {
    await lockExpiredLedgers();
  });
  
  console.log('[AutoLock] Auto-lock scheduler started. Running every minute.');
  
  lockExpiredLedgers();
}

async function stopAutoLockScheduler() {
  console.log('[AutoLock] Stopping scheduler...');
  isRunning = true;
}

module.exports = {
  startAutoLockScheduler,
  stopAutoLockScheduler,
  lockExpiredLedgers,
  default: {
    start: startAutoLockScheduler,
    stop: stopAutoLockScheduler
  }
};
