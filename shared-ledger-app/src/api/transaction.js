import { get, post, put, del, upload } from '../utils/request'

export function createTransaction(ledgerId, data) {
  return post(`/ledgers/${ledgerId}/transactions`, data)
}

export function getTransactionList(ledgerId, params = {}) {
  return get(`/ledgers/${ledgerId}/transactions`, params)
}

export function getTransactionDetail(id) {
  return get(`/transactions/${id}`)
}

export function updateTransaction(id, data) {
  return put(`/transactions/${id}`, data)
}

export function deleteTransaction(id) {
  return del(`/transactions/${id}`)
}

export function updateReimburseStatus(id, status) {
  return put(`/transactions/${id}/reimburse`, { status })
}

export function uploadTransactionImages(formData, onProgress) {
  return upload('/upload/transactions', formData, onProgress)
}
