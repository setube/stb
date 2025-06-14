import express from 'express'
import multer from 'multer'
import path from 'path'
import sharp from 'sharp'
import { User } from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { Image } from '../models/Image.js'
import { Config } from '../models/Config.js'
import { UploadLog } from '../models/UploadLog.js'
import { RoleGroup } from '../models/RoleGroup.js'
import { checkDailyLimit } from '../middleware/checkDailyLimit.js'
import { checkIpWhitelist } from '../middleware/checkIpWhitelist.js'
import {
  uploadToOSS,
  uploadToCOS,
  uploadToS3,
  getUploadToken,
  uploadToQiNiu,
  uploadToUpyun,
  uploadToSftp,
  uploadToFtp,
  uploadToWebdav,
  uploadToTelegram,
  uploadToGithub
} from '../utils/oss.js'
import fs from 'fs/promises'
import crypto from 'crypto'
import { createReadStream } from 'fs'
import { tencentCheckImageSecurity, aliyunCheckImageSecurity, nsfwjsCheckImageSecurity } from '../utils/security.js'
import { Album } from '../models/Album.js'

const router = express.Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  fileFilter: async (req, file, cb) => {
    try {
      let userRole
      if (req?.user?._id) {
        const { role } = await User.findById(req.user._id).populate('role')
        userRole = role
      } else {
        userRole = await RoleGroup.findOne({ isGuest: true })
      }
      const ext = path.extname(file.originalname).toLowerCase().slice(1)
      if (!userRole.upload.allowedFormats.includes(ext)) {
        return cb(new Error('不支持的图片格式'))
      }
      cb(null, true)
    } catch (error) {
      cb(error)
    }
  }
})

// 计算MD5
const calculateMD5 = async filePath => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = createReadStream(filePath)
    stream.on('data', chunk => {
      hash.update(chunk)
    })
    stream.on('end', () => {
      resolve(hash.digest('hex'))
    })
    stream.on('error', err => {
      reject(err)
    })
  })
}

// 创建目录
const checkAndCreateDir = async dirPath => {
  try {
    await fs.access(dirPath)
  } catch (error) {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (mkdirError) {
      throw mkdirError
    }
  }
}

// 修改计算 SHA-1 的函数
const calculateSHA1 = async filePath => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    const stream = createReadStream(filePath)
    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

// 图片广场
router.post('/images', async (req, res) => {
  try {
    const { site } = await Config.findOne()
    if (!site.gallery) {
      res.status(500).json({ error: '图片广场功能未开启' })
      return
    }
    const { page, limit, tags } = req.body
    const token = req.header('Authorization')?.replace('Bearer ', '')
    const pageMath = Math.max(1, parseInt(page))
    const limitMath = Math.max(1, parseInt(limit))
    const skip = (pageMath - 1) * limitMath
    const query = {}
    // 过滤条件：只显示属于公开相册的图片 或 不属于任何相册的图片
    // 查询属于公开相册的图片ID列表
    const publicAlbums = await Album.find({ permission: 'public' }).select('_id')
    const publicAlbumIds = publicAlbums.map(album => album._id)
    // 相册可见性条件
    const albumVisibilityCondition = {
      $or: [
        { album: null }, // 独立图片
        { album: { $in: publicAlbumIds } }
      ]
    }
    Object.assign(query, albumVisibilityCondition)
    if (tags && tags.length > 0) {
      let tagsArray = Array.isArray(tags)
        ? tags
        : tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
      if (tagsArray.length > 0) {
        const tagSearchCondition = { tags: { $in: tagsArray } }
        const currentQueryConditions = []
        currentQueryConditions.push(albumVisibilityCondition)
        currentQueryConditions.push(tagSearchCondition)
        // 清空顶层 query 并构建 $and 查询
        for (const key in query) {
          delete query[key]
        }
        query.$and = currentQueryConditions
      }
    }
    // 查询图片
    let imageQuery = Image.find(query)
      .populate('album', 'name')
      .select(!token ? 'url thumb type tags' : '')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitMath)
    if (token) {
      imageQuery = imageQuery.populate('user', 'username')
    }
    const total = await Image.countDocuments(query)
    res.json({
      images: await imageQuery,
      total
    })
  } catch ({ message }) {
    res.status(500).json({ error: '获取图片广场图片失败: ' + message })
  }
})

