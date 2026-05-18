<template>
  <div class="ledger-detail">
    <van-nav-bar
      :title="ledger?.name || '账本详情'"
      left-arrow
      @click-left="onBack"
    >
      <template #right>
        <van-icon name="ellipsis" size="20" @click="showMoreMenu = true" />
      </template>
    </van-nav-bar>
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="ledger-header">
        <div class="header-info">
          <h2 class="ledger-name">{{ ledger?.name }}</h2>
          <van-tag v-if="ledger?.locked" type="danger" size="medium">
            <van-icon name="lock" /> 已锁定
          </van-tag>
        </div>
        
        <div v-if="ledger?.locked" class="lock-tip">
          <van-icon name="info-o" />
          <span>账本已锁定，无法新增或编辑账目</span>
        </div>
      </div>
      
      <van-tabs v-model:active="activeTab" @change="onTabChange" class="filter-tabs">
        <van-tab title="全部" name="all" />
        <van-tab title="未报销" name="pending" />
        <van-tab title="已报销" name="reimbursed" />
      </van-tabs>
      
      <div class="statistics-cards">
        <div class="stat-card">
          <div class="stat-label">本月支出</div>
          <div class="stat-value">¥{{ formatAmount(statistics.monthExpenses) }}</div>
        </div>
        
        <div class="stat-card" v-if="isReimbursementLedger">
          <div class="stat-label">待报销</div>
          <div class="stat-value expense">¥{{ formatAmount(statistics.pendingReimburse) }}</div>
        </div>
      </div>
      
      <van-tabs v-if="transactionGroups.length > 0" class="transaction-list">
        <van-tab
          v-for="group in transactionGroups"
          :key="group.date"
          :title="group.dateLabel"
          :name="group.date"
        >
          <div class="group-content">
            <transaction-item
              v-for="transaction in group.items"
              :key="transaction.id"
              :transaction="transaction"
            />
          </div>
        </van-tab>
      </van-tabs>
      
      <van-empty
        v-else-if="!loading"
        :description="loading ? '加载中...' : '暂无账目记录'"
        image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
      />
    </van-pull-refresh>
    
    <div class="add-button" v-if="!ledger?.locked">
      <van-button
        type="primary"
        round
        block
        color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        @click="goToAddTransaction"
      >
        <van-icon name="plus" class="add-icon" />
        记一笔
      </van-button>
    </div>
    
    <van-action-sheet
      v-model:show="showMoreMenu"
      :actions="moreActions"
      cancel-text="取消"
      @select="onMoreSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { getTransactionList } from '@/api/transaction'
import { useLedgerStore } from '@/stores/ledger'
import TransactionItem from '@/components/TransactionItem.vue'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()

const ledger = ref(null)
const transactions = ref([])
const loading = ref(false)
const refreshing = ref(false)
const activeTab = ref('all')
const showMoreMenu = ref(false)

const moreActions = [
  { name: '账本设置', value: 'settings' },
  { name: '成员管理', value: 'members' },
  { name: '导出账单', value: 'export' },
  { name: '结算', value: 'settlement' }
]

const isReimbursementLedger = computed(() => {
  return ledger.value?.type === 'reimbursement'
})

