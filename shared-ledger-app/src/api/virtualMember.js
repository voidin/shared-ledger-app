import { get, post, put, del } from '../utils/request'

export function createVirtualMember(ledgerId, data) {
  return post(`/ledger/${ledgerId}/virtual-member`, data)
}

export function getVirtualMembers(ledgerId) {
  return get(`/ledger/${ledgerId}/virtual-member`)
}

export function updateVirtualMember(ledgerId, id, data) {
  return put(`/ledger/${ledgerId}/virtual-member/${id}`, data)
}

export function deleteVirtualMember(ledgerId, id) {
  return del(`/ledger/${ledgerId}/virtual-member/${id}`)
}

export function getPayees(ledgerId) {
  return get(`/ledger/${ledgerId}/payees`)
}
