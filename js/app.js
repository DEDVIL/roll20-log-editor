/* =========================================================
   채록 · app.js (v2)
   중앙 상태(State) + 이벤트 위임 + 렌더 루프
   ========================================================= */

(() => {
  'use strict';

  const ALL_TYPES = ['dialog', 'emote', 'whisper', 'roll', 'desc', 'system'];
  const STORAGE_KEY = 'chaerok_state_v3';

  const state = {
    messages: [],
    history: [],
    selectedCharacters: new Set(),
    characterRoles: new Map(),
    activeTypeFilters: new Set(ALL_TYPES),
    searchQuery: '',
    cover: { title: '', subtitle: '', author: '', pcList: '', date: '' },
    imageMap: new Map(),
    display: {
      skin: 'light', fontChar: 'pretendard', fontNarration: 'notoserif',
      showAvatar: true, bubble: false, useCharacterColor: true, divider: true,
      emphasisColor: '#DB7C26',
      fontSize: 15, letterSpacing: 0, lineHeight: 1.75, paraSpacing: 14
    }
  };

  const $ = (id) => document.getElementById(id);
  const pasteBox = $('pasteBox');
  const htmlFileInput = $('htmlFileInput');
  const imgFilesInput = $('imgFilesInput');
  const parseBtn = $('parseBtn');
  const clearBtn = $('clearBtn');
  const optHidden = $('optHidden');
  const optDedupe = $('optDedupe');
  const optPunct = $('optPunct');
  const cleanBtn = $('cleanBtn');
  const undoBtn = $('undoBtn');
  const cleanLog = $('cleanLog');
  const searchInput = $('searchInput');
  const searchResult = $('searchResult');
  const typeFiltersEl = $('typeFilters');
  const toolbarCountEl = $('toolbarCount');
  const logFeed = $('logFeed');
  const characterList = $('characterList');
  const charDeleteBtn = $('charDeleteBtn');
  const statsPanel = $('statsPanel');
  const coverTitle = $('coverTitle');
  const coverSubtitle = $('coverSubtitle');
  const coverAuthor = $('coverAuthor');
  const coverPcList = $('coverPcList');
  const coverDate = $('coverDate');
  const copyTistoryBtn = $('copyTistoryBtn');
  const downloadHtmlBtn = $('downloadHtmlBtn');
  const printPdfBtn = $('printPdfBtn');
  const downloadTxtBtn = $('downloadTxtBtn');
  const downloadJsonBtn = $('downloadJsonBtn');
  const jsonFileInput = $('jsonFileInput');
  const toastEl = $('toast');
  const helpBtn = $('helpBtn');
  const helpDialog = $('helpDialog');
  const settingsBtn = $('settingsBtn');
  const exportBtn = $('exportBtn');
  const settingsDrawer = $('settingsDrawer');
  const exportDrawer = $('exportDrawer');
  const avatarUploadInput = $('avatarUploadInput');

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('toast--show'), 2600);
  }

  function pushHistory() {
    state.history.push(JSON.parse(JSON.stringify(state.messages)));
    if (state.history.length > 25) state.history.shift();
    undoBtn.disabled = false;
  }
  function undo() {
    if (!state.history.length) return;
    state.messages = state.history.pop();
    undoBtn.disabled = state.history.length === 0;
    toast('실행을 취소했어요.');
    renderAll();
  }

  // ---------------------------------------------------------
  // 렌더 루프
  // ---------------------------------------------------------
  function renderAll() {
    logFeed.innerHTML = Renderer.renderLog(state);
    characterList.innerHTML = Renderer.renderCharacters(state);
    statsPanel.innerHTML = Renderer.renderStats(state);
    typeFiltersEl.innerHTML = Renderer.renderTypeFilters(state);
    toolbarCountEl.textContent = Renderer.renderToolbarCounts(state);
    const { count } = Search.run(state.messages, state.searchQuery);
    searchResult.textContent = state.searchQuery.trim() ? `${count.toLocaleString()}건 검색됨` : '';
    persist();
  }

  const persist = Utils.debounce(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        messages: state.messages, cover: state.cover,
        characterRoles: Array.from(state.characterRoles.entries()), display: state.display
      }));
    } catch (e) { /* 저장 공간 부족 등은 무시 */ }
  }, 400);

  function restorePersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.messages && data.messages.length) {
        state.messages = data.messages;
        if (data.cover) Object.assign(state.cover, data.cover);
        if (data.characterRoles) state.characterRoles = new Map(data.characterRoles);
        if (data.display) Object.assign(state.display, data.display);
        syncCoverInputs(); syncDisplayInputs(); applyDisplay();
        renderAll();
        toast('이전에 작업하던 로그를 불러왔어요.');
      }
    } catch (e) { /* 손상된 데이터는 무시 */ }
  }

  // ---------------------------------------------------------
  // 로그 가져오기
  // ---------------------------------------------------------
  function handleParse(showEmptyWarning = true) {
    const raw = pasteBox.innerHTML.trim();
    if (!raw) { if (showEmptyWarning) toast('먼저 로그를 붙여넣어주세요.'); return; }
    const { messages, meta } = Parser.parse(raw);
    if (!messages.length) { toast('메시지를 인식하지 못했어요. 다른 방법(파일 업로드)도 시도해보세요.'); return; }
    state.messages = messages;
    state.history = [];
    undoBtn.disabled = true;
    state.selectedCharacters.clear();

    const notes = [`${messages.length.toLocaleString()}개 메시지를 불러왔어요.`];
    if (meta.dedupedWhole > 0) notes.push(`로그 중복 렌더 ${meta.dedupedWhole}건 자동 제거`);
    notes.push(`"2 · 자동 정리"에서 정리 실행을 눌러야 적용돼요.`);
    toast(notes.join(' · '));

    renderAll();
  }

  parseBtn.addEventListener('click', () => handleParse(true));
  pasteBox.addEventListener('paste', () => setTimeout(() => handleParse(false), 60));

  clearBtn.addEventListener('click', () => {
    if (state.messages.length && !confirm('현재 로그를 모두 지울까요? 저장하지 않은 변경은 사라져요.')) return;
    pasteBox.innerHTML = '';
    state.messages = [];
    state.history = [];
    undoBtn.disabled = true;
    renderAll();
  });

  htmlFileInput.addEventListener('change', async () => {
    const file = htmlFileInput.files[0];
    if (!file) return;
    const text = await file.text();
    const resolved = resolveLocalImages(text);
    const { messages, meta } = Parser.parse(resolved);
    if (!messages.length) { toast('HTML 파일에서 메시지를 찾지 못했어요.'); return; }
    state.messages = messages;
    state.history = [];
    undoBtn.disabled = true;
    const notes = [`파일에서 ${messages.length.toLocaleString()}개 메시지를 불러왔어요.`];
    if (meta.dedupedWhole > 0) notes.push(`중복 ${meta.dedupedWhole}건 제거`);
    notes.push(`"2 · 자동 정리"에서 정리 실행을 눌러야 적용돼요.`);
    toast(notes.join(' · '));
    renderAll();
  });

  imgFilesInput.addEventListener('change', () => {
    state.imageMap.clear();
    Array.from(imgFilesInput.files).forEach(f => state.imageMap.set(f.name.toLowerCase(), URL.createObjectURL(f)));
    toast(`이미지 ${state.imageMap.size}개를 연결했어요. HTML 파일을 다시 올려주세요.`);
  });

  function resolveLocalImages(html) {
    if (state.imageMap.size === 0) return html;
    const container = document.createElement('div');
    container.innerHTML = html;
    container.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src') || '';
      const base = src.split('/').pop().split('\\').pop().toLowerCase();
      if (state.imageMap.has(base)) img.setAttribute('src', state.imageMap.get(base));
    });
    return container.innerHTML;
  }

  // ---------------------------------------------------------
  // 자동 정리
  // ---------------------------------------------------------
  function runCleaning({ silent = false, snapshot = true } = {}) {
    if (!state.messages.length) return [];
    if (snapshot) pushHistory();
    let msgs = state.messages;
    const report = [];
    if (optHidden.checked) {
      const r = Cleaner.removeHidden(msgs); msgs = r.messages;
      if (r.removed) report.push(`숨김 메시지 ${r.removed}건 삭제`);
    }
    if (optDedupe.checked) {
      const r = Cleaner.dedupeConsecutive(msgs); msgs = r.messages;
      if (r.removed) report.push(`중복 메시지 ${r.removed}건 제거`);
    }
    if (optPunct.checked) {
      const r = Cleaner.applyPunctuationFix(msgs); msgs = r.messages;
      if (r.changed) report.push(`부호 교정 ${r.changed}건`);
    }
    state.messages = msgs;
    cleanLog.textContent = report.length ? report.join(' · ') : '변경 사항이 없었어요.';
    if (!silent) { toast(report.length ? `정리를 완료했어요. (${report.join(' · ')})` : '이미 깔끔한 로그예요.'); renderAll(); }
    return report;
  }
  cleanBtn.addEventListener('click', () => runCleaning({ silent: false, snapshot: true }));
  undoBtn.addEventListener('click', undo);

  // ---------------------------------------------------------
  // 검색 / 타입 필터
  // ---------------------------------------------------------
  searchInput.addEventListener('input', Utils.debounce(() => { state.searchQuery = searchInput.value; renderAll(); }, 180));

  typeFiltersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="toggle-type"]');
    if (!btn) return;
    const t = btn.dataset.type;
    if (state.activeTypeFilters.has(t)) state.activeTypeFilters.delete(t); else state.activeTypeFilters.add(t);
    renderAll();
  });

  // ---------------------------------------------------------
  // 로그 피드: 삭제 / 편집(클릭) / 드래그 재정렬 / 아바타 업로드
  // ---------------------------------------------------------
  logFeed.addEventListener('click', (e) => {
    const delBtn = e.target.closest('[data-action="delete-message"]');
    if (delBtn) {
      pushHistory();
      state.messages = state.messages.filter(m => m.id !== delBtn.dataset.id);
      renderAll();
      return;
    }
    const avatarBtn = e.target.closest('[data-action="upload-avatar"]');
    if (avatarBtn) { requestAvatarUpload(avatarBtn.dataset.name); return; }

    const emphasisTag = e.target.closest('[data-action="toggle-emphasis"]');
    if (emphasisTag) {
      const msg = state.messages.find(m => m.id === emphasisTag.dataset.id);
      if (msg) {
        pushHistory();
        msg.emphasis = !msg.emphasis;
        renderAll();
      }
      return;
    }

    const editable = e.target.closest('[data-action="edit-message"]');
    if (editable && !editable.classList.contains('editing') && editable.closest('.roll-body') === null) {
      if (e.target.closest('a')) return; // 링크 클릭은 편집모드로 진입하지 않음
      beginEdit(editable);
    }
  });

  logFeed.addEventListener('dblclick', (e) => {
    const rollBody = e.target.closest('.roll-body[data-action="edit-message"]');
    if (rollBody && !rollBody.classList.contains('editing')) beginEdit(rollBody);
  });

  function beginEdit(el) {
    pushHistory();
    el.contentEditable = 'true';
    el.classList.add('editing');
    el.focus();
  }

  logFeed.addEventListener('blur', (e) => {
    const el = e.target.closest && e.target.closest('[data-action="edit-message"]');
    if (!el || !el.isContentEditable) return;
    el.contentEditable = 'false';
    el.classList.remove('editing');
    const id = el.dataset.id;
    const msg = state.messages.find(m => m.id === id);
    if (msg) { msg.html = el.innerHTML.trim(); msg.text = el.textContent.trim(); }
    renderAll();
  }, true);

  // 드래그 재정렬 (개별 메시지 = .msg-row 또는 그룹 안의 .group-line)
  const ROW_SEL = '.msg-row, .group-line';
  let draggedId = null;
  logFeed.addEventListener('dragstart', (e) => {
    const handle = e.target.closest('[data-action="drag-handle"]');
    if (!handle) return;
    const row = handle.closest(ROW_SEL);
    if (!row) return;
    draggedId = row.dataset.id;
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
  });
  logFeed.addEventListener('dragend', (e) => {
    const row = e.target.closest(ROW_SEL);
    if (row) row.classList.remove('dragging');
    draggedId = null;
  });
  logFeed.addEventListener('dragover', (e) => { e.preventDefault(); });
  logFeed.addEventListener('drop', (e) => {
    e.preventDefault();
    const row = e.target.closest(ROW_SEL);
    if (!row || !draggedId) return;
    const targetId = row.dataset.id;
    if (targetId === draggedId) return;
    const rect = row.getBoundingClientRect();
    const after = (e.clientY - rect.top) > rect.height / 2;
    pushHistory();
    moveMessage(draggedId, targetId, after);
    draggedId = null;
    renderAll();
  });
  function moveMessage(fromId, targetId, after) {
    const arr = state.messages;
    const fromIdx = arr.findIndex(m => m.id === fromId);
    if (fromIdx === -1) return;
    const [item] = arr.splice(fromIdx, 1);
    let toIdx = arr.findIndex(m => m.id === targetId);
    if (toIdx === -1) { arr.splice(fromIdx, 0, item); return; }
    if (after) toIdx += 1;
    arr.splice(toIdx, 0, item);
  }

  // ---------------------------------------------------------
  // 아바타 업로드 (메시지/캐릭터 패널 공용)
  // ---------------------------------------------------------
  let pendingAvatarName = '';
  function requestAvatarUpload(name) {
    if (!name) return;
    pendingAvatarName = name;
    avatarUploadInput.value = '';
    avatarUploadInput.click();
  }
  avatarUploadInput.addEventListener('change', () => {
    const file = avatarUploadInput.files[0];
    if (!file || !pendingAvatarName) return;
    const reader = new FileReader();
    reader.onload = () => {
      pushHistory();
      state.messages = Characters.applyAvatarOverride(state.messages, pendingAvatarName, reader.result);
      toast(`'${pendingAvatarName}'의 이미지를 적용했어요.`);
      renderAll();
    };
    reader.readAsDataURL(file);
  });

  // ---------------------------------------------------------
  // 캐릭터 패널: 선택 / 이름변경·병합 / 역할 / 일괄삭제
  // ---------------------------------------------------------
  characterList.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-action="toggle-character"]');
    if (cb) { if (cb.checked) state.selectedCharacters.add(cb.value); else state.selectedCharacters.delete(cb.value); return; }
    const roleSel = e.target.closest('[data-action="set-role"]');
    if (roleSel) {
      state.characterRoles.set(roleSel.dataset.name, roleSel.value);
      persist();
      renderAll();
    }
  });

  characterList.addEventListener('click', (e) => {
    const avatarBtn = e.target.closest('[data-action="upload-avatar"]');
    if (avatarBtn) { requestAvatarUpload(avatarBtn.dataset.name); return; }

    const nameEl = e.target.closest('[data-action="rename-character"]');
    if (!nameEl) return;
    const oldName = nameEl.dataset.name;
    const next = prompt(`'${oldName}'의 새 이름을 입력하세요.\n(이미 있는 이름을 입력하면 해당 캐릭터로 합쳐져요)`, oldName);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === oldName) return;
    pushHistory();
    state.messages = Characters.rename(state.messages, oldName, trimmed);
    if (state.characterRoles.has(oldName)) {
      state.characterRoles.set(trimmed, state.characterRoles.get(oldName));
      state.characterRoles.delete(oldName);
    }
    state.selectedCharacters.delete(oldName);
    toast(`'${oldName}' → '${trimmed}'`);
    renderAll();
  });

  charDeleteBtn.addEventListener('click', () => {
    if (state.selectedCharacters.size === 0) { toast('삭제할 캐릭터를 먼저 선택해주세요.'); return; }
    const names = Array.from(state.selectedCharacters);
    if (!confirm(`${names.join(', ')} 의 메시지를 모두 삭제할까요?`)) return;
    pushHistory();
    const includeNarration = names.includes(Characters.NARRATION_KEY);
    const charNames = names.filter(n => n !== Characters.NARRATION_KEY);
    let messages = state.messages;
    let removed = 0;
    if (charNames.length) {
      const r = Characters.bulkDelete(messages, charNames);
      messages = r.messages; removed += r.removed;
    }
    if (includeNarration) {
      const before = messages.length;
      messages = messages.filter(m => !(m.type === 'desc' && !(m.speaker && m.speaker.trim())));
      removed += before - messages.length;
    }
    state.messages = messages;
    state.selectedCharacters.clear();
    toast(`${removed}건의 메시지를 삭제했어요.`);
    renderAll();
  });

  // ---------------------------------------------------------
  // 드로어 (설정 / 내보내기)
  // ---------------------------------------------------------
  function openDrawer(el) { el.setAttribute('aria-hidden', 'false'); }
  function closeDrawer(el) { el.setAttribute('aria-hidden', 'true'); }
  settingsBtn.addEventListener('click', () => openDrawer(settingsDrawer));
  exportBtn.addEventListener('click', () => openDrawer(exportDrawer));
  document.querySelectorAll('[data-action="close-settings"]').forEach(el => el.addEventListener('click', () => closeDrawer(settingsDrawer)));
  document.querySelectorAll('[data-action="close-export"]').forEach(el => el.addEventListener('click', () => closeDrawer(exportDrawer)));

  // ---------------------------------------------------------
  // 읽기 설정 (스킨/폰트/슬라이더/토글)
  // ---------------------------------------------------------
  const skinRow = $('skinRow');
  const fontChar = $('fontChar');
  const fontNarration = $('fontNarration');
  const optShowAvatar = $('optShowAvatar');
  const optUseCharColor = $('optUseCharColor');
  const optBubble = $('optBubble');
  const optDivider = $('optDivider');
  const colorEmphasis = $('colorEmphasis');
  const rangeFontSize = $('rangeFontSize');
  const rangeLetterSpacing = $('rangeLetterSpacing');
  const rangeLineHeight = $('rangeLineHeight');
  const rangeParaSpacing = $('rangeParaSpacing');
  const valFontSize = $('valFontSize');
  const valLetterSpacing = $('valLetterSpacing');
  const valLineHeight = $('valLineHeight');
  const valParaSpacing = $('valParaSpacing');
  const resetDisplayBtn = $('resetDisplayBtn');

  function applyDisplay() {
    const d = state.display;
    const skin = Utils.SKIN_MAP[d.skin] || Utils.SKIN_MAP.light;
    logFeed.style.setProperty('--log-bg', skin.bg);
    logFeed.style.setProperty('--log-text', skin.text);
    logFeed.style.setProperty('--log-card', skin.card);
    logFeed.style.setProperty('--log-font-char', Utils.FONT_MAP[d.fontChar] || Utils.FONT_MAP.pretendard);
    logFeed.style.setProperty('--log-font-narr', Utils.FONT_MAP[d.fontNarration] || Utils.FONT_MAP.notoserif);
    logFeed.style.setProperty('--log-font-size', d.fontSize + 'px');
    logFeed.style.setProperty('--log-letter-spacing', d.letterSpacing + 'px');
    logFeed.style.setProperty('--log-line-height', d.lineHeight);
    logFeed.style.setProperty('--log-para-spacing', d.paraSpacing + 'px');
    logFeed.dataset.showAvatar = String(d.showAvatar);
    logFeed.dataset.bubble = String(d.bubble);
    logFeed.dataset.useCharColor = String(d.useCharacterColor);
    logFeed.dataset.divider = String(d.divider !== false);
    logFeed.style.setProperty('--log-divider', skin.border);
    skinRow.querySelectorAll('.skin-swatch').forEach(b => b.classList.toggle('skin-swatch--active', b.dataset.skin === d.skin));
  }
  function syncDisplayInputs() {
    const d = state.display;
    fontChar.value = d.fontChar; fontNarration.value = d.fontNarration;
    optShowAvatar.checked = d.showAvatar; optUseCharColor.checked = d.useCharacterColor;
    optBubble.checked = d.bubble;
    optDivider.checked = d.divider !== false;
    colorEmphasis.value = d.emphasisColor || '#DB7C26';
    rangeFontSize.value = d.fontSize; rangeLetterSpacing.value = d.letterSpacing;
    rangeLineHeight.value = d.lineHeight; rangeParaSpacing.value = d.paraSpacing;
    valFontSize.textContent = d.fontSize; valLetterSpacing.textContent = d.letterSpacing;
    valLineHeight.textContent = d.lineHeight; valParaSpacing.textContent = d.paraSpacing;
  }

  skinRow.addEventListener('click', (e) => {
    const b = e.target.closest('.skin-swatch');
    if (!b) return;
    state.display.skin = b.dataset.skin;
    applyDisplay(); persist();
  });
  fontChar.addEventListener('change', () => { state.display.fontChar = fontChar.value; applyDisplay(); persist(); });
  fontNarration.addEventListener('change', () => { state.display.fontNarration = fontNarration.value; applyDisplay(); persist(); });
  optShowAvatar.addEventListener('change', () => { state.display.showAvatar = optShowAvatar.checked; applyDisplay(); persist(); });
  optUseCharColor.addEventListener('change', () => { state.display.useCharacterColor = optUseCharColor.checked; applyDisplay(); persist(); renderAll(); });
  optBubble.addEventListener('change', () => { state.display.bubble = optBubble.checked; applyDisplay(); persist(); });
  optDivider.addEventListener('change', () => { state.display.divider = optDivider.checked; applyDisplay(); persist(); });
  colorEmphasis.addEventListener('input', () => { state.display.emphasisColor = colorEmphasis.value; applyDisplay(); persist(); renderAll(); });
  rangeFontSize.addEventListener('input', () => { state.display.fontSize = Number(rangeFontSize.value); valFontSize.textContent = state.display.fontSize; applyDisplay(); persist(); });
  rangeLetterSpacing.addEventListener('input', () => { state.display.letterSpacing = Number(rangeLetterSpacing.value); valLetterSpacing.textContent = state.display.letterSpacing; applyDisplay(); persist(); });
  rangeLineHeight.addEventListener('input', () => { state.display.lineHeight = Number(rangeLineHeight.value); valLineHeight.textContent = state.display.lineHeight; applyDisplay(); persist(); });
  rangeParaSpacing.addEventListener('input', () => { state.display.paraSpacing = Number(rangeParaSpacing.value); valParaSpacing.textContent = state.display.paraSpacing; applyDisplay(); persist(); });
  resetDisplayBtn.addEventListener('click', () => {
    Object.assign(state.display, {
      skin: 'light', fontChar: 'pretendard', fontNarration: 'notoserif',
      showAvatar: true, bubble: false, useCharacterColor: true, divider: true,
      emphasisColor: '#DB7C26',
      fontSize: 15, letterSpacing: 0, lineHeight: 1.75, paraSpacing: 14
    });
    syncDisplayInputs(); applyDisplay(); persist();
    toast('읽기 설정을 초기화했어요.');
  });

  // ---------------------------------------------------------
  // 표지 정보
  // ---------------------------------------------------------
  function syncCoverInputs() {
    coverTitle.value = state.cover.title; coverSubtitle.value = state.cover.subtitle;
    coverAuthor.value = state.cover.author; coverPcList.value = state.cover.pcList; coverDate.value = state.cover.date;
  }
  [['title', coverTitle], ['subtitle', coverSubtitle], ['author', coverAuthor], ['pcList', coverPcList], ['date', coverDate]]
    .forEach(([key, el]) => el.addEventListener('input', () => { state.cover[key] = el.value; persist(); }));

  // ---------------------------------------------------------
  // 내보내기 액션
  // ---------------------------------------------------------
  copyTistoryBtn.addEventListener('click', async () => {
    if (!state.messages.length) { toast('내보낼 로그가 없어요.'); return; }
    const html = Exporter.buildTistoryHtml(state);
    try {
      await navigator.clipboard.writeText(html);
      toast('티스토리용 HTML 코드를 복사했어요. 티스토리 글쓰기의 "HTML" 모드에 붙여넣으세요.');
    } catch (e) {
      Utils.download('chaerok-log.html', html, 'text/html');
      toast('클립보드 복사에 실패해서 파일로 저장했어요.');
    }
  });
  downloadHtmlBtn.addEventListener('click', () => {
    if (!state.messages.length) { toast('내보낼 로그가 없어요.'); return; }
    Utils.download('chaerok-log.html', Exporter.buildTistoryHtml(state), 'text/html');
  });
  printPdfBtn.addEventListener('click', () => {
    if (!state.messages.length) { toast('내보낼 로그가 없어요.'); return; }
    Exporter.openPrintView(state);
  });
  downloadTxtBtn.addEventListener('click', () => {
    if (!state.messages.length) { toast('내보낼 로그가 없어요.'); return; }
    Utils.download('chaerok-log.txt', Exporter.buildTxt(state), 'text/plain');
  });
  downloadJsonBtn.addEventListener('click', () => {
    if (!state.messages.length) { toast('내보낼 로그가 없어요.'); return; }
    Utils.download(`chaerok-backup-${Utils.formatDate()}.json`, Exporter.buildJson(state), 'application/json');
  });
  jsonFileInput.addEventListener('change', async () => {
    const file = jsonFileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = Exporter.parseJson(text);
      pushHistory();
      state.messages = data.messages;
      if (data.cover) Object.assign(state.cover, data.cover);
      if (data.display) Object.assign(state.display, data.display);
      if (data.characterRoles) state.characterRoles = new Map(data.characterRoles);
      syncCoverInputs(); syncDisplayInputs(); applyDisplay();
      toast(`백업에서 ${data.messages.length.toLocaleString()}개 메시지를 불러왔어요.`);
      renderAll();
    } catch (e) { toast('백업 파일을 읽지 못했어요: ' + e.message); }
    jsonFileInput.value = '';
  });

  // ---------------------------------------------------------
  // 도움말
  // ---------------------------------------------------------
  helpBtn.addEventListener('click', () => helpDialog.showModal());
  helpDialog.addEventListener('click', (e) => { if (e.target === helpDialog) helpDialog.close(); });
  helpDialog.querySelector('[data-action="close-dialog"]').addEventListener('click', () => helpDialog.close());

  // ---------------------------------------------------------
  // 초기화
  // ---------------------------------------------------------
  syncCoverInputs();
  syncDisplayInputs();
  applyDisplay();
  restorePersisted();
  renderAll();
})();
