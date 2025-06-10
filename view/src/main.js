import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useUserStore } from '@/stores/user' // 导入 userStore

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)

// 使用异步 IIFE 来允许在顶层使用 await
;(async () => {

  const userStore = useUserStore()
  await userStore.fetchConfig()

  app.use(router)
  app.mount('#app')
})()
