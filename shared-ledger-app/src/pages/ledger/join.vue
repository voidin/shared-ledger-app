<template>
  <div class="join-page">
    <van-nav-bar
      title="加入账本"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="join-content">
      <div class="invite-code-section">
        <div class="section-icon">
          <van-icon name="invitation" />
        </div>
        <div class="section-title">输入邀请码</div>
        <van-field
          v-model="inviteCode"
          placeholder="请输入6位邀请码"
          maxlength="6"
          class="code-input"
          :disabled="joining"
          @input="handleCodeInput"
        />
      </div>

      <van-button
        type="primary"
        block
        round
        :loading="previewLoading"
        :disabled="inviteCode.length !== 6"
        @click="handlePreview"
        class="preview-btn"
      >
        预览账本
      </van-button>

      <van-divider>预览信息</van-divider>

      <div v-if="previewData" class="preview-card">
        <div class="preview-header">
          <div class="ledger-icon" :class="previewData.type === 'expense' ? 'expense-type' : 'personal-type'">
            <van-icon :name="previewData.type === 'expense' ? 'description' : 'user-o'" />
          </div>
          <div class="preview-info">
            <div class="preview-name">{{ previewData.name }}</div>
            <div class="preview-desc" v-if="previewData.description">
              {{ previewData.description }}
            </div>
          </div>
        </div>

        <div class="preview-stats">
          <div class="stat-item">
            <van-icon name="friends-o" />
            <span>{{ previewData.memberCount || 1 }} 人</span>
          </div>
          <div class="stat-item">
            <van-tag v-if="previewData.type === 'expense'" type="warning">报销</van-tag>
            <van-tag v-else type="success">个人</van-tag>
          </div>
        </div>

        <div class="preview-creator" v-if="previewData.creatorName">
          <span>创建者：{{ previewData.creatorName }}</span>
        </div>
      </div>

      <van-empty
        v-else-if="inviteCode.length === 6 && !previewData"
        description="正在加载..."
      />

      <div class="join-btn-wrapper" v-if="previewData">
        <van-button
          type="primary"
          block
          round
          :loading="joining"
          :disabled="joining"
          @click="handleJoin"
        >
          加入账本
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { joinLedger } from '@/api/ledger'
import { useLedgerStore } from '@/stores/ledger'

const router = useRouter()
const ledgerStore = useLedgerStore()

const inviteCode = ref('')
const previewData = ref(null)
const previewLoading = ref(false)
const joining = ref(false)

let previewTimer = null

const handleCodeInput = (value) => {
  inviteCode.value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  
  if (previewTimer) {
    clearTimeout(previewTimer)
  }
  
  if (inviteCode.value.length === 6) {
    previewTimer = setTimeout(() => {
      handlePreview()
    }, 500)
  } else {
    previewData.value = null
  }
}

const handlePreview = async () => {
  if (inviteCode.value.length !== 6) return
  
  previewLoading.value = true
  try {
    const data = await joinLedger(inviteCode.value)
    previewData.value = data
  } catch (error) {
    showToast(error.message || '无效的邀请码')
    previewData.value = null
  } finally {
    previewLoading.value = false
  }
}

const handleJoin = async () => {
  if (!previewData.value) return
  
  joining.value = true
  try {
    await ledgerStore.fetchLedgerList()
    showSuccessToast('加入成功')
    
    setTimeout(() => {
      router.replace({
        name: 'LedgerDetail',
        params: { id: previewData.value.id }
      })
    }, 500)
  } catch (error) {
    showToast(error.message || '加入失败')
  } finally {
    joining.value = false
  }
}

const goBack = () => {
  if (inviteCode.value) {
    previewData.value = null
    inviteCode.value = ''
  } else {
    router.back()
  }
}
</script>

<style scoped>
.join-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.join-content {
  padding: 24px 20px;
}

.invite-code-section {
  text-align: center;
  margin-bottom: 24px;
}

.section-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.section-icon .van-icon {
  font-size: 32px;
  color: #ffffff;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 20px;
}

.code-input {
  background: #ffffff;
  border-radius: 12px;
  font-size: 24px;
  letter-spacing: 8px;
  text-align: center;
  padding: 16px;
}

.preview-btn {
  margin-bottom: 24px;
}

.preview-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.preview-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.ledger-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
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

.preview-info {
  flex: 1;
}

.preview-name {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.preview-desc {
  font-size: 14px;
  color: #969799;
}

.preview-stats {
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

.preview-creator {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebedf0;
  font-size: 13px;
  color: #969799;
}

.join-btn-wrapper {
  margin-top: 32px;
}
</style>
