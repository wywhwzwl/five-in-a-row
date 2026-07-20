# GitHub Pages 部署脚本实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个 PowerShell 一键部署脚本（`deploy.ps1`），将五子棋项目自动推送到 GitHub 并启用 GitHub Pages，使 `https://wywhwzwl.github.io/five-in-a-row/` 可公网访问。

**Architecture:** 单文件 PowerShell 脚本，按 6 个阶段顺序执行：环境检查 → Git 初始化 → 文件暂存提交 → 远程仓库配置 → 推送代码 → 输出结果。每个阶段由独立函数实现，统一通过彩色输出函数和退出码进行错误处理。

**Tech Stack:** PowerShell 5.0+ / 7.x、Git CLI、Windows Credential Manager (PAT 缓存)

---

## Global Constraints

[来自 spec 第 3 节，复制粘贴以确保实施时严格遵守]

| 约束项 | 取值 |
|--------|------|
| 脚本类型 | PowerShell (.ps1) |
| GitHub 用户名 | `wywhwzwl` |
| 仓库名 | `five-in-a-row` |
| 仓库地址 | `https://github.com/wywhwzwl/five-in-a-row.git` |
| 默认分支 | `main` |
| 认证方式 | Personal Access Token (PAT) |
| PAT 缓存 | Windows Credential Manager（Git 原生） |
| 自定义域名 | ❌ 不需要 |
| Pages URL | `https://wywhwzwl.github.io/five-in-a-row/` |
| Pages 启用方式 | 脚本外手动（GitHub 后台设置需浏览器交互） |
| 提交信息模板 | `feat: 初始化五子棋游戏项目`（首次提交） |
| 错误处理策略 | `$ErrorActionPreference = 'Stop'` + 失败立即终止 |
| 脚本总行数 | ~130 行 |
| PowerShell 版本下限 | 5.0 |
| 远程协议 | HTTPS only（禁止 SSH） |
| 安全要求 | PAT 不存储到文件、不打印 PAT 内容、错误信息脱敏 |

---

## 实施前准备

**重要：** 由于本项目尚未初始化 git 仓库，在开始执行任务前需要先手动初始化 git（避免后续每个任务无法提交）：

```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
git init
git config user.name "你的名字"
git config user.email "你的邮箱@example.com"
git add .
git commit -m "chore: 初始化项目仓库（部署脚本开发前）"
```

**注意：** 上面 `git config` 设置的是**本地仓库**用户信息，仅用于开发期间的提交。如果用户已有 GitHub 账户，应使用 GitHub 账户邮箱保持一致。

---

## Task 1: 脚本基础结构（元数据 + 配置常量 + 输出函数）

**Files:**
- Create: `deploy.ps1` (~50 行)

**Goal:** 创建 `deploy.ps1` 框架，包含脚本元数据、配置常量、彩色输出函数。

**Interfaces:**
- Produces:
  - `$GITHUB_USERNAME`, `$REPO_NAME`, `$REPO_URL`, `$DEFAULT_BRANCH`, `$EXPECTED_PAGES_URL`（常量）
  - `Write-Success($Message)`, `Write-Warning($Message)`, `Write-ErrorMsg($Message)`, `Write-Info($Message)`（输出函数）

---

- [ ] **Step 1: 创建 deploy.ps1 并写入脚本头和元数据**

在项目根目录创建 `deploy.ps1`，写入以下内容：

```powershell
<#
.SYNOPSIS
    五子棋项目 GitHub Pages 一键部署脚本

.DESCRIPTION
    自动完成以下流程：
    1. 检查 PowerShell 和 Git 环境
    2. 初始化 Git 仓库（如未初始化）
    3. 暂存并提交所有变更
    4. 配置 GitHub 远程仓库
    5. 推送代码到 main 分支
    6. 输出 GitHub Pages 访问地址

.PARAMETER Help
    显示详细帮助信息

.EXAMPLE
    .\deploy.ps1
    执行完整的部署流程

.NOTES
    作者: Claude (via superpowers workflow)
    日期: 2026-07-20
    要求: PowerShell 5.0+ 和 Git
#>

# 严格模式：未声明变量即报错
Set-StrictMode -Version Latest
# 遇到错误立即终止
$ErrorActionPreference = 'Stop'

# ============== 配置常量 ==============
$GITHUB_USERNAME = "wywhwzwl"
$REPO_NAME = "five-in-a-row"
$REPO_URL = "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
$DEFAULT_BRANCH = "main"
$EXPECTED_PAGES_URL = "https://$GITHUB_USERNAME.github.io/$REPO_NAME/"

# ============== 彩色输出函数 ==============
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# 占位：后续任务添加更多函数
# Test-Prerequisites, Initialize-GitRepo, Test-GitConfig,
# Invoke-GitCommit, Test-GitRemote, Set-GitRemote, Invoke-GitPush, Main
```

- [ ] **Step 2: 验证脚本语法正确**

