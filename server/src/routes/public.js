import express from 'express'
import { User } from '../models/User.js'
import { Album } from '../models/Album.js'
import { Image } from '../models/Image.js'

const router = express.Router()

// 获取公共用户基本信息 (POST 请求)
router.post('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId).select('username avatar founder createdAt').exec()
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json(user)
  } catch (error) {
    console.error('获取公共用户信息失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取用户公开的相册列表 
router.post('/users/:userId/albums', async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.body
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath
    // 查询属于该用户且权限为公开的相册
    const albums = await Album.find({ user: userId, permission: 'public' })
      .sort({ createdAt: -1 })
      .populate('coverImage', 'thumb url')
      .skip(skip)
      .limit(limitMath)
      .exec()

    const total = await Album.countDocuments({ user: userId, permission: 'public' })
    res.json({ albums, total })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取公开相册内的图片列表
router.post('/albums/:albumId/images', async (req, res) => {
  try {
    const { albumId } = req.params
    const { page = 1, limit = 20 } = req.body
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath
    // 验证相册是否存在且是公开的
    const album = await Album.findById(albumId).exec()
    if (!album || album.permission !== 'public') {
      return res.status(404).json({ error: '相册不存在或不是公开相册' })
    }
    // 获取相册内的图片列表
    const images = await Image.find({ album: albumId })
      .sort({ date: -1 })
      .select('url thumb type tags')
      .skip(skip)
      .limit(limitMath)
      .exec()
    const total = await Image.countDocuments({ album: albumId })
    res.json({ images, total, album })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router 