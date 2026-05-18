<template>
  <div class="export-page">
    <van-nav-bar
      title="导出报表"
      left-arrow
      @click-left="onBack"
    />

    <div class="export-content">
      <van-cell-group inset title="导出条件">
        <van-cell title="时间范围">
          <template #value>
            <van-dropdown-menu>
              <van-dropdown-item
                v-model="filterForm.dateRange"
                :options="dateRangeOptions"
                @change="handleDateRangeChange"
              />
            </van-dropdown-menu>
          </template>
        </van-cell>

        <van-cell title="报销状态">
          <template #value>
            <van-dropdown-menu>
              <van-dropdown-item
                v-model="filterForm.status"
                :options="statusOptions"
                @change="handleStatusChange"
              />
            </van-dropdown-menu>
          </template>
        </van-cell>

        <van-cell title="报销类型">
          <template #value>
            <van-dropdown-menu>
              <van-dropdown-item
                v-model="filterForm.type"
                :options="typeOptions"
                @change="handleTypeChange"
              />
            </van-dropdown-menu>
          </template>
        </van-cell>
      </van-cell-group>

      <div class="export-actions">
        <van-button
          type="primary"
          block
          round
          :loading="exporting"
          :disabled="!canExport"
          @click="handleExport"
        >
          <van-icon name="down" style="margin-right: 6px;" />
          导出Excel
        </van-button>
      </div>

      <van-cell-group inset title="导出历史" class="history-group">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadExportHistory"
        >
          <div
            v-for="item in exportHistory"
            :key="item.id"
            class="history-item"
          >
            <div class="history-info">
              <div class="history-name">{{ item.fileName }}</div>
              <div class="history-meta">
                <span>{{ item.createTime }}</span>
                <span class="separator">|</span>
                <span>{{ item.recordCount }} 条记录</span>
              </div>
            </div>
            <div class="history-actions">
              <van-tag
                v-if="item.status === 'completed'"
                type="success"
                size="medium"
              >
                已完成
              </van-tag>
              <van-tag
                v-else-if="item.status === 'processing'"
                type="warning"
                size="medium"
              >
                处理中
              </van-tag>
              <van-tag
                v-else
                type="danger"
                size="medium"
              >
                失败
              </van-tag>
              <van-button
                v-if="item.status === 'completed'"
                size="small"
                type="primary"
                plain
                @click="handleDownload(item)"
              >
                下载
              </van-button>
              <van-button
                v-if="item.status !== 'processing'"
                size="small"
                type="default"
                plain
                @click="handleDelete(item)"
              >
                删除
              </van-button>
            </div>
          </div>
        </van-list>

        <empty-state
          v-if="!loading && exportHistory.length === 0"
          icon="description"
          title="暂无导出记录"
          description="导出Excel后将显示在这里"
        />
      </van-cell-group>

      <div class="export-tips">
        <div class="tip-title">温馨提示</div>
        <ul class="tip-list">
          <li>导出文件仅保留7天，请及时下载</li>
          <li>支持导出报销记录、明细汇总等</li>
          <li>大文件导出可能需要等待几分钟</li>
        </ul>
      </div>
    </div>

    <van-dialog
      v-model:show="showDatePicker"
      title="选择日期范围"
      show-cancel-button
      @confirm="confirmDateRange"
    >
      <van-calendar
        v-model:show="showDatePicker"
        type="range"
        :default-date="[startDate, endDate]"
        @confirm="onDateConfirm"
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import { exportExcel, getExportHistory, downloadExport, deleteExport } from '@/api/export'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const route = useRoute()

const ledgerId = route.params.ledgerId || route.query.ledgerId || '1'

const exporting = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = ref(20)

const filterForm = reactive({
  dateRange: 'month',
  status: 'all',
  type: 'all'
})

const exportHistory = ref([])

const dateRangeOptions = [
  { text: '本周', value: 'week' },
  { text: '本月', value: 'month' },
  { text: '本季度', value: 'quarter' },
  { text: '本年', value: 'year' },
  { text: '自定义', value: 'custom' }
]