执行：
```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

预期输出（Windows PowerShell 或 PowerShell 7）：
```
语法检查通过
```

如果报错，检查 PowerShell 是否安装（`pwsh --version`）。

- [ ] **Step 3: 验证输出函数正常**

执行：
```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Success '成功'; Write-Warning '警告'; Write-ErrorMsg '错误'; Write-Info '信息' }"
```

预期输出（带颜色）：
```
✅ 成功
⚠️  警告
❌ 错误
ℹ️  信息
```

- [ ] **Step 4: 验证配置常量值**

执行：
```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host \$REPO_URL; Write-Host \$EXPECTED_PAGES_URL }"
```

预期输出：
```
https://github.com/wywhwzwl/five-in-a-row.git
https://wywhwzwl.github.io/five-in-a-row/
```

- [ ] **Step 5: 提交当前进度**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加脚本基础结构和输出函数"
```

---

## Task 2: 环境检查函数（Test-Prerequisites）

**Files:**
- Modify: `deploy.ps1`（在输出函数后、`Main` 占位前添加 Test-Prerequisites）

**Goal:** 实现环境检查函数，验证 PowerShell 版本、Git 安装、项目目录。

**Interfaces:**
- Consumes: 无（仅使用 PowerShell 内置变量和命令）
- Produces:
  - `Test-Prerequisites` → `[bool]` 返回 $true 表示检查通过
  - 失败时退出脚本（exit 1/2/3）

---

- [ ] **Step 1: 在 deploy.ps1 中添加 Test-Prerequisites 函数**

找到 `# 占位：后续任务添加更多函数` 这行，**替换为以下内容**（包含新的 Test-Prerequisites 函数）：

```powershell
# ============== 环境检查 ==============
function Test-Prerequisites {
    Write-Info "检查运行环境..."

    # 检查 PowerShell 版本
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        Write-ErrorMsg "PowerShell 版本过低：$($psVersion.ToString())"
        Write-ErrorMsg "请升级到 PowerShell 5.0+（Windows 10/11 默认已安装）"
        exit 1
    }
    Write-Success "PowerShell 版本：$($psVersion.ToString())"

    # 检查 Git 是否安装
    try {
        $gitVersion = git --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "git 命令未找到"
        }
        Write-Success "Git 已安装：$gitVersion"
    }
    catch {
        Write-ErrorMsg "Git 未安装或不在 PATH 中"
        Write-ErrorMsg "请先安装 Git：https://git-scm.com/download/win"
        exit 2
    }

    # 检查当前目录是否包含 index.html
    if (-not (Test-Path -Path "index.html" -PathType Leaf)) {
        Write-ErrorMsg "当前目录不是项目根目录（未找到 index.html）"
        Write-ErrorMsg "请在 Five-in-a-Row 项目根目录下运行此脚本"
        exit 3
    }
    Write-Success "项目目录验证通过：$((Get-Location).Path)"

    return $true
}
```

- [ ] **Step 2: 验证语法仍正确**

执行：
```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

预期输出：
```
语法检查通过
```

- [ ] **Step 3: 在正确目录运行 Test-Prerequisites 应通过**

执行：
```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
pwsh -NoProfile -Command "& { . ./deploy.ps1; Test-Prerequisites }"
```

预期输出（所有检查通过）：
```
ℹ️  检查运行环境...
✅ PowerShell 版本：5.1.x... 或 7.x...
✅ Git 已安装：git version 2.x.x...
✅ 项目目录验证通过：F:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 4: 验证错误处理：临时移到上级目录运行应失败**

执行：
```bash
cd ..
pwsh -NoProfile -Command "& { . ./Five-in-a-Row/deploy.ps1; Test-Prerequisites }"
echo "退出码：$LASTEXITCODE"
```

预期输出（应退出码 = 3）：
```
ℹ️  检查运行环境...
✅ PowerShell 版本：...
✅ Git 已安装：...
❌ 当前目录不是项目根目录（未找到 index.html）
```

退出码应为 3。回到项目目录继续：
```bash
cd Five-in-a-Row
```

- [ ] **Step 5: 提交**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加环境检查函数 Test-Prerequisites"
```

---

## Task 3: Git 仓库初始化函数（Initialize-GitRepo）

**Files:**
- Modify: `deploy.ps1`（在 Test-Prerequisites 后添加 Initialize-GitRepo）

**Goal:** 实现幂等的 Git 仓库初始化函数。

**Interfaces:**
- Consumes: 无
- Produces:
  - `Initialize-GitRepo` → `[bool]` 始终返回 $true（失败时已 exit）

---

- [ ] **Step 1: 在 Test-Prerequisites 函数后添加 Initialize-GitRepo**

找到 `return $true`（Test-Prerequisites 末尾）和 `# ============== 环境检查 ==============` 注释之间的位置，**在 Test-Prerequisites 函数之后插入**以下内容：

```powershell
# ============== Git 仓库初始化 ==============
function Initialize-GitRepo {
    Write-Info "检查 Git 仓库状态..."

    # 检查是否已经是 Git 仓库
    if (Test-Path -Path ".git" -PathType Container) {
        Write-Success "Git 仓库已存在（跳过初始化）"
        return $true
    }

    Write-Info "初始化 Git 仓库..."
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "git init 失败"
        exit 4
    }
    Write-Success "Git 仓库初始化完成"

    # 重命名分支为 main（如果当前是 master）
    $currentBranch = git branch --show-current 2>&1
    if ($currentBranch -eq "master") {
        git branch -M main
        Write-Success "默认分支已重命名为 main"
    }

    return $true
}
```

