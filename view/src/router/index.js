import { createRouter, createWebHistory } from 'vue-router'
import login from '@/views/Login.vue'
import register from '@/views/Register.vue'
import home from '@/views/Home.vue'
import gallery from '@/views/Gallery.vue'
import dashboard from '@/views/admin/Dashboard.vue'
import users from '@/views/admin/Users.vue'
import images from '@/views/admin/Images.vue'
import config from '@/views/admin/Config.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: register,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: home,
    meta: { requiresAuth: true }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: gallery,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
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
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 