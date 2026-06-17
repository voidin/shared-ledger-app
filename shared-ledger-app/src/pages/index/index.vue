<template>
  <div class="index-page">
    <van-nav-bar title="我的账本" fixed placeholder>
      <template #right>
        <van-icon name="plus" size="20" @click="showActionSheet = true" />
      </template>
    </van-nav-bar>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="content-wrapper">
        <div v-if="myLedgers.length > 0">
          <div class="section-title">我创建的账本</div>
          <div class="ledger-list">
            <LedgerCard
              v-for="ledger in myLedgers"
              :key="ledger.id"
              :ledger="ledger"
              @click="goToLedger(ledger)"
            />
          </div>
        </div>

        <div v-if="joinedLedgers.length > 0">
          <div class="section-title">我加入的账本</div>
          <div class="ledger-list">
            <LedgerCard
              v-for="ledger in joinedLedgers"
              :key="ledger.id"
              :ledger="ledger"
              @click="goToLedger(ledger)"
            />
          </div>
        </div>

        <van-empty
          v-if="!loading && ledgerList.length === 0"
          description="还没有账本，创建一个开始记账吧"
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
        >
          <van-button round type="primary" @click="goToCreate">
            创建账本
          </van-button>
        </van-empty>
      </div>
    </van-pull-refresh>

    <van-tabbar v-model="activeTab" fixed placeholder safe-area-inset-bottom>
      <van-tabbar-item icon-prefix="van-icon" name="ledger">
        <template #icon>
          <van-icon name="orders-o" />
        </template>
        账本
      </van-tabbar-item>
      <van-tabbar-item icon-prefix="van-icon" name="add" @click="goToAddExpense">
        <template #icon>
          <div class="add-icon-wrapper">
            <van-icon name="plus" />
          </div>
        </template>
        记一笔
      </van-tabbar-item>
      <van-tabbar-item icon-prefix="van-icon" name="mine">
        <template #icon>
          <van-icon name="user-o" />
        </template>
        我的
      </van-tabbar-item>
    </van-tabbar>

    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actions"
      cancel-text="取消"
      @select="onSelectAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useLedgerStore } from '@/stores/ledger'
import LedgerCard from '@/components/LedgerCard.vue'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()

const activeTab = ref('ledger')
const refreshing = ref(false)
const loading = ref(false)
const showActionSheet = ref(false)

const actions = [
  { name: '创建账本', key: 'create' },
  { name: '加入账本', key: 'join' }
]

const myLedgers = computed(() => {
  return ledgerStore.ledgerList.filter(ledger => ledger.isCreator)
})

const joinedLedgers = computed(() => {
  return ledgerStore.ledgerList.filter(ledger => !ledger.isCreator)
})

const fetchLedgers = async () => {
  loading.value = true
  try {
    await ledgerStore.fetchLedgerList()
  } catch (error) {
    showToast('获取账本列表失败')
  } finally {
    loading.value = false
  }
}

const onRefresh = async () => {
  try {
    await fetchLedgers()
    showToast('刷新成功')
  } finally {
    refreshing.value = false
  }
}

const goToLedger = (ledger) => {
  router.push({
    name: 'LedgerDetail',
    params: { id: ledger.id }
  })
}

const goToCreate = () => {
  router.push({ name: 'CreateLedger' })
}

const goToJoin = () => {
  router.push({ name: 'JoinLedger' })
}

const goToAddExpense = () => {
  if (ledgerStore.ledgerList.length === 0) {
    showConfirmDialog({
      title: '提示',
      message: '请先创建一个账本'
    }).then(() => {
      goToCreate()
    }).catch(() => {})
    return
  }
  router.push({ name: 'AddExpense' })
}

const onSelectAction = (action) => {
  showActionSheet.value = false
  if (action.key === 'create') {
    goToCreate()
  } else if (action.key === 'join') {
    goToJoin()
  }
}

onMounted(() => {
  fetchLedgers()
})
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content-wrapper {
  padding: 12px 16px 100px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #969799;
  margin-bottom: 12px;
  padding-left: 4px;
}

.ledger-list {
  margin-bottom: 16px;
}

.add-icon-wrapper {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20px;
  margin-top: -10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
