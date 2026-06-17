<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :style="{ height: '70%' }"
    @click-overlay="closePopup"
  >
    <div class="payee-picker-container">
      <div class="picker-header">
        <div class="picker-title">选择收支人</div>
        <van-icon name="cross" @click="closePopup" />
      </div>

      <van-search
        v-model="searchKey"
        placeholder="搜索收支人"
        @search="handleSearch"
      />

      <div class="picker-content">
        <div v-if="loading" class="loading-container">
          <van-loading type="spinner" color="#1989fa" />
        </div>

        <div v-else class="member-sections">
          <div v-if="realMembers.length > 0" class="member-section">
            <div class="section-label">真实成员</div>
            <van-cell-group>
              <van-cell
                v-for="member in filteredRealMembers"
                :key="member.id"
                center
                @click="selectPayee(member)"
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
                      class="avatar-placeholder"
                    />
                  </div>
                </template>
                <template #title>
                  <div class="member-name">{{ member.name }}</div>
                </template>
                <template #right-icon>
                  <van-icon
                    v-if="selectedPayee?.id === member.id && selectedPayee?.type === 'real'"
                    name="success"
                    color="#1989fa"
                  />
                </template>
              </van-cell>
            </van-cell-group>
          </div>

          <div v-if="virtualMembers.length > 0" class="member-section">
            <div class="section-label">
              虚拟成员
              <van-tag type="primary" size="small">虚</van-tag>
            </div>
            <van-cell-group>
              <van-cell
                v-for="member in filteredVirtualMembers"
                :key="member.id"
                center
                @click="selectPayee(member)"
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
                      class="avatar-placeholder"
                    />
                    <div class="virtual-badge">虚</div>
                  </div>
                </template>
                <template #title>
                  <div class="member-name">
                    {{ member.name }}
                    <van-tag type="primary" size="small">虚</van-tag>
                  </div>
                </template>
                <template #label>
                  <div class="member-description">
                    {{ member.description || '' }}
                  </div>
                </template>
                <template #right-icon>
                  <van-icon
                    v-if="selectedPayee?.id === member.id && selectedPayee?.type === 'virtual'"
                    name="success"
                    color="#1989fa"
                  />
                </template>
              </van-cell>
            </van-cell-group>
          </div>

          <van-empty
            v-if="!loading && filteredRealMembers.length === 0 && filteredVirtualMembers.length === 0"
            description="未找到收支人"
          />
        </div>
      </div>

      <div class="picker-footer">
        <div class="selected-info">
          <span v-if="selectedPayee">已选择：{{ selectedPayee.name }}</span>
          <span v-else class="placeholder-text">请选择收支人</span>
        </div>
        <van-button
          type="primary"
          size="small"
          round
          :disabled="!selectedPayee"
          @click="confirmSelection"
        >
          确认
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getPayees } from '@/api/virtualMember'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  selectedPayee: {
    type: Object,
    default: null
  },
  ledgerId: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:show', 'select', 'close'])

const searchKey = ref('')
const loading = ref(false)
const realMembers = ref([])
const virtualMembers = ref([])

const filteredRealMembers = computed(() => {
  if (!searchKey.value) return realMembers.value
  const key = searchKey.value.toLowerCase()
  return realMembers.value.filter(member =>
    member.name.toLowerCase().includes(key)
  )
})

const filteredVirtualMembers = computed(() => {
  if (!searchKey.value) return virtualMembers.value
  const key = searchKey.value.toLowerCase()
  return virtualMembers.value.filter(member =>
    member.name.toLowerCase().includes(key)
  )
})

watch(() => props.show, async (newVal) => {
  if (newVal && props.ledgerId) {
    await loadPayees()
  }
})

const loadPayees = async () => {
  try {
    loading.value = true
    const result = await getPayees(props.ledgerId)

    realMembers.value = result.realMembers || []
    virtualMembers.value = result.virtualMembers || []
  } catch (error) {
    console.error('获取收支人列表失败:', error)
  } finally {
    loading.value = false
  }
}

const selectPayee = (member) => {
  const payee = {
    ...member,
    type: member.isVirtual ? 'virtual' : 'real'
  }
  emit('select', payee)
}

const closePopup = () => {
  emit('update:show', false)
  emit('close')
}

const confirmSelection = () => {
  if (props.selectedPayee) {
    emit('select', props.selectedPayee)
  }
  closePopup()
}

const handleSearch = () => {
  // 搜索由 computed 属性自动处理
}
</script>

<style scoped>
.payee-picker-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
  background-color: #fff;
}

.picker-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.member-section {
  margin-bottom: 15px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #969799;
  padding: 12px 16px 8px;
}

.member-avatar-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f5f5f5;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
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
  width: 14px;
  height: 14px;
  background-color: #1989fa;
  color: #fff;
  font-size: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fff;
}

.member-name {
  font-size: 14px;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-description {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}

.picker-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #ebedf0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.selected-info {
  flex: 1;
  font-size: 14px;
  color: #323233;
}

.placeholder-text {
  color: #969799;
}
</style>
