import LedgerModel from '../models/ledger.js';
import LedgerMemberModel from '../models/ledgerMember.js';
import { success, error, created } from '../utils/response.js';

const ROLE_CREATOR = 1;
const ROLE_ADMIN = 2;
const ROLE_MEMBER = 3;

async function checkPermission(ledgerId, userId, requiredRoles) {
  const role = await LedgerMemberModel.getMemberRole(ledgerId, userId);
  if (!role) {
    return false;
  }
  return requiredRoles.includes(role);
}

async function isCreatorOrAdmin(ledgerId, userId) {
  return checkPermission(ledgerId, userId, [ROLE_CREATOR, ROLE_ADMIN]);
}

async function isCreator(ledgerId, userId) {
  return checkPermission(ledgerId, userId, [ROLE_CREATOR]);
}

export async function createLedger(req, res) {
  try {
    const userId = req.user.userId;
    const { name, description, type, auto_lock_days } = req.body;

    if (!name || name.trim() === '') {
      return error(res, '请提供账本名称', 400);
    }

    if (name.length > 50) {
      return error(res, '账本名称不能超过50个字符', 400);
    }

    if (description && description.length > 200) {
      return error(res, '账本描述不能超过200个字符', 400);
    }

    const ledger = await LedgerModel.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      type: type || 1,
      creatorId: userId,
      autoLockDays: auto_lock_days || null
    });

    await LedgerMemberModel.addMember(ledger.id, userId, ROLE_CREATOR);

    return created(res, ledger, '账本创建成功');
  } catch (err) {
    console.error('Create ledger error:', err);
    return error(res, '创建账本失败，请稍后重试', 500);
  }
}

export async function getMyLedgers(req, res) {
  try {
    const userId = req.user.userId;
    const ledgers = await LedgerModel.findUserLedgers(userId);

    return success(res, ledgers, '获取账本列表成功');
  } catch (err) {
    console.error('Get ledgers error:', err);
    return error(res, '获取账本列表失败，请稍后重试', 500);
  }
}

export async function getLedgerById(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const ledger = await LedgerModel.findById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const isMember = await checkPermission(id, userId, [ROLE_CREATOR, ROLE_ADMIN, ROLE_MEMBER]);
    if (!isMember) {
      return error(res, '您不是该账本成员', 403);
    }

    const role = await LedgerMemberModel.getMemberRole(id, userId);

    return success(res, {
      ...ledger,
      user_role: role
    }, '获取账本详情成功');
  } catch (err) {
    console.error('Get ledger error:', err);
    return error(res, '获取账本详情失败，请稍后重试', 500);
  }
}

export async function updateLedger(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, description, type, auto_lock_days } = req.body;

    const ledger = await LedgerModel.findById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    if (ledger.creator_id !== userId) {
      return error(res, '只有创建者可以修改账本信息', 403);
    }

    if (name && name.trim() === '') {
      return error(res, '账本名称不能为空', 400);
    }

    if (name && name.length > 50) {
      return error(res, '账本名称不能超过50个字符', 400);
    }

    if (description && description.length > 200) {
      return error(res, '账本描述不能超过200个字符', 400);
    }

    const updatedLedger = await LedgerModel.update(id, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      type,
      auto_lock_days
    });

    return success(res, updatedLedger, '账本更新成功');
  } catch (err) {
    console.error('Update ledger error:', err);
    return error(res, '更新账本失败，请稍后重试', 500);
  }
}

export async function deleteLedger(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const ledger = await LedgerModel.findById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    if (!await isCreator(id, userId)) {
      return error(res, '只有创建者可以删除账本', 403);
    }

    await LedgerModel.delete(id);

    return success(res, null, '账本删除成功');
  } catch (err) {
    console.error('Delete ledger error:', err);
    return error(res, '删除账本失败，请稍后重试', 500);
  }
}

