# Material You (MD3) 重构实施计划

## 1. 文件结构

```
Original-YuanZiE.github.io/
├── index.html                    # 首页（重构）
├── article.html                  # 文章列表 + 文章详情（双模式：无参数=列表，?id=XXX=详情）
├── about.html                    # 关于页面（新建）
├── archive.html                  # 归档/分类页面（新建）
├── admin.html                    # 管理面板（新建）
├── Articles/
│   ├── 2502106A/
│   │   ├── index.html            # 保留，但重构为新格式
│   │   ├── Cover.png
│   │   └── article.json          # 新增：文章元数据
│   └── ... (future articles)
├── Files/
│   ├── YuanZiE.png
│   ├── YZE_Bili.png
│   ├── Tips.png
│   └── uploads/                  # 新增：管理面板上传的图片
├── Theme/
│   ├── mdui.css                  # 保留
│   ├── mdui.global.js            # 保留
│   ├── icon.css                  # 保留
│   ├── icon-outlined.css         # 保留
│   └── icon-rounded.css          # 保留
├── assets/
│   ├── css/
│   │   ├── main.css              # 全局样式（颜色、排版、布局）
│   │   ├── components.css        # 复用组件样式（卡片、导航等）
│   │   └── admin.css             # 管理面板专用样式
│   └── js/
│       ├── app.js                # 全局逻辑（主题切换、导航、工具函数）
│       ├── article-renderer.js   # 文章渲染引擎（Markdown → HTML）
│       ├── admin.js              # 管理面板逻辑
│       ├── github-api.js         # GitHub API 封装
│       └── markdown-editor.js    # Markdown 编辑器
└── SubSite/                      # 不动
```

**设计原则**：
- 所有页面共享 `assets/css/main.css` + `assets/js/app.js`，通过 JS 动态注入导航栏和页脚，避免 HTML 重复
- 文章内容存储为 JSON 元数据 + HTML 正文（由 Markdown 生成），而非纯静态 HTML
- 管理面板完全独立，不影响前端展示

---

## 2. 共享布局方案（无构建系统）

### 方案：JS 动态注入 Layout

由于没有构建工具（Vite/Webpack），采用 **JavaScript 模板注入** 方案：

**`assets/js/app.js` 核心职责**：
```javascript
// 页面加载时自动注入共享组件
document.addEventListener('DOMContentLoaded', () => {
  injectLayout();
  initTheme();
  highlightCurrentNav();
});

function injectLayout() {
  // 注入顶部应用栏
  const appBar = document.createElement('div');
  appBar.id = 'app-bar-container';
  appBar.innerHTML = `
    <mdui-top-app-bar>
      <mdui-button-icon icon="menu" id="menu-btn"></mdui-button-icon>
      <mdui-top-app-bar-title>${document.title}</mdui-top-app-bar-title>
      <div style="flex:1"></div>
      <mdui-button-icon icon="dark_mode" id="theme-toggle"></mdui-button-icon>
    </mdui-top-app-bar>
  `;
  document.body.prepend(appBar);

  // 注入导航抽屉
  const drawer = document.createElement('mdui-navigation-drawer');
  drawer.id = 'main-drawer';
  drawer.setAttribute('close-on-overlay-click', '');
  drawer.setAttribute('close-on-esc', '');
  drawer.innerHTML = `
    <mdui-list>
      <mdui-list-item icon="home" rounded href="/">主页</mdui-list-item>
      <mdui-list-item icon="text_snippet" rounded href="/article.html">文章</mdui-list-item>
      <mdui-list-item icon="archive" rounded href="/archive.html">归档</mdui-list-item>
      <mdui-list-item icon="person" rounded href="/about.html">关于</mdui-list-item>
      <mdui-divider></mdui-divider>
      <mdui-list-item icon="settings" rounded href="/admin.html">管理</mdui-list-item>
    </mdui-list>
  `;
  document.body.prepend(drawer);

  // 注入底部导航栏（移动端）
  const navBar = document.createElement('mdui-navigation-bar');
  navBar.id = 'mobile-nav';
  navBar.innerHTML = `
    <mdui-navigation-bar-item icon="home" href="/" value="home">主页</mdui-navigation-bar-item>
    <mdui-navigation-bar-item icon="text_snippet" href="/article.html" value="articles">文章</mdui-navigation-bar-item>
    <mdui-navigation-bar-item icon="archive" href="/archive.html" value="archive">归档</mdui-navigation-bar-item>
    <mdui-navigation-bar-item icon="person" href="/about.html" value="about">关于</mdui-navigation-bar-item>
  `;
  document.body.appendChild(navBar);

  // 绑定事件
  document.getElementById('menu-btn').addEventListener('click', () => {
    drawer.open = !drawer.open;
  });
}
```

