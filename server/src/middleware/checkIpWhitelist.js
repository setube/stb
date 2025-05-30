import { Config } from '../models/Config.js'
import fs from 'fs/promises'

export const checkIpWhitelist = async (req, res, next) => {
  try {
    // 确保配置存在
    const { ip } = await Config.findOne()
    const { enabled, blacklist } = ip
    // 检查 IP 功能是否启用
    if (!enabled) return next()
    // 使用前端传来的IP，如果没有则使用请求IP
    const clientIp = req.body.ip || req.ip
    // 检查黑名单
    if (enabled && blacklist.includes(clientIp)) {
      await fs.unlink(req.file.path)
      return res.status(403).json({ error: 'IP在黑名单中' })
    }
    next()
  } catch (error) {
    await fs.unlink(file.path)
    res.status(500).json({ error: 'IP检查失败' })
  }
} 