/**
 * admin.js — 管理后台逻辑（纯 HTML 版本）
 */
const Admin = (() => {
  let api = null;
  let editor = null;
  let editingId = null;
  let coverFile = null;

  function renderLogin(main) {
    main.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card card-elevated">
          <span class="material-symbols-rounded big-icon icon-filled">admin_panel_settings</span>
          <h1>管理后台</h1>
          <p>使用 GitHub Personal Access Token 登录<br>
          前往 GitHub Settings → Developer settings → Personal access tokens 创建<br>
          需要 repo 权限</p>
          <div class="text-field">
            <input type="password" id="token-input" placeholder=" " autocomplete="off">
            <label>GitHub Token</label>
          </div>
          <button class="btn btn-filled" id="login-btn" style="width:100%;">
            <span class="material-symbols-rounded">login</span> 登录
          </button>
          <p class="login-error" id="login-error"></p>
        </div>
      </div>
    `;

    const btn = document.getElementById('login-btn');
    const input = document.getElementById('token-input');
    const err = document.getElementById('login-error');

    btn.addEventListener('click', async () => {
      const token = input.value.trim();
      if (!token) { err.textContent = '请输入 Token'; err.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = '验证中...'; err.style.display = 'none';
      const r = await Auth.login(token);
      btn.disabled = false; btn.innerHTML = '<span class="material-symbols-rounded">login</span> 登录';
      if (r.success) { App.showSnackbar(`登录成功，欢迎 ${r.user.login}`); renderDashboard(main); }
      else { err.textContent = 'Token 无效或已过期'; err.style.display = 'block'; }
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
  }

  async function renderDashboard(main) {
    api = Auth.getAPI();
    if (!api) { renderLogin(main); return; }

    main.innerHTML = `
      <div class="page-container fade-in">
        <div class="admin-header">
          <h1>文章管理</h1>
          <div class="flex-center gap-8">
            <button class="btn btn-filled" id="new-btn"><span class="material-symbols-rounded">add</span> 新建文章</button>
            <button class="btn btn-outlined" id="logout-btn"><span class="material-symbols-rounded">logout</span> 退出</button>
          </div>
        </div>
        <div id="admin-stats" class="admin-stats"></div>
        <div id="admin-content"><div class="loading-center"><div class="spinner"></div></div></div>
      </div>
    `;

    document.getElementById('new-btn').addEventListener('click', () => renderEditor(main, null));
    document.getElementById('logout-btn').addEventListener('click', () => { Auth.logout(); App.showSnackbar('已退出'); renderLogin(main); });
    await loadList(main);
  }

  async function loadList(main) {
    const el = document.getElementById('admin-content');
    const stats = document.getElementById('admin-stats');
    try {
      const articles = await api.getArticleIndex();
      stats.innerHTML = `<div class="stat-card card-elevated"><div class="stat-number">${articles.length}</div><div class="stat-label">文章总数</div></div>`;

      if (!articles.length) {
        el.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded">article</span><p>暂无文章，点击上方按钮创建</p></div>';
        return;
      }

      const rows = articles.map(a => `
        <tr>
          <td style="font-weight:500;">${App.escapeHtml(a.title)}</td>
          <td><span class="chip chip-sm">${App.escapeHtml(a.category || '未分类')}</span></td>
          <td>${a.date}</td>
          <td>${App.escapeHtml(a.author || '')}</td>
          <td>
            <button class="btn-icon" title="编辑" onclick="Admin.edit('${a.id}')"><span class="material-symbols-rounded">edit</span></button>
            <button class="btn-icon" title="删除" onclick="Admin.confirmDelete('${a.id}','${App.escapeHtml(a.title).replace(/'/g,"\\'")}')"><span class="material-symbols-rounded">delete</span></button>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="table-wrapper">
          <table class="admin-table"><thead><tr><th>标题</th><th>分类</th><th>日期</th><th>作者</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>
        </div>
      `;
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">error_outline</span><p>加载失败: ${e.message}</p></div>`;
    }
  }

  async function renderEditor(main, article) {
    editingId = article ? article.id : genId();
    coverFile = null;

    main.innerHTML = `
      <div class="page-container fade-in">
        <div class="admin-header">
          <h1>${article ? '编辑文章' : '新建文章'}</h1>
          <div class="flex-center gap-8">
            <button class="btn btn-filled" id="publish-btn"><span class="material-symbols-rounded">publish</span> 发布</button>
            <button class="btn btn-outlined" id="cancel-btn"><span class="material-symbols-rounded">close</span> 取消</button>
          </div>
        </div>

        <div class="editor-meta-grid">
          <div class="text-field"><input id="f-title" placeholder=" " value="${article ? App.escapeHtml(article.title) : ''}"><label>文章标题</label></div>
          <div class="text-field"><input id="f-category" placeholder=" " value="${article ? App.escapeHtml(article.category || '') : ''}"><label>分类</label></div>
          <div class="text-field"><input id="f-author" placeholder=" " value="${article ? App.escapeHtml(article.author || '元子鹅') : '元子鹅'}"><label>作者</label></div>
          <div class="text-field"><input id="f-summary" placeholder=" " value="${article ? App.escapeHtml(article.summary || '') : ''}"><label>摘要</label></div>
          <div class="editor-meta-full cover-upload">
            <button class="btn btn-filled-tonal" id="cover-btn"><span class="material-symbols-rounded">image</span> 选择封面图</button>
            <img id="cover-preview" class="cover-preview ${article && article.cover ? 'visible' : ''}" src="${article && article.cover ? './' + article.cover : ''}" alt="">
            <input type="file" id="cover-input" accept="image/*" style="display:none;">
            <span id="cover-name" style="font-size:14px;color:var(--md-on-surface-variant);"></span>
          </div>
        </div>

        <div>
          <div class="editor-toolbar">
            <button class="btn-icon" title="标题1 (Ctrl+1)" onclick="Editor.lineStart('# ')"><span class="material-symbols-rounded">format_h1</span></button>
            <button class="btn-icon" title="标题2 (Ctrl+2)" onclick="Editor.lineStart('## ')"><span class="material-symbols-rounded">format_h2</span></button>
            <button class="btn-icon" title="标题3 (Ctrl+3)" onclick="Editor.lineStart('### ')"><span class="material-symbols-rounded">format_h3</span></button>
            <div class="toolbar-divider"></div>
            <button class="btn-icon" title="加粗 (Ctrl+B)" onclick="Editor.wrap('**','**')"><span class="material-symbols-rounded">format_bold</span></button>
            <button class="btn-icon" title="斜体 (Ctrl+I)" onclick="Editor.wrap('*','*')"><span class="material-symbols-rounded">format_italic</span></button>
            <button class="btn-icon" title="删除线" onclick="Editor.wrap('~~','~~')"><span class="material-symbols-rounded">strikethrough_s</span></button>
            <div class="toolbar-divider"></div>
            <button class="btn-icon" title="无序列表" onclick="Editor.insertUl()"><span class="material-symbols-rounded">format_list_bulleted</span></button>
            <button class="btn-icon" title="有序列表" onclick="Editor.insertOl()"><span class="material-symbols-rounded">format_list_numbered</span></button>
            <button class="btn-icon" title="任务列表" onclick="Editor.insertTask()"><span class="material-symbols-rounded">checklist</span></button>
            <div class="toolbar-divider"></div>
            <button class="btn-icon" title="链接 (Ctrl+K)" onclick="Editor.insertLink()"><span class="material-symbols-rounded">link</span></button>
            <button class="btn-icon" title="插入图片" onclick="Admin.insertImage()"><span class="material-symbols-rounded">image</span></button>
            <button class="btn-icon" title="表格" onclick="Editor.insertTable()"><span class="material-symbols-rounded">table_chart</span></button>
            <div class="toolbar-divider"></div>
            <button class="btn-icon" title="代码块" onclick="Editor.insertCodeBlock()"><span class="material-symbols-rounded">code</span></button>
            <button class="btn-icon" title="引用" onclick="Editor.insertQuote()"><span class="material-symbols-rounded">format_quote</span></button>
            <button class="btn-icon" title="分割线" onclick="Editor.insertHr()"><span class="material-symbols-rounded">horizontal_rule</span></button>
            <div style="flex:1"></div>
            <button class="btn-icon" title="切换预览" id="preview-btn" onclick="Admin.togglePreview()"><span class="material-symbols-rounded">visibility</span></button>
          </div>
          <div class="editor-body">
            <textarea id="editor-textarea" class="editor-textarea" placeholder="在这里输入 Markdown 内容..."></textarea>
            <div id="editor-preview" class="editor-preview article-content"></div>
          </div>
        </div>
      </div>
    `;

    editor = Editor.init({
      textarea: document.getElementById('editor-textarea'),
      preview: document.getElementById('editor-preview')
    });

    // Load existing content
    if (article) {
      try {
        const c = await App.loadArticleContent(article.id);
        if (c) document.getElementById('editor-textarea').value = c;
      } catch {}
    }

    // Events
    document.getElementById('publish-btn').addEventListener('click', publish);
    document.getElementById('cancel-btn').addEventListener('click', () => renderDashboard(main));

    const cb = document.getElementById('cover-btn');
    const ci = document.getElementById('cover-input');
    const cp = document.getElementById('cover-preview');
    const cn = document.getElementById('cover-name');
    cb.addEventListener('click', () => ci.click());
    ci.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      coverFile = f; cn.textContent = f.name;
      const r = new FileReader();
      r.onload = ev => { cp.src = ev.target.result; cp.classList.add('visible'); };
      r.readAsDataURL(f);
    });
  }

  function togglePreview() {
    const showing = Editor.togglePreview();
    document.getElementById('preview-btn').querySelector('.material-symbols-rounded').textContent = showing ? 'edit' : 'visibility';
  }

  async function publish() {
    const title = document.getElementById('f-title').value.trim();
    const content = Editor.getContent();
    if (!title) { App.showSnackbar('请输入标题', true); return; }
    if (!content.trim()) { App.showSnackbar('请输入内容', true); return; }

    const btn = document.getElementById('publish-btn');
    btn.disabled = true; btn.textContent = '发布中...';

    try {
      const html = Editor.getPreviewHtml();
      const fullHtml = `<!DOCTYPE html>\n<html lang="zh-cn">\n<head><meta charset="utf-8"><title>${App.escapeHtml(title)}</title></head>\n<body>\n${html}\n</body>\n</html>`;

      const article = {
        id: editingId, title,
        date: new Date().toISOString().split('T')[0],
        category: document.getElementById('f-category').value.trim() || '其他',
        author: document.getElementById('f-author').value.trim() || '元子鹅',
        summary: document.getElementById('f-summary').value.trim() || App.stripHtml(html).slice(0, 100),
      };

      const r = await api.publishArticle(article, fullHtml, coverFile);
      if (r.success) { App.showSnackbar('发布成功！'); setTimeout(() => renderDashboard(document.getElementById('main-content')), 1000); }
      else { App.showSnackbar(r.message, true); }
    } catch (e) { App.showSnackbar('发布失败: ' + e.message, true); }
    finally { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-rounded">publish</span> 发布'; }
  }

  function genId() {
    const d = new Date();
    return String(d.getFullYear()).slice(2) + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0');
  }

  async function edit(id) {
    const articles = await api.getArticleIndex();
    const a = articles.find(x => x.id === id);
    if (a) renderEditor(document.getElementById('main-content'), a);
    else App.showSnackbar('文章未找到', true);
  }

  function confirmDelete(id, title) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay open';
    overlay.innerHTML = `
      <div class="dialog">
        <div class="dialog-title">确认删除</div>
        <div class="dialog-body">确定要删除「${title}」吗？此操作不可撤销。</div>
        <div class="dialog-actions">
          <button class="btn btn-text" id="dlg-cancel">取消</button>
          <button class="btn btn-filled" id="dlg-ok" style="background:var(--md-error);color:var(--md-on-error);">删除</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('dlg-cancel').addEventListener('click', () => overlay.remove());
    document.getElementById('dlg-ok').addEventListener('click', async () => {
      overlay.remove();
      const r = await api.deleteArticle(id);
      if (r.success) { App.showSnackbar('已删除'); loadList(document.getElementById('main-content')); }
      else App.showSnackbar(r.message, true);
    });
  }

  async function insertImage() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      App.showSnackbar('正在上传...');
      const r = await api.uploadImage(f, `Files/uploads/${Date.now()}_${f.name}`);
      if (r.success) { Editor.insertImage(r.url, f.name.replace(/\.[^.]+$/, '')); App.showSnackbar('上传成功'); }
      else App.showSnackbar('上传失败', true);
    });
    input.click();
  }

  return { renderLogin, renderDashboard, edit, confirmDelete, togglePreview, insertImage };
})();
