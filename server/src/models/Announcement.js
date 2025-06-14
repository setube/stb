import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['modal', 'alert'],
    default: 'modal'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  nextTime: {
    type: Number,
    required: true,
    default: 1
  },
  effect: {
    type: String,
    enum: ['primary', 'success', 'info', 'warning', 'error'],
    default: 'primary'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 更新时自动更新 updatedAt
announcementSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

export const Announcement = mongoose.model('Announcement', announcementSchema)
