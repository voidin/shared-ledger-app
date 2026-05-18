<template>
  <div v-if="show" class="lock-banner" :class="bannerClass">
    <div class="banner-content">
      <van-icon :name="bannerIcon" :size="bannerIconSize" class="banner-icon" />
      <div class="banner-text">
        <div class="banner-title">{{ title }}</div>
        <div v-if="description" class="banner-description">{{ description }}</div>
      </div>
    </div>
    <div v-if="showAction" class="banner-action">
      <van-button
        v-if="lockType === 'locked'"
        size="small"
        type="primary"
        @click="handleUnlock"
      >
        解锁
      </van-button>
      <van-button
        v-else-if="lockType === 'unlocked'"
        size="small"
        type="warning"
        @click="handleLock"
      >
        锁定
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isLocked: {
    type: Boolean,
    default: false
  },
  lockType: {
    type: String,
    default: 'locked',
    validator: (value) => ['locked', 'unlocked', 'auto'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  showAction: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['lock', 'unlock'])

const show = computed(() => props.isLocked)

const bannerClass = computed(() => {
  const classes = []
  if (props.compact) classes.push('compact')
  if (props.lockType === 'auto') classes.push('auto-lock')
  return classes.join(' ')
})

const bannerIcon = computed(() => {
  if (props.lockType === 'auto') return 'clock-o'
  return props.isLocked ? 'lock' : 'unlock'
})

const bannerIconSize = computed(() => {
  return props.compact ? '18px' : '22px'
})

const title = computed(() => {
  if (props.title) return props.title
  if (props.lockType === 'auto') return '账本已自动锁定'
  return props.isLocked ? '账本已锁定' : '账本未锁定'
})

const handleLock = () => {
  emit('lock')
}

const handleUnlock = () => {
  emit('unlock')
}
</script>

<style scoped>
.lock-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff976a 0%, #ff6034 100%);
  color: #ffffff;
}

.lock-banner.auto-lock {
  background: linear-gradient(135deg, #ffd21e 0%, #ff8a00 100%);
  color: #333333;
}

.lock-banner.compact {
  padding: 10px 16px;
}

.banner-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.banner-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-size: 14px;
  font-weight: 500;
}

.banner-description {
  font-size: 12px;
  margin-top: 2px;
  opacity: 0.9;
}

.banner-action {
  flex-shrink: 0;
  margin-left: 12px;
}

.banner-action :deep(.van-button) {
  border-radius: 4px;
}
</style>