- [ ] **Step 2: 验证语法**

执行：
```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

预期：
```
语法检查通过
```

- [ ] **Step 3: 在备份目录测试幂等行为**

由于 `git init` 会创建 `.git` 目录，为避免影响当前仓库，**先在临时目录测试**：

```bash
# 创建临时测试目录
mkdir -p /tmp/test-deploy-init
cd /tmp/test-deploy-init
echo "test" > index.html

# 复制 deploy.ps1 进行测试（仅用于单元测试）
cp f:/VSCode_Projects/Cases/Five-in-a-Row/deploy.ps1 .

# 首次调用：应执行 git init
pwsh -NoProfile -Command "& { . ./deploy.ps1; Initialize-GitRepo }"
echo "---"
ls -la .git 2>&1 | head -3

# 第二次调用：应跳过（幂等）
pwsh -NoProfile -Command "& { . ./deploy.ps1; Initialize-GitRepo }"
```

预期输出（首次 + 二次）：
```
ℹ️  检查 Git 仓库状态...
ℹ️  初始化 Git 仓库...
Initialized empty Git repository in ...
✅ Git 仓库初始化完成
---
total ...
---
ℹ️  检查 Git 仓库状态...
✅ Git 仓库已存在（跳过初始化）
```

清理测试目录：
```bash
rm -rf /tmp/test-deploy-init
```

回到项目目录：
```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 4: 验证现有仓库（已 git init）调用函数正确识别**

执行：
```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
pwsh -NoProfile -Command "& { . ./deploy.ps1; Initialize-GitRepo }"
```

预期（项目已 git init）：
```
ℹ️  检查 Git 仓库状态...
✅ Git 仓库已存在（跳过初始化）
```

- [ ] **Step 5: 提交**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加 Git 仓库初始化函数 Initialize-GitRepo"
```

---

## Task 4: Git 用户配置检查函数（Test-GitConfig）

**Files:**
- Modify: `deploy.ps1`（在 Initialize-GitRepo 后添加 Test-GitConfig）

**Goal:** 检查并交互式设置 Git 用户信息（user.name 和 user.email）。

**Interfaces:**
- Consumes: 无
- Produces:
  - `Test-GitConfig` → `[bool]` 返回 $true

---

- [ ] **Step 1: 在 Initialize-GitRepo 后添加 Test-GitConfig**

找到 `return $true`（Initialize-GitRepo 末尾）后，添加：

```powershell
# ============== Git 用户配置检查 ==============
function Test-GitConfig {
    Write-Info "检查 Git 用户配置..."

    $userName = git config user.name 2>&1
    $userEmail = git config user.email 2>&1

    # 检查本地配置（如果设置了 --global 也算）
    if ([string]::IsNullOrWhiteSpace($userName)) {
        $userName = git config --global user.name 2>&1
    }
    if ([string]::IsNullOrWhiteSpace($userEmail)) {
        $userEmail = git config --global user.email 2>&1
    }

    # 如果本地和全局都没有配置
    if ([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($userEmail)) {
        Write-Warning "Git 用户信息未配置"

        $inputName = Read-Host "请输入你的名字（将作为 Git 提交作者）"
        $inputEmail = Read-Host "请输入你的邮箱"

        if ([string]::IsNullOrWhiteSpace($inputName) -or [string]::IsNullOrWhiteSpace($inputEmail)) {
            Write-ErrorMsg "名字和邮箱不能为空"
            exit 5
        }

        git config user.name "$inputName"
        git config user.email "$inputEmail"
        Write-Success "Git 用户信息已配置：$inputName <$inputEmail>"
    }
    else {
        Write-Success "Git 用户信息：$userName <$userEmail>"
    }

    return $true
}
```

- [ ] **Step 2: 验证语法**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

预期：
```
语法检查通过
```

- [ ] **Step 3: 在临时目录测试交互行为**

```bash
mkdir -p /tmp/test-git-config
cd /tmp/test-git-config
git init
echo "test" > index.html
cp f:/VSCode_Projects/Cases/Five-in-a-Row/deploy.ps1 .

# 模拟输入（这里需要交互式测试，需手动运行）
pwsh -NoProfile -Command "& { . ./deploy.ps1; Test-GitConfig }"
```

**手动操作**：
- 看到 `请输入你的名字` 时，输入 `Test User`
- 看到 `请输入你的邮箱` 时，输入 `test@example.com`

预期输出：
```
ℹ️  检查 Git 用户配置...
⚠️  Git 用户信息未配置
请输入你的名字（将作为 Git 提交作者）: Test User
请输入你的邮箱: test@example.com
✅ Git 用户信息已配置：Test User <test@example.com>
```

验证配置已保存：
```bash
cd /tmp/test-git-config
git config user.name
git config user.email
```

预期：
```
Test User
test@example.com
```

清理：
```bash
rm -rf /tmp/test-git-config
cd f:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 4: 验证已配置时跳过交互**

```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
# 确保本地仓库已配置用户信息
git config user.name "Test"
git config user.email "test@example.com"

pwsh -NoProfile -Command "& { . ./deploy.ps1; Test-GitConfig }"
```

预期（无交互提示）：
```
ℹ️  检查 Git 用户配置...
✅ Git 用户信息：Test <test@example.com>
```

- [ ] **Step 5: 提交**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加 Git 用户配置检查函数 Test-GitConfig"
```

---

## Task 5: Git 提交函数（Invoke-GitCommit）

**Files:**
- Modify: `deploy.ps1`（在 Test-GitConfig 后添加 Invoke-GitCommit）

**Goal:** 自动暂存所有变更并创建提交，幂等（无变更时不报错）。

**Interfaces:**
- Consumes: 无
- Produces:
  - `Invoke-GitCommit` → `[bool]` 返回 $true

---

- [ ] **Step 1: 添加 Invoke-GitCommit 函数**

在 Test-GitConfig 后插入：

```powershell
# ============== Git 提交 ==============
function Invoke-GitCommit {
    Write-Info "暂存并提交变更..."

    # 添加所有变更
    git add .
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "git add . 失败"
        exit 6
    }

    # 检查是否有变更需要提交
    $gitStatus = git status --porcelain 2>&1
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Success "无变更需要提交（工作区干净）"
        return $true
    }

    # 自动生成提交信息
    $commitMessage = "feat: 初始化五子棋游戏项目"

    # 如果是首次提交（无任何提交历史），使用首次提交信息
    $commitCount = git rev-list --count HEAD 2>&1
    if ($LASTEXITCODE -ne 0 -or $commitCount -eq "0") {
        $commitMessage = "feat: 初始化五子棋游戏项目"
        Write-Info "检测到首次提交"
    }
    else {
        # 后续提交使用带日期的信息
        $today = Get-Date -Format "yyyy-MM-dd"
        $commitMessage = "chore: 部署脚本更新 ($today)"
    }

    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "git commit 失败"
        exit 7
    }

    Write-Success "提交完成：$commitMessage"
    return $true
}
```

- [ ] **Step 2: 验证语法**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

- [ ] **Step 3: 在临时目录测试**

```bash
mkdir -p /tmp/test-commit
cd /tmp/test-commit
git init
git config user.name "Test"
git config user.email "test@test.com"
echo "index" > index.html
cp f:/VSCode_Projects/Cases/Five-in-a-Row/deploy.ps1 .

