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
    const reqBodyIp = req.body.ip.includes('127.0.0.1') || !req.body.ip ? req.ip : req.body.ip
    const reqIp = req.ip.includes('::1') || req.ip.includes('127.0.0.1') || !req.ip ? reqBodyIp : req.ip
    const bodyIp = reqIp || reqBodyIp
    // 检查黑名单
    if (enabled && blacklist.includes(bodyIp)) {
      await fs.unlink(req.file.path)
      return res.status(403).json({ error: 'IP在黑名单中' })
    }
    next()
  } catch (error) {
    await fs.unlink(file.path)
    res.status(500).json({ error: 'IP检查失败' })
  }
} 