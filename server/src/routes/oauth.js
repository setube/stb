import express from 'express'
import passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { User } from '../models/User.js'
import { Config } from '../models/Config.js'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

const router = express.Router()

// OAuth 策略配置
const oauthStrategies = {
  github: {
    Strategy: GitHubStrategy,
    scope: ['user:email'],
    profileFields: {
      id: 'id',
      username: 'username',
      email: 'emails[0].value'
    }
  }
}

// 存储临时的绑定 token
const bindTokens = new Map()

// 初始化 OAuth 策略
const initOAuthStrategy = async type => {
  try {
    const { oauth, site } = await Config.findOne()
    const { clientId, clientSecret, callbackUrl } = oauth[type]
    if (!oauth.enabled || !clientId || !clientSecret) {
      return false
    }
    if (type === 'google') {
      const oauth2Client = new OAuth2Client({
        clientId,
        clientSecret,
        redirectUri: `${site.url}${callbackUrl}`
      })
      // 存储 oauth2Client 以便在回调中使用
      bindTokens.set('google_oauth2_client', oauth2Client)
      return true
    }
    if (type === 'linuxdo') {
      // 存储配置信息以便在回调中使用
      bindTokens.set('linuxdo_config', {
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: `${site.url}${callbackUrl}`,
        authorizationEndpoint: 'https://connect.linux.do/oauth2/authorize',
        tokenEndpoint: 'https://connect.linux.do/oauth2/token',
        userInfoEndpoint: 'https://connect.linux.do/api/user',
        scope: 'user:profile'
      })
      return true
    }
    const strategy = oauthStrategies[type]
    const { Strategy, scope, profileFields } = strategy
    // 移除已存在的策略（如果存在）
    if (passport._strategies[type]) {
      passport.unuse(type)
    }
    passport.use(
      type,
      new Strategy(
        {
          clientID: clientId,
          clientSecret: clientSecret,
          callbackURL: `${site.url}${callbackUrl}`,
          scope,
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            // 添加更详细的错误处理
            if (!accessToken) {
              return done(new Error('未获取到访问令牌'))
            }
            if (!profile || !profile.id) {
              return done(new Error('未获取到用户信息'))
            }
            const { id, username, email } = profileFields
            const profileData = {
              id: profile[id],
              username: profile[username],
              email: profile[email]
            }
            // 检查 state 是否是 JWT token
            if (req.query.state && req.query.state.startsWith('eyJ')) {
              return await handleBind(type, profileData, accessToken, req.query.state, done)
            } else {
              // 如果是普通登录，直接处理登录流程
              try {
                const user = await handleLogin(type, profileData, accessToken)
                return done(null, user)
              } catch (error) {
                return done(error)
              }
            }
          } catch (error) {
            return done(error)
          }
        }
      )
    )
    return true
  } catch (error) {
    return false
  }
}

