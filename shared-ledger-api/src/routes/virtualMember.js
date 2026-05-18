const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { checkLedgerAccess } = require('../middleware/permission.js');
const {
  createVirtualMember,
  getVirtualMembers,
  updateVirtualMember,
  deleteVirtualMember,
  getPayees,
  createVirtualMemberSchema,
  updateVirtualMemberSchema
} = require('../controllers/virtualMember.js');
const { validateBody } = require('../utils/validate.js');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/payees', checkLedgerAccess, getPayees);

router.post(
  '/',
  checkLedgerAccess,
  validateBody(createVirtualMemberSchema),
  createVirtualMember
);

router.get(
  '/',
  checkLedgerAccess,
  getVirtualMembers
);

router.put(
  '/:mid',
  checkLedgerAccess,
  validateBody(updateVirtualMemberSchema),
  updateVirtualMember
);

router.delete(
  '/:mid',
  checkLedgerAccess,
  deleteVirtualMember
);

module.exports = router;
