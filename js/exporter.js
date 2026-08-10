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
    const emphasisColor = display.emphasisColor || '#DB7C26';
    const units = Grouping.build(messages, characterRoles);

    return units.map(u => {
      if (u.kind === 'roll') {
        const m = u.msg;
        const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
        return `<div class="exp-roll exp-block">
  ${m.speaker ? `<div class="exp-roll-speaker">${Utils.escapeHtml(m.speaker)}</div>` : ''}
  <div class="exp-roll-body">${bodyHtml}</div>
</div>`;
      }
      if (u.kind === 'center') {
        const m = u.msg;
        const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
        const emphasis = !!(m.type === 'desc' && m.emphasis);
        const bodyStyle = emphasis ? ` style="color:${emphasisColor};font-weight:600;"` : '';
        return `<div class="exp-center exp-block" style="font-family:${narrFont}">
  ${m.speaker ? `<div class="exp-center-speaker">${Utils.escapeHtml(m.speaker)}</div>` : ''}
  <div class="exp-center-body"${bodyStyle}>${bodyHtml}</div>
</div>`;
      }

      // group: 아바타 + 이름 1회 → 이름 옆으로 이어지는 대사 줄 N개
      const nameColor = (display.useCharacterColor && u.speaker) ? Utils.colorForName(u.speaker) : 'inherit';
      const whisperTag = u.whisperTo ? ` <span class="exp-whisper">→ ${Utils.escapeHtml(u.whisperTo)}</span>` : '';
      const avatarShown = display.showAvatar !== false;
      const avatar = !avatarShown ? '' : (u.avatarUrl
        ? `<img class="exp-avatar" src="${Utils.escapeHtml(u.avatarUrl)}" alt="">`
        : `<span class="exp-avatar exp-avatar--ph" style="background:${Utils.colorForName(u.speaker || '')}">${Utils.escapeHtml((u.speaker || '').slice(0, 1))}</span>`);
      const nameText = Utils.escapeHtml(u.speaker || '');

      const lines = u.items.map((m, i) => {
        const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
        const isBubble = m.type === 'dialog' || m.type === 'whisper';
        const nameHtml = i === 0
          ? `<span class="exp-speaker" style="color:${nameColor}">${nameText}</span>${whisperTag}`
          : `<span class="exp-speaker exp-speaker--spacer">${nameText}</span>`;
        return `<div class="exp-line">
    ${nameHtml}
    <div class="exp-bubble-item${m.type === 'emote' ? ' exp-bubble-item--emote' : ''}">
      <span class="${isBubble ? 'exp-body exp-bubble' : 'exp-body'}">${bodyHtml}</span>
    </div>
  </div>`;
      }).join('\n  ');

      return `<div class="exp-row exp-block" style="font-family:${charFont}">
  ${avatar}
  <div class="exp-row-main">
    ${lines}
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
.chaerok-log .exp-block+.exp-block{margin-top:${state.display.paraSpacing}px;}
.chaerok-log .exp-row{display:flex;gap:10px;align-items:flex-start;}
.chaerok-log .exp-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-top:2px;}
.chaerok-log .exp-avatar--ph{display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;}
.chaerok-log .exp-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}
.chaerok-log .exp-line{display:flex;align-items:baseline;gap:8px;}
.chaerok-log .exp-speaker{font-weight:700;flex:0 0 auto;white-space:nowrap;}
.chaerok-log .exp-speaker--spacer{visibility:hidden;}
.chaerok-log .exp-whisper{font-size:.8em;opacity:.65;}
.chaerok-log .exp-bubble-item{flex:1 1 auto;min-width:0;margin:0;}
.chaerok-log .exp-body{display:block;word-break:break-word;}
.chaerok-log .exp-body img{max-width:100%;border-radius:6px;}
.chaerok-log .exp-bubble-item--emote .exp-body{font-style:italic;opacity:.78;}
${state.display.bubble ? `.chaerok-log .exp-bubble{display:inline-block;background:${skin.card};border-radius:4px 14px 14px 14px;padding:8px 13px;}` : ''}
.chaerok-log .exp-center{text-align:center;opacity:.92;}
.chaerok-log .exp-center-speaker{font-size:.8em;font-weight:700;opacity:.6;margin-bottom:2px;}
.chaerok-log .exp-center-body{white-space:pre-line;}
.chaerok-log .exp-roll{margin:0 auto;max-width:440px;background:#F4F1EA;color:#221F2E;border-radius:10px;padding:10px 16px;font-size:14px;font-family:'JetBrains Mono',monospace;}
.chaerok-log .exp-roll-speaker{font-weight:700;font-size:12px;color:#6B6578;margin-bottom:3px;}
.chaerok-log .exp-roll-body{color:#221F2E;}
.chaerok-log .exp-roll-body table{width:100%;border-collapse:collapse;color:inherit;}
.chaerok-log .exp-roll-body tr+tr{border-top:1px solid rgba(0,0,0,.08);}
.chaerok-log .exp-roll-body td,.chaerok-log .exp-roll-body th{padding:5px 8px;color:inherit;}
.chaerok-log .exp-roll-body td:first-child,.chaerok-log .exp-roll-body th:first-child{font-weight:600;opacity:.8;white-space:nowrap;}
${state.display.divider !== false ? `.chaerok-log .exp-block+.exp-block{border-top:1px solid ${skin.border};padding-top:calc(${state.display.paraSpacing}px/2);}
.chaerok-log .exp-line+.exp-line{border-top:1px solid ${skin.border};padding-top:6px;}` : ''}
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
      .exp-row{font-family:${charFont};}
      .exp-center{font-family:${narrFont};}
      .exp-block+.exp-block{margin-top:${state.display.paraSpacing}px;}
      ${state.display.bubble ? `.exp-bubble{display:inline-block;background:${skin.card};border-radius:4px 14px 14px 14px;padding:8px 13px;}` : ''}
      ${state.display.showAvatar === false ? `.exp-avatar{display:none;}` : ''}
      ${state.display.divider !== false ? `.exp-block+.exp-block{border-top:1px solid ${skin.border};padding-top:calc(${state.display.paraSpacing}px/2);}
      .exp-line+.exp-line{border-top:1px solid ${skin.border};padding-top:6px;}` : ''}
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

    // 새 창/탭을 띄우지 않고, 화면 밖에 숨겨둔 iframe에 인쇄용 문서를 그려서
    // 그 iframe만 인쇄한다. (같은 iframe을 재사용해서 여러 번 눌러도 창이 계속
    // 쌓이지 않게 한다.)
    let frame = document.getElementById('chaerokPrintFrame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'chaerokPrintFrame';
      frame.style.cssText = 'position:absolute; width:0; height:0; border:0; overflow:hidden;';
      document.body.appendChild(frame);
    }
    const fw = frame.contentWindow;
    fw.document.open();
    fw.document.write(doc);
    fw.document.close();

    const tryPrint = () => { try { fw.focus(); fw.print(); } catch (e) {} };
    frame.onload = tryPrint;
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
