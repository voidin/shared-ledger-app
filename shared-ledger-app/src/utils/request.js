import axios from 'axios'
import { showToast } from 'vant'
import { getToken, removeToken } from './storage'
import router from '../router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    const res = response.data
    
    if (response.config.responseType === 'blob') {
      return res
    }
    
    if (res.code && res.code !== 200 && res.code !== 0) {
      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res.data !== undefined ? res.data : res
  },
  error => {
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || '服务器错误'
      
      switch (status) {
        case 401:
          showToast('登录已过期，请重新登录')
          removeToken()
          router.push('/login')
          break
        case 403:
          showToast('没有权限访问')
          break
        case 404:
          showToast('请求的资源不存在')
          break
        case 500:
          showToast('服务器内部错误')
          break
        default:
          showToast(message)
      }
    } else if (error.request) {
      showToast('网络连接失败，请检查网络')
    } else {
      showToast(error.message || '请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export function get(url, params = {}, config = {}) {
  return request({
    method: 'GET',
    url,
    params,
    ...config
  })
}

export function post(url, data = {}, config = {}) {
  return request({
    method: 'POST',
    url,
    data,
    ...config
  })
}

export function put(url, data = {}, config = {}) {
  return request({
    method: 'PUT',
    url,
    data,
    ...config
  })
}

export function del(url, params = {}, config = {}) {
  return request({
    method: 'DELETE',
    url,
    params,
    ...config
  })
}

export function upload(url, formData, onProgress) {
  return request({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  })
}

export default request
