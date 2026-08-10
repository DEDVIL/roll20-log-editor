/* =========================================================
   채록 · grouping.js
   Roll20 실제 채팅창처럼, 같은 화자가 연속으로 말하면
   아바타/이름은 한 번만 보여주고 그 아래로 대사(말풍선)만 쌓이도록
   메시지 배열을 "렌더 유닛" 목록으로 묶는다.

   미리보기(renderer.js)와 내보내기(exporter.js)가 완전히 동일한
   규칙을 쓰도록 여기 한 곳에서만 정의한다.

   렌더 유닛:
   - { kind:'group', key, speaker, whisperTo, avatarUrl, items:[msg,...] }
     → 대사/감정/귓속말 이어말하기 묶음 (아바타·이름 1회 + 말풍선 N개)
   - { kind:'center', msg }  → 나레이션/시스템 (화자 없음, 가운데 정렬)
   - { kind:'roll',   msg }  → 판정 결과 (화자 유무 무관, 카드형)
   ========================================================= */

const Grouping = (() => {

  // 캐릭터 "역할" 오버라이드(캐릭터⇄나레이션)까지 반영한 정렬 방식
  function resolveAlign(m, characterRoles) {
    const role = m.speaker ? characterRoles.get(m.speaker) : null;
    if (role === 'narration') return 'center';
    if (role === 'character') return 'row';
    if (m.type === 'roll') return 'roll';
    if (m.type === 'desc' || m.type === 'system') return 'center';
    return 'row';
  }

  // 같은 화자 + 같은 귓속말 대상이 바로 이어지면 하나의 그룹으로 묶는다.
  // (일반 대사 ↔ 감정표현이 섞여도 화자만 같으면 이어붙임 — Roll20 실제 UI와 동일)
  function build(messages, characterRoles) {
    const units = [];
    messages.forEach(m => {
      const align = resolveAlign(m, characterRoles);

      if (align !== 'row') {
        units.push({ kind: align, msg: m });
        return;
      }

      const key = (m.speaker || '') + '\u0001' + (m.whisperTo || '');
      const last = units[units.length - 1];
      if (last && last.kind === 'group' && last.key === key) {
        last.items.push(m);
        if (!last.avatarUrl && m.avatarUrl) last.avatarUrl = m.avatarUrl;
      } else {
        units.push({
          kind: 'group', key,
          speaker: m.speaker, whisperTo: m.whisperTo, avatarUrl: m.avatarUrl,
          items: [m]
        });
      }
    });
    return units;
  }

  return { build, resolveAlign };
})();