# 首次提交
pwsh -NoProfile -Command "& { . ./deploy.ps1; Invoke-GitCommit }"
echo "---提交历史---"
git log --oneline

# 第二次调用（无变更）
pwsh -NoProfile -Command "& { . ./deploy.ps1; Invoke-GitCommit }"
```

预期：
```
ℹ️  暂存并提交变更...
ℹ️  检测到首次提交
✅ 提交完成：feat: 初始化五子棋游戏项目
---提交历史---
xxxxxxx feat: 初始化五子棋游戏项目
ℹ️  暂存并提交变更...
✅ 无变更需要提交（工作区干净）
```

清理：
```bash
rm -rf /tmp/test-commit
cd f:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 4: 在真实项目中运行（确保幂等）**

```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
pwsh -NoProfile -Command "& { . ./deploy.ps1; Invoke-GitCommit }"
```

预期（无变更）：
```
ℹ️  暂存并提交变更...
✅ 无变更需要提交（工作区干净）
```

- [ ] **Step 5: 提交**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加 Git 提交函数 Invoke-GitCommit"
```

---

## Task 6: Git 远程仓库管理函数（Test-GitRemote + Set-GitRemote）

**Files:**
- Modify: `deploy.ps1`（在 Invoke-GitCommit 后添加两个函数）

**Goal:** 检查并配置 origin 远程仓库，处理已存在但 URL 不匹配的情况。

**Interfaces:**
- Consumes:
  - `$REPO_URL`（常量）
- Produces:
  - `Test-GitRemote` → `[bool]` 返回 $true
  - `Set-GitRemote` → `[bool]` 返回 $true

---

- [ ] **Step 1: 添加 Test-GitRemote 函数**

在 Invoke-GitCommit 后插入：

```powershell
# ============== Git 远程仓库管理 ==============
function Test-GitRemote {
    Write-Info "检查远程仓库配置..."

    $remoteUrl = git config --get remote.origin.url 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "未配置 origin 远程仓库"
        return $false
    }

    if ($remoteUrl -eq $REPO_URL) {
        Write-Success "远程仓库已正确配置：$remoteUrl"
        return $true
    }

    Write-Warning "远程仓库 URL 不匹配"
    Write-Warning "  当前：$remoteUrl"
    Write-Warning "  期望：$REPO_URL"
    return $false
}

