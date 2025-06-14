import {
  deleteFromOSS,
  deleteFromCOS,
  deleteFromS3,
  deleteFromQiNiu,
  deleteFromUpyun,
  deleteFromSftp,
  deleteFromFtp,
  deleteFromWebdav,
  deleteFromTelegram,
  deleteFromGithub
} from '../utils/oss.js'
import fs from 'fs/promises'
import path from 'path'
import { Image } from '../models/Image.js'
import { UploadLog } from '../models/UploadLog.js'

export const deleteImage = async (imageInfo, id) => {
  const { _id, type, url, filename, filePath, thumb } = imageInfo
  try {
    // 根据存储类型删除文件
    switch (type) {
      case 'local':
        await Image.findByIdAndDelete(id)
        const localFilePath = path.join(process.cwd(), url)
        await fs.unlink(localFilePath)
        break
      case 'oss':
        await deleteFromOSS(filename)
        break
      case 'cos':
        const slashCount = (filePath.match(/\//g) || []).length
        if (slashCount === 1) {
          imageInfo.filePath = filePath.substring(1)
        }
        await deleteFromCOS(imageInfo.filePath)
        break
      case 's3':
        await deleteFromS3(filePath)
        break
      case 'qiniu':
        await deleteFromQiNiu(filePath)
        break
      case 'upyun':
        await deleteFromUpyun(filePath)
        break
      case 'sftp':
        await deleteFromSftp(filePath)
        break
      case 'ftp':
        await deleteFromFtp(filePath)
        break
      case 'webdav':
        await deleteFromWebdav(filePath)
        break
      case 'telegram':
        await deleteFromTelegram(filePath)
        break
      case 'github':
        await deleteFromGithub(filePath)
        break
      default:
        throw new Error(`未知的存储类型: ${type}`)
    }
    if (thumb) {
      // 删除本地缩略图
      const thumbFilePath = path.join(process.cwd(), thumb)
      await fs.unlink(thumbFilePath)
    }
    // 删除数据库记录
    await Image.deleteOne({ _id })
    // 删除相关的上传日志
    await UploadLog.deleteMany({ image: _id })
  } catch (error) {
    if (error.message.includes('message to delete')) {
      if (thumb) {
        // 删除本地缩略图
        const thumbFilePath = path.join(process.cwd(), thumb)
        await fs.unlink(thumbFilePath)
      }
      // 删除数据库记录
      await Image.deleteOne({ _id })
      // 删除相关的上传日志
      await UploadLog.deleteMany({ image: _id })
    } else {
      throw new Error(error)
    }
  }
}