**每个 HTML 页面的最小骨架**：
```html
<!DOCTYPE html>
<html lang="zh-cn" class="mdui-theme-auto">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>页面标题 - 元子鹅の网站</title>
  <link rel="stylesheet" href="./Theme/mdui.css">
  <link href="./Theme/icon.css" rel="stylesheet">
  <link href="./Theme/icon-outlined.css" rel="stylesheet">
  <link href="./Theme/icon-rounded.css" rel="stylesheet">
  <link rel="stylesheet" href="./assets/css/main.css">
  <script src="./Theme/mdui.global.js"></script>
</head>
<body>
  <!-- 页面特定内容 -->
  <mdui-layout-main id="main-content">
    ...
  </mdui-layout-main>

  <script src="./assets/js/app.js"></script>
  <!-- 页面特定脚本 -->
</body>
</html>
```

**优势**：
- 零构建依赖，纯静态
- 导航结构只维护一份（`app.js`）
- 新增页面只需写 `<mdui-layout-main>` 内容
- 修改导航只需改 `app.js` 一处

---

## 3. CSS 架构

### `assets/css/main.css`

```css
/* ===== Material You 色彩系统 ===== */
:root {
  /* 主色调（紫罗兰，与现有 MDUI 默认一致） */
  --md-primary: rgb(103, 80, 164);
  --md-on-primary: rgb(255, 255, 255);
  --md-primary-container: rgb(234, 221, 255);
  --md-on-primary-container: rgb(33, 0, 94);

  /* 表面色 */
  --md-surface: rgb(254, 247, 255);
  --md-surface-variant: rgb(231, 224, 236);
  --md-on-surface: rgb(28, 27, 31);
  --md-on-surface-variant: rgb(73, 69, 78);

  /* 容器色 */
  --md-surface-container: rgb(243, 237, 247);
  --md-surface-container-low: rgb(247, 242, 250);
  --md-surface-container-high: rgb(236, 230, 240);

  /* 排版 */
  --md-display-large: 57px;
  --md-display-medium: 45px;
  --md-headline-large: 32px;
  --md-headline-medium: 28px;
  --md-title-large: 22px;
  --md-title-medium: 16px;
  --md-body-large: 16px;
  --md-body-medium: 14px;
  --md-label-large: 14px;

  /* 间距 */
  --md-spacing-xs: 4px;
  --md-spacing-sm: 8px;
  --md-spacing-md: 16px;
  --md-spacing-lg: 24px;
  --md-spacing-xl: 32px;
  --md-spacing-xxl: 48px;

  /* 圆角 */
  --md-shape-corner-sm: 8px;
  --md-shape-corner-md: 12px;
  --md-shape-corner-lg: 16px;
  --md-shape-corner-xl: 28px;
}

/* 暗色模式 */
.mdui-theme-dark {
  --md-surface: rgb(28, 27, 31);
  --md-on-surface: rgb(230, 224, 233);
  --md-surface-container: rgb(49, 48, 51);
  /* ... 其他暗色变量 */
}

/* ===== 全局排版 ===== */
body {
  font-family: 'Roboto', 'Noto Sans SC', system-ui, sans-serif;
  line-height: 1.6;
  color: var(--md-on-surface);
  background: var(--md-surface);
}

/* ===== 响应式布局容器 ===== */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--md-spacing-lg);
}

/* ===== 文章卡片网格 ===== */
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--md-spacing-lg);
}

/* ===== 响应式断点 ===== */
@media (max-width: 600px) {
  .page-container { padding: var(--md-spacing-md); }
  .article-grid { grid-template-columns: 1fr; }
}

@media (min-width: 840px) {
  /* 桌面端隐藏底部导航栏 */
  #mobile-nav { display: none; }
}

@media (max-width: 839px) {
  /* 移动端隐藏侧边抽屉，使用底部导航 */
  #main-drawer { display: none; }
}
```

