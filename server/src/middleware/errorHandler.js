export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: Object.values(err.errors).map(error => error.message)
    })
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '无效的token'
    })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'token已过期'
    })
  }
  res.status(500).json({
    error: err.message || '服务器内部错误'
  })
}
