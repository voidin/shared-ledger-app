<template>
  <van-cell class="permission-editor">
    <template #title>
      <div class="permission-title">{{ label }}</div>
      <div v-if="description" class="permission-description">{{ description }}</div>
    </template>
    <template #label>
      <van-radio-group
        v-model="currentValue"
        direction="horizontal"
        class="permission-options"
      >
        <van-radio
          v-for="option in options"
          :key="option.value"
          :name="option.value"
          shape="square"
          class="permission-option"
        >
          {{ option.label }}
        </van-radio>
      </van-radio-group>
    </template>
  </van-cell>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  description: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const currentValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})
</script>

<style scoped>
.permission-editor {
  padding: 16px;
}

.permission-title {
  font-size: 16px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 4px;
}

.permission-description {
  font-size: 12px;
  color: #969799;
  margin-bottom: 12px;
}

.permission-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-option {
  margin-right: 0;
}

:deep(.van-radio__label) {
  font-size: 14px;
  color: #646566;
}

:deep(.van-radio--checked .van-radio__label) {
  color: #1989fa;
}

:deep(.van-radio__icon--checked .van-icon) {
  background-color: #1989fa;
  border-color: #1989fa;
}
</style>
