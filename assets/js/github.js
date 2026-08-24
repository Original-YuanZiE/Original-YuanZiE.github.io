/**
 * github.js — GitHub REST API v3 封装
 * 用于管理后台的文章发布、编辑、删除、图片上传
 */
class GitHubAPI {
  constructor(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.baseUrl = 'https://api.github.com';
  }

  get headers() {
    return {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * 验证 Token 是否有效
   * @returns {Promise<{valid: boolean, user: object|null}>}
   */
  async validateToken() {
    try {
      const resp = await fetch(`${this.baseUrl}/user`, { headers: this.headers });
      if (!resp.ok) return { valid: false, user: null };
      const user = await resp.json();
      return { valid: true, user };
    } catch (e) {
      return { valid: false, user: null };
    }
  }

  /**
   * 获取文件内容和元数据
   * @param {string} path 文件路径
   * @returns {Promise<{content: string, sha: string}|null>}
   */
  async getFile(path) {
    try {
      const resp = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
        headers: this.headers,
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return {
        content: atob(data.content.replace(/\n/g, '')),
        sha: data.sha,
        size: data.size,
      };
    } catch (e) {
      console.error('getFile error:', e);
      return null;
    }
  }

  /**
   * 创建或更新文件
   * @param {string} path 文件路径
   * @param {string} content 文件内容 (会被 base64 编码)
   * @param {string} message 提交信息
   * @param {string} [sha] 文件 SHA (更新时需要)
   * @returns {Promise<{success: boolean, data: object|null}>}
   */
  async putFile(path, content, message, sha = null) {
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) body.sha = sha;

    try {
      const resp = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      return { success: resp.ok, data };
    } catch (e) {
      console.error('putFile error:', e);
      return { success: false, data: null };
    }
  }

  /**
   * 删除文件
   * @param {string} path 文件路径
   * @param {string} message 提交信息
   * @param {string} sha 文件 SHA
   * @returns {Promise<boolean>}
   */
  async deleteFile(path, message, sha) {
    try {
      const resp = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({ message, sha }),
      });
      return resp.ok;
    } catch (e) {
      console.error('deleteFile error:', e);
      return false;
    }
  }

  /**
   * 上传图片
   * @param {File} file 图片文件
   * @param {string} path 存储路径
   * @returns {Promise<{success: boolean, url: string|null}>}
   */
  async uploadImage(file, path) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const message = `Upload image: ${path}`;
        try {
          // 检查文件是否已存在
          const existing = await this.getFile(path);
          const sha = existing ? existing.sha : null;

          const body = {
            message,
            content: base64,
          };
          if (sha) body.sha = sha;

          const resp = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(body),
          });
          const data = await resp.json();
          if (resp.ok) {
            const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${path}`;
            resolve({ success: true, url: rawUrl });
          } else {
            resolve({ success: false, url: null });
          }
        } catch (e) {
          console.error('uploadImage error:', e);
          resolve({ success: false, url: null });
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 获取文章索引
   * @returns {Promise<Array>}
   */
  async getArticleIndex() {
    const file = await this.getFile('Articles/index.json');
    if (!file) return [];
    try {
      return JSON.parse(file.content);
    } catch (e) {
      return [];
    }
  }

  /**
   * 更新文章索引
   * @param {Array} index 文章索引数组
   * @returns {Promise<boolean>}
   */
  async updateArticleIndex(index) {
    const existing = await this.getFile('Articles/index.json');
    const sha = existing ? existing.sha : null;
    const content = JSON.stringify(index, null, 2);
    const result = await this.putFile('Articles/index.json', content, 'Update article index', sha);
    return result.success;
  }

  /**
   * 发布文章
   * @param {object} article 文章元数据 { id, title, date, category, author, summary }
   * @param {string} htmlContent 渲染后的 HTML 内容
   * @param {File} [coverFile] 封面图片文件
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async publishArticle(article, htmlContent, coverFile = null) {
    try {
      // 1. 上传封面图
      if (coverFile) {
        const coverPath = `Articles/${article.id}/Cover.png`;
        const uploadResult = await this.uploadImage(coverFile, coverPath);
        if (!uploadResult.success) {
          return { success: false, message: '封面图上传失败' };
        }
        article.cover = `Articles/${article.id}/Cover.png`;
      }

      // 2. 创建文章内容文件
      const contentPath = `Articles/${article.id}/content.html`;
      const existingContent = await this.getFile(contentPath);
      const contentResult = await this.putFile(
        contentPath,
        htmlContent,
        existingContent ? `Update article: ${article.title}` : `Publish article: ${article.title}`,
        existingContent ? existingContent.sha : null
      );
      if (!contentResult.success) {
        return { success: false, message: '文章内容保存失败' };
      }

      // 3. 更新文章索引
      const index = await this.getArticleIndex();
      const existingIdx = index.findIndex(a => a.id === article.id);
      if (existingIdx >= 0) {
        index[existingIdx] = { ...index[existingIdx], ...article };
      } else {
        index.unshift(article);
      }
      const indexResult = await this.updateArticleIndex(index);
      if (!indexResult) {
        return { success: false, message: '文章索引更新失败' };
      }

      return { success: true, message: '文章发布成功！' };
    } catch (e) {
      console.error('publishArticle error:', e);
      return { success: false, message: '发布失败: ' + e.message };
    }
  }

  /**
   * 删除文章
   * @param {string} articleId 文章 ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteArticle(articleId) {
    try {
      // 1. 删除 content.html
      const contentPath = `Articles/${articleId}/content.html`;
      const contentFile = await this.getFile(contentPath);
      if (contentFile) {
        await this.deleteFile(contentPath, `Delete article content: ${articleId}`, contentFile.sha);
      }

      // 2. 删除封面图
      const coverPath = `Articles/${articleId}/Cover.png`;
      const coverFile = await this.getFile(coverPath);
      if (coverFile) {
        await this.deleteFile(coverPath, `Delete article cover: ${articleId}`, coverFile.sha);
      }

      // 3. 更新索引
      const index = await this.getArticleIndex();
      const newIndex = index.filter(a => a.id !== articleId);
      await this.updateArticleIndex(newIndex);

      return { success: true, message: '文章已删除' };
    } catch (e) {
      console.error('deleteArticle error:', e);
      return { success: false, message: '删除失败: ' + e.message };
    }
  }
}

/**
 * 管理员认证管理
 */
const Auth = (() => {
  const TOKEN_KEY = 'gh_token';
  const OWNER = 'Original-YuanZiE';
  const REPO = 'Original-YuanZiE.github.io';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function getAPI() {
    const token = getToken();
    if (!token) return null;
    return new GitHubAPI(token, OWNER, REPO);
  }

  async function login(token) {
    const api = new GitHubAPI(token, OWNER, REPO);
    const result = await api.validateToken();
    if (result.valid) {
      setToken(token);
      return { success: true, user: result.user };
    }
    return { success: false, user: null };
  }

  function logout() {
    clearToken();
  }

  return { getToken, setToken, clearToken, isLoggedIn, getAPI, login, logout, OWNER, REPO };
})();
