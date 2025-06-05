<template>
  <div class="register">
    <a-card class="register-card" title="注册">
      <a-form :model="form" @finish="handleSubmit">
        <a-form-item name="username" :rules="rules.username">
          <a-input v-model:value="form.username" placeholder="请输入用户名">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item name="email" :rules="rules.email">
          <a-input v-model:value="form.email" placeholder="请输入邮箱">
            <template #prefix>
              <MailOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item v-if="userStore?.config?.smtp?.enabled" name="code" :rules="rules.code">
          <a-input-group compact>
            <a-input v-model:value="form.code" placeholder="请输入验证码" style="width: calc(100% - 120px)">
              <template #prefix>
                <SafetyOutlined />
              </template>
            </a-input>
            <a-button :disabled="!form.email || !!countdown" style="width: 120px" @click="handleSendCode">
              {{ countdown ? `${countdown}s后重试` : '获取验证码' }}
            </a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item name="password" :rules="rules.password">
          <a-input-password v-model:value="form.password" placeholder="请输入密码">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item name="confirmPassword" :rules="rules.confirmPassword">
          <a-input-password v-model:value="form.confirmPassword" placeholder="请确认密码">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item name="inviteCode" :rules="rules.inviteCode" v-if="userStore?.config?.site?.inviteCodeRequired">
          <a-input v-model:value="form.inviteCode" placeholder="请输入邀请码">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item required name="captcha" v-if="captchaShow">
          <Captcha v-model:value="form.captcha" v-model:captchaId="form.captchaId" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" :disabled="isSubmitDisabled" block>
            注册
          </a-button>
        </a-form-item>
        <a-form-item>
          <router-link to="/login">已有账号？去登录</router-link>
          或者
          <router-link to="/reset-password">找回密码</router-link>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted, computed } from 'vue'
  import { message } from 'ant-design-vue'
  import { UserOutlined, MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons-vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import axios from '@/stores/axios'
  import qs from 'qs'
  import Captcha from '@/components/Captcha.vue'

  const router = useRouter()
  const userStore = useUserStore()
  const loading = ref(false)
  const countdown = ref(0)
  const captchaShow = computed(() => userStore?.config?.site?.captcha)

  const form = reactive({
    username: '',
    email: '',
    code: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
    captcha: false,
    captchaId: ''
  })

  const isSubmitDisabled = computed(() => {
    let disabled = !form.username || !form.email || !form.password || !form.confirmPassword
    if (userStore?.config?.smtp?.enabled) {
      disabled = disabled || !form.code
    }
    if (userStore?.config?.site?.inviteCodeRequired) {
      disabled = disabled || !form.inviteCode
    }
    if (captchaShow.value) {
      disabled = disabled || !form.captcha || !form.captchaId
    }
    return disabled
  })

  // 验证确认密码
  const validateConfirmPassword = async (rule, value) => {
    if (value !== form.password) {
      throw new Error('两次输入的密码不一致')
    }
  }

  const rules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
    ],
    code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' }
    ],
    inviteCode: [{ required: true, message: '请输入邀请码', trigger: 'blur' }]
  }

  // 发送验证码
  const handleSendCode = async () => {
    if (!form.email) {
      message.error('请先输入邮箱')
      return
    }
    try {
      await axios.post(
        '/api/auth/register/send-code',
        qs.stringify({
          email: form.email,
          username: form.username
        })
      )
      message.success('验证码已发送到您的邮箱')
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } catch ({ response }) {
      message.error(response.data.error || '发送验证码失败')
    }
  }

  // 注册
  const handleSubmit = async () => {
    try {
      loading.value = true
      const { data } = await axios.post('/api/auth/register', {
        username: form.username,
        password: form.password,
        email: form.email,
        code: form.code,
        ip: userStore.ip,
        inviteCode: form.inviteCode,
        captchaId: form.captchaId
      })
      userStore.token = data.token
      userStore.user = data.user
      message.success('注册成功')
      router.push('/')
    } catch ({ response }) {
      message.error(response?.data?.error || '注册失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('oauth')) {
      // 清除 URL 中的参数
      history.replaceState({}, document.title, location.pathname)
      message.error('请注册后再使用本功能')
    }
  })
</script>

<style scoped>
  .register {
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

  .register-card {
    width: 100%;
    max-width: 400px;
  }

  @media screen and (max-width: 768px) {
    .register-card {
      width: 350px;
    }
  }
</style>
