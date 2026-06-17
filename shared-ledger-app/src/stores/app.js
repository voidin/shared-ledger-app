import { defineStore } from 'pinia'
import { ref } from 'vue'
import { showToast as vantShowToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const loadingText = ref('')
  const theme = ref('light')
  const deviceInfo = ref(null)
  const systemInfo = ref(null)
  
  function initApp() {
    // 浏览器环境下获取系统信息
    systemInfo.value = {
      platform: navigator.platform,
      brand: '',
      model: '',
      system: navigator.userAgent,
      version: navigator.appVersion,
      statusBarHeight: 0,
      safeAreaInsets: { bottom: 0 }
    }
    
    deviceInfo.value = {
      platform: navigator.platform,
      brand: '',
      model: '',
      system: navigator.userAgent,
      version: navigator.appVersion
    }
    
    const savedTheme = localStorage.getItem('app_theme')
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
    showLoadingToast({
      message: text,
      forbidClick: true,
      duration: 0
    })
  }
  
  function hideLoading() {
    loading.value = false
    loadingText.value = ''
    closeToast()
  }
  
  function setTheme(newTheme) {
    theme.value = newTheme
    localStorage.setItem('app_theme', newTheme)
    applyTheme(newTheme)
  }
  
  function applyTheme(themeName) {
    if (themeName === 'dark') {
      document.body.style.backgroundColor = '#1a1a1a'
    } else {
      document.body.style.backgroundColor = '#f5f5f5'
    }
  }
  
  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }
  
  function showToast(message, icon = 'none', duration = 2000) {
    vantShowToast({
      message: message,
      icon: icon,
      duration: duration
    })
  }
  
  function showError(message) {
    showToast(message, 'fail')
  }
  
  function showSuccess(message) {
    showToast(message, 'success')
  }
  
  function showModal(options) {
    return new Promise((resolve, reject) => {
      showConfirmDialog({
        title: options.title || '提示',
        message: options.content || '',
        showCancelButton: options.showCancel !== false,
        confirmButtonText: options.confirmText || '确定',
        cancelButtonText: options.cancelText || '取消'
      })
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          resolve(false)
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
    return { top: 0, bottom: 0 }
  }
  
  function getNavBarHeight() {
    return 44
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
