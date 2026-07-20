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
    $pushOutput = ""
    # 临时将 ErrorActionPreference 设为 Continue 以避免 git 错误抛出
    $oldErrorPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($branchList -match "\*\s+$DEFAULT_BRANCH") {
            # 默认分支已存在，使用 -u
            $pushOutput = git push -u origin $DEFAULT_BRANCH 2>&1
        }
        else {
            # 推送所有分支
            $pushOutput = git push -u origin --all 2>&1
        }
    }
    finally {
        $ErrorActionPreference = $oldErrorPreference
    }
    $pushExitCode = $LASTEXITCODE

    # 显示 git 输出
    $pushOutput | Out-String | Write-Host

    if ($pushExitCode -ne 0) {
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

# 占位：后续任务添加更多函数
# Main
