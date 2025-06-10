import { defineStore } from 'pinia'
import axios from '@/stores/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    ip: null,
    user: null,
    token: null,
    config: null,
    activeKey: '1'
  }),
  getters: {
    menuVisibility: state => ({
      home: true,
      my: !!state.token,
      gallery: !!state.config?.site?.gallery,
      docs: !!state.config?.site?.api
    })
  },
  actions: {
    async fetchConfig() {
      try {
        const { data } = await axios.post('/api/auth/config')
        this.config = data
      } catch (error) {
        console.error('Failed to fetch config:', error)
      }
    }
  },
  persist: {
    key: 'stb',
    storage: localStorage,
    serializer: {
      serialize: state => JSON.stringify(state),
      deserialize: value => JSON.parse(value)
    }
  }
})
