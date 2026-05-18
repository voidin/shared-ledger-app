export function formatAmount(amount, decimals = 2) {
  if (amount === null || amount === undefined) return '0.00'
  const num = parseFloat(amount)
  if (isNaN(num)) return '0.00'
  return num.toFixed(decimals)
}

export function formatCurrency(amount, symbol = '¥') {
  return `${symbol}${formatAmount(amount)}`
}

export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return '0'
  const n = parseFloat(num)
  if (isNaN(n)) return '0'
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  
  const now = Date.now()
  const diff = now - new Date(timestamp).getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 7) {
    return formatDate(timestamp, 'MM-DD HH:mm')
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatPhone(phone) {
  if (!phone) return ''
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
}

export function formatIdCard(idCard) {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})(\d{8})(\d{4})/, '$1********$3')
}

export function truncate(str, length = 20, suffix = '...') {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + suffix
}
