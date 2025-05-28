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
    type: String,
    required: true
  },
  // 原图链接
  url: {
    type: String,
    required: true
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
}, { timestamps: true })

export const Image = mongoose.model('Image', imageSchema) 