export async function joinLedger(req, res) {
  try {
    const userId = req.user.userId;
    const { invite_code } = req.body;

    if (!invite_code || invite_code.trim() === '') {
      return error(res, '请提供邀请码', 400);
    }

    const inviteCode = invite_code.trim().toUpperCase();
    const ledger = await LedgerModel.findByInviteCode(inviteCode);

    if (!ledger) {
      return error(res, '邀请码无效', 404);
    }

    const existingMember = await LedgerMemberModel.findByLedgerAndUser(ledger.id, userId);
    if (existingMember) {
      return error(res, '您已是该账本成员', 400);
    }

    await LedgerMemberModel.addMember(ledger.id, userId, ROLE_MEMBER);

    return success(res, {
      ledger_id: ledger.id,
      name: ledger.name,
      type: ledger.type
    }, '加入账本成功');
  } catch (err) {
    if (err.message === '用户已是账本成员') {
      return error(res, '您已是该账本成员', 400);
    }
    console.error('Join ledger error:', err);
    return error(res, '加入账本失败，请稍后重试', 500);
  }
}

export async function getMembers(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const ledger = await LedgerModel.findById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const isMember = await checkPermission(id, userId, [ROLE_CREATOR, ROLE_ADMIN, ROLE_MEMBER]);
    if (!isMember) {
      return error(res, '您不是该账本成员', 403);
    }

    const members = await LedgerMemberModel.findByLedgerId(id);

    const formattedMembers = members.map(member => ({
      id: member.id,
      user_id: member.user_id,
      nickname: member.nickname,
      avatar: member.avatar,
      phone: member.phone,
      role: member.role,
      role_name: getRoleName(member.role),
      joined_at: member.joined_at
    }));

    return success(res, formattedMembers, '获取成员列表成功');
  } catch (err) {
    console.error('Get members error:', err);
    return error(res, '获取成员列表失败，请稍后重试', 500);
  }
}

export async function removeMember(req, res) {
  try {
    const userId = req.user.userId;
    const { id, userId: targetUserId } = req.params;

    const ledger = await LedgerModel.findById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const targetRole = await LedgerMemberModel.getMemberRole(id, targetUserId);
    if (!targetRole) {
      return error(res, '该用户不是账本成员', 404);
    }

    if (parseInt(targetUserId) === userId) {
      return error(res, '不能移除自己', 400);
    }

    if (targetRole === ROLE_CREATOR) {
      return error(res, '无法移除创建者', 400);
    }

    if (!await isCreatorOrAdmin(id, userId)) {
      return error(res, '只有创建者或管理员可以移除成员', 403);
    }

    await LedgerMemberModel.removeMember(id, targetUserId);

    return success(res, null, '成员移除成功');
  } catch (err) {
    if (err.message === '成员不存在') {
      return error(res, '该用户不是账本成员', 404);
    }
    console.error('Remove member error:', err);
    return error(res, '移除成员失败，请稍后重试', 500);
  }
}

export async function updateMemberRole(req, res) {
  try {
    const userId = req.user.userId;
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;

    if (!role || ![ROLE_ADMIN, ROLE_MEMBER].includes(role)) {
      return error(res, '无效的角色值，只能设置为管理员(2)或普通成员(3)', 400);
    }

    const ledger = await LedgerModel.findById(id);
    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    const targetRole = await LedgerMemberModel.getMemberRole(id, targetUserId);
    if (!targetRole) {
      return error(res, '该用户不是账本成员', 404);
    }

    if (targetRole === ROLE_CREATOR) {
      return error(res, '无法修改创建者角色', 400);
    }

    if (!await isCreator(id, userId)) {
      return error(res, '只有创建者可以设置成员角色', 403);
    }

    await LedgerMemberModel.updateRole(id, targetUserId, role);

    return success(res, {
      user_id: targetUserId,
      role,
      role_name: getRoleName(role)
    }, '角色设置成功');
  } catch (err) {
    if (err.message === '成员不存在') {
      return error(res, '该用户不是账本成员', 404);
    }
    if (err.message === '无效的角色值') {
      return error(res, err.message, 400);
    }
    console.error('Update role error:', err);
    return error(res, '设置角色失败，请稍后重试', 500);
  }
}

function getRoleName(role) {
  switch (role) {
    case ROLE_CREATOR:
      return '创建者';
    case ROLE_ADMIN:
      return '管理员';
    case ROLE_MEMBER:
      return '普通成员';
    default:
      return '未知';
  }
}

export default {
  createLedger,
  getMyLedgers,
  getLedgerById,
  updateLedger,
  deleteLedger,
  joinLedger,
  getMembers,
  removeMember,
  updateMemberRole
};
