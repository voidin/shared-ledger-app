<template>
  <div class="stat-card" :class="{ clickable: clickable }" @click="handleClick">
    <div class="stat-header">
      <div class="stat-icon" v-if="icon">
        <van-icon :name="icon" :color="iconColor" :size="iconSize" />
      </div>
      <div class="stat-title">{{ title }}</div>
      <div class="stat-trend" v-if="trend !== undefined" :class="trendClass">
        <van-icon :name="trendIcon" />
        <span>{{ Math.abs(trend) }}%</span>
      </div>
    </div>
    <div class="stat-value">
      <span class="value-prefix" v-if="prefix">{{ prefix }}</span>
      <span class="value-number">{{ formattedValue }}</span>
      <span class="value-suffix" v-if="suffix">{{ suffix }}</span>
    </div>
    <div class="stat-desc" v-if="description">{{ description }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconColor: {
    type: String,
    default: '#1989fa'
  },
  iconSize: {
    type: String,
    default: '24px'
  },
  trend: {
    type: Number,
    default: undefined
  },
  description: {
    type: String,
    default: ''
  },
  decimal: {
    type: Number,
    default: 2
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString('zh-CN', {
      minimumFractionDigits: props.decimal,
      maximumFractionDigits: props.decimal
    })
  }
  return props.value
})

const trendClass = computed(() => {
  if (props.trend > 0) return 'trend-up'
  if (props.trend < 0) return 'trend-down'
  return ''
})

const trendIcon = computed(() => {
  if (props.trend > 0) return 'ascending'
  if (props.trend < 0) return 'descending'
  return ''
})

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-card.clickable {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card.clickable:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.stat-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.stat-icon {
  margin-right: 8px;
}

.stat-title {
  flex: 1;
  font-size: 14px;
  color: #969799;
}

.stat-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #07c160;
}

.stat-trend.trend-up {
  color: #07c160;
}

.stat-trend.trend-down {
  color: #ee0a24;
}

.stat-value {
  display: flex;
  align-items: baseline;
  font-size: 28px;
  font-weight: bold;
  color: #323233;
}

.value-prefix,
.value-suffix {
  font-size: 14px;
  color: #646566;
}

.value-number {
  margin: 0 2px;
}

.stat-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #969799;
}
</style>
