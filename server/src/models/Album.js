import mongoose from 'mongoose'

const albumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  coverImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    default: null
  },
}, { timestamps: true })

// 添加索引以优化查询
albumSchema.index({ user: 1, createdAt: -1 })
albumSchema.index({ user: 1, permission: 1, createdAt: -1 })
albumSchema.index({ tags: 1 })


export const Album = mongoose.model('Album', albumSchema) 