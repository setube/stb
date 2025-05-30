import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { Config } from '../models/Config.js'

const router = express.Router()

// 获取站点配置
router.post('/config', async (req, res) => {
  try {
    let config = await Config.findOne()
    if (!config) {
      return res.status(404).json({ error: config })
    }
    const { upload, site, ai } = config
    res.json({
      upload,
      site,
      ai: {
        enabled: ai.enabled
      }
    })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取当前用户信息
router.post('/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    // 更新最后登录时间
    user.lastLogin = Date.now()
    await user.save()
    res.json(user)
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const reqIP = req.ip.includes('::1') || req.ip.includes('127.0.0.1') || !req.ip ? req.body : req.ip
    const { username, password, email } = req.body
    const config = await Config.findOne()
    if (!config.site.register) {
      return res.status(403).json({ error: '注册已关闭' })
    }
    // 查询当前用户列表数量
    const userCount = await User.countDocuments()
    // 如果是第一个用户，则设置为创始人
    const user = new User({
      ip: reqIP,
      username,
      password,
      email,
      role: !userCount ? 'admin' : 'user',
      founder: !userCount ? true : false,
      lastLogin: Date.now(),
    })
    await user.save()
    const { _id, role, status, founder } = user
    const token = jwt.sign({ userId: _id, role }, process.env.JWT_SECRET)
    res.status(201).json({
      token,
      user: {
        _id,
        username,
        role,
        status,
        email,
        founder
      }
    })
  } catch ({ message }) {
    if (message.includes('E11000')) {
      res.status(400).json({ error: '用户名已存在' })
      return
    }
    res.status(400).json({ error: message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('用户名或密码错误')
    }
    const { _id, role, status, email, founder } = user
    if (status === 'disabled') {
      throw new Error('账号已被禁用')
    }
    // 更新最后登录时间
    user.lastLogin = Date.now()
    await user.save()
    const token = jwt.sign({ userId: _id, role }, process.env.JWT_SECRET)
    res.json({
      token,
      user: {
        _id,
        username,
        role,
        status,
        email,
        founder
      }
    })
  } catch ({ message }) {
    res.status(400).json({ error: message })
  }
})

export default router 