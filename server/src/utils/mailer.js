import nodemailer from 'nodemailer'
import { Config } from '../models/Config.js'

// 创建邮件发送器
const createTransporter = async () => {
  const { smtp } = await Config.findOne()
  // 根据加密方式设置 secure 选项
  const secure = smtp.secure === 'ssl' ? true : false
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: secure,
    auth: {
      user: smtp.username,
      pass: smtp.password
    }
  })
}

// 发送验证码邮件
export const sendVerificationCode = async (email, code, type = 'reset') => {
  try {
    const { smtp, site } = await Config.findOne()
    const transporter = await createTransporter()
    // 根据验证类型设置不同的标题和内容
    const content = {
      reset: '找回密码',
      register: '注册账号',
      email: '修改邮箱'
    }
    const mailOptions = {
      from: `"${smtp.fromName}" <${smtp.from}>`,
      to: email,
      subject: `${content[type]} - ${site.title}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1890ff;">${site.title}</h1>
          </div>
          <h2>验证码</h2>
          <p>您好，您正在${content[type]}，验证码为：</p>
          <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${code}</strong>
          </div>
          <p>验证码有效期为5分钟，请尽快使用。</p>
          <p>如果这不是您的操作，请忽略此邮件。</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© ${new Date().getFullYear()} ${site.title} - ${site.url}</p>
          </div>
        </div>
      `
    }
    await transporter.sendMail(mailOptions)
    return true
  } catch ({ message }) {
    throw new Error(message)
  }
}
