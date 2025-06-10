import { createRouter, createWebHistory } from 'vue-router'
import login from '@/views/Login.vue'
import register from '@/views/Register.vue'
import home from '@/views/Home.vue'
import gallery from '@/views/Gallery.vue'
import docs from '@/views/Docs.vue'
import not from '@/views/Not.vue'
import my from '@/views/My.vue'
import dashboard from '@/views/admin/Dashboard.vue'
import users from '@/views/admin/Users.vue'
import images from '@/views/admin/Images.vue'
import config from '@/views/admin/Config.vue'
import log from '@/views/admin/Logs.vue'
import resetpassword from '@/views/ResetPassword.vue'
import settings from '@/views/Settings.vue'
import { useUserStore } from '@/stores/user'
import invitecodes from '@/views/admin/InviteCodes.vue'
import UserPage from '@/views/UserPage.vue'
import UserPublicAlbumDetail from '@/views/UserPublicAlbumDetail.vue'
import AdminAlbums from '@/views/admin/Albums.vue'

const routes = [
  {
    path: '/404',
    name: '404',
    component: not
  },
  {
    path: '/:pathMatch(.*)*',
    component: not
  },
  {
    path: '/login',
    name: 'Login',
    component: login
  },
  {
    path: '/register',
    name: 'Register',
    component: register
  },
  // 根路径的路由，将由 beforeEach 动态重定向
  {
    path: '/',
    name: 'RootRedirect', // 更改名称，避免与实际的Home组件冲突
    component: home // 暂时保留，但实际会通过重定向覆盖
  },
  {
    path: '/home',
    name: 'Home',
    component: home
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: gallery
  },
  {
    path: '/docs',
    name: 'Docs',
    component: docs
  },
  {
    path: '/my',
    name: 'My',
    component: my
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: resetpassword
  },
  {
    path: '/settings',
    name: 'Settings',
    component: settings
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Admin',
        component: dashboard
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: users
      },
      {
        path: 'images',
        name: 'AdminImages',
        component: images
      },
      {
        path: 'config',
        name: 'AdminConfig',
        component: config
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: log
      },
      {
        path: 'invitecodes',
        name: 'AdminInviteCodes',
        component: invitecodes
      },
      {
        path: 'albums',
        name: 'AdminAlbums',
        component: AdminAlbums
      }
    ]
  },
  {
    path: '/user/:userId',
    name: 'UserPage',
    component: UserPage
  },
  {
    path: '/user/:userId/album/:albumId',
    name: 'UserPublicAlbumDetail',
    component: UserPublicAlbumDetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 确保 userStore.config 已加载
  // 这是一个简化的处理，实际应用中可能需要更健壮的加载机制
  if (!userStore.config?.site?.navigationOrder) {
    // 尝试等待配置加载，或者在 App.vue 中确保配置在路由前加载
    // 这里我们假设 App.vue 会在应用启动时加载配置
    // 如果配置未加载，暂时让它通过，App.vue 会处理
  }

  // 动态重定向根路径
  if (to.path === '/') {
    const order = userStore.config?.site?.navigationOrder || ['home', 'my', 'gallery', 'docs']
    const firstNavItemName = order[0]

    let targetRouteName = 'Home' // 默认指向 Home
    switch (firstNavItemName) {
      case 'home':
        targetRouteName = 'Home'
        break
      case 'my':
        targetRouteName = 'My'
        break
      case 'gallery':
        targetRouteName = 'Gallery'
        break
      case 'docs':
        targetRouteName = 'Docs'
        break
      // 如果有其他导航项，需要在这里添加对应的 case
      // 例如：case 'someOtherPage': targetRouteName = 'SomeOtherPage'; break;
    }

    // 如果当前路由的名称不是目标路由名称，则进行重定向
    // 避免无限重定向循环
    if (to.name !== targetRouteName) {
      return next({ name: targetRouteName, replace: true })
    }
  }

  // 现有的导航守卫逻辑
  if (to.name === 'Docs' && !userStore.config?.site?.api) {
    return next('/404')
  }
  if (to.name === 'Register' && !userStore.config?.site?.register) {
    return next('/404')
  }
  if (to.name === 'Gallery' && !userStore.config?.site?.gallery) {
    return next('/404')
  }
  if (to.name === 'Admin' && (!userStore.token || userStore.user?.role !== 'admin')) {
    return next('/404')
  }
  if (to.name === 'My' && !userStore.token) {
    return next('/login')
  }
  next()
})

export default router
