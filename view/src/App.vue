<template>
  <div class="app">
    <div class="app-header" v-if="userStore.token">
      <div class="app-header-left">
        <div class="app-header-title">
          {{ userStore.config?.site?.title }}
        </div>
      </div>
      <div class="app-header-right">
        <div class="hamburger" @click="isMenuActive = !isMenuActive">
          <MenuOutlined />
        </div>
      </div>
    </div>
    <!-- 遮罩 -->
    <div class="mask" :class="{ 'mask-active': isMenuActive }" @click="isMenuActive = false"></div>
    <!-- 菜单 -->
    <div class="menu" :class="{ 'menu-active': isMenuActive }" v-if="userStore.token">
      <div class="logo">{{ userStore.config?.site?.title }}</div>
      <a-menu v-model:selectedKeys="selectedKeys" :open-keys="['admin']" theme="dark" mode="inline">
        <a-menu-item key="home">
          <router-link to="/">
            <HomeOutlined />
            首页
          </router-link>
        </a-menu-item>
        <a-menu-item key="gallery">
          <router-link to="/gallery">
            <FireOutlined />
            图片广场
          </router-link>
        </a-menu-item>
        <a-sub-menu key="admin" v-if="userStore.user?.founder">
          <template #title>
            <span>
              <SettingOutlined />
              后台管理
            </span>
          </template>
          <a-menu-item key="dashboard">
            <router-link to="/admin/dashboard">
              仪表盘
            </router-link>
          </a-menu-item>
          <a-menu-item key="users">
            <router-link to="/admin/users">
              用户管理
            </router-link>
          </a-menu-item>
          <a-menu-item key="images">
            <router-link to="/admin/images">
              图片管理
            </router-link>
          </a-menu-item>
          <a-menu-item key="config">
            <router-link to="/admin/config">
              系统配置
            </router-link>
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item key="logout" style="float: right" @click="handleLogout">
          <PoweroffOutlined />
          退出登录
        </a-menu-item>
      </a-menu>
    </div>
    <div class="content" :style="{
      margin: userStore.token ? '50px 0 44px 200px' : '0',
      padding: 0
    }">
      <router-view />
    </div>
    <div class="footer">
      All rights reserved © 2025
      <a-button class="goLink" type="link" href="https://github.com/setube/stb" target="_blank">Stb</a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getIpAddress } from '@/stores/getIp'
import axios from '@/stores/axios'
import { message } from 'ant-design-vue'
import {
  HomeOutlined,
  SettingOutlined,
  FireOutlined,
  PoweroffOutlined,
  MenuOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const selectedKeys = ref(['home'])
const isMenuActive = ref(false)
const userIp = ref({
  ipv4: '',
  ipv6: ''
})

// 获取配置
const fetchConfig = async () => {
  try {
    const response = await axios.post('/api/auth/config')
    userStore.setConfig(response.data)
    // 获取真实IP
    setTimeout(() => {
      getIpAddress((ip) => {
        try {
          if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(ip)) userIp.value.ipv4 = ip
          else if (/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip)) userIp.value.ipv6 = ip
          userStore.setIp(userIp.value)
        } catch (error) {
          console.error(error)
        }
      })
    }, 100)
  } catch (error) {
    message.error(error?.response?.data?.error)
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  const segments = location.pathname.split('/').filter(Boolean)
  selectedKeys.value = segments.length > 1 ? [segments[1]] : [segments[0] || 'home']
})

onMounted(async () => {
  fetchConfig()
  if (userStore.token) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      userStore.logout()
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
}

.hamburger {
  color: white;
  display: none;
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1001;
  font-size: 20px;
  cursor: pointer;
}


.app-header-title,
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

.mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 0;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.mask-active {
  opacity: 1;
  z-index: 100;
}

.content {
  padding: 24px;
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

  .menu-active {
    transform: translateX(0);
  }

  .logo {
    display: none;
  }

  .hamburger {
    display: block;
  }

  .content {
    margin-left: 0 !important;
  }
}

.ant-layout {
  min-height: 100vh;
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
  font-family: -apple-system, BlinkMacSystemFont, Helvetica Neue, PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga" on;
  -webkit-font-smoothing: subpixel-antialiased;
  font-style: normal;
}

::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}

::-webkit-scrollbar:horizontal {
  height: 6px
}

::-webkit-scrollbar-track {
  border-radius: 10px
}

::-webkit-scrollbar-thumb {
  background-color: #0003;
  border-radius: 10px;
  transition: all .2s ease-in-out
}

::-webkit-scrollbar-thumb:hover {
  cursor: pointer;
  background-color: #0000004d;
}
</style>