function Set-GitRemote {
    Write-Info "配置远程仓库..."

    # 检查 origin 是否已存在
    $existingUrl = git config --get remote.origin.url 2>&1
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($existingUrl)) {
        # origin 已存在，使用 set-url 更新
        Write-Warning "远程 origin 已存在，正在更新 URL..."
        Write-Warning "  旧：$existingUrl"
        Write-Warning "  新：$REPO_URL"
        git remote set-url origin $REPO_URL
        if ($LASTEXITCODE -ne 0) {
            Write-ErrorMsg "git remote set-url origin 失败"
            exit 8
        }
        Write-Success "远程仓库 URL 已更新：$REPO_URL"
        return $true
    }

    # origin 不存在，添加新的
    git remote add origin $REPO_URL
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "git remote add origin 失败"
        Write-ErrorMsg "请检查："
        Write-ErrorMsg "  1. GitHub 仓库是否已创建：https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        Write-ErrorMsg "  2. 仓库名是否正确：$REPO_NAME"
        exit 8
    }

    Write-Success "远程仓库已配置：$REPO_URL"
    return $true
}
```

- [ ] **Step 2: 验证语法**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

- [ ] **Step 3: 测试未配置 remote 的情况**

```bash
mkdir -p /tmp/test-remote
cd /tmp/test-remote
git init
git config user.name "Test"
git config user.email "test@test.com"
echo "test" > index.html
cp f:/VSCode_Projects/Cases/Five-in-a-Row/deploy.ps1 .

pwsh -NoProfile -Command "& { . ./deploy.ps1; \$result = Test-GitRemote; Write-Host \"Test 结果：\$result\" }"
```

预期：
```
ℹ️  检查远程仓库配置...
⚠️  未配置 origin 远程仓库
Test 结果：False
```

- [ ] **Step 4: 测试添加 remote 并验证**

```bash
cd /tmp/test-remote
pwsh -NoProfile -Command "& { . ./deploy.ps1; Set-GitRemote }"
echo "---验证---"
pwsh -NoProfile -Command "& { . ./deploy.ps1; \$result = Test-GitRemote; Write-Host \"Test 结果：\$result\" }"
```

预期：
```
ℹ️  配置远程仓库...
✅ 远程仓库已配置：https://github.com/wywhwzwl/five-in-a-row.git
---验证---
ℹ️  检查远程仓库配置...
✅ 远程仓库已正确配置：https://github.com/wywhwzwl/five-in-a-row.git
Test 结果：True
```

清理：
```bash
rm -rf /tmp/test-remote
cd f:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 5: 在真实项目中验证**

```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
pwsh -NoProfile -Command "& { . ./deploy.ps1; Test-GitRemote }"
```

预期（首次运行，无 remote）：
```
ℹ️  检查远程仓库配置...
⚠️  未配置 origin 远程仓库
```

- [ ] **Step 6: 验证 URL 不匹配场景（应自动更新）**

在临时目录模拟：

```bash
mkdir -p /tmp/test-mismatch
cd /tmp/test-mismatch
git init
git config user.name "Test"
git config user.email "test@test.com"
echo "test" > index.html

# 配置错误的 URL
git remote add origin https://github.com/wrong/url.git
cp f:/VSCode_Projects/Cases/Five-in-a-Row/deploy.ps1 .

# Test 应检测到不匹配
pwsh -NoProfile -Command "& { . ./deploy.ps1; \$r = Test-GitRemote; Write-Host \"Test: \$r\" }"

# Set-GitRemote 应自动更新 URL
pwsh -NoProfile -Command "& { . ./deploy.ps1; Set-GitRemote }"

# 再次 Test 应通过
pwsh -NoProfile -Command "& { . ./deploy.ps1; \$r = Test-GitRemote; Write-Host \"Test: \$r\" }"
```

预期：
```
ℹ️  检查远程仓库配置...
⚠️  远程仓库 URL 不匹配
  当前：https://github.com/wrong/url.git
  期望：https://github.com/wywhwzwl/five-in-a-row.git
Test: False
---
ℹ️  配置远程仓库...
⚠️  远程 origin 已存在，正在更新 URL...
  旧：https://github.com/wrong/url.git
  新：https://github.com/wywhwzwl/five-in-a-row.git
✅ 远程仓库 URL 已更新：https://github.com/wywhwzwl/five-in-a-row.git
---
ℹ️  检查远程仓库配置...
✅ 远程仓库已正确配置：https://github.com/wywhwzwl/five-in-a-row.git
Test: True
```

清理：
```bash
rm -rf /tmp/test-mismatch
cd f:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 7: 提交**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加远程仓库管理函数 Test-GitRemote 和 Set-GitRemote"
```

---

## Task 7: Git 推送函数（Invoke-GitPush）

**Files:**
- Modify: `deploy.ps1`（在 Set-GitRemote 后添加 Invoke-GitPush）

**Goal:** 推送代码到 origin/main，处理认证错误并提供清晰的修复指引。

**Interfaces:**
- Consumes:
  - `$REPO_URL`, `$DEFAULT_BRANCH`
- Produces:
  - `Invoke-GitPush` → `[bool]` 返回 $true

---

- [ ] **Step 1: 添加 Invoke-GitPush 函数**

在 Set-GitRemote 后插入：

