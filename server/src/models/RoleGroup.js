import mongoose from 'mongoose'

const roleGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isGuest: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    maxCapacity: {
      type: Number,
      default: 0
    },
    upload: {
      allowedFormats: {
        type: [String],
        default: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'jp2', 'tiff', 'avif', 'heif', 'jxl', 'raw']
      },
      // 同时上传数量
      concurrentUploads: {
        type: Number,
        default: 10
      },
      maxSize: {
        type: Number, // 单位：MB
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
        enum: ['', 'jpeg', 'jpg', 'png', 'webp', 'gif', 'jp2', 'tiff', 'avif', 'heif', 'jxl', 'raw'],
        default: ''
      },
      qualityOpen: {
        type: Boolean,
        default: false
      },
      quality: {
        type: Number,
        min: 1,
        max: 100,
        default: 80
      },
      dailyLimit: {
        type: Number,
        default: 100
      },
      catalogue: {
        type: String,
        default: '{Y}/{m}/{d}' // 默认规则：年/月/日
      },
      namingRule: {
        type: String,
        default: '{uniqid}.{ext}' // 默认规则：唯一ID.扩展名
      },
      storageType: {
        type: String,
        enum: ['local', 'oss', 'cos', 's3', 'qiniu', 'upyun', 'sftp', 'ftp', 'webdav', 'telegram', 'github'],
        default: 'local'
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
      tile: {
        type: Boolean,
        default: false
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
        top: {
          type: Number,
          default: 0
        },
        left: {
          type: Number,
          default: 0
        },
        opacity: {
          type: Number,
          default: 0.5
        },
        position: {
          type: String,
          enum: ['northwest', 'northeast', 'southwest', 'southeast', 'north', 'center', 'south'],
          default: 'center'
        }
      },
      image: {
        top: {
          type: Number,
          default: 0
        },
        left: {
          type: Number,
          default: 0
        },
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
          enum: ['northwest', 'northeast', 'southwest', 'southeast', 'north', 'center', 'south'],
          default: 'center'
        }
      }
    }
  },
  { timestamps: true }
)

// 确保只有一个默认组
roleGroupSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isDefault: false } })
  }
  next()
})

// 初始化默认角色组
roleGroupSchema.statics.initialize = async function () {
  try {
    // 获取所有角色组
    const roleGroups = await this.find({})
    // 检查是否存在管理员组、默认用户组和游客组
    const adminGroup = roleGroups.find(g => g.isAdmin)
    const userGroup = roleGroups.find(g => g.isDefault)
    const guestGroup = roleGroups.find(g => g.isGuest)
    if (!adminGroup) {
      console.log('创建管理员组...')
      await this.create({
        name: '管理员',
        description: '系统管理员组',
        isAdmin: true,
        isDefault: false,
        isGuest: false
      })
    }
    if (!userGroup) {
      console.log('创建普通用户组...')
      await this.create({
        name: '普通用户',
        description: '默认用户组',
        isAdmin: false,
        isDefault: true,
        isGuest: false
      })
    }
    if (!guestGroup) {
      console.log('创建游客组...')
      await this.create({
        name: '游客',
        description: '游客用户组',
        isAdmin: false,
        isDefault: false,
        isGuest: true
      })
    }

    // 重新获取所有角色组
    const updatedRoleGroups = await this.find({})
    console.log(
      '最终角色组列表:',
      updatedRoleGroups.map(g => g.name)
    )
    return updatedRoleGroups
  } catch (error) {
    console.error('角色组初始化失败:', error)
    throw error
  }
}

export const RoleGroup = mongoose.model('RoleGroup', roleGroupSchema)
