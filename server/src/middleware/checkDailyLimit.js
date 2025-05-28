import { UploadLog } from '../models/UploadLog.js'
import { Config } from '../models/Config.js'

export const checkDailyLimit = async (req, res, next) => {
  try {
    const config = await Config.findOne()
    if (!config.upload.dailyLimit) {
      return next()
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const count = await UploadLog.countDocuments({
      user: config.site.anonymousUpload ? null : req.user._id,
      createdAt: { $gte: today }
    })
    if (count >= config.upload.dailyLimit) {
      return res.status(403).json({ error: '已达到每日上传限制' })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
} 