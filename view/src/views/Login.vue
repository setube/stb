<template>
  <div class="login-container">
    <a-card title="登录" :style="{ width: '400px' }">
      <a-form :model="formState" @finish="handleSubmit" layout="vertical">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formState.username" />
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password" />
        </a-form-item>
        <!-- 验证码 -->
        <a-form-item label="验证码" name="captcha" :rules="[{ required: true, message: '请滑动验证码' }]"
          v-if="formState.captchaShow">
          <Captcha v-model:value="formState.captcha" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block :disabled="!formState.username || !formState.password"
            v-if="!formState.captchaShow">
            登录
          </a-button>
          <a-button type="primary" html-type="submit" block
            :disabled="!formState.captcha || !formState.username || !formState.password" v-else>
            登录
          </a-button>
        </a-form-item>
        <a-divider>或</a-divider>
        <a-button type="link" block @click="$router.push('/register')">
          注册新账号
        </a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import Captcha from '@/components/Captcha.vue'

const router = useRouter()
const userStore = useUserStore()
const formState = reactive({
  username: '',
  password: '',
  captchaShow: false
})

const handleSubmit = async () => {
  try {
    await userStore.login(formState.username, formState.password)
    router.push('/')
    message.success('登录成功')
  } catch (error) {
    message.error(error.response?.data?.error || '登录失败')
  }
}

onMounted(() => {
  formState.captchaShow = userStore.config.site.captcha
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}
</style>