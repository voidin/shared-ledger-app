import { get, post, put, del } from '../utils/request'

export function createLedger(data) {
  return post('/ledgers', data)
}

export function getLedgerList() {
  return get('/ledgers')
}

export function getLedgerDetail(id) {
  return get(`/ledgers/${id}`)
}

export function updateLedger(id, data) {
  return put(`/ledgers/${id}`, data)
}

export function deleteLedger(id) {
  return del(`/ledgers/${id}`)
}

export function joinLedger(inviteCode) {
  return post('/ledgers/join', { inviteCode })
}

export function getLedgerMembers(id) {
  return get(`/ledgers/${id}/members`)
}

export function removeMember(ledgerId, userId) {
  return del(`/ledgers/${ledgerId}/members/${userId}`)
}

export function updateMemberRole(ledgerId, userId, role) {
  return put(`/ledgers/${ledgerId}/members/${userId}`, { role })
}
