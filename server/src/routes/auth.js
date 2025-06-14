import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { Config } from '../models/Config.js'
import { Image } from '../models/Image.js'
import { deleteImage } from '../utils/deleteImage.js'
import { sendVerificationCode } from '../utils/mailer.js'
import { InviteCode } from '../models/InviteCode.js'
import { VerificationCode } from '../models/VerificationCode.js'
import { Album } from '../models/Album.js'
import { Captcha } from '../models/Captcha.js'
import { RoleGroup } from '../models/RoleGroup.js'

const router = express.Router()

// 获取站点配置
router.post('/config', async (req, res) => {
  try {
    let config = await Config.findOne()
    if (!config) {
      return res.status(404).json({ error: config })
    }
    const { upload, site, ai, smtp, oauth } = config
    res.json({
      upload,
      site,
      ai: {
        enabled: ai.enabled
      },
      smtp: {
        enabled: smtp.enabled
      },
      oauth: {
        enabled: oauth.enabled,
        github: {
          enabled: oauth.github.enabled
        },
        google: {
          enabled: oauth.google.enabled
        },
        linuxdo: {
          enabled: oauth.linuxdo.enabled
        }
      }
    })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取当前用户信息
router.post('/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('role')
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    const { _id, username, role, status, email, founder, avatar, oauth } = user
    // 更新最后登录时间
    user.lastLogin = Date.now()
    await user.save()
    res.json({
      _id,
      username,
      role: {
        isAdmin: role.isAdmin,
        isDefault: role.isDefault,
        isGuest: role.isGuest,
        upload: role.upload
      },
      status,
      email,
      founder,
      avatar,
      oauth
    })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取游客用户组信息
router.post('/guest', async (req, res) => {
  try {
    const user = await RoleGroup.findOne({ isGuest: true })
    res.json({
      role: {
        isAdmin: user.isAdmin,
        isDefault: user.isDefault,
        isGuest: user.isGuest,
        upload: user.upload
      }
    })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取我的图片列表
router.post('/my', auth, async (req, res) => {
  try {
    const { page, limit, albumId } = req.body
    const userId = req.user._id

    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath

    const query = { user: userId }

    if (albumId === 'standalone') {
      // 查询不属于任何相册的图片
      query.album = null
    } else if (albumId) {
      // 查询属于特定相册的图片
      query.album = albumId
    } else {
      // 默认查询所有图片，包括相册内的和独立的 (或者只查独立的？根据前端需求调整)
      // 目前保持查所有，前端可以再做分组
      // 如果只想查独立的，可以将 albumId 默认设为 'standalone' 或 null 在前端控制
    }

    const images = await Image.find(query).sort({ date: -1 }).populate('user', 'username').skip(skip).limit(limitMath)

    const total = await Image.countDocuments(query)

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
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已注册' })
    }
    // 存储验证码
    let verificationCodeRecord = await VerificationCode.findOne({ email, type: 'register' })
    if (!verificationCodeRecord) {
      verificationCodeRecord = new VerificationCode({ email, type: 'register' })
    }
    // 生成验证码并设置过期时间为 5 分钟
    const code = verificationCodeRecord.generateCode()
    verificationCodeRecord.setExpires(5 * 60 * 1000)
    await verificationCodeRecord.save()
    // 发送验证码邮件
    await sendVerificationCode(email, code, 'register')
    res.json({ message: '验证码已发送' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 注册接口
router.post('/register', async (req, res) => {
  try {
    const { body, clientIp } = req
    const { username, password, email, code, inviteCode, ip, captchaId } = body
    const { site, smtp } = await Config.findOne()

    // 检查是否开启验证码
    if (site.captcha) {
      if (!captchaId) {
        return res.status(400).json({ error: '请先完成滑动验证' })
      }
      // 验证滑动验证码
      const captcha = await Captcha.findById(captchaId)
      if (!captcha) {
        return res.status(400).json({ error: '滑动验证已失效,请重新验证' })
      }
      if (new Date() > captcha.expiresAt) {
        await Captcha.deleteOne({ _id: captchaId })
        return res.status(400).json({ error: '滑动验证已过期,请重新验证' })
      }
      // 删除已使用的验证记录
      await Captcha.deleteOne({ _id: captchaId })
    }

    // 检查是否开启注册
    if (!site.register) {
      return res.status(403).json({ error: '注册已关闭' })
    }
    // 检查是否开启邀请码注册
    if (site.inviteCodeRequired) {
      if (!inviteCode) {
        return res.status(400).json({ error: '需要提供邀请码才能注册' })
      }
      const codeRecord = await InviteCode.findOne({ code: inviteCode })
      if (!codeRecord || codeRecord.status === 'used') {
        return res.status(400).json({ error: '无效的邀请码或邀请码已被使用' })
      }
    }
    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({ error: '用户名已存在' })
    }
    // 检查邮箱是否已注册
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({ error: '邮箱已被注册' })
    }
    // 检查是否开启邮箱验证，并验证验证码
    if (smtp.enabled) {
      if (!code) {
        return res.status(400).json({ error: '请输入验证码' })
      }
      // 查找验证码记录并验证
      const verificationCodeRecord = await VerificationCode.findOne({ email, type: 'register' })
      if (
        !verificationCodeRecord ||
        verificationCodeRecord.code !== code ||
        verificationCodeRecord.expires < new Date()
      ) {
        // 验证失败或过期后删除该记录
        if (verificationCodeRecord) {
          await VerificationCode.deleteOne({ _id: verificationCodeRecord._id })
        }
        return res.status(400).json({ error: '验证码错误或已过期' })
      }
      // 验证成功后删除记录
      await VerificationCode.deleteOne({ _id: verificationCodeRecord._id })
    }
    // 密码长度验证
    if (!password || password.length < 6) {
      return res.status(400).json({ error: '密码长度不能小于6位' })
    }
    // 获取默认角色组
    const defaultRoleGroup = await RoleGroup.findOne({ isDefault: true })
    if (!defaultRoleGroup) {
      throw new Error('未找到默认用户组')
    }
    const adminRoleGroup = await RoleGroup.findOne({ isAdmin: true })
    if (!adminRoleGroup) {
      throw new Error('未找到系统管理员组')
    }
    // 查询当前用户列表数量，确定是否为创始人
    const userCount = await User.countDocuments()
    // 创建新用户
    const userinfo = new User({
      ip: {
        ipv4: clientIp.ipv4 || ip?.ipv4,
        ipv6: clientIp.ipv6 || ip?.ipv6
      },
      username,
      password,
      email,
      role: !userCount ? adminRoleGroup._id : defaultRoleGroup._id,
      founder: !userCount ? true : false,
      lastLogin: Date.now(),
      status: 'active'
    })
    await userinfo.save()
    // 如果使用了邀请码，更新邀请码状态
    if (site.inviteCodeRequired && inviteCode) {
      const codeRecord = await InviteCode.findOne({ code: inviteCode })
      if (codeRecord) {
        codeRecord.status = 'used'
        codeRecord.usedBy = userinfo._id
        codeRecord.usedAt = new Date()
        await codeRecord.save()
      }
    }
    const user = await User.findOne({ _id: userinfo._id }).populate('role')
    res.status(201).json({
      message: '注册成功',
      token: jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET),
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
        email: user.email,
        founder: user.founder,
        avatar: user.avatar, // 确保返回 avatar 字段
        oauth: user.oauth // 确保返回 oauth 字段
      }
    })
  } catch ({ message }) {
    res.status(400).json({ error: message })
  }
})

// 登录账号
router.post('/login', async (req, res) => {
  try {
    const { username, password, captchaId } = req.body
    // 检查是否开启验证码
    const { site } = await Config.findOne()
    if (site.captcha) {
      if (!captchaId) {
        return res.status(400).json({ error: '请先完成滑动验证' })
      }
      // 验证滑动验证码
      const captcha = await Captcha.findById(captchaId)
      if (!captcha) {
        return res.status(400).json({ error: '滑动验证已失效,请重新验证' })
      }
      if (new Date() > captcha.expiresAt) {
        await Captcha.deleteOne({ _id: captchaId })
        return res.status(400).json({ error: '滑动验证已过期,请重新验证' })
      }
      // 删除已使用的验证记录
      await Captcha.deleteOne({ _id: captchaId })
    }

    const user = await User.findOne({ username }).populate('role')
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('用户名或密码错误')
    }
    const { _id, role, status, email, founder, avatar, oauth } = user
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
        avatar,
        oauth
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
    const { smtp } = await Config.findOne()
    // 检查是否开启邮箱验证
    if (!smtp.enabled) {
      return res.status(400).json({ error: '未开启邮箱验证功能' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    // 存储验证码
    let verificationCodeRecord = await VerificationCode.findOne({ email, type })
    if (!verificationCodeRecord) {
      verificationCodeRecord = new VerificationCode({ email, type })
    }
    // 生成验证码并设置过期时间为 5 分钟
    const code = verificationCodeRecord.generateCode()
    verificationCodeRecord.setExpires(5 * 60 * 1000)
    await verificationCodeRecord.save()
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
    if (!email) {
      return res.status(400).json({ error: '邮箱为空' })
    }
    if (!code) {
      return res.status(400).json({ error: '请输入验证码' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    // 查找验证码记录并验证
    const verificationCodeRecord = await VerificationCode.findOne({ email })
    if (
      !verificationCodeRecord ||
      verificationCodeRecord.code !== code ||
      verificationCodeRecord.expires < new Date()
    ) {
      // 验证失败或过期后删除该记录
      if (verificationCodeRecord) {
        await VerificationCode.deleteOne({ _id: verificationCodeRecord._id })
      }
      return res.status(400).json({ error: '验证码错误或已过期' })
    }
    // 验证成功后删除记录
    await VerificationCode.deleteOne({ _id: verificationCodeRecord._id })
    // 生成临时令牌
    const token = jwt.sign({ userId: user._id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' })
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
    // 存储验证码
    let verificationCodeRecord = await VerificationCode.findOne({ email, type })
    if (!verificationCodeRecord) {
      verificationCodeRecord = new VerificationCode({ email, type })
    }
    // 生成验证码并设置过期时间为 5 分钟
    const code = verificationCodeRecord.generateCode()
    verificationCodeRecord.setExpires(5 * 60 * 1000)
    await verificationCodeRecord.save()
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
    // 查找验证码记录并验证
    const verificationCodeRecord = await VerificationCode.findOne({ email })
    if (
      !verificationCodeRecord ||
      verificationCodeRecord.code !== code ||
      verificationCodeRecord.expires < new Date()
    ) {
      // 验证失败或过期后删除该记录
      if (verificationCodeRecord) {
        await VerificationCode.deleteOne({ _id: verificationCodeRecord._id })
      }
      return res.status(400).json({ error: '验证码错误或已过期' })
    }
    // 验证成功后删除记录
    await VerificationCode.deleteOne({ _id: verificationCodeRecord._id })
    user.email = email
    await user.save()
    res.json({ message: '邮箱修改成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 创建相册
router.post('/albums', auth, async (req, res) => {
  try {
    const { name, permission, tags, coverImage } = req.body
    const userId = req.user._id

    if (!name) {
      return res.status(400).json({ error: '相册名称为必填项' })
    }
    const album = new Album({
      name,
      user: userId,
      permission: permission || 'public',
      tags: tags || [],
      coverImage: coverImage || null
    })
    await album.save()
    res.status(201).json({ message: '相册创建成功', album })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取我的相册列表
router.post('/albums/my', auth, async (req, res) => {
  try {
    const { page, limit } = req.body // 可以添加分页参数
    const userId = req.user._id

    // 获取用户相册列表，并可以 populate coverImage
    const albums = await Album.find({ user: userId }).sort({ createdAt: -1 }).populate('coverImage', 'thumb url') // 填充封面图片信息
    // .skip(...) // 如果需要分页
    // .limit(...) // 如果需要分页

    // 可以同时获取独立图片的数量
    const standaloneCount = await Image.countDocuments({ user: userId, album: null })
    res.json({ albums, standaloneCount })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 获取单个相册详情
router.get('/albums/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id
    const album = await Album.findOne({ _id: id, user: userId }).populate('coverImage', 'thumb url')
    if (!album) {
      return res.status(404).json({ error: '相册不存在或无权访问' })
    }
    res.json({ album })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 更新相册
router.patch('/albums/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id
    const updates = req.body
    const album = await Album.findOne({ _id: id, user: userId })
    if (!album) {
      return res.status(404).json({ error: '相册不存在或无权修改' })
    }
    // 允许更新的字段
    const allowedUpdates = ['name', 'permission', 'coverImage']
    const actualUpdates = {}
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        actualUpdates[key] = updates[key]
      }
    })
    if (Object.keys(actualUpdates).length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' })
    }
    Object.assign(album, actualUpdates)
    await album.save()
    const updatedAlbum = await Album.findById(album._id).populate('coverImage', 'thumb url')
    res.json({ message: '相册更新成功', album: updatedAlbum })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除相册
router.delete('/albums/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id
    const album = await Album.findOne({ _id: id, user: userId })
    if (!album) {
      return res.status(404).json({ error: '相册不存在或无权删除' })
    }
    await Image.updateMany({ album: id }, { $set: { album: null } })
    await album.deleteOne()
    res.json({ message: '相册删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 将图片添加到相册 或 从相册移除
router.patch('/images/:id/album', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { albumId } = req.body
    const userId = req.user._id
    const image = await Image.findOne({ _id: id, user: userId })
    if (!image) {
      return res.status(404).json({ error: '图片不存在或无权操作' })
    }
    if (albumId) {
      // 将图片添加到相册，检查相册是否存在且属于当前用户
      const album = await Album.findOne({ _id: albumId, user: userId })
      if (!album) {
        return res.status(404).json({ error: '相册不存在或无权操作' })
      }
      image.album = albumId
    } else {
      image.album = null
    }
    await image.save()
    res.json({ message: albumId ? '图片已添加到相册' : '图片已移出相册' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 修改图片标签
router.patch('/images/:id/tags', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { tags } = req.body
    const image = await Image.findOne({ _id: id, user: req.user._id })
    if (!image) {
      return res.status(404).json({ error: '图片不存在或无权操作' })
    }
    // 验证 tags 是否是数组
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: '标签数据格式不正确' })
    }
    image.tags = tags
    await image.save()
    res.json({ message: '图片标签更新成功', tags: image.tags })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 生成滑动验证
router.post('/captcha/generate', async (req, res) => {
  try {
    const { site } = await Config.findOne()
    if (!site.captcha) {
      return res.status(400).json({ error: '验证码功能未开启' })
    }
    // 生成一个随机的验证值（这里用时间戳作为示例）
    const verifyValue = Date.now().toString()
    // 创建验证记录
    const captcha = new Captcha({
      verifyValue,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5分钟有效期
    })
    await captcha.save()
    res.json({
      success: true,
      captchaId: captcha._id
    })
  } catch (error) {
    res.status(500).json({ error: '生成验证失败' })
  }
})

// 验证滑动结果
router.post('/captcha/verify', async (req, res) => {
  try {
    const { site } = await Config.findOne()
    if (!site.captcha) {
      return res.status(400).json({ error: '验证码功能未开启' })
    }
    const { captchaId, verifyResult } = req.body
    if (!captchaId || verifyResult === undefined) {
      return res.status(400).json({ error: '参数不完整' })
    }
    // 查找验证记录
    const captcha = await Captcha.findById(captchaId)
    if (!captcha) {
      return res.status(404).json({ error: '验证记录不存在' })
    }
    // 检查是否过期
    if (new Date() > captcha.expiresAt) {
      return res.status(400).json({ error: '验证已过期' })
    }
    res.json({
      success: true,
      isValid: verifyResult === true
    })
  } catch (error) {
    res.status(500).json({ error: '验证失败' })
  }
})

export default router
