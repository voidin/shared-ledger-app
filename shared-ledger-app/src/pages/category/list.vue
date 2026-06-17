<template>
  <div class="category-list-container">
    <van-nav-bar
      title="分类管理"
      left-arrow
      @click-left="onBack"
    />

    <div class="content-wrapper">
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" color="#1989fa" />
      </div>

      <div v-else-if="categories.length === 0" class="empty-container">
        <van-empty description="暂无分类">
          <template #image>
            <van-icon name="cluster-o" size="80" color="#dcdee0" />
          </template>
          <van-button type="primary" round @click="showAddDialog">
            添加分类
          </van-button>
        </van-empty>
      </div>

      <div v-else class="category-list">
        <van-cell-group inset>
          <van-swipe-cell
            v-for="category in categories"
            :key="category.id"
          >
            <van-cell
              center
              @click="showEditDialog(category)"
            >
              <template #icon>
                <div class="category-icon-wrapper">
                  <span class="category-icon">{{ getCategoryEmoji(category.icon) }}</span>
                </div>
              </template>
              <template #title>
                <div class="category-name">{{ category.name }}</div>
              </template>
              <template #label>
                <div class="category-info">
                  <van-tag
                    v-if="category.type === 'expense'"
                    type="danger"
                    size="small"
                  >
                    支出
                  </van-tag>
                  <van-tag
                    v-else-if="category.type === 'income'"
                    type="success"
                    size="small"
                  >
                    收入
                  </van-tag>
                  <span class="category-description">
                    {{ category.description || '暂无描述' }}
                  </span>
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
                @click="handleDelete(category)"
              />
            </template>
          </van-swipe-cell>
        </van-cell-group>
      </div>
    </div>

    <div v-if="!loading && categories.length > 0" class="add-button-wrapper">
      <van-button
        type="primary"
        round
        block
        icon="plus"
        @click="showAddDialog"
      >
        添加分类
      </van-button>
    </div>

    <van-dialog
      v-model:show="showDialog"
      :title="isEditMode ? '编辑分类' : '添加分类'"
      show-cancel-button
      @confirm="handleConfirm"
    >
      <div class="dialog-content">
        <van-cell-group>
          <van-field
            v-model="formData.name"
            label="名称"
            placeholder="请输入分类名称"
          />
          <van-field
            v-model="formData.description"
            label="描述"
            placeholder="请输入分类描述（可选）"
          />
        </van-cell-group>

        <div class="icon-section">
          <div class="section-label">选择图标</div>
          <div class="icon-grid">
            <div
              v-for="icon in iconOptions"
              :key="icon"
              class="icon-item"
              :class="{ active: formData.icon === icon }"
              @click="formData.icon = icon"
            >
              <span class="icon-emoji">{{ icon }}</span>
            </div>
          </div>
        </div>

        <div class="type-section">
          <div class="section-label">分类类型</div>
          <van-radio-group v-model="formData.type" direction="horizontal">
            <van-radio name="expense" shape="square">支出</van-radio>
            <van-radio name="income" shape="square">收入</van-radio>
          </van-radio-group>
        </div>
      </div>
    </van-dialog>

    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除分类"
      :message="deleteMessage"
      show-cancel-button
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/category'
import { useLedgerStore } from '@/stores/ledger'

const router = useRouter()
const route = useRoute()
const ledgerStore = useLedgerStore()

const loading = ref(false)
const categories = ref([])
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditMode = ref(false)
const currentCategory = ref(null)

const formData = reactive({
  id: null,
  name: '',
  description: '',
  icon: '📦',
  type: 'expense'
})

const iconOptions = [
  '🍔', '🚗', '🏠', '👔', '💊', '🎮', '📱', '✈️',
  '🎁', '📚', '🎵', '💄', '🏋️', '☕', '🛒', '💰',
  '🍜', '🚕', '💡', '🎯', '🌸', '⭐', '🔥', '🎪'
]

const deleteMessage = computed(() => {
  return `确定要删除分类"${currentCategory.value?.name}"吗？`
})

onMounted(async () => {
  await loadCategories()
})

const loadCategories = async () => {
  try {
    loading.value = true
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    if (!ledgerId) {
      showToast('未选择账本')
      return
    }
    categories.value = await getCategories(ledgerId)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    showToast('获取列表失败')
  } finally {
    loading.value = false
  }
}

const getCategoryEmoji = (icon) => {
  return icon || '📦'
}

const onBack = () => {
  router.back()
}

const showAddDialog = () => {
  isEditMode.value = false
  formData.id = null
  formData.name = ''
  formData.description = ''
  formData.icon = '📦'
  formData.type = 'expense'
  showDialog.value = true
}

const showEditDialog = (category) => {
  isEditMode.value = true
  currentCategory.value = category
  formData.id = category.id
  formData.name = category.name
  formData.description = category.description || ''
  formData.icon = category.icon || '📦'
  formData.type = category.type || 'expense'
  showDialog.value = true
}

const handleConfirm = async () => {
  if (!formData.name.trim()) {
    showToast('请输入分类名称')
    return
  }

  try {
    const ledgerId = ledgerStore.currentLedgerId || route.query.ledgerId
    if (!ledgerId) {
      showToast('未选择账本')
      return
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      icon: formData.icon,
      type: formData.type
    }

    if (isEditMode.value) {
      await updateCategory(formData.id, data)
      showToast('修改成功')
    } else {
      await createCategory(ledgerId, data)
      showToast('添加成功')
    }

    await loadCategories()
  } catch (error) {
    console.error('操作失败:', error)
    showToast('操作失败')
  }
}

const handleDelete = async (category) => {
  currentCategory.value = category
  try {
    await showConfirmDialog({
      title: '删除分类',
      message: `确定要删除分类"${category.name}"吗？`
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
    await deleteCategory(currentCategory.value.id)
    showToast('删除成功')
    await loadCategories()
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败')
  }
}
</script>

<style scoped>
.category-list-container {
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

.category-list :deep(.van-cell-group--inset) {
  margin: 0 15px;
}

.category-list :deep(.van-cell) {
  padding: 12px 16px;
}

.category-list :deep(.van-swipe-cell__right) {
  display: flex;
  align-items: center;
}

.delete-button {
  height: 100%;
  border-radius: 0;
}

.category-icon-wrapper {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.category-icon {
  font-size: 24px;
}

.category-name {
  font-size: 16px;
  color: #323233;
  font-weight: 500;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.category-description {
  font-size: 12px;
  color: #969799;
}

.add-button-wrapper {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
}

.dialog-content {
  padding: 15px;
}

.icon-section {
  margin-top: 15px;
}

.section-label {
  font-size: 14px;
  color: #646566;
  margin-bottom: 10px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.icon-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.icon-item.active {
  border-color: #1989fa;
  background-color: #e6f4ff;
}

.icon-emoji {
  font-size: 20px;
}

.type-section {
  margin-top: 15px;
}
</style>
