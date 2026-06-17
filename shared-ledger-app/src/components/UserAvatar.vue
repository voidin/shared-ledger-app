<template>
  <div
    class="user-avatar"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: round ? '50%' : `${radius}px`
    }"
  >
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt"
      :style="{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    <div
      v-else
      class="avatar-placeholder"
      :style="{
        width: '100%',
        height: '100%',
        fontSize: `${size * 0.4}px`
      }"
    >
      <img
        v-if="defaultSrc"
        :src="defaultSrc"
        :alt="alt"
        :style="{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }"
        @error="handleDefaultImageError"
      />
      <van-icon
        v-else
        name="user-o"
        :style="{ fontSize: `${size * 0.5}px` }"
      />
    </div>
    <div
      v-if="showBadge"
      class="avatar-badge"
      :class="badgeClass"
      :style="{
        width: `${Math.max(8, size * 0.25)}px`,
        height: `${Math.max(8, size * 0.25)}px`,
        right: badgePosition === 'right' ? '-2px' : 'auto',
        left: badgePosition === 'left' ? '-2px' : 'auto',
        top: badgePosition === 'top' ? '-2px' : 'auto',
        bottom: badgePosition === 'bottom' ? '-2px' : 'auto'
      }"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  defaultSrc: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 50
  },
  radius: {
    type: Number,
    default: 8
  },
  round: {
    type: Boolean,
    default: true
  },
  alt: {
    type: String,
    default: '头像'
  },
  showBadge: {
    type: Boolean,
    default: false
  },
  badgeClass: {
    type: String,
    default: 'success'
  },
  badgePosition: {
    type: String,
    default: 'right',
    validator: (value) => ['right', 'left', 'top', 'bottom'].includes(value)
  }
})

const imageError = ref(false)
const defaultImageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const handleImageLoad = () => {
  imageError.value = false
}

const handleDefaultImageError = () => {
  defaultImageError.value = true
}
</script>

<style scoped>
.user-avatar {
  position: relative;
  display: inline-block;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #999;
  width: 100%;
  height: 100%;
}

.avatar-badge {
  position: absolute;
  border-radius: 50%;
  background-color: #07c160;
  border: 2px solid #ffffff;
}

.avatar-badge.error {
  background-color: #ee0a24;
}

.avatar-badge.warning {
  background-color: #ff976a;
}

.avatar-badge.info {
  background-color: #1989fa;
}
</style>
