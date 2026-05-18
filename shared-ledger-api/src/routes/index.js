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

router.use('/ledgers', ledgerRoutes);

router.use('/ledgers/:id/virtual-members', virtualMemberRoutes);

router.use('/ledgers/:id/members', permissionRoutes);

router.use('/ledgers/:id', lockRoutes);

router.use('/ledgers/:id', statisticsRoutes);

router.use('/categories', categoryRoutes);

router.use('/transactions', transactionRoutes);

router.use('/exports', exportRoutes);

router.use('/upload', uploadRoutes);

module.exports = router;
