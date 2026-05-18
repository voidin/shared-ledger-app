import { get, post } from '../utils/request'

export function getLockStatus(ledgerId) {
  return get(`/ledgers/${ledgerId}/lock/status`)
}

export function toggleLock(ledgerId, isLocked) {
  return post(`/ledgers/${ledgerId}/lock/toggle`, {
    isLocked
  })
}

export function updateLockSettings(ledgerId, data = {}) {
  return post(`/ledgers/${ledgerId}/lock/settings`, {
    autoLockEnabled: data.autoLockEnabled,
    autoLockDays: data.autoLockDays,
    lockDescription: data.lockDescription
  })
}