### `assets/css/components.css`
- `.hero-card` - 首页大卡片样式
- `.article-card` - 文章列表卡片
- `.article-content` - 文章详情排版（标题、段落、代码块、图片）
- `.category-chip` - 分类标签
- `.about-section` - 关于页面布局

---

## 4. 各页面布局与组件

### 4.1 首页 (`index.html`)

**布局**：
```
┌─────────────────────────────────────────┐
│  TopAppBar (菜单 + 标题 + 主题切换)      │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     Hero Card (欢迎卡片)         │    │
│  │  ┌──────┐                       │    │
│  │  │ 头像 │  欢迎来到 元子鹅の网站   │    │
│  │  └──────┘  简介文字...           │    │
│  │           [社交链接按钮]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  最新文章                                │
│  ┌──────────┐  ┌──────────┐             │
│  │ 文章卡片1 │  │ 文章卡片2 │             │
│  │ 封面图   │  │ 封面图   │             │
│  │ 标题     │  │ 标题     │             │
│  │ 摘要     │  │ 摘要     │             │
│  │ 日期/分类 │  │ 日期/分类 │             │
│  └──────────┘  └──────────┘             │
│                                         │
│  [查看全部文章 →]                        │
│                                         │
│  ┌──────────┐  ┌──────────┐             │
│  │ Bilibili │  │ 提示卡片  │             │
│  │ 外链卡片  │  │          │             │
│  └──────────┘  └──────────┘             │
│                                         │
├─────────────────────────────────────────┤
│  Footer (版权 + 主题切换)                │
└─────────────────────────────────────────┘
```

**MDUI 组件**：
- `<mdui-card variant="elevated">` - Hero 卡片和文章卡片
- `<mdui-chip>` - 文章分类标签
- `<mdui-button variant="tonal">` - "查看全部" 按钮
- `<mdui-divider>` - 区域分隔

**关键实现**：
```javascript
// 首页加载最新 3 篇文章
async function loadLatestArticles() {
  const articles = await loadArticleIndex();
  const latest = articles.slice(0, 3);
  const grid = document.getElementById('latest-articles');
  latest.forEach(article => {
    grid.appendChild(createArticleCard(article));
  });
}
```

### 4.2 文章列表 (`article.html`)

**布局**：
```
┌─────────────────────────────────────────┐
│  TopAppBar                              │
├─────────────────────────────────────────┤
│  筛选栏: [全部] [系统] [应用] [教程] ... │
│  ┌──────────┐  ┌──────────┐             │
│  │ 文章卡片  │  │ 文章卡片  │             │
│  │ 封面图   │  │ 封面图   │             │
│  │ 标题     │  │ 标题     │             │
│  │ 摘要     │  │ 摘要     │             │
│  │ 日期     │  │ 日期     │             │
│  │ [分类标签]│  │ [分类标签]│             │
│  └──────────┘  └──────────┘             │
│  ┌──────────┐                           │
│  │ 文章卡片  │                           │
│  └──────────┘                           │
└─────────────────────────────────────────┘
```

