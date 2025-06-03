import { defineStore } from 'pinia'
import axios from '@/stores/axios'
import qs from 'qs'

export const useUserStore = defineStore('user', {
  state: () => ({
    ip: null,
    user: null,
    token: null,
    config: null,
    activeKey: '1'
  }),
  persist: {
    key: 'stb',
    storage: localStorage,
    serializer: {
      serialize: (state) => JSON.stringify(state),
      deserialize: (value) => JSON.parse(value)
    }
  },
  actions: {
    // 更新用户信息
    async updateUserInfo(data) {
      const response = await axios.post('/api/auth/update-info', qs.stringify(data))
      if (response.data) {
        this.user = { ...this.user, ...response.data }
      }
      return response.data
    },

    // 修改邮箱
    async changeEmail({ newEmail, code }) {
      const response = await axios.post('/api/auth/change-email', qs.stringify({
        newEmail,
        code
      }))
      if (response.data) {
        this.user = { ...this.user, email: newEmail }
      }
      return response.data
    }
  }
})