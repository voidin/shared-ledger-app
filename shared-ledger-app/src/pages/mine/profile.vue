<template>
  <div class="profile-container">
    <van-nav-bar
      title="个人信息"
      left-arrow
      @click-left="onClickLeft"
    />

    <van-cell-group inset>
      <van-cell
        title="头像"
        center
      >
        <template #value>
          <div class="avatar-wrapper" @click="showAvatarOptions">
            <user-avatar
              :src="formData.avatar"
              :size="50"
              :default-src="defaultAvatar"
            />
            <van-icon name="arrow-down" class="arrow-icon" />
          </div>
        </template>
      </van-cell>

      <van-cell
        title="昵称"
        is-link
        :value="formData.nickname || '未设置'"
        @click="showNicknameEditor"
      />
      
      <van-cell
        title="手机号"
        :value="formData.phone || '-'"
        disabled
      />
      
      <van-cell
        title="性别"
        is-link
        :value="formData.gender === 1 ? '男' : formData.gender === 2 ? '女' : '未设置'"
        @click="showGenderPicker"
      />
      
      <van-cell
        title="生日"
        is-link
        :value="formData.birthday || '未设置'"
        @click="showBirthdayPicker"
      />
    </van-cell-group>

    <van-cell-group class="info-group" inset>
      <van-cell
        title="用户ID"
        :value="userStore.userId || '-'"
        disabled
      />
      
      <van-cell
        title="注册时间"
        :value="formData.createdAt || '-'"
        disabled
      />
    </van-cell-group>

    <div class="save-button">
      <van-button
        type="primary"
        block
        round
        :loading="saving"
        :disabled="!hasChanges"
        @click="handleSave"
      >
        保存修改
      </van-button>
    </div>

    <van-action-sheet
      v-model:show="showAvatarSheet"
      :actions="avatarActions"
      cancel-text="取消"
      @select="onAvatarSelect"
    />

    <van-popup
      v-model:show="showNicknamePopup"
      position="bottom"
      round
    >
      <div class="nickname-editor">
        <h3>修改昵称</h3>
        <van-field
          v-model="nicknameInput"
          placeholder="请输入昵称"
          maxlength="20"
          show-word-limit
        />
        <div class="nickname-buttons">
          <van-button @click="showNicknamePopup = false">取消</van-button>
          <van-button type="primary" @click="confirmNickname">确定</van-button>
        </div>
      </div>
    </van-popup>

    <van-popup
      v-model:show="showGenderPopup"
      position="bottom"
      round
    >
      <van-picker
        :columns="genderColumns"
        @confirm="confirmGender"
        @cancel="showGenderPopup = false"
      />
    </van-popup>

    <van-popup
      v-model:show="showBirthdayPopup"
      position="bottom"
      round
    >
      <van-date-picker
        v-model="birthdayValue"
        type="date"
        title="选择生日"
        :min-date="minDate"
        :max-date="new Date()"
        @confirm="confirmBirthday"
        @cancel="showBirthdayPopup = false"
      />
    </van-popup>

    <van-loading
      v-if="loading"
      type="spinner"
      class="global-loading"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getUserInfo, updateUserInfo, uploadAvatar } from '@/api/user'
import { upload } from '@/utils/request'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const userStore = useUserStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loading = ref(false)
const saving = ref(false)

const formData = reactive({
  avatar: '',
  nickname: '',
  phone: '',
  gender: 0,
  birthday: '',
  createdAt: ''
})

const originalData = reactive({
  avatar: '',
  nickname: '',
  gender: 0,
  birthday: ''
})

const showAvatarSheet = ref(false)
const showNicknamePopup = ref(false)
const showGenderPopup = ref(false)
const showBirthdayPopup = ref(false)

const nicknameInput = ref('')

const genderColumns = [
  { text: '未设置', value: 0 },
  { text: '男', value: 1 },
  { text: '女', value: 2 }
]

const birthdayValue = ref(['1990', '01', '01'])

const minDate = new Date(1900, 0, 1)

const avatarActions = [
  { name: '从相册选择', value: 'album' },
  { name: '拍照', value: 'camera' }
]

