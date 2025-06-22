import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import authRoutes from './routes/auth.js'
import oauthRoutes from './routes/oauth.js'
import imageRoutes from './routes/images.js'
import adminRoutes from './routes/admin.js'
import configRoutes from './routes/config.js'
import logsRoutes from './routes/logs.js'
import { errorHandler } from './middleware/errorHandler.js'
import { Config } from './models/Config.js'
import path from 'path'
import requestIP from 'request-ip'
import { fileURLToPath } from 'url'
import publicRoutes from './routes/public.js'
import ipaddr from 'ipaddr.js'
import { RoleGroup } from './models/RoleGroup.js'
import { User } from './models/User.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.set('trust proxy', true)
app.use(requestIP.mw({ attributeName: 'clientIP' }))

app.use(
  cors({
    origin: true, // 允许所有来源
    credentials: true // 允许携带凭证
  })
)

app.use((req, res, next) => {
  const ipSources = [
    'CACHE_INFO',
    'CF_CONNECTING_IP',
    'CF-Connecting-IP',
    'CLIENT_IP',
    'Client-IP',
    'COMING_FROM',
    'CONNECT_VIA_IP',
    'FORWARD_FOR',
    'FORWARD-FOR',
    'FORWARDED_FOR_IP',
    'FORWARDED_FOR',
    'FORWARDED-FOR-IP',
    'FORWARDED-FOR',
    'FORWARDED',
    'HTTP-CLIENT-IP',
    'HTTP-FORWARDED-FOR-IP',
    'HTTP-PC-REMOTE_ADDR',
    'HTTP-PROXY-CONNECTION',
    'HTTP-VIA',
    'HTTP-X-FORWARDED-FOR-IP',
    'HTTP-X-IMFORWARDS',
    'HTTP-XROXY-CONNECTION',
    'PC_REMOTE_ADDR',
    'PRAGMA',
    'PROXY_AUTHORIZATION',
    'PROXY_CONNECTION',
    'Proxy-Client-IP',
    'PROXY',
    'REMOTE_ADDR',
    'Source-IP',
    'True-Client-IP',
    'Via',
    'WL-Proxy-Client-IP',
    'X_CLUSTER_CLIENT_IP',
    'X_COMING_FROM',
    'X_DELEGATE_REMOTE_HOST',
    'X_FORWARDED_FOR_IP',
    'X_FORWARDED_FOR',
    'X_FORWARDED',
    'X_IMFORWARDS',
    'X_LOCKING',
    'X_LOOKING',
    'X_REAL_IP',
    'X-Backend-Host',
    'X-BlueCoat-Via',
    'X-Cache-Info',
    'X-Forward-For',
    'X-Forwarded-By',
    'X-Forwarded-For-Original',
    'X-Forwarded-For',
    'X-Forwarded-Server',
    'X-Forwared-Host',
    'X-From-IP',
    'X-From',
    'X-Gateway-Host',
    'X-Host',
    'X-Ip',
    'X-Original-Host',
    'X-Original-IP',
    'X-Original-Remote-Addr',
    'X-Original-Url',
    'X-Originally-Forwarded-For',
    'X-Originating-IP',
    'X-ProxyMesh-IP',
    'X-ProxyUser-IP',
    'X-Real-IP',
    'X-Remote-Addr',
    'X-Remote-IP',
    'X-True-Client-IP',
    'XONNECTION',
    'XPROXY',
    'XROXY_CONNECTION',
    'Z-Forwarded-For',
    'ZCACHE_CONTROL',
    'X-Forwarded',
    'Remote-Addr',
    'X-Cluster-Client-IP',
    'CF_PSEUDO_IPV4',
    'X_CF_Connecting_IP',
    'Fastly-Client-IP',
    'X-Amz-Cf-Id',
    'X-Amzn-Trace-Id',
    'X-Azure-Client-IP',
    'X-Envoy-External-Address',
    'X-Google-Forwarded-For',
    'X-Tencent-Forwarded-For',
    'Ali-Cdn-Real-Ip',
    'Cdn-Src-Ip',
    'Cdn-Real-Ip',
    'Bcdn-Real-Ip',
    'X-Vercel-Forwarded-For',
    'X-Coming-From',
    'X-Proxied-For',
    'X-Original-Forwarded-For',
    'ClientIP',
    'Coming-From',
    'Connect-Via-IP',
    'Forwared-Host',
    'P-Client-IP',
    'Proxy-Connection',
    'Proxy-Authorization',
    'X-External-Access'
  ]
  // 收集所有可用 IP 字符串
  const allIps = ipSources
    .map(header => req.headers[header.toLowerCase()])
    .filter(Boolean)
    .flatMap(ip => ip.split(',').map(i => i.trim()))
    .concat(req.socket?.remoteAddress || [], req.ip || [])
    .filter(Boolean)
  const uniqueIps = [...new Set(allIps)]
  // 过滤出第一个合法 IPv4 和 IPv6 地址
  let ipv4 = null
  let ipv6 = null
  // 检查是否为私网 IP
  const isPrivateIP = ip => {
    try {
      const addr = ipaddr.parse(ip)
      return addr.range() === 'private' || addr.range() === 'loopback' || addr.range() === 'linkLocal'
    } catch (e) {
      return false
    }
  }
  // 检查 IP 是否合法
  const isValidIP = ip => {
    try {
      ipaddr.parse(ip)
      return true
    } catch (e) {
      return false
    }
  }
  for (const ip of uniqueIps) {
    // 跳过无效 IP
    if (!isValidIP(ip)) continue
    // 处理 IPv4
    if (!ipv4 && /^[\d.]+$/.test(ip)) {
      // 跳过私网 IP
      if (!isPrivateIP(ip)) {
        ipv4 = ip
      }
    }
    // 处理 IPv6
    else if (!ipv6 && /^[a-fA-F0-9:]+$/.test(ip)) {
      // 跳过 ::ffff: 开头的映射 IPv4
      if (!ip.toLowerCase().startsWith('::ffff:')) {
        // 跳过私网 IP
        if (!isPrivateIP(ip)) {
          ipv6 = ip
        }
      }
    }
    // 特殊处理 ::ffff:IPv4 的情况
    if (!ipv4 && ip.toLowerCase().startsWith('::ffff:')) {
      const ipv4FromV6 = ip.replace('::ffff:', '')
      if (!isPrivateIP(ipv4FromV6)) {
        ipv4 = ipv4FromV6
      }
    }
    if (ipv4 && ipv6) break
  }
  // 如果所有 IP 都是私网 IP,则使用第一个有效的 IP
  if (!ipv4 && !ipv6) {
    for (const ip of uniqueIps) {
      if (!isValidIP(ip)) continue
      if (!ipv4 && /^[\d.]+$/.test(ip)) {
        ipv4 = ip
      } else if (!ipv6 && /^[a-fA-F0-9:]+$/.test(ip)) {
        if (!ip.toLowerCase().startsWith('::ffff:')) {
          ipv6 = ip
        }
      }
      if (!ipv4 && ip.toLowerCase().startsWith('::ffff:')) {
        ipv4 = ip.replace('::ffff:', '')
      }
      if (ipv4 || ipv6) break
    }
  }
  req.clientIp = {
    ipv4: ipv4 === '127.0.0.1' ? null : ipv4 || null,
    ipv6: ipv6 === '::1' ? null : ipv6 || null
  }
  next()
})

