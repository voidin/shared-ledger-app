import { post } from '../utils/request'

export function sendCode(phone) {
  return post('/auth/send-code', { phone })
}

export function login(phone, code, nickname, avatar) {
  return post('/auth/login', {
    phone,
    code,
    nickname,
    avatar
  })
}

export function wechatLogin(code) {
  return post('/auth/wechat-login', { code })
}

export function refreshToken() {
  return post('/auth/refresh-token')
}