const hasChanges = computed(() => {
  return (
    formData.avatar !== originalData.avatar ||
    formData.nickname !== originalData.nickname ||
    formData.gender !== originalData.gender ||
    formData.birthday !== originalData.birthday
  )
})

onMounted(async () => {
  await fetchUserInfo()
})

const fetchUserInfo = async () => {
  loading.value = true
  try {
    const data = await getUserInfo()
    
    formData.avatar = data.avatar || ''
    formData.nickname = data.nickname || ''
    formData.phone = data.phone || ''
    formData.gender = data.gender || 0
    formData.birthday = data.birthday || ''
    formData.createdAt = data.createdAt ? formatDate(data.createdAt) : ''

    Object.assign(originalData, {
      avatar: formData.avatar,
      nickname: formData.nickname,
      gender: formData.gender,
      birthday: formData.birthday
    })

    if (formData.birthday) {
      const date = new Date(formData.birthday)
      birthdayValue.value = [
        String(date.getFullYear()),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ]
    }
  } catch (error) {
    showToast('获取用户信息失败')
    console.error('获取用户信息失败:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const onClickLeft = () => {
  if (hasChanges.value) {
    showConfirmDialog({
      title: '提示',
      message: '有未保存的修改，确定要离开吗？'
    }).then(() => {
      router.back()
    }).catch(() => {})
  } else {
    router.back()
  }
}

const showAvatarOptions = () => {
  showAvatarSheet.value = true
}

const onAvatarSelect = async (action) => {
  showAvatarSheet.value = false

  if (typeof uni !== 'undefined') {
    const sourceType = action.value === 'camera' ? ['camera'] : ['album']
    
    uni.chooseImage({
      count: 1,
      sourceType,
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        await uploadAvatarFile(tempFilePath)
      },
      fail: () => {
        showToast('选择图片失败')
      }
    })
  } else {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        await uploadAvatarFile(file)
      }
    }
    input.click()
  }
}

const uploadAvatarFile = async (file) => {
  try {
    let formDataObj = new FormData()
    
    if (typeof file === 'string') {
      const response = await fetch(file)
      const blob = await response.blob()
      formDataObj.append('file', blob, 'avatar.jpg')
    } else {
      formDataObj.append('file', file)
    }

    const result = await upload('/upload/avatar', formDataObj)
    formData.avatar = result.url
    showToast('头像上传成功')
  } catch (error) {
    showToast('头像上传失败')
    console.error('头像上传失败:', error)
  }
}

const showNicknameEditor = () => {
  nicknameInput.value = formData.nickname
  showNicknamePopup.value = true
}

const confirmNickname = () => {
  formData.nickname = nicknameInput.value.trim()
  showNicknamePopup.value = false
}

const showGenderPicker = () => {
  showGenderPopup.value = true
}

const confirmGender = ({ selectedValues }) => {
  formData.gender = selectedValues[0]
  showGenderPopup.value = false
}

const showBirthdayPicker = () => {
  showBirthdayPopup.value = true
}

const confirmBirthday = ({ selectedValues }) => {
  formData.birthday = selectedValues.join('-')
  showBirthdayPopup.value = false
}

const handleSave = async () => {
  if (!formData.nickname.trim()) {
    showToast('请输入昵称')
    return
  }

  saving.value = true
  try {
    await updateUserInfo({
      nickname: formData.nickname,
      avatar: formData.avatar,
      gender: formData.gender,
      birthday: formData.birthday
    })

    userStore.updateProfile(formData)

    Object.assign(originalData, {
      avatar: formData.avatar,
      nickname: formData.nickname,
      gender: formData.gender,
      birthday: formData.birthday
    })

    showToast('保存成功')
    setTimeout(() => {
      router.back()
    }, 500)
  } catch (error) {
    showToast('保存失败')
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
}

.arrow-icon {
  font-size: 12px;
  color: #999;
}

.info-group {
  margin-top: 15px;
}

.save-button {
  margin: 30px 20px;
}

.nickname-editor {
  padding: 20px;
}

.nickname-editor h3 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 16px;
}

.nickname-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 20px;
}

.nickname-buttons .van-button {
  flex: 1;
}

.global-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
