import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema({
  // 原文件名
  name: {
    type: String,
    required: true
  },
  // 现文件名
  filename: {
    type: String,
    required: true
  },
  // 缩略图链接
  thumb: {
    type: String
  },
  // 原图链接
  url: {
    type: String,
    required: true
  },
  // 图片健康状态
  safe: {
    type: String,
    required: true,
    default: 'Pass'
  },
  label: {
    type: String,
    required: true,
    default: 'Normal'
  },
  md5: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  sha1: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: false
  },
  // 关联的相册 (如果图片属于某个相册)
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    default: null
  },
  // 图片标签
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  // 添加备注字段
  remarks: {
    type: String
  }
}, { timestamps: true })

// 优化搜索
imageSchema.index({ name: 'text', md5: 'text', sha1: 'text', remarks: 'text', tags: 'text' })
imageSchema.index({ user: 1, date: -1 })
imageSchema.index({ album: 1, date: -1 })
imageSchema.index({ tags: 1 })

export const Image = mongoose.model('Image', imageSchema) 