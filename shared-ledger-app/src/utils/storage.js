const TOKEN_KEY = 'sl_token'
const USER_INFO_KEY = 'sl_user_info'
const LEDGER_ID_KEY = 'sl_ledger_id'

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function setUserInfo(userInfo) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export function getUserInfo() {
  const info = localStorage.getItem(USER_INFO_KEY)
  return info ? JSON.parse(info) : null
}

export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
}

export function setLedgerId(id) {
  localStorage.setItem(LEDGER_ID_KEY, id)
}

export function getLedgerId() {
  return localStorage.getItem(LEDGER_ID_KEY) || ''
}

export function removeLedgerId() {
  localStorage.removeItem(LEDGER_ID_KEY)
}

export function clearAll() {
  localStorage.clear()
}

export function setStorage(key, value) {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  localStorage.setItem(key, value)
}

export function getStorage(key) {
  const value = localStorage.getItem(key)
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function removeStorage(key) {
  localStorage.removeItem(key)
}
