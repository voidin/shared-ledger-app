<template>
  <div class="login-container">
    <div class="login-header">
      <h1 class="title">共享记账</h1>
      <p class="subtitle">轻松管理，共同报销</p>
    </div>

    <div class="login-form">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          type="tel"
          label="+86"
          placeholder="请输入手机号"
          :formatter="formatPhone"
          maxlength="11"
          @blur="validatePhone"
        />
        
        <van-field
          v-model="code"
          type="digit"
          center
          clearable
          label="验证码"
          placeholder="请输入验证码"
          maxlength="6"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="countdown > 0"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
      </van-cell-group>

      <div class="login-button-wrapper">
        <van-button
          type="primary"
          block
          round
          :loading="loginLoading"
          :disabled="!canLogin"
          @click="handleLogin"
        >
          登录
        </van-button>
      </div>

      <div class="wechat-login">
        <van-divider>其他登录方式</van-divider>
        <van-button
          type="primary"
          plain
          round
          icon="wechat"
          block
          @click="handleWechatLogin"
        >
          微信登录
        </van-button>
      </div>
    </div>

    <div class="login-footer">
      <van-checkbox-group v-model="agreed">
        <van-checkbox name="agreement" shape="square" icon-size="14px">
          我已阅读并同意
        </van-checkbox>
      </van-checkbox-group>
      <span class="link" @click="showAgreement">《用户协议》</span>
      <span>和</span>
      <span class="link" @click="showPrivacy">《隐私政策》</span>
    </div>

    <van-overlay :show="showAgreementModal" @click="showAgreementModal = false">
      <div class="agreement-modal" @click.stop>
        <h3>用户协议</h3>
        <div class="agreement-content">
          这里展示用户协议内容...
        </div>
        <van-button type="primary" block @click="showAgreementModal = false">
          关闭
        </van-button>
      </div>
    </van-overlay>

    <van-overlay :show="showPrivacyModal" @click="showPrivacyModal = false">
      <div class="agreement-modal" @click.stop>
        <h3>隐私政策</h3>
        <div class="agreement-content">
          这里展示隐私政策内容...
        </div>
        <van-button type="primary" block @click="showPrivacyModal = false">
          关闭
        </van-button>
      </div>
    </van-overlay>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { sendCode, login as authLogin, wechatLogin } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const agreed = ref([])
const countdown = ref(0)
const loginLoading = ref(false)
const showAgreementModal = ref(false)
const showPrivacyModal = ref(false)

let countdownTimer = null

const canLogin = computed(() => {
  return phone.value.length === 11 && code.value.length === 4 && agreed.value.length > 0
})

const formatPhone = (value) => {
  return value.replace(/\D/g, '')
}

const validatePhone = () => {
  if (phone.value && phone.value.length !== 11) {
    showToast('请输入正确的手机号')
    return false
  }
  return true
}

const handleSendCode = async () => {
  if (!validatePhone()) return

  try {
    await sendCode(phone.value)
    showToast('验证码已发送')
    countdown.value = 60
    
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    showToast(error.message || '发送验证码失败')
  }
}

const handleLogin = async () => {
  if (!agreed.value.length) {
    showToast('请先同意用户协议和隐私政策')
    return
  }

  loginLoading.value = true

  try {
    const data = await authLogin(phone.value, code.value)
    
    userStore.login({
      phone: phone.value,
      token: data.token,
      userInfo: data.userInfo
    })

    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  } catch (error) {
    showToast(error.message || '登录失败')
  } finally {
    loginLoading.value = false
  }
}

const handleWechatLogin = () => {
  if (!agreed.value.length) {
    showToast('请先同意用户协议和隐私政策')
    return
  }
  
  if (typeof uni !== 'undefined') {
    uni.getProvider({
      service: 'oauth',
      success: (res) => {
        if (res.provider.includes('weixin')) {
          uni.login({
            provider: 'weixin',
            success: async (loginRes) => {
              try {
                const data = await wechatLogin(loginRes.code)
                userStore.login({
                  token: data.token,
                  userInfo: data.userInfo
                })
                const redirect = route.query.redirect || '/'
                router.replace(redirect)
              } catch (error) {
                showToast('微信登录失败')
              }
            },
            fail: () => {
              showToast('微信登录失败')
            }
          })
        }
      }
    })
  } else {
    showToast('微信登录仅支持小程序环境')
  }
}

const showAgreement = () => {
  showAgreementModal.value = true
}

const showPrivacy = () => {
  showPrivacyModal.value = true
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px 40px;
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  margin-bottom: 60px;
}

.title {
  font-size: 36px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.login-form {
  flex: 1;
}

.login-button-wrapper {
  margin: 30px 20px 20px;
}

.wechat-login {
  margin: 20px;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  padding: 0 20px;
  text-align: center;
}

.link {
  color: #ffffff;
  margin: 0 2px;
}

.agreement-modal {
  background: #ffffff;
  margin: 100px 20px;
  padding: 20px;
  border-radius: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.agreement-modal h3 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 18px;
}

.agreement-content {
  font-size: 14px;
  line-height: 1.6;
  color: #666666;
  margin-bottom: 20px;
  max-height: 40vh;
  overflow-y: auto;
}
</style>
