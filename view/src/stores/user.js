import { defineStore } from 'pinia'
import axios from './axios'
import { getIpAddress } from './getIp'

export const useUserStore = defineStore('user', {
  state: () => ({
    ip: JSON.parse(localStorage.getItem('ip')) || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    config: localStorage.getItem('config') || null,
  }),
  actions: {
    setIp(ip) {
      this.ip = ip
      localStorage.setItem('ip', JSON.stringify(ip))
    },
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    setConfig(config) {
      this.config = config
      localStorage.setItem('config', JSON.stringify(config))
    },
    async fetchUserInfo() {
      try {
        const response = await axios.post('/api/auth/info')
        this.setUser(response.data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async login(username, password) {
      try {
        const response = await axios.post('/api/auth/login', { username, password })
        this.setToken(response.data.token)
        this.setUser(response.data.user)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async register(username, password, email) {
      try {
        const response = await axios.post('/api/auth/register', { username, password, email, ip: this.ip })
        this.setToken(response.data.token)
        this.setUser(response.data.user)
        return response.data
      } catch (error) {
        throw error
      }
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }
}) 