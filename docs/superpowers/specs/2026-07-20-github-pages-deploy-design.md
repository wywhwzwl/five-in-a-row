# GitHub Pages 部署脚本设计文档

**项目**：Five-in-a-Row（五子棋游戏）
**日期**：2026-07-20
**作者**：Claude (via brainstorming skill)
**状态**：已批准，待执行

---

## 1. 目标

为五子棋项目生成一个 **PowerShell 一键部署脚本**，将本地代码通过 PAT 认证推送到 GitHub，并启用 GitHub Pages 部署。最终实现 `https://wywhwzwl.github.io/five-in-a-row/` 公网可访问。

## 2. 范围

### ✅ 包含

- PowerShell 部署脚本（`deploy.ps1`）
- Git 仓库初始化与推送
- PAT 认证交互（首次输入后由 Windows 凭据管理器缓存）
- 友好的中文错误提示
- 更新 DEPLOYMENT.md 文档（加入脚本使用说明）

### ❌ 不包含

- 自定义域名配置（用户明确表示暂不需要）
- CI/CD 自动化（GitHub Actions）
- 多分支部署策略
- 部署回滚机制
- 性能监控与分析

## 3. 设计决策

| # | 决策 | 取值 | 理由 |
|---|------|------|------|
| 1 | 脚本类型 | PowerShell (.ps1) | 用户选择；现代 Windows 原生支持 |
| 2 | 仓库地址 | `https://github.com/wywhwzwl/five-in-a-row.git` | 用户 GitHub 用户名：`wywhwzwl` |
| 3 | 默认分支 | `main` | GitHub 默认；与 DEPLOYMENT.md 一致 |
| 4 | 认证方式 | PAT + Windows 凭据管理器 | 安全；无需每次输入 |
| 5 | 自定义域名 | 不需要 | 使用 GitHub 默认域名 |
| 6 | Pages 启用 | 脚本外手动 | GitHub 后台设置需要浏览器交互 |
| 7 | 提交信息模板 | `feat: 初始化五子棋游戏项目` | 符合 Conventional Commits；首次提交语义清晰 |
| 8 | 错误处理 | `$ErrorActionPreference = 'Stop'` | 失败立即终止 |

## 4. 架构设计

### 4.1 脚本结构

```powershell
# deploy.ps1 结构（~130 行）

# 块 1：脚本元数据（~15 行）
<#
.SYNOPSIS
    五子棋项目 GitHub Pages 一键部署脚本
.DESCRIPTION
    ...
#>

# 块 2：配置常量（~10 行）
$GITHUB_USERNAME = "wywhwzwl"
$REPO_NAME = "five-in-a-row"
$REPO_URL = "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
$DEFAULT_BRANCH = "main"
$EXPECTED_PAGES_URL = "https://$GITHUB_USERNAME.github.io/$REPO_NAME/"

# 块 3：彩色输出函数（~20 行）
function Write-Success { ... }
function Write-Warning { ... }
function Write-ErrorMsg { ... }
function Write-Info { ... }

# 块 4：环境检查（~25 行）
function Test-Prerequisites {
    # 检查 PowerShell 版本
    # 检查 Git 安装
    # 检查项目目录
}

# 块 5：Git 操作（~50 行）
function Initialize-GitRepo { ... }
function Test-GitConfig { ... }
function Invoke-GitCommit { ... }
function Test-GitRemote { ... }
function Set-GitRemote { ... }
function Invoke-GitPush { ... }

# 块 6：主流程（~30 行）
function Main {
    # 1. 环境检查
    # 2. Git 仓库初始化
    # 3. 文件暂存与提交
    # 4. 远程仓库配置
    # 5. 推送代码
    # 6. 输出结果
}

# 块 7：入口
Main
```

### 4.2 数据流

```
用户双击 deploy.ps1
   ↓
Test-Prerequisites → 失败则退出
   ↓
Initialize-GitRepo → 幂等（已初始化则跳过）
   ↓
Test-GitConfig → 检查 user.name / user.email
   ↓
Invoke-GitCommit → 自动生成提交信息
   ↓
Test-GitRemote → 检查 origin 是否存在
   ↓
Set-GitRemote → 不存在则添加
   ↓
Invoke-GitPush → 推送并缓存 PAT
   ↓
输出 Pages URL + 下一步指引
```

