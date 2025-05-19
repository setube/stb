import express from 'express'
import { auth } from '../middleware/auth.js'
import { checkRole } from '../middleware/checkRole.js'
import { User } from '../models/User.js'
import { Image } from '../models/Image.js'

const router = express.Router()

// 获取所有用户列表
router.get('/users', auth, checkRole(['admin']), async (req, res) => {
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
router.get('/images', auth, checkRole(['admin']), async (req, res) => {
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
    const image = await Image.findByIdAndDelete(req.params.id)
    if (!image) {
      return res.status(404).json({ error: '图片不存在' })
    }
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取系统统计信息
router.get('/stats', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [userCount, imageCount, activeUsers] = await Promise.all([
      User.countDocuments(),
      Image.countDocuments(),
      User.countDocuments({ status: 'active' })
    ])

    res.json({
      userCount,
      imageCount,
      activeUsers
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router 