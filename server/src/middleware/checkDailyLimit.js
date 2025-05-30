import { UploadLog } from '../models/UploadLog.js'
import { Config } from '../models/Config.js'

export const checkDailyLimit = async (req, res, next) => {
  try {
    const { upload, site } = await Config.findOne()
    if (!upload.dailyLimit) return next()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const count = await UploadLog.countDocuments({
      user: site.anonymousUpload ? null : req.user._id,
      createdAt: { $gte: today }
    })
    if (count >= upload.dailyLimit) {
      return res.status(403).json({ error: '已达到每日上传限制' })
    }
    next()
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
} 