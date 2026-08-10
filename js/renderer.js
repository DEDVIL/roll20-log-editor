/* =========================================================
   채록 · renderer.js (v3)
   상태(state)를 받아 각 패널의 HTML을 문자열로 생성한다.
   대사는 Grouping 모듈로 묶어 "아바타+이름 1회 → 말풍선 N개" 형태로 그린다.
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

  function resolveAlign(m, state) {
    return Grouping.resolveAlign(m, state.characterRoles);
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

    const units = Grouping.build(list, state.characterRoles);
    return units.map(u => renderUnit(u, state)).join('');
  }

  function initials(name) {
    if (!name) return '';
    return name.trim().slice(0, 1);
  }

  function avatarHtml(speaker, avatarUrl, color) {
    if (avatarUrl) {
      return `<span class="msg-avatar" data-action="avatar-slot" data-name="${Utils.escapeHtml(speaker)}">
        <img src="${Utils.escapeHtml(avatarUrl)}" alt="" loading="lazy"
          onerror="this.closest('.msg-avatar').classList.add('msg-avatar--broken')">
        <button class="msg-avatar-fix" data-action="upload-avatar" data-name="${Utils.escapeHtml(speaker)}" title="이미지 다시 올리기">↑</button>
      </span>`;
    }
    return `<span class="msg-avatar msg-avatar--placeholder" style="background:${color}"
        data-action="upload-avatar" data-name="${Utils.escapeHtml(speaker)}" title="캐릭터 이미지 올리기">
      ${Utils.escapeHtml(initials(speaker))}
    </span>`;
  }

  function dragHandle() {
    return `<span class="msg-drag" data-action="drag-handle" draggable="true" title="드래그해서 순서 변경">⠿</span>`;
  }
  function delBtn(id) {
    return `<button class="msg-icon-btn" data-action="delete-message" data-id="${id}" title="이 메시지 삭제">✕</button>`;
  }

  function renderBubbleItem(m, state) {
    const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
    const highlighted = Search.highlight(bodyHtml, state.searchQuery);
    const typeLabel = Utils.TYPE_LABELS[m.type] || m.type;
    const emoteClass = m.type === 'emote' ? ' bubble-item--emote' : '';
    const isBubbleText = m.type === 'dialog' || m.type === 'whisper';
    const textClass = isBubbleText ? 'dialog-text bubble' : 'dialog-text';

    return `<div class="bubble-item${emoteClass}" data-id="${m.id}">
      ${dragHandle()}
      <span class="${textClass}" data-action="edit-message" data-id="${m.id}">${highlighted}</span>
      <span class="msg-type-tag msg-type-tag--${m.type}">${typeLabel}</span>
      ${delBtn(m.id)}
    </div>`;
  }

  function renderGroup(u, state) {
    const avatarColor = u.speaker ? Utils.colorForName(u.speaker) : '#5C5868';
    const useColor = state.display.useCharacterColor !== false;
    const nameColor = (useColor && u.speaker) ? Utils.colorForName(u.speaker) : 'inherit';
    const whisperTag = u.whisperTo ? `<span class="msg-whisper-tag">→ ${Utils.escapeHtml(u.whisperTo)}</span>` : '';

    return `<article class="msg-group" data-key="${Utils.escapeHtml(u.key)}">
      ${avatarHtml(u.speaker, u.avatarUrl, avatarColor)}
      <div class="group-main">
        <div class="group-head">
          <span class="dialog-name" style="color:${nameColor}">${Utils.escapeHtml(u.speaker || '')}</span>
          ${whisperTag}
        </div>
        <div class="group-items">
          ${u.items.map(m => renderBubbleItem(m, state)).join('')}
        </div>
      </div>
    </article>`;
  }

  function renderUnit(u, state) {
    if (u.kind === 'group') return renderGroup(u, state);

    const m = u.msg;
    const bodyHtml = m.html && m.html.trim() ? m.html : Utils.escapeHtml(m.text || '');
    const highlighted = Search.highlight(bodyHtml, state.searchQuery);

    if (u.kind === 'roll') {
      return `<article class="msg-row msg-row--roll" data-id="${m.id}">
        ${dragHandle()}
        <div class="roll-wrap">
          ${m.speaker ? `<div class="roll-speaker">${Utils.escapeHtml(m.speaker)}</div>` : ''}
          <div class="roll-body" data-action="edit-message" data-id="${m.id}">${highlighted}</div>
        </div>
        ${delBtn(m.id)}
      </article>`;
    }

    // center (나레이션/시스템)
    return `<article class="msg-row msg-row--center" data-id="${m.id}">
      ${dragHandle()}
      <div class="center-wrap">
        ${m.speaker ? `<div class="center-speaker">${Utils.escapeHtml(m.speaker)}</div>` : ''}
        <div class="center-body" data-action="edit-message" data-id="${m.id}">${highlighted}</div>
      </div>
      ${delBtn(m.id)}
    </article>`;
  }

  function renderCharacters(state) {
    const chars = Characters.extract(state.messages);
    if (chars.length === 0) {
      return `<p class="hint-text">아직 인식된 캐릭터가 없어요.</p>`;
    }
    return `<ul class="char-list">` + chars.map(c => {
      const role = state.characterRoles.get(c.name) || 'character';
      const avatar = c.avatarUrl
        ? `<img class="char-avatar" src="${Utils.escapeHtml(c.avatarUrl)}" alt=""
            onerror="this.outerHTML='<span class=char-avatar-ph style=background:${c.color}>${Utils.escapeHtml(initials(c.name))}</span>'">`
        : `<span class="char-avatar-ph" style="background:${c.color}">${Utils.escapeHtml(initials(c.name))}</span>`;
      return `
      <li class="char-row" data-name="${Utils.escapeHtml(c.name)}">
        <label class="char-check">
          <input type="checkbox" data-action="toggle-character" value="${Utils.escapeHtml(c.name)}"
            ${state.selectedCharacters.has(c.name) ? 'checked' : ''}>
        </label>
        ${avatar}
        <span class="char-name" data-action="rename-character" data-name="${Utils.escapeHtml(c.name)}"
          title="클릭해서 이름 변경 / 다른 이름과 합치기">${Utils.escapeHtml(c.name)}</span>
        <select class="char-role" data-action="set-role" data-name="${Utils.escapeHtml(c.name)}" title="역할">
          <option value="character" ${role === 'character' ? 'selected' : ''}>캐릭터</option>
          <option value="narration" ${role === 'narration' ? 'selected' : ''}>나레이션</option>
        </select>
        <button class="char-avatar-btn" data-action="upload-avatar" data-name="${Utils.escapeHtml(c.name)}" title="이미지 올리기/교체">🖼</button>
        <span class="char-count">${c.count}건</span>
      </li>`;
    }).join('') + `</ul>`;
  }

  function renderStats(state) {
    const s = Stats.compute(state.messages);
    if (s.totalMessages === 0) return `<p class="hint-text">로그를 불러오면 통계가 표시돼요.</p>`;

    const typeRows = Object.entries(s.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => `
        <div class="stat-chip"><span>${Utils.TYPE_LABELS[type] || type}</span><span class="stat-chip-num">${count}</span></div>`).join('');

    const charRows = s.characterList.map(c => {
      const pct = s.maxCharChars ? Math.round((c.charsWithSpace / s.maxCharChars) * 100) : 0;
      const color = Utils.colorForName(c.name);
      return `
        <div class="stat-bar-row">
          <div class="stat-bar-label"><span>${Utils.escapeHtml(c.name)}</span>
            <span class="stat-bar-num">${c.charsWithSpace.toLocaleString()}자 · ${c.messages}건</span></div>
          <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%; background:${color}"></div></div>
        </div>`;
    }).join('');

    return `
      <div class="stat-summary">
        <div class="stat-summary-item"><span class="stat-summary-num">${s.totalMessages.toLocaleString()}</span><span class="stat-summary-label">총 메시지</span></div>
        <div class="stat-summary-item"><span class="stat-summary-num">${s.totalCharsWithSpace.toLocaleString()}</span><span class="stat-summary-label">총 글자수(공백 포함)</span></div>
        <div class="stat-summary-item"><span class="stat-summary-num">${s.totalCharsNoSpace.toLocaleString()}</span><span class="stat-summary-label">총 글자수(공백 제외)</span></div>
      </div>
      <div class="stat-type-row">${typeRows}</div>
      <div class="stat-bars">${charRows}</div>`;
  }

  function renderToolbarCounts(state) {
    const total = state.messages.length;
    const shown = visibleMessages(state).length;
    if (total === 0) return '';
    return shown === total ? `${total.toLocaleString()}개 메시지` : `${shown.toLocaleString()} / ${total.toLocaleString()}개 표시`;
  }

  const TYPE_ORDER = ['dialog', 'emote', 'whisper', 'roll', 'desc', 'system'];
  function renderTypeFilters(state) {
    return TYPE_ORDER.filter(t => state.messages.some(m => m.type === t)).map(t => `
      <button class="chip ${state.activeTypeFilters.has(t) ? 'chip--on' : ''}"
        data-action="toggle-type" data-type="${t}">${Utils.TYPE_LABELS[t]}</button>
    `).join('');
  }

  return { renderLog, renderCharacters, renderStats, renderToolbarCounts, renderTypeFilters, visibleMessages, resolveAlign };
})();
