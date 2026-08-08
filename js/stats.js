/* =========================================================
   채록 · stats.js
   전체/캐릭터별/타입별 상세 집계
   ========================================================= */

const Stats = (() => {

  function compute(messages) {
    const totalMessages = messages.length;
    let totalCharsWithSpace = 0;
    let totalCharsNoSpace = 0;

    const byType = {};
    const byCharacter = new Map();

    messages.forEach(m => {
      const withSpace = Utils.countChars(m.text, true);
      const noSpace = Utils.countChars(m.text, false);
      totalCharsWithSpace += withSpace;
      totalCharsNoSpace += noSpace;

      byType[m.type] = (byType[m.type] || 0) + 1;

      if (m.speaker && m.speaker.trim()) {
        const key = m.speaker.trim();
        if (!byCharacter.has(key)) {
          byCharacter.set(key, { name: key, messages: 0, charsWithSpace: 0, charsNoSpace: 0 });
        }
        const e = byCharacter.get(key);
        e.messages += 1;
        e.charsWithSpace += withSpace;
        e.charsNoSpace += noSpace;
      }
    });

    const characterList = Array.from(byCharacter.values())
      .sort((a, b) => b.charsWithSpace - a.charsWithSpace);

    const maxCharChars = characterList.length ? characterList[0].charsWithSpace : 0;

    return {
      totalMessages,
      totalCharsWithSpace,
      totalCharsNoSpace,
      byType,
      characterList,
      maxCharChars
    };
  }

  return { compute };
})();
