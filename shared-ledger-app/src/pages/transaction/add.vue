<template>
  <div class="add-transaction">
    <van-nav-bar
      title="记一笔"
      left-text="取消"
      right-text="保存"
      left-arrow
      @click-left="onCancel"
      @click-right="onSave"
    />
    
    <div class="amount-section">
      <div class="amount-display" :class="formData.type">
        <span class="currency">{{ formData.type === 'expense' ? '-' : '+' }}¥</span>
        <span class="amount">{{ displayAmount || '0.00' }}</span>
      </div>
      
      <van-tabs v-model:active="formData.type" @change="onTypeChange" class="type-tabs">
        <van-tab title="支出" name="expense" />
        <van-tab title="收入" name="income" />
      </van-tabs>
    </div>
    
    <div class="form-content">
      <div class="amount-keyboard" @click="showKeyboard = true">
        <div class="keyboard-trigger">
          <van-icon name="edit" />
          <span>点击输入金额</span>
        </div>
      </div>
      
      <van-popup
        v-model:show="showKeyboard"
        position="bottom"
        round
        :style="{ height: '60%' }"
      >
        <div class="keyboard-container">
          <div class="keyboard-header">
            <span>输入金额</span>
            <van-icon name="cross" @click="showKeyboard = false" />
          </div>
          
          <div class="keyboard-display">
            <span class="currency">{{ formData.type === 'expense' ? '-' : '+' }}¥</span>
            <span class="amount">{{ displayAmount || '0.00' }}</span>
          </div>
          
          <van-number-keyboard
            v-model="amountInput"
            :show="showKeyboard"
            :maxlength="10"
            @blur="showKeyboard = false"
          />
        </div>
      </van-popup>
      
      <van-cell-group inset>
        <van-cell
          title="收支人"
          is-link
          @click="showPayerPicker = true"
        >
          <template #label>
            <div class="payer-display">
              <user-avatar
                v-if="selectedPayer"
                :src="selectedPayer.avatar"
                :default-src="defaultAvatar"
                :size="32"
              />
              <span>{{ selectedPayer?.name || '请选择' }}</span>
            </div>
          </template>
        </van-cell>
        
        <van-cell
          title="分类"
          is-link
          @click="showCategoryPicker = true"
        >
          <template #value>
            <div class="category-display">
              <category-tag
                v-if="selectedCategory"
                :category-id="selectedCategory.id"
                :category-name="selectedCategory.name"
                :icon-name="selectedCategory.icon || 'other-o'"
                size="small"
              />
              <span v-else>请选择</span>
            </div>
          </template>
        </van-cell>
        
        <van-cell
          title="日期"
          is-link
          :value="formatDate(formData.date)"
          @click="showDatePicker = true"
        />
        
        <van-field
          v-model="formData.note"
          label="备注"
          placeholder="添加备注"
          maxlength="200"
          show-word-limit
        />
        
        <van-cell
          v-if="isReimbursementLedger"
          title="报销状态"
        >
          <template #label>
            <van-switch
              v-model="formData.reimburseStatus"
              size="20"
              active-value="reimbursed"
              inactive-value="pending"
              inactive-color="#dcdee0"
            />
            <span class="reimburse-label">
              {{ formData.reimburseStatus === 'reimbursed' ? '已报销' : '待报销' }}
            </span>
          </template>
        </van-cell>
      </van-cell-group>
      
      <van-cell-group inset title="附件图片" class="image-group">
        <div class="image-upload-container">
          <van-uploader
            v-model:file-list="formData.images"
            :max-count="6"
            :after-read="afterRead"
            :before-read="beforeRead"
            @delete="onDeleteImage"
            multiple
          >
            <div class="upload-button">
              <van-icon name="plus" size="24" />
              <span>上传图片</span>
            </div>
          </van-uploader>
        </div>
      </van-cell-group>
    </div>
    
    <div class="save-button">
      <van-button
        type="primary"
        block
        round
        :loading="saving"
        :disabled="!canSave"
        @click="onSave"
      >
        保存账单
      </van-button>
    </div>
    
    <van-popup v-model:show="showPayerPicker" position="bottom">
      <van-picker
        title="选择收支人"
        :columns="payerColumns"
        @confirm="onPayerConfirm"
        @cancel="showPayerPicker = false"
      />
    </van-popup>
    
    <van-popup v-model:show="showCategoryPicker" position="bottom">
      <div class="category-picker">
        <div class="category-header">
          <span>选择分类</span>
          <van-icon name="cross" @click="showCategoryPicker = false" />
        </div>
        
        <div class="category-grid">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-item"
            :class="{ active: selectedCategory?.id === category.id }"
            @click="onCategorySelect(category)"
          >
            <category-tag
              :category-id="category.id"
              :category-name="category.name"
              :icon-name="category.icon || 'other-o'"
              size="large"
              :show-name="true"
            />
          </div>
        </div>
      </div>
    </van-popup>
    
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="dateValue"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import { createTransaction, uploadTransactionImages } from '@/api/transaction'
import { useLedgerStore } from '@/stores/ledger'
import { useUserStore } from '@/stores/user'
import CategoryTag from '@/components/CategoryTag.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()
const userStore = useUserStore()

