import express from 'express'
import { auth } from '../middleware/auth.js'
import { checkRole } from '../middleware/checkRole.js'
import { User } from '../models/User.js'
import { Image } from '../models/Image.js'
import { Config } from '../models/Config.js'
import { UploadLog } from '../models/UploadLog.js'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import {
  deleteFromOSS, deleteFromCOS, deleteFromS3,
  deleteFromR2, deleteFromQiNiu, deleteFromUpyun,
  deleteFromSftp, deleteFromFtp, deleteFromWebdav,
  deleteFromTelegram, deleteFromGithub
} from '../utils/oss.js'
import mongoose from 'mongoose'
import NodeCache from 'node-cache'

const router = express.Router()

// 创建缓存实例，设置缓存时间为60秒
const statsCache = new NodeCache({ stdTTL: 60 })

// 获取所有用户列表
router.post('/users', auth, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新用户状态
router.patch('/users/:id/status', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body
    // 查询当前用户信息
    const userdata = await User.findById(req.params.id)
    if (!userdata) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (userdata.founder) {
      return res.status(403).json({ error: '无法修改创始人状态' })
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, select: '-password' }
    )
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新用户角色
router.patch('/users/:id/role', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body
    const userdata = await User.findById(req.params.id)
    if (!userdata) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (userdata.founder) {
      return res.status(403).json({ error: '无法修改创始人权限' })
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password' }
    )
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取所有图片
router.post('/images', auth, checkRole(['admin']), async (req, res) => {
  try {
    const images = await Image.find().populate('user', 'username')
    res.json(images)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除任意图片
router.delete('/images/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    // 获取配置信息
    const config = await Config.findOne()
    // 查询当前图片信息
    const imageInfo = await Image.findById(req.params.id)
    if (!imageInfo) {
      return res.status(404).json({ error: '图片不存在' })
    }

    // 根据存储类型删除文件
    switch (imageInfo.type) {
      case 'local':
        await Image.findByIdAndDelete(req.params.id)
        try {
          const filePath = path.join(process.cwd(), imageInfo.url)
          await fs.unlink(filePath)
        } catch (error) {
          console.error('删除文件失败:', error)
        }
        break
      case 'oss':
        await deleteFromOSS(imageInfo.filename)
        break
      case 'cos':
        const slashCount = (imageInfo.filePath.match(/\//g) || []).length
        if (slashCount === 1) {
          imageInfo.filePath = imageInfo.filePath.substring(1)
        }
        await deleteFromCOS(imageInfo.filePath)
        break
      case 's3':
        await deleteFromS3(imageInfo.filePath)
        break
      case 'r2':
        await deleteFromR2(imageInfo.filePath)
        break
      case 'qiniu':
        await deleteFromQiNiu(imageInfo.filename)
        break
      case 'upyun':
        await deleteFromUpyun(imageInfo.filePath)
        break
      case 'sftp':
        await deleteFromSftp(imageInfo.filePath)
        break
      case 'ftp':
        await deleteFromFtp(imageInfo.filePath)
        break
      case 'webdav':
        await deleteFromWebdav(imageInfo.filePath)
        break
      case 'telegram':
        await deleteFromTelegram(imageInfo.filePath)
        break
      case 'github':
        await deleteFromGithub(imageInfo.filePath)
        break
      default:
        console.error('未知的存储类型:', imageInfo.type)
    }
    // 删除数据库记录
    await Image.deleteOne({ _id: imageInfo._id })
    // 删除相关的上传日志
    await UploadLog.deleteMany({ image: imageInfo._id })
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ error: error.message })
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

    // 获取系统信息
    const osInfo = {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      memory: process.memoryUsage(),
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
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 格式化文件大小
function formatSize (bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化运行时间
function formatUptime (seconds) {
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