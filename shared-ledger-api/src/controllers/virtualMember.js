import Joi from 'joi';
import { VirtualMemberModel } from '../models/virtualMember.js';
import { PermissionModel } from '../models/ledgerPermission.js';
import { success, created, error } from '../utils/response.js';
import { AppError } from '../middleware/error.js';

const createVirtualMemberSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  avatar: Joi.string().uri().allow(null, '').optional(),
  type: Joi.string().valid('payee', 'payer').default('payee')
});

const updateVirtualMemberSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional(),
  avatar: Joi.string().uri().allow(null, '').optional(),
  type: Joi.string().valid('payee', 'payer').optional()
});

export async function createVirtualMember(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const userId = req.user.id;
    const { name, avatar, type } = req.body;

    const permission = await PermissionModel.findByMemberId(userId, ledgerId);
    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role !== 1) {
      return error(res, '只有账本创建者可以添加虚拟成员', 403);
    }

    const existing = await VirtualMemberModel.findByNameAndLedgerId(name, ledgerId);
    if (existing) {
      return error(res, '该账本中已存在同名虚拟成员', 400);
    }

    const virtualMember = await VirtualMemberModel.create({
      ledger_id: ledgerId,
      name,
      avatar,
      type
    });

    return created(res, virtualMember, '虚拟成员创建成功');
  } catch (err) {
    next(err);
  }
}

export async function getVirtualMembers(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const userId = req.user.id;
    const { type } = req.query;

    const permission = await PermissionModel.findByMemberId(userId, ledgerId);
    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    const members = await VirtualMemberModel.findByLedgerId(ledgerId, { type });

    return success(res, members, '获取虚拟成员列表成功');
  } catch (err) {
    next(err);
  }
}

export async function updateVirtualMember(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const memberId = parseInt(req.params.mid);
    const userId = req.user.id;
    const { name, avatar, type } = req.body;

    const permission = await PermissionModel.findByMemberId(userId, ledgerId);
    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role !== 1) {
      return error(res, '只有账本创建者可以修改虚拟成员', 403);
    }

    const member = await VirtualMemberModel.findById(memberId);
    if (!member) {
      return error(res, '虚拟成员不存在', 404);
    }

    if (member.ledger_id !== ledgerId) {
      return error(res, '该虚拟成员不属于当前账本', 400);
    }

    if (name && name !== member.name) {
      const existing = await VirtualMemberModel.findByNameAndLedgerId(name, ledgerId, memberId);
      if (existing) {
        return error(res, '该账本中已存在同名虚拟成员', 400);
      }
    }

    const updated = await VirtualMemberModel.update(memberId, { name, avatar, type });

    return success(res, updated, '虚拟成员更新成功');
  } catch (err) {
    next(err);
  }
}

export async function deleteVirtualMember(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const memberId = parseInt(req.params.mid);
    const userId = req.user.id;

    const permission = await PermissionModel.findByMemberId(userId, ledgerId);
    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role !== 1) {
      return error(res, '只有账本创建者可以删除虚拟成员', 403);
    }

    const member = await VirtualMemberModel.findById(memberId);
    if (!member) {
      return error(res, '虚拟成员不存在', 404);
    }

    if (member.ledger_id !== ledgerId) {
      return error(res, '该虚拟成员不属于当前账本', 400);
    }

    const association = await VirtualMemberModel.hasAssociatedEntries(memberId);
    if (association.hasEntries) {
      return error(res, `该虚拟成员已被 ${association.count} 条账目引用，无法删除`, 400);
    }

    await VirtualMemberModel.delete(memberId);

    return success(res, null, '虚拟成员删除成功');
  } catch (err) {
    next(err);
  }
}

export async function getPayees(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const userId = req.user.id;

    const permission = await PermissionModel.findByMemberId(userId, ledgerId);
    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    const payees = await VirtualMemberModel.getPayeesByLedgerId(ledgerId);

    return success(res, payees, '获取收支人列表成功');
  } catch (err) {
    next(err);
  }
}

export default {
  createVirtualMember,
  getVirtualMembers,
  updateVirtualMember,
  deleteVirtualMember,
  getPayees,
  createVirtualMemberSchema,
  updateVirtualMemberSchema
};
