/**
 * 타로 리딩 핵심 3줄 요약 추출 및 하단 중복 요약 블록 분리 유틸리티
 */

export function stripSummaryFromTarotText(text: string): string {
  if (!text) return "";

  // 1. 후행 핵심 요약 섹션(위치 불문 후반부 요약 블록 전체) 안전하게 분리
  const match = text.match(/(?:\r?\n|^)\s*(?:#{1,6}\s*)?(?:✨\s*)?(?:\d+\.\s*)?(?:\[\s*)?(?:핵심\s*(?:3줄\s*|세줄\s*)?요약|3줄\s*요약|Quick\s*Summary)(?:\])?\s*[\s\S]*$/i);
  if (match && match.index !== undefined) {
    let cleaned = text.slice(0, match.index).trim();
    // 잔여 불릿 라인도 안전하게 정리
    cleaned = cleaned.replace(/(?:\r?\n|^)\s*[-*•·]?\s*\[(?:현재\s*에너지|방향과\s*결단|실천\s*처방)\][^\r\n]*/gi, "").trim();
    return cleaned;
  }

  // 2. 말머리 없이 끝부분에 불릿 형태로만 남은 경우도 정리
  let cleaned = text.replace(/(?:\r?\n|^)\s*[-*•·]?\s*\[(?:현재\s*에너지|방향과\s*결단|실천\s*처방)\][^\r\n]*/gi, "").trim();
  return cleaned;
}

export function extractConciseSummary(text: string): string[] {
  if (!text || text.trim().length < 80) return [];

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
    if (!trimmed || trimmed.length < 6) return true;
    return (
      /(?:어서\s*오세요|안녕하세요|반갑습니다|안녕하십니까|환영합니다)/.test(trimmed) ||
      /(?:카드를\s*(?:가만히|조용히|한\s*장씩)?\s*마주하니|촛불|대화형\s*어조|적용\s*배열법|펼쳐진\s*카드|상담\s*개요|내담자\s*고민|상담실)/.test(trimmed) ||
      /^(?:다음은|오늘의|타로\s*리딩의)?\s*(?:핵심\s*3줄\s*요약|3줄\s*요약|핵심\s*요약)/.test(trimmed)
    );
  };

  // Priority 1: Explicit [핵심 3줄 요약] block
  const summaryBlockMatch = text.match(/(?:\[핵심\s*3줄\s*요약\]|###\s*.*핵심\s*3줄\s*요약|###\s*.*핵심\s*요약|\[핵심\s*요약\])([\s\S]*?)(?:$|###)/i);
  if (summaryBlockMatch) {
    const rawLines = summaryBlockMatch[1]
      .split('\n')
      .map((l) => cleanSentence(l))
      .filter((l) => l.length > 5 && !l.startsWith('http') && !isGreetingOrMeta(l));

    let p1Current = '';
    let p1Decision = '';
    let p1Action = '';

    for (const line of rawLines) {
      const cleaned = stripGreetingFromText(line.replace(/^\[[^\]]+\]\s*/, ''));
      if (!cleaned || isGreetingOrMeta(cleaned)) continue;

      if (/\[(?:현재\s*에너지|현재|에너지|상황\s*진단)\]/i.test(line) || (!p1Current && /현재|에너지|상황|마음/i.test(line))) {
        if (!p1Current) { p1Current = cleaned; continue; }
      }
      if (/\[(?:방향과\s*결단|결단\s*및\s*방향|방향성|결단|선택)\]/i.test(line) || (!p1Decision && /방향|결단|판정|선택|YES|NO/i.test(line))) {
        if (!p1Decision) { p1Decision = cleaned; continue; }
      }
      if (/\[(?:실천\s*처방|개운\s*처방|행동\s*처방|실천|처방)\]/i.test(line) || (!p1Action && /실천|처방|조언|행동|오늘/i.test(line))) {
        if (!p1Action) { p1Action = cleaned; continue; }
      }
    }

    const remaining = rawLines
      .map(stripGreetingFromText)
      .filter((l) => l.length >= 10 && !isGreetingOrMeta(l) && l !== p1Current && l !== p1Decision && l !== p1Action);

    if (!p1Current && remaining.length > 0) p1Current = remaining.shift() || '';
    if (!p1Decision && remaining.length > 0) p1Decision = remaining.shift() || '';
    if (!p1Action && remaining.length > 0) p1Action = remaining.shift() || '';

    if (p1Current && (p1Decision || p1Action)) {
      const res: string[] = [];
      res.push(`[현재 에너지] ${p1Current}`);
      if (p1Decision) res.push(`[방향과 결단] ${p1Decision}`);
      if (p1Action) res.push(`[실천 처방] ${p1Action}`);
      return res;
    }
  }

  // Priority 2: Structured section parsing (1. 현재 에너지 / 3. 결단 및 방향성 / 4. 실천 처방)
  const sections = text.split(/(?=^###\s+)/m);
  let currentInsight = '';
  let decisionInsight = '';
  let actionInsight = '';

  for (const sec of sections) {
    const headerLine = (sec.match(/^###\s+(.+)$/m) || [])[1] || '';
    const body = sec.replace(/^###\s+.*$/m, '').trim();

    // Section 1 / 2: 마음과 현재 에너지, 카드 상징
    if (
      !currentInsight &&
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
      currentInsight = scored || sentences[0] || '';
    }

    // Section 3: 트리니티 마스터의 직관적 결단 & 방향성
    if (
      !decisionInsight &&
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
        /최종\s*(판정|선택)|확실한\s*YES|단호한\s*NO|결단이\s*필요한|신중한\s*전환|마스터의\s*핵심\s*선언/.test(
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
        decisionInsight = `${verdictLine} — ${expLine}`;
      } else {
        decisionInsight = verdictLine || expLine || rawLines[0] || '';
      }
    }

    // Section 4: 실천 처방 (개운 가이드)
    if (
      !actionInsight &&
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
        .map((s) => s.replace(/^[가-힣\s]{2,10}:\s*/, '')) // Strip label prefix like "마음의 정돈: "
        .map(stripGreetingFromText)
        .filter((s) => s.length >= 8 && !isGreetingOrMeta(s));

      const prescription = rawLines.find((s) =>
        /실천|처방|행동|조언|추천|해결|매일|기억|호흡|명상|정돈/.test(s)
      );
      actionInsight = prescription || rawLines[0] || '';
    }
  }

  const results: string[] = [];
  if (currentInsight) {
    results.push(`[현재 에너지] ${currentInsight.slice(0, 110)}`);
  }
  if (decisionInsight) {
    results.push(`[방향과 결단] ${decisionInsight.slice(0, 110)}`);
  }
  if (actionInsight) {
    results.push(`[실천 처방] ${actionInsight.slice(0, 110)}`);
  }

  return results.length >= 2 ? results : [];
}
