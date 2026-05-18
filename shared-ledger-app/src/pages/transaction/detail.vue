<template>
  <div class="transaction-detail">
    <van-nav-bar
      title="账单详情"
      left-arrow
      @click-left="onBack"
    />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" vertical>加载中...</van-loading>
    </div>
    
    <div v-else-if="transaction" class="detail-content">
      <div class="amount-section">
        <div class="amount-label">{{ transaction.type === 'expense' ? '支出' : '收入' }}</div>
        <div class="amount-value" :class="transaction.type === 'expense' ? 'expense' : 'income'">
          <span class="currency">¥</span>
          <span class="amount">{{ formatAmount(transaction.amount) }}</span>
        </div>
        
        <div class="reimburse-status" v-if="showReimburse">
          <van-tag :type="getReimburseTagType(transaction.reimburseStatus)" size="large">
            {{ getReimburseText(transaction.reimburseStatus) }}
          </van-tag>
        </div>
        
        <div class="reimburse-time" v-if="transaction.reimbursedAt">
          报销时间：{{ formatDateTime(transaction.reimbursedAt) }}
        </div>
      </div>
      
      <van-cell-group inset class="info-group">
        <van-cell title="分类" :value="transaction.categoryName">
          <template #icon>
            <category-tag
              :category-id="transaction.categoryId"
              :category-name="transaction.categoryName"
              :icon-name="transaction.categoryIcon || 'other-o'"
              size="small"
              class="cell-icon"
            />
          </template>
        </van-cell>
        
        <van-cell title="收支人">
          <template #label>
            <div class="payer-info">
              <user-avatar
                :src="transaction.payerAvatar"
                :default-src="defaultAvatar"
                :size="32"
              />
              <span class="payer-name">{{ transaction.payerName }}</span>
            </div>
          </template>
        </van-cell>
        
        <van-cell title="日期" :value="formatDate(transaction.date)" />
        
        <van-cell v-if="transaction.note" title="备注" :label="transaction.note" />
      </van-cell-group>
      
      <van-cell-group v-if="transaction.images && transaction.images.length > 0" inset class="info-group">
        <van-cell title="附件图片">
          <template #value>
            <div class="image-list">
              <div
                v-for="(img, index) in transaction.images"
                :key="index"
                class="image-item"
                @click="previewImage(index)"
              >
                <van-image
                  :src="img"
                  fit="cover"
                  radius="8"
                  width="80"
                  height="80"
                />
              </div>
            </div>
          </template>
        </van-cell>
      </van-cell-group>
      
      <van-cell-group inset class="info-group">
        <van-cell title="创建时间" :value="formatDateTime(transaction.createdAt)" />
        <van-cell v-if="transaction.updatedAt" title="更新时间" :value="formatDateTime(transaction.updatedAt)" />
      </van-cell-group>
      
      <div class="action-buttons" v-if="hasPermission">
        <van-button
          v-if="showReimburse"
          type="primary"
          block
          round
          @click="handleReimburse"
        >
          {{ transaction.reimburseStatus === 'reimbursed' ? '撤销报销' : '标记已报销' }}
        </van-button>
        
        <van-button
          type="default"
          block
          round
          @click="handleEdit"
        >
          编辑账单
        </van-button>
        
        <van-button
          type="danger"
          block
          round
          plain
          @click="handleDelete"
        >
          删除账单
        </van-button>
      </div>
    </div>
    
    <van-empty v-else description="账单不存在" />
    
    <van-image-preview
      v-model:show="showImagePreview"
      :images="transaction?.images || []"
      :start-position="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { getTransactionDetail, updateReimburseStatus, deleteTransaction } from '@/api/transaction'
import { useLedgerStore } from '@/stores/ledger'
import { useUserStore } from '@/stores/user'
import CategoryTag from '@/components/CategoryTag.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()
const userStore = useUserStore()

const transaction = ref(null)
const loading = ref(true)
const showImagePreview = ref(false)
const previewIndex = ref(0)

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const formatAmount = (amount) => {
  return Number(amount || 0).toFixed(2)
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('YYYY-MM-DD HH:mm')
}

const getReimburseText = (status) => {
  const statusMap = {
    pending: '待报销',
    reimbursed: '已报销',
    rejected: '已驳回'
  }
  return statusMap[status] || status
}

const getReimburseTagType = (status) => {
  const typeMap = {
    pending: 'warning',
    reimbursed: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'default'
}

const showReimburse = computed(() => {
  return ledgerStore.currentLedger?.type === 'reimbursement'
})

const hasPermission = computed(() => {
  if (!transaction.value) return false
  return transaction.value.payerId === userStore.userId || 
         userStore.isAdmin ||
         transaction.value.canEdit
})

const fetchTransactionDetail = async () => {
  const id = route.params.id
  if (!id) {
    showToast('参数错误')
    router.back()
    return
  }
  
  loading.value = true
  try {
    transaction.value = await getTransactionDetail(id)
  } catch (error) {
    console.error('获取账单详情失败:', error)
    showToast('获取详情失败')
  } finally {
    loading.value = false
  }
}

const previewImage = (index) => {
  previewIndex.value = index
  showImagePreview.value = true
}

const handleReimburse = async () => {
  const newStatus = transaction.value.reimburseStatus === 'reimbursed' ? 'pending' : 'reimbursed'
  const message = newStatus === 'reimbursed' ? '确认标记为已报销？' : '确认撤销报销？'
  
  try {
    await showConfirmDialog({
      title: '操作确认',
      message
    })
    
    showLoadingToast({ message: '处理中...', forbidClick: true })
    
    await updateReimburseStatus(transaction.value.id, newStatus)
    transaction.value.reimburseStatus = newStatus
    if (newStatus === 'reimbursed') {
      transaction.value.reimbursedAt = new Date().toISOString()
    }
    
    closeToast()
    showToast(newStatus === 'reimbursed' ? '已标记为已报销' : '已撤销报销')
  } catch (error) {
    if (error !== 'cancel') {
      closeToast()
      showToast('操作失败')
    }
  }
}

const handleEdit = () => {
  router.push(`/transaction/edit/${transaction.value.id}`)
}

const handleDelete = async () => {
  try {
    await showConfirmDialog({
      title: '删除确认',
      message: '确定要删除这条账单吗？删除后无法恢复。'
    })
    
    showLoadingToast({ message: '删除中...', forbidClick: true })
    
    await deleteTransaction(transaction.value.id)
    
    closeToast()
    showToast('删除成功')
    router.back()
  } catch (error) {
    if (error !== 'cancel') {
      closeToast()
      showToast('删除失败')
    }
  }
}

const onBack = () => {
  router.back()
}

onMounted(() => {
  fetchTransactionDetail()
})
</script>

<style scoped>
.transaction-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.detail-content {
  padding-bottom: 20px;
}

.amount-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  text-align: center;
  color: #ffffff;
}

.amount-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.amount-value {
  display: flex;
  justify-content: center;
  align-items: baseline;
}

.currency {
  font-size: 24px;
  margin-right: 4px;
}

.amount {
  font-size: 40px;
  font-weight: bold;
}

.amount-value.expense {
  color: #ffffff;
}

.amount-value.income {
  color: #07c160;
}

.reimburse-status {
  margin-top: 16px;
}

.reimburse-time {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
}

.info-group {
  margin: 12px 0;
}

.cell-icon {
  margin-right: 8px;
}

.payer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.payer-name {
  font-size: 14px;
  color: #323233;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 240px;
}

.image-item {
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
}

.image-item :deep(.van-image) {
  display: block;
}

.action-buttons {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
