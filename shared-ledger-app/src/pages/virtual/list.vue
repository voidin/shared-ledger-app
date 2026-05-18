<template>
  <div class="virtual-list-container">
    <van-nav-bar
      title="虚拟成员"
      left-arrow
      @click-left="onBack"
    />

    <div class="content-wrapper">
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" color="#1989fa" />
      </div>

      <div v-else-if="virtualMembers.length === 0" class="empty-container">
        <van-empty description="暂无虚拟成员">
          <template #image>
            <van-icon name="friends-o" size="80" color="#dcdee0" />
          </template>
          <van-button type="primary" round @click="goToAddMember">
            添加虚拟成员
          </van-button>
        </van-empty>
      </div>

      <div v-else class="member-list">
        <van-cell-group inset>
          <van-swipe-cell
            v-for="member in virtualMembers"
            :key="member.id"
          >
            <van-cell
              center
              @click="goToEditMember(member.id)"
            >
              <template #icon>
                <div class="member-avatar-wrapper">
                  <img
                    v-if="member.avatar"
                    :src="member.avatar"
                    class="member-avatar"
                    alt="avatar"
                  />
                  <van-icon
                    v-else
                    name="user-o"
                    size="24"
                    class="member-avatar-placeholder"
                  />
                  <div class="virtual-badge">虚</div>
                </div>
              </template>
              <template #title>
                <div class="member-name">{{ member.name }}</div>
              </template>
              <template #label>
                <div class="member-info">
                  {{ member.description || '暂无描述' }}
                </div>
              </template>
              <template #right-icon>
                <van-icon name="arrow" color="#969799" />
              </template>
            </van-cell>
            <template #right>
              <van-button
                square
                type="danger"
                text="删除"
                class="delete-button"
                @click="handleDelete(member)"
              />
            </template>
          </van-swipe-cell>
        </van-cell-group>
      </div>
    </div>

    <div v-if="!loading && virtualMembers.length > 0" class="add-button-wrapper">
      <van-button
        type="primary"
        round
        block
        icon="plus"
        @click="goToAddMember"
      >
        添加虚拟成员
      </van-button>
    </div>

    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除虚拟成员"
      :message="`确定要删除虚拟成员"${currentMember?.name}"吗？`"
      show-cancel-button
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import { getVirtualMembers, deleteVirtualMember } from '@/api/virtualMember'
import { useLedgerStore } from '@/stores/ledger'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()

const loading = ref(false)
const virtualMembers = ref([])
const showDeleteDialog = ref(false)
const currentMember = ref(null)

onMounted(async () => {
  await loadVirtualMembers()
})

const loadVirtualMembers = async () => {
  try {
    loading.value = true
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    if (!ledgerId) {
      showToast('未选择账本')
      return
    }
    virtualMembers.value = await getVirtualMembers(ledgerId)
  } catch (error) {
    console.error('获取虚拟成员列表失败:', error)
    showToast('获取列表失败')
  } finally {
    loading.value = false
  }
}

const onBack = () => {
  router.back()
}

const goToAddMember = () => {
  router.push('/virtual/add')
}

const goToEditMember = (id) => {
  router.push(`/virtual/edit?id=${id}`)
}

const handleDelete = async (member) => {
  currentMember.value = member
  try {
    await showConfirmDialog({
      title: '删除虚拟成员',
      message: `确定要删除虚拟成员"${member.name}"吗？`
    })
    await confirmDelete()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const confirmDelete = async () => {
  try {
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    await deleteVirtualMember(ledgerId, currentMember.value.id)
    showToast('删除成功')
    await loadVirtualMembers()
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败')
  }
}
</script>

<style scoped>
.virtual-list-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content-wrapper {
  padding: 15px 0;
  padding-bottom: 80px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-container {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.member-list :deep(.van-cell-group--inset) {
  margin: 0 15px;
}

.member-list :deep(.van-cell) {
  padding: 12px 16px;
}

.member-list :deep(.van-swipe-cell__right) {
  display: flex;
  align-items: center;
}

.delete-button {
  height: 100%;
  border-radius: 0;
}

.member-avatar-wrapper {
  position: relative;
  width: 44px;
  height: 44px;
  margin-right: 12px;
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f5f5f5;
}

.member-avatar-placeholder {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 50%;
  color: #969799;
}

.virtual-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background-color: #1989fa;
  color: #fff;
  font-size: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

.member-name {
  font-size: 16px;
  color: #323233;
  font-weight: 500;
}

.member-info {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.add-button-wrapper {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
}
</style>
