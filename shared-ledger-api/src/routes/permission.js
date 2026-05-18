const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { checkLedgerAccess, isLedgerCreator } = require('../middleware/permission.js');
const {
  getMemberPermissions,
  getAllPermissions,
  updateMemberPermissions,
  removeMember,
  updatePermissionSchema
} = require('../controllers/permission.js');
const { validateBody } = require('../utils/validate.js');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  checkLedgerAccess,
  isLedgerCreator,
  getAllPermissions
);

router.get(
  '/:memberId',
  checkLedgerAccess,
  isLedgerCreator,
  getMemberPermissions
);

router.put(
  '/:memberId',
  checkLedgerAccess,
  isLedgerCreator,
  validateBody(updatePermissionSchema),
  updateMemberPermissions
);

router.delete(
  '/:memberId',
  checkLedgerAccess,
  isLedgerCreator,
  removeMember
);

module.exports = router;