**MDUI 组件**：
- `<mdui-segmented-button-group>` - 分类筛选
- `<mdui-card variant="filled">` - 文章卡片（带封面图）
- `<mdui-chip>` - 分类/标签
- `<mdui-circular-progress>` - 加载状态

### 4.3 文章详情 (`Articles/XXXXX/index.html`)

**方案变更**：不再每篇文章写完整 HTML，改为 **数据驱动渲染**。

每篇文章目录结构：
```
Articles/2502106A/
├── article.json    # 元数据
├── content.html    # 正文（Markdown 生成的 HTML）
└── Cover.png       # 封面图
```

`article.json` 格式：
```json
{
  "id": "2502106A",
  "title": "版本发布",
  "cover": "Cover.png",
  "category": "系统与应用",
  "tags": ["YuanZiEOS", "GeminiCoreX"],
  "date": "2025-02-06",
  "author": "元子鹅",
  "summary": "基于 Windows 11 24H2 的 Original YuanZiEOS 2 与 GeminiCoreX 正式发布",
  "content": "content.html"
}
```

**文章详情页 `article.html`（通用模板）**：
```
┌─────────────────────────────────────────┐
│  TopAppBar (← 返回文章列表)              │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │     封面图 (Cover.png)           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  版本发布                                │
│  元子鹅 · 2025-02-06 · 系统与应用        │
│  ┌─────┐ ┌─────┐                       │
│  │标签1 │ │标签2 │                       │
│  └─────┘ └─────┘                       │
│  ───────────────────────────────────    │
│                                         │
│  文章正文 HTML...                        │
│  <h2>更新日志</h2>                       │
│  <p>内容...</p>                          │
│  <img src="...">                        │
│  <a href="...">下载链接</a>              │
│                                         │
└─────────────────────────────────────────┘
```

**URL 方案**：
- `article.html?id=2502106A` → JS 读取 URL 参数，加载对应 `article.json` + `content.html`
- 保持 `Articles/2502106A/index.html` 作为兼容重定向（可选）

### 4.4 关于页面 (`about.html`) - 新建

**布局**：
```
┌─────────────────────────────────────────┐
│  TopAppBar                              │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │        头像 + 名称               │    │
│  │     "元子鹅" / 全栈开发者         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  关于我                          │    │
│  │  个人简介文字...                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────┐  ┌──────────┐             │
│  │ B站链接   │  │ GitHub   │             │
│  │ 社交卡片  │  │ 社交卡片  │             │
│  └──────────┘  └──────────┘             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  联系方式                        │    │
│  │  Email / 其他                    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 4.5 归档/分类页面 (`archive.html`) - 新建

**布局**：
```
┌─────────────────────────────────────────┐
│  TopAppBar                              │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  分类筛选 (Chip 组)               │    │
│  │  [全部] [系统] [应用] [教程]      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  2025                                    │
│  ├── 2月                                 │
│  │   └── 版本发布 · 系统与应用           │
│  ├── 1月                                 │
│  │   └── ...                            │
│  │                                      │
│  2024                                    │
│  ├── ...                                │
│                                         │
│  统计信息                                │
│  共 N 篇文章 · M 个分类                  │
└─────────────────────────────────────────┘
```

**MDUI 组件**：
- `<mdui-collapse>` - 按年/月折叠
- `<mdui-list>` - 文章列表
- `<mdui-segmented-button-group>` - 分类筛选

### 4.6 管理面板 (`admin.html`) - 新建

**布局（登录态）**：
```
┌─────────────────────────────────────────┐
│  TopAppBar (管理面板)                    │
├─────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────────────┐  │
│  │ 侧边导航    │ │  主内容区           │  │
│  │            │ │                    │  │
│  │ · 文章管理  │ │  文章列表           │  │
│  │ · 新建文章  │ │  ┌──────────────┐  │  │
│  │ · 图片管理  │ │  │ 文章1 [编辑] │  │  │
│  │ · 设置     │ │  │ 文章2 [编辑] │  │  │
│  │            │ │  └──────────────┘  │  │
│  │ [退出登录]  │ │                    │  │
│  └────────────┘ └────────────────────┘  │
└─────────────────────────────────────────┘
```

**布局（未登录态）**：
```
┌─────────────────────────────────────────┐
│  TopAppBar (管理面板)                    │
├─────────────────────────────────────────┤
│                                         │
│        ┌─────────────────────┐          │
│        │  🔐 登录             │          │
│        │                     │          │
│        │  GitHub PAT:        │          │
│        │  [________________] │          │
│        │                     │          │
│        │  仓库:              │          │
│        │  [________________] │          │
│        │                     │          │
│        │  [登录]             │          │
│        │                     │          │
│        │  提示: 需要 repo    │          │
│        │  权限的 PAT         │          │
│        └─────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. 管理员认证流程

