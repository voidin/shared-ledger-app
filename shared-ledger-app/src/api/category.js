import { get, post, put, del } from '../utils/request'

export function getCategories(ledgerId) {
  return get(`/ledger/${ledgerId}/category`)
}

export function createCategory(ledgerId, data) {
  return post(`/ledger/${ledgerId}/category`, data)
}

export function updateCategory(id, data) {
  return put(`/category/${id}`, data)
}

export function deleteCategory(id) {
  return del(`/category/${id}`)
}