```powershell
# ============== Git 推送 ==============
function Invoke-GitPush {
    Write-Info "推送代码到 GitHub..."

    # 确保 credential helper 已配置（Windows）
    $credHelper = git config --global credential.helper 2>&1
    if ([string]::IsNullOrWhiteSpace($credHelper)) {
        Write-Info "配置 Git 凭据管理器（用于缓存 PAT）..."
        git config --global credential.helper manager
        Write-Success "凭据管理器已配置"
    }

    # 推送代码（首次推送使用 -u 设置上游）
    $branchList = git branch 2>&1
    if ($branchList -match "\*\s+$DEFAULT_BRANCH") {
        # 默认分支已存在，使用 -u
        git push -u origin $DEFAULT_BRANCH 2>&1 | Out-String | Write-Host
    }
    else {
        # 推送所有分支
        git push -u origin --all 2>&1 | Out-String | Write-Host
    }

    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "git push 失败"
        Write-ErrorMsg ""
        Write-ErrorMsg "常见原因及解决方案："
        Write-ErrorMsg "1. PAT 无效或过期"
        Write-ErrorMsg "   → 重新生成 PAT: https://github.com/settings/tokens?type=beta"
        Write-ErrorMsg "   → 权限要求：Contents (Read and write)"
        Write-ErrorMsg ""
        Write-ErrorMsg "2. GitHub 仓库不存在"
        Write-ErrorMsg "   → 创建仓库: https://github.com/new"
        Write-ErrorMsg "   → 仓库名必须是: $REPO_NAME"
        Write-ErrorMsg "   → 必须是 Public（GitHub Pages 限制）"
        Write-ErrorMsg ""
        Write-ErrorMsg "3. 网络问题"
        Write-ErrorMsg "   → 检查网络连接和代理设置"
        exit 9
    }

    Write-Success "代码已成功推送到 GitHub"
    return $true
}
```

- [ ] **Step 2: 验证语法**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

- [ ] **Step 3: 测试认证失败时的错误处理（不实际推送）**

```bash
mkdir -p /tmp/test-push
cd /tmp/test-push
git init
git config user.name "Test"
git config user.email "test@test.com"
echo "test" > index.html
git add .
git commit -m "test"

# 配置一个不存在的 remote（模拟认证失败）
git remote add origin https://github.com/wywhwzwl/nonexistent-repo-test.git
cp f:/VSCode_Projects/Cases/Five-in-a-Row/deploy.ps1 .

# 输入假 PAT（这里手动操作时输入任意字符串即可）
pwsh -NoProfile -Command "& { . ./deploy.ps1; Invoke-GitPush }"
```

**手动操作**：
- 当弹出认证提示时，用户名输入 `test`，密码输入 `fake-token`

预期输出（认证失败）：
```
ℹ️  推送代码到 GitHub...
ℹ️  配置 Git 凭据管理器（用于缓存 PAT）...
Username for 'https://github.com': test
Password for 'https://github.com':
remote: Repository not found.
fatal: repository 'https://github.com/wywhwzwl/nonexistent-repo-test.git/' not found
❌ git push 失败

常见原因及解决方案：
1. PAT 无效或过期
   → 重新生成 PAT: ...
   ...
```

退出码应为 9。

清理：
```bash
rm -rf /tmp/test-push
cd f:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 4: 验证函数定义正确加载**

```bash
cd f:\VSCode_Projects\Cases\Five-in-a-Row
pwsh -NoProfile -Command "& { . ./deploy.ps1; Get-Command Invoke-GitPush | Select-Object Name, Definition }"
```

预期（显示函数定义）：
```
Name            Definition
----            ----------
Invoke-GitPush  ...
```

- [ ] **Step 5: 提交**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加 Git 推送函数 Invoke-GitPush 及认证错误处理"
```

---

## Task 8: 主流程编排（Main 函数）

**Files:**
- Modify: `deploy.ps1`（添加 Main 函数和入口点）

**Goal:** 将所有函数串联成完整的部署流程。

**Interfaces:**
- Consumes: 所有前置函数
- Produces:
  - `Main` → 协调所有阶段，输出最终结果

---

- [ ] **Step 1: 添加 Main 函数和入口**

找到文件末尾的 `# 占位：后续任务添加更多函数` 这行（如果还在），**替换为以下内容**（完整的 Main 函数）：

如果该行已被替换，则在 Invoke-GitPush 函数后插入：

```powershell
# ============== 主流程 ==============
function Main {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "   五子棋项目 · GitHub Pages 一键部署" -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""

    try {
        # 阶段 1：环境检查
        Test-Prerequisites
        Write-Host ""

        # 阶段 2：Git 仓库初始化
        Initialize-GitRepo
        Write-Host ""

        # 阶段 3：Git 用户配置
        Test-GitConfig
        Write-Host ""

        # 阶段 4：文件暂存与提交
        Invoke-GitCommit
        Write-Host ""

        # 阶段 5：远程仓库配置
        if (-not (Test-GitRemote)) {
            Set-GitRemote
        }
        Write-Host ""

        # 阶段 6：推送代码
        Invoke-GitPush
        Write-Host ""

        # 输出结果
        Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
        Write-Success "部署完成！"
        Write-Host ""
        Write-Host "🌐 GitHub 仓库：$REPO_URL" -ForegroundColor Cyan
        Write-Host "📄 GitHub Pages 访问地址（启用 Pages 后生效）：" -ForegroundColor Cyan
        Write-Host "   $EXPECTED_PAGES_URL" -ForegroundColor Yellow
        Write-Host ""
        Write-Warning "下一步：启用 GitHub Pages"
        Write-Host "  1. 访问：$REPO_URL" -ForegroundColor Cyan
        Write-Host "  2. 点击 Settings → Pages" -ForegroundColor Cyan
        Write-Host "  3. Source 选 'Deploy from a branch'" -ForegroundColor Cyan
        Write-Host "  4. Branch 选 'main' / '/ (root)'" -ForegroundColor Cyan
        Write-Host "  5. 点击 Save，等待 1-2 分钟后访问上面的 Pages 地址" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
    }
    catch {
        Write-ErrorMsg "部署过程中发生错误：$_"
        exit 99
    }
}

# ============== 入口 ==============
# 仅当脚本被直接执行时运行 Main（被 . 引入时不执行）
if ($MyInvocation.InvocationName -ne '.' -and $MyInvocation.Line -eq $null) {
    Main
}
```

