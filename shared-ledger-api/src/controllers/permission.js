const Joi = require('joi');
const { PermissionModel } = require('../models/ledgerPermission.js');
const { UserModel } = require('../models/user.js');
const { success, error } = require('../utils/response.js');

const updatePermissionSchema = Joi.object({
  role: Joi.number().valid(1, 2, 3).optional(),
  can_add: Joi.number().valid(0, 1, 2).optional(),
  can_edit: Joi.number().valid(0, 1, 2).optional(),
  can_delete: Joi.number().valid(0, 1, 2).optional(),
  can_reimburse: Joi.number().valid(0, 1, 2).optional(),
  can_export: Joi.number().valid(0, 1, 2).optional()
});

async function getMemberPermissions(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const currentUserId = req.user.id;

    const currentPermission = await PermissionModel.findByMemberId(currentUserId, ledgerId);
    if (!currentPermission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (currentPermission.role !== 1) {
      return error(res, '只有账本创建者可以查看成员权限', 403);
    }

    const memberPermission = await PermissionModel.findByMemberId(memberId, ledgerId);
    if (!memberPermission) {
      return error(res, '该成员不在该账本中', 404);
    }

    const user = await UserModel.findById(memberId);

    const result = {
      ...memberPermission,
      user: user ? {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone
      } : null
    };

    return success(res, result, '获取成员权限成功');
  } catch (err) {
    next(err);
  }
}

async function getAllPermissions(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const userId = req.user.id;

    const permission = await PermissionModel.findByMemberId(userId, ledgerId);
    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role !== 1) {
      return error(res, '只有账本创建者可以查看所有成员权限', 403);
    }

    const permissions = await PermissionModel.findByLedgerId(ledgerId);

    const result = await Promise.all(permissions.map(async (perm) => {
      const user = await UserModel.findById(perm.user_id);
      return {
        ...perm,
        user: user ? {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone
        } : null
      };
    }));

    return success(res, result, '获取所有成员权限成功');
  } catch (err) {
    next(err);
  }
}

async function updateMemberPermissions(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const currentUserId = req.user.id;
    const { role, can_add, can_edit, can_delete, can_reimburse, can_export } = req.body;

    const currentPermission = await PermissionModel.findByMemberId(currentUserId, ledgerId);
    if (!currentPermission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (currentPermission.role !== 1) {
      return error(res, '只有账本创建者可以修改成员权限', 403);
    }

    const memberPermission = await PermissionModel.findByMemberId(memberId, ledgerId);
    if (!memberPermission) {
      return error(res, '该成员不在该账本中', 404);
    }

    if (memberPermission.role === 1) {
      return error(res, '无法修改账本创建者的权限', 400);
    }

    const updated = await PermissionModel.update(memberId, ledgerId, {
      role,
      can_add,
      can_edit,
      can_delete,
      can_reimburse,
      can_export
    });

    return success(res, updated, '成员权限更新成功');
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const currentUserId = req.user.id;

    const currentPermission = await PermissionModel.findByMemberId(currentUserId, ledgerId);
    if (!currentPermission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (currentPermission.role !== 1) {
      return error(res, '只有账本创建者可以将成员移出账本', 403);
    }

    const memberPermission = await PermissionModel.findByMemberId(memberId, ledgerId);
    if (!memberPermission) {
      return error(res, '该成员不在该账本中', 404);
    }

    if (memberPermission.role === 1) {
      return error(res, '无法移除账本创建者', 400);
    }

    await PermissionModel.deleteByMemberId(memberId, ledgerId);

    return success(res, null, '成员已移出账本');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMemberPermissions,
  getAllPermissions,
  updateMemberPermissions,
  removeMember,
  updatePermissionSchema
};
