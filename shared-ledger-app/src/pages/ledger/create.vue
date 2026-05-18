<template>
  <div class="create-page">
    <van-nav-bar
      title="创建账本"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="form-content">
      <van-cell-group inset>
        <van-field
          v-model="formData.name"
          label="账本名称"
          placeholder="请输入账本名称"
          maxlength="20"
          :formatter="formatterName"
        />
        
        <van-field
          v-model="formData.description"
          label="账本描述"
          type="textarea"
          placeholder="请输入账本描述（选填）"
          maxlength="100"
          rows="2"
          autosize
          show-word-limit
        />
      </van-cell-group>

      <div class="section-title">账本类型</div>
      <van-cell-group inset>
        <van-cell
          title="个人账本"
          label="适用于个人或家庭成员共同记账"
          :border="false"
          @click="selectType('personal')"
        >
          <template #icon>
            <van-icon name="user-o" class="type-icon" />
          </template>
          <template #extra>
            <van-radio-group v-model="formData.type" direction="horizontal">
              <van-radio name="personal" />
            </van-radio-group>
          </template>
        </van-cell>
        
        <van-cell
          title="报销账本"
          label="适用于团队或项目费用报销"
          :border="false"
          @click="selectType('expense')"
        >
          <template #icon>
            <van-icon name="description" class="type-icon expense-icon" />
          </template>
          <template #extra>
            <van-radio-group v-model="formData.type" direction="horizontal">
              <van-radio name="expense" />
            </van-radio-group>
          </template>
        </van-cell>
      </van-cell-group>

      <div class="section-title">自动锁定</div>
      <van-cell-group inset>
        <van-cell title="启用自动锁定">
          <template #extra>
            <van-switch v-model="formData.autoLock" size="20" />
          </template>
        </van-cell>
        
        <van-cell
          v-if="formData.autoLock"
          title="锁定周期"
          is-link
          :value="lockDaysText"
          @click="showLockPicker = true"
        />
      </van-cell-group>

      <div class="submit-wrapper">
        <van-button
          type="primary"
          block
          round
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          创建账本
        </van-button>
      </div>
    </div>

    <van-popup v-model:show="showLockPicker" position="bottom" round>
      <van-picker
        title="选择锁定周期"
        :columns="lockColumns"
        @confirm="onLockConfirm"
        @cancel="showLockPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useLedgerStore } from '@/stores/ledger'

const router = useRouter()
const ledgerStore = useLedgerStore()

const formData = ref({
  name: '',
  description: '',
  type: 'personal',
  autoLock: false,
  lockDays: 30
})

const submitting = ref(false)
const showLockPicker = ref(false)

const lockColumns = [
  { text: '7天', value: 7 },
  { text: '30天', value: 30 },
  { text: '90天', value: 90 },
  { text: '180天', value: 180 }
]

const lockDaysText = computed(() => {
  const item = lockColumns.find(col => col.value === formData.value.lockDays)
  return item ? item.text : '30天'
})

const canSubmit = computed(() => {
  return formData.value.name.trim().length > 0
})

const formatterName = (value) => {
  return value.replace(/[<>]/g, '')
}

const selectType = (type) => {
  formData.value.type = type
}

const onLockConfirm = ({ selectedOptions }) => {
  formData.value.lockDays = selectedOptions[0].value
  showLockPicker.value = false
}

const goBack = () => {
  if (formData.value.name || formData.value.description) {
    showConfirmDialog({
      title: '提示',
      message: '确定要放弃创建账本吗？'
    }).then(() => {
      router.back()
    }).catch(() => {})
  } else {
    router.back()
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    showToast('请输入账本名称')
    return
  }

  submitting.value = true

  try {
    const data = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      type: formData.value.type,
      autoLock: formData.value.autoLock,
      lockDays: formData.value.autoLock ? formData.value.lockDays : null
    }

    const result = await ledgerStore.createLedger(data)
    showToast('创建成功')
    
    setTimeout(() => {
      router.replace({
        name: 'LedgerDetail',
        params: { id: result.id }
      })
    }, 500)
  } catch (error) {
    showToast(error.message || '创建失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.form-content {
  padding: 16px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #969799;
  margin: 20px 16px 12px;
}

.type-icon {
  font-size: 20px;
  margin-right: 12px;
  color: #667eea;
}

.expense-icon {
  color: #f5576c;
}

.submit-wrapper {
  margin: 40px 20px 20px;
}
</style>
