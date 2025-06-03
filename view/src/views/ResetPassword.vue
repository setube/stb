<template>
  <div class="reset-password">
    <a-card class="reset-card" title="找回密码">
      <!-- 步骤1: 验证邮箱 -->
      <div v-if="currentStep === 0">
        <a-form :model="emailForm" @finish="handleEmailSubmit">
          <a-form-item name="email" :rules="[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]">
            <a-input v-model:value="emailForm.email" placeholder="请输入注册邮箱">
              <template #prefix>
                <mail-outlined />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :disabled="!emailForm.email" html-type="submit" :loading="loading">
              发送验证码
            </a-button>
          </a-form-item>
        </a-form>
      </div>
      <!-- 步骤2: 验证验证码 -->
      <div v-if="currentStep === 1">
        <a-form :model="codeForm" @finish="handleCodeSubmit">
          <a-form-item name="code" :rules="[{ required: true, message: '请输入验证码' }]">
            <a-input v-model:value="codeForm.code" placeholder="请输入验证码">
              <template #prefix>
                <safety-outlined />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :disabled="!codeForm.code" html-type="submit" :loading="loading">
              验证
            </a-button>
          </a-form-item>
        </a-form>
      </div>
      <!-- 步骤3: 重置密码 -->
      <div v-if="currentStep === 2">
        <a-form :model="resetForm" @finish="handleResetSubmit">
          <a-form-item name="password" :rules="[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能小于6位' }
          ]">
            <a-input-password v-model:value="resetForm.password" placeholder="请输入新密码">
              <template #prefix>
                <lock-outlined />
              </template>
            </a-input-password>
          </a-form-item>
          <a-form-item name="confirmPassword" :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword }
          ]">
            <a-input-password v-model:value="resetForm.confirmPassword" placeholder="请确认新密码">
              <template #prefix>
                <lock-outlined />
              </template>
            </a-input-password>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :disabled="!resetForm.password || !resetForm.confirmPassword" :loading="loading">
              重置密码
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import axios from '@/stores/axios'
import qs from 'qs'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const currentStep = ref(0)
const loading = ref(false)
const resetToken = ref('')

const emailForm = reactive({
  email: ''
})

const codeForm = reactive({
  code: ''
})

const resetForm = reactive({
  password: '',
  confirmPassword: ''
})

// 验证确认密码
const validateConfirmPassword = async (rule, value) => {
  if (value !== resetForm.password) {
    throw new Error('两次输入的密码不一致')
  }
}

// 发送验证码
const handleEmailSubmit = async () => {
  if (!userStore?.config?.smtp?.enabled) {
    message.warning('SMTP功能未开启, 请联系管理员')
    return
  }
  try {
    loading.value = true
    await axios.post('/api/auth/send-code', qs.stringify({
      email: emailForm.email,
      type: 'reset'
    }))
    message.success('验证码已发送到您的邮箱')
    currentStep.value = 1
  } catch ({ response }) {
    message.error(response?.data?.error || '发送验证码失败')
  } finally {
    loading.value = false
  }
}

// 验证验证码
const handleCodeSubmit = async () => {
  if (!userStore?.config?.smtp?.enabled) {
    message.warning('SMTP功能未开启, 请联系管理员')
    return
  }
  if (currentStep.value !== 1) {
    message.warning('请先完成邮箱验证')
    return
  }
  try {
    loading.value = true
    const { data } = await axios.post('/api/auth/verify-code', qs.stringify({
      email: emailForm.email,
      code: codeForm.code
    }))
    resetToken.value = data.token
    currentStep.value = 2
  } catch ({ response }) {
    message.error(response?.data?.error || '验证码验证失败')
  } finally {
    loading.value = false
  }
}

// 重置密码
const handleResetSubmit = async () => {
  if (!userStore?.config?.smtp?.enabled) {
    message.warning('SMTP功能未开启, 请联系管理员')
    return
  }
  if (currentStep.value !== 2) {
    message.warning('请先完成验证码验证')
    return
  }
  try {
    loading.value = true
    await axios.post('/api/auth/reset-password', qs.stringify({
      token: resetToken.value,
      password: resetForm.password
    }))
    message.success('您的密码已经重置成功，请使用新密码登录')
    router.push('/login')
  } catch ({ response }) {
    message.error(response?.data?.error || '重置密码失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.reset-card {
  width: 100%;
  max-width: 400px;
}

@media screen and (max-width: 768px) {
  .reset-card {
    width: 350px;
  }
}
</style>