### 4.3 接口设计（函数签名）

```powershell
# 所有函数都返回 $true / $false 表示成功
function Test-Prerequisites { return [bool] }
function Initialize-GitRepo { return [bool] }
function Test-GitConfig { return [bool] }
function Invoke-GitCommit { return [bool] }
function Test-GitRemote { return [bool] }
function Set-GitRemote { return [bool] }
function Invoke-GitPush { return [bool] }
function Main { return [void] }
```

## 5. 错误处理

### 5.1 错误类型与应对

| 错误码 | 场景 | 用户提示 | 退出码 |
|--------|------|---------|--------|
| E001 | PowerShell 版本 < 5.0 | "请升级到 PowerShell 5.0+（Win10/11 默认已安装）" | 1 |
| E002 | Git 未安装 | "请先安装 Git：https://git-scm.com/download/win" | 2 |
| E003 | 不在项目根目录 | "请在项目根目录运行此脚本" | 3 |
| E004 | git push 认证失败 | "PAT 可能过期或权限不足，请重新生成：https://github.com/settings/tokens" | 4 |
| E005 | 网络超时 | "请检查网络连接后重试" | 5 |
| E006 | 远程仓库不存在 | "请先在 GitHub 创建空仓库：https://github.com/new" | 6 |
| E007 | remote URL 不匹配 | "当前 remote 是 X，是否更新为 Y？[Y/N]" | 7（确认后继续） |
| E008 | 有未保存的修改 | "是否 stash 当前修改？[Y/N]" | 8（确认后继续） |

### 5.2 安全策略

| 安全点 | 实现 |
|--------|------|
| **PAT 不存储到文件** | 仅通过 Git 原生凭据助手缓存 |
| **不打印 PAT 内容** | 输入时使用 `-AsSecureString`（如果可能） |
| **不打印敏感信息** | 错误信息脱敏处理 |
| **HTTPS only** | 所有 remote URL 强制 https:// |

## 6. 测试策略

### 6.1 验证清单

部署脚本完成后，必须执行以下验证：

| 验证项 | 命令 | 期望输出 |
|--------|------|---------|
| 语法检查 | `pwsh -NoProfile -Command "Get-Command -Syntax ./deploy.ps1"` | 无错误 |
| 帮助信息 | `pwsh deploy.ps1` + 用户中断 | 显示帮助信息 |
| 干运行 | 添加 `-WhatIf` 参数（如果支持） | 显示将执行的操作 |
| 模拟执行 | 在临时目录测试 | 各阶段函数可独立调用 |
| 实际推送 | 在项目目录运行 | git push 成功 + 输出 Pages URL |

### 6.2 回归测试

如果未来修改脚本，需重新执行：
- 在新克隆的仓库中运行
- 在已有修改的工作区中运行
- 在不同 PowerShell 版本下运行（5.1 / 7.x）

## 7. 后续步骤

1. ✅ 已批准设计
2. 📝 **编写 implementation plan**（调用 `writing-plans` skill）
3. 💻 **实现脚本**（调用 `subagent-driven-development` 或 `executing-plans` skill）
4. ✅ **验证完成**（调用 `verification-before-completion` skill）

## 8. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| GitHub 仓库未创建 | 推送失败 | 脚本检测并提示先去创建 |
| PAT 权限不足 | 推送失败 | 文档明确推荐 `Contents: Read and write` |
| 网络问题 | 推送失败 | 友好错误提示 + 重试建议 |
| 现有工作区脏 | 可能覆盖 | 脚本检查并 stash 提示 |
| PowerShell 执行策略限制 | 脚本无法运行 | 提供 `Set-ExecutionPolicy -Scope Process Bypass` 提示 |

## 9. 附录

### 9.1 PAT 生成链接

https://github.com/settings/tokens?type=beta

### 9.2 GitHub 创建仓库链接

https://github.com/new

### 9.3 GitHub Pages 启用位置

仓库 → Settings → Pages → Source: Deploy from a branch → Branch: main / (root)

---

**下一步**：调用 `writing-plans` skill 编写实施计划。