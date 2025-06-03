<template>
  <div class="settings">
    <a-card title="个人设置" :bordered="false">
      <a-tabs v-model:activeKey="activeKey">
        <!-- 基本信息 -->
        <a-tab-pane key="basic" tab="基本信息">
          <a-form :model="basicForm" layout="vertical">
            <a-form-item label="头像">
              <div class="avatar-upload">
                <a-avatar :size="100" :src="userStore.config.site.url + basicForm.avatar || userStore.config.site.url + userStore.user?.avatar">
                  <template #icon>
                    <UserOutlined />
                  </template>
                </a-avatar>
                <a-upload name="avatar" :show-upload-list="false" :before-upload="beforeAvatarUpload" :customRequest="handleAvatarChange">
                  <a-button type="link">
                    {{ userStore.user?.avatar ? '更换头像' : '上传头像' }}
                  </a-button>
                </a-upload>
              </div>
            </a-form-item>
            <a-form-item label="用户名">
              <a-input v-model:value="basicForm.username" disabled>
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>
            <a-form-item label="邮箱">
              <a-input v-model:value="basicForm.email" disabled>
                <template #prefix>
                  <MailOutlined />
                </template>
              </a-input>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <!-- 修改密码 -->
        <a-tab-pane key="password" tab="修改密码">
          <a-form :model="passwordForm" @finish="handlePasswordSubmit" layout="vertical">
            <a-form-item name="oldPassword" label="当前密码" :rules="[{ required: true, message: '请输入当前密码' }]">
              <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入当前密码">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
            <a-form-item name="newPassword" label="新密码" :rules="[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]">
              <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
            <a-form-item name="confirmPassword" label="确认密码" :rules="[
              { required: true, message: '请确认密码' },
              { validator: validateConfirmPassword }
            ]">
              <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请确认新密码">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" :disabled="!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword" :loading="loading">
                修改密码
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <!-- 修改邮箱 -->
        <a-tab-pane key="email" tab="修改邮箱">
          <a-form :model="emailForm" @finish="handleEmailSubmit" layout="vertical">
            <a-form-item name="newEmail" label="新邮箱" :rules="[
              { required: true, message: '请输入新邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]">
              <a-input v-model:value="emailForm.newEmail" placeholder="请输入新邮箱">
                <template #prefix>
                  <MailOutlined />
                </template>
              </a-input>
            </a-form-item>
            <a-form-item name="code" label="验证码" :rules="[{ required: true, message: '请输入验证码' }]">
              <a-input-group compact>
                <a-input v-model:value="emailForm.code" placeholder="请输入验证码" style="width: calc(100% - 120px)">
                  <template #prefix>
                    <SafetyOutlined />
                  </template>
                </a-input>
                <a-button style="width: 120px" :disabled="!!countdown || !emailForm.newEmail" @click="handleSendCode">
                  {{ countdown ? `${countdown}s后重试` : '获取验证码' }}
                </a-button>
              </a-input-group>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" :disabled="!emailForm.newEmail || !emailForm.code" :loading="loading">
                修改邮箱
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'
import qs from 'qs'

const userStore = useUserStore()
const activeKey = ref('basic')
const loading = ref(false)
const countdown = ref(0)

const basicForm = reactive({
  username: '',
  email: '',
  avatar: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const emailForm = reactive({
  newEmail: '',
  code: ''
})

// 初始化表单数据
onMounted(() => {
  basicForm.username = userStore.user?.username
  basicForm.email = userStore.user?.email
  basicForm.avatar = userStore.user?.avatar
})

// 验证确认密码
const validateConfirmPassword = async (rule, value) => {
  if (value !== passwordForm.newPassword) {
    throw new Error('两次输入的密码不一致')
  }
}

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理头像上传
const handleAvatarChange = async ({ file }) => {
  if (loading.value) return
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await axios.post('/api/upload-avatar', formData)
    basicForm.avatar = data.avatar
    userStore.user.avatar = data.avatar
    message.success('头像更新成功')
  } catch ({ response }) {
    message.error(response?.data?.error || '上传失败')
  } finally {
    loading.value = false
  }
}

// 修改密码
const handlePasswordSubmit = async () => {
  try {
    loading.value = true
    await axios.post('/api/auth/change-password', qs.stringify(passwordForm))
    message.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch ({ response }) {
    message.error(response?.data?.error || '密码修改失败')
  } finally {
    loading.value = false
  }
}

// 发送验证码
const handleSendCode = async () => {
  if (!userStore?.config?.smtp?.enabled) {
    message.warning('SMTP功能未开启, 请联系管理员')
    return
  }
  try {
    await axios.post('/api/auth/user/send-code', qs.stringify({
      email: emailForm.newEmail,
      type: 'email'
    }))
    message.success('验证码已发送')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch ({ response }) {
    message.error(response?.data?.error || '发送验证码失败')
  }
}

// 修改邮箱
const handleEmailSubmit = async () => {
  try {
    loading.value = true
    // 验证验证码
    await axios.post('/api/auth/user/verify-code', qs.stringify({
      email: emailForm.newEmail,
      code: emailForm.code
    }))
    message.success('邮箱修改成功')
    basicForm.email = emailForm.newEmail
    emailForm.newEmail = ''
    emailForm.code = ''
  } catch ({ response }) {
    message.error(response?.data?.error || '邮箱修改失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.settings {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

:deep(.ant-upload) {
  width: auto !important;
}
</style>