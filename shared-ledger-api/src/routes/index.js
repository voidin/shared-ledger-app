const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const ledgerRoutes = require('./ledger');
const transactionRoutes = require('./transaction');
const categoryRoutes = require('./category');
const virtualMemberRoutes = require('./virtualMember');
const permissionRoutes = require('./permission');
const statisticsRoutes = require('./statistics');
const exportRoutes = require('./export');
const uploadRoutes = require('./upload');
const lockRoutes = require('./lock');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/exports', exportRoutes);
router.use('/upload', uploadRoutes);

router.use('/ledgers/:ledgerId/transactions', transactionRoutes);
router.use('/ledgers/:ledgerId/virtual-members', virtualMemberRoutes);
router.use('/ledgers/:ledgerId/members', permissionRoutes);
router.use('/ledgers/:ledgerId/lock', lockRoutes);
router.use('/ledgers/:ledgerId/statistics', statisticsRoutes);
router.use('/ledgers', ledgerRoutes);

router.use('/transactions', transactionRoutes);

module.exports = router;