const statusOptions = [
  { text: '全部', value: 'all' },
  { text: '待提交', value: 'pending' },
  { text: '审批中', value: 'approving' },
  { text: '已通过', value: 'approved' },
  { text: '已驳回', value: 'rejected' },
  { text: '已报销', value: 'reimbursed' }
]

const typeOptions = [
  { text: '全部', value: 'all' },
  { text: '差旅费', value: 'travel' },
  { text: '餐饮费', value: 'meal' },
  { text: '交通费', value: 'transport' },
  { text: '办公费', value: 'office' },
  { text: '其他', value: 'other' }
]

const showDatePicker = ref(false)
const startDate = ref(new Date())
const endDate = ref(new Date())

const canExport = computed(() => {
  return filterForm.dateRange && filterForm.status
})

onMounted(async () => {
  await loadExportHistory()
})

const getDateRangeParams = () => {
  const now = new Date()
  let start, end
  
  end = now.toISOString().split('T')[0]
  
  switch (filterForm.dateRange) {
    case 'week':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      start = weekStart.toISOString().split('T')[0]
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      break
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3
      start = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0]
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      break
    case 'custom':
      start = startDate.value.toISOString().split('T')[0]
      end = endDate.value.toISOString().split('T')[0]
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }
  
  return { startDate: start, endDate: end }
}

const handleExport = async () => {
  try {
    exporting.value = true
    
    const params = getDateRangeParams()
    const data = {
      startDate: params.startDate,
      endDate: params.endDate,
      status: filterForm.status !== 'all' ? filterForm.status : null,
      type: filterForm.type !== 'all' ? filterForm.type : null
    }
    
    await exportExcel(ledgerId, data)
    showToast('导出任务已创建，请稍后在导出历史中查看')
    
    page.value = 1
    exportHistory.value = []
    await loadExportHistory()
  } catch (error) {
    console.error('导出失败:', error)
    showToast('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

const loadExportHistory = async () => {
  try {
    loading.value = true
    
    const data = await getExportHistory(ledgerId, {
      page: page.value,
      pageSize: pageSize.value
    })
    
    const list = data.list || []
    
    if (page.value === 1) {
      exportHistory.value = list
    } else {
      exportHistory.value = [...exportHistory.value, ...list]
    }
    
    if (list.length < pageSize.value) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (error) {
    console.error('加载导出历史失败:', error)
    showToast('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

const handleDownload = async (item) => {
  try {
    showToast('正在准备下载...')
    
    const blob = await downloadExport(item.id)
    
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.download = item.fileName || 'export.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    showToast('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    showToast('下载失败，请重试')
  }
}

const handleDelete = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条导出记录吗？'
    })
    
    await deleteExport(item.id)
    exportHistory.value = exportHistory.value.filter(h => h.id !== item.id)
    showToast('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      showToast('删除失败')
    }
  }
}

const handleDateRangeChange = (value) => {
  filterForm.dateRange = value
  
  if (value === 'custom') {
    showDatePicker.value = true
  }
}

const handleStatusChange = (value) => {
  filterForm.status = value
}

const handleTypeChange = (value) => {
  filterForm.type = value
}

const onDateConfirm = (date) => {
  const [start, end] = date
  startDate.value = start
  endDate.value = end
  showDatePicker.value = false
  
  filterForm.dateRange = 'custom'
}

const confirmDateRange = () => {
  console.log('Confirm date range')
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.export-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.export-content {
  padding: 16px 0;
}

.export-actions {
  margin: 24px 16px;
}

.history-group {
  margin-top: 16px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-meta {
  font-size: 12px;
  color: #969799;
  display: flex;
  align-items: center;
  gap: 6px;
}

.separator {
  color: #dcdee0;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.export-tips {
  margin: 24px 16px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.tip-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 10px;
}

.tip-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #646566;
  line-height: 1.8;
}

.tip-list li {
  margin-bottom: 4px;
}
</style>