const showKeyboard = ref(false)
const showPayerPicker = ref(false)
const showCategoryPicker = ref(false)
const showDatePicker = ref(false)
const saving = ref(false)
const amountInput = ref('')

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const formData = ref({
  type: 'expense',
  amount: 0,
  payerId: '',
  categoryId: '',
  date: dayjs().format('YYYY-MM-DD'),
  note: '',
  reimburseStatus: 'pending',
  images: []
})

const dateValue = ref(['2024', '01', '01'])

const selectedPayer = ref(null)
const selectedCategory = ref(null)

const minDate = dayjs().subtract(1, 'year').toDate()
const maxDate = new Date()

const categories = ref([
  { id: 1, name: '餐饮', icon: '🍜' },
  { id: 2, name: '交通', icon: '🚌' },
  { id: 3, name: '购物', icon: '🛒' },
  { id: 4, name: '娱乐', icon: '🎮' },
  { id: 5, name: '住宿', icon: '🏠' },
  { id: 6, name: '通讯', icon: '📱' },
  { id: 7, name: '医疗', icon: '💊' },
  { id: 8, name: '教育', icon: '📚' },
  { id: 9, name: '旅游', icon: '✈️' },
  { id: 10, name: '日用', icon: '🧴' },
  { id: 11, name: '护肤', icon: '💄' },
  { id: 12, name: '运动', icon: '⚽' },
  { id: 13, name: '咖啡', icon: '☕' },
  { id: 14, name: '烟酒', icon: '🍺' },
  { id: 15, name: '礼物', icon: '🎁' },
  { id: 16, name: '其他', icon: '📝' }
])

const payerColumns = computed(() => {
  const members = ledgerStore.members || []
  return members.map(m => ({
    text: m.name,
    value: m.id,
    avatar: m.avatar,
    isVirtual: m.isVirtual || false
  }))
})

const displayAmount = computed(() => {
  const amount = amountInput.value || '0'
  if (amount === '0') return ''
  const num = parseFloat(amount)
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
})

const isReimbursementLedger = computed(() => {
  return ledgerStore.currentLedger?.type === 'reimbursement'
})

const canSave = computed(() => {
  return (
    parseFloat(amountInput.value) > 0 &&
    selectedPayer.value &&
    selectedCategory.value
  )
})

const formatDate = (date) => {
  if (!date) return dayjs().format('YYYY-MM-DD')
  return date
}

const onTypeChange = (name) => {
  formData.value.type = name
}

const onPayerConfirm = ({ selectedOptions }) => {
  if (selectedOptions && selectedOptions.length > 0) {
    const option = selectedOptions[0]
    selectedPayer.value = {
      id: option.value,
      name: option.text,
      avatar: option.avatar,
      isVirtual: option.isVirtual
    }
    formData.value.payerId = option.value
  }
  showPayerPicker.value = false
}

const onCategorySelect = (category) => {
  selectedCategory.value = category
  formData.value.categoryId = category.id
  showCategoryPicker.value = false
}

const onDateConfirm = ({ selectedValues }) => {
  const date = selectedValues.join('-')
  formData.value.date = date
  showDatePicker.value = false
}

const beforeRead = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    showToast('请上传图片文件')
    return false
  }
  
  if (!isLt5M) {
    showToast('图片大小不能超过5MB')
    return false
  }
  
  return true
}

const afterRead = async (file) => {
  file.status = 'uploading'
  file.message = '上传中...'
  
  try {
    const formData = new FormData()
    formData.append('file', file.file)
    
    const res = await uploadTransactionImages(formData, (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      file.message = `${percent}%`
    })
    
    file.url = res.url
    file.status = 'done'
    file.message = ''
  } catch (error) {
    file.status = 'failed'
    file.message = '上传失败'
    showToast('图片上传失败')
  }
}

