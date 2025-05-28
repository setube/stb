import { defineStore } from 'pinia'

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
  }
})