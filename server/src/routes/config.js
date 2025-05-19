import express from 'express'
import multer from 'multer'
import path from 'path'
import { auth } from '../middleware/auth.js'
import { checkRole } from '../middleware/checkRole.js'
import { Config } from '../models/Config.js'
import sharp from 'sharp'
import fs from 'fs'

const router = express.Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.env.UPLOAD_DIR, 'watermarks'))
  },
  filename: (req, file, cb) => {
    cb(null, `watermark_${Date.now()}${path.extname(file.originalname)}`)
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
router.get('/config', auth, checkRole(['admin']), async (req, res) => {
  try {
    let config = await Config.findOne()
    if (!config) {
      config = await Config.create({})
    }
    res.json(config)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新系统配置
router.put('/config', auth, checkRole(['admin']), async (req, res) => {
  try {
    const config = await Config.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    )
    res.status(200).json({ message: '站点配置保存成功' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 上传水印图片
router.post('/upload-watermark', auth, checkRole(['admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' })
    }

    // 处理水印图片
    const watermarkPath = path.join(process.env.UPLOAD_DIR, 'watermarks', req.file.filename)

    // 调整水印图片大小和格式
    await sharp(req.file.path)
      .resize(200) // 限制水印大小
      .png() // 转换为PNG格式以支持透明度
      .toFile(watermarkPath)

    // 删除原始上传文件
    fs.unlinkSync(req.file.path)

    const relativePath = `/uploads/watermarks/${req.file.filename}`

    // 更新配置中的水印图片路径
    await Config.findOneAndUpdate(
      {},
      { 'watermark.image.path': relativePath },
      { upsert: true }
    )

    res.json({ path: relativePath })
  } catch (error) {
    // 如果处理失败，删除已上传的文件
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: error.message })
  }
})

export default router 