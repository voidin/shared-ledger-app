const TOKEN_KEY = 'sl_token'
const USER_INFO_KEY = 'sl_user_info'
const LEDGER_ID_KEY = 'sl_ledger_id'

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function removeToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

export function setUserInfo(userInfo) {
  uni.setStorageSync(USER_INFO_KEY, JSON.stringify(userInfo))
}

export function getUserInfo() {
  const info = uni.getStorageSync(USER_INFO_KEY)
  return info ? JSON.parse(info) : null
}

export function removeUserInfo() {
  uni.removeStorageSync(USER_INFO_KEY)
}

export function setLedgerId(id) {
  uni.setStorageSync(LEDGER_ID_KEY, id)
}

export function getLedgerId() {
  return uni.getStorageSync(LEDGER_ID_KEY) || ''
}

export function removeLedgerId() {
  uni.removeStorageSync(LEDGER_ID_KEY)
}

export function clearAll() {
  uni.clearStorageSync()
}

export function setStorage(key, value) {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  uni.setStorageSync(key, value)
}

export function getStorage(key) {
  const value = uni.getStorageSync(key)
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function removeStorage(key) {
  uni.removeStorageSync(key)
}
