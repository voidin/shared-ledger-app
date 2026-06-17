const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.js');
const {
  createLedger,
  getMyLedgers,
  getLedgerById,
  updateLedger,
  deleteLedger,
  joinLedger,
  getMembers,
  removeMember,
  updateMemberRole
} = require('../controllers/ledger.js');

router.post('/', authenticate, createLedger);

router.get('/', authenticate, getMyLedgers);

router.get('/:id', authenticate, getLedgerById);

router.put('/:id', authenticate, updateLedger);

router.delete('/:id', authenticate, deleteLedger);

router.post('/join', authenticate, joinLedger);

router.get('/:id/members', authenticate, getMembers);

router.delete('/:id/members/:userId', authenticate, removeMember);

router.put('/:id/members/:userId/role', authenticate, updateMemberRole);

module.exports = router;
