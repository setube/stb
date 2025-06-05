<template>
  <div class="settings">
    <a-card title="个人设置" :bordered="false">
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane key="basic" tab="基本信息">
          <a-form :model="basicForm" layout="vertical">
            <a-form-item label="">
              <div class="avatar-upload">
                <a-avatar :size="100" :src="userStore.config.site.url + userStore.user?.avatar" :icon="UserOutlined" />
                <a-upload
                  name="avatar"
                  :show-upload-list="false"
                  :before-upload="beforeAvatarUpload"
                  :customRequest="handleAvatarChange"
                >
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
            <a-form-item
              name="newPassword"
              label="新密码"
              :rules="[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度不能小于6位' }
              ]"
            >
              <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
            <a-form-item
              name="confirmPassword"
              label="确认密码"
              :rules="[{ required: true, message: '请确认密码' }, { validator: validateConfirmPassword }]"
            >
              <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请确认新密码">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                :disabled="!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword"
                :loading="loading"
              >
                修改密码
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <!-- 修改邮箱 -->
        <a-tab-pane key="email" tab="修改邮箱">
          <a-form :model="emailForm" @finish="handleEmailSubmit" layout="vertical">
            <a-form-item
              name="newEmail"
              label="新邮箱"
              :rules="[
                { required: true, message: '请输入新邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]"
            >
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
              <a-button
                type="primary"
                html-type="submit"
                :disabled="!emailForm.newEmail || !emailForm.code"
                :loading="loading"
              >
                修改邮箱
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="bind" tab="账号绑定" v-if="userStore.config?.oauth?.enabled">
          <div class="social-accounts">
            <h3 class="section-title">社交账号绑定</h3>
            <div class="accounts-grid">
              <template v-for="(item, index) in ['GitHub', 'Google', 'Linux DO']" :key="index">
                <div class="account-card" v-if="userStore.config?.oauth?.[processString(item)]?.enabled">
                  <div class="account-icon" />
                  <div class="account-info">
                    <h4>{{ item }}</h4>
                    <template v-if="userStore.user?.oauth?.[processString(item)]?.id">
                      <p class="account-name" v-if="item === 'GitHub'">
                        {{ userStore.user.oauth[processString(item)].username }}
                      </p>
                      <p class="account-name" v-else>{{ userStore.user.oauth[processString(item)].email }}</p>
                      <button class="unbind-btn" @click="handleUnbind(processString(item))">解绑账号</button>
                    </template>
                    <template v-else>
                      <button class="bind-btn" @click="handleBind(processString(item))">绑定账号</button>
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { message } from 'ant-design-vue'
  import { UserOutlined, MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons-vue'
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

  // 大写转小写并移除空格
  const processString = text => text.toLowerCase().replace(/\s+/g, '')

  // 验证确认密码
  const validateConfirmPassword = async (rule, value) => {
    if (value !== passwordForm.newPassword) {
      throw new Error('两次输入的密码不一致')
    }
  }

  // 头像上传前的验证
  const beforeAvatarUpload = file => {
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
      await axios.post(
        '/api/auth/user/send-code',
        qs.stringify({
          email: emailForm.newEmail,
          type: 'email'
        })
      )
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
      await axios.post(
        '/api/auth/user/verify-code',
        qs.stringify({
          email: emailForm.newEmail,
          code: emailForm.code
        })
      )
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

  const handleBind = async type => {
    const { oauth } = userStore?.config
    if (!oauth.enabled) {
      message.error('社会化登录功能未启用')
      return
    }
    try {
      const { data } = await axios.post(
        '/oauth/bind',
        qs.stringify({
          type,
          userId: userStore.user._id,
          redirectUrl: location.href
        })
      )
      location.href = data.authUrl
    } catch ({ response }) {
      message.error(response?.data?.error || '解绑失败')
    }
  }

  const handleUnbind = async type => {
    try {
      await axios.post(
        '/oauth/unbind',
        qs.stringify({
          type,
          userId: userStore.user._id
        })
      )
      message.success('解绑成功')
      // 刷新当前页面
      location.reload()
    } catch ({ response }) {
      message.error(response?.data?.error || '解绑失败')
    }
  }
</script>

<style scoped>
  .settings {
    padding: 24px;
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

  .social-accounts {
    padding: 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .section-title {
    font-size: 1.25rem;
    color: #1a1a1a;
    margin-bottom: 24px;
    font-weight: 600;
  }

  .accounts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  .account-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .account-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .account-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    font-size: 24px;
  }

  .account-icon i {
    color: #fff;
  }

  /* 为不同平台设置不同的背景色 */
  .account-card:nth-child(1) .account-icon {
    background: #24292e;
    /* GitHub */
  }

  .account-card:nth-child(2) .account-icon {
    background: #4285f4;
    /* Google */
  }

  .account-card:nth-child(3) .account-icon {
    background: #fcc624;
    /* Linux DO */
  }

  .account-info {
    flex: 1;
  }

  .account-info h4 {
    margin: 0 0 8px;
    font-size: 1rem;
    color: #1a1a1a;
  }

  .account-name {
    margin: 0 0 12px;
    color: #666;
    font-size: 0.9rem;
  }

  .bind-btn,
  .unbind-btn {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .bind-btn {
    background: #1890ff;
    color: #fff;
  }

  .bind-btn:hover {
    background: #40a9ff;
  }

  .unbind-btn {
    background: transparent;
    color: #ff4d4f;
    border: 1px solid #ff4d4f;
  }

  .unbind-btn:hover {
    background: #fff1f0;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .accounts-grid {
      grid-template-columns: 1fr;
    }

    .account-card {
      padding: 16px;
    }

    .account-icon {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }
  }
</style>
