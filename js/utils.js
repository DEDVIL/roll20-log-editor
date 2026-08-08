/* =========================================================
   채록 · utils.js
   공용 헬퍼 함수 모음
   ========================================================= */

const Utils = (() => {

  let idSeed = 0;
  function nextId(prefix = 'm') {
    idSeed += 1;
    return `${prefix}_${Date.now().toString(36)}_${idSeed.toString(36)}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 공백 포함 / 제외 글자수
  function countChars(text, includeSpaces = true) {
    if (!text) return 0;
    return includeSpaces ? text.length : text.replace(/\s/g, '').length;
  }

  function debounce(fn, wait = 200) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // 문자열 → 안정적인 해시 (캐릭터 색상 시드용)
  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  // 캐릭터별 자동 색상 팔레트 (다크 테마 위에서 잘 보이는 채도 높은 색상들을 고정 순환)
  const AUTO_PALETTE = [
    '#D98E5A', '#7FB2D9', '#C97BA0', '#8FBF8A', '#C9A15C',
    '#9E8FD9', '#5FB5A8', '#D9748A', '#7FA6C9', '#B5A05C',
    '#A88FC9', '#6FBF9E', '#D9A25C', '#7F9FD9', '#C98F7B'
  ];
  function colorForName(name) {
    if (!name) return '#8A8694';
    const idx = hashString(name) % AUTO_PALETTE.length;
    return AUTO_PALETTE[idx];
  }

  function download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function formatDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  const TYPE_LABELS = {
    dialog: '대사',
    emote: '감정',
    whisper: '귓속말',
    roll: '판정',
    system: '시스템',
    desc: '내레이션',
    image: '이미지'
  };

  return {
    nextId, escapeHtml, countChars, debounce, hashString,
    colorForName, download, formatDate, clamp, TYPE_LABELS, AUTO_PALETTE
  };
})();
