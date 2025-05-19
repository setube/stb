import { Config } from '../models/Config.js'

export const checkIpWhitelist = async (req, res, next) => {
  try {
    // 确保配置存在
    let config = await Config.findOne()
    if (!config) {
      config = await Config.create({})
    }
    // 检查 IP 功能是否启用
    if (!config.ip || !config.ip.enabled) {
      return next()
    }
    // 使用前端传来的IP，如果没有则使用请求IP
    const clientIp = req.body.ip || req.ip
    // 检查白名单
    if (config.ip.whitelistEnabled && Array.isArray(config.ip.whitelist)) {
      if (!config.ip.whitelist.includes(clientIp)) {
        return res.status(403).json({ error: 'IP不在白名单中' })
      }
    }
    // 检查黑名单
    if (config.ip.blacklistEnabled && Array.isArray(config.ip.blacklist)) {
      if (config.ip.blacklist.includes(clientIp)) {
        return res.status(403).json({ error: 'IP在黑名单中' })
      }
    }
    next()
  } catch (error) {
    console.error('IP检查错误:', error)
    res.status(500).json({ error: 'IP检查失败' })
  }
} 