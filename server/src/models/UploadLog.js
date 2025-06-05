import mongoose from 'mongoose'

const uploadLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    ip: {
      type: String,
      required: true
    },
    location: {
      country: String,
      region: String,
      province: String,
      city: String,
      isp: String
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      required: true
    },
    originalName: String,
    size: Number,
    format: String,
    width: Number,
    height: Number,
    md5: {
      type: String,
      required: true
    },
    sha1: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

export const UploadLog = mongoose.model('UploadLog', uploadLogSchema)
