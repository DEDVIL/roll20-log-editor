/* =========================================================
   채록 · parser.js (v2)
   Roll20 Chat Archive HTML(붙여넣기) 및 일반 텍스트 로그를
   내부 메시지 모델로 변환한다.

   메시지 모델:
   {
     id, type: 'dialog'|'emote'|'whisper'|'roll'|'system'|'desc',
     speaker, whisperTo, avatarUrl, html, text, hidden
   }
   - dialog / emote / whisper : 화자가 있는 대사 (아바타 + 이름, 왼쪽 정렬)
   - desc   : 화자 없는 지문/내레이션 (가운데 정렬 — Roll20 "/desc" 등)
   - roll   : 주사위 판정 결과 (원본 구조를 최대한 보존)
   - system : 안내 메시지(입장/퇴장, hidden 안내 등)
   ========================================================= */

const Parser = (() => {

  // ---------------------------------------------------------
  // 진입점
  // ---------------------------------------------------------
  function parse(raw) {
    if (!raw || !raw.trim()) {
      return { messages: [], meta: { source: 'empty', dedupedWhole: 0 } };
    }

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);

    let messages, source;
    if (looksLikeHtml) {
      messages = parseRoll20Html(raw);
      source = 'html';
      if (messages.length === 0) {
        messages = parsePlainText(stripTags(raw));
        source = 'html-fallback-text';
      }
    } else {
      messages = parsePlainText(raw);
      source = 'text';
    }

    const { messages: deduped, removed } = dedupeWholeLog(messages);
    return { messages: deduped, meta: { source, dedupedWhole: removed } };
  }

  // ---------------------------------------------------------
  // Roll20 Chat Archive HTML 파서
  // ---------------------------------------------------------
  function parseRoll20Html(raw) {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const root = doc.body || doc;

    const all = root.querySelectorAll('*');
    const candidates = [];
    all.forEach(el => {
      const cls = typeof el.className === 'string' ? el.className : '';
      if (/(^|\s)message(\s|$)/.test(cls)) candidates.push(el);
    });

    const leafCandidates = candidates.filter(
      el => !candidates.some(other => other !== el && el.contains(other))
    );

    const messages = [];
    let lastSpeaker = '', lastAvatar = '', lastSpeakerType = '';

    leafCandidates.forEach(el => {
      const parsed = extractMessage(el);
      if (!parsed) return;

      // Roll20은 같은 화자가 연속으로 메시지를 보내면 두 번째 메시지부터
      // .by(이름) 태그를 생략하는 경우가 많다. 이 경우 원래 대사(또는 감정
      // 표현·귓속말)인데 "화자 없음" 으로 오인되어 나레이션(desc)으로 잘못
      // 분류되는 것을 막기 위해, 직전 발화자를 이어받는다.
      if (!parsed.speaker && (parsed.type === 'dialog' || parsed.type === 'emote' || parsed.type === 'whisper')) {
        if (lastSpeaker) {
          parsed.speaker = lastSpeaker;
          if (!parsed.avatarUrl) parsed.avatarUrl = lastAvatar;
          if (parsed.type === 'dialog') parsed.type = lastSpeakerType;
        } else if (parsed.type === 'dialog') {
          parsed.type = 'desc';
        }
      }

      if (parsed.speaker && (parsed.type === 'dialog' || parsed.type === 'emote' || parsed.type === 'whisper')) {
        lastSpeaker = parsed.speaker; lastAvatar = parsed.avatarUrl; lastSpeakerType = parsed.type;
      } else if (parsed.type === 'desc') {
        // 화자 없는 진짜 지문(장면 설명)을 만나면 "이어말하기" 문맥을 초기화한다
        lastSpeaker = ''; lastAvatar = ''; lastSpeakerType = '';
      }

      messages.push(parsed);
    });

    const cleaned = [];
    messages.forEach(m => {
      const prev = cleaned[cleaned.length - 1];
      if (prev && m.text && prev.type === m.type && prev.speaker === m.speaker && prev.text === m.text) return;
      cleaned.push(m);
    });

    return cleaned;
  }

  function extractMessage(el) {
    const clone = el.cloneNode(true);
    const clsRaw = typeof el.className === 'string' ? el.className : '';

    let type = 'dialog';
    if (/\bwhisper\b/i.test(clsRaw)) type = 'whisper';
    else if (/\bemote\b/i.test(clsRaw)) type = 'emote';
    else if (/\b(rollresult|gmrollresult|diceroll|inlinerollresult|rolltemplate)/i.test(clsRaw)) type = 'roll';
    else if (/\bsystem\b/i.test(clsRaw)) type = 'system';
    else if (/\bdesc\b/i.test(clsRaw)) type = 'desc';
    else if (/\b(general|api)\b/i.test(clsRaw)) type = 'dialog';

    const avatarUrl = extractAvatar(clone);

    clone.querySelectorAll('.tstamp, .timestamp').forEach(n => n.remove());

    // Roll20의 "깜빡이는 문구"(예: 목적지 안내)는 애니메이션 효과를 위해
    // 같은 아이콘/글자를 여러 겹 쌓아두는 경우가 있다. 그대로 복사하면
    // "목목적적지지..." 처럼 글자가 겹쳐 보이므로 미리 정리한다.
    normalizeGlitchText(clone);

    let speaker = '';
    const bySpan = clone.querySelector('.by');
    if (bySpan) {
      speaker = bySpan.textContent.replace(/:\s*$/, '').trim();
      bySpan.remove();
      stripLeadingColon(clone);
    }

    clone.querySelectorAll('.spacer').forEach(n => n.remove());

    let whisperTo = '';
    if (speaker) {
      const m = speaker.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
      if (m) {
        speaker = m[1].trim();
        whisperTo = m[2].trim();
      }
    }

    // 화자 태그(.by)가 없는 general 메시지의 나레이션 여부는 호출부(parseRoll20Html)
    // 에서 직전 발화자 문맥을 참고해 최종 판단한다 (연속 대사 이어받기 지원).

    // 배경색 통일은 대사류에만 적용한다. roll/system 은 판정 성공도 등을 색으로
    // 표현하는 경우가 많아 원본 배색을 보존한다.
    if (type !== 'roll' && type !== 'system') {
      stripBackgroundColor(clone);
    }

    linkifyMarkdown(clone);

    if (type === 'roll') { colorizeRollResults(clone); colorizeNativeDice(clone); }

    let html = clone.innerHTML.trim();
    let text = clone.textContent.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();

    // 위 normalizeGlitchText 로 못 잡아낸(요소 경계를 넘나드는) 중복도
    // 최종 텍스트 단계에서 한 번 더 확인한다. 이 경우 서식은 의미가 없는
    // 자동 안내문일 가능성이 높으므로 텍스트만 남긴 안전한 형태로 바꾼다.
    const dedupedText = fixLineDoubling(text);
    if (dedupedText !== text) {
      text = dedupedText;
      html = Utils.escapeHtml(text).replace(/\n/g, '<br>');
    }

    if (!text && !clone.querySelector('img')) return null;

    const hidden = /this message (is|has been) hidden/i.test(text) ||
                   /메시지가?\s*(숨겨|가려)/i.test(text) ||
                   /\(\d+\s*messages? deleted\)/i.test(text);

    return { id: Utils.nextId(), type, speaker, whisperTo, avatarUrl, html, text, hidden };
  }

  // 판정 결과 색칠: Roll20 API/시트 판정 템플릿은 색상을 외부 스타일시트
  // 클래스로 지정하는 경우가 많아, 로그를 복사하면 색이 그대로 빠져버린다.
  // 결과 텍스트(실패/성공 등)를 인식해서 우리가 직접 색을 채워 넣는다.
  // (앞에 "판정결과:" 같은 라벨이 같은 칸에 붙어 있어도 인식하도록 부분일치로 검사한다)
  const RESULT_COLORS = [
    [/(대실패|펌블|critical\s*fail(ure)?|fumble)/i, '#8B2E2E'],
    [/(극단적\s*성공|크리티컬\s*성공|critical\s*success|extreme\s*success)/i, '#1F6F43'],
    [/(어려운\s*성공|hard\s*success)/i, '#2E8B57'],
    [/(보통\s*성공|^성공$|성공(?!률)|success)/i, '#4C9A6A'],
    [/(실패|fail(ure)?)/i, '#C0392B']
  ];
  function colorizeRollResults(clone) {
    const all = clone.querySelectorAll('*');
    all.forEach(el => {
      if (el.children.length > 0) return; // 리프 요소만
      const text = el.textContent.trim();
      if (!text || text.length > 30) return;
      const hit = RESULT_COLORS.find(([re]) => re.test(text));
      if (!hit) return;
      // 표(table) 구조라면 행 전체를 물들여 원본 시트 느낌을 살리고,
      // 아니라면 결과 글자만 알약(pill) 모양으로 감싼다.
      const row = el.closest('tr');
      if (row) {
        row.style.backgroundColor = hit[1];
        row.querySelectorAll('td, th').forEach(c => { c.style.color = '#fff'; });
      } else {
        el.style.backgroundColor = hit[1];
        el.style.color = '#fff';
        el.style.display = el.style.display || 'inline-block';
        el.style.padding = el.style.padding || '2px 10px';
        el.style.borderRadius = el.style.borderRadius || '999px';
      }
      el.style.color = '#fff';
      el.style.fontWeight = '700';
    });
  }

  // Roll20 기본 주사위(크리티컬/펌블 강조)는 .fullcrit / .fullfail 같은
  // 표준 클래스명을 쓰는데, 이 클래스에 연결된 스타일시트는 복사되지 않으므로
  // 클래스명을 보고 우리가 직접 색을 입혀준다.
  function colorizeNativeDice(clone) {
    clone.querySelectorAll('.fullcrit, .crit, .criticalsuccess, .importantroll').forEach(el => {
      el.style.color = '#1F6F43'; el.style.fontWeight = '700';
    });
    clone.querySelectorAll('.fullfail, .fumble, .criticalfailure').forEach(el => {
      el.style.color = '#C0392B'; el.style.fontWeight = '700';
    });
  }

  // ---------------------------------------------------------
  // 글자/아이콘 겹침(애니메이션 잔재) 정리
  // ---------------------------------------------------------

  // 재생 아이콘류(♬♪▶■ 등)는 재생/정지 상태별 아이콘이 DOM에 동시에
  // 남아 "♬♬♬ ♪♪♪ ▶▶▶■■■" 처럼 여러 번 반복되는 경우가 있다.
  // 사람이 일부러 3번 이상 반복해서 칠 일이 없는 기호이므로 안전하게 1개로 줄인다.
  const ICON_REPEAT_RE = /([♬♪▶■⏸►❚❙▷◀◁])\1+/g;
  function collapseIconRepeats(text) {
    return text.replace(ICON_REPEAT_RE, '$1');
  }

  function normalizeGlitchText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      let fixed = collapseIconRepeats(node.textContent);
      fixed = dedoubleGlitchChars(fixed);
      if (fixed !== node.textContent) node.textContent = fixed;
    });
  }

  // "목목적적지지..." 처럼 글자 하나하나가 연달아 정확히 두 번씩 찍히는
  // 경우(깜빡임 애니메이션 잔재)를 감지해 절반으로 되돌린다.
  // 한글 음절/영문/숫자에만 적용하고("......", "ㅋㅋㅋㅋ" 같은 정상적인
  // 반복 문장부호·감탄사는 건드리지 않도록) 4쌍(8글자) 이상 연속될 때만
  // 동작해 일반 문장이 우연히 걸릴 확률을 최소화한다.
  const WORD_CHAR_RE = /[0-9a-zA-Z\uAC00-\uD7A3]/;
  function halveDoubled(s) {
    let out = '';
    for (let i = 0; i < s.length; i += 2) out += s[i];
    return out;
  }
  function dedoubleGlitchChars(s) {
    if (!s || s.length < 8) return s;
    let out = '';
    let i = 0;
    while (i < s.length) {
      let j = i, pairs = 0;
      while (j + 1 < s.length && s[j] === s[j + 1] && WORD_CHAR_RE.test(s[j])) {
        j += 2; pairs++;
      }
      if (pairs >= 4) {
        out += halveDoubled(s.slice(i, j));
        i = j;
      } else {
        out += s[i];
        i++;
      }
    }
    return out;
  }
  // 요소 경계를 넘나드는 중복(예: 공백이 사이에 낀 경우)에 대비해
  // 최종 조립된 텍스트에도 같은 규칙을 한 번 더 적용한다.
  function fixLineDoubling(text) {
    return text.split('\n').map(dedoubleGlitchChars).join('\n');
  }

  function extractAvatar(clone) {
    let img = clone.querySelector('[class*="avatar"] img') ||
              clone.querySelector('img[class*="avatar"]') ||
              clone.querySelector('[class*="token"] img') ||
              clone.querySelector('img[class*="token"]');

    if (!img) {
      const bySpan = clone.querySelector('.by');
      const firstImg = clone.querySelector('img');
      if (firstImg && bySpan) {
        const pos = firstImg.compareDocumentPosition(bySpan);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) img = firstImg;
      }
    }

    if (!img) return '';
    const src = img.getAttribute('src') || '';
    const wrapper = img.closest('[class*="avatar"], [class*="token"]');
    if (wrapper && wrapper !== clone) wrapper.remove();
    else img.remove();
    return src;
  }

  function linkifyMarkdown(clone) {
    const re = /\[([^\[\]]{1,80})\]\((https?:\/\/[^\s)]+)\)/g;
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    const targets = [];
    let n;
    while ((n = walker.nextNode())) {
      if (re.test(n.textContent)) targets.push(n);
      re.lastIndex = 0;
    }
    targets.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = Utils.escapeHtml(node.textContent).replace(re, (m, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener">${label}</a>`);
      node.replaceWith(...span.childNodes);
    });
  }

  function stripBackgroundColor(root) {
    const nodes = [root, ...root.querySelectorAll('[style]')];
    nodes.forEach(node => {
      if (!node.getAttribute) return;
      const style = node.getAttribute('style');
      if (!style) return;
      const kept = style.split(';').map(s => s.trim()).filter(Boolean).filter(rule => {
        const idx = rule.indexOf(':');
        if (idx === -1) return true;
        const prop = rule.slice(0, idx).trim().toLowerCase();
        const val = rule.slice(idx + 1).trim();
        if (prop === 'background-color') return false;
        if (prop === 'background' && !/url\(/i.test(val)) return false;
        return true;
      });
      if (kept.length) node.setAttribute('style', kept.join('; '));
      else node.removeAttribute('style');
    });
  }

  function stripLeadingColon(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (first && /^\s*[:：]\s*/.test(first.textContent)) {
      first.textContent = first.textContent.replace(/^\s*[:：]\s*/, '');
    }
  }

  function stripTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.style.cssText = 'position:fixed; left:-9999px; top:0; white-space:pre-wrap;';
    document.body.appendChild(div);
    const text = div.innerText !== undefined ? div.innerText : div.textContent;
    document.body.removeChild(div);
    return text || '';
  }

  // ---------------------------------------------------------
  // 일반 텍스트 로그 파서
  // ---------------------------------------------------------
  function parsePlainText(raw) {
    const text = raw.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
    const lines = text.split('\n');
    const messages = [];
    let current = null;

    lines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;

      const match = line.match(/^([^:：]{1,30}?)\s*[:：]\s*(.*)$/);
      if (match && match[2] !== undefined && match[1].length <= 30) {
        const speaker = match[1].trim();
        const body = match[2];
        current = {
          id: Utils.nextId(), type: 'dialog', speaker, whisperTo: '', avatarUrl: '',
          html: Utils.escapeHtml(body), text: body,
          hidden: /this message (is|has been) hidden/i.test(body)
        };
        messages.push(current);
      } else if (current) {
        current.text += '\n' + line;
        current.html += '<br>' + Utils.escapeHtml(line);
      } else {
        messages.push({
          id: Utils.nextId(), type: 'desc', speaker: '', whisperTo: '', avatarUrl: '',
          html: Utils.escapeHtml(line), text: line, hidden: false
        });
      }
    });

    return messages;
  }

  // ---------------------------------------------------------
  // 로그 두배 오류 자동 해결
  // ---------------------------------------------------------
  function dedupeWholeLog(messages) {
    const n = messages.length;
    if (n < 4 || n % 2 !== 0) return { messages, removed: 0 };
    const half = n / 2;
    const sig = m => m.type + '\u0001' + m.speaker + '\u0001' + m.text;
    for (let i = 0; i < half; i++) {
      if (sig(messages[i]) !== sig(messages[i + half])) return { messages, removed: 0 };
    }
    return { messages: messages.slice(0, half), removed: half };
  }

  return { parse };
})();
