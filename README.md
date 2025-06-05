<div align="center">

# Stb 图床 - 现代化图片托管解决方案

[![Stb GitHub's stars](https://img.shields.io/github/stars/setube/stb?style=social)](https://github.com/setube/stb/stargazers)
[![Stb GitHub's forks](https://img.shields.io/github/forks/setube/stb?style=social)](https://github.com/setube/stb/network/members)
[![Stb is released under the Apache 2.0 license.](https://img.shields.io/badge/License-Apache%202.0-blue)](/LICENSE)

[安装图床](https://github.com/setube/stb/wiki/install) • [界面展示](#界面展示) • [星标趋势](#星标趋势) • [开源协议](#开源协议)

</div>

> [!TIP]\
> 如果上传者的 IP 获取不准确, 请在 Nginx 配置文件中添加以下配置
>
> ```nginx
> proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
> proxy_set_header X-Real-IP $remote_addr;
> ```

## 特点

- [x] 支持图片广场、广场开关
- [x] 支持设置图片质量
- [x] 支持压缩图片大小
- [x] 支持文字、图片水印
- [x] 支持设置图片指定宽、高
- [x] 支持上传图片转换为指定格式
- [x] 支持限制最低宽度、高度上传
- [x] 支持游客上传
- [x] 支持关闭注册、邀请码注册
- [x] 支持图片缩略图
- [x] 支持网站统计
- [x] 支持上传第三方存储
- [x] 支持图片鉴黄
- [x] 支持查看上传日志
- [x] 支持上传 IP 黑名单
- [x] 支持限制日上传次数
- [x] 支持管理、创建、修改、删除相册
- [x] 支持通过接口上传、管理图片、管理全站
- [x] 支持第三方社会化登录

## 已支持以下第三方存储

- [x] Telegram
- [x] Github
- [x] 阿里云 OSS
- [x] 腾讯云 COS
- [x] AWS S3
- [x] Cloudflare R2
- [x] 七牛云 Kodo
- [x] 又拍云 USS
- [x] SFTP
- [x] FTP
- [x] WebDAV

## 界面展示

![Stb图床 - 上传页面](./docs/1.jpg)
![Stb图床 - 我的页面](./docs/2.jpg)
![Stb图床 - 广场页面](./docs/3.jpg)
![Stb图床 - 文档页面](./docs/4.jpg)
![Stb图床 - 统计页面](./docs/5.jpg)
![Stb图床 - 日志管理](./docs/6.jpg)
![Stb图床 - 用户管理](./docs/7.jpg)
![Stb图床 - 图片管理](./docs/8.jpg)
![Stb图床 - 相册管理](./docs/9.jpg)
![Stb图床 - 邀请码管理](./docs/10.jpg)
![Stb图床 - 系统配置](./docs/11.jpg)
![Stb图床 - 登录页面](./docs/12.jpg)
![Stb图床 - 注册页面](./docs/13.jpg)
![Stb图床 - 找回密码页面](./docs/14.jpg)
![Stb图床 - 用户个人主页](./docs/15.jpg)
![Stb图床 - 用户相册详细界面](./docs/16.jpg)
![Stb图床 - 个人设置界面](./docs/17.jpg)

## 星标趋势

如果你觉得 Stb 对你有帮助，欢迎点击右上角 ⭐Star 支持我们，让更多人了解和使用这个项目。

<img src="https://api.star-history.com/svg?repos=setube/stb&type=Date" />

## 开源协议

Stb 遵循 [Apache-2.0](https://opensource.org/license/apache-2-0) 协议进行分发和使用，更多详情请参见[协议文件](/LICENSE)。
