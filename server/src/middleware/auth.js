import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) throw new Error()
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) throw new Error()
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: '请先登录' })
  }
}

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('role')
    if (!user || !user.role.isAdmin) {
      return res.status(403).json({ error: '需要管理员权限' })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
