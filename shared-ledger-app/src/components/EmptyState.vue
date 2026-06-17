<template>
  <div class="empty-state">
    <div class="empty-icon">
      <van-icon :name="icon" :size="iconSize" :color="iconColor" />
    </div>
    <div class="empty-title">{{ title }}</div>
    <div v-if="description" class="empty-description">{{ description }}</div>
    <div v-if="$slots.action || actionText" class="empty-action">
      <slot name="action">
        <van-button
          v-if="actionText"
          :type="actionType"
          size="small"
          @click="handleAction"
        >
          {{ actionText }}
        </van-button>
      </slot>
    </div>
    <div v-if="$slots.extra" class="empty-extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: 'info-o'
  },
  iconSize: {
    type: String,
    default: '64px'
  },
  iconColor: {
    type: String,
    default: '#dcdee0'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  actionType: {
    type: String,
    default: 'primary'
  }
})

const emit = defineEmits(['action'])

const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  color: #646566;
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-description {
  font-size: 14px;
  color: #969799;
  margin-bottom: 20px;
  line-height: 1.5;
  max-width: 280px;
}

.empty-action {
  margin-top: 8px;
}

.empty-extra {
  margin-top: 16px;
}
</style>
