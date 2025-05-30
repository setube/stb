export const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 图片所属存储类型
export const imageStoreType = {
  local: '本地存储',
  oss: '阿里云OSS',
  cos: '腾讯云COS',
  s3: 'AWS S3',
  r2: 'Cloudflare R2',
  qiniu: '七牛云 Kodo',
  upyun: '又拍云 USS',
  sftp: 'SFTP',
  ftp: 'FTP',
  webdav: 'WebDAV',
  telegram: 'Telegram',
  github: 'GitHub',
  get: (key) => imageStoreType[key] ?? '本地存储'
}

// 图片健康状态
export const imageHealthStatus = {
  Block: {
    color: 'red',
    text: '建议屏蔽'
  },
  Review: {
    color:'orange',
    text: '建议人工审核'
  },
  Pass: {
    color:'green',
    text: '建议通过'
  },
  high: {
    color:'red',
    text: '高风险'
  },
  medium: {
    color:'orange',
    text: '中风险'
  },
  low: {
    color:'green',
    text: '低风险'
  },
  none: {
    color:'gray',
    text: '无风险'
  }
}

// 图片检测结果
export const imageCheckResult = {
  Porn: {
    color:'red',
    text: '色情'
  },
  Ad: {
    color:'red',
    text: '广告'
  },
  Abuse: {
    color:'red',
    text: '暴力'
  },
  Normal: {
    color:'green',
    text: '正常'
  },
  unsafe: {
    color:'red',
    text: '不安全'
  },
  safe: {
    color:'green',
    text: '安全'
  }
}