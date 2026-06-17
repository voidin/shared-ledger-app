import { get, put, upload } from '../utils/request'

export function getUserInfo() {
  return get('/user/profile')
}

export function updateUserInfo(data) {
  return put('/user/profile', data)
}

export function uploadAvatar(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  return upload('/user/avatar', formData, onProgress)
}
