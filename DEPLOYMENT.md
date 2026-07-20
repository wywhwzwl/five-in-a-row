# 五子棋项目 · GitHub Pages 部署完整指南（PAT 认证）

> 本项目（纯静态 HTML/CSS/JS，零依赖）通过 **GitHub Pages** 部署到公网，
> 并通过 **Personal Access Token (PAT)** 完成 Git 认证推送。
> 全程不依赖第三方托管平台。

---

## 📑 目录

- [一、整体流程总览](#一整体流程总览)
- [二、GitHub 端操作（约 10 分钟）](#二github-端操作约-10-分钟)
  - [2.1 创建 GitHub 仓库](#21-创建-github-仓库)
  - [2.2 生成 Personal Access Token（PAT）](#22-生成-personal-access-tokenpat)
- [三、本地端操作（约 10 分钟）](#三本地端操作约-10-分钟)
  - [3.1 安装并配置 Git](#31-安装并配置-git)
  - [3.2 创建 .gitignore](#32-创建-gitignore)
  - [3.3 创建 README.md](#33-创建-readmemd)
  - [3.4 初始化仓库并提交](#34-初始化仓库并提交)
  - [3.5 配置 PAT 并推送代码](#35-配置-pat-并推送代码)
- [四、启用 GitHub Pages（约 3 分钟）](#四启用-github-pages约-3-分钟)
- [五、绑定自定义域名（约 15 分钟）](#五绑定自定义域名约-15-分钟)
  - [5.1 创建 CNAME 文件](#51-创建-cname-文件)
  - [5.2 在 GitHub 配置自定义域名](#52-在-github-配置自定义域名)
  - [5.3 DNS 解析配置](#53-dns-解析配置)
- [六、强制 HTTPS（约 5 分钟）](#六强制-https约-5-分钟)
- [七、验证部署](#七验证部署)
- [八、常见问题 FAQ](#八常见问题-faq)
- [九、后续更新代码流程](#九后续更新代码流程)
- [十、完整 Checklist](#十完整-checklist)

---

## 一、整体流程总览

```
┌──────────────────────────────────────────────────────────────────┐
│ 阶段一：GitHub 端（账号操作，需登录浏览器）                          │
│   ① 创建 GitHub 仓库                                              │
│   ② 生成 PAT（Personal Access Token）                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 阶段二：本地端（文件操作 + Git 推送）                                │
│   ③ 配置 Git 用户信息                                              │
│   ④ 创建 .gitignore / README.md                                   │
│   ⑤ git init → add → commit                                       │
│   ⑥ 配置远程仓库 + 用 PAT 推送                                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 阶段三：启用 GitHub Pages（GitHub 端设置）                          │
│   ⑦ Settings → Pages → 选择 main 分支 / root 目录                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 阶段四：绑定域名（GitHub + 域名注册商）                             │
│   ⑧ 创建 CNAME 文件并推送                                          │
│   ⑨ 在 GitHub Pages 设置自定义域名                                 │
│   ⑩ 在域名注册商添加 DNS 记录                                      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                        🎉 通过域名访问
```

**预计总耗时**：30 - 60 分钟（含 DNS 等待）

---

## 二、GitHub 端操作（约 10 分钟）

### 2.1 创建 GitHub 仓库

#### 步骤

1. 浏览器登录 https://github.com
2. 右上角 **+** → **New repository**

| 配置项 | 推荐值 |
|--------|-------|
| **Repository name** | `five-in-a-row` |
| **Description** | 五子棋小游戏（HTML/CSS/JS 纯静态实现） |
| **Visibility** | **Public**（公开，GitHub Pages 必需） |
| **Add a README file** | ❌ **不勾选**（本地已有） |
| **Add .gitignore** | ❌ 不勾选（本地创建） |
| **Choose a license** | 可选：MIT |

3. 点击 **Create repository**
4. **复制仓库 URL**（后续要用）：

```
https://github.com/<你的用户名>/five-in-a-row.git
```

> 📌 **记住你的用户名**，例如 `zhangsan`，下文统一用 `<USERNAME>` 代替。

---

### 2.2 生成 Personal Access Token（PAT）

> GitHub 已不再支持密码推送代码，必须使用 PAT 或 SSH Key。
> PAT = 一串字符，等同于"只用于代码操作的临时密码"。

#### 步骤（推荐使用 Fine-grained Token）

1. 登录 GitHub → 点击右上角**头像**
2. **Settings** → 左侧菜单最下方 **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens**
4. 点击 **Generate new token**

| 配置项 | 推荐设置 |
|--------|---------|
| **Token name** | `Five-in-a-Row-Deploy` |
| **Expiration** | `90 days`（90 天，到期前会邮件提醒） |
| **Resource owner** | 选择你自己 |
| **Repository access** | **Only select repositories** → 选中 `five-in-a-row` |

5. **Repository permissions**（仅勾选以下权限）：

| 权限 | 级别 | 说明 |
|------|------|------|
| Contents | ✅ Read and write | 推送代码必需 |
| Metadata | ✅ Read-only（默认） | 自动获取仓库信息 |
| Pages | ✅ Read and write | 可选：管理 Pages |

> ⚠️ **不要**勾选其他权限（最小权限原则）。

6. 点击 **Generate token**
7. ⚠️ **关键步骤**：复制显示的 Token 并保存到密码管理器

```
格式类似：github_pat_11AAAAAAA0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> 🚨 **这个 Token 只显示一次！** 关闭页面后无法再查看，丢失需重新生成。

#### ⚠️ Token 安全守则

| ✅ 应该做 | ❌ 不应该做 |
|---------|----------|
| 存到 1Password / Bitwarden 等密码管理器 | 截图保存到桌面 |
| 设置过期时间（建议 90 天） | 永久不过期 |
| 仅授权单一仓库 | 授权所有仓库 |
| 仅授予必要的权限 | 给完整账户权限 |
| 怀疑泄露时立即撤销 | 怀疑泄露但继续使用 |

---

## 三、本地端操作（约 10 分钟）

> 所有命令都在项目根目录 `f:\VSCode_Projects\Cases\Five-in-a-Row\` 下执行。

### 3.1 安装并配置 Git

#### 检查是否已安装 Git

```bash
git --version
```

如未安装，下载：https://git-scm.com/download/win

#### 配置全局用户信息（首次使用必做）

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
```

> 📌 这里的邮箱**不必**与 GitHub 账号邮箱一致，但建议一致（提交记录会显示头像）。

#### 配置行尾符（Windows 推荐）

```bash
git config --global core.autocrlf false
git config --global core.safecrlf warn
```

#### （推荐）配置 Git 凭据管理器，避免每次输入 Token

```bash
git config --global credential.helper manager
```

执行后，**第一次**推送会要求输入用户名和 Token，之后会自动保存。

---

### 3.2 创建 `.gitignore`

**作用**：排除不需要上传的文件（如 PPT、IDE 配置等）。

在项目根目录创建 `.gitignore` 文件，内容如下：

```gitignore
# ============== 操作系统文件 ==============
.DS_Store
Thumbs.db
desktop.ini
ehthumbs.db
ehthumbs_vista.db

# ============== IDE / 编辑器 ==============
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.settings/

# ============== 构建产物 ==============
node_modules/
dist/
build/
*.min.js
*.min.css

# ============== 日志 ==============
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ============== 项目特定 ==============
# PPT 文件较大，不适合放在 Git 仓库
*.pptx
# Python 临时文件
__pycache__/
*.pyc
*.pyo

# ============== 环境变量 ==============
.env
.env.local
.env.*.local
```

---

### 3.3 创建 `README.md`

**作用**：GitHub 仓库首页展示，提升项目专业度。

在项目根目录创建 `README.md` 文件：

```markdown
# 🎮 五子棋 · Five-in-a-Row

> 纯静态、零依赖的五子棋小游戏，浏览器直接打开即可游玩。

![Made with HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![Made with CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Made with JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

## ✨ 特性

- 🎯 **三档 AI 难度**（V1.0 入门 / V2.0 进阶 / V3.0 大师）
- 🎨 **像素级精美的棋盘渲染**（基于 Canvas）
- ⚖️ **支持禁手规则**（可选）
- 📱 **响应式布局**，适配桌面与移动端
- 🚀 **零依赖**，纯原生 JavaScript ES2020+
- 🌐 **即开即玩**，无需后端

## 🚀 在线试玩

👉 **https://your-domain.com**（待替换为你的域名）

直接打开 `index.html` 也可本地运行。

## 🛠️ 本地运行

```bash
# 方式 1：直接双击 index.html
# 方式 2：使用任意静态文件服务器（推荐）
python -m http.server 8000
# 然后浏览器访问 http://localhost:8000
```

## 📂 项目结构

```
Five-in-a-Row/
├── index.html                          # 入口（HTML 骨架 + CSS + bootstrap 脚本）
├── config.js          (3.3 KB)         # 不可变常量配置（Object.freeze）
├── renderer.js        (12.6 KB)        # Canvas 渲染层（IIFE 模块）
├── gameEngine.js      (12.0 KB)        # 游戏逻辑引擎（落子/胜负/禁手）
├── aiPlayer.js        (10.0 KB)        # AI 对手（V1.0/V2.0/V3.0 三版本）
├── generate_pptx.py                    # 演示文稿生成脚本（可选）
├── DEPLOYMENT.md                       # 部署文档
└── README.md                           # 本文件
```

## 🏗️ 技术架构

- **架构模式**：IIFE 模块 + 订阅者模式 + 不可变状态
- **设计原则**：Vibe Coding Engineer 协议（架构优先 / 像素精确 / 分层解耦）
- **代码规模**：~52 KB（含全部 JS + HTML + CSS）

## 📄 许可证

[MIT](LICENSE) © 2026
```

---

### 3.4 初始化仓库并提交

打开终端，进入项目根目录：

```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row

# 1. 初始化 Git 仓库
git init

# 2. 检查将要提交的文件
git status
```

你应该看到所有项目文件被列出（`.pptx` 应被 `.gitignore` 排除）。

```bash
# 3. 添加所有文件到暂存区
git add .

# 4. 再次检查（确认 .pptx 等已被忽略）
git status
```

```bash
# 5. 首次提交
git commit -m "feat: 初始化五子棋游戏项目

- 实现核心棋盘渲染
- 实现游戏逻辑引擎（落子/胜负判定/禁手）
- 实现三档 AI 对手（V1.0/V2.0/V3.0）
- 实现响应式 UI 布局"

# 6. 重命名分支为 main
git branch -M main
```

---

### 3.5 配置 PAT 并推送代码

#### 步骤 A：添加远程仓库

```bash
git remote add origin https://github.com/<USERNAME>/five-in-a-row.git
```

> 📌 将 `<USERNAME>` 替换为你的 GitHub 用户名。

#### 步骤 B：推送代码（首次会要求输入凭证）

```bash
git push -u origin main
```

#### 步骤 C：输入凭证

终端会弹出提示：

```
Username for 'https://github.com': <输入你的 GitHub 用户名>
Password for 'https://github.com': <粘贴你的 PAT，不是密码！>
```

> ⚠️ **关键**：在 Password 提示处，**粘贴 PAT**（不是 GitHub 登录密码）。
> 如果用 Fine-grained Token，PAT 格式类似 `github_pat_11AAAA...`

#### 步骤 D：验证推送成功

终端应显示类似：

```
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Writing objects: 100% (15/15), 60.00 KiB | 30.00 MiB/s, done.
Total 15 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/<USERNAME>/five-in-a-row.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

刷新 GitHub 仓库页面，应能看到所有代码文件。

---

## 四、启用 GitHub Pages（约 3 分钟）

### 步骤

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings**（顶部菜单）
3. 左侧菜单找到 **Pages**（在 "Code and automation" 分组下）

### 配置

| 配置项 | 推荐设置 |
|--------|---------|
| **Source** | **Deploy from a branch** |
| **Branch** | `main` |
| **Folder** | `/ (root)` |

点击 **Save**。

### 等待部署

- 通常 **1-2 分钟** 完成首次部署
- 刷新页面，会显示：

```
✅ Your site is live at https://<USERNAME>.github.io/five-in-a-row/
```

> 访问该 URL，应能看到你的五子棋游戏。

---

## 五、绑定自定义域名（约 15 分钟）

> 如果不需要自定义域名，可以跳过此章节。

### 5.1 创建 `CNAME` 文件

在项目**根目录**创建名为 `CNAME` 的文件（**注意无后缀**）：

| 域名形式 | CNAME 文件内容 |
|---------|---------------|
| 子域名 `game.yourdomain.com` | `game.yourdomain.com` |
| 根域名 `yourdomain.com` | `yourdomain.com` |
| `www.yourdomain.com` | `www.yourdomain.com` |

**示例 CNAME 文件内容**：

```
game.yourdomain.com
```

> ⚠️ **注意**：
> - 文件**无后缀**（不是 `.txt`）
> - 只写**一行域名**，不要带 `https://`
> - 不要带路径或端口

然后推送到 GitHub：

```bash
git add CNAME
git commit -m "chore: 添加自定义域名 CNAME"
git push
```

---

### 5.2 在 GitHub 配置自定义域名

1. 仓库 → **Settings** → **Pages**
2. **Custom domain** 输入框中填写你的域名：

```
game.yourdomain.com
```

3. 点击 **Save**
4. 等待 **DNS check** 完成（通常 1-15 分钟）

界面会显示状态：

```
✅ DNS check successful
✅ Your site is live at https://game.yourdomain.com
```

如果显示 ⚠️ 警告，说明 DNS 还没生效，继续下一步。

---

### 5.3 DNS 解析配置

#### 场景 A：使用子域名（如 `game.yourdomain.com`）⭐ 推荐

在你的**域名注册商**（Cloudflare / 阿里云 / 腾讯云等）后台，添加：

| 类型 | 主机记录 | 记录值 | TTL |
|------|---------|-------|-----|
| **CNAME** | `game` | `<USERNAME>.github.io.` | 自动/600 |

> ⚠️ 记录值末尾的**点号** `.` 表示完整域名，建议加上（部分注册商不需要）。

#### 场景 B：使用根域名（如 `yourdomain.com`）

GitHub Pages 提供固定的 IP 地址，添加 **A 记录**：

| 类型 | 主机记录 | 记录值 | TTL |
|------|---------|-------|-----|
| A | `@` | `185.199.108.153` | 600 |
| A | `@` | `185.199.109.153` | 600 |
| A | `@` | `185.199.110.153` | 600 |
| A | `@` | `185.199.111.153` | 600 |

**如果想同时支持 `www`**：

| 类型 | 主机记录 | 记录值 | TTL |
|------|---------|-------|-----|
| CNAME | `www` | `<USERNAME>.github.io.` | 自动 |

#### 场景 C：阿里云 / 腾讯云 DNS 配置示例

**阿里云 DNS**：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|-------|
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `<USERNAME>.github.io.` |

**Cloudflare DNS**：

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| A | `@` | `185.199.108.153` | **DNS only**（灰色云朵） |
| A | `@` | `185.199.109.153` | **DNS only** |
| A | `@` | `185.199.110.153` | **DNS only** |
| A | `@` | `185.199.111.153` | **DNS only** |
| CNAME | `www` | `<USERNAME>.github.io.` | **DNS only** |

> 🚨 **Cloudflare 特别注意**：GitHub Pages 必须使用 **DNS only（灰色云朵）**，
> 不能开启 Cloudflare 代理（橙色云朵），否则 GitHub 无法签发 SSL 证书。

---

## 六、强制 HTTPS（约 5 分钟）

### 启用

1. 仓库 → **Settings** → **Pages**
2. 勾选 **Enforce HTTPS**（强制 HTTPS）

### 说明

- ✅ **首次启用**：GitHub 会自动通过 Let's Encrypt 签发证书（**约 1-15 分钟**）
- ✅ **强制 HTTPS**：所有 HTTP 访问自动 301 跳转到 HTTPS
- ✅ **证书自动续期**：到期前 GitHub 自动续签，无需人工干预

### 验证

浏览器访问你的域名，地址栏应显示 🔒 锁图标：

```
https://game.yourdomain.com  ✅
```

---

## 七、验证部署

### 7.1 检查清单

| 检查项 | 验证方法 |
|--------|---------|
| ✅ 默认域名可访问 | 访问 `https://<USERNAME>.github.io/five-in-a-row/` |
| ✅ 自定义域名可访问 | 访问 `https://game.yourdomain.com` |
| ✅ HTTPS 已启用 | 浏览器显示 🔒 锁图标 |
| ✅ 资源加载正常 | F12 → Network 面板无 404 |
| ✅ AI 对战可玩 | 实际玩一局验证 |

### 7.2 DNS 验证命令

打开终端执行：

```bash
# Windows / Mac / Linux 通用
nslookup game.yourdomain.com

# 或使用 dig（更详细，需安装 dnsutils）
dig game.yourdomain.com +short

# 期望返回 GitHub IP 之一：
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153
```

### 7.3 SSL 证书验证

浏览器访问你的域名 → 点击地址栏的 🔒 锁图标 → **Connection is secure** → **Certificate is valid**。

证书签发者应为 **Let's Encrypt** 或 **DigiCert**（GitHub 自动选择）。

---

## 八、常见问题 FAQ

### Q1：推送时提示 `Support for password authentication was removed`

**原因**：GitHub 已全面禁用密码推送，必须使用 PAT。

**解决**：使用本指南的 PAT 方式（参见 [2.2 节](#22-生成-personal-access-tokenpat)）。

---

### Q2：GitHub Pages 显示 `404 - There isn't a GitHub Pages site here`

**排查步骤**：

1. 确认 `index.html` 在仓库**根目录**，不是子目录
2. Settings → Pages → 确认 Branch 选择正确（`main`，folder 为 `/`）
3. 等待 2-3 分钟，刷新页面
4. 检查 Actions 标签页是否有构建失败

---

### Q3：自定义域名显示 `DNS check unsuccessful`

**排查清单**：

- [ ] DNS 记录是否正确（用 `nslookup` 验证）
- [ ] CNAME 记录值是否为 `<USERNAME>.github.io.`
- [ ] A 记录 IP 是否正确（见 [5.3 节](#53-dns-解析配置)）
- [ ] TTL 设置是否已生效（最长等待 48 小时）
- [ ] **Cloudflare 用户**：是否使用了 DNS only（灰色云朵）
- [ ] 域名是否过期

---

### Q4：访问域名提示 `Your connection is not private`（SSL 错误）

**原因**：SSL 证书还没签发完成。

**解决**：

1. 等待 5-15 分钟（首次签发需要时间）
2. Settings → Pages → 取消勾选 **Enforce HTTPS**
3. 等待 10 分钟
4. 重新勾选 **Enforce HTTPS**

---

### Q5：每次推送都要输入 Token 吗？

**答**：使用 `credential.helper` 后只需输入一次。

**配置方法**：

```bash
git config --global credential.helper manager
```

执行后：
- **首次推送**：输入用户名 + Token，Windows 凭据管理器会保存
- **后续推送**：自动读取，无需再输入

> Token 过期或被撤销后需要重新输入。

---

### Q6：忘记保存 PAT 了怎么办？

**答**：重新生成。

1. GitHub → Settings → Developer settings
2. Personal access tokens → 找到旧 Token → **Revoke**（撤销）
3. **Generate new token**
4. 重新配置本地 `credential.helper`

> ⚠️ 撤销后旧 Token 立即失效，所有使用该 Token 的应用会断开连接。

---

### Q7：能部署多个分支吗？

**答**：可以，但只能选择一个作为 Pages 源。

| 场景 | 建议 |
|------|------|
| 主分支 `main` 用于生产环境 | Pages 选 `main` |
| `dev` 分支用于测试 | 用 Vercel Preview 或本地预览 |
| 多个长期分支 | 每个分支独立部署需用 Vercel/Netlify |

---

### Q8：GitHub Pages 流量限制是多少？

| 限制项 | 上限 |
|--------|------|
| 存储 | 1 GB |
| 月流量 | 100 GB |
| 月请求数 | 无明确限制（软限制） |

> 本项目（~52 KB）即使日访问 1 万次，每月流量也仅约 1.5 GB，**完全够用**。

---

### Q9：能绑定多个自定义域名吗？

**答**：可以。

Settings → Pages → Custom domain 添加多个域名（每个域名一行），但 **CNAME 文件只能包含一个**（主域名）。其他域名通过 301 重定向到主域名。

---

### Q10：怎么回退到上一个版本？

```bash
# 查看提交历史
git log --oneline

# 回退到指定版本（不删除历史）
git revert <commit-hash>
git push

# 或硬回退（删除历史，慎用）
git reset --hard <commit-hash>
git push -f
```

GitHub Pages 会在 1-2 分钟内重新部署。

---

## 九、后续更新代码流程

完成首次部署后，日常更新只需 4 步：

```bash
# 1. 修改代码后，查看变更
git status
git diff

# 2. 提交修改
git add .
git commit -m "feat: 添加新功能 xxx"

# 3. 推送到 GitHub
git push

# 4. 等待 1-2 分钟，GitHub Pages 自动部署
```

> 🎉 **零运维**：无需手动触发，每次 push 自动部署。

### 推荐的 commit 消息规范

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加悔棋功能` |
| `fix` | Bug 修复 | `fix: 修复禁手判定错误` |
| `refactor` | 重构 | `refactor: 优化 AI 评估函数` |
| `docs` | 文档 | `docs: 更新 README` |
| `style` | 样式 | `style: 优化棋盘配色` |
| `chore` | 杂项 | `chore: 更新 .gitignore` |

---

## 十、完整 Checklist

部署完成前，逐项打勾确认：

### GitHub 端

- [ ] GitHub 仓库已创建（Public）
- [ ] PAT 已生成并保存到密码管理器
- [ ] PAT 权限最小化（仅 `repo` + `metadata`）

### 本地端

- [ ] Git 已安装并配置 `user.name` / `user.email`
- [ ] `credential.helper` 已配置
- [ ] `.gitignore` 已创建
- [ ] `README.md` 已创建
- [ ] `git init` / `add` / `commit` 已执行
- [ ] `git remote add origin` 已配置
- [ ] `git push -u origin main` 成功
- [ ] GitHub 仓库页面已能看到所有代码

### GitHub Pages

- [ ] Settings → Pages → Source 选 `main` branch / root
- [ ] 默认域名 `https://<USERNAME>.github.io/five-in-a-row/` 可访问
- [ ] **Enforce HTTPS** 已勾选

### 自定义域名（可选）

- [ ] 域名已购买
- [ ] `CNAME` 文件已创建并推送
- [ ] GitHub Pages 已配置自定义域名
- [ ] DNS 检查通过（DNS check successful）
- [ ] DNS 记录已添加（CNAME 或 A 记录）
- [ ] DNS 全球生效（`nslookup` 验证）
- [ ] SSL 证书已签发
- [ ] **Enforce HTTPS** 已开启
- [ ] 通过 `https://game.yourdomain.com` 可正常访问

### 最终验证

- [ ] 浏览器访问无 404
- [ ] 游戏可正常开始/落子/判定胜负
- [ ] AI 对战正常
- [ ] HTTPS 锁图标显示
- [ ] 移动端适配正常

---

## 🎉 部署完成

完成所有 Checklist 后，你就拥有了一个：

- ✅ **全球可访问**的五子棋游戏
- ✅ **HTTPS 加密**安全连接
- ✅ **CDN 加速**全球分发
- ✅ **零运维成本**完全免费
- ✅ **自动化部署**git push 即更新

> 📅 **预计总耗时**：30 - 60 分钟（含 DNS 等待）
> 💰 **总成本**：域名 ~¥70/年，部署完全免费

---

## 📚 参考资料

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [PAT 认证方式](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [自定义域名配置](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Let's Encrypt 证书](https://letsencrypt.org/)

---

> 如需进一步协助（如生成 `.gitignore` 和 `README.md` 的具体文件、演示 DNS 配置截图等），请告诉我。