// 登录路由
router.get('/:type', async (req, res, next) => {
  const { type } = req.params
  try {
    const { oauth } = await Config.findOne()
    // 检查社会化登录功能是否开启
    if (!oauth.enabled) {
      return res.status(400).json({ error: '社会化登录功能未开启' })
    }
    // 检查特定类型的登录是否开启
    if (!oauth[type]?.enabled) {
      return res.status(400).json({ error: `${type} 登录功能未开启` })
    }
    if (!oauthStrategies[type] && type !== 'google' && type !== 'linuxdo') {
      return res.status(400).json({ error: '不支持的 OAuth 类型' })
    }
    const initialized = await initOAuthStrategy(type)
    if (!initialized) {
      return res.status(400).json({ error: 'OAuth 未正确配置' })
    }
    if (type === 'google') {
      const oauth2Client = bindTokens.get('google_oauth2_client')
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email', 'openid'],
        state: req.query.bindToken,
        prompt: 'consent'
      })
      res.redirect(authUrl)
    } else if (type === 'linuxdo') {
      const config = bindTokens.get('linuxdo_config')
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scope,
        state: req.query.bindToken || ''
      })
      res.redirect(`${config.authorizationEndpoint}?${params.toString()}`)
    } else {
      passport.authenticate(type, {
        scope: oauthStrategies[type].scope,
        passReqToCallback: true,
        state: req.query.bindToken || req.query.redirectUrl
      })(req, res, next)
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// 回调路由
router.get('/:type/callback', async (req, res, next) => {
  const { type } = req.params
  if (type === 'github') {
    try {
      // 初始化 GitHub 策略
      const initialized = await initOAuthStrategy(type)
      if (!initialized) {
        return res.status(400).json({ error: 'GitHub OAuth 未正确配置' })
      }
      // 使用 passport 处理认证
      passport.authenticate(
        type,
        {
          session: false,
          passReqToCallback: true
        },
        async (err, result, info) => {
          if (err) {
            return res.status(500).json({ error: err.message })
          }
          if (!result) {
            return res.status(400).json({ error: '未获取到用户信息' })
          }
          // 检查是否是绑定操作
          if (req.query.state && req.query.state.startsWith('eyJ')) {
            try {
              const decoded = jwt.verify(req.query.state, process.env.JWT_SECRET)
              return res.redirect(decoded.redirectUrl)
            } catch (error) {
              return res.status(500).json({ error: error.message })
            }
          } else {
            // 处理登录操作
            try {
              // 直接使用 result 中的用户信息，不需要再次调用 handleLogin
              const loginToken = jwt.sign({ userId: result.user._id, role: result.user.role }, process.env.JWT_SECRET)
              const redirectUrl = req.query.state || '/'
              const redirectParams = new URLSearchParams({
                token: loginToken
              }).toString()
              return res.redirect(`${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}${redirectParams}`)
            } catch ({ message }) {
              return res.status(500).json({ error: message })
            }
          }
        }
      )(req, res, next)
    } catch ({ message }) {
      res.status(500).json({ error: message })
    }
  } else if (type === 'google') {
    try {
      const oauth2Client = bindTokens.get('google_oauth2_client')
      const { tokens } = await oauth2Client.getToken(req.query.code)
      // 获取用户信息
      let profile
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: oauth2Client._clientId
      })
      profile = ticket.getPayload()
      const profileData = {
        id: profile.sub || profile.id,
        username: profile.name || profile.username,
        email: profile.email
      }
      if (req.query.state && req.query.state.startsWith('eyJ')) {
        try {
          const decoded = jwt.verify(req.query.state, process.env.JWT_SECRET)
          const userId = decoded.id
          const user = await User.findById(userId)
          if (!user) {
            return res.status(404).json({ error: '用户不存在' })
          }
          // 检查是否已被其他账号绑定
          const existingUser = await User.findOne({ [`oauth.${type}.id`]: profileData.id })
          if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(400).json({ error: '该账号已被其他用户绑定' })
          }
          // 更新用户的 OAuth 信息
          user.oauth[type] = {
            id: profileData.id,
            username: profileData.username,
            email: profileData.email,
            accessToken: tokens.access_token
          }
          await user.save()
          return res.redirect(decoded.redirectUrl)
        } catch ({ message }) {
          return res.status(500).json({ error: message })
        }
      } else {
        // 处理登录操作
        try {
          const result = await handleLogin(type, profileData, tokens.access_token)
          if (result.needRegister) {
            return res.redirect('/register?oauth=true')
          }
          const redirectUrl = req.query.state || '/'
          const redirectParams = new URLSearchParams({
            token: jwt.sign({ userId: result.user._id, role: result.user.role }, process.env.JWT_SECRET)
          }).toString()
          return res.redirect(`${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}${redirectParams}`)
        } catch ({ message }) {
          return res.status(500).json({ error: message })
        }
      }
    } catch ({ message }) {
      res.status(500).json({ error: message })
    }
  } else if (type === 'linuxdo') {
    try {
      const config = bindTokens.get('linuxdo_config')
      // 获取访问令牌
      const tokenResponse = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: req.query.code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri
        })
      })
      if (!tokenResponse.ok) {
        throw new Error(`获取访问令牌失败: ${tokenResponse.status} ${tokenResponse.statusText}`)
      }
      const tokens = await tokenResponse.json()
      // 获取用户信息
      const userInfoResponse = await fetch(config.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      if (!userInfoResponse.ok) {
        throw new Error(`获取用户信息失败: ${userInfoResponse.status} ${userInfoResponse.statusText}`)
      }
      const profile = await userInfoResponse.json()
      // 根据 Linux.do 的用户信息格式调整字段映射
      const profileData = {
        id: profile.id || profile.sub,
        username: profile.username || profile.name,
        email: profile.email
      }
      if (req.query.state && req.query.state.startsWith('eyJ')) {
        try {
          const decoded = jwt.verify(req.query.state, process.env.JWT_SECRET)
          const userId = decoded.id
          const user = await User.findById(userId)
          if (!user) {
            return res.status(404).json({ error: '用户不存在' })
          }
          // 检查是否已被其他账号绑定
          const existingUser = await User.findOne({ [`oauth.${type}.id`]: profileData.id })
          if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(400).json({ error: '该账号已被其他用户绑定' })
          }
          // 更新用户的 OAuth 信息
          user.oauth[type] = {
            id: profileData.id,
            username: profileData.username,
            email: profileData.email,
            accessToken: tokens.access_token
          }
          await user.save()
          return res.redirect(decoded.redirectUrl)
        } catch (error) {
          return res.status(500).json({ error: error.message })
        }
      } else {
        // 处理登录操作
        try {
          const result = await handleLogin(type, profileData, tokens.access_token)
          if (result.needRegister) {
            return res.redirect('/register?oauth=true')
          }
          const loginToken = jwt.sign({ userId: result.user._id, role: result.user.role }, process.env.JWT_SECRET)
          const redirectUrl = req.query.state || '/'
          const redirectParams = new URLSearchParams({
            token: loginToken
          }).toString()
          return res.redirect(`${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}${redirectParams}`)
        } catch (error) {
          return res.status(500).json({ error: error.message })
        }
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  } else {
    return res.status(400).json({ error: '不支持的 OAuth 类型' })
  }
})

