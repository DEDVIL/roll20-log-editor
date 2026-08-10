/* =========================================================
   채록 · exporter.js (v3)
   미리보기에 쓰는 것과 동일한 읽기 설정(state.display: 스킨/폰트)을
   그대로 사용해서 티스토리 HTML / PDF / TXT / JSON 을 만든다.
   즉, 미리보기에서 본 모습 = 내보낸 결과.
   ========================================================= */

const Exporter = (() => {

  function buildMessagesHtml(messages, display, characterRoles) {
    const charFont = Utils.FONT_MAP[display.fontChar] || Utils.FONT_MAP.pretendard;
    const narrFont = Utils.FONT_MAP[display.fontNarration] || Utils.FONT_MAP.notoserif;
    const units = Grouping.build(messages, characterRoles);

    return units.map(u => {
      if (u.kind === 'roll') {
        const m = u.msg;
        const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
        return `<div class="exp-roll">
  ${m.speaker ? `<div class="exp-roll-speaker">${Utils.escapeHtml(m.speaker)}</div>` : ''}
  <div class="exp-roll-body">${bodyHtml}</div>
</div>`;
      }
      if (u.kind === 'center') {
        const m = u.msg;
        const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
        return `<div class="exp-center" style="font-family:${narrFont}">
  ${m.speaker ? `<div class="exp-center-speaker">${Utils.escapeHtml(m.speaker)}</div>` : ''}
  <div class="exp-center-body">${bodyHtml}</div>
</div>`;
      }

      // group: 아바타 + 이름 1회 → 말풍선 N개
      const nameColor = (display.useCharacterColor && u.speaker) ? Utils.colorForName(u.speaker) : 'inherit';
      const whisperTag = u.whisperTo ? ` <span class="exp-whisper">→ ${Utils.escapeHtml(u.whisperTo)}</span>` : '';
      const avatarShown = display.showAvatar !== false;
      const avatar = !avatarShown ? '' : (u.avatarUrl
        ? `<img class="exp-avatar" src="${Utils.escapeHtml(u.avatarUrl)}" alt="">`
        : `<span class="exp-avatar exp-avatar--ph" style="background:${Utils.colorForName(u.speaker || '')}">${Utils.escapeHtml((u.speaker || '').slice(0, 1))}</span>`);

      const items = u.items.map(m => {
        const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
        const isBubble = m.type === 'dialog' || m.type === 'whisper';
        return `<div class="exp-bubble-item${m.type === 'emote' ? ' exp-bubble-item--emote' : ''}">
    <span class="${isBubble ? 'exp-body exp-bubble' : 'exp-body'}">${bodyHtml}</span>
  </div>`;
      }).join('\n  ');

      return `<div class="exp-row" style="font-family:${charFont}">
  ${avatar}
  <div class="exp-row-main">
    <div class="exp-row-head"><span class="exp-speaker" style="color:${nameColor}">${Utils.escapeHtml(u.speaker || '')}</span>${whisperTag}</div>
    ${items}
  </div>
</div>`;
    }).join('\n');
  }

  function buildCoverHtml(cover) {
    if (!cover || !(cover.title || cover.subtitle || cover.author || cover.pcList || cover.date)) return '';
    return `<div class="exp-cover">
  ${cover.title ? `<div class="exp-cover-title">${Utils.escapeHtml(cover.title)}</div>` : ''}
  ${cover.subtitle ? `<div class="exp-cover-subtitle">${Utils.escapeHtml(cover.subtitle)}</div>` : ''}
  <div class="exp-cover-meta">
    ${cover.author ? `<div>작성자: ${Utils.escapeHtml(cover.author)}</div>` : ''}
    ${cover.pcList ? `<div>등장 캐릭터: ${Utils.escapeHtml(cover.pcList)}</div>` : ''}
    ${cover.date ? `<div>${Utils.escapeHtml(cover.date)}</div>` : ''}
  </div>
</div>`;
  }

  // -----------------------------------------------------
  // 티스토리 HTML
  // -----------------------------------------------------
  function buildTistoryHtml(state) {
    const skin = Utils.SKIN_MAP[state.display.skin] || Utils.SKIN_MAP.light;
    const messages = Renderer.visibleMessages(state);
    const cover = buildCoverHtml(state.cover);
    const body = buildMessagesHtml(messages, state.display, state.characterRoles);

    return `<div class="chaerok-log">
<style>
.chaerok-log{max-width:720px;margin:0 auto;background:${skin.bg};padding:26px 22px;border-radius:14px;
  line-height:${state.display.lineHeight};color:${skin.text};font-size:${state.display.fontSize}px;
  letter-spacing:${state.display.letterSpacing}px;}
.chaerok-log .exp-cover{text-align:center;padding:34px 12px 30px;margin-bottom:22px;border-bottom:1px solid ${skin.border};}
.chaerok-log .exp-cover-title{font-size:22px;font-weight:700;margin-bottom:6px;font-family:'Noto Serif KR',serif;}
.chaerok-log .exp-cover-subtitle{font-size:14px;opacity:.75;margin-bottom:14px;}
.chaerok-log .exp-cover-meta{font-size:12px;opacity:.6;}
.chaerok-log .exp-row{display:flex;gap:10px;align-items:flex-start;margin:0 0 ${state.display.paraSpacing}px;}
.chaerok-log .exp-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-top:2px;}
.chaerok-log .exp-avatar--ph{display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;}
.chaerok-log .exp-row-main{flex:1;min-width:0;}
.chaerok-log .exp-row-head{margin-bottom:4px;}
.chaerok-log .exp-speaker{font-weight:700;margin-right:6px;}
.chaerok-log .exp-whisper{font-size:.8em;opacity:.65;}
.chaerok-log .exp-bubble-item{margin:0 0 6px;}
.chaerok-log .exp-bubble-item:last-child{margin-bottom:0;}
.chaerok-log .exp-body{display:block;word-break:break-word;}
.chaerok-log .exp-body img{max-width:100%;border-radius:6px;}
.chaerok-log .exp-bubble-item--emote .exp-body{font-style:italic;opacity:.78;}
${state.display.bubble ? `.chaerok-log .exp-bubble{display:inline-block;background:${skin.card};border-radius:4px 14px 14px 14px;padding:8px 13px;}` : ''}
.chaerok-log .exp-center{text-align:center;margin:${state.display.paraSpacing}px 0;opacity:.92;}
.chaerok-log .exp-center-speaker{font-size:.8em;font-weight:700;opacity:.6;margin-bottom:2px;}
.chaerok-log .exp-center-body{white-space:pre-line;}
.chaerok-log .exp-roll{margin:10px auto;max-width:440px;background:#F4F1EA;color:#221F2E;border-radius:10px;padding:10px 16px;font-size:14px;font-family:'JetBrains Mono',monospace;}
.chaerok-log .exp-roll-speaker{font-weight:700;font-size:12px;color:#6B6578;margin-bottom:3px;}
.chaerok-log .exp-roll-body{color:#221F2E;}
.chaerok-log .exp-roll-body table{width:100%;border-collapse:collapse;color:inherit;}
.chaerok-log .exp-roll-body tr+tr{border-top:1px solid rgba(0,0,0,.08);}
.chaerok-log .exp-roll-body td,.chaerok-log .exp-roll-body th{padding:5px 8px;color:inherit;}
.chaerok-log .exp-roll-body td:first-child,.chaerok-log .exp-roll-body th:first-child{font-weight:600;opacity:.8;white-space:nowrap;}
</style>
${cover}
${body}
</div>`;
  }

  // -----------------------------------------------------
  // 인쇄(PDF) — 현재 읽기 설정(스킨/폰트)을 그대로 적용
  // -----------------------------------------------------
  function openPrintView(state) {
    const skin = Utils.SKIN_MAP[state.display.skin] || Utils.SKIN_MAP.light;
    const charFont = Utils.FONT_MAP[state.display.fontChar] || Utils.FONT_MAP.pretendard;
    const narrFont = Utils.FONT_MAP[state.display.fontNarration] || Utils.FONT_MAP.notoserif;
    const messages = Renderer.visibleMessages(state);
    const cover = buildCoverHtml(state.cover);
    const body = buildMessagesHtml(messages, state.display, state.characterRoles);
    const cssUrl = new URL('css/print.css', window.location.href).href;
    const title = state.cover.title ? state.cover.title : '채록 로그';

    const dynamicStyle = `
      body{background:${skin.bg};color:${skin.text};font-size:${state.display.fontSize}px;line-height:${state.display.lineHeight};letter-spacing:${state.display.letterSpacing}px;}
      .exp-row{font-family:${charFont};margin-bottom:${state.display.paraSpacing}px;}
      .exp-center{font-family:${narrFont};margin:${state.display.paraSpacing}px 0;}
      ${state.display.bubble ? `.exp-bubble{display:inline-block;background:${skin.card};border-radius:4px 14px 14px 14px;padding:8px 13px;}` : ''}
      ${state.display.showAvatar === false ? `.exp-avatar{display:none;}` : ''}
    `;

    const doc = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${Utils.escapeHtml(title)}</title>
<link rel="stylesheet" href="${cssUrl}">
<style>${dynamicStyle}</style>
</head><body>
<div class="print-page">
${cover}
${body}
</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) { alert('팝업이 차단되었어요. 브라우저의 팝업 차단을 해제한 뒤 다시 시도해주세요.'); return; }
    w.document.open();
    w.document.write(doc);
    w.document.close();
    const tryPrint = () => { try { w.focus(); w.print(); } catch (e) {} };
    w.onload = tryPrint;
    setTimeout(tryPrint, 700);
  }

  function buildTxt(state) {
    const messages = Renderer.visibleMessages(state);
    return messages.map(m => {
      if (m.type === 'system' || m.type === 'desc') return m.text;
      const prefix = m.speaker ? `${m.speaker}: ` : '';
      const whisper = m.whisperTo ? ` (→ ${m.whisperTo})` : '';
      return `${prefix}${m.text}${whisper}`;
    }).join('\n');
  }

  function buildJson(state) {
    return JSON.stringify({
      version: 3,
      savedAt: new Date().toISOString(),
      messages: state.messages,
      cover: state.cover,
      display: state.display,
      characterRoles: Array.from(state.characterRoles.entries())
    }, null, 2);
  }

  function parseJson(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.messages)) throw new Error('올바른 백업 파일이 아니에요.');
    return data;
  }

  return { buildTistoryHtml, openPrintView, buildTxt, buildJson, parseJson };
})();
