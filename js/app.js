/* =========================================================
   채록 · app.js
   중앙 상태(State) + 이벤트 위임 + 렌더 루프
   ========================================================= */

(() => {
  'use strict';

  const ALL_TYPES = ['dialog', 'emote', 'whisper', 'roll', 'system', 'image'];
  const STORAGE_KEY = 'chaerok_state_v1';

  const state = {
    messages: [],
    history: [],
    selectedCharacters: new Set(),
    activeTypeFilters: new Set(ALL_TYPES),
    searchQuery: '',
    exportTheme: { bg: '#1D1B25', bubbleBg: '#242230', text: '#EDE9E3', useCharacterColor: true },
    cover: { title: '', subtitle: '', author: '', pcList: '', date: '' },
    imageMap: new Map()
  };

  // ---------------------------------------------------------
  // DOM 참조
  // ---------------------------------------------------------
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
  const themeBg = $('themeBg');
  const themeBubble = $('themeBubble');
  const themeText = $('themeText');
  const themeUseColor = $('themeUseColor');
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

  // ---------------------------------------------------------
  // 유틸: 토스트, 히스토리(undo)
  // ---------------------------------------------------------
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
        messages: state.messages, cover: state.cover, exportTheme: state.exportTheme
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
        if (data.exportTheme) Object.assign(state.exportTheme, data.exportTheme);
        syncCoverInputs();
        syncThemeInputs();
        renderAll();
        toast('이전에 작업하던 로그를 불러왔어요.');
      }
    } catch (e) { /* 손상된 데이터는 무시 */ }
  }

  // ---------------------------------------------------------
  // 로그 가져오기: 붙여넣기 / 변환
  // ---------------------------------------------------------
  function handleParse(showEmptyWarning = true) {
    const raw = pasteBox.innerHTML.trim();
    if (!raw) {
      if (showEmptyWarning) toast('먼저 로그를 붙여넣어주세요.');
      return;
    }
    const { messages, meta } = Parser.parse(raw);
    if (!messages.length) {
      toast('메시지를 인식하지 못했어요. 다른 방법(파일 업로드)도 시도해보세요.');
      return;
    }
    state.messages = messages;
    state.history = [];
    undoBtn.disabled = true;
    state.selectedCharacters.clear();

    let note = `${messages.length.toLocaleString()}개 메시지를 불러왔어요.`;
    if (meta.dedupedWhole > 0) note += ` (로그 중복 렌더 ${meta.dedupedWhole}건 자동 제거)`;
    toast(note);

    // 기본 옵션에 따라 자동 정리 1회 실행
    runCleaning({ silent: true, snapshot: false });
    renderAll();
  }

  parseBtn.addEventListener('click', () => handleParse(true));

  pasteBox.addEventListener('paste', () => {
    setTimeout(() => handleParse(false), 60);
  });

  clearBtn.addEventListener('click', () => {
    if (state.messages.length && !confirm('현재 로그를 모두 지울까요? 저장하지 않은 변경은 사라져요.')) return;
    pasteBox.innerHTML = '';
    state.messages = [];
    state.history = [];
    undoBtn.disabled = true;
    renderAll();
  });

  // 파일 업로드 (저장한 HTML + 이미지 폴더)
  htmlFileInput.addEventListener('change', async () => {
    const file = htmlFileInput.files[0];
    if (!file) return;
    const text = await file.text();
    const resolved = resolveLocalImages(text);
    const { messages, meta } = Parser.parse(resolved);
    if (!messages.length) {
      toast('HTML 파일에서 메시지를 찾지 못했어요.');
      return;
    }
    state.messages = messages;
    state.history = [];
    undoBtn.disabled = true;
    let note = `파일에서 ${messages.length.toLocaleString()}개 메시지를 불러왔어요.`;
    if (meta.dedupedWhole > 0) note += ` (중복 ${meta.dedupedWhole}건 제거)`;
    toast(note);
    runCleaning({ silent: true, snapshot: false });
    renderAll();
  });

  imgFilesInput.addEventListener('change', () => {
    state.imageMap.clear();
    Array.from(imgFilesInput.files).forEach(f => {
      state.imageMap.set(f.name.toLowerCase(), URL.createObjectURL(f));
    });
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
    if (!state.messages.length) return;
    if (snapshot) pushHistory();

    let msgs = state.messages;
    const report = [];

    if (optHidden.checked) {
      const r = Cleaner.removeHidden(msgs);
      msgs = r.messages;
      if (r.removed) report.push(`숨김 메시지 ${r.removed}건 삭제`);
    }
    if (optDedupe.checked) {
      const r = Cleaner.dedupeConsecutive(msgs);
      msgs = r.messages;
      if (r.removed) report.push(`중복 메시지 ${r.removed}건 제거`);
    }
    if (optPunct.checked) {
      const r = Cleaner.applyPunctuationFix(msgs);
      msgs = r.messages;
      if (r.changed) report.push(`부호 교정 ${r.changed}건`);
    }

    state.messages = msgs;
    cleanLog.textContent = report.length ? report.join(' · ') : '변경 사항이 없었어요.';
    if (!silent) {
      toast(report.length ? '정리를 완료했어요.' : '이미 깔끔한 로그예요.');
      renderAll();
    }
  }

  cleanBtn.addEventListener('click', () => runCleaning({ silent: false, snapshot: true }));
  undoBtn.addEventListener('click', undo);

  // ---------------------------------------------------------
  // 검색
  // ---------------------------------------------------------
  searchInput.addEventListener('input', Utils.debounce(() => {
    state.searchQuery = searchInput.value;
    renderAll();
  }, 180));

  // ---------------------------------------------------------
  // 타입 필터 (위임)
  // ---------------------------------------------------------
  typeFiltersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="toggle-type"]');
    if (!btn) return;
    const t = btn.dataset.type;
    if (state.activeTypeFilters.has(t)) state.activeTypeFilters.delete(t);
    else state.activeTypeFilters.add(t);
    renderAll();
  });

  // ---------------------------------------------------------
  // 로그 피드 위임: 메시지 삭제 / 편집
  // ---------------------------------------------------------
  logFeed.addEventListener('click', (e) => {
    const delBtn = e.target.closest('[data-action="delete-message"]');
    if (delBtn) {
      pushHistory();
      const id = delBtn.dataset.id;
      state.messages = state.messages.filter(m => m.id !== id);
      renderAll();
    }
  });

  logFeed.addEventListener('dblclick', (e) => {
    const body = e.target.closest('[data-action="edit-message"]');
    if (!body || body.isContentEditable) return;
    pushHistory();
    body.contentEditable = 'true';
    body.classList.add('msg-body--editing');
    body.focus();
    document.execCommand('selectAll', false, null);
  });

  logFeed.addEventListener('blur', (e) => {
    const body = e.target.closest && e.target.closest('[data-action="edit-message"]');
    if (!body || !body.isContentEditable) return;
    body.contentEditable = 'false';
    body.classList.remove('msg-body--editing');
    const id = body.dataset.id;
    const msg = state.messages.find(m => m.id === id);
    if (msg) {
      msg.html = body.innerHTML.trim();
      msg.text = body.textContent.trim();
    }
    renderAll();
  }, true);

  // ---------------------------------------------------------
  // 캐릭터 패널 위임: 선택 / 이름변경 / 병합
  // ---------------------------------------------------------
  characterList.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-action="toggle-character"]');
    if (!cb) return;
    if (cb.checked) state.selectedCharacters.add(cb.value);
    else state.selectedCharacters.delete(cb.value);
  });

  characterList.addEventListener('click', (e) => {
    const nameEl = e.target.closest('[data-action="rename-character"]');
    if (!nameEl) return;
    const oldName = nameEl.dataset.name;
    const next = prompt(`'${oldName}'의 새 이름을 입력하세요.\n(이미 있는 이름을 입력하면 해당 캐릭터로 합쳐져요)`, oldName);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === oldName) return;
    pushHistory();
    state.messages = Characters.rename(state.messages, oldName, trimmed);
    state.selectedCharacters.delete(oldName);
    toast(`'${oldName}' → '${trimmed}'`);
    renderAll();
  });

  charDeleteBtn.addEventListener('click', () => {
    if (state.selectedCharacters.size === 0) {
      toast('삭제할 캐릭터를 먼저 선택해주세요.');
      return;
    }
    const names = Array.from(state.selectedCharacters);
    if (!confirm(`${names.join(', ')} 의 메시지를 모두 삭제할까요?`)) return;
    pushHistory();
    const r = Characters.bulkDelete(state.messages, names);
    state.messages = r.messages;
    state.selectedCharacters.clear();
    toast(`${r.removed}건의 메시지를 삭제했어요.`);
    renderAll();
  });

  // ---------------------------------------------------------
  // 내보내기 테마 / 표지
  // ---------------------------------------------------------
  function syncThemeInputs() {
    themeBg.value = state.exportTheme.bg;
    themeBubble.value = state.exportTheme.bubbleBg;
    themeText.value = state.exportTheme.text;
    themeUseColor.checked = state.exportTheme.useCharacterColor;
  }
  function syncCoverInputs() {
    coverTitle.value = state.cover.title;
    coverSubtitle.value = state.cover.subtitle;
    coverAuthor.value = state.cover.author;
    coverPcList.value = state.cover.pcList;
    coverDate.value = state.cover.date;
  }

  themeBg.addEventListener('input', () => { state.exportTheme.bg = themeBg.value; persist(); });
  themeBubble.addEventListener('input', () => { state.exportTheme.bubbleBg = themeBubble.value; persist(); });
  themeText.addEventListener('input', () => { state.exportTheme.text = themeText.value; persist(); });
  themeUseColor.addEventListener('change', () => { state.exportTheme.useCharacterColor = themeUseColor.checked; persist(); });

  [['title', coverTitle], ['subtitle', coverSubtitle], ['author', coverAuthor],
   ['pcList', coverPcList], ['date', coverDate]].forEach(([key, el]) => {
    el.addEventListener('input', () => { state.cover[key] = el.value; persist(); });
  });

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
      if (data.exportTheme) Object.assign(state.exportTheme, data.exportTheme);
      syncCoverInputs();
      syncThemeInputs();
      toast(`백업에서 ${data.messages.length.toLocaleString()}개 메시지를 불러왔어요.`);
      renderAll();
    } catch (e) {
      toast('백업 파일을 읽지 못했어요: ' + e.message);
    }
    jsonFileInput.value = '';
  });

  // ---------------------------------------------------------
  // 도움말 다이얼로그
  // ---------------------------------------------------------
  helpBtn.addEventListener('click', () => helpDialog.showModal());
  helpDialog.addEventListener('click', (e) => {
    if (e.target === helpDialog) helpDialog.close();
  });
  helpDialog.querySelector('[data-action="close-dialog"]').addEventListener('click', () => helpDialog.close());

  // ---------------------------------------------------------
  // 초기화
  // ---------------------------------------------------------
  syncThemeInputs();
  syncCoverInputs();
  restorePersisted();
  renderAll();
})();
