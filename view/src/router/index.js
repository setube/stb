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
  {
    path: '/',
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

router.beforeEach((to, from, next) => {
  const { config, token, user } = useUserStore()
  if (to.name === 'Docs' && !config?.site?.api) {
    return next('/404')
  }
  if (to.name === 'Register' && !config?.site?.register) {
    return next('/404')
  }
  if (to.name === 'Gallery' && !config?.site?.gallery) {
    return next('/404')
  }
  if (to.name === 'Admin' && (!token || user?.role !== 'admin')) {
    return next('/404')
  }
  if (to.name === 'My' && !token) {
    return next('/login')
  }
  next()
})

export default router
