/* =========================================================
   채록 · cleaner.js
   자동 정리 루틴: 말줄임표/부호 교정, 연속 중복 제거,
   숨김(this message is hidden) 메시지 제거
   ========================================================= */

const Cleaner = (() => {

  // 점 삼/육(...  ......) 및 반복 부호 교정
  function fixPunctuation(text) {
    if (!text) return text;
    let t = text;

    // 유니코드 말줄임표(…)를 점으로 통일 후 재조정
    t = t.replace(/…+/g, m => '.'.repeat(m.length * 3));

    // 점 2개 이상 연속(사이 공백 허용)을 3점 또는 6점으로 표준화
    t = t.replace(/(?:\.[ \t]?){2,}/g, m => {
      const dots = (m.match(/\./g) || []).length;
      return dots >= 5 ? '......' : '...';
    });

    // 느낌표/물음표 4개 이상 연속 → 3개로
    t = t.replace(/([!?])\1{3,}/g, '$1$1$1');

    // 물결표 통일
    t = t.replace(/[〜∼～]/g, '~');

    // 공백 2개 이상 → 1개 (줄바꿈 제외)
    t = t.replace(/[ \t]{2,}/g, ' ');

    // 문장부호 앞 불필요한 공백 제거
    t = t.replace(/[ \t]+([,.!?])/g, '$1');

    // 줄 끝 공백 제거
    t = t.split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n');

    return t.trim();
  }

  function applyPunctuationFix(messages) {
    let changed = 0;
    const next = messages.map(m => {
      if (m.type === 'system') return m;
      const fixedText = fixPunctuation(m.text);
      if (fixedText === m.text) return m;
      changed++;
      // html 에도 동일 규칙 적용(태그는 보존하고 텍스트 노드만 치환)
      const html = fixHtmlText(m.html);
      return { ...m, text: fixedText, html };
    });
    return { messages: next, changed };
  }

  function fixHtmlText(html) {
    if (!html) return html;
    const container = document.createElement('div');
    container.innerHTML = html;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);
    textNodes.forEach(node => {
      node.textContent = fixPunctuation(node.textContent);
    });
    return container.innerHTML;
  }

  // 연속으로 완전히 동일한 메시지(같은 화자/타입/텍스트) 제거
  function dedupeConsecutive(messages) {
    const result = [];
    let removed = 0;
    for (const m of messages) {
      const prev = result[result.length - 1];
      if (prev && prev.type === m.type && prev.speaker === m.speaker &&
          prev.text === m.text && m.text) {
        removed++;
        continue;
      }
      result.push(m);
    }
    return { messages: result, removed };
  }

  // 숨김 메시지 제거
  function removeHidden(messages) {
    const before = messages.length;
    const result = messages.filter(m => !m.hidden);
    return { messages: result, removed: before - result.length };
  }

  return { fixPunctuation, applyPunctuationFix, dedupeConsecutive, removeHidden };
})();
