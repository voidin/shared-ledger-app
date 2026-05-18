import { get, put } from '../utils/request'

export function getMemberPermissions(ledgerId, memberId) {
  return get(`/ledger/${ledgerId}/member/${memberId}/permissions`)
}

export function updateMemberPermissions(ledgerId, memberId, data) {
  return put(`/ledger/${ledgerId}/member/${memberId}/permissions`, data)
}
