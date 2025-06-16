import express from 'express'
import multer from 'multer'
import path from 'path'
import { auth, isAdmin } from '../middleware/auth.js'
import { Config } from '../models/Config.js'
import { RoleGroup } from '../models/RoleGroup.js'
import sharp from 'sharp'
import fs from 'fs/promises'

const router = express.Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // 确保临时目录存在
      await fs.mkdir(path.join('uploads', 'temp'), { recursive: true })
      cb(null, path.join('uploads', 'temp'))
    } catch ({ message }) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    cb(null, `temp_${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => cb(null, true)
})

// 获取系统配置
router.post('/config', auth, isAdmin, async (req, res) => {
  try {
    await Config.initialize()
    let config = await Config.findOne()
    const { _id, __v, ...configWithoutId } = config.toObject()
    res.json(configWithoutId)
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 更新系统配置
router.put('/config', auth, isAdmin, async (req, res) => {
  try {
    await Config.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true })
    res.status(200).json({ message: '站点配置保存成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 上传水印图片
router.post('/upload-watermark', auth, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { file, body } = req
    if (!file) {
      return res.status(400).json({ error: '请选择要上传的文件' })
    }
    const { watermark } = await RoleGroup.findById(body.id)
    // 如果有旧的水印
    if (watermark[body.type].path) {
      // 确保水印目录存在
      const imagePath = path.join(process.cwd(), watermark[body.type].path)
      // 删除旧水印文件
      await fs.unlink(imagePath)
    }
    // 确保水印文件目录存在
    await fs.mkdir(path.join('uploads', 'watermarks'), { recursive: true })
    // 生成水印文件名
    const watermarkFilename = `watermark_${Date.now()}.${body.type === 'image' ? 'png' : 'ttf'}`
    const watermarkPath = path.join('uploads', 'watermarks', watermarkFilename)
    if (body.type === 'image') {
      // 处理水印图片
      await sharp(file.path).resize(200).png().toFile(watermarkPath)
      // 删除临时文件
      await fs.unlink(file.path)
    } else {
      fs.rename(file.path, watermarkPath)
    }
    const relativePath = `/uploads/watermarks/${watermarkFilename}`
    // 更新配置中的文件路径
    await RoleGroup.findOneAndUpdate({}, { [`watermark.${body.type}.path`]: relativePath }, { upsert: true })
    res.json({ path: relativePath })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除文件
router.put('/delete-watermark', auth, isAdmin, async (req, res) => {
  try {
    const { filePath, type } = req.body
    if (!filePath) {
      return res.status(400).json({ error: '需要删除的文件为空' })
    }
    // 确保水印目录存在
    const imagePath = path.join(process.cwd(), filePath)
    await fs.unlink(imagePath)
    // 更新配置中的文件路径
    await RoleGroup.findOneAndUpdate({}, { [`watermark.${type}.path`]: '' }, { upsert: true })
    res.json({ message: '删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

export default router
