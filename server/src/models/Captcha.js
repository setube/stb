import mongoose from 'mongoose'

const captchaSchema = new mongoose.Schema({
  verifyValue: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const Captcha = mongoose.model('Captcha', captchaSchema)