const onDeleteImage = (file) => {
  const index = formData.value.images.findIndex(img => img.url === file.url)
  if (index > -1) {
    formData.value.images.splice(index, 1)
  }
}

const onCancel = async () => {
  if (amountInput.value || formData.value.note) {
    try {
      await showConfirmDialog({
        title: '确认取消',
        message: '确定要放弃当前编辑吗？'
      })
      router.back()
    } catch (error) {
    }
  } else {
    router.back()
  }
}

const onSave = async () => {
  if (!canSave.value) {
    if (parseFloat(amountInput.value) <= 0) {
      showToast('请输入金额')
    } else if (!selectedPayer.value) {
      showToast('请选择收支人')
    } else if (!selectedCategory.value) {
      showToast('请选择分类')
    }
    return
  }
  
  saving.value = true
  
  try {
    const ledgerId = route.query.ledgerId || ledgerStore.currentLedgerId
    
    const data = {
      type: formData.value.type,
      amount: parseFloat(amountInput.value),
      payerId: selectedPayer.value.id,
      payerName: selectedPayer.value.name,
      categoryId: selectedCategory.value.id,
      categoryName: selectedCategory.value.name,
      categoryIcon: selectedCategory.value.icon,
      date: formData.value.date,
      note: formData.value.note,
      reimburseStatus: isReimbursementLedger.value ? formData.value.reimburseStatus : undefined,
      images: formData.value.images.map(img => img.url).filter(Boolean)
    }
    
    showLoadingToast({ message: '保存中...', forbidClick: true })
    
    await createTransaction(ledgerId, data)
    
    closeToast()
    showToast('保存成功')
    router.back()
  } catch (error) {
    closeToast()
    showToast('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  dateValue.value = dayjs().format('YYYY-MM-DD').split('-')
  
  if (userStore.userId) {
    selectedPayer.value = {
      id: userStore.userId,
      name: userStore.nickname || '我',
      avatar: userStore.avatar
    }
    formData.value.payerId = userStore.userId
  }
  
  if (ledgerStore.currentLedgerId) {
    await ledgerStore.fetchMembers(ledgerStore.currentLedgerId)
  }
})
</script>

<style scoped>
.add-transaction {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 80px;
}

.amount-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  text-align: center;
  color: #ffffff;
}

.amount-display {
  display: flex;
  justify-content: center;
  align-items: baseline;
  margin-bottom: 16px;
}

.amount-display.expense .currency,
.amount-display.expense .amount {
  color: #ffffff;
}

.amount-display.income .currency,
.amount-display.income .amount {
  color: #07c160;
}

.currency {
  font-size: 20px;
  margin-right: 4px;
}

.amount {
  font-size: 36px;
  font-weight: bold;
}

.type-tabs {
  background: transparent;
}

.type-tabs :deep(.van-tabs__nav) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

.type-tabs :deep(.van-tab) {
  color: rgba(255, 255, 255, 0.7);
  border: none;
}

.type-tabs :deep(.van-tab--active) {
  color: #ffffff;
}

.type-tabs :deep(.van-tabs__line) {
  background-color: #ffffff;
}

.form-content {
  padding: 12px 0;
}

.amount-keyboard {
  background: #ffffff;
  padding: 16px;
  margin-bottom: 12px;
}

.keyboard-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #969799;
  font-size: 14px;
  padding: 12px;
  border: 1px dashed #dcdee0;
  border-radius: 8px;
  cursor: pointer;
}

.keyboard-trigger:active {
  background-color: #f7f8fa;
}

.keyboard-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.keyboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #ebedf0;
}

.keyboard-display {
  display: flex;
  justify-content: center;
  align-items: baseline;
  padding: 30px 20px;
}

.payer-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.image-group {
  margin-top: 12px;
}

.image-upload-container {
  padding: 16px;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: #f7f8fa;
  border-radius: 8px;
  color: #969799;
  font-size: 12px;
  gap: 4px;
}

.save-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.reimburse-label {
  margin-left: 8px;
  font-size: 14px;
  color: #323233;
}

.category-picker {
  background: #ffffff;
  max-height: 70vh;
  overflow-y: auto;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #ebedf0;
  position: sticky;
  top: 0;
  background: #ffffff;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-item:active {
  background-color: #f7f8fa;
}

.category-item.active {
  background-color: #e6f7ff;
}

.category-item :deep(.category-tag) {
  flex-direction: column;
  gap: 8px;
}
</style>
