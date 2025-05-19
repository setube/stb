<template>
  <div class="register-container">
    <a-card title="注册" :style="{ width: '400px' }">
      <a-form :model="formState" @finish="handleSubmit" layout="vertical">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formState.username" />
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword" :rules="[
          { required: true, message: '请确认密码' },
          { validator: validateConfirmPassword }
        ]">
          <a-input-password v-model:value="formState.confirmPassword" />
        </a-form-item>
        <a-form-item label="邮箱地址" name="email" :rules="[
          { required: true, message: '请输入正确的邮箱地址' },
          { validator: validateEmail }
        ]">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        <!-- 验证码 -->
        <a-form-item label="验证码" name="captcha" :rules="[{ required: true, message: '请滑动验证码' }]"
          v-if="formState.captchaShow">
          <Captcha v-model:value="formState.captcha" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block v-if="formState.captchaShow"
            :disabled="!formState.captcha || !formState.email || !formState.confirmPassword || !formState.password || !formState.username">
            注册
          </a-button>
          <a-button type="primary" html-type="submit" block v-else
            :disabled="!formState.email || !formState.confirmPassword || !formState.password || !formState.username">
            注册
          </a-button>
        </a-form-item>
        <a-divider>或</a-divider>
        <a-button type="link" block @click="$router.push('/login')">
          返回登录
        </a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import Captcha from '@/components/Captcha.vue'

const router = useRouter()
const userStore = useUserStore()

const formState = reactive({
  email: '',
  username: '',
  password: '',
  captcha: false,
  confirmPassword: '',
  captchaShow: false
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
    await userStore.register(formState.username, formState.password, formState.email)
    message.success('注册成功')
    router.push('/')
  } catch (error) {
    message.error(error.response?.data?.error || '注册失败')
  }
}

onMounted(() => {
  formState.captchaShow = userStore.config.site.captcha
})
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}
</style>