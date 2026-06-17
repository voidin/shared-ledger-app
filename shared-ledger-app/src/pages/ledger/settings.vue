<template>
  <div class="settings-page">
    <van-nav-bar
      title="账本设置"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="settings-content">
      <van-cell-group inset>
        <van-cell title="账本名称" :value="ledger.name" is-link @click="showNameEdit = true" />
        <van-cell title="账本描述" :value="ledger.description || '未设置'" is-link @click="showDescEdit = true" />
        <van-cell title="账本类型">
          <template #value>
            <van-tag v-if="ledger.type === 'expense'" type="warning">报销</van-tag>
            <van-tag v-else type="success">个人</van-tag>
          </template>
        </van-cell>
      </van-cell-group>

      <div class="section-title">邀请成员</div>
      <van-cell-group inset>
        <van-cell title="邀请码" :value="ledger.inviteCode || '暂无'" />
        <van-cell title="复制邀请码" is-link @click="handleCopyCode" />
        <van-cell title="成员数量" is-link @click="goToMembers">
          <template #value>
            {{ members.length }} 人
          </template>
        </van-cell>
      </van-cell-group>

      <div class="section-title">安全管理</div>
      <van-cell-group inset>
        <van-cell title="自动锁定">
          <template #value>
            <van-switch
              v-model="ledger.autoLock"
              size="20"
              :disabled="!isCreator"
              @change="handleAutoLockChange"
            />
          </template>
        </van-cell>
        <van-cell
          v-if="ledger.autoLock"
          title="锁定周期"
          is-link
          :value="lockDaysText"
          :disabled="!isCreator"
          @click="handleLockDaysEdit"
        />
        <van-cell title="锁定日期" v-if="ledger.lockedAt">
          <template #value>
            <span class="locked-date">{{ formatLockedDate(ledger.lockedAt) }}</span>
          </template>
        </van-cell>
      </van-cell-group>

      <div class="danger-zone" v-if="isCreator">
        <div class="section-title danger">危险操作</div>
        <van-cell-group inset>
          <van-cell title="删除账本" value="删除后无法恢复" is-link @click="handleDelete" />
        </van-cell-group>
      </div>

      <div class="leave-zone" v-if="!isCreator">
        <van-button block round type="default" @click="handleLeave">
          退出账本
        </van-button>
      </div>
    </div>

    <van-dialog
      v-model:show="showNameEdit"
      title="修改账本名称"
      show-cancel-button
      @confirm="handleNameConfirm"
    >
      <van-field
        v-model="editName"
        placeholder="请输入账本名称"
        maxlength="20"
        autofocus
      />
    </van-dialog>

    <van-dialog
      v-model:show="showDescEdit"
      title="修改账本描述"
      show-cancel-button
      @confirm="handleDescConfirm"
    >
      <van-field
        v-model="editDesc"
        type="textarea"
        placeholder="请输入账本描述"
        maxlength="100"
        rows="2"
        autosize
        autofocus
      />
    </van-dialog>

    <van-popup v-model:show="showLockDaysPicker" position="bottom" round>
      <van-picker
        title="选择锁定周期"
        :columns="lockColumns"
        @confirm="onLockDaysConfirm"
        @cancel="showLockDaysPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useLedgerStore } from '@/stores/ledger'
import { getLedgerDetail, updateLedger, deleteLedger as apiDeleteLedger } from '@/api/ledger'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()

const ledgerId = computed(() => route.params.id)

const ledger = ref({
  name: '',
  description: '',
  type: 'personal',
  inviteCode: '',
  autoLock: false,
  lockDays: 30,
  lockedAt: null
})

const members = ref([])
const isCreator = computed(() => ledger.value.isCreator)

const showNameEdit = ref(false)
const showDescEdit = ref(false)
const showLockDaysPicker = ref(false)
const editName = ref('')
const editDesc = ref('')

const lockColumns = [
  { text: '7天', value: 7 },
  { text: '30天', value: 30 },
  { text: '90天', value: 90 },
  { text: '180天', value: 180 }
]

