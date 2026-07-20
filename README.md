# 🎮 五子棋 · Five-in-a-Row

> 纯静态、零依赖的五子棋小游戏，浏览器直接打开即可游玩。

![Made with HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![Made with CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Made with JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 特性

- 🎯 **三档 AI 难度**（V1.0 入门 / V2.0 进阶 / V3.0 大师）
- 🎨 **像素级精美的棋盘渲染**（基于 Canvas）
- ⚖️ **支持禁手规则**（可选）
- 📱 **响应式布局**，适配桌面与移动端
- 🚀 **零依赖**，纯原生 JavaScript ES2020+
- 🌐 **即开即玩**，无需后端

## 🚀 在线试玩

👉 **https://your-domain.com**（部署后替换为你的域名）

直接打开 `index.html` 也可本地运行。

## 🛠️ 本地运行

```bash
# 方式 1：直接双击 index.html

# 方式 2：使用任意静态文件服务器（推荐）
python -m http.server 8000
# 然后浏览器访问 http://localhost:8000

# 方式 3：使用 Node.js（需要先安装 http-server）
npx http-server -p 8000
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
├── .gitignore                          # Git 忽略配置
├── DEPLOYMENT.md                       # 部署文档
├── README.md                           # 本文件
├── README-技术开发.md                    # 中文技术文档
└── README-用户推广.md                    # 中文用户文档
```

## 🏗️ 技术架构

- **架构模式**：IIFE 模块 + 订阅者模式 + 不可变状态
- **设计原则**：Vibe Coding Engineer 协议（架构优先 / 像素精确 / 分层解耦）
- **代码规模**：~52 KB（含全部 JS + HTML + CSS）

## 🎯 AI 难度说明

| 难度 | 算法 | 适用场景 |
|------|------|---------|
| **V1.0** | 基础评分 + 局部搜索 | 新手入门 |
| **V2.0** | 增强评分 + 多步预判 | 普通玩家 |
| **V3.0** | Minimax + Alpha-Beta 剪枝 + 启发式 | 高手挑战 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

[MIT](LICENSE) © 2026

## 📚 相关文档

- 📖 [技术开发文档](README-技术开发.md)
- 📢 [用户推广文档](README-用户推广.md)
- 🚀 [部署指南](DEPLOYMENT.md)

---

⭐ 如果这个项目对你有帮助，欢迎 Star！