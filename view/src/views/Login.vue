<template>
  <div class="login-container">
    <a-card title="登录" class="login-box">
      <a-form :model="formState" @finish="handleSubmit" layout="vertical">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formState.username" placeholder="请输入用户名">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password" placeholder="请输入密码">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <!-- 验证码 -->
        <a-form-item label="验证码" required name="captcha" v-if="captchaShow">
          <Captcha v-model:value="formState.captcha" />
        </a-form-item>
        <a-form-item class="sin">
          <a-button type="primary" html-type="submit" :block="!userStore.config?.site?.register" :disabled="!formState.username || !formState.password" v-if="!captchaShow">
            登录账号
          </a-button>
          <a-button type="primary" html-type="submit" :block="!userStore.config?.site?.register" :disabled="!formState.captcha || !formState.username || !formState.password" v-else>
            登录账号
          </a-button>
          <a-button @click="router.push('/register')" v-if="userStore.config?.site?.register">
            注册账号
          </a-button>
          <a-button @click="router.push('/reset-password')">
            找回密码
          </a-button>
        </a-form-item>
        <template v-if="userStore?.config?.oauth?.enabled">
          <a-divider v-if="userStore?.config?.oauth?.github?.enabled || userStore?.config?.oauth?.google?.enabled || userStore?.config?.oauth?.linuxdo?.enabled">或</a-divider>
          <a-button @click="handleBind('github')" v-if="userStore?.config?.oauth?.github?.enabled">
            <GithubOutlined />
            GitHub
          </a-button>
          <a-button @click="handleBind('google')" v-if="userStore?.config?.oauth?.google?.enabled">
            <GoogleOutlined />
            Google
          </a-button>
          <a-button @click="handleBind('linuxdo')" v-if="userStore?.config?.oauth?.linuxdo?.enabled">
            <span class="anticon">
              <img class="linuxdo" :src="LinuxdoOutlined" />
            </span>
            Linux Do
          </a-button>
        </template>
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
import {
  UserOutlined,
  LockOutlined,
  GithubOutlined,
  GoogleOutlined
} from '@ant-design/icons-vue'
import LinuxdoOutlined from '@/assets/linuxdo.svg'

const router = useRouter()
const userStore = useUserStore()
const captchaShow = computed(() => userStore?.config?.site?.captcha)
const formState = reactive({
  username: '',
  password: ''
})

const handleSubmit = async () => {
  try {
    const { data } = await axios.post('/api/auth/login', formState)
    userStore.token = data.token
    userStore.user = data.user
    router.push('/')
    message.success('登录成功')
  } catch ({ response }) {
    message.error(response?.data?.error || '登录失败')
  }
}

const handleBind = (type) => {
  const { oauth, site } = userStore?.config
  if (!oauth.enabled) {
    message.error('社会化登录功能未启用')
    return
  }
  if (!oauth[type]?.enabled) {
    message.error(`${type}登录功能未启用`)
    return
  }
  location.href = `${site.url}/oauth/${type}?redirectUrl=${encodeURIComponent(location.href)}`
}
</script>

<style scoped>
.login-container {
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

.login-box {
  width: 100%;
  max-width: 400px;
}

.sin {
  display: flex;
  justify-content: flex-end;
}

.ant-btn {
  margin-left: 10px;
}

.linuxdo {
  width: 14px;
}

@media screen and (max-width: 768px) {
  .login-box {
    width: 370px;
  }

  .ant-btn {
    margin-left: 5px;
  }
}
</style>