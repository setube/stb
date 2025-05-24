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
    required: true
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
}, { timestamps: true })

export const Image = mongoose.model('Image', imageSchema) 