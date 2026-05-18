<template>
  <div class="members-page">
    <van-nav-bar
      title="成员管理"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="members-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="member-count">
          共 {{ members.length }} 位成员
        </div>

        <van-cell-group inset>
          <van-cell
            v-for="member in members"
            :key="member.id"
            class="member-cell"
          >
            <template #title>
              <div class="member-info">
                <van-image
                  :src="member.avatar"
                  round
                  width="44"
                  height="44"
                  fit="cover"
                  class="member-avatar"
                >
                  <template #error>
                    <div class="avatar-placeholder">
                      <van-icon name="user-o" size="24" />
                    </div>
                  </template>
                </van-image>
                <div class="member-detail">
                  <div class="member-name">
                    {{ member.name || member.nickname || '用户' + member.id.slice(-4) }}
                    <van-tag v-if="member.role === 'creator'" type="danger" size="small">
                      创建者
                    </van-tag>
                    <van-tag v-else-if="member.role === 'admin'" type="warning" size="small">
                      管理员
                    </van-tag>
                  </div>
                  <div class="member-phone" v-if="member.phone">
                    {{ formatPhone(member.phone) }}
                  </div>
                </div>
              </div>
            </template>
            
            <template #extra>
              <div class="member-actions" v-if="canManage(member)">
                <van-button
                  v-if="canSetRole(member)"
                  size="small"
                  type="primary"
                  plain
                  @click="handleSetRole(member)"
                >
                  设置角色
                </van-button>
                <van-button
                  v-if="canRemove(member)"
                  size="small"
                  type="danger"
                  plain
                  @click="handleRemove(member)"
                >
                  移除
                </van-button>
              </div>
            </template>
          </van-cell>
        </van-cell-group>

        <van-empty
          v-if="!loading && members.length === 0"
          description="暂无成员"
        />
      </van-pull-refresh>
    </div>

    <van-action-sheet
      v-model:show="showRoleSheet"
      :actions="roleActions"
      cancel-text="取消"
      @select="onRoleSelect"
    />

    <van-dialog
      v-model:show="showRemoveConfirm"
      title="确认移除成员"
      show-cancel-button
      @confirm="confirmRemove"
    >
      <div class="remove-dialog-content">
        <p>确定要移除成员 <strong>{{ currentMember?.name }}</strong> 吗？</p>
        <p class="warning-text">移除后该成员将无法查看和记录该账本的收支。</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useLedgerStore } from '@/stores/ledger'
import { useUserStore } from '@/stores/user'
import { updateMemberRole, removeMember as apiRemoveMember } from '@/api/ledger'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()
const userStore = useUserStore()

const ledgerId = computed(() => route.params.id)

const members = ref([])
const loading = ref(false)
const refreshing = ref(false)
const currentMember = ref(null)
const showRoleSheet = ref(false)
const showRemoveConfirm = ref(false)

const roleActions = [
  { name: '管理员', value: 'admin' },
  { name: '成员', value: 'member' }
]

const currentUserId = computed(() => userStore.userInfo?.id)
const currentUserRole = computed(() => {
  const member = members.value.find(m => m.userId === currentUserId.value)
  return member?.role || 'member'
})

const isCreator = computed(() => currentUserRole.value === 'creator')
const isAdmin = computed(() => currentUserRole.value === 'creator' || currentUserRole.value === 'admin')

const canManage = (member) => {
  if (member.userId === currentUserId.value) return false
  return isAdmin.value
}

const canSetRole = (member) => {
  if (member.userId === currentUserId.value) return false
  if (!isCreator.value) return false
  if (member.role === 'creator') return false
  return true
}

const canRemove = (member) => {
  if (member.userId === currentUserId.value) return false
  if (member.role === 'creator') return false
  if (!isAdmin.value) return false
  return true
}

const fetchMembers = async () => {
  loading.value = true
  try {
    const data = await ledgerStore.fetchMembers(ledgerId.value)
    members.value = data || []
  } catch (error) {
    showToast('获取成员列表失败')
  } finally {
    loading.value = false
  }
}

const onRefresh = async () => {
  try {
    await fetchMembers()
  } finally {
    refreshing.value = false
  }
}

const goBack = () => {
  router.back()
}

const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const handleSetRole = (member) => {
  currentMember.value = member
  showRoleSheet.value = true
}

const onRoleSelect = async (action) => {
  showRoleSheet.value = false
  
  if (!currentMember.value) return
  
  try {
    await updateMemberRole(ledgerId.value, currentMember.value.userId, action.value)
    
    const index = members.value.findIndex(m => m.userId === currentMember.value.userId)
    if (index !== -1) {
      members.value[index].role = action.value
    }
    
    showToast('设置成功')
  } catch (error) {
    showToast('设置失败')
  }
}

const handleRemove = (member) => {
  currentMember.value = member
  showRemoveConfirm.value = true
}

const confirmRemove = async () => {
  if (!currentMember.value) return
  
  try {
    await apiRemoveMember(ledgerId.value, currentMember.value.userId)
    
    members.value = members.value.filter(m => m.userId !== currentMember.value.userId)
    
    showToast('已移除成员')
  } catch (error) {
    showToast('移除失败')
  }
}

onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
.members-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.members-content {
  padding: 12px 0 100px;
}

.member-count {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
  padding: 0 16px;
}

.member-cell {
  padding: 12px 16px;
}

.member-info {
  display: flex;
  align-items: center;
}

.member-avatar {
  margin-right: 12px;
}

.avatar-placeholder {
  width: 44px;
  height: 44px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #969799;
}

.member-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-phone {
  font-size: 13px;
  color: #969799;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.remove-dialog-content {
  padding: 20px 16px;
  text-align: center;
}

.remove-dialog-content p {
  margin: 0 0 8px;
  color: #323233;
}

.warning-text {
  font-size: 13px;
  color: #969799;
}
</style>