### 5.1 认证架构

```
用户输入 PAT → 验证 PAT 有效性 → 获取仓库信息 → 存储到 localStorage
     ↓
localStorage 存储:
  - github_pat: ghp_xxxxx (加密存储可选)
  - github_repo: Original-YuanZiE/Original-YuanZiE.github.io
  - github_user: 用户名（从 API 获取）
```

### 5.2 验证流程

```javascript
// assets/js/github-api.js
class GitHubAPI {
  constructor() {
    this.token = localStorage.getItem('github_pat');
    this.repo = localStorage.getItem('github_repo') || 'Original-YuanZiE/Original-YuanZiE.github.io';
  }

  async validateToken() {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${this.token}` }
      });
      if (response.ok) {
        const user = await response.json();
        localStorage.setItem('github_user', user.login);
        return { valid: true, user };
      }
      return { valid: false, error: 'Token 无效' };
    } catch (e) {
      return { valid: false, error: '网络错误' };
    }
  }

  async getRepoInfo() {
    const response = await fetch(`https://api.github.com/repos/${this.repo}`, {
      headers: { 'Authorization': `token ${this.token}` }
    });
    return response.json();
  }

  // 获取文件内容
  async getFile(path) {
    const response = await fetch(
      `https://api.github.com/repos/${this.repo}/contents/${path}`,
      { headers: { 'Authorization': `token ${this.token}` } }
    );
    if (response.ok) {
      const data = await response.json();
      return {
        content: atob(data.content),
        sha: data.sha
      };
    }
    return null;
  }

  // 创建或更新文件
  async updateFile(path, content, message, sha = null) {
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content)))
    };
    if (sha) body.sha = sha;

    const response = await fetch(
      `https://api.github.com/repos/${this.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    return response.json();
  }

  // 删除文件
  async deleteFile(path, message, sha) {
    const response = await fetch(
      `https://api.github.com/repos/${this.repo}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, sha })
      }
    );
    return response.ok;
  }

  // 上传图片
  async uploadImage(path, file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const result = await this.updateFile(
          path,
          base64,
          `Upload image: ${path}`
        );
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
  }

  // 列出目录
  async listDir(path) {
    const response = await fetch(
      `https://api.github.com/repos/${this.repo}/contents/${path}`,
      { headers: { 'Authorization': `token ${this.token}` } }
    );
    if (response.ok) return response.json();
    return [];
  }
}
```

### 5.3 安全考虑

- PAT 存储在 `localStorage`，仅在用户浏览器中
- 登出时清除 `localStorage`
- 提示用户 PAT 只需 `repo` 权限
- 可选：提供"记住我"选项，默认不存储

---

## 6. Markdown 编辑器实现

### 6.1 依赖库（CDN）

```html
<!-- Markdown 解析 -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<!-- 代码高亮 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github.min.css">
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11/highlight.min.js"></script>
<!-- XSS 防护 -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
```

### 6.2 编辑器 UI

```
┌─────────────────────────────────────────┐
│  标题: [____________________________]   │
│  分类: [选择分类 ▼]  作者: [________]   │
│  封面图: [选择文件] [预览]               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ B I H L 🔗 🖼️ 📊 <> [] │  工具栏 │    │
│  ├─────────────────────────────────┤    │
│  │                                 │    │
│  │  Markdown 编辑区                 │    │
│  │                                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  预览:                                  │
│  ┌─────────────────────────────────┐    │
│  │  渲染后的 HTML 预览              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [保存草稿]  [发布文章]                  │
└─────────────────────────────────────────┘
```

### 6.3 工具栏功能

```javascript
// assets/js/markdown-editor.js
class MarkdownEditor {
  constructor(container) {
    this.container = container;
    this.textarea = container.querySelector('textarea');
    this.preview = container.querySelector('#preview');
    this.initToolbar();
    this.initPreview();
  }