const lockDaysText = computed(() => {
  const item = lockColumns.find(col => col.value === ledger.value.lockDays)
  return item ? item.text : '30天'
})

const formatLockedDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fetchLedgerDetail = async () => {
  try {
    const data = await ledgerStore.fetchLedgerDetail(ledgerId.value)
    ledger.value = { ...ledger.value, ...data }
  } catch (error) {
    showToast('获取账本详情失败')
  }
}

const fetchMembers = async () => {
  try {
    const data = await ledgerStore.fetchMembers(ledgerId.value)
    members.value = data || []
  } catch (error) {
    console.error('获取成员列表失败')
  }
}

const goBack = () => {
  router.back()
}

const goToMembers = () => {
  router.push({
    name: 'LedgerMembers',
    params: { id: ledgerId.value }
  })
}

const handleCopyCode = async () => {
  if (!ledger.value.inviteCode) {
    showToast('暂无邀请码')
    return
  }
  
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(ledger.value.inviteCode)
      showToast('邀请码已复制')
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = ledger.value.inviteCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showToast('邀请码已复制')
    }
  } catch (error) {
    showToast('复制失败')
  }
}

const handleAutoLockChange = async (value) => {
  try {
    await ledgerStore.updateLedger(ledgerId.value, {
      autoLock: value,
      lockDays: value ? ledger.value.lockDays : null
    })
    showToast('设置成功')
  } catch (error) {
    ledger.value.autoLock = !value
    showToast('设置失败')
  }
}

const handleLockDaysEdit = () => {
  if (!isCreator.value) return
  showLockDaysPicker.value = true
}

const onLockDaysConfirm = async ({ selectedOptions }) => {
  const newLockDays = selectedOptions[0].value
  showLockDaysPicker.value = false
  
  try {
    await ledgerStore.updateLedger(ledgerId.value, { lockDays: newLockDays })
    ledger.value.lockDays = newLockDays
    showToast('设置成功')
  } catch (error) {
    showToast('设置失败')
  }
}

const handleNameConfirm = async () => {
  if (!editName.value.trim()) {
    showToast('请输入账本名称')
    return
  }
  
  try {
    await ledgerStore.updateLedger(ledgerId.value, { name: editName.value.trim() })
    ledger.value.name = editName.value.trim()
    showToast('修改成功')
  } catch (error) {
    showToast('修改失败')
  }
}

const handleDescConfirm = async () => {
  try {
    await ledgerStore.updateLedger(ledgerId.value, { description: editDesc.value.trim() })
    ledger.value.description = editDesc.value.trim()
    showToast('修改成功')
  } catch (error) {
    showToast('修改失败')
  }
}

const handleDelete = async () => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这个账本吗？删除后无法恢复，所有数据将被清除。'
    })
    
    await showConfirmDialog({
      title: '再次确认',
      message: '此操作不可逆，请输入"删除"确认'
    })
    
    await ledgerStore.deleteLedger(ledgerId.value)
    showToast('删除成功')
    
    setTimeout(() => {
      router.replace({ name: 'Home' })
    }, 500)
  } catch (error) {
    if (error !== 'cancel') {
      showToast('删除失败')
    }
  }
}

const handleLeave = async () => {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '确定要退出这个账本吗？退出后将不再能够查看和记录该账本的收支。'
    })
    
    showToast('已退出账本')
    setTimeout(() => {
      router.replace({ name: 'Home' })
    }, 500)
  } catch (error) {
  }
}

onMounted(() => {
  fetchLedgerDetail()
  fetchMembers()
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.settings-content {
  padding: 16px 0 100px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #969799;
  margin: 20px 16px 12px;
}

.section-title.danger {
  color: #ee0a24;
}

.locked-date {
  color: #ff976a;
}

.danger-zone {
  margin-top: 20px;
}

.danger-zone :deep(.van-cell-group) {
  border: 1px solid #fab6b6;
}

.danger-zone :deep(.van-cell) {
  color: #ee0a24;
}

.leave-zone {
  margin: 32px 20px;
}

.leave-zone :deep(.van-button) {
  color: #ee0a24;
  border-color: #ee0a24;
}
</style>
