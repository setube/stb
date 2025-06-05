import axios from 'axios'

// 函数返回唯一的请求key
const getRequestKey = config => {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

// 添加请求信息
const pendingRequest = new Map()

const addPendingRequest = config => {
  const requestKey = getRequestKey(config)
  config.cancelToken =
    config.cancelToken ||
    new axios.CancelToken(cancel => {
      if (!pendingRequest.has(requestKey)) {
        pendingRequest.set(requestKey, cancel)
      }
    })
}

// 取消重复请求，移除重复请求信息
const removePendingRequest = config => {
  const requestKey = getRequestKey(config)
  if (pendingRequest.has(requestKey)) {
    // 重复请求时调用该函数
    const cancel = pendingRequest.get(requestKey)
    cancel(requestKey)
    // 删除上一次接口请求
    pendingRequest.delete(requestKey)
  }
}

// 创建 axios 实例
const instance = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:25519' : '',
  timeout: 10000
})

// 添加请求拦截器
instance.interceptors.request.use(
  config => {
    // 取消重复请求，移除重复请求信息
    removePendingRequest(config)
    // 把当前请求信息添加到pendingRequest对象中
    addPendingRequest(config)
    const { token } = JSON.parse(localStorage.getItem('stb')) || {}
    config.headers.Authorization = token ? `Bearer ${token}` : ''
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 添加响应拦截器
instance.interceptors.response.use(
  response => {
    removePendingRequest(response.config)
    return response
  },
  error => {
    const config = JSON.parse(localStorage.getItem('stb')) || {}
    if (!config?.site?.anonymousUpload && error.response?.status === 401) {
      localStorage.removeItem('stb')
      location.href = '/login'
    }
    removePendingRequest(error.config || {})
    return Promise.reject(error)
  }
)

export default instance
