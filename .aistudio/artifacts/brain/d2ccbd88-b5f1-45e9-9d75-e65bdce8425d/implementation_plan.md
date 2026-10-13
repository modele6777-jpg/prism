# [구현 계획] 타로 리딩 핵심 3줄 요약 TTS 낭독 시 본문 동시 하이라이트 분리 및 정밀 동기화

사용자가 타로 리딩의 **[핵심 3줄 요약]**을 TTS 음성으로 들을 때, 하단 본문(상세 리딩)의 문장들이 동시에 형광펜 하이라이트 표시되는 현상을 방지하고, 사용자가 선택한 요구사항에 맞추어 **요약 낭독과 본문 낭독의 하이라이트 영역을 상호 배타적이고 명확하게 분리**합니다.

---

## 사용자 확인 요구사항 (Clarifying Answers 반영)
1. **요약 낭독 시 하이라이트 범위**: 핵심 3줄 요약 카드 내부 문장만 하이라이트하고 본문은 완전히 제외
2. **본문 전체 낭독 시 하이라이트 범위**: 본문 전체 낭독 시에만 본문 마크다운 문장 실시간 하이라이트 적용
3. **음성 낭독 화면 스크롤**: 현재 낭독 중인 활성 문장 위치로 부드러운 자동 스크롤 유지

---

## 1. 근본 원인 분석
- `Streamdown.tsx`는 전역 `useTTSState()`의 `isSpeaking` 상태를 직접 구독하여 마크다운 내부 문장들에 `highlightSentencesInChildren`을 무조건 적용하고 있었습니다.
- 상단 `TarotSummaryGraphicCard`의 "요약 낭독" 버튼을 눌러 요약 음성이 재생될 때도 전역 `isSpeaking`이 활성화되고, 요약문에 포함된 단어나 카드의 상징 키워드가 본문과 유사하면 퍼지 매칭(`isSentenceActive`)에 의해 본문 문장들이 동시에 하이라이트되는 간섭이 발생했습니다.
- 반대로 본문 전체를 낭독할 때도 상단 요약 카드의 텍스트가 부분적으로 하이라이트될 수 있는 구조였습니다.

---

## 2. 해결 방안 및 구현 세부 계획

### 2.1 `TTSHighlightedText.tsx`에 `enabled` prop 추가 및 안전 가드
- `TTSHighlightedText` 컴포넌트에 `enabled?: boolean` (기본값 `true`) prop 추가
- `enabled === false`일 경우 `activeTarget`을 무시하고 일반 텍스트로만 렌더링하여 불필요한 하이라이트 마킹 원천 차단
- 활성 문장 마크인 `TTSHighlightMark`의 부드러운 `scrollIntoView`는 활성화된 영역에서만 정확히 동작하도록 유지

### 2.2 `Streamdown.tsx`에 `enableTTSHighlight` 제어 prop 및 텍스트 검증 추가
- `StreamdownProps`에 `enableTTSHighlight?: boolean` (기본값 `true`) 추가
- `enableTTSHighlight === false`일 때는 마크다운의 모든 요소(p, li, h1~h6, blockquote 등)에 하이라이터 래핑을 건너뛰고 기본 마크다운으로 렌더링
- `enableTTSHighlight === true`일 때도 현재 재생 중인 TTS 텍스트가 실제로 해당 `Streamdown` 본문에 속해 있는지 컨텍스트 일치 여부 확인

### 2.3 `TarotSummaryGraphicCard.tsx`의 하이라이트 활성화 조건 강화
- `TarotSummaryGraphicCard`가 전달받는 `isTTSActive` 상태를 내부의 `TTSHighlightedText` 컴포넌트들에 `enabled={isTTSActive}`로 전달
- "요약 낭독"이 재생 중일 때만 요약 카드 내부의 제목, 부제, 라벨 및 3줄 요약 문장에 실시간 하이라이트 표시
- 요약 낭독이 멈추거나 본문 전체 낭독 중일 때는 요약 카드에 하이라이트가 발생하지 않도록 완전 격리

### 2.4 `TrinityApp.tsx`의 낭독 모드별 상호 배타적 분리
- 기존 계산된 `isSummaryTTSActive`와 `isFullReadingTTSActive`를 정확히 연동:
  ```tsx
  <TarotSummaryGraphicCard
    bullets={conciseSummaryBullets}
    readingText={displayTarotResult || tarotResult || ""}
    isTTSActive={isSummaryTTSActive}
    onToggleTTS={handleToggleSummaryTTS}
  />
  
  <Streamdown
    immediate={!isTarotGenerating}
    enableTTSHighlight={isFullReadingTTSActive}
  >
    {displayTarotResult || stripSummaryFromTarotText(tarotResult || "")}
  </Streamdown>
  ```
- 요약 낭독 중에는 `isFullReadingTTSActive === false`이므로 하단 본문 하이라이트가 100% 비활성화됨
- 본문 낭독 중에는 `isSummaryTTSActive === false`이므로 상단 요약 카드 하이라이트가 100% 비활성화되고 본문만 정밀 하이라이트됨

### 2.5 오라클 및 데일리 타로 모달 동기화 (`TrinityOracleSection.tsx`, `TodayTarotNarrationModal.tsx`)
- 오라클 타로 섹션 및 데일리 타로 낭독 모달에서도 동일한 원칙으로 요약 카드와 본문 스트림다운의 하이라이트가 상호 간섭하지 않도록 일관되게 정비

---

## 3. 검증 계획
1. **요약 낭독 테스트**: 타로 리딩 상단의 [요약 낭독] 클릭 시, 3줄 요약 카드의 문장만 하이라이트되고 하단 본문에는 어떠한 하이라이트도 나타나지 않는지 확인
2. **본문 낭독 테스트**: 하단 [리딩 듣기] 클릭 시, 본문 문장들만 실시간으로 하이라이트되고 상단 요약 카드에는 간섭이 없는지 확인
3. **낭독 정지 테스트**: 낭독 중 정지 시 모든 하이라이트가 즉시 정상 해제되는지 확인
4. **빌드 및 린트 검증**: `npm run lint` 및 `npm run build` 오류 없는 정상 컴파일 검증
5. **버전 관리 규칙 준수**: `package.json`, `public/version.json`, `public/changelog.json` 버전 갱신 반영
