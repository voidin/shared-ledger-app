import { query } from '../config/database.js';
import { PermissionModel } from '../models/ledgerPermission.js';
import { AppError } from './error.js';
import { error } from '../utils/response.js';

export const PERMISSION_LEVEL = {
  NONE: 0,
  ALL: 1,
  SELF_ONLY: 2
};

export const ROLE = {
  CREATOR: 1,
  ADMIN: 2,
  MEMBER: 3
};

export async function checkLedgerAccess(req, res, next) {
  try {
    const ledgerId = parseInt(req.params.id) || parseInt(req.params.ledgerId);
    const userId = req.user.id;

    if (!ledgerId) {
      return error(res, '账本ID无效', 400);
    }

    const permission = await PermissionModel.findByMemberId(userId, ledgerId);

    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    req.ledgerPermission = permission;
    req.ledgerId = ledgerId;

    next();
  } catch (err) {
    next(err);
  }
}

export async function checkLedgerLock(req, res, next) {
  try {
    const ledgerId = req.ledgerId || parseInt(req.params.id);

    const [ledger] = await query(
      'SELECT is_locked, locked_at FROM ledgers WHERE id = ? AND status = 1',
      [ledgerId]
    );

    if (!ledger) {
      return error(res, '账本不存在', 404);
    }

    if (ledger.is_locked) {
      const lockDate = new Date(ledger.locked_at).toLocaleDateString('zh-CN');
      return error(res, `账本已于 ${lockDate} 锁定，禁止修改`, 403);
    }

    req.ledger = ledger;
    next();
  } catch (err) {
    next(err);
  }
}

export function checkPermission(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const ledgerId = req.ledgerId;
      const permission = req.ledgerPermission;

      if (!permission) {
        return error(res, '您不是该账本成员', 403);
      }

      if (permission.role === ROLE.CREATOR) {
        return next();
      }

      const actionMap = {
        add: 'can_add',
        edit: 'can_edit',
        delete: 'can_delete',
        reimburse: 'can_reimburse',
        export: 'can_export'
      };

      const permissionField = actionMap[action];
      if (!permissionField) {
        return error(res, '无效的操作类型', 400);
      }

      const permissionValue = permission[permissionField];

      if (permissionValue === PERMISSION_LEVEL.NONE) {
        return error(res, '您没有执行此操作的权限', 403);
      }

      if (permissionValue === PERMISSION_LEVEL.ALL) {
        return next();
      }

      if (permissionValue === PERMISSION_LEVEL.SELF_ONLY) {
        req.selfOnly = true;
        return next();
      }

      return error(res, '权限配置无效', 500);
    } catch (err) {
      next(err);
    }
  };
}

export async function canAdd(req, res, next) {
  try {
    const userId = req.user.id;
    const ledgerId = req.ledgerId;
    const permission = req.ledgerPermission;

    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role === ROLE.CREATOR) {
      return next();
    }

    if (permission.can_add === PERMISSION_LEVEL.NONE) {
      return error(res, '您没有添加账目的权限', 403);
    }

    if (permission.can_add === PERMISSION_LEVEL.ALL) {
      return next();
    }

    if (permission.can_add === PERMISSION_LEVEL.SELF_ONLY) {
      req.creatorCheck = true;
      return next();
    }

    return error(res, '权限配置无效', 500);
  } catch (err) {
    next(err);
  }
}

export async function canEdit(req, res, next) {
  try {
    const userId = req.user.id;
    const ledgerId = req.ledgerId;
    const permission = req.ledgerPermission;

    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role === ROLE.CREATOR) {
      return next();
    }

    if (permission.can_edit === PERMISSION_LEVEL.NONE) {
      return error(res, '您没有修改账目的权限', 403);
    }

    if (permission.can_edit === PERMISSION_LEVEL.ALL) {
      return next();
    }

    if (permission.can_edit === PERMISSION_LEVEL.SELF_ONLY) {
      req.creatorCheck = true;
      return next();
    }

    return error(res, '权限配置无效', 500);
  } catch (err) {
    next(err);
  }
}

