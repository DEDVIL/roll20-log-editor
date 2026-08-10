/* =========================================================
   채록 · characters.js
   메시지 목록에서 캐릭터(화자) 목록/아바타를 추출하고
   이름변경/병합/일괄삭제/역할(캐릭터·나레이션)을 지원한다.
   ========================================================= */

const Characters = (() => {

  // 화자 없는 나레이션(desc)을 캐릭터 매핑 목록에 함께 보여줄 때 쓰는 고정 키.
  // 실제 speaker 값이 아니라 목록/선택/일괄삭제에서 이 항목을 구분하기 위한 표식.
  const NARRATION_KEY = '(나레이션)';

  // 메시지 배열 → [{name, count, charCount, color, avatarUrl}]
  // 마지막에 화자 없는 나레이션(desc) 항목을 하나 더 추가해서(있는 경우)
  // 캐릭터 매핑 패널에서 함께 관리(선택 삭제 등)할 수 있게 한다.
  function extract(messages) {
    const map = new Map();
    let narrationCount = 0, narrationChars = 0;
    messages.forEach(m => {
      const name = m.speaker && m.speaker.trim() ? m.speaker.trim() : null;
      if (!name) {
        if (m.type === 'desc') {
          narrationCount += 1;
          narrationChars += Utils.countChars(m.text, true);
        }
        return;
      }
      if (!map.has(name)) map.set(name, { name, count: 0, charCount: 0, avatarUrl: '' });
      const e = map.get(name);
      e.count += 1;
      e.charCount += Utils.countChars(m.text, true);
      if (!e.avatarUrl && m.avatarUrl) e.avatarUrl = m.avatarUrl;
    });
    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    list.forEach(c => { c.color = Utils.colorForName(c.name); });
    if (narrationCount > 0) {
      list.push({
        name: NARRATION_KEY, count: narrationCount, charCount: narrationChars,
        avatarUrl: '', color: '#8A8694', isNarration: true
      });
    }
    return list;
  }

  function rename(messages, oldName, newName) {
    if (!newName || !newName.trim() || oldName === newName) return messages;
    const nn = newName.trim();
    return messages.map(m => (m.speaker === oldName ? { ...m, speaker: nn } : m));
  }

  function bulkDelete(messages, names) {
    const set = new Set(names);
    const before = messages.length;
    const result = messages.filter(m => !set.has(m.speaker));
    return { messages: result, removed: before - result.length };
  }

  // 아바타 URL 을 못 찾았거나 로드 실패한 캐릭터를 위한 수동 지정 이미지 적용
  function applyAvatarOverride(messages, name, dataUrl) {
    return messages.map(m => (m.speaker === name ? { ...m, avatarUrl: dataUrl } : m));
  }

  return { extract, rename, bulkDelete, applyAvatarOverride, NARRATION_KEY };
})();
