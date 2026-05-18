import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const loadingText = ref('')
  const theme = ref('light')
  const deviceInfo = ref(null)
  const systemInfo = ref(null)
  
  function initApp() {
    uni.getSystemInfo({
      success: (res) => {
        systemInfo.value = res
        deviceInfo.value = {
          platform: res.platform,
          brand: res.brand,
          model: res.model,
          system: res.system,
          version: res.version
        }
      }
    })
    
    const savedTheme = uni.getStorageSync('app_theme')
    if (savedTheme) {
      theme.value = savedTheme
      applyTheme(savedTheme)
    }
  }
  
  function setLoading(value, text = '') {
    loading.value = value
    loadingText.value = text
  }
  
  function showLoading(text = '加载中...') {
    loading.value = true
    loadingText.value = text
    uni.showLoading({
      title: text,
      mask: true
    })
  }
  
  function hideLoading() {
    loading.value = false
    loadingText.value = ''
    uni.hideLoading()
  }
  
  function setTheme(newTheme) {
    theme.value = newTheme
    uni.setStorageSync('app_theme', newTheme)
    applyTheme(newTheme)
  }
  
  function applyTheme(themeName) {
    if (themeName === 'dark') {
      uni.setBackgroundColor({
        backgroundColor: '#1a1a1a',
        backgroundColorTop: '#1a1a1a',
        backgroundColorBottom: '#1a1a1a'
      })
    } else {
      uni.setBackgroundColor({
        backgroundColor: '#f5f5f5',
        backgroundColorTop: '#f5f5f5',
        backgroundColorBottom: '#f5f5f5'
      })
    }
  }
  
  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }
  
  function showToast(message, icon = 'none', duration = 2000) {
    uni.showToast({
      title: message,
      icon: icon,
      duration: duration
    })
  }
  
  function showError(message) {
    showToast(message, 'error')
  }
  
  function showSuccess(message) {
    showToast(message, 'success')
  }
  
  function showModal(options) {
    return new Promise((resolve, reject) => {
      uni.showModal({
        ...options,
        success: (res) => {
          if (res.confirm) {
            resolve(true)
          } else {
            resolve(false)
          }
        },
        fail: reject
      })
    })
  }
  
  async function confirm(message, title = '提示') {
    return await showModal({
      title: title,
      content: message,
      showCancel: true
    })
  }
  
  function getSafeAreaInsets() {
    if (!systemInfo.value) return { top: 0, bottom: 0 }
    return {
      top: systemInfo.value.statusBarHeight || 0,
      bottom: systemInfo.value.safeAreaInsets?.bottom || 0
    }
  }
  
  function getNavBarHeight() {
    if (!systemInfo.value) return 44
    return systemInfo.value.statusBarHeight + 44
  }
  
  return {
    loading,
    loadingText,
    theme,
    deviceInfo,
    systemInfo,
    initApp,
    setLoading,
    showLoading,
    hideLoading,
    setTheme,
    toggleTheme,
    showToast,
    showError,
    showSuccess,
    showModal,
    confirm,
    getSafeAreaInsets,
    getNavBarHeight
  }
})
