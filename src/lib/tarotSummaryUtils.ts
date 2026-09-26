/**
 * 타로 리딩 핵심 3줄 요약 추출 및 하단 중복 요약 블록 분리 유틸리티
 */

export function stripSummaryFromTarotText(text: string): string {
  if (!text) return "";

  // 1. 후행 핵심 요약 섹션 안전하게 분리
  // 요약 블록은 본문(1~5단계) 맨 마지막에 위치하므로 5단계 축복 섹션 이후 또는 후반부(하위 40%)에서만 탐색
  const step5Match = text.match(/(?:###\s*(?:✨\s*)?5[\.\s]|5단계|영혼의\s*한마디|당신의\s*길을\s*축복하는)/i);
  const searchStart = step5Match && step5Match.index !== undefined
    ? step5Match.index + 20
    : Math.floor(text.length * 0.55);

  const endChunk = text.slice(searchStart);
  const summaryHeaderMatch = endChunk.match(
    /(?:\r?\n|^)\s*(?:#{1,6}\s*)?(?:✨\s*)?(?:\[\s*)?(?:핵심\s*(?:3줄\s*|세줄\s*)?요약|3줄\s*요약|Quick\s*Summary)(?:\])?\s*(?::)?\s*(?:\r?\n|$)/i
  );

  if (summaryHeaderMatch && summaryHeaderMatch.index !== undefined) {
    const cutPos = searchStart + summaryHeaderMatch.index;
    let cleaned = text.slice(0, cutPos).trim();
    // 잔여 불릿 라인도 안전하게 정리
    cleaned = cleaned.replace(/(?:\r?\n)\s*[-*•·]?\s*\[(?:현재\s*에너지|방향과\s*결단|실천\s*처방)\][^\r\n]*/gi, "").trim();
    return cleaned;
  }

  // 2. 말머리 없이 본문 끝부분에 불릿 형태로만 남은 경우만 끝부분 정리
  let cleaned = text.replace(/(?:\r?\n)\s*[-*•·]?\s*\[(?:현재\s*에너지|방향과\s*결단|실천\s*처방)\][^\r\n]*$/gi, "").trim();
  return cleaned;
}

export function extractConciseSummary(text: string, cardContext?: any): string[] {
  if (!text || text.trim().length < 40) return [];

  const cleanSentence = (s: string) => {
    return s
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_{1,2}/g, '')
      .replace(/^[-*•·\d.]+\s*/, '')
      .trim();
  };

  // 인사말, 호칭, 상담실 메타 서두 제거 헬퍼
  const stripGreetingFromText = (s: string): string => {
    let str = s.trim();
    str = str.replace(/^(?:(?:친애하는\s*)?(?:질문자|내담자)님[,\s~!]*)?(?:(?:어서\s*오세요|안녕하세요|반갑습니다|안녕하십니까)[,\s~!]*)+/i, '');
    str = str.replace(/^(?:(?:어서\s*오세요|안녕하세요|반갑습니다|안녕하십니까)[,\s~!]*)?(?:(?:친애하는\s*)?(?:질문자|내담자)님[,\s~!]*)*/i, '');
    str = str.replace(/^(?:카드를\s*(?:가만히|조용히|한\s*장씩)?\s*마주하니|촛불을\s*켜고|타로\s*상담실에\s*오신\s*것을\s*환영합니다)[,\s~!.]*/i, '');
    str = str.replace(/^(?:다음은|오늘의|타로\s*리딩의)?\s*(?:핵심\s*3줄\s*요약|3줄\s*요약|핵심\s*요약)(?:입니다|을\s*전해드립니다|:|\.)\s*/i, '');
    return str.trim();
  };

  const isGreetingOrMeta = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed || trimmed.length < 5) return true;
    return (
      /(?:어서\s*오세요|안녕하세요|반갑습니다|안녕하십니까|환영합니다)/.test(trimmed) ||
      /(?:카드를\s*(?:가만히|조용히|한\s*장씩)?\s*마주하니|촛불|대화형\s*어조|적용\s*배열법|펼쳐진\s*카드|상담\s*개요|내담자\s*고민|상담실)/.test(trimmed)
    );
  };

  const formatSummaryLine = (tag: '현재 에너지' | '방향과 결단' | '실천 처방', content: string): string => {
    let cleaned = stripGreetingFromText(content);
    cleaned = cleaned.replace(/^\[[^\]]+\]\s*(:|-|—)?\s*/, '');
    cleaned = cleaned.replace(/^(?:현재\s*에너지|방향과\s*결단|실천\s*처방|개운\s*처방|행동\s*처방|실천\s*가이드|개운\s*가이드)\s*[:—\-]\s*/, '');
    cleaned = cleanSentence(cleaned);

    if (cleaned.length > 135) {
      const idx = cleaned.lastIndexOf('.', 130);
      if (idx > 50) {
        cleaned = cleaned.slice(0, idx + 1);
      } else {
        cleaned = cleaned.slice(0, 130) + '...';
      }
    }
    if (!/[.!?…"'\*_]$/.test(cleaned)) {
      cleaned += '.';
    }
    return `[${tag}] ${cleaned}`;
  };

  let p1Current = '';
  let p1Decision = '';
  let p1Action = '';

  // Priority 1: Explicit [핵심 3줄 요약] block
  const summaryBlockMatch = text.match(
    /(?:\[핵심\s*(?:3줄\s*|세줄\s*)?요약\]|###\s*.*핵심\s*(?:3줄\s*|세줄\s*)?요약|###\s*.*핵심\s*요약|\[핵심\s*요약\]|Quick\s*Summary)([\s\S]*?)(?:$|###)/i
  );

  if (summaryBlockMatch) {
    const rawLines = summaryBlockMatch[1]
      .split('\n')
      .map((l) => cleanSentence(l))
      .filter((l) => l.length > 5 && !l.startsWith('http') && !isGreetingOrMeta(l));

    for (const line of rawLines) {
      const cleaned = stripGreetingFromText(line.replace(/^\[[^\]]+\]\s*/, ''));
      if (!cleaned || isGreetingOrMeta(cleaned)) continue;

      if (
        /\[(?:현재\s*에너지|현재\s*상황|내면\s*에너지|상황\s*진단|현재|에너지|상황)\]/i.test(line) ||
        (!p1Current && /^(?:현재\s*에너지|현재\s*상황|내면|에너지)/i.test(line))
      ) {
        if (!p1Current) { p1Current = cleaned; continue; }
      }
      if (
        /\[(?:방향과\s*결단|결단\s*(?:및|&)?\s*방향(?:성)?|방향성|결단|선택|판정|미래\s*흐름)\]/i.test(line) ||
        (!p1Decision && /^(?:방향과\s*결단|결단|방향|선택|판정)/i.test(line))
      ) {
        if (!p1Decision) { p1Decision = cleaned; continue; }
      }
      if (
        /\[(?:실천\s*처방|개운\s*처방|행동\s*처방|실천\s*가이드|개운\s*가이드|행동\s*가이드|실천\s*조언|행동\s*조언|실천|처방|조언|행동|가이드)\]/i.test(line) ||
        (!p1Action && /^(?:실천\s*처방|개운\s*처방|실천|처방|행동|조언)/i.test(line))
      ) {
        if (!p1Action) { p1Action = cleaned; continue; }
      }
    }

    // Fallback if tags weren't used in summary block: assign in order
    const remaining = rawLines
      .map(stripGreetingFromText)
      .filter((l) => l.length >= 8 && !isGreetingOrMeta(l) && l !== p1Current && l !== p1Decision && l !== p1Action);

    if (!p1Current && remaining.length > 0) p1Current = remaining.shift() || '';
    if (!p1Decision && remaining.length > 0) p1Decision = remaining.shift() || '';
    if (!p1Action && remaining.length > 0) p1Action = remaining.shift() || '';
  }

  // Priority 2: Structured section parsing (Section 1: 현재 에너지 / Section 3: 결단 및 방향성 / Section 4: 실천 처방)
  const sections = text.split(/(?=^###\s+)/m);
  let secCurrent = '';
  let secDecision = '';
  let secAction = '';

  for (const sec of sections) {
    const headerLine = (sec.match(/^###\s+(.+)$/m) || [])[1] || '';
    const body = sec.replace(/^###\s+.*$/m, '').trim();

    // Section 1 / 2: 마음과 현재 에너지, 카드 상징
    if (
      !secCurrent &&
      (headerLine.includes('1.') ||
        headerLine.includes('마음') ||
        headerLine.includes('현재') ||
        headerLine.includes('에너지'))
    ) {
      const sentences = body
        .split(/(?:[\n\r]+|(?<=[.!?])\s+)/)
        .map(cleanSentence)
        .map(stripGreetingFromText)
        .filter((s) => s.length >= 15 && !isGreetingOrMeta(s));

      const scored = sentences.find((s) =>
        /현재|에너지|상황|마음|갈림길|파동|상징|지금|내면|모습/.test(s)
      );
      secCurrent = scored || sentences[0] || '';
    }

    // Section 3: 트리니티 마스터의 직관적 결단 & 방향성
    if (
      !secDecision &&
      (headerLine.includes('3.') ||
        headerLine.includes('결단') ||
        headerLine.includes('방향') ||
        headerLine.includes('판정') ||
        headerLine.includes('선택'))
    ) {
      const rawLines = body
        .split(/(?:[\n\r]+|(?<=[.!?])\s+)/)
        .map(cleanSentence)
        .map(stripGreetingFromText)
        .filter((s) => s.length >= 6 && !isGreetingOrMeta(s));

      const verdictLine = rawLines.find((s) =>
        /최종\s*(판정|선택)|확실한\s*YES|단호한\s*NO|결단이\s*필요한|신중한\s*전환|마스터의\s*핵심\s*선언|확실한\s*추진|신중한\s*내실/.test(
          s
        )
      );
      const expLine = rawLines.find(
        (s) =>
          s !== verdictLine &&
          s.length >= 15 &&
          /긍정|결단|방향|흐름|추진|타이밍|선택|나아가|기회|결실|성취|신뢰|열어/.test(
            s
          )
      );

      if (verdictLine && expLine) {
        secDecision = `${verdictLine} — ${expLine}`;
      } else {
        secDecision = verdictLine || expLine || rawLines[0] || '';
      }
    }

    // Section 4: 실천 처방 (개운 가이드)
    if (
      !secAction &&
      (headerLine.includes('4.') ||
        headerLine.includes('처방') ||
        headerLine.includes('실천') ||
        headerLine.includes('개운') ||
        headerLine.includes('가이드') ||
        headerLine.includes('조언'))
    ) {
      const rawLines = body
        .split(/(?:[\n\r]+|(?<=[.!?])\s+)/)
        .map(cleanSentence)
        .map((s) => s.replace(/^[가-힣\s]{2,10}:\s*/, ''))
        .map(stripGreetingFromText)
        .filter((s) => s.length >= 8 && !isGreetingOrMeta(s));

      const prescription = rawLines.find((s) =>
        /실천|처방|행동|조언|추천|해결|매일|기억|호흡|명상|정돈|물|집중/.test(s)
      );
      secAction = prescription || rawLines[0] || '';
    }
  }

  // Priority 3: Fallback semantic search across entire text
  const cleanFull = cleanSentence(text.replace(/^#+\s.*$/gm, ''));
  const allSentences = cleanFull
    .split(/(?:[\n\r]+|(?<=[.!?])\s+)/)
    .map(cleanSentence)
    .map(stripGreetingFromText)
    .filter((s) => s.length >= 12 && !isGreetingOrMeta(s));

  const fallbackCurrent =
    p1Current ||
    secCurrent ||
    allSentences.find((s) => /현재|지금|마음|에너지|상황|갈림길|파동|내면/.test(s)) ||
    allSentences[0] ||
    (cardContext?.nameKo ? `[${cardContext.nameKo}] 카드의 고유 파동이 오늘 하루 중심 흐름을 이끕니다.` : '내면의 직관과 평온한 중심을 유지하며 하루를 시작하세요.');

  const fallbackDecision =
    p1Decision ||
    secDecision ||
    allSentences.find(
      (s) =>
        s !== fallbackCurrent &&
        /결단|선택|판정|방향|흐름|YES|NO|기회|타이밍|추진|점검/.test(s)
    ) ||
    allSentences[Math.floor(allSentences.length / 2)] ||
    '내면의 나침반을 신뢰하고 흔들림 없이 한 걸음 나아가세요.';

  const fallbackAction =
    p1Action ||
    secAction ||
    (cardContext?.remedy ? cardContext.remedy : '') ||
    allSentences
      .slice()
      .reverse()
      .find(
        (s) =>
          s !== fallbackCurrent &&
          s !== fallbackDecision &&
          /실천|행동|처방|조언|오늘|개운|시작|호흡|정돈/.test(s)
      ) ||
    '맑은 물 한 잔과 깊은 호흡으로 마음의 평온을 지키기.';

  // 🌟 ALWAYS RETURN EXACTLY 3 BULLETS (Currently, Direction, Action)
  return [
    formatSummaryLine('현재 에너지', fallbackCurrent),
    formatSummaryLine('방향과 결단', fallbackDecision),
    formatSummaryLine('실천 처방', fallbackAction),
  ];
}