  initToolbar() {
    const toolbar = [
      { icon: 'format_bold', action: () => this.wrapSelection('**', '**') },
      { icon: 'format_italic', action: () => this.wrapSelection('*', '*') },
      { icon: 'title', action: () => this.insertAtLineStart('## ') },
      { icon: 'link', action: () => this.insertLink() },
      { icon: 'image', action: () => this.insertImage() },
      { icon: 'code', action: () => this.insertCodeBlock() },
      { icon: 'format_list_bulleted', action: () => this.insertAtLineStart('- ') },
      { icon: 'format_list_numbered', action: () => this.insertAtLineStart('1. ') },
      { icon: 'table_chart', action: () => this.insertTable() },
    ];
    // ... 渲染工具栏按钮
  }

  wrapSelection(before, after) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const text = this.textarea.value;
    const selected = text.substring(start, end);
    this.textarea.value =
      text.substring(0, start) + before + selected + after + text.substring(end);
    this.textarea.selectionStart = start + before.length;
    this.textarea.selectionEnd = end + before.length;
    this.textarea.focus();
    this.updatePreview();
  }

  insertLink() {
    const url = prompt('输入链接 URL:');
    if (url) {
      this.wrapSelection('[', `](${url})`);
    }
  }

  insertImage() {
    // 弹出图片选择对话框
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const path = `Files/uploads/${Date.now()}_${file.name}`;
        const result = await githubApi.uploadImage(path, file);
        if (result.content) {
          this.insertText(`![${file.name}](${result.content.download_url})`);
        }
      }
    };
    input.click();
  }

  insertCodeBlock() {
    const lang = prompt('输入语言 (如 javascript, python):') || '';
    this.wrapSelection(`\`\`\`${lang}\n`, '\n```');
  }

  insertTable() {
    const table = `| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |`;
    this.insertText(table);
  }

  updatePreview() {
    const raw = this.textarea.value;
    const html = marked.parse(raw);
    this.preview.innerHTML = DOMPurify.sanitize(html);
    this.preview.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  // 生成文章 HTML
  generateArticleHTML(metadata, markdownContent) {
    const bodyHTML = DOMPurify.sanitize(marked.parse(markdownContent));
    return `<!DOCTYPE html>
<html lang="zh-cn">
<head>
  <meta charset="utf-8"/>
  <title>${metadata.title}</title>
</head>
<body>
  <article class="article-content">
    <h1>${metadata.title}</h1>
    <div class="article-meta">
      <span>${metadata.author}</span>
      <span>${metadata.date}</span>
      <span>${metadata.category}</span>
    </div>
    ${bodyHTML}
  </article>
</body>
</html>`;
  }
}
```

---

## 7. 文章发布工作流

### 7.1 发布流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  编辑文章    │ →  │  预览确认    │ →  │  提交到 GitHub│
│  (Markdown) │     │  (渲染HTML) │     │  (API)      │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      ↓                    ↓                    ↓
  本地草稿            实时预览            GitHub 自动部署
  (localStorage)      (右侧面板)         (GitHub Pages)
```

