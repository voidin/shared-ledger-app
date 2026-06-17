import { getUserInfo } from './storage'

export function hasPermission(permission) {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.permissions) {
    return false
  }
  
  if (typeof permission === 'string') {
    return userInfo.permissions.includes(permission)
  }
  
  if (Array.isArray(permission)) {
    return permission.some(p => userInfo.permissions.includes(p))
  }
  
  return false
}

export function hasRole(role) {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.roles) {
    return false
  }
  
  if (typeof role === 'string') {
    return userInfo.roles.includes(role)
  }
  
  if (Array.isArray(role)) {
    return role.some(r => userInfo.roles.includes(r))
  }
  
  return false
}

export function isAdmin() {
  return hasRole('admin')
}

export function isLedgerOwner(ledgerId) {
  const userInfo = getUserInfo()
  if (!userInfo) return false
  return userInfo.ownedLedgers?.includes(ledgerId) || false
}

export function canEditExpense(expense) {
  const userInfo = getUserInfo()
  if (!userInfo) return false
  return expense.creatorId === userInfo.id || isAdmin()
}

export function canDeleteExpense(expense) {
  return canEditExpense(expense)
}

export function canManageMembers(ledgerId) {
  return isLedgerOwner(ledgerId) || isAdmin()
}

export function getPermissionList() {
  const userInfo = getUserInfo()
  return userInfo?.permissions || []
}

export function checkAuth() {
  const userInfo = getUserInfo()
  return !!userInfo
}