const statistics = computed(() => {
  const now = dayjs()
  const monthStart = now.startOf('month').format('YYYY-MM-DD')
  const monthEnd = now.endOf('month').format('YYYY-MM-DD')
  
  const monthTransactions = transactions.value.filter(t => {
    return t.date >= monthStart && t.date <= monthEnd
  })
  
  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const pendingReimburse = transactions.value
    .filter(t => t.reimburseStatus === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  return {
    monthExpenses,
    pendingReimburse
  }
})

const filteredTransactions = computed(() => {
  if (activeTab.value === 'all') {
    return transactions.value
  }
  return transactions.value.filter(t => t.reimburseStatus === activeTab.value)
})

const transactionGroups = computed(() => {
  const groups = {}
  
  filteredTransactions.value.forEach(transaction => {
    const date = transaction.date
    if (!groups[date]) {
      groups[date] = {
        date,
        dateLabel: formatDateLabel(date),
        items: []
      }
    }
    groups[date].items.push(transaction)
  })
  
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
})

const formatAmount = (amount) => {
  return Number(amount || 0).toFixed(2)
}

const formatDateLabel = (date) => {
  const d = dayjs(date)
  const today = dayjs().startOf('day')
  const yesterday = today.subtract(1, 'day')
  
  if (d.isSame(today, 'day')) {
    return '今天'
  } else if (d.isSame(yesterday, 'day')) {
    return '昨天'
  } else if (d.isSame(today, 'year')) {
    return d.format('M月D日')
  } else {
    return d.format('YYYY年M月D日')
  }
}

const fetchLedgerDetail = async () => {
  const ledgerId = route.params.id || ledgerStore.currentLedgerId
  if (!ledgerId) {
    showToast('账本ID不存在')
    router.back()
    return
  }
  
  loading.value = true
  try {
    ledger.value = await ledgerStore.fetchLedgerDetail(ledgerId)
  } catch (error) {
    console.error('获取账本详情失败:', error)
    showToast('获取账本详情失败')
  } finally {
    loading.value = false
  }
}

const fetchTransactions = async () => {
  const ledgerId = route.params.id || ledgerStore.currentLedgerId
  if (!ledgerId) return
  
  try {
    const params = {}
    if (activeTab.value !== 'all') {
      params.reimburseStatus = activeTab.value
    }
    
    transactions.value = await getTransactionList(ledgerId, params)
  } catch (error) {
    console.error('获取账目列表失败:', error)
    showToast('获取账目列表失败')
  }
}

const onRefresh = async () => {
  try {
    await Promise.all([
      fetchLedgerDetail(),
      fetchTransactions()
    ])
  } finally {
    refreshing.value = false
  }
}

const onTabChange = () => {
}

const onBack = () => {
  router.back()
}

const goToAddTransaction = () => {
  const ledgerId = route.params.id || ledgerStore.currentLedgerId
  router.push({
    path: '/transaction/add',
    query: { ledgerId }
  })
}

const onMoreSelect = (action) => {
  showMoreMenu.value = false
  
  switch (action.value) {
    case 'settings':
      router.push(`/ledger/settings/${ledger.value?.id}`)
      break
    case 'members':
      router.push(`/member/list?ledgerId=${ledger.value?.id}`)
      break
    case 'export':
      handleExport()
      break
    case 'settlement':
      router.push(`/ledger/settlement/${ledger.value?.id}`)
      break
  }
}

const handleExport = async () => {
  showLoadingToast({ message: '导出中...', forbidClick: true })
  setTimeout(() => {
    closeToast()
    showToast('导出成功')
  }, 1500)
}

onMounted(async () => {
  await Promise.all([
    fetchLedgerDetail(),
    fetchTransactions()
  ])
  
  if (ledgerStore.currentLedgerId) {
    await ledgerStore.fetchMembers(ledgerStore.currentLedgerId)
  }
})
</script>

<style scoped>
.ledger-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 80px;
}

.ledger-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 16px;
  color: #ffffff;
}

.header-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ledger-name {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.lock-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 8px;
}

.filter-tabs {
  background: #ffffff;
  margin-top: -10px;
  border-radius: 12px 12px 0 0;
}

.filter-tabs :deep(.van-tabs__nav) {
  background: transparent;
}

.filter-tabs :deep(.van-tab) {
  font-size: 14px;
}

.statistics-cards {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
}

.stat-card {
  flex: 1;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #323233;
}

.stat-value.expense {
  color: #ee0a24;
}

.transaction-list {
  margin-top: 12px;
  background: #ffffff;
}

.transaction-list :deep(.van-tabs__content) {
  padding: 0;
}

.group-content {
  border-bottom: 1px solid #ebedf0;
}

.group-content:last-child {
  border-bottom: none;
}

.add-button {
  position: fixed;
  bottom: 20px;
  left: 16px;
  right: 16px;
  z-index: 100;
}

.add-icon {
  margin-right: 4px;
}
</style>
