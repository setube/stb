import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    ip: null,
    user: null,
    guest: null,
    token: null,
    config: null,
    activeKey: '1',
    announcement: null,
    announcementData: null
  }),
  getters: {
    menuVisibility: state => ({
      home: true,
      my: !!state.token,
      gallery: !!state.config?.site?.gallery,
      docs: !!state.config?.site?.api
    })
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
