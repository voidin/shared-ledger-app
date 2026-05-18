const express = require('express');
const router = express.Router();
const { 
  exportExpenses, 
  downloadExport, 
  getExportHistory,
  deleteExport 
} = require('../controllers/export.js');
const { authenticate } = require('../middleware/auth.js');

router.post('/:id/export', authenticate, exportExpenses);

router.get('/exports/:exportId/download', downloadExport);

router.get('/:id/export-history', authenticate, getExportHistory);

router.delete('/exports/:exportId', authenticate, deleteExport);

module.exports = router;
