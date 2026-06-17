<template>
  <div class="permission-container">
    <van-nav-bar
      title="权限设置"
      left-arrow
      @click-left="onBack"
    />

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#1989fa" />
    </div>

    <div v-else class="content-wrapper">
      <div class="member-info-card">
        <div class="member-avatar-wrapper">
          <img
            v-if="memberInfo.avatar"
            :src="memberInfo.avatar"
            class="member-avatar"
            alt="avatar"
          />
          <van-icon
            v-else
            name="user-o"
            size="40"
            class="avatar-placeholder"
          />
        </div>
        <div class="member-details">
          <div class="member-name">{{ memberInfo.name }}</div>
          <div class="member-phone">{{ formatPhone(memberInfo.phone) }}</div>
        </div>
      </div>

      <div class="section-title">角色</div>
      <van-cell-group inset>
        <van-cell
          v-for="role in roleOptions"
          :key="role.value"
          :title="role.label"
          center
          @click="selectRole(role.value)"
        >
          <template #icon>
            <van-icon :name="role.icon" class="role-icon" />
          </template>
          <template #right-icon>
            <van-radio
              :name="role.value"
              :model-value="selectedRole === role.value"
              @click="selectRole(role.value)"
            />
          </template>
        </van-cell>
      </van-cell-group>

      <template v-if="selectedRole !== 'creator'">
        <div class="section-title">权限配置</div>
        <van-cell-group inset>
          <permission-editor
            v-model="permissions.addRecord"
            label="添加账目"
            :options="addRecordOptions"
            description="允许新增报销或支出记录"
          />

          <permission-editor
            v-model="permissions.editRecord"
            label="修改账目"
            :options="editRecordOptions"
            description="允许修改已存在的记录"
          />

          <permission-editor
            v-model="permissions.deleteRecord"
            label="删除账目"
            :options="editRecordOptions"
            description="允许删除记录"
          />

          <permission-editor
            v-model="permissions.updateReimburseStatus"
            label="修改报销状态"
            :options="editRecordOptions"
            description="允许修改报销审批状态"
          />

          <permission-editor
            v-model="permissions.exportReport"
            label="导出报表"
            :options="exportOptions"
            description="允许导出账本数据报表"
          />
        </van-cell-group>
      </template>

      <div class="save-button-wrapper">
        <van-button
          type="primary"
          round
          block
          :loading="saving"
          @click="handleSave"
        >
          保存设置
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import { getMemberPermissions, updateMemberPermissions } from '@/api/permission'
import { useLedgerStore } from '@/stores/ledger'
import PermissionEditor from '@/components/PermissionEditor.vue'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()

const loading = ref(false)
const saving = ref(false)
const memberInfo = ref({})
const selectedRole = ref('member')

const permissions = reactive({
  addRecord: 'all',
  editRecord: 'self',
  deleteRecord: 'self',
  updateReimburseStatus: 'self',
  exportReport: 'none'
})

const roleOptions = [
  { value: 'creator', label: '创建者', icon: 'star-o' },
  { value: 'admin', label: '管理员', icon: 'setting-o' },
  { value: 'member', label: '成员', icon: 'friends-o' }
]

const addRecordOptions = [
  { value: 'all', label: '全部' },
  { value: 'none', label: '不允许' }
]

const editRecordOptions = [
  { value: 'all', label: '全部' },
  { value: 'self', label: '仅自己' },
  { value: 'none', label: '不允许' }
]

const exportOptions = [
  { value: 'all', label: '全部' },
  { value: 'none', label: '不允许' }
]

onMounted(async () => {
  await loadMemberPermissions()
})

const loadMemberPermissions = async () => {
  try {
    loading.value = true
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    const memberId = route.query.memberId

    if (!ledgerId || !memberId) {
      showToast('参数错误')
      return
    }

    memberInfo.value = {
      id: memberId,
      name: route.query.name || '成员',
      avatar: route.query.avatar || '',
      phone: route.query.phone || ''
    }

    const result = await getMemberPermissions(ledgerId, memberId)
    if (result) {
      selectedRole.value = result.role || 'member'
      Object.assign(permissions, {
        addRecord: result.permissions?.addRecord || 'all',
        editRecord: result.permissions?.editRecord || 'self',
        deleteRecord: result.permissions?.deleteRecord || 'self',
        updateReimburseStatus: result.permissions?.updateReimburseStatus || 'self',
        exportReport: result.permissions?.exportReport || 'none'
      })
    }
  } catch (error) {
    console.error('获取权限信息失败:', error)
  } finally {
    loading.value = false
  }
}

const selectRole = (role) => {
  selectedRole.value = role
}

const formatPhone = (phone) => {
  if (!phone) return ''
  const str = String(phone)
  return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const onBack = () => {
  router.back()
}

const handleSave = async () => {
  try {
    saving.value = true
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    const memberId = route.query.memberId

    if (!ledgerId || !memberId) {
      showToast('参数错误')
      return
    }

    const data = {
      role: selectedRole.value,
      permissions: {
        addRecord: permissions.addRecord,
        editRecord: permissions.editRecord,
        deleteRecord: permissions.deleteRecord,
        updateReimburseStatus: permissions.updateReimburseStatus,
        exportReport: permissions.exportReport
      }
    }

    await updateMemberPermissions(ledgerId, memberId, data)
    showToast('保存成功')
    setTimeout(() => {
      router.back()
    }, 500)
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.permission-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.content-wrapper {
  padding-bottom: 100px;
}

.member-info-card {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background-color: #fff;
  margin-bottom: 15px;
}

.member-avatar-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: #969799;
}

.member-details {
  flex: 1;
}

.member-name {
  font-size: 18px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.member-phone {
  font-size: 14px;
  color: #969799;
}

.section-title {
  font-size: 14px;
  color: #969799;
  padding: 15px 20px 8px;
}

.role-icon {
  font-size: 18px;
  margin-right: 10px;
  color: #1989fa;
}

.save-button-wrapper {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
}

:deep(.van-cell-group--inset) {
  margin: 0 15px;
}
</style>
