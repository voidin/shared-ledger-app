import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { get, post } from '../utils/request'
import { setToken, getToken, removeToken, setUserInfo, getUserInfo, removeUserInfo } from '../utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUserInfo() || null)
  
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const nickname = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')
  const userId = computed(() => userInfo.value?.id || '')
  
  async function login(loginData) {
    try {
      token.value = loginData.token
      setToken(loginData.token)
      
      userInfo.value = loginData.userInfo
      setUserInfo(loginData.userInfo)
      
      return loginData
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }
  
  async function logout() {
    try {
      await post('/auth/logout').catch(() => {})
    } finally {
      token.value = ''
      userInfo.value = null
      removeToken()
      removeUserInfo()
    }
  }
  
  async function getUserInfo() {
    if (!token.value) {
      throw new Error('未登录')
    }
    
    try {
      const data = await get('/user/info')
      userInfo.value = data
      setUserInfo(data)
      return data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }
  
  async function updateProfile(profileData) {
    try {
      const data = await put('/user/profile', profileData)
      userInfo.value = { ...userInfo.value, ...data }
      setUserInfo(userInfo.value)
      return data
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  }
  
  async function updatePassword(passwordData) {
    return await post('/user/password', passwordData)
  }
  
  function setAvatar(avatarUrl) {
    if (userInfo.value) {
      userInfo.value.avatar = avatarUrl
      setUserInfo(userInfo.value)
    }
  }
  
  function clearUser() {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeUserInfo()
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    nickname,
    avatar,
    userId,
    login,
    logout,
    getUserInfo,
    updateProfile,
    updatePassword,
    setAvatar,
    clearUser
  }
})
