const TransactionModel = require('../models/transaction.js');
const TransactionImageModel = require('../models/transactionImage.js');
const { success, created, error, paginate, noContent } = require('../utils/response.js');

const transactionController = {
  async createTransaction(req, res, next) {
    try {
      const ledgerId = req.params.ledgerId;
      const userId = req.user.userId;
      console.log('Controller - ledgerId:', ledgerId, 'userId:', userId);
      const {
        category_id,
        amount,
        type,
        transaction_date,
        remark,
        payee_id,
        is_virtual_payee,
        reimburse_status,
        images
      } = req.body;

      if (!category_id) {
        return error(res, '分类不能为空', 400);
      }

      if (!amount || amount <= 0) {
        return error(res, '金额必须大于0', 400);
      }

      if (!type || (type !== 1 && type !== 2)) {
        return error(res, '类型必须是1(收入)或2(支出)', 400);
      }

      const transaction = await TransactionModel.create({
        ledger_id: ledgerId,
        creator_id: userId,
        user_id: userId,
        category_id,
        amount,
        type,
        transaction_date,
        description: '',
        remark: remark || null,
        payee_id: payee_id || null,
        is_virtual_payee: is_virtual_payee || 0,
        reimburse_status: reimburse_status || 0
      });

      return created(res, transaction, '账目创建成功');
    } catch (err) {
      console.error('Create transaction error:', err);
      next(err);
    }
  },

  async getTransactions(req, res, next) {
    try {
      const ledgerId = req.params.ledgerId;
      console.log('Controller getTransactions - ledgerId:', ledgerId);
      const {
        page = 1,
        pageSize = 20,
        category_id,
        start_date,
        end_date,
        reimburse_status,
        keyword
      } = req.query;

      const result = await TransactionModel.findByLedgerId(ledgerId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        categoryId: category_id,
        startDate: start_date,
        endDate: end_date,
        reimburseStatus: reimburse_status !== undefined ? parseInt(reimburse_status) : undefined,
        keyword
      });

      return paginate(res, result.list, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }, '获取账目列表成功');
    } catch (err) {
      console.error('Get transactions error:', err);
      next(err);
    }
  },

  async getTransactionById(req, res, next) {
    try {
      const { id } = req.params;

      const transaction = await TransactionModel.findById(id);
      if (!transaction) {
        return error(res, '账目不存在', 404);
      }

      return success(res, transaction, '获取账目详情成功');
    } catch (err) {
      console.error('Get transaction error:', err);
      next(err);
    }
  },

  async updateTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const {
        category_id,
        amount,
        type,
        transaction_date,
        remark,
        payee_id,
        is_virtual_payee,
        reimburse_status
      } = req.body;

      const existingTransaction = await TransactionModel.findById(id);
      if (!existingTransaction) {
        return error(res, '账目不存在', 404);
      }

      const updateData = {};
      if (category_id !== undefined) updateData.category_id = category_id;
      if (amount !== undefined) updateData.amount = amount;
      if (type !== undefined) updateData.type = type;
      if (transaction_date !== undefined) updateData.transaction_date = transaction_date;
      if (remark !== undefined) updateData.remark = remark;
      if (payee_id !== undefined) updateData.payee_id = payee_id;
      if (is_virtual_payee !== undefined) updateData.is_virtual_payee = is_virtual_payee;
      if (reimburse_status !== undefined) updateData.reimburse_status = reimburse_status;

      const transaction = await TransactionModel.update(id, updateData);
      return success(res, transaction, '账目更新成功');
    } catch (err) {
      console.error('Update transaction error:', err);
      next(err);
    }
  },

  async deleteTransaction(req, res, next) {
    try {
      const { id } = req.params;

      const existingTransaction = await TransactionModel.findById(id);
      if (!existingTransaction) {
        return error(res, '账目不存在', 404);
      }

      const deleted = await TransactionModel.delete(id);
      if (!deleted) {
        return error(res, '账目删除失败', 400);
      }

      return noContent(res);
    } catch (err) {
      console.error('Delete transaction error:', err);
      next(err);
    }
  },

  async markReimbursed(req, res, next) {
    try {
      const { id } = req.params;
      const { reimburse_status } = req.body;

      if (reimburse_status === undefined || reimburse_status === null) {
        return error(res, '报销状态不能为空', 400);
      }

      if (![0, 1, 2].includes(parseInt(reimburse_status))) {
        return error(res, '报销状态必须是0(不适用)、1(未报销)或2(已报销)', 400);
      }

      const existingTransaction = await TransactionModel.findById(id);
      if (!existingTransaction) {
        return error(res, '账目不存在', 404);
      }

      const successResult = await TransactionModel.markReimbursed(id, parseInt(reimburse_status));
      if (!successResult) {
        return error(res, '报销状态更新失败', 400);
      }

      const updatedTransaction = await TransactionModel.findById(id);
      return success(res, updatedTransaction, '报销状态更新成功');
    } catch (err) {
      console.error('Mark reimbursed error:', err);
      next(err);
    }
  }
};

module.exports = {
  transactionController,
  ...transactionController
};