### 7.2 具体步骤

1. **新建文章**：
   - 生成文章 ID：`YYMMDDNA`（年月日 + 序号，如 `2502106A`）
   - 创建目录：`Articles/{id}/`
   - 上传封面图：`Articles/{id}/Cover.png`
   - 生成元数据：`Articles/{id}/article.json`
   - 生成正文：`Articles/{id}/content.html`（Markdown → HTML）

2. **编辑文章**：
   - 加载 `article.json` 和 `content.html`
   - 反向解析 HTML 为 Markdown（使用 turndown.js 或手动处理）
   - 编辑后重新生成

3. **删除文章**：
   - 确认对话框
   - 通过 GitHub API 删除目录下所有文件
   - 更新文章索引

### 7.3 文章索引

管理面板维护一个 `articles-index.json` 文件（放在仓库根目录或 `Articles/` 下）：

```json
{
  "articles": [
    {
      "id": "2502106A",
      "title": "版本发布",
      "cover": "Articles/2502106A/Cover.png",
      "category": "系统与应用",
      "tags": ["YuanZiEOS", "GeminiCoreX"],
      "date": "2025-02-06",
      "author": "元子鹅",
      "summary": "基于 Windows 11 24H2 的 Original YuanZiEOS 2 与 GeminiCoreX 正式发布"
    }
  ],
  "categories": ["系统与应用", "教程", "随笔"],
  "lastUpdated": "2025-02-06T00:00:00Z"
}
```

前端页面通过 `fetch('articles-index.json')` 加载文章列表，无需遍历目录。

---

## 8. 响应式设计策略

### 8.1 断点设计

```css
/* 移动端: < 600px */
/* 平板: 600px - 839px */
/* 桌面: >= 840px */
```

### 8.2 布局适配

| 组件 | 移动端 (<600px) | 平板 (600-839px) | 桌面 (>=840px) |
|------|----------------|------------------|----------------|
| 导航 | 底部导航栏 (4项) | 底部导航栏 | 侧边抽屉导航 |
| 文章卡片 | 单列 | 双列 | 三列 |
| 文章详情 | 全宽 | 居中 80% | 居中 70% |
| 管理面板 | 全宽列表 | 侧边栏 + 内容 | 侧边栏 + 内容 |
| Hero 卡片 | 全宽 | 85% | 85% |

### 8.3 MDUI 响应式特性

利用 MDUI 内置的断点系统：
- `<mdui-navigation-drawer>` 在 `< md` 断点自动变为模态
- `<mdui-navigation-bar>` 在 `>= md` 断点自动隐藏（通过 CSS）
- `<mdui-top-app-bar>` 自动适配不同屏幕

### 8.4 图片响应式

```css
.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: var(--md-shape-corner-md);
}

.article-card .cover-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
```

---

## 9. 实施顺序

### Phase 1: 基础架构 (Day 1-2)

1. **创建目录结构**
   - `assets/css/`, `assets/js/`, `Files/uploads/`

2. **实现 `assets/css/main.css`**
   - Material You 色彩系统
   - 全局排版
   - 响应式断点

3. **实现 `assets/js/app.js`**
   - 布局注入（TopAppBar, NavigationDrawer, NavigationBar）
   - 主题切换（亮/暗/自动）
   - 当前页面高亮

4. **重构 `index.html`**
   - 使用新的共享布局
   - Hero 卡片
   - 最新文章区域（静态先写）

### Phase 2: 文章系统 (Day 3-4)

5. **创建 `articles-index.json`**
   - 迁移现有文章元数据

6. **重构 `article.html`（列表页）**
   - 从 `articles-index.json` 加载
   - 分类筛选
   - 响应式卡片网格

