import { defineStore } from 'pinia'
import axios from './axios'
import { getIpAddress } from './getIp'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    config: localStorage.getItem('config') || null,
  }),
  actions: {
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
        const response = await axios.get('/api/auth/info')
        // 获取真实IP
        setTimeout(() => {
          getIpAddress((ip) => {
            try {
              if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(ip)) response.data.ipv4 = ip
              else if (/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip)) response.data.ipv6 = ip
              this.setUser(response.data)
            } catch (error) {
              console.error(error)
            }
          })
        }, 100)
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
        const response = await axios.post('/api/auth/register', { username, password, email })
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