// 处理绑定流程
const handleBind = async (type, profile, accessToken, bindToken, done) => {
  try {
    const userId = jwt.verify(bindToken, process.env.JWT_SECRET).id
    const user = await User.findById(userId)
    if (!user) {
      return done(new Error('用户不存在'))
    }
    // 检查是否已被其他账号绑定
    const existingUser = await User.findOne({ [`oauth.${type}.id`]: profile.id })
    if (existingUser && existingUser._id.toString() !== userId) {
      return done(new Error('该账号已被其他用户绑定'))
    }
    // 更新用户的 OAuth 信息
    user.oauth[type] = {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      accessToken
    }
    await user.save()
    return done(null, user)
  } catch (error) {
    return done(error)
  }
}

// 处理登录流程
const handleLogin = async (type, profile, accessToken) => {
  try {
    // 1. 检查是否已存在该第三方账号
    let user = await User.findOne({ [`oauth.${type}.id`]: profile.id })
    if (user) {
      return { user, needRegister: false }
    }
    // 2. 检查是否已存在相同邮箱的账号
    if (profile.email) {
      user = await User.findOne({ email: profile.email })
      if (user) {
        user.oauth[type] = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          accessToken
        }
        await user.save()
        return { user, needRegister: false }
      }
    }
    return {
      needRegister: true,
      oauthData: {
        type,
        id: profile.id,
        username: profile.username,
        email: profile.email,
        accessToken
      }
    }
  } catch (error) {
    throw error
  }
}

// 绑定账号
router.post('/bind', async (req, res) => {
  try {
    const { oauth, site } = await Config.findOne()
    // 检查社会化登录功能是否开启
    if (!oauth.enabled) {
      return res.status(400).json({ error: '社会化登录功能未开启' })
    }
    const { type, userId, redirectUrl } = req.body
    if (!type || !userId) {
      return res.status(400).json({ error: '参数错误' })
    }
    // 检查特定类型的登录是否开启
    if (!oauth[type]?.enabled) {
      return res.status(400).json({ error: `${type} 登录功能未开启` })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    // 将 redirectUrl 编码到 bindToken 中
    const bindToken = jwt.sign(
      {
        id: userId,
        redirectUrl: redirectUrl || '/' // 如果没有提供 redirectUrl，默认重定向到首页
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    )
    res.json({ authUrl: `${site.url}/oauth/${type}?bindToken=${bindToken}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 解绑账号
router.post('/unbind', async (req, res) => {
  try {
    const { oauth } = await Config.findOne()
    // 检查社会化登录功能是否开启
    if (!oauth.enabled) {
      return res.status(400).json({ error: '社会化登录功能未开启' })
    }
    const { type, userId } = req.body
    if (!type || !userId) {
      return res.status(400).json({ error: '参数错误' })
    }
    // 检查特定类型的登录是否开启
    if (!oauth[type]?.enabled) {
      return res.status(400).json({ error: `${type} 登录功能未开启` })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    user.oauth[type] = undefined
    await user.save()
    res.json({ message: '解绑成功' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