7. **创建文章详情模板**
   - `article.html?id=XXX` 方案
   - 加载 `article.json` + `content.html`
   - 迁移 `2502106A` 到新格式

### Phase 3: 新页面 (Day 5)

8. **创建 `about.html`**
   - 个人信息
   - 社交链接
   - 联系方式

9. **创建 `archive.html`**
   - 按时间线展示
   - 分类筛选
   - 统计信息

### Phase 4: 管理面板 (Day 6-8)

10. **实现 `github-api.js`**
    - Token 验证
    - CRUD 操作
    - 图片上传

11. **实现 `admin.html`**
    - 登录界面
    - 文章列表管理
    - 新建/编辑文章
    - Markdown 编辑器

12. **实现 `markdown-editor.js`**
    - 工具栏
    - 实时预览
    - 图片插入
    - 代码高亮

### Phase 5: 优化与测试 (Day 9-10)

13. **响应式测试**
    - 移动端适配
    - 平板适配
    - 桌面适配

14. **性能优化**
    - 图片懒加载
    - CSS/JS 压缩（可选）
    - 缓存策略

15. **兼容性处理**
    - 旧文章 URL 重定向
    - 浏览器兼容性

---

## 10. 关键技术决策

### 10.1 为什么不用 SPA 框架？
- 当前是纯静态站点，引入 React/Vue 会增加复杂度
- MDUI Web Components 已经足够
- GitHub Pages 部署简单

### 10.2 为什么用 JSON 索引而不是遍历目录？
- GitHub API 遍历目录需要多次请求
- JSON 索引一次请求获取所有文章
- 便于排序、筛选、分页

### 10.3 为什么 Markdown 存储为 HTML？
- GitHub Pages 不支持服务端渲染
- 预渲染为 HTML 可以直接展示
- 管理面板负责 Markdown ↔ HTML 转换

### 10.4 主题切换方案

```javascript
function initTheme() {
  const saved = localStorage.getItem('theme') || 'auto';
  applyTheme(saved);
}

function applyTheme(mode) {
  const html = document.documentElement;
  html.classList.remove('mdui-theme-light', 'mdui-theme-dark', 'mdui-theme-auto');
  html.classList.add(`mdui-theme-${mode}`);
  localStorage.setItem('theme', mode);
}
```

---

## 11. 与现有站点的兼容性

### 11.1 保留项
- `Articles/2502106A/` 目录结构
- `Files/` 下的图片
- `Theme/` 下的 MDUI 库
- `SubSite/` 完全不动

### 11.2 迁移项
- `index.html` → 重构为新布局
- `article.html` → 重构为文章列表
- `Articles/2502106A/index.html` → 迁移到新格式

### 11.3 URL 兼容
- 旧的 `Articles/2502106A/index.html` 可以保留一个重定向页面
- 新的访问方式：`article.html?id=2502106A`

---

## 12. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| GitHub API 限流 | 管理面板功能受限 | 缓存请求，提示用户 |
| PAT 泄露 | 仓库被篡改 | 提示用户只给 repo 权限，登出清除 |
| MDUI 版本不兼容 | 样式异常 | 锁定 2.0.6，不升级 |
| 大文件上传失败 | 图片无法上传 | 压缩图片，分块上传 |
| 浏览器兼容性 | 旧浏览器无法使用 | 渐进增强，核心功能优先 |

---

## 总结

本计划将现有站点重构为 Material You 风格的现代化个人网站，主要改进：

1. **视觉升级**：充分利用 MDUI 2.x 组件，Material You 色彩和排版
2. **响应式设计**：移动端底部导航，桌面端侧边抽屉
3. **内容管理**：GitHub API 驱动的文章管理系统
4. **开发体验**：Markdown 编辑器，实时预览
5. **可维护性**：共享布局，数据驱动，模块化代码

总工期约 10 天，可分阶段实施，每阶段都有可用的产出。
