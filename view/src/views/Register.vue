<template>
  <div class="register-container">
    <a-card title="注册" class="register-box">
      <a-form :model="formState" @finish="handleSubmit" layout="vertical">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formState.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword" :rules="[
          { required: true, message: '请确认密码' },
          { validator: validateConfirmPassword }
        ]">
          <a-input-password v-model:value="formState.confirmPassword" placeholder="请确认密码" />
        </a-form-item>
        <a-form-item label="邮箱地址" name="email" :rules="[
          { required: true, message: '请输入正确的邮箱地址' },
          { validator: validateEmail }
        ]">
          <a-input v-model:value="formState.email" placeholder="请输入邮箱地址" />
        </a-form-item>
        <!-- 验证码 -->
        <a-form-item required label="验证码" name="captcha" v-if="captchaShow">
          <Captcha v-model:value="formState.captcha" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block v-if="captchaShow"
            :disabled="!formState.captcha || !formState.email || !formState.confirmPassword || !formState.password || !formState.username">
            注册
          </a-button>
          <a-button type="primary" html-type="submit" block v-else
            :disabled="!formState.email || !formState.confirmPassword || !formState.password || !formState.username">
            注册
          </a-button>
        </a-form-item>
        <a-divider>或</a-divider>
        <a-button type="link" block @click="router.push('/login')">
          返回登录
        </a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import Captcha from '@/components/Captcha.vue'
import axios from '@/stores/axios'

const router = useRouter()
const userStore = useUserStore()
const captchaShow = computed(() => userStore?.config?.site?.captcha)
const formState = reactive({
  email: '',
  username: '',
  password: '',
  captcha: false,
  confirmPassword: ''
})

// 判断是否为邮箱
const validateEmail = async (rule, value) => {
  if (!value.includes('@')) {
    throw new Error('请输入正确的邮箱地址')
  }
}

const validateConfirmPassword = async (rule, value) => {
  if (value !== formState.password) {
    throw new Error('两次输入的密码不一致')
  }
}

const handleSubmit = async () => {
  try {
    const { data } = await axios.post('/api/auth/register', {
      username: formState.username,
      password: formState.password,
      email: formState.email,
      ip: userStore.ip
    })
    userStore.token = data.token
    userStore.user = data.user
    message.success('注册成功')
    router.push('/')
  } catch (error) {
    message.error(error.response?.data?.error || '注册失败')
  }
}
</script>

<style scoped>
.register-container {
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

.register-box {
  width: 400px;
}

@media screen and (max-width: 768px) {
  .register-box {
    width: 350px;
  }
}
</style>