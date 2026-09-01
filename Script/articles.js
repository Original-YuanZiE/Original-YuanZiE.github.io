/* ===== Article Loader ===== */

const Articles = (() => {
  let index = null;
  let loadError = null;

  async function loadIndex() {
    if (index) return index;
    try {
      const res = await fetch('Posts/index.json');
      if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText);
      index = await res.json();
      loadError = null;
      // Sort by date descending
      index.sort((a, b) => new Date(b.date) - new Date(a.date));
      return index;
    } catch (e) {
      console.error('Failed to load article index:', e);
      loadError = e.message;
      return [];
    }
  }

  function getLoadError() {
    return loadError;
  }

  async function loadArticle(id) {
    try {
      const res = await fetch(`Posts/${id}/main.md`);
      if (!res.ok) throw new Error(`Article not found: ${id}`);
      const raw = await res.text();
      return Markdown.parseFrontmatter(raw);
    } catch (e) {
      console.error('Failed to load article:', e);
      return null;
    }
  }

  function getRecent(count = 5) {
    if (!index) return [];
    return index.slice(0, count);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return { loadIndex, loadArticle, getRecent, formatDate, getLoadError };
})();
