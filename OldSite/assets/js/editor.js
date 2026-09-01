/**
 * editor.js — Markdown 编辑器（纯 HTML 版本）
 */
const Editor = (() => {
  let textarea = null;
  let previewEl = null;
  let showPreview = false;

  function init(config) {
    textarea = config.textarea;
    previewEl = config.preview;
    textarea.addEventListener('keydown', handleKeydown);
    return { insertText, togglePreview, getContent, setContent, getPreviewHtml, updatePreview };
  }

  function handleKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); wrap('**', '**'); break;
        case 'i': e.preventDefault(); wrap('*', '*'); break;
        case 'k': e.preventDefault(); insertLink(); break;
        case '`': e.preventDefault(); wrap('`', '`'); break;
        case '1': e.preventDefault(); lineStart('# '); break;
        case '2': e.preventDefault(); lineStart('## '); break;
        case '3': e.preventDefault(); lineStart('### '); break;
      }
    }
    if (e.key === 'Tab') { e.preventDefault(); insertText('    '); }
  }

  function sel() {
    return { s: textarea.selectionStart, e: textarea.selectionEnd, t: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd) };
  }

  function wrap(before, after) {
    const { s, e, t } = sel();
    const v = textarea.value;
    textarea.value = v.substring(0, s) + before + t + after + v.substring(e);
    textarea.selectionStart = s + before.length;
    textarea.selectionEnd = s + before.length + t.length;
    textarea.focus(); trigger();
  }

  function insertText(text) {
    const { s } = sel();
    const v = textarea.value;
    textarea.value = v.substring(0, s) + text + v.substring(s);
    textarea.selectionStart = textarea.selectionEnd = s + text.length;
    textarea.focus(); trigger();
  }

  function lineStart(prefix) {
    const { s, e, t } = sel();
    const ls = textarea.value.lastIndexOf('\n', s - 1) + 1;
    textarea.value = textarea.value.substring(0, ls) + prefix + textarea.value.substring(ls);
    textarea.selectionStart = textarea.selectionEnd = ls + prefix.length + t.length;
    textarea.focus(); trigger();
  }

  function insertLink() {
    const { t } = sel();
    t ? wrap('[', '](url)') : insertText('[链接文本](url)');
  }

  function insertImage(url, alt) { insertText(`\n![${alt || '图片'}](${url})\n`); }
  function insertTable() { insertText('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n'); }
  function insertCodeBlock() { const { t } = sel(); t ? wrap('\n```\n', '\n```\n') : insertText('\n```\n代码\n```\n'); }
  function insertQuote() { lineStart('> '); }
  function insertUl() { lineStart('- '); }
  function insertOl() { lineStart('1. '); }
  function insertTask() { lineStart('- [ ] '); }
  function insertHr() { insertText('\n---\n'); }

  function togglePreview() {
    showPreview = !showPreview;
    previewEl.classList.toggle('visible', showPreview);
    if (showPreview) updatePreview();
    return showPreview;
  }

  function updatePreview() {
    if (!previewEl) return;
    const html = typeof marked !== 'undefined' ? marked.parse(textarea.value) : textarea.value.replace(/</g,'&lt;').replace(/\n/g,'<br>');
    previewEl.innerHTML = `<div class="article-content">${html}</div>`;
    if (typeof hljs !== 'undefined') previewEl.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
  }

  function getContent() { return textarea.value; }
  function setContent(t) { textarea.value = t || ''; trigger(); }
  function getPreviewHtml() { return typeof marked !== 'undefined' ? marked.parse(textarea.value) : textarea.value; }
  function trigger() { if (showPreview) updatePreview(); textarea.dispatchEvent(new Event('input')); }

  return { init, insertText, insertImage, insertTable, insertCodeBlock, insertQuote, insertUl, insertOl, insertTask, insertHr, insertLink, togglePreview, getContent, setContent, getPreviewHtml, updatePreview, lineStart, wrap };
})();
