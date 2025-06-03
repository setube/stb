import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  // 注册ip
  ip: {
    ipv4: {
      type: String
    },
    ipv6: {
      type: String
    }
  },
  username: {
    type: String,
    required: function () {
      return this.role !== 'temp' // 只有非临时用户才需要用户名
    },
    unique: function () {
      return this.role !== 'temp' // 只有非临时用户才需要唯一性约束
    }
  },
  // 是否为创始人
  founder: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String
  },
  password: {
    type: String,
    required: function () {
      return this.role !== 'temp' // 只有非临时用户才需要密码
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'temp'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  // 最后登录时间
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // 注册时间
  createdAt: {
    type: Number,
    default: Date.now
  },
  // 社会化登录类型
  socialType: {
    type: String,
    default: 'email'
  },
  verificationCode: {
    code: String,
    expires: Date
  },
  oauth: {
    github: {
      id: String,
      username: String,
      accessToken: String
    },
    google: {
      id: String,
      email: String,
      accessToken: String
    },
    linuxdo: {
      id: String,
      email: String,
      accessToken: String
    }
  }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

// 生成验证码方法
userSchema.methods.generateVerificationCode = function () {
  // 生成包含数字和大写字母的字符集
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  // 生成6位随机验证码
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }
  this.verificationCode = {
    code,
    expires: new Date(Date.now() + 5 * 60 * 1000) // 5分钟有效期
  }
  return code
}

// 验证码验证方法
userSchema.methods.verifyCode = function (code) {
  if (!this.verificationCode || !this.verificationCode.code) {
    return false
  }
  if (this.verificationCode.expires < new Date()) {
    return false
  }
  return this.verificationCode.code === code
}

export const User = mongoose.model('User', userSchema) 