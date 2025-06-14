import { UploadLog } from '../models/UploadLog.js'
import { Config } from '../models/Config.js'
import { User } from '../models/User.js'
import { RoleGroup } from '../models/RoleGroup.js'

export const checkDailyLimit = async (req, res, next) => {
  try {
    let userRole
    if (req?.user?._id) {
      const { role } = await User.findById(req.user._id).populate('role')
      userRole = role
    } else {
      userRole = await RoleGroup.findOne({ isGuest: true })
    }
    const { site } = await Config.findOne()
    if (!userRole.upload.dailyLimit) return next()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const count = await UploadLog.countDocuments({
      user: site.anonymousUpload ? null : req.user._id,
      createdAt: { $gte: today }
    })
    if (count >= userRole.upload.dailyLimit) {
      return res.status(403).json({ error: '已达到每日上传限制' })
    }
    next()
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
}
