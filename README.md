# 🎯 ParkQuest 踩点助手（网页版）

基于 GitHub Pages 的移动端踩点工具，支持 GPS 定位、AI 剧情生成、拍照上传。

## 🌐 在线访问

部署后访问：`https://你的用户名.github.io/parkquest-survey/`

---

## ✨ 功能特点

| 功能 | 说明 |
|------|------|
| 📍 GPS 定位 | 自动获取当前坐标（精度显示） |
| 🎤 语音输入 | 长按麦克风按钮语音输入 |
| 🤖 AI 共创 | 描述想法，AI 生成完整任务点信息 |
| 📷 拍照打卡 | 调用手机相机拍摄参考图 |
| 💾 本地保存 | 离线保存多个任务点 |
| ☁️ 一键上传 | 批量上传到 LeanCloud 云端 |

---

## 🚀 部署步骤

### 第一步：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写仓库信息：
   - Repository name: `parkquest-survey`
   - Description: `ParkQuest 踩点助手`
   - 选择 **Public**（公开，GitHub Pages 免费版需要公开）
   - ✅ 勾选 **Add a README file**
4. 点击 **Create repository**

### 第二步：上传代码

在本地项目目录执行以下命令：

```bash
# 进入项目目录
cd parkquest-survey

# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: 踩点助手网页版"

# 关联远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/parkquest-survey.git

# 推送到 GitHub
git push -u origin main
```

### 第三步：启用 GitHub Pages

1. 进入 GitHub 仓库页面
2. 点击顶部 **Settings** 标签
3. 左侧菜单选择 **Pages**
4. 在 **Build and deployment** 部分：
   - **Source** 选择 **Deploy from a branch**
   - **Branch** 选择 **main** → **/ (root)**
5. 点击 **Save**
6. 等待 1-2 分钟，页面会显示访问链接：`https://你的用户名.github.io/parkquest-survey/`

---

## ⚙️ 首次使用配置

打开网页后，需要填写以下配置信息：

| 配置项 | 获取方式 |
|--------|----------|
| **LeanCloud AppID** | [LeanCloud 控制台](https://console.leancloud.cn) → 创建应用 → 设置 → AppID |
| **LeanCloud AppKey** | 同上页面获取 AppKey |
| **服务器地址** | 国内用户选 `avoscloud.com`，国际版选 `us.avoscloud.com` |
| **通义千问 API Key** | [阿里云百炼](https://bailian.console.aliyun.com) → API Key 管理 → 创建 |

**配置说明：**
- 所有配置只保存在你的浏览器本地，不会上传到任何地方
- 配置一次后，下次打开网页会自动读取
- 如果需要在其他设备上使用，需要重新配置

---

## 📱 使用流程

1. **打开网页** → 填入配置 → 点击"保存配置"进入主界面
2. **走到任务点** → 等待 GPS 定位成功（显示绿色背景）
3. **AI 共创**（可选）→ 长按麦克风描述想法 → 点击"AI 生成内容"
4. **填写信息** → 可以用语音按钮输入各字段
5. **拍照** → 点击相机区域拍摄参考照片
6. **保存** → 点击"保存到本地"
7. **重复步骤 2-6** → 完成所有任务点
8. **上传** → 点击"一键上传到云端"

---

## 🔒 安全说明

⚠️ **API Key 安全提醒：**

本工具采用 **方案 A（MVP 模式）**，API Key 存储在浏览器本地：

| 风险 | 说明 |
|------|------|
| 风险点 | 如果有人查看你的网页源码，理论上可以获取 Key |
| 实际情况 | Key 只存在你自己的浏览器，别人看不到 |
| 建议措施 | 在千问控制台限制每日调用额度（如 1000 次） |

**后续升级（如需对外发布）：**
- 使用 Cloud Function 中转 API 调用
- Key 存储在服务器端，前端不直接接触
- 需要额外部署后端服务（Vercel/Cloudflare Workers）

---

## 🛠️ 技术栈

| 组件 | 说明 |
|------|------|
| 前端 | 纯 HTML5 + CSS3 + Vanilla JS |
| 托管 | GitHub Pages（免费静态网站托管） |
| 后端 | LeanCloud（国内 BaaS 服务） |
| AI | 阿里通义千问 API（qwen-turbo） |
| 定位 | 浏览器原生 Geolocation API |
| 语音 | 浏览器原生 Web Speech API |

---

## ❓ 常见问题

**Q: GPS 定位不准确？**
A: 请在手机设置中开启高精度定位（同时使用 GPS、WLAN 和移动网络）

**Q: 语音识别不工作？**
A: 部分浏览器不支持 Web Speech API，建议使用 Chrome 或 Safari

**Q: 拍照功能无法使用？**
A: 请确保使用 HTTPS 访问（GitHub Pages 默认支持），并允许相机权限

**Q: 上传到 LeanCloud 失败？**
A: 检查 AppID 和 AppKey 是否正确，以及 LeanCloud 应用的 Class 权限设置

---

## 📝 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 网页结构，包含配置面板和主界面 |
| `style.css` | 样式文件，适配手机屏幕 |
| `app.js` | 功能逻辑，包含 GPS、AI、上传等 |
| `README.md` | 本文档 |

---

## 📄 License

MIT License - 自由使用和修改
