import { get, post } from '../utils/request'

export function getSummary(ledgerId, params = {}) {
  return get(`/ledgers/${ledgerId}/statistics/summary`, {
    startDate: params.startDate,
    endDate: params.endDate,
    ...params
  })
}

export function getStatsByMember(ledgerId, params = {}) {
  return get(`/ledgers/${ledgerId}/statistics/members`, {
    startDate: params.startDate,
    endDate: params.endDate,
    ...params
  })
}

export function getStatsByCategory(ledgerId, params = {}) {
  return get(`/ledgers/${ledgerId}/statistics/categories`, {
    startDate: params.startDate,
    endDate: params.endDate,
    type: params.type,
    ...params
  })
}

export function getTimeline(ledgerId, params = {}) {
  return get(`/ledgers/${ledgerId}/statistics/timeline`, {
    startDate: params.startDate,
    endDate: params.endDate,
    groupBy: params.groupBy || 'day',
    ...params
  })
}
