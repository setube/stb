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
import {
  uploadToOSS, uploadToCOS, uploadToS3,
  uploadToR2, getUploadToken, uploadToQiNiu,
  uploadToUpyun, uploadToSftp, uploadToFtp,
  uploadToWebdav, uploadToTelegram, uploadToGithub
} from '../utils/oss.js'
import fs from 'fs/promises'
import crypto from 'crypto'
import { createReadStream } from 'fs'

const router = express.Router()

async function checkAndCreateDir(dirPath) {
  try {
    await fs.access(dirPath)
  } catch (error) {
    console.log('目录不存在，正在创建:', dirPath)
    try {
      await fs.mkdir(dirPath, { recursive: true })
      console.log('目录创建成功:', dirPath)
    } catch (mkdirError) {
      console.error('创建目录失败:', dirPath, mkdirError)
      throw mkdirError
    }
  }
}

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

// 修改计算 SHA-1 的函数
async function calculateSHA1(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    const stream = createReadStream(filePath)
    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

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
            // 检查是否为 GIF 动画
            const metadata = await imageProcessor.metadata()
            if (metadata.pages && metadata.pages > 1) {
              // 如果是多帧 GIF，使用 toFormat 方法
              imageProcessor = imageProcessor.toFormat('webp', {
                quality: config.upload.quality || 80,
                animated: true,
                effort: 6
              })
            } else {
              // 单帧图片
              imageProcessor = imageProcessor.webp({
                quality: config.upload.quality || 80
              })
            }
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
      const uploadPath = process.env.UPLOAD_DIR + config.storage.local.path
      checkAndCreateDir(uploadPath)
      const processedFilename = `${Date.now()}.${config.upload.convertFormat || imageInfo.format}`
      const processedPath = path.join(uploadPath, processedFilename)
      await imageProcessor.toFile(processedPath)

      // 获取处理后的文件大小
      const processedStats = await fs.stat(processedPath)
      const processedSize = processedStats.size

      // 计算处理后的图片的 SHA-1 值
      const sha1 = await calculateSHA1(processedPath)

      let url = '', filePath = ''
      switch (config.storage.type) {
        case 'local':
          url = `/${uploadPath}${processedFilename}`
          filePath = url
          break
        case 'oss':
          // 上传到OSS
          const ossPath = `${config.storage.oss.path}${processedFilename}`
          filePath = ossPath
          // 上传到OSS后删除本地文件 
          try {
            url = await uploadToOSS(processedPath, ossPath)
            await fs.unlink(processedPath)
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('OSS上传失败:', error)
            throw new Error('上传到OSS失败: ' + error.message)
          }
          break
        case 'cos':
          // 上传到COS
          const cosPath = `${config.storage.cos.filePath}/${processedFilename}`
          filePath = cosPath
          try {
            url = await uploadToCOS(processedPath, cosPath, processedFilename)
            // 上传成功后删除本地文件
            await fs.unlink(processedPath)
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('COS上传失败:', error)
            throw new Error('上传到COS失败: ' + error.message)
          }
          break
        case 's3':
          // 上传到S3
          filePath = `${config.storage.s3.directory}/${processedFilename}`
          try {
            url = await uploadToS3(processedPath)
            await fs.unlink(processedPath)
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('S3上传失败:', error)
            throw new Error('上传到S3失败: ' + error.message)
          }
          break
        case 'r2':
          // 上传到R2
          filePath = `${config.storage.r2.directory}/${processedFilename}`
          try {
            url = await uploadToR2(processedPath)
            // 上传成功后删除本地文件
            await fs.unlink(processedPath)
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('R2上传失败:', error)
            throw new Error(error)
          }
          break
        case 'qiniu':
          // 上传到七牛
          filePath = `/${processedFilename}`
          try {
            // 获取上传凭证
            const token = await getUploadToken()
            // 上传到七牛
            const urlInfo = await uploadToQiNiu(token, processedPath, processedFilename)
            if (urlInfo) {
              url = urlInfo
              await fs.unlink(processedPath)
            }
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('七牛上传失败:', error)
            throw new Error(error)
          }
          break
        case 'upyun':
          // 上传到七牛
          filePath = `${config.storage.upyun.directory}/${processedFilename}`
          try {
            const urlInfo = await uploadToUpyun(processedPath)
            if (urlInfo) {
              url = urlInfo
              await fs.unlink(processedPath)
            }
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('又拍云上传失败:', error)
            throw new Error(error)
          }
          break
        case 'sftp':
          // 上传到SFTP
          filePath = `${config.storage.sftp.directory}/${processedFilename}`
          try {
            const urlInfo = await uploadToSftp(processedPath, processedFilename)
            if (urlInfo) {
              url = urlInfo
              await fs.unlink(processedPath)
            }
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('SFTP上传失败:', error)
            throw new Error(error)
          }
          break
        case 'ftp':
          // 上传到FTP
          filePath = `${config.storage.ftp.directory}/${processedFilename}`
          try {
            const urlInfo = await uploadToFtp(processedPath, processedFilename)
            if (urlInfo) {
              url = urlInfo
              await fs.unlink(processedPath)
            }
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('FTP上传失败:', error)
            throw new Error(error)
          }
          break
        case 'webdav':
          // 上传到WEBDAV
          filePath = `${config.storage.webdav.directory}/${processedFilename}`
          try {
            const urlInfo = await uploadToWebdav(processedPath, processedFilename)
            if (urlInfo) {
              url = urlInfo
              await fs.unlink(processedPath)
            }
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('WebDAV上传失败:', error)
            throw new Error(error)
          }
          break
        case 'telegram':
          try {
            const urlInfo = await uploadToTelegram(processedPath, processedFilename, req.user)
            if (urlInfo) {
              url = urlInfo.url
              filePath = urlInfo.fileId
              await fs.unlink(processedPath)
            }
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('Telegram上传失败:', error)
            throw new Error(error)
          }
          break
        case 'github':
          filePath = `${config.storage.github.directory}/${processedFilename}`
          try {
            const urlInfo = await uploadToGithub(processedPath, processedFilename, req.user)
            if (urlInfo) {
              url = urlInfo
              await fs.unlink(processedPath)
            }
          } catch (error) {
            await fs.unlink(processedPath)
            console.error('Github上传失败:', error)
            throw new Error(error)
          }
          break
        default:
          gravity = 'southeast'
      }

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
      // 保存图片记录，添加 SHA-1 值
      const image = new Image({
        name: file.originalname,
        url,
        md5: req.body.md5,
        sha1, // 添加 SHA-1 值
        type: config.storage.type,
        user: req.user._id,
        width: imageInfo.width,
        height: imageInfo.height,
        date: Date.now(),
        ip: clientIp,
        size: processedSize,
        filePath,
        filename: processedFilename,
      })
      await image.save()
      // 上传日志也添加 SHA-1 值
      const log = new UploadLog({
        user: req.user._id,
        ip: clientIp,
        location,
        image: image._id,
        originalName: file.originalname,
        size: processedSize,
        format: imageInfo.format,
        width: imageInfo.width,
        height: imageInfo.height,
        sha1,
        filename: processedFilename,
      })
      await log.save()
      res.status(201).json(image)
    } catch (error) {
      if (error.message.includes('E11000')) {
        res.status(400).json({ error: '图片已存在' })
        return
      }
      res.status(400).json({ error: error.message })
    }
  }
)

export default router