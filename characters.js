/* =========================================================
   채록 · characters.js
   메시지 목록에서 캐릭터(화자) 목록을 추출하고
   이름변경/병합/일괄삭제를 지원한다.
   ========================================================= */

const Characters = (() => {

  // 메시지 배열 → [{name, count, charCount, color}] (등장 횟수 내림차순)
  function extract(messages) {
    const map = new Map();
    messages.forEach(m => {
      const name = m.speaker && m.speaker.trim() ? m.speaker.trim() : (m.type === 'system' ? null : '(이름 없음)');
      if (!name) return;
      if (!map.has(name)) map.set(name, { name, count: 0, charCount: 0 });
      const e = map.get(name);
      e.count += 1;
      e.charCount += Utils.countChars(m.text, true);
    });
    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    list.forEach(c => { c.color = Utils.colorForName(c.name); });
    return list;
  }

  // oldName 을 가진 모든 메시지의 speaker 를 newName 으로 변경(이름변경/병합 겸용)
  function rename(messages, oldName, newName) {
    if (!newName || !newName.trim() || oldName === newName) return messages;
    const nn = newName.trim();
    return messages.map(m => (m.speaker === oldName ? { ...m, speaker: nn } : m));
  }

  // names 배열에 속한 화자의 메시지를 전부 제거
  function bulkDelete(messages, names) {
    const set = new Set(names);
    const before = messages.length;
    const result = messages.filter(m => !set.has(m.speaker));
    return { messages: result, removed: before - result.length };
  }

  return { extract, rename, bulkDelete };
})();
