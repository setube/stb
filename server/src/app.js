import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import authRoutes from './routes/auth.js'
import imageRoutes from './routes/images.js'
import adminRoutes from './routes/admin.js'
import configRoutes from './routes/config.js'
import logsRoutes from './routes/logs.js'
import { errorHandler } from './middleware/errorHandler.js'
import { Config } from './models/Config.js'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api', imageRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin', configRoutes)
app.use('/api/admin', logsRoutes)

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
        socketTimeoutMS: 45000, // Socket 超时时间
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

// 启动服务器
const startServer = async () => {
  try {
    await connectDB()
    app.listen(process.env.PORT, () => {
      console.log(`后端服务正在${process.env.PORT}端口上运行`)
    })
  } catch (error) {
    console.error('启动后端服务失败：', error)
    process.exit(1)
  }
}

startServer() 