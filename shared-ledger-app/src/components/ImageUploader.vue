<template>
  <div class="image-uploader">
    <div class="uploader-list">
      <div
        v-for="(file, index) in fileList"
        :key="file.uid || index"
        class="uploader-item"
      >
        <van-image
          :src="file.url"
          fit="cover"
          class="preview-image"
          @click="handlePreview(index)"
        />
        <div v-if="file.status === 'uploading'" class="upload-progress">
          <van-circle
            v-model="file.progress"
            :rate="file.progress"
            :speed="100"
            :stroke-width="60"
            size="40px"
            color="#1989fa"
          />
        </div>
        <div v-if="file.status === 'failed'" class="upload-failed">
          <van-icon name="close" size="20px" color="#ffffff" />
        </div>
        <van-icon
          v-if="!readonly && showDelete"
          name="cross"
          size="18px"
          class="delete-icon"
          @click="handleDelete(index)"
        />
      </div>

      <div
        v-if="!readonly && showUpload"
        class="uploader-trigger"
        @click="handleChooseFile"
      >
        <van-icon name="plus" size="24px" color="#dcdee0" />
        <div class="upload-text">{{ uploadText }}</div>
      </div>
    </div>

    <div v-if="tip" class="upload-tip">{{ tip }}</div>

    <van-uploader
      ref="uploaderRef"
      :accept="accept"
      :multiple="multiple"
      :max-count="maxCount"
      :after-read="handleAfterRead"
      @oversize="handleOversize"
      v-show="false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 9
  },
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024
  },
  accept: {
    type: String,
    default: 'image/*'
  },
  multiple: {
    type: Boolean,
    default: true
  },
  uploadText: {
    type: String,
    default: '上传图片'
  },
  tip: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'oversize'])

const uploaderRef = ref(null)

const fileList = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  }
})

const showUpload = computed(() => {
  return props.modelValue.length < props.maxCount
})

const handleChooseFile = () => {
  uploaderRef.value?.chooseFile()
}

const handleAfterRead = (file) => {
  if (!file.status) {
    file.status = 'uploading'
    file.progress = 0
  }

  if (file.file.size > props.maxSize) {
    handleOversize({ file: file.file })
    return
  }

  simulateUpload(file)
}

const simulateUpload = (file) => {
  let progress = 0
  const interval = setInterval(() => {
    progress += Math.random() * 20
    if (progress >= 100) {
      progress = 100
      file.status = 'done'
      file.url = URL.createObjectURL(file.file)
      clearInterval(interval)
      
      const newList = [...props.modelValue, file]
      fileList.value = newList
      emit('change', newList)
    } else {
      file.progress = Math.round(progress)
    }
  }, 200)
}

const handleDelete = (index) => {
  const newList = props.modelValue.filter((_, i) => i !== index)
  fileList.value = newList
  emit('change', newList)
}

const handlePreview = (index) => {
  const images = props.modelValue.map(file => file.url)
  uni.previewImage({
    current: index,
    urls: images
  })
}

const handleOversize = ({ file }) => {
  showToast(`图片大小不能超过 ${props.maxSize / 1024 / 1024}MB`)
  emit('oversize', file)
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.uploader-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.uploader-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.upload-progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.upload-failed {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
}

.uploader-trigger {
  width: 100px;
  height: 100px;
  border: 1px dashed #dcdee0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.uploader-trigger:active {
  border-color: #1989fa;
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #969799;
}

.upload-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #969799;
}
</style>
