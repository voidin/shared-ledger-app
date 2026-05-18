import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { get, post, put, del } from '../utils/request'
import { getLedgerId, setLedgerId } from '../utils/storage'

export const useLedgerStore = defineStore('ledger', () => {
  const currentLedgerId = ref(getLedgerId() || '')
  const currentLedger = ref(null)
  const ledgerList = ref([])
  const members = ref([])
  const expenses = ref([])
  const loading = ref(false)
  
  const hasLedger = computed(() => !!currentLedgerId.value)
  
  async function fetchLedgerList() {
    loading.value = true
    try {
      const data = await get('/ledgers')
      ledgerList.value = data || []
      return ledgerList.value
    } catch (error) {
      console.error('获取账本列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  async function fetchLedgerDetail(id) {
    loading.value = true
    try {
      const data = await get(`/ledgers/${id}`)
      currentLedger.value = data
      if (id) {
        currentLedgerId.value = id
        setLedgerId(id)
      }
      return data
    } catch (error) {
      console.error('获取账本详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  async function createLedger(ledgerData) {
    const data = await post('/ledgers', ledgerData)
    ledgerList.value.unshift(data)
    return data
  }
  
  async function updateLedger(id, ledgerData) {
    const data = await put(`/ledgers/${id}`, ledgerData)
    const index = ledgerList.value.findIndex(item => item.id === id)
    if (index !== -1) {
      ledgerList.value[index] = { ...ledgerList.value[index], ...data }
    }
    if (currentLedger.value?.id === id) {
      currentLedger.value = { ...currentLedger.value, ...data }
    }
    return data
  }
  
  async function deleteLedger(id) {
    await del(`/ledgers/${id}`)
    ledgerList.value = ledgerList.value.filter(item => item.id !== id)
    if (currentLedgerId.value === id) {
      currentLedgerId.value = ''
      currentLedger.value = null
    }
  }
  
  async function fetchMembers(ledgerId) {
    try {
      const data = await get(`/ledgers/${ledgerId}/members`)
      members.value = data || []
      return members.value
    } catch (error) {
      console.error('获取成员列表失败:', error)
      throw error
    }
  }
  
  async function addMember(ledgerId, memberData) {
    const data = await post(`/ledgers/${ledgerId}/members`, memberData)
    members.value.push(data)
    return data
  }
  
  async function removeMember(ledgerId, memberId) {
    await del(`/ledgers/${ledgerId}/members/${memberId}`)
    members.value = members.value.filter(item => item.id !== memberId)
  }
  
  async function fetchExpenses(ledgerId, params = {}) {
    loading.value = true
    try {
      const data = await get(`/ledgers/${ledgerId}/expenses`, params)
      expenses.value = data || []
      return expenses.value
    } catch (error) {
      console.error('获取支出列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  async function createExpense(ledgerId, expenseData) {
    const data = await post(`/ledgers/${ledgerId}/expenses`, expenseData)
    expenses.value.unshift(data)
    return data
  }
  
  async function updateExpense(ledgerId, expenseId, expenseData) {
    const data = await put(`/ledgers/${ledgerId}/expenses/${expenseId}`, expenseData)
    const index = expenses.value.findIndex(item => item.id === expenseId)
    if (index !== -1) {
      expenses.value[index] = { ...expenses.value[index], ...data }
    }
    return data
  }
  
  async function deleteExpense(ledgerId, expenseId) {
    await del(`/ledgers/${ledgerId}/expenses/${expenseId}`)
    expenses.value = expenses.value.filter(item => item.id !== expenseId)
  }
  
  async function getExpenseDetail(ledgerId, expenseId) {
    return await get(`/ledgers/${ledgerId}/expenses/${expenseId}`)
  }
  
  async function fetchSettlement(ledgerId) {
    return await get(`/ledgers/${ledgerId}/settlement`)
  }
  
  async function fetchStatistics(ledgerId, params = {}) {
    return await get(`/ledgers/${ledgerId}/statistics`, params)
  }
  
  function setCurrentLedger(id) {
    currentLedgerId.value = id
    setLedgerId(id)
  }
  
  function clearCurrentLedger() {
    currentLedgerId.value = ''
    currentLedger.value = null
  }
  
  function clearAll() {
    currentLedgerId.value = ''
    currentLedger.value = null
    ledgerList.value = []
    members.value = []
    expenses.value = []
  }
  
  return {
    currentLedgerId,
    currentLedger,
    ledgerList,
    members,
    expenses,
    loading,
    hasLedger,
    fetchLedgerList,
    fetchLedgerDetail,
    createLedger,
    updateLedger,
    deleteLedger,
    fetchMembers,
    addMember,
    removeMember,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseDetail,
    fetchSettlement,
    fetchStatistics,
    setCurrentLedger,
    clearCurrentLedger,
    clearAll
  }
})