- [ ] **Step 2: 验证语法**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '语法检查通过' }"
```

预期：
```
语法检查通过
```

- [ ] **Step 3: 验证函数可独立调用（不触发 Main）**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Get-Command Main | Select-Object Name }"
```

预期（仅显示函数定义，不执行）：
```
Name
----
Main
```

- [ ] **Step 4: 验证脚本直接执行会调用 Main**

```bash
# 在临时目录测试，避免影响真实仓库
mkdir -p /tmp/test-main
cd /tmp/test-main
cp f:/VSCode_Projects/Cases/Five-in-a-Row/deploy.ps1 .
echo "test" > index.html

# 在测试目录运行（首次运行）
echo "Test" | pwsh -NoProfile -Command "& { . ./deploy.ps1; Test-Prerequisites }"
```

预期（手动测试场景）：
```
ℹ️  检查运行环境...
✅ PowerShell 版本：...
✅ Git 已安装：...
✅ 项目目录验证通过：...
```

清理：
```bash
rm -rf /tmp/test-main
cd f:\VSCode_Projects\Cases\Five-in-a-Row
```

- [ ] **Step 5: 提交**

```bash
git add deploy.ps1
git commit -m "feat(deploy): 添加主流程编排函数 Main 和入口点"
```

---

## Task 9: 文档更新与最终验证

**Files:**
- Modify: `DEPLOYMENT.md`（添加 deploy.ps1 使用说明章节）
- Verify: `deploy.ps1`（最终语法和行为验证）

**Goal:** 更新部署文档反映新脚本，并执行最终验证。

**Interfaces:**
- Consumes: 无（文档工作）
- Produces: 更新的 DEPLOYMENT.md

---

- [ ] **Step 1: 在 DEPLOYMENT.md 中添加脚本使用章节**

在 `DEPLOYMENT.md` 文件末尾**追加**以下内容（使用 Edit 工具，在 `# 🎉 部署完成` 之前插入）：

```markdown
## 🚀 一键部署脚本（deploy.ps1）

除了按文档逐步执行，本项目还提供了 PowerShell 一键部署脚本，可自动完成 Git 初始化、提交、推送全流程。

### 使用方法

```powershell
# 进入项目根目录
cd f:\VSCode_Projects\Cases\Five-in-a-Row

# 执行部署脚本
.\deploy.ps1
```

### 脚本会自动完成的步骤

| # | 步骤 | 说明 |
|---|------|------|
| 1 | 环境检查 | 验证 PowerShell 版本和 Git 安装 |
| 2 | Git 仓库初始化 | 如未初始化则自动 `git init` |
| 3 | Git 用户配置 | 如未配置则交互式询问 |
| 4 | 文件暂存与提交 | 自动生成提交信息 |
| 5 | 远程仓库配置 | 自动添加 `https://github.com/wywhwzwl/five-in-a-row.git` |
| 6 | 代码推送 | 首次推送时输入 PAT，后续自动使用缓存 |

### 首次运行提示

首次运行时会要求输入 GitHub 用户名和 PAT：

```
Username for 'https://github.com': <输入你的 GitHub 用户名>
Password for 'https://github.com': <粘贴你的 PAT，不是登录密码>
```

输入完成后，PAT 会自动通过 Windows 凭据管理器缓存，**后续推送无需重复输入**。

### 错误处理

脚本内置 9 种错误场景的友好提示，包括：
- PowerShell 版本过低
- Git 未安装
- 不在项目根目录
- PAT 无效或过期（附重新生成链接）
- 远程仓库不存在（附创建链接）
- 网络问题

### 后续更新

代码变更后，只需再次运行：
```powershell
.\deploy.ps1
```

脚本会智能识别已初始化状态，仅执行必要步骤。

### 跨平台支持

虽然 `deploy.ps1` 专为 Windows 设计，但脚本中的 Git 命令是跨平台的。如需在 Linux/Mac 上使用，可以将 PowerShell 命令翻译为 Bash：
- 函数 → function
- `if (...)` → `if [...]`
- `Write-Host` → `echo`
- `Test-Path` → `test -e`

或者参考 [DEPLOYMENT.md](DEPLOYMENT.md) 第五节手动执行。

