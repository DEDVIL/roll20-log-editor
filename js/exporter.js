/* =========================================================
   채록 · exporter.js (v2)
   티스토리용 HTML / 인쇄(PDF) / TXT / JSON 백업 내보내기
   화면과 동일한 정렬 규칙(대사=아바타+왼쪽, 내레이션=중앙, 판정=구조 보존)을 사용한다.
   ========================================================= */

const Exporter = (() => {

  function buildMessagesHtml(messages, theme, characterRoles) {
    return messages.map(m => {
      const role = m.speaker ? characterRoles.get(m.speaker) : null;
      let align = 'row';
      if (role === 'narration') align = 'center';
      else if (role === 'character') align = 'row';
      else if (m.type === 'roll') align = 'roll';
      else if (m.type === 'desc' || m.type === 'system') align = 'center';

      const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
      const color = (theme.useCharacterColor && m.speaker) ? Utils.colorForName(m.speaker) : theme.text;

      if (align === 'roll') {
        return `<div class="exp-roll">
  ${m.speaker ? `<div class="exp-roll-speaker" style="color:${color}">${Utils.escapeHtml(m.speaker)}</div>` : ''}
  <div class="exp-roll-body">${bodyHtml}</div>
</div>`;
      }
      if (align === 'center') {
        return `<div class="exp-center">
  ${m.speaker ? `<div class="exp-center-speaker">${Utils.escapeHtml(m.speaker)}</div>` : ''}
  <div class="exp-center-body">${bodyHtml}</div>
</div>`;
      }

      const whisperTag = m.whisperTo ? ` <span class="exp-whisper">→ ${Utils.escapeHtml(m.whisperTo)}</span>` : '';
      const avatar = m.avatarUrl
        ? `<img class="exp-avatar" src="${Utils.escapeHtml(m.avatarUrl)}" alt="">`
        : `<span class="exp-avatar exp-avatar--ph" style="background:${Utils.colorForName(m.speaker || '')}">${Utils.escapeHtml((m.speaker || '').slice(0, 1))}</span>`;

      return `<div class="exp-row">
  ${avatar}
  <div class="exp-row-main">
    <span class="exp-speaker" style="color:${color}">${Utils.escapeHtml(m.speaker || '')}</span>${whisperTag}
    <span class="exp-body">${bodyHtml}</span>
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
    const theme = state.exportTheme;
    const messages = Renderer.visibleMessages(state);
    const cover = buildCoverHtml(state.cover);
    const body = buildMessagesHtml(messages, theme, state.characterRoles);

    return `<div class="chaerok-log">
<style>
.chaerok-log{max-width:720px;margin:0 auto;background:${theme.bg};padding:26px 22px;border-radius:14px;
  font-family:'Apple SD Gothic Neo','Malgun Gothic','Pretendard',sans-serif;line-height:1.75;color:${theme.text};}
.chaerok-log .exp-cover{text-align:center;padding:34px 12px 30px;margin-bottom:22px;border-bottom:1px solid rgba(128,128,128,.25);}
.chaerok-log .exp-cover-title{font-size:22px;font-weight:700;margin-bottom:6px;}
.chaerok-log .exp-cover-subtitle{font-size:14px;opacity:.75;margin-bottom:14px;}
.chaerok-log .exp-cover-meta{font-size:12px;opacity:.6;}
.chaerok-log .exp-row{display:flex;gap:10px;align-items:flex-start;margin:0 0 12px;}
.chaerok-log .exp-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-top:2px;}
.chaerok-log .exp-avatar--ph{display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;}
.chaerok-log .exp-row-main{flex:1;min-width:0;}
.chaerok-log .exp-speaker{font-weight:700;margin-right:6px;}
.chaerok-log .exp-whisper{font-size:12px;opacity:.65;}
.chaerok-log .exp-body{display:block;word-break:break-word;margin-top:2px;}
.chaerok-log .exp-body img{max-width:100%;border-radius:6px;}
.chaerok-log .exp-center{text-align:center;margin:14px 0;opacity:.92;}
.chaerok-log .exp-center-speaker{font-size:12px;font-weight:700;opacity:.6;margin-bottom:2px;}
.chaerok-log .exp-center-body{white-space:pre-line;}
.chaerok-log .exp-roll{margin:10px auto;max-width:440px;background:#F4F1EA;color:#221F2E;border-radius:10px;padding:10px 16px;font-size:14px;}
.chaerok-log .exp-roll-speaker{font-weight:700;font-size:12px;color:#6B6578;margin-bottom:3px;}
.chaerok-log .exp-roll-body{color:#221F2E;}
.chaerok-log .exp-roll-body table{width:100%;border-collapse:collapse;color:inherit;}
.chaerok-log .exp-roll-body td,.chaerok-log .exp-roll-body th{padding:4px 6px;color:inherit;}
</style>
${cover}
${body}
</div>`;
  }

  // -----------------------------------------------------
  // 인쇄(PDF)
  // -----------------------------------------------------
  function openPrintView(state) {
    const theme = { bg: '#ffffff', bubbleBg: '#f4f2ef', text: '#1c1a22', useCharacterColor: state.exportTheme.useCharacterColor };
    const messages = Renderer.visibleMessages(state);
    const cover = buildCoverHtml(state.cover);
    const body = buildMessagesHtml(messages, theme, state.characterRoles);
    const cssUrl = new URL('css/print.css', window.location.href).href;
    const title = state.cover.title ? state.cover.title : '채록 로그';

    const doc = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${Utils.escapeHtml(title)}</title>
<link rel="stylesheet" href="${cssUrl}">
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
      version: 2,
      savedAt: new Date().toISOString(),
      messages: state.messages,
      cover: state.cover,
      exportTheme: state.exportTheme,
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
