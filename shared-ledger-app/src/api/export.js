import { get, post } from '../utils/request'

export function exportExcel(ledgerId, data = {}) {
  return post(`/ledgers/${ledgerId}/export`, {
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status,
    type: data.type
  })
}

export function getExportHistory(ledgerId, params = {}) {
  return get(`/ledgers/${ledgerId}/export/history`, {
    page: params.page || 1,
    pageSize: params.pageSize || 20,
    ...params
  })
}

export function downloadExport(exportId) {
  return get(`/export/${exportId}/download`)
}

export function deleteExport(exportId) {
  return post(`/export/${exportId}/delete`)
}