```

- [ ] **Step 2: 最终语法验证**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; Write-Host '最终语法检查通过' }"
```

预期：
```
最终语法检查通过
```

- [ ] **Step 3: 验证所有函数定义齐全**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; 'Test-Prerequisites','Initialize-GitRepo','Test-GitConfig','Invoke-GitCommit','Test-GitRemote','Set-GitRemote','Invoke-GitPush','Main' | ForEach-Object { if (Get-Command \$_ -ErrorAction SilentlyContinue) { Write-Host \"✅ \$_\" -ForegroundColor Green } else { Write-Host \"❌ \$_ 缺失\" -ForegroundColor Red } } }"
```

预期（所有 8 个函数都已定义）：
```
✅ Test-Prerequisites
✅ Initialize-GitRepo
✅ Test-GitConfig
✅ Invoke-GitCommit
✅ Test-GitRemote
✅ Set-GitRemote
✅ Invoke-GitPush
✅ Main
```

- [ ] **Step 4: 检查脚本总行数**

```bash
wc -l deploy.ps1
```

预期（应在 130 行左右，允许 ±20 行）：
```
~130 deploy.ps1
```

- [ ] **Step 5: 检查脚本无明显错误**

```bash
pwsh -NoProfile -Command "& { . ./deploy.ps1; \$tokens = \$null; \$errors = \$null; [System.Management.Automation.Language.Parser]::ParseFile('./deploy.ps1', [ref]\$tokens, [ref]\$errors); if (\$errors.Count -eq 0) { Write-Host '✅ 无解析错误' -ForegroundColor Green } else { \$errors | ForEach-Object { Write-Host \"❌ \$_\" -ForegroundColor Red } } }"
```

预期：
```
✅ 无解析错误
```

- [ ] **Step 6: 提交所有更新**

```bash
git add deploy.ps1 DEPLOYMENT.md
git commit -m "docs(deploy): 在 DEPLOYMENT.md 中添加 deploy.ps1 使用说明

- 脚本使用方法
- 自动完成的 6 个步骤
- 首次运行 PAT 输入说明
- 错误处理说明
- 跨平台建议"
```

- [ ] **Step 7: 验证完整提交历史**

```bash
git log --oneline | head -15
```

预期（看到 9 个任务对应的提交）：
```
xxxxxxx docs(deploy): 在 DEPLOYMENT.md 中添加 deploy.ps1 使用说明
xxxxxxx feat(deploy): 添加主流程编排函数 Main 和入口点
xxxxxxx feat(deploy): 添加 Git 推送函数 Invoke-GitPush 及认证错误处理
xxxxxxx feat(deploy): 添加远程仓库管理函数 Test-GitRemote 和 Set-GitRemote
xxxxxxx feat(deploy): 添加 Git 提交函数 Invoke-GitCommit
xxxxxxx feat(deploy): 添加 Git 用户配置检查函数 Test-GitConfig
xxxxxxx feat(deploy): 添加 Git 仓库初始化函数 Initialize-GitRepo
xxxxxxx feat(deploy): 添加环境检查函数 Test-Prerequisites
xxxxxxx feat(deploy): 添加脚本基础结构和输出函数
xxxxxxx chore: 初始化项目仓库（部署脚本开发前）
```

---

## 任务完成后

脚本开发完成。下一步：

1. **手动运行部署**（需要用户的 PAT 凭证）：
   ```bash
   cd f:\VSCode_Projects\Cases\Five-in-a-Row
   .\deploy.ps1
   ```
   按提示输入 GitHub 用户名和 PAT。

2. **启用 GitHub Pages**（脚本外，需浏览器）：
   - 访问 https://github.com/wywhwzwl/five-in-a-row/settings/pages
   - Source 选 `main` 分支 / `/ (root)` 目录
   - 点击 Save

3. **访问部署结果**：
   - 等待 1-2 分钟后访问 `https://wywhwzwl.github.io/five-in-a-row/`

---

## Self-Review Checklist

完成所有任务后，对照 Spec 进行自审：

| Spec 要求 | 实施任务 | 状态 |
|----------|---------|------|
| PowerShell 脚本 ~130 行 | Task 1-9 | ✅ |
| 6 个阶段流程 | Task 8 (Main 函数) | ✅ |
| 8 种错误场景 | Task 2 (E001-E003), Task 3 (E004), Task 4 (E005), Task 5 (E006-E007), Task 7 (E009) | ✅ |
| GitHub 用户名 wywhwzwl | Task 1 (常量) | ✅ |
| 仓库名 five-in-a-row | Task 1 (常量) | ✅ |
| 默认分支 main | Task 1 (常量), Task 3 (重命名) | ✅ |
| PAT 认证 | Task 7 (凭据管理器配置) | ✅ |
| 不需要自定义域名 | 文档中明确说明 | ✅ |
| 验证清单 | Task 9 (Step 2-5) | ✅ |
| GitHub Pages URL | Task 8 (输出结果) | ✅ |
| `$ErrorActionPreference = 'Stop'` | Task 1 (脚本头) | ✅ |
| HTTPS only | Task 1, Task 6 (常量) | ✅ |
| 不存储 PAT 到文件 | Task 7 (凭据管理器) | ✅ |