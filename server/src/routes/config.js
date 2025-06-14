import express from 'express'
import multer from 'multer'
import path from 'path'
import { auth, isAdmin } from '../middleware/auth.js'
import { Config } from '../models/Config.js'
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
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只能上传图片文件'))
    }
  }
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
    const { file } = req
    if (!file) {
      return res.status(400).json({ error: '请选择要上传的图片' })
    }
    const { watermark } = await Config.findOne()
    // 如果有旧的水印
    if (watermark.image.path) {
      // 确保水印目录存在
      const imagePath = path.join(process.cwd(), watermark.image.path)
      // 删除旧水印文件
      await fs.unlink(imagePath)
    }
    // 确保水印目录存在
    await fs.mkdir(path.join('uploads', 'watermarks'), { recursive: true })
    // 生成水印文件名
    const watermarkFilename = `watermark_${Date.now()}.png`
    const watermarkPath = path.join('uploads', 'watermarks', watermarkFilename)
    // 处理水印图片
    await sharp(file.path)
      .resize(200) // 限制水印大小
      .png() // 转换为PNG格式以支持透明度
      .toFile(watermarkPath)
    // 删除临时文件
    await fs.unlink(file.path)
    const relativePath = `/uploads/watermarks/${watermarkFilename}`
    // 更新配置中的水印图片路径
    await Config.findOneAndUpdate({}, { 'watermark.image.path': relativePath }, { upsert: true })
    res.json({ path: relativePath })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 删除水印图片
router.delete('/delete-watermark/:imgPath', auth, isAdmin, async (req, res) => {
  try {
    const { imgPath } = req.params
    if (!imgPath) {
      return res.status(400).json({ error: '需要删除的水印图片为空' })
    }
    // 确保水印目录存在
    const imagePath = path.join(process.cwd(), imgPath)
    await fs.unlink(imagePath)
    // 更新配置中的水印图片路径
    await Config.findOneAndUpdate({}, { 'watermark.image.path': '' }, { upsert: true })
    res.json({ message: '删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

export default router
