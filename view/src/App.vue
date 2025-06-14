<template>
  <div class="app">
    <div class="app-header">
      <div class="app-header-left">
        <div class="hamburger" @click="isMenuActive = !isMenuActive">
          <MenuOutlined />
        </div>
      </div>
      <div class="app-header-right">
        <a-dropdown :arrow="{ pointAtCenter: true }">
          <a class="user-dropdown" @click.prevent>
            <a-avatar :size="32" :src="userStore?.config?.site?.url + userStore?.user?.avatar">
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
          </a>
          <template #overlay>
            <a-menu v-if="userStore.token">
              <a-menu-item key="user" @click="router.push(`/user/${userStore?.user?._id}`)">
                <UserOutlined />
                个人主页
              </a-menu-item>
              <a-menu-item key="settings" @click="router.push('/settings')">
                <SettingOutlined />
                个人设置
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout" @click="handleLogout">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
            <a-menu v-else>
              <a-menu-item key="user" @click="router.push(`/login`)">
                <UserOutlined />
                登录账号
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="settings" @click="router.push('/register')">
                <UserAddOutlined />
                注册账号
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
    <a-config-provider :locale="zhCN">
      <!-- 遮罩 -->
      <div class="mask" :class="{ 'mask-active': isMenuActive }" @click="isMenuActive = false"></div>
      <!-- 菜单 -->
      <div class="menu" :class="{ 'menu-active': isMenuActive }">
        <div class="logo">
          <router-link to="/">
            {{ userStore.config?.site?.title }}
          </router-link>
        </div>
        <a-menu v-model:selectedKeys="selectedKeys" :open-keys="['admin']" theme="dark" mode="inline">
          <template v-for="item in menus">
            <a-menu-item v-if="item.show" :key="item.name">
              <router-link :to="item.url">
                <component v-bind:is="item.icon" />
                {{ item.title }}
              </router-link>
            </a-menu-item>
          </template>
          <a-sub-menu key="admin" v-if="userStore.user?.founder">
            <template #title>
              <span>
                <SettingOutlined />
                后台管理
              </span>
            </template>
            <a-menu-item v-for="item in adminMenus" :key="item.name">
              <router-link :to="`/admin/${item.name}`">
                {{ item.title }}
              </router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item key="login" v-if="!userStore.token">
            <router-link to="/login">
              <UserOutlined />
              注册 / 登录
            </router-link>
          </a-menu-item>
          <a-menu-item key="logout" style="float: right" @click="handleLogout" v-if="userStore.token">
            <PoweroffOutlined />
            退出登录
          </a-menu-item>
        </a-menu>
      </div>
      <div :class="['content', selectedKeys]">
        <router-view />
      </div>
      <div class="footer">
        All rights reserved © {{ new Date().getFullYear() }}
        <a class="goLink" type="link" href="https://github.com/setube/stb" target="_blank">Stb</a>
        <template v-if="userStore?.config?.site?.beian">
          ・
          <a type="link" href="https://beian.miit.gov.cn" target="_blank">
            {{ userStore?.config?.site?.beian }}
          </a>
        </template>
      </div>
    </a-config-provider>
    <div v-if="userStore?.config?.site?.html" ref="htmlContainer" v-html="userStore?.config?.site?.html" />
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { getIpAddress } from '@/stores/getIp'
  import { ElMessageBox } from 'element-plus'
  import 'element-plus/es/components/message-box/style/css'
  import axios from '@/stores/axios'
  import { message } from 'ant-design-vue'
  import zhCN from 'ant-design-vue/es/locale/zh_CN'
  import {
    HomeOutlined,
    SettingOutlined,
    FireOutlined,
    PoweroffOutlined,
    MenuOutlined,
    UserOutlined,
    QuestionCircleOutlined,
    SmileOutlined,
    LogoutOutlined,
    UserAddOutlined
  } from '@ant-design/icons-vue'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const selectedKeys = ref(['home'])
  const isMenuActive = ref(false)
  const htmlContainer = ref(null)
  const userIp = ref({
    ipv4: '',
    ipv6: ''
  })

  // 定义菜单项
  const menuItems = [
    { name: 'home', title: '图床首页', url: '/home', icon: HomeOutlined },
    { name: 'my', title: '我的图片', url: '/my', icon: SmileOutlined },
    { name: 'gallery', title: '图片广场', url: '/gallery', icon: FireOutlined },
    { name: 'docs', title: '接口文档', url: '/docs', icon: QuestionCircleOutlined }
  ]

  // 计算属性返回过滤和排序后的菜单
  const menus = ref([])

  const adminMenus = [
    { name: 'dashboard', title: '仪表盘' },
    { name: 'logs', title: '日志管理' },
    { name: 'users', title: '用户管理' },
    { name: 'images', title: '图片管理' },
    { name: 'albums', title: '相册管理' },
    { name: 'announcements', title: '公告管理' },
    { name: 'config', title: '系统配置' },
    { name: 'rolegroups', title: '角色组管理' },
    { name: 'invitecodes', title: '邀请码管理' }
  ]

  // 获取配置
  const fetchConfig = async () => {
    try {
      const { data } = await axios.post('/api/auth/config')
      userStore.config = data
      const order = data?.site?.navigationOrder
      const sortedMenuItems = [...menuItems].sort((a, b) => {
        return order.indexOf(a.name) - order.indexOf(b.name)
      })
      menus.value = sortedMenuItems.map(item => ({
        ...item,
        show: userStore.menuVisibility[item.name]
      }))
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 获取公告
  const checkAnnouncement = async () => {
    try {
      const { data } = await axios.post('/api/admin/announcements/active')
      if (data) {
        userStore.announcementData = data
        let time = Date.now()
        let nextTime = userStore?.announcement?.nextTime ? userStore?.announcement?.nextTime : Date.now()
        if (data._id != userStore?.announcement?._id) {
          userStore.announcements = null
          nextTime = Date.now()
        }
        if (data.type === 'modal' && time >= nextTime && data.isActive) {
          ElMessageBox.alert(data.content, data.title, {
            type: data.effect,
            callback: () => {
              userStore.announcement = {
                _id: data._id,
                nextTime: Date.now() + data.nextTime * 24 * 60 * 60 * 1000
              }
            },
            showCancelButton: false,
            confirmButtonText: '知道了',
            dangerouslyUseHTMLString: true
          })
        }
      }
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  const fetchUserInfo = async () => {
    try {
      const { data } = await axios.post('/api/auth/info')
      userStore.user = data
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  const fetchGuestInfo = async () => {
    try {
      const { data } = await axios.post('/api/auth/guest')
      userStore.guest = data
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  const handleLogout = async () => {
    userStore.user = userStore.guest
    userStore.token = null
    router.push('/login')
    message.warning('账号已退出')
  }

  const routerWatch = url => {
    const segments = url.split('/').filter(Boolean)
    if (['register', 'resetpassword'].includes(segments[0])) return (selectedKeys.value = ['login'])
    selectedKeys.value = segments.length > 1 ? [segments[1]] : [segments[0] || 'home']
  }

  // 处理 OAuth 登录回调
  const handleOAuthCallback = () => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const isBind = params.get('isBind')
    if (token) {
      // 存储用户信息
      userStore.token = token
      // 清除 URL 中的参数
      history.replaceState({}, document.title, location.pathname)
      if (isBind === 'true') {
        router.push('/settings')
      } else {
        router.push('/')
      }
    }
  }

  watch(
    () => route.path,
    async newPath => {
      // 获取真实IP
      await getIpAddress(ip => {
        try {
          if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(ip)) userIp.value.ipv4 = ip
          else if (/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip)) userIp.value.ipv6 = ip
          userStore.ip = userIp.value
        } catch (error) {
          console.error(error)
        }
      })
      routerWatch(newPath)
      await fetchGuestInfo()
    }
  )

  onMounted(async () => {
    fetchConfig()
    routerWatch(location.pathname)
    handleOAuthCallback()
    checkAnnouncement()
    if (htmlContainer.value) {
      const scripts = htmlContainer.value.getElementsByTagName('script')
      const styles = htmlContainer.value.getElementsByTagName('style')
      for (let style of styles) {
        const newStyle = document.createElement('style')
        newStyle.textContent = style.textContent
        document.head.appendChild(newStyle)
      }
      for (let script of scripts) {
        const newScript = document.createElement('script')
        newScript.textContent = script.textContent
        script.parentNode.replaceChild(newScript, script)
      }
    }
    if (userStore.token) {
      try {
        await fetchUserInfo()
      } catch (error) {
        await handleLogout()
      }
    }
  })
</script>

<style scoped>
  .app {
    position: relative;
  }

  .app-header {
    top: 0;
    height: 60px;
    background: #001529;
    position: fixed;
    width: 100%;
    z-index: 101;
  }

  .app-header-left {
    float: left;
  }

  .app-header-right {
    float: right;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .hamburger {
    color: white;
    display: none;
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1001;
    font-size: 20px;
    cursor: pointer;
  }

  .logo {
    height: 32px;
    margin: 16px;
    color: white;
    font-size: 18px;
    text-align: center;
    line-height: 32px;
  }

  .menu {
    width: 200px;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    background: #001529;
    transition: transform 0.3s ease;
    z-index: 101;
  }

  .content {
    padding: 50px 0 44px 200px;
    margin-bottom: 50px;
  }

  .footer {
    position: fixed;
    bottom: 0;
    width: 100%;
    text-align: center;
    padding: 10px 0;
    color: rgba(255, 255, 255, 0.65);
    background-color: #001529;
    z-index: 101;
  }

  .goLink {
    height: auto;
    padding: 0;
    border-radius: 0;
  }

  .user-dropdown {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 0 12px;
    height: 60px;
  }

  /* 移动端 */
  @media (max-width: 768px) {
    .menu {
      position: fixed;
      top: 60px;
      left: 0;
      height: 100vh;
      z-index: 1000;
      transform: translateX(-100%);
    }

    .mask {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.45);
      z-index: 0;
      opacity: 0;
      pointer-events: none;
      transition: 0.3s;
    }

    .mask-active {
      opacity: 1;
      z-index: 100;
      pointer-events: auto;
    }

    .menu-active {
      transform: translateX(0);
    }

    .hamburger {
      display: block;
    }

    .content {
      margin-left: 0 !important;
      padding: 0;
      margin-top: 60px;
    }

    .user-dropdown {
      padding: 0 8px;
    }
  }

  :deep(.ant-image-img) {
    border-radius: 8px;
  }

  :deep(.ant-image-mask) {
    border-radius: 8px;
  }

  :deep(.ant-image-mask) {
    transition: 0.1s ease;
  }

  :deep(.ant-input-prefix) {
    color: rgba(0, 0, 0, 0.25);
  }
</style>

<style>
  html {
    font-size: 100%;
    overflow-y: scroll;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    overflow-x: hidden;
    max-width: 100%;
    image-rendering: -webkit-optimize-contrast;
  }

  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    color: #222;
    line-height: 1.4;
    font-family: -apple-system, BlinkMacSystemFont, Helvetica Neue, PingFang SC, Microsoft YaHei, Source Han Sans SC,
      Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif;
    text-rendering: optimizeLegibility;
    font-feature-settings: 'liga' on;
    -webkit-font-smoothing: subpixel-antialiased;
    font-style: normal;
    background-color: #f0f2f5;
  }

  ::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }

  ::-webkit-scrollbar:horizontal {
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #0003;
    border-radius: 10px;
    transition: all 0.2s ease-in-out;
  }

  ::-webkit-scrollbar-thumb:hover {
    cursor: pointer;
    background-color: #0000004d;
  }

  p {
    margin: 0;
    padding: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img {
    max-width: 100%;
    object-fit: cover;
  }

  .ant-dropdown {
    width: 110px;
  }

  .el-table--fit {
    border-radius: 5px;
  }

  .ant-input-affix-wrapper {
    height: 32px;
  }
</style>
