import CategoryModel from '../models/category.js';
import { success, created, error, noContent } from '../utils/response.js';

export const categoryController = {
  async getCategories(req, res, next) {
    try {
      const { id: ledgerId } = req.params;
      const { include_system } = req.query;

      let categories;
      if (include_system === 'true') {
        categories = await CategoryModel.findByLedgerIdWithSystem(ledgerId);
      } else {
        categories = await CategoryModel.findByLedgerId(ledgerId);
      }

      return success(res, categories, '获取分类列表成功');
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { id: ledgerId } = req.params;
      const { name, icon, color, sort } = req.body;

      if (!name) {
        return error(res, '分类名称不能为空', 400);
      }

      const category = await CategoryModel.create({
        ledger_id: ledgerId,
        name,
        icon,
        color,
        sort,
        is_system: false
      });

      return created(res, category, '分类创建成功');
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, icon, color, sort } = req.body;

      const existingCategory = await CategoryModel.findById(id);
      if (!existingCategory) {
        return error(res, '分类不存在', 404);
      }

      if (existingCategory.is_system === 1) {
        return error(res, '系统预设分类不可修改', 403);
      }

      const category = await CategoryModel.update(id, {
        name,
        icon,
        color,
        sort
      });

      if (!category) {
        return error(res, '分类更新失败', 400);
      }

      return success(res, category, '分类更新成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const existingCategory = await CategoryModel.findById(id);
      if (!existingCategory) {
        return error(res, '分类不存在', 404);
      }

      if (existingCategory.is_system === 1) {
        return error(res, '系统预设分类不可删除', 403);
      }

      const deleted = await CategoryModel.delete(id);
      if (!deleted) {
        return error(res, '分类删除失败', 400);
      }

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }
};

export default categoryController;
