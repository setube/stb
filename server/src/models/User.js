import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoleGroup',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active'
    },
    // 最后登录时间
    lastLogin: {
      type: Date,
      default: Date.now
    },
    // 注册时间
    createdAt: {
      type: Number,
      default: Date.now
    },
    // 社会化登录类型
    socialType: {
      type: String,
      default: 'email'
    },
    oauth: {
      github: {
        id: String,
        username: String,
        accessToken: String
      },
      google: {
        id: String,
        email: String,
        accessToken: String
      },
      linuxdo: {
        id: String,
        email: String,
        accessToken: String
      }
    }
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

// 添加迁移方法
userSchema.statics.migrateRoles = async function () {
  try {
    const RoleGroup = mongoose.model('RoleGroup')
    const roleGroups = await RoleGroup.initialize()
    // 获取管理员组和默认用户组
    const adminGroup = roleGroups.find(g => g.isAdmin)
    const userGroup = roleGroups.find(g => g.isDefault)
    if (!adminGroup || !userGroup) {
      throw new Error('必要的角色组不存在')
    }
    // 获取所有用户
    const users = await this.find({})
    let migratedCount = 0
    for (const user of users) {
      try {
        // 检查用户是否有role字段
        if (!user.role) {
          console.log(`用户 ${user.username} 没有角色信息，进行初始化...`)
          if (user.founder) {
            user.role = adminGroup._id
            console.log(`将用户 ${user.username} 分配到管理员组`)
          } else {
            user.role = userGroup._id
            console.log(`将用户 ${user.username} 分配到普通用户组`)
          }
          await user.save()
          migratedCount++
          continue
        }
        // 检查用户是否已经是管理员组或默认用户组的成员
        const isAdminGroup = user.role.toString() === adminGroup._id.toString()
        const isUserGroup = user.role.toString() === userGroup._id.toString()
        if (!isAdminGroup && !isUserGroup) {
          console.log(`迁移用户 ${user.username} 的权限...`)
          if (user.founder) {
            user.role = adminGroup._id
            console.log(`将用户 ${user.username} 分配到管理员组`)
          } else {
            user.role = userGroup._id
            console.log(`将用户 ${user.username} 分配到普通用户组`)
          }
          await user.save()
          migratedCount++
        } else {
          console.log(`用户 ${user.username} 的权限已经是正确的角色组，跳过迁移`)
        }
      } catch (userError) {
        console.error(`处理用户 ${user.username} 时出错:`, userError)
        // 继续处理下一个用户
        continue
      }
    }
    console.log(`成功迁移 ${migratedCount} 个用户的权限`)
  } catch (error) {
    console.error('用户权限迁移失败:', error)
    throw error
  }
}

export const User = mongoose.model('User', userSchema)
