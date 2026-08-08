/* =========================================================
   채록 · parser.js
   Roll20 Chat Archive HTML(붙여넣기) 및 일반 텍스트 로그를
   내부 메시지 모델로 변환한다.

   메시지 모델:
   {
     id, type: 'dialog'|'emote'|'whisper'|'roll'|'system'|'image',
     speaker, whisperTo, html, text, hidden
   }
   ========================================================= */

const Parser = (() => {

  // ---------------------------------------------------------
  // 진입점: HTML 여부를 감지해 적절한 파서로 분기
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
      // HTML 안에 message 클래스가 하나도 안 잡히면 텍스트로 낙하
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

    // class 목록에 "message" 토큰을 가진 모든 요소를 후보로 수집
    const all = root.querySelectorAll('*');
    const candidates = [];
    all.forEach(el => {
      const cls = typeof el.className === 'string' ? el.className : '';
      if (/(^|\s)message(\s|$)/.test(cls)) candidates.push(el);
    });

    // 후보 중 다른 후보를 포함하는(조상인) 요소는 제외 → 가장 안쪽 message 요소만 사용
    const leafCandidates = candidates.filter(
      el => !candidates.some(other => other !== el && el.contains(other))
    );

    const messages = [];

    leafCandidates.forEach(el => {
      const parsed = extractMessage(el);
      if (!parsed) return;
      messages.push(parsed);
    });

    // 인접한(연속된) 완전 동일 메시지만 1차로 정리 — Roll20이 같은 메시지를
    // 바로 다음 줄에 그대로 다시 그리는 렌더링 버그 대응. 비연속 중복(같은 대사를
    // 다른 시점에 다시 말한 경우)은 건드리지 않는다.
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
    else if (/\b(rollresult|gmrollresult|diceroll|inlinerollresult)\b/i.test(clsRaw)) type = 'roll';
    else if (/\bsystem\b/i.test(clsRaw)) type = 'system';
    else if (/\b(general|desc|api)\b/i.test(clsRaw)) type = 'dialog';

    // 타임스탬프 제거
    clone.querySelectorAll('.tstamp, .timestamp').forEach(n => n.remove());

    // 발화자 추출
    let speaker = '';
    const bySpan = clone.querySelector('.by');
    if (bySpan) {
      speaker = bySpan.textContent.replace(/:\s*$/, '').trim();
      bySpan.remove();
      // .by 뒤에 콜론이 별도 텍스트 노드로 남아있는 경우 제거 (예: "이름</span>: 내용")
      stripLeadingColon(clone);
    }

    clone.querySelectorAll('.spacer').forEach(n => n.remove());

    // 귓속말 대상 분리: "이름 (누구에게)"
    let whisperTo = '';
    if (speaker) {
      const m = speaker.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
      if (m) {
        speaker = m[1].trim();
        whisperTo = m[2].trim();
      }
    }

    stripBackgroundColor(clone);

    if (type === 'roll') {
      const formulaEl = clone.querySelector('.formula');
      const totalEl = clone.querySelector('.rolled, .total, [class*="total"]');
      if (formulaEl && totalEl) {
        const formulaText = formulaEl.textContent.trim();
        const totalText = totalEl.textContent.trim();
        if (formulaText && totalText) {
          clone.innerHTML =
            `<span class="roll-formula">${Utils.escapeHtml(formulaText)}</span>` +
            `<span class="roll-arrow"> → </span>` +
            `<span class="roll-total">${Utils.escapeHtml(totalText)}</span>`;
        }
      }
    }

    const html = clone.innerHTML.trim();
    const text = clone.textContent.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();

    if (!text && !clone.querySelector('img')) return null;

    if (clone.querySelector('img') && !text) type = 'image';

    const hidden = /this message is hidden/i.test(text) ||
                   /메시지가?\s*(숨겨|가려)/i.test(text) ||
                   /\(\d+\s*messages? deleted\)/i.test(text);

    if (type === 'system' && !speaker) {
      // system 메시지는 화자 없음이 정상
    }

    return {
      id: Utils.nextId(),
      type,
      speaker,
      whisperTo,
      html,
      text,
      hidden
    };
  }

  // background-color 만 제거(다이스 스프라이트 등 background-image(url)는 보존)
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

  // 첫 텍스트 노드 맨 앞의 ": " / "： " 를 제거 (.by 스팬 제거 후 남는 구분자)
  function stripLeadingColon(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (first && /^\s*[:：]\s*/.test(first.textContent)) {
      first.textContent = first.textContent.replace(/^\s*[:：]\s*/, '');
    }
  }

  // HTML → 줄바꿈이 보존된 일반 텍스트로 변환 (contenteditable 에 일반 텍스트를
  // 붙여넣으면 브라우저가 줄마다 <div>/<br> 로 감싸는 경우가 많아, textContent만
  // 쓰면 줄바꿈 정보가 사라지는 문제를 막기 위해 실제 레이아웃 기반 innerText 사용)
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
  // 일반 텍스트 로그 파서 ("이름: 대사" 줄 단위)
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
          id: Utils.nextId(),
          type: 'dialog',
          speaker,
          whisperTo: '',
          html: '',
          text: body,
          hidden: /this message is hidden/i.test(body)
        };
        current.html = Utils.escapeHtml(body);
        messages.push(current);
      } else if (current) {
        current.text += '\n' + line;
        current.html += '<br>' + Utils.escapeHtml(line);
      } else {
        messages.push({
          id: Utils.nextId(),
          type: 'system',
          speaker: '',
          whisperTo: '',
          html: Utils.escapeHtml(line),
          text: line,
          hidden: false
        });
      }
    });

    return messages;
  }

  // ---------------------------------------------------------
  // 로그 두배 오류: 전체 메시지 배열이 동일한 두 구간으로
  // 정확히 나뉘면(=archive 페이지가 통째로 두 번 렌더된 경우)
  // 뒷 절반을 제거한다.
  // ---------------------------------------------------------
  function dedupeWholeLog(messages) {
    const n = messages.length;
    if (n < 4 || n % 2 !== 0) return { messages, removed: 0 };
    const half = n / 2;
    const sig = m => m.type + '\u0001' + m.speaker + '\u0001' + m.text;
    for (let i = 0; i < half; i++) {
      if (sig(messages[i]) !== sig(messages[i + half])) {
        return { messages, removed: 0 };
      }
    }
    return { messages: messages.slice(0, half), removed: half };
  }

  return { parse };
})();