// 中间件
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api', imageRoutes)
app.use('/oauth', oauthRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin', configRoutes)
app.use('/api/admin', logsRoutes)
app.use('/api/public', publicRoutes)

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')))

// 所有未匹配的路由都返回前端页面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// 错误处理
app.use(errorHandler)

// 数据库连接配置
const connectDB = async () => {
  const maxRetries = 5
  let retries = 0

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 超时时间
        socketTimeoutMS: 45000 // Socket 超时时间
      })
      console.log('MongoDB数据库连接成功')
      // 初始化配置
      await Config.initialize()
      return
    } catch (error) {
      retries++
      console.log(`MongoDB连接尝试${retries}失败：`, error.message)
      if (retries === maxRetries) {
        console.error(`在${maxRetries}次尝试后连接到MongoDB失败`)
        throw error
      }
      // 等待 5 秒后重试
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

// 初始化角色组和迁移用户权限
const initializeRoles = async () => {
  try {
    // 获取所有角色组
    const roleGroups = await RoleGroup.find({})
    // 检查是否存在必要的角色组
    const adminGroup = roleGroups.find(g => g.isAdmin)
    const defaultGroup = roleGroups.find(g => g.isDefault)
    const guestGroup = roleGroups.find(g => g.isGuest)

    // 如果缺少任何必要的角色组，执行初始化
    if (!adminGroup || !defaultGroup || !guestGroup) {
      console.log('缺少必要的角色组，开始初始化...')
      if (!adminGroup) console.log('缺少管理员组')
      if (!defaultGroup) console.log('缺少默认用户组')
      if (!guestGroup) console.log('缺少游客组')
      await RoleGroup.initialize()
    }
    await User.migrateRoles()
  } catch (error) {
    console.error('角色组初始化和用户权限迁移失败:', error)
    throw error
  }
}

// 启动服务器
const startServer = async () => {
  try {
    await connectDB()
    // 等待数据库连接成功后再执行初始化
    await initializeRoles()
    app.listen(process.env.PORT, () => {
      console.log(`后端服务正在${process.env.PORT}端口上运行`)
    })
  } catch (error) {
    console.error('启动后端服务失败：', error)
    process.exit(1)
  }
}

startServer()
