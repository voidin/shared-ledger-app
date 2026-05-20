const { query } = require('../config/database.js');

const ExportModel = {
  async create(data) {
    const { id, ledger_id, user_id, filename, file_path, record_count, filters, file_size } = data;
    
    const sql = `
      INSERT INTO exports 
      (id, ledger_id, user_id, filename, file_path, record_count, filters, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    
    await query(sql, [
      id,
      ledger_id,
      user_id,
      filename,
      file_path,
      record_count,
      filters || '{}',
      file_size || 0
    ]);
    
    return this.findById(id);
  },

  async findById(id) {
    const sql = `
      SELECT 
        id,
        ledger_id,
        user_id,
        filename,
        file_path,
        record_count,
        filters,
        file_size,
        created_at
      FROM exports 
      WHERE id = ?
    `;
    
    const rows = await query(sql, [id]);
    const record = rows[0] || null;
    
    if (record && record.filters) {
      try {
        record.filters = JSON.parse(record.filters);
      } catch (e) {
        record.filters = {};
      }
    }
    
    return record;
  },

  async findByLedgerId(ledgerId, limit = 50) {
    const sql = `
      SELECT 
        id,
        ledger_id,
        user_id,
        filename,
        file_path,
        record_count,
        filters,
        file_size,
        created_at
      FROM exports 
      WHERE ledger_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const rows = await query(sql, [ledgerId, limit]);
    
    return rows.map(record => {
      if (record.filters) {
        try {
          record.filters = JSON.parse(record.filters);
        } catch (e) {
          record.filters = {};
        }
      }
      return record;
    });
  },

  async findByUserId(userId, limit = 50) {
    const sql = `
      SELECT 
        id,
        ledger_id,
        user_id,
        filename,
        file_path,
        record_count,
        filters,
        file_size,
        created_at
      FROM exports 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const rows = await query(sql, [userId, limit]);
    
    return rows.map(record => {
      if (record.filters) {
        try {
          record.filters = JSON.parse(record.filters);
        } catch (e) {
          record.filters = {};
        }
      }
      return record;
    });
  },

  async delete(id) {
    const sql = 'DELETE FROM exports WHERE id = ?';
    const result = await query(sql, [id]);
    return result.changes > 0;
  },

  async deleteByLedgerId(ledgerId) {
    const sql = 'DELETE FROM exports WHERE ledger_id = ?';
    const result = await query(sql, [ledgerId]);
    return result.changes;
  },

  async deleteOldExports(days = 30) {
    const sql = `
      DELETE FROM exports 
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `;
    const result = await query(sql, [days]);
    return result.changes;
  },

  async getStats(ledgerId = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_count,
        SUM(record_count) as total_records,
        SUM(file_size) as total_size
      FROM exports
    `;
    
    const params = [];
    if (ledgerId) {
      sql += ' WHERE ledger_id = ?';
      params.push(ledgerId);
    }
    
    const rows = await query(sql, params);
    return rows[0] || {
      total_count: 0,
      total_records: 0,
      total_size: 0
    };
  }
};

module.exports = ExportModel;
