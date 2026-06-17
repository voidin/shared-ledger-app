<template>
  <div class="transaction-item" @click="handleClick">
    <div class="item-left">
      <category-tag
        :category-id="transaction.categoryId"
        :category-name="transaction.categoryName"
        :icon-name="transaction.categoryIcon || 'other-o'"
        size="medium"
      />
    </div>
    
    <div class="item-content">
      <div class="item-header">
        <span class="item-title">{{ transaction.title || transaction.categoryName }}</span>
        <span v-if="transaction.reimburseStatus" class="reimburse-tag" :class="`reimburse-tag--${transaction.reimburseStatus}`">
          {{ getReimburseText(transaction.reimburseStatus) }}
        </span>
      </div>
      
      <div class="item-info">
        <span class="item-payer">
          <van-icon name="user-o" class="info-icon" />
          {{ transaction.payerName || '未知' }}
        </span>
        <span class="item-date">{{ formatDate(transaction.date) }}</span>
      </div>
      
      <div v-if="transaction.note" class="item-note">{{ transaction.note }}</div>
    </div>
    
    <div class="item-right">
      <span class="item-amount" :class="transaction.type === 'expense' ? 'expense' : 'income'">
        {{ transaction.type === 'expense' ? '-' : '+' }}{{ formatAmount(transaction.amount) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import CategoryTag from './CategoryTag.vue'
import dayjs from 'dayjs'

const props = defineProps({
  transaction: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const formatAmount = (amount) => {
  return Number(amount || 0).toFixed(2)
}

const formatDate = (date) => {
  if (!date) return ''
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
    return d.format('YYYY-MM-DD')
  }
}

const getReimburseText = (status) => {
  const statusMap = {
    pending: '待报销',
    reimbursed: '已报销',
    rejected: '已驳回'
  }
  return statusMap[status] || ''
}

const handleClick = () => {
  router.push(`/transaction/detail/${props.transaction.id}`)
}
</script>

<style scoped>
.transaction-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  background: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s;
}

.transaction-item:active {
  background-color: #f5f5f5;
}

.item-left {
  flex-shrink: 0;
  margin-right: 12px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reimburse-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.reimburse-tag--pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.reimburse-tag--reimbursed {
  background-color: #e6f7ff;
  color: #1890ff;
}

.reimburse-tag--rejected {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.item-payer {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-icon {
  font-size: 12px;
}

.item-date {
  flex-shrink: 0;
}

.item-note {
  margin-top: 4px;
  font-size: 12px;
  color: #646566;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-right {
  flex-shrink: 0;
  margin-left: 12px;
  text-align: right;
}

.item-amount {
  font-size: 16px;
  font-weight: 600;
}

.item-amount.expense {
  color: #323233;
}

.item-amount.income {
  color: #07c160;
}
</style>
