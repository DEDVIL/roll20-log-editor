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
    leafCandidates.forEach(el => {
      const parsed = extractMessage(el);
      if (parsed) messages.push(parsed);
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

    // 화자 태그(.by)가 없는 general 메시지는 대부분 GM 지문/내레이션(desc)이다
    if (type === 'dialog' && !speaker) type = 'desc';

    // 배경색 통일은 대사류에만 적용한다. roll/system 은 판정 성공도 등을 색으로
    // 표현하는 경우가 많아 원본 배색을 보존한다.
    if (type !== 'roll' && type !== 'system') {
      stripBackgroundColor(clone);
    }

    linkifyMarkdown(clone);

    const html = clone.innerHTML.trim();
    const text = clone.textContent.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();

    if (!text && !clone.querySelector('img')) return null;

    const hidden = /this message is hidden/i.test(text) ||
                   /메시지가?\s*(숨겨|가려)/i.test(text) ||
                   /\(\d+\s*messages? deleted\)/i.test(text);

    return { id: Utils.nextId(), type, speaker, whisperTo, avatarUrl, html, text, hidden };
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
          hidden: /this message is hidden/i.test(body)
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
