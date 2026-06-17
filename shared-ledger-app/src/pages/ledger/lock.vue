<template>
  <div class="lock-page">
    <van-nav-bar
      title="账本锁定设置"
      left-arrow
      @click-left="onBack"
    />

    <div class="lock-content">
      <van-cell-group inset>
        <van-cell title="当前状态">
          <template #value>
            <div class="lock-status" :class="{ locked: lockData.isLocked }">
              <van-icon :name="lockData.isLocked ? 'lock' : 'unlock'" />
              <span>{{ lockData.isLocked ? '已锁定' : '未锁定' }}</span>
            </div>
          </template>
        </van-cell>

        <van-cell title="手动锁定">
          <template #label>
            <span class="cell-label">开启后账本将被锁定，无法添加或修改报销记录</span>
          </template>
          <template #right-icon>
            <van-switch
              v-model="formData.manualLock"
              size="20"
              @change="handleManualLockChange"
            />
          </template>
        </van-cell>

        <van-cell title="自动锁定">
          <template #label>
            <span class="cell-label">账本在指定天数无操作后自动锁定</span>
          </template>
          <template #right-icon>
            <van-switch
              v-model="formData.autoLockEnabled"
              size="20"
              @change="handleAutoLockChange"
            />
          </template>
        </van-cell>

        <van-cell title="自动锁定天数" v-if="formData.autoLockEnabled">
          <template #right-icon>
            <van-stepper
              v-model="formData.autoLockDays"
              min="1"
              max="90"
              integer
              @change="handleDaysChange"
            />
          </template>
        </van-cell>
      </van-cell-group>

      <van-cell-group inset title="锁定说明" class="description-group">
        <van-field
          v-model="formData.lockDescription"
          type="textarea"
          placeholder="请输入锁定说明，用于告知其他成员账本锁定原因"
          rows="3"
          autosize
          maxlength="200"
          show-word-limit
        />
      </van-cell-group>

      <div class="action-buttons">
        <van-button
          type="primary"
          block
          round
          :loading="saving"
          @click="handleSave"
        >
          保存设置
        </van-button>
      </div>

      <div class="lock-tip">
        <van-icon name="info-o" />
        <span>锁定账本后，只有管理员可以解锁</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import { getLockStatus, toggleLock, updateLockSettings } from '@/api/lock'

const router = useRouter()
const route = useRoute()

const ledgerId = route.params.ledgerId || route.query.ledgerId || '1'

const saving = ref(false)
const loading = ref(false)

const lockData = reactive({
  isLocked: false,
  lockedAt: null,
  lockedBy: null
})

const formData = reactive({
  manualLock: false,
  autoLockEnabled: false,
  autoLockDays: 7,
  lockDescription: ''
})

onMounted(async () => {
  await fetchLockStatus()
})

const fetchLockStatus = async () => {
  try {
    loading.value = true
    const data = await getLockStatus(ledgerId)
    lockData.isLocked = data.isLocked || false
    lockData.lockedAt = data.lockedAt
    lockData.lockedBy = data.lockedBy
    formData.manualLock = data.manualLock || false
    formData.autoLockEnabled = data.autoLockEnabled || false
    formData.autoLockDays = data.autoLockDays || 7
    formData.lockDescription = data.lockDescription || ''
  } catch (error) {
    console.error('获取锁定状态失败:', error)
    showToast('获取锁定状态失败')
  } finally {
    loading.value = false
  }
}

const handleManualLockChange = async (value) => {
  try {
    await showConfirmDialog({
      title: value ? '确认锁定' : '确认解锁',
      message: value ? '确定要锁定账本吗？锁定后无法添加或修改报销记录。' : '确定要解锁账本吗？'
    })
    
    await toggleLock(ledgerId, value)
    lockData.isLocked = value
    showToast(value ? '账本已锁定' : '账本已解锁')
  } catch (error) {
    if (error !== 'cancel') {
      formData.manualLock = !value
      showToast('操作失败')
    } else {
      formData.manualLock = !value
    }
  }
}

const handleAutoLockChange = (value) => {
  if (value && formData.autoLockDays <= 0) {
    formData.autoLockDays = 7
  }
}

const handleDaysChange = (value) => {
  if (value <= 0) {
    formData.autoLockDays = 1
  }
}

const handleSave = async () => {
  try {
    saving.value = true
    
    const data = {
      autoLockEnabled: formData.autoLockEnabled,
      autoLockDays: formData.autoLockDays,
      lockDescription: formData.lockDescription
    }
    
    await updateLockSettings(ledgerId, data)
    showToast('保存成功')
    
    setTimeout(() => {
      onBack()
    }, 500)
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败')
  } finally {
    saving.value = false
  }
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.lock-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.lock-content {
  padding: 16px 0;
}

.lock-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #07c160;
}

.lock-status.locked {
  color: #ee0a24;
}

.cell-label {
  font-size: 12px;
  color: #969799;
}

.description-group {
  margin-top: 16px;
}

.action-buttons {
  margin: 24px 16px;
}

.lock-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 12px;
  color: #969799;
}
</style>
