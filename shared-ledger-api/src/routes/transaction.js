const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.js');

router.post('/ledgers/:id/transactions', transactionController.createTransaction);

router.get('/ledgers/:id/transactions', transactionController.getTransactions);

router.get('/transactions/:id', transactionController.getTransactionById);

router.put('/transactions/:id', transactionController.updateTransaction);

router.delete('/transactions/:id', transactionController.deleteTransaction);

router.put('/transactions/:id/reimburse', transactionController.markReimbursed);

module.exports = router;
