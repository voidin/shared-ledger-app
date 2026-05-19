const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建或打开 SQLite 数据库
const db = new Database(path.join(dataDir, 'shared_ledger.db'));
db.pragma('journal_mode = WAL');

console.log('SQLite 数据库已连接');

// 执行查询并返回结果
function query(sql, params = []) {
  try {
    // 转换 ? 占位符为 SQLite 的 ?
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params);
    } else {
      const result = stmt.run(...params);
      // 对于 INSERT，返回包含 insertId 和 changes 的对象
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        return [{ insertId: result.lastInsertRowid, changes: result.changes }];
      }
      return [{ changes: result.changes }];
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// 执行查询并返回单个结果（兼容 mysql2 的 getConnection 模式）
function getConnection() {
  return {
    execute: query,
    query: query,
    beginTransaction: () => {
      db.exec('BEGIN TRANSACTION');
    },
    commit: () => {
      db.exec('COMMIT');
    },
    rollback: () => {
      db.exec('ROLLBACK');
    },
    release: () => {}
  };
}

// 简单的事务支持
async function transaction(callback) {
  db.exec('BEGIN TRANSACTION');
  try {
    const result = await callback({
      execute: (sql, params) => query(sql, params),
      query: (sql, params) => query(sql, params)
    });
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// 初始化数据库表结构
function initDatabase() {
  console.log('正在初始化 SQLite 数据库...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT DEFAULT NULL,
      unionid TEXT DEFAULT NULL,
      phone TEXT DEFAULT NULL,
      nickname TEXT DEFAULT NULL,
      avatar TEXT DEFAULT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(openid),
      UNIQUE(phone)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      type INTEGER NOT NULL DEFAULT 1,
      invite_code TEXT NOT NULL,
      creator_id INTEGER NOT NULL,
      is_locked INTEGER NOT NULL DEFAULT 0,
      auto_lock_days INTEGER DEFAULT NULL,
      auto_lock_at TEXT DEFAULT NULL,
      locked_at TEXT DEFAULT NULL,
      locked_by INTEGER DEFAULT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(invite_code)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role INTEGER NOT NULL DEFAULT 3,
      joined_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(ledger_id, user_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      can_add INTEGER NOT NULL DEFAULT 1,
      can_edit INTEGER NOT NULL DEFAULT 2,
      can_delete INTEGER NOT NULL DEFAULT 2,
      can_reimburse INTEGER NOT NULL DEFAULT 2,
      can_export INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(ledger_id, member_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS virtual_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT NULL,
      created_by INTEGER NOT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      icon TEXT DEFAULT NULL,
      type INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_system INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      type INTEGER NOT NULL DEFAULT 1,
      transaction_date TEXT NOT NULL,
      remark TEXT DEFAULT NULL,
      payee_id INTEGER DEFAULT NULL,
      is_virtual_payee INTEGER NOT NULL DEFAULT 0,
      reimburse_status INTEGER NOT NULL DEFAULT 0,
      reimbursed_at TEXT DEFAULT NULL,
      reimbursed_by INTEGER DEFAULT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transaction_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS exports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER DEFAULT NULL,
      start_date TEXT DEFAULT NULL,
      end_date TEXT DEFAULT NULL,
      filter_status INTEGER DEFAULT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      expired_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 插入默认分类数据
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE is_system = 1').get().count;
  
  if (categoryCount === 0) {
    console.log('正在插入系统默认分类...');
    
    // 支出分类
    const expenseCategories = [
      ['餐饮', 'food', 1, 1],
      ['交通', 'transport', 1, 2],
      ['住宿', 'hotel', 1, 3],
      ['办公用品', 'office', 1, 4],
      ['通讯', 'phone', 1, 5],
      ['差旅', 'travel', 1, 6],
      ['其他', 'other', 1, 7]
    ];
    
    // 收入分类
    const incomeCategories = [
      ['工资', 'salary', 2, 1],
      ['报销', 'reimburse', 2, 2],
      ['其他收入', 'other_income', 2, 3]
    ];
    
    const insertCategory = db.prepare(
      'INSERT INTO categories (ledger_id, name, icon, type, sort_order, is_system, status) VALUES (?, ?, ?, ?, ?, 1, 1)'
    );
    
    expenseCategories.forEach(([name, icon, type, sortOrder]) => {
      insertCategory.run(0, name, icon, type, sortOrder);
    });
    
    incomeCategories.forEach(([name, icon, type, sortOrder]) => {
      insertCategory.run(0, name, icon, type, sortOrder);
    });
    
    console.log('默认分类数据已插入');
  }

  console.log('SQLite 数据库初始化完成');
}

// 初始化数据库
initDatabase();

module.exports = {
  query,
  getConnection,
  transaction,
  default: db
};
