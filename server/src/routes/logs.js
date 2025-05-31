import express from 'express'
import { auth } from '../middleware/auth.js'
import { checkRole } from '../middleware/checkRole.js'
import { UploadLog } from '../models/UploadLog.js'
import { User } from '../models/User.js'

const router = express.Router()

// 获取上传日志列表
router.post('/logs', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { page, limit, startDate, endDate, username, ip } = req.body
    const query = {}
    // 日期范围过滤
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }
    // IP过滤 
    if (ip) {
      query.ip = new RegExp(ip, 'i')
    }
    // 用户名过滤
    let logs
    if (username) {
      const userQuery = { username: new RegExp(username, 'i') }
      const users = await User.find(userQuery).select('_id')
      const userIds = users.map(user => user._id)
      query.user = { $in: userIds }
    }
    // 执行查询
    logs = await UploadLog.find(query)
      .populate('user', 'username')
      .populate('image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      logs,
      total: await UploadLog.countDocuments(query),
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取日志统计信息
router.post('/logs/stats', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.body
    const match = {}
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }
    const stats = await UploadLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
    // 获取IP分布统计
    const ipStats = await UploadLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$ip',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    // 获取用户上传统计
    const userStats = await UploadLog.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',  // 关联 users 集合
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $group: {
          _id: '$user',
          username: { $first: { $arrayElemAt: ['$userInfo.username', 0] } },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    res.json({
      dailyStats: stats,
      ipStats,
      userStats
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除指定日志
router.delete('/logs/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const log = await UploadLog.findById(id)
    if (!log) {
      return res.status(404).json({ error: '日志不存在' })
    }
    // 删除日志
    await UploadLog.findByIdAndDelete(id)
    res.json({ message: '日志删除成功' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

// 清空所有日志
router.delete('/logs', auth, checkRole(['admin']), async (req, res) => {
  try {
    // 删除所有日志
    await UploadLog.deleteMany({})

    res.json({ message: '所有日志已清空' })
  } catch ({ message }) {
    res.status(500).json({ error: message })
  }
})

export default router 