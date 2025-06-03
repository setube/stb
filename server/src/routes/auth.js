import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { Config } from '../models/Config.js'
import { Image } from '../models/Image.js'
import { deleteImage } from '../utils/deleteImage.js'
import { sendVerificationCode } from '../utils/mailer.js'

const router = express.Router()

// 获取站点配置
router.post('/config', async (req, res) => {
  try {
    let config = await Config.findOne()
    if (!config) {
      return res.status(404).json({ error: config })
    }
    const { upload, site, ai, smtp } = config
    res.json({
      upload,
      site,
      ai: {
        enabled: ai.enabled
      },
      smtp: {
        enabled: smtp.enabled
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
    const { _id, username, role, status, email, founder, avatar } = user
    // 更新最后登录时间
    user.lastLogin = Date.now()
    await user.save()
    res.json({
      _id,
      username,
      role,
      status,
      email,
      founder,
      avatar
    })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取我的图片列表
router.post('/my', auth, async (req, res) => {
  try {
    const { page, limit } = req.body
    // 确保页码和每页数量为有效数字
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    // 计算跳过的记录数
    const skip = (pageMath - 1) * limitMath
    // 查询当前用户的图片
    const images = await Image.find({ user: req.user._id })
      .sort({ date: -1 })
      .populate('user', 'username')
      .skip(skip)
      .limit(limitMath)
    // 获取总数
    const total = await Image.countDocuments({ user: req.user._id })
    res.json({ images, total })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除图片
router.delete('/images/:id', auth, async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    if (!image) {
      return res.status(404).json({ error: '图片不存在' })
    }
    await deleteImage(image, req.params.id)
    res.json({ message: '删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 注册账号
router.post('/register', async (req, res) => {
  try {
    const reqIP = req.ip.includes('::1') || req.ip.includes('127.0.0.1') || !req.ip ? req.body : req.ip
    const { username, password, email, code } = req.body
    const config = await Config.findOne()
    // 检查是否开启注册
    if (!config.site.register) {
      return res.status(403).json({ error: '注册已关闭' })
    }
    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({ error: '用户名已存在' })
    }
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email, role: 'user' })
    if (existingEmail) {
      return res.status(400).json({ error: '邮箱已被注册' })
    }
    // 检查是否开启邮箱验证
    if (config.smtp.enabled) {
      // 验证码必填
      if (!code) {
        return res.status(400).json({ error: '请输入验证码' })
      }
      // 查找临时用户并验证验证码
      const tempUser = await User.findOne({ email, role: 'temp' })
      if (!tempUser) {
        return res.status(400).json({ error: '请先获取验证码' })
      }
      // 验证验证码
      if (!tempUser.verifyCode(code)) {
        return res.status(400).json({ error: '验证码错误或已过期' })
      }
      // 验证通过后删除临时用户
      await User.deleteOne({ _id: tempUser._id })
    }
    // 密码长度验证
    if (password.length < 6) {
      return res.status(403).json({ error: '密码长度不能小于6位' })
    }
    // 查询当前用户列表数量
    const userCount = await User.countDocuments()
    // 创建新用户
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
    res.status(400).json({ error: message })
  }
})

// 发送注册验证码
router.post('/register/send-code', async (req, res) => {
  try {
    const { email, username } = req.body
    const config = await Config.findOne()
    // 检查是否开启注册
    if (!config.site.register) {
      return res.status(403).json({ error: '注册已关闭' })
    }
    // 检查是否开启邮箱验证
    if (!config.smtp.enabled) {
      return res.status(400).json({ error: '未开启邮箱验证功能' })
    }
    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({ error: '用户名已存在' })
    }
    // 检查邮箱是否已注册
    const existingUser = await User.findOne({ email, role: 'user' })
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已注册' })
    }
    // 创建临时用户用于存储验证码
    let user = await User.findOne({ email, role: 'temp' })
    if (!user) {
      user = new User({ email, role: 'temp' })
    }
    // 生成验证码
    const code = user.generateVerificationCode()
    await user.save()
    // 发送验证码
    await sendVerificationCode(email, code, 'register')
    res.json({ message: '验证码已发送' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 登录账号
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('用户名或密码错误')
    }
    const { _id, role, status, email, founder, avatar } = user
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
        founder,
        avatar
      }
    })
  } catch ({ message }) {
    res.status(400).json({ error: message })
  }
})

// 发送验证码
router.post('/send-code', async (req, res) => {
  try {
    const { email, type } = req.body
    const config = await Config.findOne()
    // 检查是否开启邮箱验证
    if (!config.smtp.enabled) {
      return res.status(400).json({ error: '未开启邮箱验证功能' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    // 生成验证码
    const code = user.generateVerificationCode()
    await user.save()
    // 发送验证码邮件
    await sendVerificationCode(email, code, type)
    res.json({ message: '验证码已发送' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 验证验证码
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ error: '邮箱或验证码为空' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (!user.verifyCode(code)) {
      return res.status(400).json({ error: '验证码无效或已过期' })
    }
    // 生成临时令牌
    const token = jwt.sign(
      { userId: user._id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    res.json({ token })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: '无效的令牌' })
    }
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能小于6位' })
    }
    // 更新密码
    user.password = password
    user.verificationCode = null // 清除验证码
    await user.save()
    res.json({ message: '密码重置成功' })
  } catch ({ message }) {
    if (message === 'jwt expired') {
      return res.status(400).json({ error: '令牌已过期' })
    }
    res.status(500).json({ error: message })
  }
})

// 修改密码
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    // 验证旧密码
    if (!(await user.comparePassword(oldPassword))) {
      return res.status(400).json({ error: '旧密码错误' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能小于6位' })
    }
    // 更新密码
    user.password = newPassword
    await user.save()
    res.json({ message: '密码修改成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 给新邮箱发送验证码
router.post('/user/send-code', auth, async (req, res) => {
  try {
    const { email, type } = req.body
    const config = await Config.findOne()
    // 检查是否开启邮箱验证
    if (!config.smtp.enabled) {
      return res.status(400).json({ error: '未开启邮箱验证功能' })
    }
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    // 生成验证码
    const code = user.generateVerificationCode()
    await user.save()
    // 发送验证码邮件
    await sendVerificationCode(email, code, type)
    res.json({ message: '验证码已发送' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 验证邮箱验证码
router.post('/user/verify-code', auth, async (req, res) => {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ error: '邮箱或验证码为空' })
    }
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (!user.verifyCode(code)) {
      return res.status(400).json({ error: '验证码无效或已过期' })
    }
    user.email = email
    await user.save()
    res.json({ message: '邮箱修改成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

export default router 