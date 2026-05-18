<template>
  <div class="ledger-card" @click="handleClick">
    <div class="card-header">
      <div class="ledger-icon" :class="typeClass">
        <van-icon :name="iconName" />
      </div>
      <div class="ledger-info">
        <div class="ledger-name">{{ ledger.name }}</div>
        <div class="ledger-desc" v-if="ledger.description">{{ ledger.description }}</div>
      </div>
      <van-tag v-if="ledger.type === 'expense'" type="warning" size="medium">
        报销
      </van-tag>
      <van-tag v-else type="success" size="medium">
        个人
      </van-tag>
    </div>
    
    <div class="card-body">
      <div class="stat-item">
        <van-icon name="friends-o" />
        <span>{{ ledger.memberCount || ledger.members?.length || 1 }} 人</span>
      </div>
      <div class="stat-item" v-if="ledger.totalAmount !== undefined">
        <van-icon name="balance-o" />
        <span>¥{{ formatAmount(ledger.totalAmount) }}</span>
      </div>
    </div>
    
    <div class="card-footer" v-if="ledger.isLocked || ledger.lockedAt">
      <van-icon name="clock-o" class="locked-icon" />
      <span class="locked-text">
        {{ lockedText }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  ledger: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const typeClass = computed(() => {
  return props.ledger.type === 'expense' ? 'expense-type' : 'personal-type'
})

const iconName = computed(() => {
  return props.ledger.type === 'expense' ? 'description' : 'user-o'
})

const lockedText = computed(() => {
  if (!props.ledger.lockedAt) return '已锁定'
  
  const lockedDate = new Date(props.ledger.lockedAt)
  const year = lockedDate.getFullYear()
  const month = String(lockedDate.getMonth() + 1).padStart(2, '0')
  const day = String(lockedDate.getDate()).padStart(2, '0')
  return `锁定于 ${year}-${month}-${day}`
})

const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0.00'
  return Number(amount).toFixed(2)
}

const handleClick = () => {
  emit('click', props.ledger)
}
</script>

<style scoped>
.ledger-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ledger-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.ledger-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 24px;
  flex-shrink: 0;
}

.ledger-icon.personal-type {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.ledger-icon.expense-type {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #ffffff;
}

.ledger-info {
  flex: 1;
  min-width: 0;
}

.ledger-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-desc {
  font-size: 13px;
  color: #969799;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #646566;
}

.stat-item .van-icon {
  font-size: 16px;
  color: #969799;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebedf0;
}

.locked-icon {
  font-size: 14px;
  color: #ff976a;
}

.locked-text {
  font-size: 12px;
  color: #ff976a;
}
</style>
