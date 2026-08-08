/* =========================================================
   채록 · renderer.js
   상태(state)를 받아 각 패널의 HTML을 문자열로 생성한다.
   실제 DOM 삽입 및 이벤트 바인딩은 app.js 에서 처리(위임 방식).
   ========================================================= */

const Renderer = (() => {

  function visibleMessages(state) {
    const { messages, activeTypeFilters, searchQuery } = state;
    const { matchedIds } = Search.run(messages, searchQuery);
    return messages.filter(m => {
      if (!activeTypeFilters.has(m.type)) return false;
      if (matchedIds && !matchedIds.has(m.id)) return false;
      return true;
    });
  }

  function renderLog(state) {
    const list = visibleMessages(state);

    if (state.messages.length === 0) {
      return `<div class="empty-state">
        <div class="empty-emoji">📜</div>
        <p>왼쪽에 Roll20 채팅 로그를 붙여넣고<br><strong>변환</strong> 버튼을 눌러주세요.</p>
      </div>`;
    }

    if (list.length === 0) {
      return `<div class="empty-state">
        <div class="empty-emoji">🔍</div>
        <p>조건에 맞는 메시지가 없어요.<br>필터나 검색어를 확인해주세요.</p>
      </div>`;
    }

    return list.map(m => renderMessage(m, state)).join('');
  }

  function renderMessage(m, state) {
    const color = m.speaker ? Utils.colorForName(m.speaker) : '#5C5868';
    const typeLabel = Utils.TYPE_LABELS[m.type] || m.type;
    const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
    const highlighted = Search.highlight(bodyHtml, state.searchQuery);

    const whisperTag = m.whisperTo
      ? `<span class="msg-whisper-tag">→ ${Utils.escapeHtml(m.whisperTo)}</span>` : '';

    const speakerBlock = m.speaker
      ? `<span class="msg-dot" style="background:${color}"></span>
         <span class="msg-speaker" style="color:${color}">${Utils.escapeHtml(m.speaker)}</span>`
      : '';

    return `
      <article class="msg msg--${m.type}" data-id="${m.id}">
        <header class="msg-head">
          ${speakerBlock}
          <span class="msg-type-tag msg-type-tag--${m.type}">${typeLabel}</span>
          ${whisperTag}
          <span class="msg-spacer"></span>
          <button class="msg-icon-btn" data-action="delete-message" data-id="${m.id}" title="이 메시지 삭제" aria-label="이 메시지 삭제">✕</button>
        </header>
        <div class="msg-body" data-action="edit-message" data-id="${m.id}">${highlighted}</div>
      </article>`;
  }

  function renderCharacters(state) {
    const chars = Characters.extract(state.messages);
    if (chars.length === 0) {
      return `<p class="hint-text">아직 인식된 캐릭터가 없어요.</p>`;
    }
    return `<ul class="char-list">` + chars.map(c => `
      <li class="char-row" data-name="${Utils.escapeHtml(c.name)}">
        <label class="char-check">
          <input type="checkbox" data-action="toggle-character" value="${Utils.escapeHtml(c.name)}"
            ${state.selectedCharacters.has(c.name) ? 'checked' : ''}>
        </label>
        <span class="char-dot" style="background:${c.color}"></span>
        <span class="char-name" data-action="rename-character" data-name="${Utils.escapeHtml(c.name)}"
          title="클릭해서 이름 변경 / 다른 이름과 합치기">${Utils.escapeHtml(c.name)}</span>
        <span class="char-count">${c.count}건</span>
      </li>`).join('') + `</ul>`;
  }

  function renderStats(state) {
    const s = Stats.compute(state.messages);
    if (s.totalMessages === 0) {
      return `<p class="hint-text">로그를 불러오면 통계가 표시돼요.</p>`;
    }

    const typeRows = Object.entries(s.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `
        <div class="stat-chip">
          <span>${Utils.TYPE_LABELS[type] || type}</span>
          <span class="stat-chip-num">${count}</span>
        </div>`).join('');

    const charRows = s.characterList.map(c => {
      const pct = s.maxCharChars ? Math.round((c.charsWithSpace / s.maxCharChars) * 100) : 0;
      const color = Utils.colorForName(c.name);
      return `
        <div class="stat-bar-row">
          <div class="stat-bar-label">
            <span>${Utils.escapeHtml(c.name)}</span>
            <span class="stat-bar-num">${c.charsWithSpace.toLocaleString()}자 · ${c.messages}건</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${pct}%; background:${color}"></div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="stat-summary">
        <div class="stat-summary-item">
          <span class="stat-summary-num">${s.totalMessages.toLocaleString()}</span>
          <span class="stat-summary-label">총 메시지</span>
        </div>
        <div class="stat-summary-item">
          <span class="stat-summary-num">${s.totalCharsWithSpace.toLocaleString()}</span>
          <span class="stat-summary-label">총 글자수(공백 포함)</span>
        </div>
        <div class="stat-summary-item">
          <span class="stat-summary-num">${s.totalCharsNoSpace.toLocaleString()}</span>
          <span class="stat-summary-label">총 글자수(공백 제외)</span>
        </div>
      </div>
      <div class="stat-type-row">${typeRows}</div>
      <div class="stat-bars">${charRows}</div>
    `;
  }

  function renderToolbarCounts(state) {
    const total = state.messages.length;
    const shown = visibleMessages(state).length;
    if (total === 0) return '';
    return shown === total
      ? `${total.toLocaleString()}개 메시지`
      : `${shown.toLocaleString()} / ${total.toLocaleString()}개 표시`;
  }

  const TYPE_ORDER = ['dialog', 'emote', 'whisper', 'roll', 'system', 'image'];

  function renderTypeFilters(state) {
    return TYPE_ORDER.filter(t => state.messages.some(m => m.type === t)).map(t => `
      <button class="chip ${state.activeTypeFilters.has(t) ? 'chip--on' : ''}"
        data-action="toggle-type" data-type="${t}">${Utils.TYPE_LABELS[t]}</button>
    `).join('');
  }

  return { renderLog, renderCharacters, renderStats, renderToolbarCounts, renderTypeFilters, visibleMessages };
})();
