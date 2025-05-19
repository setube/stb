import mongoose from 'mongoose'

const configSchema = new mongoose.Schema({
  // 网站配置
  site: {
    // 网站标题
    title: {
      type: String,
      default: 'Stb 图床'
    },
    // 网站url
    url: {
      type: String,
      default: ''
    },
    // 验证码
    captcha: {
      type: Boolean,
      default: false
    },
    // 是否开启注册
    register: {
      type: Boolean,
      default: false
    }
  },
  upload: {
    allowedFormats: {
      type: [String],
      default: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    },
    maxSize: {
      type: Number,  // 单位：MB
      default: 5
    },
    minWidth: {
      type: Number,
      default: 0
    },
    minHeight: {
      type: Number,
      default: 0
    },
    maxWidth: {
      type: Number,
      default: 0
    },
    maxHeight: {
      type: Number,
      default: 0
    },
    convertFormat: {
      type: String,
      default: ''  // 空字符串表示不转换
    },
    quality: {
      type: Number,
      default: 80
    },
    dailyLimit: {
      type: Number,
      default: 100
    }
  },
  watermark: {
    enabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['text', 'image'],
      default: 'text'
    },
    text: {
      content: {
        type: String,
        default: ''
      },
      fontSize: {
        type: Number,
        default: 24
      },
      color: {
        type: String,
        default: '#000000'
      },
      position: {
        type: String,
        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
        default: 'bottom-right'
      }
    },
    image: {
      path: {
        type: String,
        default: ''
      },
      opacity: {
        type: Number,
        default: 0.5
      },
      position: {
        type: String,
        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
        default: 'bottom-right'
      }
    }
  },
  ip: {
    enabled: {
      type: Boolean,
      default: false
    },
    whitelistEnabled: {
      type: Boolean,
      default: false
    },
    blacklistEnabled: {
      type: Boolean,
      default: false
    },
    whitelist: {
      type: [String],
      default: []
    },
    blacklist: {
      type: [String],
      default: []
    }
  }
}, { timestamps: true })

// 确保至少有一个配置文档
configSchema.statics.initialize = async function () {
  const count = await this.countDocuments()
  if (count === 0) {
    await this.create({})
  }
}

const Config = mongoose.model('Config', configSchema)

export { Config } 