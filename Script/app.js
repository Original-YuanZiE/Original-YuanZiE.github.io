/* ===== App Entry Point ===== */

const App = (() => {
  const appEl = () => document.getElementById('app');

  // SVG Icons
  const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    articles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  };

  // --- Page Renderers ---

  function showBackButton(visible) {
    const btn = document.getElementById('back-btn');
    if (btn) btn.style.display = visible ? 'flex' : 'none';
  }

  async function renderHome() {
    showBackButton(false);
    const el = appEl();
    el.innerHTML = '<div class="main-content"><div class="loading">加载中...</div></div>';

    const articles = await Articles.loadIndex();
    const recent = articles.slice(0, 5);
    const error = Articles.getLoadError();

    el.innerHTML = `
      <div class="main-content">
        <div class="hero">
          <div class="hero-avatar">
            <img src="Assets/avatar.png" alt="头像" onerror="this.style.display='none'">
          </div>
          <h1 class="hero-name">元子鹅</h1>
          <p class="hero-bio">欢迎来到我的个人博客，这里记录着我的思考与创作。</p>
        </div>
        <div class="section-header">
          <h2 class="section-title">最新文章</h2>
          ${articles.length > 5 ? '<a href="#/articles" class="section-link">查看全部</a>' : ''}
        </div>
        ${error ? '<div class="empty-state"><p style="color:var(--color-accent)">加载失败: ' + escapeHtml(error) + '<br><small>请通过 HTTP 服务器访问（如 <code>npx serve .</code>），而非直接打开 HTML 文件</small></p></div>' : ''}
        <div class="article-list">
          ${recent.length ? recent.map(renderArticleItem).join('') : `
            ${!error ? `<div class="empty-state">${ICONS.empty}<p>暂无文章</p></div>` : ''}
          `}
        </div>
      </div>
    `;
  }

  async function renderArticleList() {
    showBackButton(false);
    const el = appEl();
    el.innerHTML = '<div class="main-content"><div class="loading">加载中...</div></div>';

    const articles = await Articles.loadIndex();
    const error = Articles.getLoadError();

    el.innerHTML = `
      <div class="main-content">
        <h1 class="page-title">文章</h1>
        ${error ? '<div class="empty-state"><p style="color:var(--color-accent)">加载失败: ' + escapeHtml(error) + '<br><small>请通过 HTTP 服务器访问（如 <code>npx serve .</code>），而非直接打开 HTML 文件</small></p></div>' : ''}
        <div class="article-list">
          ${articles.length ? articles.map(renderArticleItem).join('') : `
            ${!error ? `<div class="empty-state">${ICONS.empty}<p>暂无文章</p></div>` : ''}
          `}
        </div>
      </div>
    `;
  }

  async function renderArticle(id) {
    showBackButton(true);
    const el = appEl();
    el.innerHTML = '<div class="main-content"><div class="loading">加载中...</div></div>';

    const data = await Articles.loadArticle(id);
    if (!data) {
      el.innerHTML = `
        <div class="main-content">
          <div class="empty-state">
            ${ICONS.empty}
            <p>文章不存在或加载失败</p>
          </div>
        </div>
      `;
      return;
    }

    const { meta, body } = data;
    const title = meta.title || '无标题';
    const date = meta.date ? Articles.formatDate(meta.date) : '';
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const cover = meta.cover || '';

    const html = Markdown.render(body, 'Posts/' + id + '/');

    el.innerHTML = `
      <div class="main-content">
        <article>
          <div class="article-header">
            <h1>${escapeHtml(title)}</h1>
            <div class="article-meta">
              ${date ? '<span>' + date + '</span>' : ''}
              ${tags.length ? '<div class="article-item-tags">' + tags.map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join('') + '</div>' : ''}
            </div>
          </div>
          ${cover ? `<div class="article-cover"><img src="Posts/${id}/${cover}" alt="${escapeHtml(title)}" onerror="this.parentElement.style.display='none'"></div>` : ''}
          <div class="article-body">${html}</div>
        </article>
      </div>
    `;

    window.scrollTo(0, 0);
  }

  function renderAbout() {
    showBackButton(false);
    const el = appEl();
    el.innerHTML = `
      <div class="main-content">
        <div class="about-content">
          <div class="about-avatar">
            <img src="Assets/avatar.png" alt="头像" onerror="this.style.display='none'">
          </div>
          <h1>关于</h1>
          <p style="color: var(--color-ink-secondary); margin-top: 1rem; max-width: 480px; margin-left: auto; margin-right: auto;">
            这是元子鹅的个人博客。在这里，我分享关于技术、生活和创意的想法。
          </p>
        </div>
      </div>
    `;
  }

  // --- Helpers ---

  function renderArticleItem(article) {
    const date = article.date ? Articles.formatDate(article.date) : '';
    const tags = Array.isArray(article.tags) ? article.tags : [];
    const title = article.title || '无标题';
    const summary = article.summary || '';

    return `
      <a class="article-item" href="#/articles/${article.id}">
        <div class="article-item-header">
          ${date ? '<span class="article-item-date">' + date + '</span>' : ''}
        </div>
        <div class="article-item-title">${escapeHtml(title)}</div>
        ${summary ? '<div class="article-item-summary">' + escapeHtml(summary) + '</div>' : ''}
        ${tags.length ? '<div class="article-item-tags">' + tags.map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join('') + '</div>' : ''}
      </a>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Init ---

  function init() {
    // Init theme first (prevents flash)
    Theme.init();

    // Register routes
    Router.add('/', renderHome);
    Router.add('/articles', renderArticleList);
    Router.add('/articles/:id', renderArticle);
    Router.add('/about', renderAbout);

    // Init sidebar
    Sidebar.init();

    // Init router
    Router.init();

    // Bind theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', Theme.cycle);
    }
  }

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
