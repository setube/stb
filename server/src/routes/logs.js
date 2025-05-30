import express from 'express'
import { auth } from '../middleware/auth.js'
import { checkRole } from '../middleware/checkRole.js'
import { UploadLog } from '../models/UploadLog.js'

const router = express.Router()

// 获取上传日志列表
router.post('/logs', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, username, ip } = req.query
    
    const query = {}
    
    // 日期范围过滤
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }
    
    // 用户名过滤
    if (username) {
      query['user.username'] = new RegExp(username, 'i')
    }
    
    // IP过滤
    if (ip) {
      query.ip = new RegExp(ip, 'i')
    }

    const logs = await UploadLog.find(query)
      .populate('user', 'username')
      .populate('image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const total = await UploadLog.countDocuments(query)
    
    res.json({
      logs,
      total,
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
    const { startDate, endDate } = req.query
    
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
        $group: {
          _id: '$user',
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

// 导出日志
router.post('/logs/export', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    const query = {}
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const logs = await UploadLog.find(query)
      .populate('user', 'username')
      .populate('image')
      .sort({ createdAt: -1 })

    // 生成CSV数据
    const csvData = logs.map(log => ({
      '上传时间': log.createdAt,
      '用户名': log.user.username,
      'IP地址': log.ip,
      '国家': log.location.country,
      '区域': log.location.region,
      '省份': log.location.province,
      '城市': log.location.city,
      '运营商': log.location.isp,
      '文件名': log.originalName,
      '文件大小': `${(log.size / 1024 / 1024).toFixed(2)}MB`,
      '图片尺寸': `${log.width}x${log.height}`,
      '图片格式': log.format
    }))

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=upload-logs.csv')

    // 发送CSV数据
    res.send(convertToCSV(csvData))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// CSV转换函数
function convertToCSV(data) {
  const headers = Object.keys(data[0])
  const rows = data.map(obj => headers.map(header => obj[header]))
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export default router 