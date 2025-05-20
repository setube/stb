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

dotenv.config()

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

// 错误处理
app.use(errorHandler)

// 数据库连接配置
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 超时时间
      socketTimeoutMS: 45000, // Socket 超时时间
    })
    console.log('数据库连接成功')
    // 初始化配置
    await Config.initialize()
  } catch (err) {
    console.error('数据库连接失败:', err)
    process.exit(1)
  }
}

// 连接数据库
connectDB()

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`后端服务启动成功, 端口号:${PORT}`)
}) 