import express from 'express'
import { auth, isAdmin } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Image } from '../models/Image.js'
import { deleteImage } from '../utils/deleteImage.js'
import os from 'os'
import mongoose from 'mongoose'
import NodeCache from 'node-cache'
import { InviteCode } from '../models/InviteCode.js'
import crypto from 'crypto'
import Papa from 'papaparse'
import { Album } from '../models/Album.js'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { RoleGroup } from '../models/RoleGroup.js'
import { Announcement } from '../models/Announcement.js'

const router = express.Router()

// 创建缓存实例，设置缓存时间为60秒
const statsCache = new NodeCache({ stdTTL: 60 })

// 格式化文件大小
const formatSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化运行时间
const formatUptime = seconds => {
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

// 获取所有用户列表
router.post('/users', auth, isAdmin, async (req, res) => {
  try {
    const { page, limit, username } = req.body
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath
    const query = {}
    if (username) {
      query.username = { $regex: username, $options: 'i' }
    }
    // 查询用户
    const users = await User.find(query, '-password').skip(skip).limit(limitMath)
    const total = await User.countDocuments(query)
    res.json({ users, total })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除任意用户
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
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

// 更新用户数据
router.patch('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const allowedUpdates = ['username', 'email', 'role', 'status', 'password']
    const actualUpdates = {}
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        actualUpdates[key] = updates[key]
      }
    })
    // 如果没有要更新的字段，直接返回
    if (Object.keys(actualUpdates).length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' })
    }
    // 查询当前用户信息，需要检查 founder 状态
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (user.founder) {
      if (actualUpdates.role !== undefined && actualUpdates.role !== user.role) {
        return res.status(403).json({ error: '无法修改创始人角色' })
      }
      if (actualUpdates.status !== undefined && actualUpdates.status !== user.status) {
        return res.status(403).json({ error: '无法修改创始人状态' })
      }
      // 创始人只允许通过此接口修改用户名、邮箱、头像、密码
      const founderAllowedUpdates = ['username', 'email', 'avatar', 'password']
      const founderActualUpdates = {}
      Object.keys(actualUpdates).forEach(key => {
        if (founderAllowedUpdates.includes(key)) {
          founderActualUpdates[key] = actualUpdates[key]
        }
      })
      // 只应用允许创始人修改的字段
      Object.assign(user, founderActualUpdates)
    } else {
      // 非创始人用户，应用所有允许更新的字段
      Object.assign(user, actualUpdates)
    }
    // 检查更新后的用户名或邮箱是否已存在
    if (actualUpdates.username && actualUpdates.username !== user.username) {
      const existingUsername = await User.findOne({ username: actualUpdates.username, _id: { $ne: id } })
      if (existingUsername) {
        return res.status(400).json({ error: '用户名已存在' })
      }
    }
    if (actualUpdates.email && actualUpdates.email !== user.email) {
      const existingEmail = await User.findOne({ email: actualUpdates.email, _id: { $ne: id } })
      if (existingEmail) {
        return res.status(400).json({ error: '邮箱已被注册' })
      }
    }
    if (actualUpdates.password) {
      if (actualUpdates.password.length < 6) {
        return res.status(400).json({ error: '密码长度不能小于6个字符' })
      }
      user.password = actualUpdates.password
    }
    await user.save()
    // 返回更新后的用户信息
    const updatedUser = await User.findById(user._id).select('-password')
    res.json({ message: '用户数据更新成功', user: updatedUser })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取所有图片
router.post('/images', auth, isAdmin, async (req, res) => {
  try {
    const { page, limit, searchQuery } = req.body
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath
    const query = {}
    if (searchQuery) {
      const searchConditions = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { filename: { $regex: searchQuery, $options: 'i' } },
          { md5: { $regex: searchQuery, $options: 'i' } },
          { sha1: { $regex: searchQuery, $options: 'i' } },
          { remarks: { $regex: searchQuery, $options: 'i' } },
          { ip: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } },
          { album: { $regex: searchQuery, $options: 'i' } }
        ]
      }
      // 组合过滤条件和搜索条件
      if (Object.keys(query).length > 0) {
        const currentQuery = { ...query }
        for (const key in query) {
          delete query[key]
        }
        query.$and = [currentQuery, searchConditions]
      } else {
        Object.assign(query, searchConditions)
      }
    }
    const images = await Image.find(query)
      .sort({ date: -1 })
      .populate('user', 'username')
      .populate('album', 'name permission')
      .skip(skip)
      .limit(limitMath)
    // 获取总数
    const total = await Image.countDocuments(query)
    res.json({ images, total })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 更新图片数据
router.patch('/images/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { remarks, orientation } = req.body
    // 获取图片信息
    const image = await Image.findById(id)
    if (!image) {
      throw new Error('图片不存在')
    }
    if (remarks.length > 500) {
      throw new Error('图片备注不能超过500个字符')
    }
    // 更新备注
    if (remarks !== undefined) {
      image.remarks = remarks
    }
    if (image.type !== 'local') {
      throw new Error('修改图片方向功能仅限本地图片, 第三方存储无效')
    }
    // 如果方向发生变化，重新生成图片
    if (orientation !== undefined && orientation !== 0) {
      const imagePath = path.join(process.cwd(), image.url)
      const thumbPath = path.join(process.cwd(), image.thumb)
      try {
        // 读取原图
        const imageBuffer = await fs.readFile(imagePath)
        // 生成新的文件名
        const ext = path.extname(image.url)
        const newFilename = `${Date.now()}${ext}`
        const newThumbFilename = `thumb_${newFilename}`
        // 生成临时文件路径
        const tempImagePath = `${imagePath}.temp`
        const tempThumbPath = `${thumbPath}.temp`
        // 生成新的图片和缩略图到临时文件
        await sharp(imageBuffer).rotate(parseInt(orientation)).toFile(tempImagePath)
        await sharp(imageBuffer)
          .rotate(parseInt(orientation))
          .resize({
            width: Math.round(image.width * 0.5),
            height: Math.round(image.height * 0.5),
            fit: 'inside',
            withoutEnlargement: true
          })
          .toFile(tempThumbPath)
        // 删除原图
        await fs.unlink(imagePath)
        await fs.unlink(thumbPath)
        // 生成新的文件路径
        const newImagePath = path.join(path.dirname(imagePath), newFilename)
        const newThumbPath = path.join(path.dirname(thumbPath), newThumbFilename)
        // 重命名临时文件为新的文件名
        await fs.rename(tempImagePath, newImagePath)
        await fs.rename(tempThumbPath, newThumbPath)
        // 更新数据库中的文件路径
        image.url = `/uploads/${newFilename}`
        image.thumb = `/uploads/thumbnails/${newThumbFilename}`
      } catch ({ message }) {
        await fs.unlink(`${imagePath}.temp`)
        await fs.unlink(`${thumbPath}.temp`)
        throw new Error(message)
      }
    }
    await image.save()
    // 返回更新后的图片信息
    const updatedImage = await Image.findById(image._id)
      .populate('user', 'username')
      .populate('album', 'name permission')
    res.json({ message: '图片数据更新成功', image: updatedImage })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除任意图片
router.delete('/images/:id', auth, isAdmin, async (req, res) => {
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
router.post('/stats', auth, isAdmin, async (req, res) => {
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

// 创建新用户
router.post('/users/create', auth, isAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码为必填项' })
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({ error: '用户名已存在' })
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({ error: '邮箱已被注册' })
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      role: role || 'user',
      status: 'active',
      socialType: 'email'
    })

    await user.save()
    res.json({ message: '用户创建成功', user: { ...user.toObject(), password: undefined } })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 生成邀请码
router.post('/invite-codes/generate', auth, isAdmin, async (req, res) => {
  try {
    const { count = 1 } = req.body
    const codes = []

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      const inviteCode = new InviteCode({ code })
      await inviteCode.save()
      codes.push(inviteCode)
    }

    res.json({ message: '邀请码生成成功', codes })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取邀请码列表
router.post('/invite-codes', auth, isAdmin, async (req, res) => {
  try {
    const { page, limit } = req.body
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath
    const codes = await InviteCode.find()
      .populate('usedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitMath)
    const total = await InviteCode.countDocuments()
    res.json({ codes, total })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 导出邀请码
router.get('/invite-codes/export', auth, isAdmin, async (req, res) => {
  try {
    // 获取邀请码数据并填充用户信息
    const codes = await InviteCode.find().populate('usedBy', 'username email').sort({ createdAt: -1 })
    // 构造 CSV 数据
    const csvData = codes.map(code => ({
      邀请码: code.code,
      状态: code.status === 'unused' ? '未使用' : '已使用',
      使用人: code.usedBy ? `${code.usedBy.username} (${code.usedBy.email})` : '-',
      使用时间: code.usedAt ? new Date(code.usedAt).toLocaleString() : '-',
      生成时间: new Date(code.createdAt).toLocaleString()
    }))
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=invite-codes.csv')
    // 使用 papaparse 转换为 CSV 字符串
    let csv = Papa.unparse(csvData)
    // 添加 UTF-8 BOM，解决 Excel 乱码问题
    csv = '\ufeff' + csv
    res.send(csv)
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除邀请码
router.delete('/invite-codes/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    // 检查邀请码是否存在
    const inviteCodeInfo = await InviteCode.findById(id)
    if (!inviteCodeInfo) {
      return res.status(404).json({ error: '邀请码不存在' })
    }
    // 删除邀请码
    await InviteCode.deleteOne({ _id: id })
    res.json({ message: '邀请码删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取相册列表
router.post('/albums', auth, isAdmin, async (req, res) => {
  try {
    const { page, limit, name, permission, username } = req.body
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath
    const query = {}
    if (name) {
      query.name = { $regex: name, $options: 'i' }
    }
    if (permission) {
      query.permission = permission
    }
    if (username) {
      const users = await User.find({ username: { $regex: username, $options: 'i' } }, '_id')
      const userIds = users.map(user => user._id)
      query.user = { $in: userIds }
    }
    // 查询相册列表，同时获取图片数量
    const albums = await Album.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'username')
      .skip(skip)
      .limit(limitMath)
      .lean()
    // 获取每个相册的图片数量
    const albumsWithCount = await Promise.all(
      albums.map(async album => {
        const imageCount = await Image.countDocuments({ album: album._id })
        return { ...album, imageCount }
      })
    )
    const total = await Album.countDocuments(query)
    res.json({ albums: albumsWithCount, total })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 搜索用户
router.post('/users/search', auth, isAdmin, async (req, res) => {
  try {
    const { username } = req.body
    if (!username) {
      return res.json({ users: [] })
    }
    // 查询用户
    const users = await User.find({ username: { $regex: username, $options: 'i' } }, 'username _id').limit(10)
    const formattedUsers = users.map(user => ({
      value: user._id,
      label: user.username
    }))
    res.json({ users: formattedUsers })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 创建相册
router.post('/albums/new', auth, isAdmin, async (req, res) => {
  try {
    const { userId, name, permission } = req.body
    if (!userId || !name || !permission) {
      return res.status(400).json({ error: '用户ID、相册名称和权限为必填项' })
    }
    // 验证用户是否存在
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    // 创建相册
    const album = new Album({
      user: userId,
      name,
      permission
    })
    await album.save()
    // 返回创建后的相册信息（包含用户信息）
    const createdAlbum = await Album.findById(album._id).populate('user', 'username').lean()
    res.json({ message: '相册创建成功', album: createdAlbum })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 更新相册
router.put('/albums/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, permission } = req.body
    // 验证相册是否存在
    const album = await Album.findById(id)
    if (!album) {
      return res.status(404).json({ error: '相册不存在' })
    }
    // 验证权限值是否有效
    if (permission && !['public', 'private'].includes(permission)) {
      return res.status(400).json({ error: '无效的权限值' })
    }
    // 更新相册信息
    if (name) album.name = name
    if (permission) album.permission = permission
    await album.save()
    // 返回更新后的相册信息
    const updatedAlbum = await Album.findById(album._id).populate('user', 'username').lean()
    res.json({ message: '相册更新成功', album: updatedAlbum })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除相册
router.delete('/albums/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    // 验证相册是否存在
    const album = await Album.findById(id)
    if (!album) {
      return res.status(404).json({ error: '相册不存在' })
    }
    await Image.updateMany({ album: id }, { $set: { album: null } })
    // 删除相册
    await Album.deleteOne({ _id: id })
    res.json({ message: '相册删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取角色组列表
router.post('/role-groups', auth, isAdmin, async (req, res) => {
  try {
    const roleGroups = await RoleGroup.find()
    res.json(roleGroups)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取指定角色组
router.post('/role-groups/info/:id', auth, isAdmin, async (req, res) => {
  try {
    const roleGroups = await RoleGroup.findOne({ _id: req.params.id })
    if (!roleGroups) {
      return res.status(400).json({ error: '用户组不存在' })
    }
    res.json(roleGroups)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建角色组
router.post('/role-groups/create', auth, isAdmin, async (req, res) => {
  try {
    const roleGroup = new RoleGroup(req.body)
    await roleGroup.save()
    res.json(roleGroup)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新角色组
router.put('/role-groups/:id', auth, isAdmin, async (req, res) => {
  try {
    const roleGroup = await RoleGroup.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(roleGroup)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除角色组
router.delete('/role-groups/:id', auth, isAdmin, async (req, res) => {
  try {
    await RoleGroup.findByIdAndDelete(req.params.id)
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建公告
router.post('/announcements/new', auth, isAdmin, async (req, res) => {
  try {
    const { title, content, type, startTime, endTime } = req.body

    const announcement = await Announcement.create({
      title,
      content,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    })
    res.json({ message: '公告创建成功', announcement })
  } catch ({ message }) {
    res.status(500).json({ message })
  }
})

// 获取公告列表
router.post('/announcements', auth, isAdmin, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 })
    res.json(announcements)
  } catch ({ message }) {
    res.status(500).json({ message })
  }
})

// 更新公告
router.put('/announcements/:id', auth, isAdmin, async (req, res) => {
  try {
    const { title, content, type, startTime, endTime, isActive } = req.body

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        type,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isActive
      },
      { new: true }
    )
    if (!announcement) {
      return res.status(404).json({ message: '公告不存在' })
    }
    res.json({ message: '公告更新成功', announcement })
  } catch ({ message }) {
    res.status(500).json({ message })
  }
})

// 删除公告
router.delete('/announcements/:id', auth, isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id)

    if (!announcement) {
      return res.status(404).json({ message: '公告不存在' })
    }

    res.json({ message: '公告删除成功' })
  } catch ({ message }) {
    res.status(500).json({ message })
  }
})

// 获取当前有效的公告
router.post('/announcements/active', async (req, res) => {
  try {
    const now = new Date()
    // 修改查询条件，确保按创建时间倒序排序
    const announcement = await Announcement.findOne({
      isActive: true
      // startTime: { $lte: now },
      // endTime: { $gte: now }
    }).sort({ createdAt: -1 })
    res.json(announcement)
  } catch ({ message }) {
    res.status(500).json({ message })
  }
})

export default router
