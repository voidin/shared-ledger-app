const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.js');
const transactionController = require('../controllers/transaction.js');

function extractLedgerId(req, res, next) {
  const urlParts = req.originalUrl.split('/');
  const ledgersIndex = urlParts.findIndex(p => p === 'ledgers');
  if (ledgersIndex !== -1 && urlParts[ledgersIndex + 1]) {
    req.params.ledgerId = urlParts[ledgersIndex + 1];
  }
  next();
}

router.post('/', authenticate, extractLedgerId, async (req, res, next) => {
  try {
    await transactionController.createTransaction(req, res, next);
  } catch (err) {
    console.error('Transaction route error:', err);
    next(err);
  }
});

router.get('/', authenticate, extractLedgerId, async (req, res, next) => {
  try {
    await transactionController.getTransactions(req, res, next);
  } catch (err) {
    console.error('Transaction route error:', err);
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    await transactionController.getTransactionById(req, res, next);
  } catch (err) {
    console.error('Transaction route error:', err);
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    await transactionController.updateTransaction(req, res, next);
  } catch (err) {
    console.error('Transaction route error:', err);
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await transactionController.deleteTransaction(req, res, next);
  } catch (err) {
    console.error('Transaction route error:', err);
    next(err);
  }
});

router.put('/:id/reimburse', authenticate, async (req, res, next) => {
  try {
    await transactionController.markReimbursed(req, res, next);
  } catch (err) {
    console.error('Transaction route error:', err);
    next(err);
  }
});

module.exports = router;
