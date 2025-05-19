import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { Config } from '../models/Config.js'

const router = express.Router()

// 获取站点配置
router.get('/config', async (req, res) => {
  try {
    let config = await Config.findOne()
    if (!config) {
      return res.status(404).json({ error: config })
    }
    res.json({
      site: config.site
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取当前用户信息
router.get('/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body
    // 查询当前用户列表数量
    const userCount = await User.countDocuments()
    // 如果是第一个用户，则设置为创始人
    const user = new User({
      username,
      password,
      email,
      role: !userCount ? 'admin' : 'user',
      founder: !userCount ? true : false
    })
    await user.save()
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    )
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
        email: user.email,
        founder: user.founder
      }
    })
  } catch (error) {
    if (error.message.includes('E11000')) {
      res.status(400).json({ error: '用户名已存在' })
      return
    }
    res.status(400).json({ error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('用户名或密码错误')
    }
    if (user.status === 'disabled') {
      throw new Error('账号已被禁用')
    }
    // 更新最后登录时间
    user.lastLogin = new Date()
    await user.save()
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    )
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
        email: user.email,
        founder: user.founder
      }
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router 