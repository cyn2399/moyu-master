# 墨鱼 master

办公室主题评比与 3D 地点沙盘。包含 React / TypeScript 前端、Node.js 后端、当前前端构建产物和 systemd 用户服务配置。

## 快速启动

需要 Node.js 22 或以上版本，推荐 Node.js 24。

```bash
npm ci
npm run build
npm start
```

访问 http://localhost:3088 。也可以直接运行仓库中的构建产物：

```bash
TZ=Asia/Shanghai PORT=3088 node server/index.mjs
```

后端只使用 Node.js 内置模块；直接运行构建产物无需安装依赖。生产前端由同一个后端提供，不能只部署为静态网页。

## 开发

分别在两个终端执行：

```bash
npm start
npm run dev
```

Vite 开发服务监听 3000，通过 `/api` 代理到后端 3088。

## 功能

- 11 位手机号登录，首次自动生成账号昵称；每场可独立设置或随机生成参赛昵称。
- 主题评比列表、必填报名记录、独立投票、分享链接；仅发起人可删除评比。
- 上午 09:00、下午 14:00 开始，默认 12:00 / 18:00 截止；发起人可自定义截止时间。
- 3D 地点沙盘、用户地点自动关联、藏点增删、公司楼层多选、单层聚焦、缩放和平移。

## 配置与数据

通过环境变量设置 `PORT`（默认 3088）、`DATA_DIR`（默认工作目录下 `data`）、`TZ`（建议 Asia/Shanghai）。`.env.example` 仅为配置参考，服务不会自动读取 `.env`。

`data/state.json` 首次运行时自动创建。账号、设备绑定、手机号索引、评比及选票均保存在这里，需要定期备份。数据、登录凭证、手机号绑定和运行日志不提交 GitHub。仓库保留空库启动行为，不包含线上用户数据。

当前手机号登录不使用密码或短信验证码，不验证号码归属；知道手机号即可登录对应账号。浏览器绑定只能限制同一浏览器，不是物理机器识别。公网正式使用前应接入手机号验证及 HTTPS。

## Linux 常驻部署

把项目放在 `~/moyu-master`，完成构建后执行：

```bash
mkdir -p ~/.config/systemd/user
cp deploy/moyu-master.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now moyu-master
```

需管理员启用用户 linger，才能在退出 SSH 后及开机时常驻：`sudo loginctl enable-linger "$USER"`。

```bash
systemctl --user status moyu-master
journalctl --user -u moyu-master -n 100
```

部署后请使用你自己的服务器地址或域名访问，默认端口为 3088。公网入口需配置 HTTPS 反向代理或端口映射。

## 更新现有服务

保留服务器 `data/`，更新源码并重新构建后重启：

```bash
npm ci
npm run build
systemctl --user restart moyu-master
```

仓库中的 `dist/` 和 `server/data.mjs` 为可直接运行的构建产物；修改源码后需要重新构建并一并提交。
