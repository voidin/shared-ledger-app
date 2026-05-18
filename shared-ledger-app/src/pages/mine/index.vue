<template>
  <div class="mine-container">
    <div class="user-header" @click="goToProfile">
      <user-avatar
        :src="userStore.avatar"
        :size="70"
        :default-src="defaultAvatar"
      />
      <div class="user-info">
        <div class="nickname">
          {{ userStore.nickname || '未设置昵称' }}
        </div>
        <div class="user-id">
          ID: {{ userStore.userId || '-' }}
        </div>
      </div>
      <van-icon name="arrow" class="arrow-icon" />
    </div>

    <van-cell-group class="menu-group" inset>
      <van-cell
        title="我的账本"
        is-link
        value=""
        @click="goToLedgers"
      >
        <template #icon>
          <van-icon name="orders-o" class="menu-icon" />
        </template>
      </van-cell>
      
      <van-cell
        title="账单记录"
        is-link
        @click="goToRecords"
      >
        <template #icon>
          <van-icon name="todo-list-o" class="menu-icon" />
        </template>
      </van-cell>
      
      <van-cell
        title="成员管理"
        is-link
        @click="goToMembers"
      >
        <template #icon>
          <van-icon name="friends-o" class="menu-icon" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group class="menu-group" inset>
      <van-cell
        title="消息通知"
        is-link
        @click="goToNotifications"
      >
        <template #icon>
          <van-icon name="bell" class="menu-icon" />
        </template>
        <template #value>
          <van-badge
            v-if="unreadCount > 0"
            :content="unreadCount > 99 ? '99+' : unreadCount"
            max="99"
          />
        </template>
      </van-cell>
      
      <van-cell
        title="意见反馈"
        is-link
        @click="goToFeedback"
      >
        <template #icon>
          <van-icon name="comment-o" class="menu-icon" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group class="menu-group" inset>
      <van-cell
        title="设置"
        is-link
        @click="goToSettings"
      >
        <template #icon>
          <van-icon name="setting-o" class="menu-icon" />
        </template>
      </van-cell>
      
      <van-cell
        title="关于我们"
        is-link
        @click="showAbout"
      >
        <template #icon>
          <van-icon name="info-o" class="menu-icon" />
        </template>
      </van-cell>
    </van-cell-group>

    <div class="logout-button">
      <van-button
        type="default"
        block
        round
        @click="handleLogout"
      >
        退出登录
      </van-button>
    </div>

    <van-dialog
      v-model:show="showLogoutDialog"
      title="退出登录"
      message="确定要退出登录吗？"
      show-cancel-button
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const userStore = useUserStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const unreadCount = ref(0)
const showLogoutDialog = ref(false)

onMounted(async () => {
  try {
    await userStore.getUserInfo()
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
})

const goToProfile = () => {
  router.push('/mine/profile')
}

const goToLedgers = () => {
  router.push('/ledger/list')
}

const goToRecords = () => {
  router.push('/record/list')
}

const goToMembers = () => {
  router.push('/member/list')
}

const goToNotifications = () => {
  router.push('/notification/list')
}

const goToFeedback = () => {
  router.push('/feedback')
}

const goToSettings = () => {
  router.push('/settings')
}

const showAbout = () => {
  showToast('共享记账 v1.0.0')
}

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出登录吗？'
    })
    await userStore.logout()
    router.replace('/login')
  } catch (error) {
    if (error !== 'cancel') {
      showToast('退出失败')
    }
  }
}

const confirmLogout = async () => {
  try {
    await userStore.logout()
    router.replace('/login')
  } catch (error) {
    showToast('退出失败')
  }
}
</script>

<style scoped>
.mine-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.user-header {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 30px;
  cursor: pointer;
}

.user-info {
  flex: 1;
  margin-left: 15px;
  color: #ffffff;
}

.nickname {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.user-id {
  font-size: 12px;
  opacity: 0.8;
}

.arrow-icon {
  color: #ffffff;
  font-size: 18px;
}

.menu-group {
  margin: 15px 0;
}

.menu-icon {
  font-size: 18px;
  margin-right: 10px;
  color: #666666;
}

.logout-button {
  margin: 30px 20px 0;
}
</style>
