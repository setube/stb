import mongoose from 'mongoose'

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: { // 'register', 'reset', 'changeEmail', etc.
    type: String,
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '2h' // 可以设置一个 TTL 索引，例如2小时后自动删除
  }
})

// 生成验证码和
verificationCodeSchema.methods.generateCode = function () {
  // 生成包含数字和大写字母的字符集
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  // 生成6位随机验证码
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }
  this.code = code
  return code
}

// 设置过期时间
verificationCodeSchema.methods.setExpires = function (duration) {
  this.expires = new Date(Date.now() + duration)
}

// 自动删除过期的记录
verificationCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 })

export const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema) 