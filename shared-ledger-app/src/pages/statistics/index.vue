<template>
  <div class="statistics-page">
    <van-nav-bar
      title="统计报表"
      left-arrow
      @click-left="onBack"
    />

    <div class="statistics-header">
      <van-dropdown-menu>
        <van-dropdown-item
          v-model="dateRange"
          :options="dateRangeOptions"
          @change="handleDateRangeChange"
        />
      </van-dropdown-menu>
    </div>

    <van-tabs v-model:active="activeTab" @change="handleTabChange">
      <van-tab title="汇总" name="summary">
        <div class="tab-content">
          <div class="stat-cards-grid">
            <stat-card
              title="总支出"
              :value="summaryData.totalExpense"
              prefix="¥"
              :decimal="2"
              icon="paid"
              icon-color="#ee0a24"
              @click="handleCardClick('expense')"
            />
            <stat-card
              title="总收入"
              :value="summaryData.totalIncome"
              prefix="¥"
              :decimal="2"
              icon="points"
              icon-color="#07c160"
              @click="handleCardClick('income')"
            />
            <stat-card
              title="报销笔数"
              :value="summaryData.reimburseCount"
              icon="orders-o"
              icon-color="#1989fa"
            />
            <stat-card
              title="待报销"
              :value="summaryData.pendingCount"
              icon="clock-o"
              icon-color="#ff976a"
            />
          </div>

          <div class="section-title">支出趋势</div>
          <div class="chart-container" v-if="timelineData.length > 0">
            <div ref="timelineChartRef" class="timeline-chart"></div>
          </div>
          <empty-state
            v-else
            icon="chart-trending-o"
            title="暂无趋势数据"
            description="选择时间范围内有数据后将显示趋势图"
          />
        </div>
      </van-tab>

      <van-tab title="成员" name="member">
        <div class="tab-content">
          <div class="member-stats">
            <div
              v-for="member in memberStats"
              :key="member.memberId"
              class="member-item"
            >
              <div class="member-info">
                <user-avatar
                  :src="member.avatar"
                  :size="40"
                  :default-src="defaultAvatar"
                />
                <div class="member-details">
                  <div class="member-name">
                    {{ member.memberName }}
                    <van-tag v-if="member.isVirtual" type="primary" size="small">
                      虚拟
                    </van-tag>
                  </div>
                  <div class="member-count">{{ member.recordCount }} 笔报销</div>
                </div>
              </div>
              <div class="member-amount">
                <span class="amount-label">¥</span>
                <span class="amount-value">{{ formatAmount(member.totalAmount) }}</span>
              </div>
            </div>
          </div>
          <empty-state
            v-if="memberStats.length === 0"
            icon="friends-o"
            title="暂无成员数据"
            description="当前时间范围内没有成员的报销记录"
          />
        </div>
      </van-tab>

      <van-tab title="分类" name="category">
        <div class="tab-content">
          <div class="category-chart-container" v-if="categoryStats.length > 0">
            <div ref="categoryChartRef" class="category-chart"></div>
          </div>
          <div class="category-list">
            <div
              v-for="(category, index) in categoryStats"
              :key="category.categoryId"
              class="category-item"
            >
              <div class="category-info">
                <div
                  class="category-color"
                  :style="{ backgroundColor: categoryColors[index % categoryColors.length] }"
                />
                <span class="category-name">{{ category.categoryName }}</span>
              </div>
              <div class="category-stats">
                <span class="category-amount">¥{{ formatAmount(category.totalAmount) }}</span>
                <span class="category-percent">{{ category.percent }}%</span>
              </div>
            </div>
          </div>
          <empty-state
            v-if="categoryStats.length === 0"
            icon="cluster-o"
            title="暂无分类数据"
            description="当前时间范围内没有报销记录"
          />
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { showToast } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import { getSummary, getStatsByMember, getStatsByCategory, getTimeline } from '@/api/statistics'
import StatCard from '@/components/StatCard.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const route = useRoute()

const ledgerId = route.params.ledgerId || route.query.ledgerId || '1'

const activeTab = ref('summary')
const dateRange = ref('month')
const loading = ref(false)

const dateRangeOptions = [
  { text: '本周', value: 'week' },
  { text: '本月', value: 'month' },
  { text: '本季度', value: 'quarter' },
  { text: '本年', value: 'year' },
  { text: '自定义', value: 'custom' }
]

const summaryData = reactive({
  totalExpense: 0,
  totalIncome: 0,
  reimburseCount: 0,
  pendingCount: 0
})

const memberStats = ref([])
const categoryStats = ref([])
const timelineData = ref([])

const categoryColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
]

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    loading.value = true
    const params = getDateRangeParams()
    
    await Promise.all([
      loadSummary(params),
      loadMemberStats(params),
      loadCategoryStats(params),
      loadTimeline(params)
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
    showToast('加载数据失败')
  } finally {
    loading.value = false
  }
}

const getDateRangeParams = () => {
  const now = new Date()
  let startDate, endDate
  
  endDate = now.toISOString().split('T')[0]
  
  switch (dateRange.value) {
    case 'week':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      startDate = weekStart.toISOString().split('T')[0]
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      break
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3
      startDate = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0]
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }
  
  return { startDate, endDate }
}

const loadSummary = async (params) => {
  try {
    const data = await getSummary(ledgerId, params)
    summaryData.totalExpense = data.totalExpense || 0
    summaryData.totalIncome = data.totalIncome || 0
    summaryData.reimburseCount = data.reimburseCount || 0
    summaryData.pendingCount = data.pendingCount || 0
  } catch (error) {
    console.error('加载汇总数据失败:', error)
  }
}

const loadMemberStats = async (params) => {
  try {
    const data = await getStatsByMember(ledgerId, params)
    memberStats.value = data.members || []
  } catch (error) {
    console.error('加载成员统计失败:', error)
  }
}

const loadCategoryStats = async (params) => {
  try {
    const data = await getStatsByCategory(ledgerId, params)
    categoryStats.value = data.categories || []
  } catch (error) {
    console.error('加载分类统计失败:', error)
  }
}

const loadTimeline = async (params) => {
  try {
    const data = await getTimeline(ledgerId, { ...params, groupBy: 'day' })
    timelineData.value = data.timeline || []
    await nextTick()
    renderTimelineChart()
  } catch (error) {
    console.error('加载时间线数据失败:', error)
  }
}

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const handleDateRangeChange = async (value) => {
  if (value === 'custom') {
    showToast('自定义日期选择开发中')
    return
  }
  dateRange.value = value
  await loadData()
}

const handleTabChange = (name) => {
  activeTab.value = name
}

const handleCardClick = (type) => {
  console.log('Card clicked:', type)
}

const renderTimelineChart = () => {
  if (timelineData.value.length === 0) return
  
  const container = document.querySelector('.timeline-chart')
  if (!container) return
  
  let maxAmount = 0
  timelineData.value.forEach(item => {
    if (item.amount > maxAmount) maxAmount = item.amount
  })
  
  const chartHeight = 200
  const chartWidth = container.offsetWidth || 300
  const barWidth = Math.max(20, (chartWidth - 40) / timelineData.value.length - 4)
  
  let html = '<div class="simple-chart" style="display: flex; align-items: flex-end; justify-content: space-around; height: ' + chartHeight + 'px; padding: 0 10px;">'
  
  timelineData.value.forEach((item, index) => {
    const height = maxAmount > 0 ? (item.amount / maxAmount) * (chartHeight - 40) : 0
    const date = item.date ? item.date.substring(5) : ''
    html += '<div style="display: flex; flex-direction: column; align-items: center; flex: 1;">'
    html += '<div style="font-size: 10px; color: #969799; margin-bottom: 4px;">¥' + Math.round(item.amount) + '</div>'
    html += '<div style="width: ' + barWidth + 'px; height: ' + Math.max(2, height) + 'px; background: linear-gradient(180deg, #1989fa 0%, #0066cc 100%); border-radius: 4px 4px 0 0;"></div>'
    html += '<div style="font-size: 10px; color: #646566; margin-top: 4px;">' + date + '</div>'
    html += '</div>'
  })
  
  html += '</div>'
  container.innerHTML = html
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.statistics-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.statistics-header {
  background-color: #ffffff;
  padding: 0 16px;
}

.tab-content {
  padding: 16px;
}

.stat-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin: 16px 0 12px;
}

.chart-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.timeline-chart {
  width: 100%;
  min-height: 200px;
}

.member-stats {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.member-item:last-child {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-count {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}

.member-amount {
  display: flex;
  align-items: baseline;
}

.amount-label {
  font-size: 12px;
  color: #ee0a24;
}

.amount-value {
  font-size: 16px;
  font-weight: 500;
  color: #ee0a24;
}

.category-chart-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.category-chart {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-list {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.category-item:last-child {
  border-bottom: none;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.category-name {
  font-size: 14px;
  color: #323233;
}

.category-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-amount {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.category-percent {
  font-size: 12px;
  color: #969799;
  min-width: 40px;
  text-align: right;
}
</style>
