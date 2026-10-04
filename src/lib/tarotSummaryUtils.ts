/**
 * 타로 리딩 핵심 3줄 요약 추출 및 하단 중복 요약 블록 분리 유틸리티
 */

/**
 * 🔮 트리니티 마스터 직관적 결단 섹션 및 리딩에서 YES / NO 보존 (예·아니오 타로의 핵심 지표)
 */
export function sanitizeTarotDecisionYesNo(text: string): string {
  if (!text) return "";
  // 예·아니오 타로 및 직관적 결단 리딩 시 YES / NO 판정을 있는 그대로 명확하게 보존합니다.
  return text;
}

export function stripSummaryFromTarotText(text: string): string {
  if (!text) return "";
  const sanitizedInput = sanitizeTarotDecisionYesNo(text);

  // 1. 후행 핵심 요약 섹션 안전하게 분리
  // 요약 블록은 본문(1~5단계) 맨 마지막에 위치하므로 5단계 축복 섹션 이후 또는 후반부(하위 40%)에서만 탐색
  const step5Match = sanitizedInput.match(/(?:###\s*(?:✨\s*)?5[\.\s]|5단계|영혼의\s*한마디|당신의\s*길을\s*축복하는)/i);
  const searchStart = step5Match && step5Match.index !== undefined
    ? step5Match.index + 20
    : Math.floor(sanitizedInput.length * 0.55);

  const endChunk = sanitizedInput.slice(searchStart);
  const summaryHeaderMatch = endChunk.match(
    /(?:\r?\n|^)\s*(?:#{1,6}\s*)?(?:✨\s*)?(?:\[\s*)?(?:핵심\s*(?:3줄\s*|세줄\s*)?요약|3줄\s*요약|Quick\s*Summary)(?:\])?\s*(?::)?\s*(?:\r?\n|$)/i
  );

  if (summaryHeaderMatch && summaryHeaderMatch.index !== undefined) {
    const cutPos = searchStart + summaryHeaderMatch.index;
    let cleaned = sanitizedInput.slice(0, cutPos).trim();
    // 잔여 불릿 라인도 안전하게 정리
    cleaned = cleaned.replace(/(?:\r?\n)\s*[-*•·]?\s*\[(?:현재\s*에너지|방향과\s*결단|실천\s*처방)\][^\r\n]*/gi, "").trim();
    return cleaned;
  }

  // 2. 말머리 없이 본문 끝부분에 불릿 형태로만 남은 경우만 끝부분 정리
  let cleaned = sanitizedInput.replace(/(?:\r?\n)\s*[-*•·]?\s*\[(?:현재\s*에너지|방향과\s*결단|실천\s*처방)\][^\r\n]*$/gi, "").trim();
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
    cleaned = cleaned.replace(/^\[(?!YES\b|NO\b|조건부\s*YES)[^\]]+\]\s*(:|-|—)?\s*/i, '');
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
        /최종\s*(판정|선택)|(?:확실한\s*|조건부\s*)?YES|(?:단호한\s*)?NO|마스터의\s*핵심\s*선언|결단이\s*필요한|신중한\s*전환|확실한\s*추진|신중한\s*내실/i.test(
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

export interface OracleConciseSummaryParams {
  message?: string;
  oracleMode: 'healing' | 'growth';
  cards?: any[];
  saju?: any;
  todayCard?: any;
  microAction?: any;
  macroFocus?: string;
  microMission?: any;
}

/**
 * 🔮 78장 오라클 전용 핵심 3줄 요약 추출기 (사주 원국 ✕ 타로 도상 상징 융합 정밀 분석)
 * 일반 타로보다 훨씬 더 디테일하고 명확하게 카드의 뜻과 사주상 오늘의 기운을 결합하여 도출
 * 표준 태그: [현재 에너지] · [방향과 결단] · [실천 처방]
 */
export function extractOracleConciseSummary(params: OracleConciseSummaryParams): string[] {
  const { message = '', oracleMode, cards = [], saju, todayCard, microAction, macroFocus, microMission } = params;
  const isHealing = oracleMode === 'healing';

  const clean = (s: string) => {
    return s
      .replace(/[\*\_]/g, '')
      .replace(/^\[[^\]]+\]\s*/, '')
      .replace(/^[-*•·\d.]+\s*/, '')
      .trim();
  };

  const fmt = (tag: string, content: string) => {
    let t = clean(content);
    t = t.replace(/^(?:친애하는|안녕하세요|반갑습니다|안녕|어서\s*오세요)[^,.]*[,.]\s*/i, '');
    if (t.length > 145) {
      const idx = t.lastIndexOf('.', 140);
      if (idx > 60) t = t.slice(0, idx + 1);
      else t = t.slice(0, 140) + '...';
    }
    if (!/[.!?]$/.test(t)) t += '.';
    return `[${tag}] ${t}`;
  };

  // 1. Check if the message contains an explicit [핵심 3줄 요약] block
  const summaryBlockMatch = message.match(
    /(?:\[핵심\s*(?:3줄\s*|세줄\s*)?요약\]|###\s*.*핵심\s*(?:3줄\s*|세줄\s*)?요약|###\s*.*핵심\s*요약|\[핵심\s*요약\]|Quick\s*Summary)([\s\S]*?)(?:$|###)/i
  );
  if (summaryBlockMatch) {
    const rawLines = summaryBlockMatch[1]
      .split('\n')
      .map(clean)
      .filter((l) => l.length > 10 && !l.startsWith('http'));
    if (rawLines.length >= 3) {
      return [
        fmt('현재 에너지', rawLines[0]),
        fmt('방향과 결단', rawLines[1]),
        fmt('실천 처방', rawLines[2]),
      ];
    }
  }

  // 2. Extract Card details and Saju elements for high-detail, rich fusion synthesis
  const c1 = cards[0];
  const c2 = cards[1];
  const c3 = cards[2];

  const dayMaster = saju?.dayMaster?.symbolName || saju?.dayMaster?.name || '본원 기질';
  const dominantEl = saju?.elements?.dominant?.name || '우세 오행';
  const lackingEl = saju?.elements?.lacking?.name || '결핍 오행';
  const yongsin = saju?.yongsin?.name || '용신 기운';

  const c1Name = c1 ? `${c1.nameKo || c1.name}${c1.reversed ? '(역방향)' : ''}` : '과거 카드';
  const c2Name = c2 ? `${c2.nameKo || c2.name}${c2.reversed ? '(역방향)' : ''}` : '현재 카드';
  const c3Name = c3 ? `${c3.nameKo || c3.name}${c3.reversed ? '(역방향)' : ''}` : '조언 카드';

  const c1Keyword = c1?.keywords?.[0] || '내면의 뿌리';
  const c2Keyword = c2?.keywords?.[0] || '상황의 전개';
  const c3Keyword = c3?.keywords?.[0] || '해결의 열쇠';

  const todayCardName = todayCard ? `${todayCard.nameKo || todayCard.name}${todayCard.reversed ? '(역방향)' : ''}` : '';
  const todayCardKeyword = todayCard?.keywords?.[0] || '일일 운기';
  const todayPrefix = todayCardName ? `오늘의 지배 타로인 [${todayCardName}]('${todayCardKeyword}')의 파동 속에서 ` : '';

  // 1. [현재 에너지] (오늘의 지배 타로 + Card 1 & 2 도상 상징 + 사주 일간 본원 & 우세 오행 흐름 결합)
  let line1 = '';
  if (isHealing) {
    line1 = `${todayPrefix}사주 본원인 ${dayMaster}의 기운이 ${dominantEl}의 과열된 파동 속에서 ${c1Name}의 '${c1Keyword}' 뿌리와 맞물려, 현재 ${c2Name} 카드가 가리키듯 상황의 무게를 홀로 감내하며 심리적 긴장과 에너지 분산이 누적된 전환점의 상태입니다.`;
  } else {
    line1 = `${todayPrefix}사주 본원인 ${dayMaster}의 고유한 역량이 ${c1Name}의 '${c1Keyword}' 마인드셋과 만나, 현재 ${c2Name} 카드가 지적하듯 실행을 가로막는 생각의 과부하와 ${dominantEl}의 조급함으로 인해 현실적 추진력이 일시적으로 정체된 상태입니다.`;
  }

  // 2. [방향과 결단] (Card 3 해결 열쇠 도상 + 사주 용신 보약 에너지 결합)
  let line2 = '';
  if (isHealing) {
    line2 = `사주에서 결핍된 ${lackingEl}을 보완하는 용신(${yongsin})의 생기를 깨우고, 3번 조언 카드인 ${c3Name}의 '${c3Keyword}' 지혜를 받아들여, 스스로를 채근하던 낡은 틀을 과감히 내려놓고 온전한 자아 회복의 길을 선택해야 합니다.`;
  } else {
    line2 = `사주 용신(${yongsin})의 날카로운 돌파 에너지를 가동하고, 3번 조언 카드인 ${c3Name}의 '${c3Keyword}' 전략을 채택하여, 분산된 목표를 단 하나로 압축하고 망설임 없이 결단하여 우선순위 1번에 모든 자원을 집중해야 합니다.`;
  }

  // 3. [실천 처방] (Card 3 구체적 행동 팁 + 사주 오행 일상 개운법 결합)
  let line3 = '';
  const actionText = typeof microAction === 'string' && microAction.length > 5
    ? microAction
    : (microAction?.description || microMission?.title || '');

  if (actionText && actionText.length > 8) {
    line3 = `${c3Name} 카드의 구체적 상징과 사주 ${yongsin} 개운법을 융합하여, 오늘 일상에서 "${clean(actionText)}"을(를) 10분 안에 즉각 실행함으로써 운명의 선순환 물꼬를 트세요.`;
  } else if (isHealing) {
    line3 = `${c3Name} 카드의 치유 처방과 사주 ${yongsin} 보약 에너지를 담아, 오늘 따뜻한 차 한 잔과 3번의 깊은 복식호흡으로 마음의 긴장을 즉시 비워내고 나 자신에게 온전한 쉼을 선물하기.`;
  } else {
    line3 = `${c3Name} 카드의 강력한 실행력과 사주 ${yongsin} 추진력을 결합하여, 오늘 10분 안에 끝낼 수 있는 가장 작은 현실 행동 과제 1가지를 망설임 없이 지금 즉시 완수하기.`;
  }

  return [
    fmt('현재 에너지', line1),
    fmt('방향과 결단', line2),
    fmt('실천 처방', line3),
  ];
}

/**
 * 한글 음절의 종성(받침) 유무 확인
 */
export function hasKoreanJongseong(word: string): boolean {
  if (!word) return false;
  const lastChar = word.trim().slice(-1);
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/**
 * 한국어 성명에서 성(姓)을 제외하고 다정한 이름(Given Name)만 추출
 * 예: "박주형" -> "주형", "남궁선우" -> "선우", "김철" -> "철", "주형" -> "주형", "여행자" -> "여행자"
 */
export function extractGivenName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (trimmed.length <= 1 || trimmed === '여행자') return trimmed;

  // 공백으로 성과 이름이 구분된 경우 (예: "박 주형" -> "주형")
  if (trimmed.includes(' ')) {
    const parts = trimmed.split(/\s+/);
    return parts[parts.length - 1];
  }

  // 한글 2글자 복합성 (남궁, 황보, 제갈, 사공, 선우, 서문, 독고, 동방 등)
  const compoundSurnames = ['남궁', '황보', '제갈', '사공', '선우', '서문', '독고', '동방'];
  for (const compound of compoundSurnames) {
    if (trimmed.startsWith(compound) && trimmed.length > 2) {
      return trimmed.slice(2);
    }
  }

  // 한글 3글자 성명 (가장 일반적인 경우: 성 1자 + 이름 2자, 예: 박주형 -> 주형)
  if (trimmed.length === 3 && /^[가-힣]{3}$/.test(trimmed)) {
    return trimmed.slice(1);
  }

  // 한글 4글자 성명 (외자 성 + 이름 3자, 예: 김하늘별 -> 하늘별)
  if (trimmed.length === 4 && /^[가-힣]{4}$/.test(trimmed)) {
    return trimmed.slice(1);
  }

  // 한글 2글자 성명 (단성 + 외자 이름, 예: 김철 -> 철, 이진 -> 진)
  if (trimmed.length === 2 && /^[가-힣]{2}$/.test(trimmed)) {
    const commonSurnames = /^[김이박최정강조윤장임한오서신권황안송류홍전고문손양배백허유남심노하곽성차주우구라민진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편]/;
    if (commonSurnames.test(trimmed)) {
      return trimmed.slice(1);
    }
  }

  return trimmed;
}

/**
 * 이름 뒤에 다정한 호격 조사(아/야) 붙이기
 * 예: "주형" -> "주형아", "민수" -> "민수야", "철" -> "철아"
 */
export function formatKoreanVocative(name: string): string {
  if (!name) return '';
  return hasKoreanJongseong(name) ? `${name}아` : `${name}야`;
}

/**
 * 이름 뒤에 다정한 대상 조사(이에게/에게) 붙이기
 * 예: "주형" -> "주형이에게", "민수" -> "민수에게"
 */
export function formatKoreanToTarget(name: string): string {
  if (!name) return '';
  return hasKoreanJongseong(name) ? `${name}이에게` : `${name}에게`;
}

