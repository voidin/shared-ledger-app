<template>
  <div class="login-form">
    <div class="form-title">
      <h2>{{ title }}</h2>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>

    <van-cell-group inset>
      <van-field
        v-model="phone"
        type="tel"
        label="+86"
        :placeholder="phonePlaceholder"
        :formatter="formatPhone"
        :maxlength="11"
        :disabled="disabled"
        :error="!!phoneError"
        :error-message="phoneError"
        @blur="validatePhone"
        @update:model-value="clearPhoneError"
      />
      
      <van-field
        v-model="code"
        type="digit"
        center
        clearable
        label="验证码"
        :placeholder="codePlaceholder"
        :maxlength="6"
        :disabled="disabled"
        :error="!!codeError"
        :error-message="codeError"
        @blur="validateCode"
        @update:model-value="clearCodeError"
      >
        <template v-if="showCodeButton" #button>
          <van-button
            size="small"
            type="primary"
            :disabled="countdown > 0 || disabled"
            :loading="codeLoading"
            @click="handleSendCode"
          >
            {{ countdownText }}
          </van-button>
        </template>
      </van-field>
    </van-cell-group>

    <div v-if="showAgreement" class="agreement-row">
      <van-checkbox
        v-model="agreed"
        name="agreement"
        shape="square"
        icon-size="14px"
        :disabled="disabled"
      >
        <span class="agreement-text">
          我已阅读并同意
          <span class="link" @click.stop="handleShowAgreement">《用户协议》</span>
          和
          <span class="link" @click.stop="handleShowPrivacy">《隐私政策》</span>
        </span>
      </van-checkbox>
    </div>

    <div class="submit-button">
      <van-button
        type="primary"
        block
        round
        :loading="loading"
        :disabled="!canSubmit || disabled"
        @click="handleSubmit"
      >
        {{ submitText }}
      </van-button>
    </div>

    <div v-if="showWechatLogin" class="wechat-login-row">
      <van-divider>{{ wechatLoginText }}</van-divider>
      <van-button
        type="primary"
        plain
        round
        icon="wechat"
        block
        :disabled="disabled"
        @click="handleWechatLogin"
      >
        {{ wechatButtonText }}
      </van-button>
    </div>

    <div v-if="showOtherLogin" class="other-login">
      <span class="other-login-text">其他登录方式</span>
      <div class="other-login-icons">
        <slot name="other-login"></slot>
      </div>
    </div>

    <slot name="footer"></slot>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { showToast } from 'vant'
import { sendCode } from '@/api/auth'

const props = defineProps({
  title: {
    type: String,
    default: '欢迎登录'
  },
  subtitle: {
    type: String,
    default: ''
  },
  phonePlaceholder: {
    type: String,
    default: '请输入手机号'
  },
  codePlaceholder: {
    type: String,
    default: '请输入验证码'
  },
  submitText: {
    type: String,
    default: '登录'
  },
  showCodeButton: {
    type: Boolean,
    default: true
  },
  showAgreement: {
    type: Boolean,
    default: true
  },
  showWechatLogin: {
    type: Boolean,
    default: true
  },
  showOtherLogin: {
    type: Boolean,
    default: false
  },
  wechatLoginText: {
    type: String,
    default: '其他登录方式'
  },
  wechatButtonText: {
    type: String,
    default: '微信登录'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  countdownSeconds: {
    type: Number,
    default: 60
  },
  phoneRequired: {
    type: Boolean,
    default: true
  },
  codeRequired: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'send-code',
  'submit',
  'wechat-login',
  'show-agreement',
  'show-privacy'
])

const phone = ref('')
const code = ref('')
const agreed = ref([])
const countdown = ref(0)
const codeLoading = ref(false)
const phoneError = ref('')
const codeError = ref('')

let countdownTimer = null

watch(() => props.loading, (newVal) => {
  if (!newVal) {
    codeLoading.value = false
  }
})

const canSubmit = computed(() => {
  const phoneValid = !props.phoneRequired || phone.value.length === 11
  const codeValid = !props.codeRequired || code.value.length === 4
  const agreementValid = !props.showAgreement || agreed.value.length > 0
  return phoneValid && codeValid && agreementValid
})

const countdownText = computed(() => {
  return countdown.value > 0 ? `${countdown.value}s` : '获取验证码'
})

const formatPhone = (value) => {
  return value.replace(/\D/g, '')
}

const clearPhoneError = () => {
  phoneError.value = ''
}

const clearCodeError = () => {
  codeError.value = ''
}

const validatePhone = () => {
  if (props.phoneRequired && !phone.value) {
    phoneError.value = '请输入手机号'
    return false
  }
  if (phone.value && phone.value.length !== 11) {
    phoneError.value = '请输入正确的手机号'
    return false
  }
  phoneError.value = ''
  return true
}

const validateCode = () => {
  if (props.codeRequired && !code.value) {
    codeError.value = '请输入验证码'
    return false
  }
  if (code.value && code.value.length < 4) {
    codeError.value = '验证码格式不正确'
    return false
  }
  codeError.value = ''
  return true
}

const handleSendCode = async () => {
  if (!validatePhone()) return

  if (countdown.value > 0) return

  codeLoading.value = true

  try {
    await sendCode(phone.value)
    showToast('验证码已发送')
    countdown.value = props.countdownSeconds
    
    startCountdown()
    emit('send-code', phone.value)
  } catch (error) {
    showToast(error.message || '发送验证码失败')
  } finally {
    codeLoading.value = false
  }
}

const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }

  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

const handleSubmit = () => {
  if (!validatePhone() || !validateCode()) return

  if (props.showAgreement && !agreed.value.length) {
    showToast('请先同意用户协议和隐私政策')
    return
  }

  emit('submit', {
    phone: phone.value,
    code: code.value
  })
}

const handleWechatLogin = () => {
  if (props.showAgreement && !agreed.value.length) {
    showToast('请先同意用户协议和隐私政策')
    return
  }
  emit('wechat-login')
}

const handleShowAgreement = () => {
  emit('show-agreement')
}

const handleShowPrivacy = () => {
  emit('show-privacy')
}

const resetForm = () => {
  phone.value = ''
  code.value = ''
  agreed.value = []
  phoneError.value = ''
  codeError.value = ''
  stopCountdown()
}

const setPhone = (value) => {
  phone.value = value
}

const setCode = (value) => {
  code.value = value
}

onUnmounted(() => {
  stopCountdown()
})

defineExpose({
  resetForm,
  setPhone,
  setCode,
  validatePhone,
  validateCode
})
</script>

<style scoped>
.login-form {
  width: 100%;
}

.form-title {
  text-align: center;
  margin-bottom: 30px;
}

.form-title h2 {
  font-size: 24px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 8px;
}

.form-title .subtitle {
  font-size: 14px;
  color: #969799;
}

.agreement-row {
  margin: 16px 16px 0;
}

.agreement-text {
  font-size: 12px;
  color: #646566;
  line-height: 1.4;
}

.link {
  color: #1989fa;
}

.submit-button {
  margin: 24px 16px 16px;
}

.wechat-login-row {
  margin: 0 16px;
}

.other-login {
  margin-top: 30px;
  text-align: center;
}

.other-login-text {
  font-size: 12px;
  color: #969799;
  display: block;
  margin-bottom: 16px;
}

.other-login-icons {
  display: flex;
  justify-content: center;
  gap: 30px;
}
</style>
