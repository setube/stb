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