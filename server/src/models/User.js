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
    required: true,
    unique: true
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
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  // 最后登录时间
  lastLogin: {
    type: Number,
    default: Date.now
  },
  // 注册时间
  createdAt: {
    type: Number,
    default: Date.now
  }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export const User = mongoose.model('User', userSchema) 