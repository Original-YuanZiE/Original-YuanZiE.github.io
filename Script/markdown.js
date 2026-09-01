/* ===== Markdown Renderer ===== */

const Markdown = (() => {
  let configured = false;

  // Current base path for resolving relative URLs (set per render call)
  let basePath = '';

  function configure() {
    if (configured || typeof marked === 'undefined') return;
    configured = true;

    // Custom renderer with highlight.js integration
    marked.use({
      breaks: true,
      gfm: true,
      renderer: {
        code(param) {
          const code = typeof param === 'object' ? (param.text || '') : param;
          const language = typeof param === 'object' ? (param.lang || '') : arguments[1];
          const lang = (language || '').trim();
          let highlighted;
          if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
            try {
              highlighted = hljs.highlight(code, { language: lang }).value;
            } catch (e) {
              highlighted = escapeHtml(code);
            }
          } else if (typeof hljs !== 'undefined') {
            try {
              highlighted = hljs.highlightAuto(code).value;
            } catch (e) {
              highlighted = escapeHtml(code);
            }
          } else {
            highlighted = escapeHtml(code);
          }
          return `<pre><code class="hljs${lang ? ' language-' + lang : ''}">${highlighted}</code></pre>`;
        }
      }
    });
  }

  function resolveImagePaths(html) {
    if (!basePath) return html;
    // Fix relative src in img tags (not starting with http/https/data/#)
    return html.replace(/<img\s+([^>]*?)src="((?!https?:\/\/|data:|#)[^"]+)"([^>]*)>/gi,
      (match, before, src, after) => {
        return `<img ${before}src="${basePath + src}"${after}>`;
      }
    );
  }

  function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const meta = {};
    let currentKey = null;
    let currentArray = null;

    for (const line of match[1].split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if this is an array continuation (indented line)
      if (currentArray !== null && (line.startsWith('  ') || line.startsWith('- '))) {
        const val = trimmed.replace(/^- /, '').trim().replace(/^["']|["']$/g, '');
        if (val) currentArray.push(val);
        continue;
      }

      // New key-value pair
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;

      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();

      // Check if it's an array start
      if (value === '' || value === '[]') {
        currentKey = key;
        currentArray = [];
        meta[key] = currentArray;
        continue;
      }

      // Check inline array: ["a", "b"]
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          meta[key] = JSON.parse(value);
        } catch {
          meta[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        }
        currentArray = null;
        currentKey = null;
        continue;
      }

      // Simple value
      meta[key] = value.replace(/^["']|["']$/g, '');
      currentArray = null;
      currentKey = key;
    }

    return { meta, body: match[2] };
  }

  function render(markdown, base) {
    if (typeof marked === 'undefined') {
      console.warn('marked.js not loaded');
      return markdown;
    }

    configure();
    basePath = base || '';
    const html = marked.parse(markdown);
    return resolveImagePaths(html);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { parseFrontmatter, render };
})();
