<div align="center">

# Stb图床 - 现代化图片托管解决方案
[![Stb GitHub's stars](https://img.shields.io/github/stars/setube/stb?style=social)](https://github.com/setube/stb/stargazers)
[![Stb GitHub's forks](https://img.shields.io/github/forks/setube/stb?style=social)](https://github.com/setube/stb/network/members)
[![Stb is released under the Apache 2.0 license.](https://img.shields.io/badge/License-Apache%202.0-blue)](/LICENSE)

[安装图床](https://github.com/setube/stb/wiki/install) • [界面展示](#界面展示) • [星标趋势](#星标趋势) • [开源协议](#开源协议)
</div>

> [!TIP]\
> 如果上传者的IP获取不准确, 请在Nginx配置文件中添加以下配置
> ```nginx
> proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
> proxy_set_header X-Real-IP $remote_addr;
> ```

## 特点
* [x] 支持设置图片质量
* [x] 支持压缩图片大小
* [x] 支持文字/图片水印
* [x] 支持设置图片指定宽/高
* [x] 支持上传图片转换为指定格式
* [x] 支持限制最低宽度/高度上传
* [x] 支持上传其他文件格式
* [x] 在线管理图片
* [x] 支持游客上传
* [x] 支持关闭注册
* [x] 支持图片缩略图
* [x] 支持上传第三方存储
* [x] 支持上传图片时鉴黄 

## 已支持以下第三方存储
* [x] Telegram
* [x] Github
* [x] 阿里云OSS
* [x] 腾讯云COS
* [x] AWS S3
* [x] Cloudflare R2
* [x] 七牛云 Kodo
* [x] 又拍云 USS
* [x] SFTP
* [x] FTP
* [x] WebDAV


## 界面展示
 ![Stb图床 - 上传界面](./docs/1.png)
 ![Stb图床 - 广场界面](./docs/2.png)
 ![Stb图床 - 统计界面](./docs/3.png)
 ![Stb图床 - 用户管理](./docs/4.png)
 ![Stb图床 - 图片管理](./docs/5.png)
 ![Stb图床 - 设置管理](./docs/6.png)
 ![Stb图床 - 登录界面](./docs/7.png)
 ![Stb图床 - 注册界面](./docs/8.png)

## 星标趋势

如果你觉得 Stb 对你有帮助，欢迎点击右上角 ⭐Star 支持我们，让更多人了解和使用这个项目。

<img src="https://api.star-history.com/svg?repos=setube/stb&type=Date" />

## 开源协议

Stb 遵循 [Apache-2.0](https://opensource.org/license/apache-2-0) 协议进行分发和使用，更多详情请参见[协议文件](/LICENSE)。