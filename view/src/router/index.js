import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const publicNames = [
  '404',
  'RootRedirect',
  'Login',
  'Register',
  'Home',
  'Gallery',
  'Docs',
  'My',
  'ResetPassword',
  'Settings',
  'admin',
  'UserPage',
  'UserPublicAlbumDetail'
]

const adminNames = [
  'Dashboard',
  'Users',
  'Images',
  'Config',
  'Logs',
  'InviteCodes',
  'Albums',
  'RoleGroups',
  'Announcements'
]

const routes = publicNames.map(item => {
  let data = {
    path: `/${item.toLowerCase()}`,
    name: item,
    component: () => import(`@/views/${item}.vue`)
  }
  if (item === '404') {
    data = {
      path: '/:pathMatch(.*)*',
      name: item,
      component: () => import('@/views/Not.vue')
    }
  }
  if (item === 'RootRedirect') {
    data = {
      path: '/',
      name: item,
      component: () => import('@/views/Home.vue')
    }
  }
  if (item === 'admin') {
    data = {
      path: '/admin',
      redirect: '/admin/dashboard',
      children: adminNames.map(item => {
        return {
          path: item.toLowerCase(),
          name: item,
          component: () => import(`@/views/admin/${item}.vue`)
        }
      })
    }
  }
  if (item === 'UserPage') {
    data = {
      path: '/user/:userId',
      name: item,
      component: () => import(`@/views/user/${item}.vue`)
    }
  }
  if (item === 'UserPublicAlbumDetail') {
    data = {
      path: '/user/:userId/album/:albumId',
      name: item,
      component: () => import(`@/views/user/${item}.vue`)
    }
  }
  return data
})

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const { config, token, user } = useUserStore()
  // 动态重定向根路径
  if (to.path === '/') {
    const pathName = config?.site?.navigationOrder[0]
    const name = pathName.replace(pathName[0], pathName[0].toUpperCase())
    if (to.name !== name) {
      return next({ name })
    }
  }
  if (token && ['Login', 'Register', 'ResetPassword'].includes(to.name)) {
    return next('/')
  }
  if (to.name === 'Docs' && !config?.site?.api) {
    return next({ name: '404' })
  }
  if (to.name === 'Register' && !config?.site?.register) {
    return next({ name: '404' })
  }
  if (to.name === 'Gallery' && !config?.site?.gallery) {
    return next({ name: '404' })
  }
  if (to.name === 'Admin' && (!token || !user?.role?.isAdmin)) {
    return next({ name: '404' })
  }
  if (to.name === 'My' && !token) {
    return next('/login')
  }
  next()
})

export default router
