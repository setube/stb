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
      default: true
    },
    // 是否开启游客上传
    anonymousUpload: {
      type: Boolean,
      default: false
    },
    // 是否API文档页面
    api: {
      type: Boolean,
      default: false
    },
  },
  upload: {
    allowedFormats: {
      type: [String],
      default: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    },
    // 同时上传数量
    concurrentUploads: {
      type: Number,
      default: 10
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
      enum: ['', 'jpeg', 'jpg', 'png', 'webp', 'gif'],
      default: ''
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
    namingRule: {
      type: String,
      default: '{Ymd}/{uniqid}.{ext}'  // 默认规则：年月日/唯一ID.扩展名
    },
    // 上传目录
    path: {
      type: String,
      default: 'uploads'
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
    blacklist: {
      type: [String],
      default: []
    }
  },
  // 存储配置
  storage: {
    type: {
      type: String,
      enum: ['local', 'oss', 'cos', 'r2', 's3', 'qiniu', 'upyun', 'sftp', 'ftp', 'webdav', 'telegram'],
      default: 'local'
    },
    // 本地存储
    local: {
      path: {
        type: String,
        default: '/'
      }
    },
    // 阿里oss
    oss: {
      // 阿里云账号的AccessKey ID
      accessKeyId: {
        type: String,
        default: ''
      },
      // 阿里云账号的AccessKey Secret
      accessKeySecret: {
        type: String,
        default: ''
      },
      // Bucket名称
      bucket: {
        type: String,
        default: ''
      },
      // Bucket所在地域
      region: {
        type: String,
        default: ''
      },
      // 外网传输加速域名
      endpoint: {
        type: String,
        default: ''
      },
      // 内网传输加速域名
      internal: {
        type: String,
        default: ''
      },
      isCname: {
        type: Boolean,
        default: false
      },
      // 存储目录
      path: {
        type: String,
        default: '/'
      }
    },
    // 腾讯云cos
    cos: {
      // 腾讯云账号的SecretId
      secretId: {
        type: String,
        default: ''
      },
      // 腾讯云账号的SecretKey
      secretKey: {
        type: String,
        default: ''
      },
      // Bucket名称
      bucket: {
        type: String,
        default: ''
      },
      // Bucket所在地域
      region: {
        type: String,
        default: ''
      },
      // 存储目录
      filePath: {
        type: String,
        default: '/'
      },
    },
    // AWS S3 配置
    s3: {
      accessKeyId: {
        type: String,
        default: ''
      },
      secretAccessKey: {
        type: String,
        default: ''
      },
      bucket: {
        type: String,
        default: ''
      },
      region: {
        type: String,
        default: ''
      },
      endpoint: {
        type: String,
        default: ''
      },
      directory: {
        type: String,
        default: 'uploads'
      }
    },
    // Cloudflare R2 配置
    r2: {
      accountId: {
        type: String,
        default: ''
      },
      accessKeyId: {
        type: String,
        default: ''
      },
      secretAccessKey: {
        type: String,
        default: ''
      },
      bucket: {
        type: String,
        default: ''
      },
      publicUrl: {
        type: String,
        default: ''
      },
      directory: {
        type: String,
        default: 'uploads'
      }
    },
    // 七牛云
    qiniu: {
      accessKey: {
        type: String,
        default: ''
      },
      secretKey: {
        type: String,
        default: ''
      },
      bucket: {
        type: String,
        default: ''
      },
      domain: {
        type: String,
        default: ''
      }
    },
    // 又拍云
    upyun: {
      service: {  // 服务名称
        type: String,
        default: ''
      },
      operator: {  // 操作员
        type: String,
        default: ''
      },
      password: {  // 操作员密码
        type: String,
        default: ''
      },
      domain: {  // 访问域名
        type: String,
        default: ''
      },
      directory: {  // 存储目录
        type: String,
        default: 'uploads'
      }
    },
    // SFTP 配置
    sftp: {
      host: {  // 主机地址
        type: String,
        default: ''
      },
      port: {  // 端口
        type: Number,
        default: 22
      },
      username: {  // 用户名
        type: String,
        default: ''
      },
      password: {  // 密码
        type: String,
        default: ''
      },
      connectTimeout: {  // 连接超时时间(毫秒)
        type: Number,
        default: 10
      },
      retries: {  // 连接最大尝试次数
        type: Number,
        default: 4
      },
      useSSH: {  // 是否使用SSH密钥认证
        type: Boolean,
        default: false
      },
      privateKey: {  // 私钥
        type: String,
        default: ''
      },
      passphrase: {  // 私钥口令
        type: String,
        default: ''
      },
      hostFingerprint: {  // 主机指纹
        type: String,
        default: ''
      },
      domain: {  // 访问域名
        type: String,
        default: ''
      },
      directory: {  // 存储目录
        type: String,
        default: 'uploads'
      }
    },
    // FTP 配置
    ftp: {
      host: {  // 主机地址
        type: String,
        default: ''
      },
      port: {  // 端口
        type: Number,
        default: 21
      },
      username: {  // 用户名
        type: String,
        default: ''
      },
      password: {  // 密码
        type: String,
        default: ''
      },
      transferMode: {  // 传输模式 (binary/ascii)
        type: String,
        default: 'binary'
      },
      connectTimeout: {  // 连接超时时间
        type: Number,
        default: 90
      },
      passive: {  // 是否使用被动模式
        type: Boolean,
        default: false
      },
      secure: {  // 是否使用 SSL 连接
        type: Boolean,
        default: false
      },
      ignorePassiveIP: {  // 是否忽略被动模式下的远程 IP 地址
        type: Boolean,
        default: false
      },
      useUnixTimestamp: {  // 是否启用 Unix 时间戳
        type: Boolean,
        default: false
      },
      useUTF8: {  // 是否启用 UTF-8 编码
        type: Boolean,
        default: false
      },
      recursive: {  // 是否手动递归
        type: Boolean,
        default: false
      },
      domain: {  // 访问域名
        type: String,
        default: ''
      },
      directory: {  // 存储目录
        type: String,
        default: 'uploads'
      }
    },
    // WebDAV 配置
    webdav: {
      directory: {  // 存储目录
        type: String,
        default: 'uploads'
      },
      url: {  // 连接地址
        type: String,
        default: ''
      },
      authType: {  // 认证方式 (basic/digest)
        type: String,
        default: 'auto'
      },
      username: {  // 用户名
        type: String,
        default: ''
      },
      password: {  // 密码
        type: String,
        default: ''
      },
      domain: {  // 访问域名
        type: String,
        default: ''
      }
    },
    // Telegram 配置
    telegram: {
      botToken: {  // Bot Token
        type: String,
        default: ''
      },
      chatId: {  // 目标聊天ID
        type: String,
        default: ''
      },
      proxy: {  // 代理地址
        type: String,
        default: ''
      },
      polling: { // 是否轮询
        type: Boolean,
        default: false
      },
      timeout: { // 超时时间
        type: Number,
        default: 30
      }
    },
    // GitHub 配置
    github: {
      token: { // GitHub 个人访问令牌
        type: String,
        default: ''
      },
      owner: { // 仓库所有者
        type: String,
        default: ''
      },
      repo: { // 仓库名称
        type: String,
        default: ''
      },
      branch: { // 分支名称
        type: String,
        default: 'main'
      },
      directory: { // 存储目录
        type: String,
        default: 'uploads'
      },
      timeout: { // 超时时间
        type: Number,
        default: 30
      },
      retries: { // 重试次数
        type: Number,
        default: 3
      },
      retryAfter: { // 重试间隔时间
        type: Number,
        default: 5
      },
      customDomain: { // 是否自定义域名
        type: Boolean,
        default: false
      },
      isGithubPages: { // 是否Github Pages
        type: Boolean,
        default: false
      },
      githubPages: { // Github Pages
        type: String,
        default: ''
      },
      domain: { // 访问域名
        type: String,
        default: ''
      }
    }
  },
  // 鉴黄配置
  ai: {
    enabled: {
      type: Boolean,
      default: false
    },
    // 是否开启自动拉黑
    autoBlack: {
      type: Boolean,
      default: false
    },
    // 审核动作
    action: {
      type: String,
      // 标记为不健康或者直接删除
      enum: ['reject', 'mark'],
      default: 'reject'
    },
    // 审核类型
    type: {
      type: String,
      enum: ['tencent', 'aliyun', 'nsfwjs', 'moderatecontent'],
      default: 'tencent'
    },
    // 腾讯云
    tencent: {
      secretId: {
        type: String,
        default: ''
      },
      secretKey: {
        type: String,
        default: ''
      },
      region: {
        type: String,
        default: 'ap-guangzhou'
      },
      endpoint: {
        type: String,
        default: 'ims.tencentcloudapi.com'
      },
      bizType: {
        type: String,
        default: ''
      }
    },
    // 阿里云
    aliyun: {
      accessKeyId: {
        type: String,
        default: ''
      },
      accessKeySecret: {
        type: String,
        default: ''
      },
      region: {
        type: String,
        default: ''
      },
      // 检测 Service
      service: {
        type: String,
        default: 'baselineCheck'
      },
      // 阈值
      threshold: {
        type: Number,
        default: 50
      }
    },
    // NsfwJs
    nsfwjs: {
      // 接口地址
      apiUrl: {
        type: String,
        default: ''
      },
      // 阈值
      threshold: {
        type: Number,
        default: 60
      }
    }
  },
  smtp: {
    // 发件人邮箱地址
    from: {
      type: String,
      default: ''
    },
    // 发件人名称
    fromName: {
      type: String,
      default: ''
    },
    // SMTP 服务器地址
    host: {
      type: String,
      default: ''
    },
    // SMTP 服务器端口
    port: {
      type: Number,
      default: 465
    },
    // SMTP 加密方式 (none, ssl, tls)
    secure: {
      type: String,
      enum: ['none', 'ssl', 'tls'],
      default: 'ssl'
    },
    // SMTP 用户名
    username: {
      type: String,
      default: ''
    },
    // SMTP 密码
    password: {
      type: String,
      default: ''
    },
    // 是否启用
    enabled: {
      type: Boolean,
      default: false
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