export async function canDelete(req, res, next) {
  try {
    const userId = req.user.id;
    const ledgerId = req.ledgerId;
    const permission = req.ledgerPermission;

    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role === ROLE.CREATOR) {
      return next();
    }

    if (permission.can_delete === PERMISSION_LEVEL.NONE) {
      return error(res, '您没有删除账目的权限', 403);
    }

    if (permission.can_delete === PERMISSION_LEVEL.ALL) {
      return next();
    }

    if (permission.can_delete === PERMISSION_LEVEL.SELF_ONLY) {
      req.creatorCheck = true;
      return next();
    }

    return error(res, '权限配置无效', 500);
  } catch (err) {
    next(err);
  }
}

export async function canReimburse(req, res, next) {
  try {
    const userId = req.user.id;
    const ledgerId = req.ledgerId;
    const permission = req.ledgerPermission;

    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role === ROLE.CREATOR) {
      return next();
    }

    if (permission.can_reimburse === PERMISSION_LEVEL.NONE) {
      return error(res, '您没有修改报销状态的权限', 403);
    }

    if (permission.can_reimburse === PERMISSION_LEVEL.ALL) {
      return next();
    }

    if (permission.can_reimburse === PERMISSION_LEVEL.SELF_ONLY) {
      req.creatorCheck = true;
      return next();
    }

    return error(res, '权限配置无效', 500);
  } catch (err) {
    next(err);
  }
}

export async function canExport(req, res, next) {
  try {
    const userId = req.user.id;
    const ledgerId = req.ledgerId;
    const permission = req.ledgerPermission;

    if (!permission) {
      return error(res, '您不是该账本成员', 403);
    }

    if (permission.role === ROLE.CREATOR) {
      return next();
    }

    if (permission.can_export === PERMISSION_LEVEL.NONE) {
      return error(res, '您没有导出报表的权限', 403);
    }

    next();
  } catch (err) {
    next(err);
  }
}

export async function verifyEntryCreator(req, res, next) {
  try {
    if (!req.creatorCheck) {
      return next();
    }

    const entryId = req.params.entryId || req.params.eid || req.body.entry_id;
    if (!entryId) {
      return next();
    }

    const userId = req.user.id;

    const [expenseEntry] = await query(
      'SELECT created_by FROM expense_entries WHERE id = ? AND status = 1',
      [entryId]
    );

    if (expenseEntry) {
      if (expenseEntry.created_by !== userId) {
        return error(res, '您只能操作自己创建的账目', 403);
      }
      return next();
    }

    const [incomeEntry] = await query(
      'SELECT created_by FROM income_entries WHERE id = ? AND status = 1',
      [entryId]
    );

    if (incomeEntry) {
      if (incomeEntry.created_by !== userId) {
        return error(res, '您只能操作自己创建的账目', 403);
      }
      return next();
    }

    next();
  } catch (err) {
    next(err);
  }
}

export async function isLedgerCreator(req, res, next) {
  try {
    const userId = req.user.id;
    const ledgerId = req.ledgerId;

    const isCreator = await PermissionModel.isCreator(userId, ledgerId);

    if (!isCreator) {
      return error(res, '只有账本创建者可以执行此操作', 403);
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const permission = req.ledgerPermission;

      if (!permission) {
        return error(res, '您不是该账本成员', 403);
      }

      if (!roles.includes(permission.role)) {
        return error(res, '您的角色无权执行此操作', 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export default {
  PERMISSION_LEVEL,
  ROLE,
  checkLedgerAccess,
  checkLedgerLock,
  checkPermission,
  canAdd,
  canEdit,
  canDelete,
  canReimburse,
  canExport,
  verifyEntryCreator,
  isLedgerCreator,
  requireRole
};
