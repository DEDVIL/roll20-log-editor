/* =========================================================
   채록 · search.js
   검색어에 매칭되는 메시지 id 목록과 하이라이트된 HTML 생성
   ========================================================= */

const Search = (() => {

  function run(messages, query) {
    const q = (query || '').trim();
    if (!q) return { matchedIds: null, count: 0 };

    const lower = q.toLowerCase();
    const matched = messages.filter(m =>
      (m.text && m.text.toLowerCase().includes(lower)) ||
      (m.speaker && m.speaker.toLowerCase().includes(lower))
    );

    return { matchedIds: new Set(matched.map(m => m.id)), count: matched.length };
  }

  function highlight(html, query) {
    if (!query || !query.trim()) return html;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'ig');
    const container = document.createElement('div');
    container.innerHTML = html;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      if (!re.test(node.textContent)) return;
      re.lastIndex = 0;
      const span = document.createElement('span');
      span.innerHTML = Utils.escapeHtml(node.textContent).replace(re, '<mark class="hl">$1</mark>');
      node.replaceWith(...span.childNodes);
    });
    return container.innerHTML;
  }

  return { run, highlight };
})();
