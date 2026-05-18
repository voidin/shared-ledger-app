<template>
  <div class="category-tag" :class="[`category-tag--${size}`, { 'category-tag--horizontal': horizontal }]">
    <div class="category-icon" :style="{ backgroundColor: iconBgColor }">
      <van-icon :name="iconName" :class-prefix="iconPrefix" />
    </div>
    <span v-if="showName" class="category-name">{{ categoryName }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  categoryId: {
    type: [Number, String],
    default: 0
  },
  categoryName: {
    type: String,
    default: ''
  },
  iconName: {
    type: String,
    default: 'other-o'
  },
  iconPrefix: {
    type: String,
    default: 'van-icon'
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  showName: {
    type: Boolean,
    default: true
  },
  horizontal: {
    type: Boolean,
    default: false
  }
})

const iconBgColor = computed(() => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
    '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8',
    '#00b894', '#e17055', '#74b9ff', '#55a3ff',
    '#ff9f43', '#ee5a24', '#009432', '#0652DD'
  ]
  const index = Number(props.categoryId) % colors.length
  return colors[index] + '20'
})

const iconColor = computed(() => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
    '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8',
    '#00b894', '#e17055', '#74b9ff', '#55a3ff',
    '#ff9f43', '#ee5a24', '#009432', '#0652DD'
  ]
  const index = Number(props.categoryId) % colors.length
  return colors[index]
})
</script>

<style scoped>
.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.category-tag--horizontal {
  flex-direction: row;
}

.category-tag--small .category-icon {
  width: 28px;
  height: 28px;
  font-size: 14px;
}

.category-tag--small .category-name {
  font-size: 12px;
}

.category-tag--medium .category-icon {
  width: 36px;
  height: 36px;
  font-size: 18px;
}

.category-tag--medium .category-name {
  font-size: 14px;
}

.category-tag--large .category-icon {
  width: 48px;
  height: 48px;
  font-size: 24px;
}

.category-tag--large .category-name {
  font-size: 16px;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #333;
}

.category-icon :deep(.van-icon) {
  color: inherit;
}

.category-name {
  color: #323233;
  font-weight: 500;
}
</style>
