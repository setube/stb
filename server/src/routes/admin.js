import express from 'express'
import { auth } from '../middleware/auth.js'
import { checkRole } from '../middleware/checkRole.js'
import { User } from '../models/User.js'
import { Image } from '../models/Image.js'
import { deleteImage } from '../utils/deleteImage.js'
import os from 'os'
import mongoose from 'mongoose'
import NodeCache from 'node-cache'

const router = express.Router()

// 创建缓存实例，设置缓存时间为60秒
const statsCache = new NodeCache({ stdTTL: 60 })

// 获取所有用户列表
router.post('/users', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { page, limit } = req.body
    // 确保页码和每页数量为有效数字
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    // 计算跳过的记录数 
    const skip = (pageMath - 1) * limitMath
    // 查询用户，不需要 populate
    const users = await User.find({}, '-password')
      .skip(skip)
      .limit(limitMath)
    // 获取总数
    const total = await User.countDocuments()
    res.json({ users, total })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 更新用户状态
router.patch('/users/:id/status', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body
    const { id } = req.params
    // 查询当前用户信息
    const userdata = await User.findById(id)
    if (!userdata) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (userdata.founder) {
      return res.status(403).json({ error: '无法修改创始人状态' })
    }
    const user = await User.findByIdAndUpdate(id, { status }, { new: true, select: '-password' })
    res.json(user)
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 更新用户角色
router.patch('/users/:id/role', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body
    const { id } = req.params
    const userdata = await User.findById(id)
    if (!userdata) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (userdata.founder) {
      return res.status(403).json({ error: '无法修改创始人权限' })
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true, select: '-password' })
    res.json(user)
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除任意用户
router.delete('/users/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    // 查询当前用户信息
    const userInfo = await User.findById(id)
    if (!userInfo) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (userInfo.founder) {
      return res.status(403).json({ error: '无法删除创始人账号' })
    }
    // 删除账号
    await User.deleteOne({ _id: id })
    res.json({ message: '删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取所有图片
router.post('/images', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { page, limit } = req.body
    // 确保页码和每页数量为有效数字
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    // 计算跳过的记录数 
    const skip = (pageMath - 1) * limitMath
    // 查询图片
    const images = await Image.find()
      .sort({ date: -1 })
      .populate('user', 'username')
      .skip(skip)
      .limit(limitMath)
    // 获取总数
    const total = await Image.countDocuments()
    res.json({ images, total })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除任意图片
router.delete('/images/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    // 查询当前图片信息
    const imageInfo = await Image.findById(id)
    if (!imageInfo) {
      return res.status(404).json({ error: '图片不存在' })
    }
    await deleteImage(imageInfo, id)
    res.json({ message: '删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取系统统计信息
router.post('/stats', auth, checkRole(['admin']), async (req, res) => {
  try {
    // 检查缓存
    const cachedStats = statsCache.get('systemStats')
    if (cachedStats) {
      return res.json(cachedStats)
    }
    // 获取图片总存储大小
    const images = await Image.find({}, 'size')
    const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0)
    const { platform, arch, version, memoryUsage } = process
    // 获取系统信息
    const osInfo = {
      platform,
      arch,
      version,
      memory: memoryUsage(),
      cpus: os.cpus(),
      uptime: os.uptime(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      hostname: os.hostname(),
      type: os.type(),
      release: os.release()
    }
    // 获取 MongoDB 版本和状态
    const mongoInfo = await mongoose.connection.db.admin().serverInfo()
    // 获取时间范围
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    // 获取各时间段的图片数量
    const [userCount, imageCount, activeUsers, todayImages, weekImages, monthImages] = await Promise.all([
      User.countDocuments(),
      Image.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Image.countDocuments({ date: { $gte: today } }),
      Image.countDocuments({ date: { $gte: weekStart } }),
      Image.countDocuments({ date: { $gte: monthStart } })
    ])
    const stats = {
      stats: [
        {
          name: '用户总数',
          value: userCount
        },
        {
          name: '图片总数',
          value: imageCount
        },
        {
          name: '活跃用户数',
          value: activeUsers
        },
        {
          name: '图片总存储',
          value: formatSize(totalSize)
        },
        {
          name: '今日上传',
          value: todayImages
        },
        {
          name: '本周上传',
          value: weekImages
        },
        {
          name: '本月上传',
          value: monthImages
        }
      ],
      system: [
        {
          name: '操作系统',
          value: `${osInfo.type} ${osInfo.release}`
        },
        {
          name: '系统架构',
          value: osInfo.arch
        },
        {
          name: 'Node.js版本',
          value: osInfo.version
        },
        {
          name: '系统运行时间',
          value: formatUptime(osInfo.uptime)
        },
        {
          name: '系统总内存',
          value: formatSize(osInfo.totalmem)
        },
        {
          name: '系统可用内存',
          value: formatSize(osInfo.freemem)
        },
        {
          name: 'Node.js内存使用',
          value: formatSize(osInfo.memory.heapUsed)
        },
        {
          name: 'CPU核心数',
          value: osInfo.cpus.length
        },
        {
          name: '主机名',
          value: osInfo.hostname
        },
        {
          name: 'MongoDB版本',
          value: mongoInfo.version
        }
      ]
    }
    // 设置缓存
    statsCache.set('systemStats', stats)
    res.json(stats)
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化运行时间
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24))
  const hours = Math.floor((seconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const parts = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (secs > 0) parts.push(`${secs}秒`)
  return parts.join(' ') || '0秒'
}

export default router 