// 正则处理函数
const generate = async (variable, file, req, isuser) => {
  let userRole
  if (req?.user?._id) {
    const { role } = await User.findById(req.user._id).populate('role')
    userRole = role
  } else {
    userRole = await RoleGroup.findOne({ isGuest: true })
  }
  // 获取文件信息
  const ext = path.extname(file.originalname).toLowerCase().slice(1)
  const filename = path.basename(file.originalname, path.extname(file.originalname))
  const time = Date.now()
  const uniqid = time.toString(36) + Math.random().toString(36).slice(2)
  const md5 = req.body.md5
  const sha1 = await calculateSHA1(file.path)
  const uuid = crypto.randomUUID()
  const uid = isuser ? req.user._id : 'guest'
  // 获取日期信息
  const date = new Date()
  const Y = date.getFullYear()
  const y = Y.toString().slice(2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const Ymd = `${Y}${m}${d}`
  // 替换变量
  return variable
    .replace(/{Y}/g, Y)
    .replace(/{y}/g, y)
    .replace(/{m}/g, m)
    .replace(/{d}/g, d)
    .replace(/{Ymd}/g, Ymd)
    .replace(/{filename}/g, filename)
    .replace(/{ext}/g, userRole.upload.convertFormat || ext)
    .replace(/{time}/g, time)
    .replace(/{uniqid}/g, uniqid)
    .replace(/{md5}/g, md5)
    .replace(/{sha1}/g, sha1)
    .replace(/{uuid}/g, uuid)
    .replace(/{uid}/g, uid)
}

// 上传图片相关函数
const uploadImageToStorage = async (file, req, isuser) => {
  const md5 = await calculateMD5(file.path)
  try {
    const { body, clientIp, user } = req
    let userRole = {}
    if (isuser) {
      const { role } = await User.findById(user._id).populate('role')
      userRole = role
    } else {
      userRole = await RoleGroup.findOne({ isGuest: true })
    }
    const upload = userRole.upload
    const { site, storage, watermark, ai } = await Config.findOne()
    const bodyIp = clientIp.ipv4 || clientIp.ipv6 || body.ip
    // 检查有没有填写网站URL
    if (!site.url) {
      throw new Error('请先配置网站URL')
    }
    // 获取图片信息
    const { format, width, height } = await sharp(file.path).metadata()
    // 检查图片格式
    if (!upload.allowedFormats.includes(format)) {
      throw new Error('不支持的图片格式')
    }
    // 检查图片尺寸
    if (upload.minWidth && width < upload.minWidth) {
      throw new Error(`图片宽度不能小于 ${upload.minWidth}px`)
    }
    if (upload.minHeight && height < upload.minHeight) {
      throw new Error(`图片高度不能小于 ${upload.minHeight}px`)
    }
    // 查找已存在的图片
    const existingImage = await Image.findOne({ md5 })
    if (existingImage) {
      // 删除上传的图片
      await fs.unlink(file.path)
      // 返回已上传图片的信息
      return existingImage.toObject()
    }
    let securityResult, labelResults
    // 如果启用了内容安全检测
    if (ai.enabled) {
      // 先上传到临时位置
      const tempPath = path.join('uploads', 'temp', `${Date.now()}.${path.extname(file.originalname)}`)
      await fs.mkdir(path.dirname(tempPath), { recursive: true })
      await fs.copyFile(file.path, tempPath)
      switch (ai.type) {
        case 'tencent':
          try {
            if (file.size >= 10 * 1024 * 1024) {
              throw new Error('图片大小超过腾讯云图片审查服务最大图片10MB限制')
            }
            // 进行内容安全检测
            const tencent = await tencentCheckImageSecurity(tempPath)
            securityResult = tencent.safe
            labelResults = tencent.Label
            // 删除临时文件
            await fs.unlink(tempPath)
            if (ai.action === 'mark' && tencent.safe === 'Block') {
              throw new Error('图片中包含敏感内容, 已被删除')
            }
          } catch (error) {
            throw error
          }
          break
        case 'aliyun':
          try {
            if (file.size >= 20 * 1024 * 1024) {
              throw new Error('图片大小超过阿里云图片审查服务最大图片20MB限制')
            }
            // 检查图片尺寸
            if (width >= 30000 || height >= 30000) {
              throw new Error('图片高宽超过阿里云图片审查服务最大高宽30000px限制')
            }
            // 进行内容安全检测
            const aliyun = await aliyunCheckImageSecurity(tempPath)
            securityResult = aliyun.safe
            labelResults = aliyun.label
            // 删除临时文件
            await fs.unlink(tempPath)
            if (ai.action === 'mark' && aliyun.safe === 'high') {
              throw new Error('图片中包含敏感内容, 已被删除')
            }
          } catch (error) {
            throw error
          }
          break
        case 'nsfwjs':
          try {
            // 进行内容安全检测
            const nsfwjs = await nsfwjsCheckImageSecurity(tempPath)
            securityResult = nsfwjs.safe
            labelResults = nsfwjs.label
            // 删除临时文件
            await fs.unlink(tempPath)
            if (ai.action === 'mark' && nsfwjs.safe === 'Block') {
              throw new Error('图片中包含敏感内容, 已被删除')
            }
          } catch (error) {
            throw error
          }
          break
        default:
          throw new Error('未知的安全检测类型')
      }
    }
    // 处理图片
    let imageProcessor = sharp(file.path)
    // 调整尺寸
    if (upload.maxWidth || upload.maxHeight) {
      imageProcessor = imageProcessor.resize({
        width: upload.maxWidth || undefined,
        height: upload.maxHeight || undefined,
        fit: 'inside'
      })
    }
    // 转换格式
    if (upload.convertFormat) {
      switch (upload.convertFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          imageProcessor = imageProcessor.jpeg()
          break
        case 'png':
          imageProcessor = imageProcessor.png()
          break
        case 'webp':
          // 检查是否为 GIF 动画
          const metadata = await imageProcessor.metadata()
          if (metadata.pages && metadata.pages > 1) {
            // 如果是多帧 GIF，使用 toFormat 方法
            imageProcessor = imageProcessor.toFormat('webp', {
              animated: true,
              effort: 6
            })
          } else {
            // 单帧图片
            imageProcessor = imageProcessor.webp()
          }
          break
        case 'gif':
          imageProcessor = imageProcessor.gif()
          break
        case 'jp2':
          imageProcessor = imageProcessor.jp2()
          break
        case 'tiff':
          imageProcessor = imageProcessor.tiff()
          break
        case 'avif':
          imageProcessor = imageProcessor.avif()
          break
        case 'heif':
          imageProcessor = imageProcessor.heif()
          break
        case 'jxl':
          imageProcessor = imageProcessor.jxl()
          break
        case 'raw':
          imageProcessor = imageProcessor.raw()
          break
        default:
          imageProcessor = imageProcessor.jpeg()
      }
    }
    if (upload.qualityOpen) {
      // 如果没有指定格式转换，但指定了质量，则使用原始格式
      switch (format) {
        case 'jpeg':
        case 'jpg':
          imageProcessor = imageProcessor.jpeg({
            quality: upload.quality
          })
          break
        case 'png':
          imageProcessor = imageProcessor.png({
            quality: upload.quality
          })
          break
        case 'webp':
          imageProcessor = imageProcessor.webp({
            quality: upload.quality
          })
          break
        case 'jp2':
          imageProcessor = imageProcessor.jp2({
            quality: upload.quality
          })
          break
        case 'tiff':
          imageProcessor = imageProcessor.tiff({
            quality: upload.quality
          })
          break
        case 'avif':
          imageProcessor = imageProcessor.avif({
            quality: upload.quality
          })
          break
        case 'heif':
          imageProcessor = imageProcessor.heif({
            quality: upload.quality
          })
          break
      }
    }
    // 添加水印
    if (watermark.enabled) {
      if (watermark.type === 'text' && watermark.text.content) {
        // 添加文字水印
        const { content, fontSize, color, position } = watermark.text
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
        imageProcessor = imageProcessor.composite([
          {
            input: Buffer.from(svgText),
            gravity,
            tile: watermark.tile,
            top: 10,
            left: 10
          }
        ])
      } else if (watermark.type === 'image' && watermark.image.path) {
        // 添加图片水印
        const { path: watermarkPath, opacity, position } = watermark.image
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
        imageProcessor = imageProcessor.composite([
          {
            input: watermarkBuffer,
            gravity,
            tile: watermark.tile,
            top: 10,
            left: 10,
            blend: 'over'
          }
        ])
      }
    }
    // 保存处理后的图片
    const generatePath = await generate(upload.catalogue, file, req, isuser)
    const uploadPath = 'uploads' + storage.local.path + generatePath
    checkAndCreateDir(uploadPath)
    // 生成文件名
    const processedFilename = await generate(upload.namingRule, file, req, isuser)
    const processedPath = path.join(uploadPath, processedFilename)
    // 确保目录存在
    await checkAndCreateDir(path.dirname(processedPath))
    if (upload.convertFormat || upload.qualityOpen) {
      await imageProcessor.toFile(processedPath)
    } else {
      await fs.copyFile(file.path, processedPath)
    }
    // 获取处理后的文件大小
    const { size } = await fs.stat(processedPath)
    // 计算处理后的图片的 SHA-1 值
    const sha1 = await calculateSHA1(processedPath)
    let url = '',
      filePath = ''
    switch (upload.storageType) {
      case 'local':
        url = `/${uploadPath}/${processedFilename}`
        filePath = url
        break
      case 'oss':
        // 上传到OSS
        const ossPath = `${storage.cos.filePath}/${generatePath}/${processedFilename}`
        filePath = ossPath
        // 上传到OSS后删除本地文件
        try {
          url = await uploadToOSS(processedPath, ossPath)
        } catch ({ message }) {
          throw new Error('上传到OSS失败: ' + message)
        }
        break
      case 'cos':
        // 上传到COS
        const cosPath = `${storage.cos.filePath}/${generatePath}/${processedFilename}`
        filePath = cosPath
        try {
          url = await uploadToCOS(processedPath, cosPath)
        } catch ({ message }) {
          throw new Error('上传到COS失败: ' + message)
        }
        break
      case 's3':
        // 上传到S3兼容存储
        filePath = `${storage.s3.directory}/${generatePath}/${processedFilename}`
        try {
          url = await uploadToS3(`${uploadPath}/${processedFilename}`, filePath)
        } catch ({ message }) {
          throw new Error('上传到S3兼容存储失败: ' + message)
        }
        break
      case 'qiniu':
        // 上传到七牛
        filePath = `${storage.qiniu.directory}/${generatePath}/${processedFilename}`
        try {
          // 获取上传凭证
          const token = await getUploadToken()
          // 上传到七牛
          const urlInfo = await uploadToQiNiu(token, processedPath, filePath)
          if (urlInfo) {
            url = urlInfo
          }
        } catch ({ message }) {
          throw new Error('七牛上传失败:' + message)
        }
        break
      case 'upyun':
        // 上传到又拍云
        filePath = `${storage.upyun.directory}/${generatePath}/${processedFilename}`
        try {
          const urlInfo = await uploadToUpyun(processedPath)
          if (urlInfo) {
            url = urlInfo
          }
        } catch ({ message }) {
          throw new Error('又拍云上传失败:' + message)
        }
        break
      case 'sftp':
        // 上传到SFTP
        filePath = `${storage.sftp.directory}/${generatePath}/${processedFilename}`
        try {
          const urlInfo = await uploadToSftp(processedPath, processedFilename)
          if (urlInfo) {
            url = urlInfo
          }
        } catch ({ message }) {
          throw new Error('SFTP上传失败:' + message)
        }
        break
      case 'ftp':
        // 上传到FTP
        filePath = `${storage.ftp.directory}/${generatePath}/${processedFilename}`
        try {
          const urlInfo = await uploadToFtp(processedPath, processedFilename)
          if (urlInfo) {
            url = urlInfo
          }
        } catch ({ message }) {
          throw new Error('FTP上传失败:' + message)
        }
        break
      case 'webdav':
        // 上传到WEBDAV
        filePath = `${storage.webdav.directory}/${generatePath}/${processedFilename}`
        try {
          const urlInfo = await uploadToWebdav(processedPath, processedFilename)
          if (urlInfo) {
            url = urlInfo
          }
        } catch ({ message }) {
          throw new Error('WebDAV上传失败:' + message)
        }
        break
      case 'telegram':
        try {
          const urlInfo = await uploadToTelegram(processedPath, processedFilename, user)
          if (urlInfo) {
            url = urlInfo.url
            filePath = urlInfo.fileId
          }
        } catch ({ message }) {
          throw new Error('Telegram上传失败:' + message)
        }
        break
      case 'github':
        filePath = `${storage.github.directory}/${generatePath}/${processedFilename}`
        try {
          const urlInfo = await uploadToGithub(processedPath, filePath, user)
          if (urlInfo) {
            url = urlInfo
          }
        } catch ({ message }) {
          throw new Error('Github上传失败:' + message)
        }
        break
      case 'r2':
        throw new Error('当前存储类型已被废弃, 请前往后台重新设置')
      default:
        throw new Error('未知的存储类型')
    }
    // 生成缩略图
    const thumbnailPath = path.join('uploads', 'thumbnails')
    await checkAndCreateDir(thumbnailPath)
    const thumbnailFilename = `thumb_${Date.now()}.${upload.convertFormat || format}`
    const thumbnailFullPath = path.join(thumbnailPath, thumbnailFilename)
    // 生成缩略图
    await imageProcessor
      .clone()
      .resize({
        width: Math.round(width * 0.5),
        height: Math.round(height * 0.5),
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(thumbnailFullPath)
    // 保存图片记录，添加 SHA-1 值
    const image = new Image({
      name: file.originalname,
      url,
      thumb: `/uploads/thumbnails/${thumbnailFilename}`,
      md5,
      sha1,
      safe: securityResult,
      label: labelResults,
      type: upload.storageType,
      user: isuser ? user._id : null,
      width,
      height,
      date: Date.now(),
      ip: bodyIp,
      size,
      filePath,
      filename: processedFilename
    })
    // 保存图片信息
    await image.save()
    // 上传日志也添加 SHA-1 值
    const log = new UploadLog({
      user: isuser ? user._id : null,
      ip: bodyIp,
      image: image._id,
      originalName: file.originalname,
      size,
      format,
      md5,
      width,
      height,
      sha1,
      filename: processedFilename
    })
    await log.save()
    // 清理本地未处理的图片源文件
    try {
      // 等待一小段时间确保文件不再被使用
      await new Promise(resolve => setTimeout(resolve, 100))
      await fs.unlink(upload.storageType === 'local' ? file.path : processedPath)
    } catch (unlinkError) {
      console.error('删除临时文件失败:', unlinkError)
    }
    return image
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 用户上传
router.post('/upload', auth, upload.single('image'), checkIpWhitelist, checkDailyLimit, async (req, res) => {
  try {
    const image = await uploadImageToStorage(req.file, req, true)
    res.status(201).json(image)
  } catch ({ message }) {
    if (message.includes('图片中包含敏感内容, 已被删除')) {
      const { ip, ai } = await Config.findOne()
      const { body, clientIp } = req
      const bodyIp = clientIp.ipv4 || clientIp.ipv6 || body.ip
      if (ai.autoBlack && ip.enabled && ip.blacklist.indexOf(bodyIp) === -1) {
        ip.blacklist.push(bodyIp)
        await Config.findOneAndUpdate({}, { $set: { ip } }, { new: true, upsert: true })
        return res.status(400).json({ error: '当前上传IP已被拉黑' })
      }
    }
    return res.status(400).json({ error: message })
  }
})

// 游客上传
router.post('/tourist/upload', upload.single('image'), checkIpWhitelist, checkDailyLimit, async (req, res) => {
  try {
    const image = await uploadImageToStorage(req.file, req, false)
    res.status(201).json(image)
  } catch ({ message }) {
    if (message.includes('图片中包含敏感内容, 已被删除')) {
      const { ip, ai } = await Config.findOne()
      const { body, clientIp } = req
      const bodyIp = clientIp.ipv4 || clientIp.ipv6 || body.ip
      if (ai.autoBlack && ip.enabled && ip.blacklist.indexOf(bodyIp) === -1) {
        ip.blacklist.push(bodyIp)
        await Config.findOneAndUpdate({}, { $set: { ip } }, { new: true, upsert: true })
        return res.status(400).json({ error: '当前上传IP已被拉黑' })
      }
    }
    return res.status(400).json({ error: message })
  }
})

// 上传用户头像
router.post('/upload-avatar', auth, upload.single('image'), async (req, res) => {
  const { file, user } = req
  try {
    const { site, upload } = await Config.findOne()
    // 检查有没有填写网站URL
    if (!site.url) {
      throw new Error('请先配置网站URL')
    }
    if (!file) {
      return res.status(400).json({ error: '请选择要上传的图片' })
    }
    if (file.size > upload.maxSize * 1024 * 1024) {
      throw new Error(`文件大小不能超过 ${upload.maxSize}MB`)
    }
    // 获取图片信息
    const { format, width, height } = await sharp(file.path).metadata()
    // 检查图片格式
    if (!upload.allowedFormats.includes(format)) {
      throw new Error('不支持的图片格式')
    }
    // 检查图片尺寸
    if (upload.minWidth && width < upload.minWidth) {
      throw new Error(`图片宽度不能小于 ${upload.minWidth}px`)
    }
    if (upload.minHeight && height < upload.minHeight) {
      throw new Error(`图片高度不能小于 ${upload.minHeight}px`)
    }
    // 处理头像图片
    const imageProcessor = sharp(file.path)
      .resize(100, 100, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
    // 生成文件名
    const filename = `avatar_${user._id}_${Date.now()}.webp`
    const uploadPath = 'uploads/avatars'
    await checkAndCreateDir(uploadPath)
    const filePath = path.join(uploadPath, filename)
    // 保存处理后的图片
    await imageProcessor.toFile(filePath)
    const url = `/${uploadPath}/${filename}`
    // 更新用户头像
    const userinfo = await User.findById(user._id)
    userinfo.avatar = url
    await userinfo.save()
    if (user.avatar) {
      const name = user.avatar.replace(`${uploadPath}/`, '')
      // 删除旧的头像
      await fs.unlink(path.join(uploadPath, name))
    }
    // 清理临时文件
    await fs.unlink(file.path)
    res.json({ message: user.avatar ? '头像上传成功, 旧头像已删除' : '头像上传成功', avatar: url })
  } catch ({ message }) {
    await fs.unlink(file.path)
    res.status(400).json({ error: message })
  }
})

export default router
