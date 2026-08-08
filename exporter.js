/* =========================================================
   채록 · exporter.js
   티스토리용 HTML / 인쇄(PDF) / TXT / JSON 백업 내보내기
   ========================================================= */

const Exporter = (() => {

  // -----------------------------------------------------
  // 공용: 내보내기용 메시지 마크업 (Tistory / 인쇄 공용 클래스 사용)
  // -----------------------------------------------------
  function buildMessagesHtml(messages, theme) {
    return messages.map(m => {
      const color = (theme.useCharacterColor && m.speaker) ? Utils.colorForName(m.speaker) : theme.text;
      const typeLabel = Utils.TYPE_LABELS[m.type] || m.type;
      const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
      const whisperTag = m.whisperTo ? ` <span class="exp-whisper">→ ${Utils.escapeHtml(m.whisperTo)}</span>` : '';
      const speakerBlock = m.speaker
        ? `<span class="exp-speaker" style="color:${color}">${Utils.escapeHtml(m.speaker)}</span>`
        : '';
      return `<div class="exp-msg exp-msg--${m.type}">
  <div class="exp-head">${speakerBlock}<span class="exp-type">${typeLabel}</span>${whisperTag}</div>
  <div class="exp-body">${bodyHtml}</div>
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
  // 티스토리 HTML (자체 <style> 포함, 붙여넣으면 바로 표시됨)
  // -----------------------------------------------------
  function buildTistoryHtml(state) {
    const theme = state.exportTheme;
    const messages = Renderer.visibleMessages(state);
    const cover = buildCoverHtml(state.cover);
    const body = buildMessagesHtml(messages, theme);

    return `<div class="chaerok-log">
<style>
.chaerok-log{max-width:720px;margin:0 auto;background:${theme.bg};padding:24px;border-radius:14px;
  font-family:'Apple SD Gothic Neo','Malgun Gothic','Pretendard',sans-serif;line-height:1.7;}
.chaerok-log .exp-cover{text-align:center;padding:32px 12px 28px;margin-bottom:20px;border-bottom:1px solid rgba(128,128,128,.25);}
.chaerok-log .exp-cover-title{font-size:22px;font-weight:700;color:${theme.text};margin-bottom:6px;}
.chaerok-log .exp-cover-subtitle{font-size:14px;color:${theme.text};opacity:.75;margin-bottom:14px;}
.chaerok-log .exp-cover-meta{font-size:12px;color:${theme.text};opacity:.6;}
.chaerok-log .exp-msg{background:${theme.bubbleBg};border-radius:10px;padding:10px 14px;margin:0 0 10px;}
.chaerok-log .exp-msg--system{background:transparent;text-align:center;opacity:.6;font-size:12px;padding:4px;}
.chaerok-log .exp-head{font-size:12px;margin-bottom:4px;opacity:.85;}
.chaerok-log .exp-speaker{font-weight:700;margin-right:6px;}
.chaerok-log .exp-type{font-size:11px;opacity:.55;}
.chaerok-log .exp-whisper{font-size:11px;opacity:.6;margin-left:6px;}
.chaerok-log .exp-body{color:${theme.text};font-size:15px;word-break:break-word;}
.chaerok-log .exp-body img{max-width:100%;border-radius:6px;}
</style>
${cover}
${body}
</div>`;
  }

  // -----------------------------------------------------
  // 인쇄(PDF) 뷰: 새 창을 열어 print.css 를 적용하고 인쇄 대화상자 호출
  // -----------------------------------------------------
  function openPrintView(state) {
    const theme = { bg: '#ffffff', bubbleBg: '#f4f2ef', text: '#1c1a22', useCharacterColor: state.exportTheme.useCharacterColor };
    const messages = Renderer.visibleMessages(state);
    const cover = buildCoverHtml(state.cover);
    const body = buildMessagesHtml(messages, theme);
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
    if (!w) {
      alert('팝업이 차단되었어요. 브라우저의 팝업 차단을 해제한 뒤 다시 시도해주세요.');
      return;
    }
    w.document.open();
    w.document.write(doc);
    w.document.close();
    const tryPrint = () => { try { w.focus(); w.print(); } catch (e) { /* noop */ } };
    w.onload = tryPrint;
    setTimeout(tryPrint, 700);
  }

  // -----------------------------------------------------
  // TXT 내보내기
  // -----------------------------------------------------
  function buildTxt(state) {
    const messages = Renderer.visibleMessages(state);
    return messages.map(m => {
      if (m.type === 'system') return `[시스템] ${m.text}`;
      const prefix = m.speaker ? `${m.speaker}: ` : '';
      const whisper = m.whisperTo ? ` (→ ${m.whisperTo})` : '';
      return `${prefix}${m.text}${whisper}`;
    }).join('\n');
  }

  // -----------------------------------------------------
  // JSON 백업 / 복원
  // -----------------------------------------------------
  function buildJson(state) {
    return JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      messages: state.messages,
      cover: state.cover,
      exportTheme: state.exportTheme
    }, null, 2);
  }

  function parseJson(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.messages)) throw new Error('올바른 백업 파일이 아니에요.');
    return data;
  }

  return { buildTistoryHtml, openPrintView, buildTxt, buildJson, parseJson };
})();
