<template>
  <a-layout v-if="userStore.token">
    <a-layout-sider>
      <div class="logo">{{ userStore.config?.site?.title }}</div>
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
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
        <a-sub-menu key="admin" v-if="userStore.user.founder">
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
    </a-layout-sider>
    <a-layout-content>
      <router-view></router-view>
    </a-layout-content>
  </a-layout>
  <router-view v-else></router-view>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'
import { message } from 'ant-design-vue'
import {
  HomeOutlined,
  SettingOutlined,
  FireOutlined,
  PoweroffOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const selectedKeys = ref(['home'])
const collapsed = ref(false)

watch(() => route.path, (path) => {
  const key = path.split('/')[1] || 'home'
  selectedKeys.value = [key]
})

// 获取配置
const fetchConfig = async () => {
  try {
    const response = await axios.get('/api/auth/config')
    userStore.setConfig(response.data)
  } catch (error) {
    message.error(error?.response?.data?.error)
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  fetchConfig()
  if (userStore.token) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      // 如果获取用户信息失败（比如 token 过期），清除用户信息
      userStore.logout()
    }
  }
})
</script>

<style>
.logo {
  height: 32px;
  margin: 16px;
  color: white;
  font-size: 18px;
  text-align: center;
  line-height: 32px;
}

.ant-layout {
  min-height: 100vh;
}
</style>