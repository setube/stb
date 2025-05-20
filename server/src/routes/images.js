import express from 'express'
import multer from 'multer'
import path from 'path'
import sharp from 'sharp'
import { auth } from '../middleware/auth.js'
import { Image } from '../models/Image.js'
import { Config } from '../models/Config.js'
import { UploadLog } from '../models/UploadLog.js'
import { getIpLocation } from '../utils/ipLocation.js'
import { checkDailyLimit } from '../middleware/checkDailyLimit.js'
import { checkIpWhitelist } from '../middleware/checkIpWhitelist.js'
import fs from 'fs/promises'

const router = express.Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage, fileFilter: async (req, file, cb) => {
    try {
      const config = await Config.findOne()
      const ext = path.extname(file.originalname).toLowerCase().slice(1)
      if (!config.upload.allowedFormats.includes(ext)) {
        return cb(new Error('不支持的图片格式'))
      }
      cb(null, true)
    } catch (error) {
      cb(error)
    }
  }
})

// 上传图片

// 获取图片列表
router.post('/images', async (req, res) => {
  try {
    // 确保页码和每页数量为有效数字
    const page = Math.max(1, parseInt(req.body.page))
    const limit = Math.max(1, parseInt(req.body.limit))
    // 计算跳过的记录数
    const skip = (page - 1) * limit
    // 查询图片
    const images = await Image.find()
      .populate('user', 'username')
      .skip(skip)
      .limit(limit)
    // 获取总数
    const total = await Image.countDocuments()
    res.json({
      images,
      total
    })
  } catch (error) {
    console.error('获取图片列表错误:', error)
    res.status(500).json({ error: error.message })
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
    // 删除本地文件
    try {
      const filePath = path.join(process.cwd(), image.url)
      await fs.unlink(filePath)
    } catch (error) {
      console.error('删除文件失败:', error)
      // 继续执行，即使文件删除失败
    }
    // 删除数据库记录
    await Image.deleteOne({ _id: image._id })
    // 删除相关的上传日志
    await UploadLog.deleteMany({ image: image._id })
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/upload',
  auth,
  checkIpWhitelist,
  checkDailyLimit,
  upload.single('image'),
  async (req, res) => {
    try {
      const config = await Config.findOne()
      const file = req.file
      // 检查文件大小
      if (file.size > config.upload.maxSize * 1024 * 1024) {
        throw new Error(`文件大小不能超过 ${config.upload.maxSize}MB`)
      }
      // 获取图片信息
      const imageInfo = await sharp(file.path).metadata()
      // 检查图片尺寸
      if (config.upload.minWidth && imageInfo.width < config.upload.minWidth) {
        throw new Error(`图片宽度不能小于 ${config.upload.minWidth}px`)
      }
      if (config.upload.minHeight && imageInfo.height < config.upload.minHeight) {
        throw new Error(`图片高度不能小于 ${config.upload.minHeight}px`)
      }
      // 处理图片
      let imageProcessor = sharp(file.path)
      // 调整尺寸
      if (config.upload.maxWidth || config.upload.maxHeight) {
        imageProcessor = imageProcessor.resize({
          width: config.upload.maxWidth || undefined,
          height: config.upload.maxHeight || undefined,
          fit: 'inside'
        })
      }
      // 转换格式和质量
      if (config.upload.convertFormat) {
        switch (config.upload.convertFormat.toLowerCase()) {
          case 'jpeg':
          case 'jpg':
            imageProcessor = imageProcessor.jpeg({
              quality: config.upload.quality || 80
            })
            break
          case 'png':
            imageProcessor = imageProcessor.png({
              quality: config.upload.quality || 80
            })
            break
          case 'webp':
            imageProcessor = imageProcessor.webp({
              quality: config.upload.quality || 80
            })
            break
          case 'gif':
            imageProcessor = imageProcessor.gif()
            break
          default:
            imageProcessor = imageProcessor.jpeg({
              quality: config.upload.quality || 80
            })
        }
      } else if (config.upload.quality) {
        // 如果没有指定格式转换，但指定了质量，则使用原始格式
        const format = imageInfo.format
        switch (format) {
          case 'jpeg':
          case 'jpg':
            imageProcessor = imageProcessor.jpeg({
              quality: config.upload.quality
            })
            break
          case 'png':
            imageProcessor = imageProcessor.png({
              quality: config.upload.quality
            })
            break
          case 'webp':
            imageProcessor = imageProcessor.webp({
              quality: config.upload.quality
            })
            break
        }
      }
      // 添加水印
      if (config.watermark.enabled) {
        if (config.watermark.type === 'text' && config.watermark.text.content) {
          // 添加文字水印
          const { content, fontSize, color, position } = config.watermark.text
          // 创建文字水印
          const svgText = `
            <svg width="100%" height="100%">
              <style>
                .watermark {
                  font-size: ${fontSize}px;
                  fill: ${color};
                  font-family: Arial, sans-serif;
                }
              </style>
              <text class="watermark" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">
                ${content}
              </text>
            </svg>
          `
          // 根据位置计算偏移
          let gravity
          switch (position) {
            case 'top-left':
              gravity = 'northwest'
              break
            case 'top-right':
              gravity = 'northeast'
              break
            case 'bottom-left':
              gravity = 'southwest'
              break
            case 'bottom-right':
              gravity = 'southeast'
              break
            case 'center':
              gravity = 'center'
              break
            default:
              gravity = 'southeast'
          }
          // 添加文字水印
          imageProcessor = imageProcessor.composite([{
            input: Buffer.from(svgText),
            gravity,
            top: 10,
            left: 10
          }])
        } else if (config.watermark.type === 'image' && config.watermark.image.path) {
          // 添加图片水印
          const { path: watermarkPath, opacity, position } = config.watermark.image
          // 读取水印图片
          const watermarkBuffer = await sharp(path.join(process.cwd(), watermarkPath))
            .resize(200) // 调整水印大小
            .toBuffer()
          // 根据位置计算偏移
          let gravity
          switch (position) {
            case 'top-left':
              gravity = 'northwest'
              break
            case 'top-right':
              gravity = 'northeast'
              break
            case 'bottom-left':
              gravity = 'southwest'
              break
            case 'bottom-right':
              gravity = 'southeast'
              break
            case 'center':
              gravity = 'center'
              break
            default:
              gravity = 'southeast'
          }
          // 添加图片水印
          imageProcessor = imageProcessor.composite([{
            input: watermarkBuffer,
            gravity,
            top: 10,
            left: 10,
            blend: 'over'
          }])
        }
      }
      // 保存处理后的图片
      const processedFilename = `processed_${Date.now()}_${path.basename(file.originalname, path.extname(file.originalname))}.${config.upload.convertFormat || imageInfo.format}`
      const processedPath = path.join(process.env.UPLOAD_DIR, processedFilename)
      await imageProcessor.toFile(processedPath)
      // 删除原始上传的图片
      try {
        await fs.unlink(file.path)
      } catch (error) {
        console.error('删除原始文件失败:', error)
      }
      // 使用前端传来的IP，如果没有则使用请求IP
      const clientIp = req.body.ip || req.ip
      // 记录上传日志
      const location = getIpLocation(clientIp)
      // 保存图片记录
      const image = new Image({
        name: file.originalname,
        url: `/uploads/${processedFilename}`,
        md5: req.body.md5,
        user: req.user._id,
        width: imageInfo.width,
        height: imageInfo.height,
        date: Date.now(),
        ip: clientIp,
        size: file.size
      })
      await image.save()
      const log = new UploadLog({
        user: req.user._id,
        ip: clientIp,
        location,
        image: image._id,
        originalName: file.originalname,
        size: file.size,
        format: imageInfo.format,
        width: imageInfo.width,
        height: imageInfo.height
      })
      await log.save()
      res.status(201).json(image)
    } catch (error) {
      // 如果处理过程中出错，也要尝试删除原始文件
      if (req.file) {
        try {
          await fs.unlink(req.file.path)
        } catch (unlinkError) {
          console.error('删除原始文件失败:', unlinkError)
        }
      }
      if (error.message.includes('E11000')) {
        res.status(400).json({ error: '图片已存在' })
        return
      }
      res.status(400).json({ error: error.message })
    }
  }
)


export default router