<template>
  <div class="edit-member-container">
    <van-nav-bar
      :title="isEditMode ? '编辑虚拟成员' : '添加虚拟成员'"
      left-arrow
      @click-left="onBack"
    />

    <div class="form-content">
      <van-form @submit="handleSubmit">
        <div class="avatar-section">
          <div class="avatar-label">头像选择</div>
          <div class="avatar-grid">
            <div
              v-for="avatar in avatarOptions"
              :key="avatar"
              class="avatar-item"
              :class="{ active: selectedAvatar === avatar }"
              @click="selectedAvatar = avatar"
            >
              <img :src="avatar" alt="avatar" class="avatar-img" />
              <van-icon
                v-if="selectedAvatar === avatar"
                name="success"
                class="selected-icon"
                color="#fff"
              />
            </div>
          </div>
        </div>

        <van-cell-group inset>
          <van-field
            v-model="memberName"
            label="名称"
            placeholder="请输入虚拟成员名称"
            :rules="[{ required: true, message: '请输入名称' }]"
          />
          <van-field
            v-model="memberDescription"
            label="描述"
            type="textarea"
            placeholder="请输入描述（可选）"
            rows="2"
            autosize
          />
        </van-cell-group>

        <div class="form-tip">
          <van-icon name="info-o" />
          <span>虚拟成员可用于报销人选择，方便统计</span>
        </div>

        <div class="form-buttons">
          <van-button
            v-if="isEditMode"
            type="danger"
            plain
            round
            block
            class="delete-btn"
            @click="handleDelete"
          >
            删除此成员
          </van-button>
          <van-button
            type="primary"
            round
            block
            native-type="submit"
            :loading="submitting"
          >
            保存
          </van-button>
        </div>
      </van-form>
    </div>

    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除虚拟成员"
      message="确定要删除此虚拟成员吗？"
      show-cancel-button
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import {
  createVirtualMember,
  getVirtualMembers,
  updateVirtualMember,
  deleteVirtualMember
} from '@/api/virtualMember'
import { useLedgerStore } from '@/stores/ledger'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()

const memberName = ref('')
const memberDescription = ref('')
const selectedAvatar = ref('')
const submitting = ref(false)
const showDeleteDialog = ref(false)
const memberId = ref(null)

const avatarOptions = ref([
  'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/peot-1.jpg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/peot-2.jpg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/peot-3.jpg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/peot-4.jpg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/peot-5.jpg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/peot-6.jpg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/peot-7.jpg'
])

const isEditMode = computed(() => !!memberId.value)

onMounted(async () => {
  memberId.value = route.query.id

  if (isEditMode.value) {
    await loadMemberDetail()
  } else {
    selectedAvatar.value = avatarOptions.value[0]
  }
})

const loadMemberDetail = async () => {
  try {
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    if (!ledgerId) {
      showToast('未选择账本')
      return
    }
    const members = await getVirtualMembers(ledgerId)
    const member = members.find(m => m.id === memberId.value)
    if (member) {
      memberName.value = member.name
      memberDescription.value = member.description || ''
      selectedAvatar.value = member.avatar || avatarOptions.value[0]
    }
  } catch (error) {
    console.error('获取成员信息失败:', error)
    showToast('获取信息失败')
  }
}

const onBack = () => {
  router.back()
}

const handleSubmit = async () => {
  if (!memberName.value.trim()) {
    showToast('请输入名称')
    return
  }

  try {
    submitting.value = true
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    if (!ledgerId) {
      showToast('未选择账本')
      return
    }

    const data = {
      name: memberName.value.trim(),
      description: memberDescription.value.trim(),
      avatar: selectedAvatar.value
    }

    if (isEditMode.value) {
      await updateVirtualMember(ledgerId, memberId.value, data)
      showToast('修改成功')
    } else {
      await createVirtualMember(ledgerId, data)
      showToast('添加成功')
    }

    setTimeout(() => {
      router.back()
    }, 500)
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  try {
    await showConfirmDialog({
      title: '删除虚拟成员',
      message: '确定要删除此虚拟成员吗？'
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
    await deleteVirtualMember(ledgerId, memberId.value)
    showToast('删除成功')
    setTimeout(() => {
      router.replace('/virtual/list')
    }, 500)
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败')
  }
}
</script>

<style scoped>
.edit-member-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.form-content {
  padding: 20px 0;
}

.avatar-section {
  padding: 15px;
  background-color: #fff;
  margin-bottom: 15px;
}

.avatar-label {
  font-size: 14px;
  color: #646566;
  margin-bottom: 12px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.avatar-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.avatar-item.active {
  border-color: #1989fa;
  transform: scale(1.05);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 16px;
  background-color: #1989fa;
  border-radius: 50%;
  padding: 2px;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  font-size: 12px;
  color: #969799;
}

.form-buttons {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.delete-btn {
  margin-bottom: 0;
}

:deep(.van-cell-group--inset) {
  margin: 0 15px 15px;
}
</style>
