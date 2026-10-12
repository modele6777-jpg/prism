# [구현 계획] TTS 하이라이트 스마트스크롤 및 수동 조작 분리 연동 시스템

사용자가 TTS 음성 낭독을 들을 때, 현재 읽고 있는 **형광펜 하이라이트 문장을 시야의 중앙에 항상 자연스럽게 유지**해 주고, 사용자가 직접 마우스 휠이나 터치로 다른 내용을 탐색할 때 자동 스크롤과 충돌하지 않도록 **수동 조작을 똑똑하게 분리·감지(Smart Scroll)**하여 부드러운 화면 이동 경험을 제공합니다.

---

## 1. 확정된 사용자 요구사항 및 스펙

1. **하이라이트 추적 위치**: 현재 낭독 중인 하이라이트 문장이 **스크롤 뷰포트의 정중앙(`block: 'center'`)**에 부드럽게 정렬되도록 오토 스크롤.
2. **스마트스크롤(수동 vs 자동 구분)**:
   - 사용자가 마우스 휠(`wheel`), 터치 드래그(`touchmove`), 키보드 스크롤(`keydown`), 스크롤바 조작 시 즉시 **수동 모드(User Override)**로 전환되어 오토 스크롤을 즉시 일시 정지.
   - 사용자 스크롤 중단 후 **3초 동안 추가 조작이 없으면** 다시 하이라이트 문장 위치로 자연스럽게 오토 스크롤 복귀.
   - 수동 모드 중 화면 하단에 튀지 않고 세련된 **'낭독 위치로 이동(재개)' 플로팅 버튼**을 제공하여 원터치 즉시 복귀도 지원.
3. **적용 범위**:
   - 🌟 **모달 창 전체**: 오늘의 데일리 타로 모달(`TodayTarotNarrationModal`), 타로 카드 확대 모달 등 스크롤 가능한 모든 모달.
   - 🌟 **메인 전체 화면**: 일반 타로 결과 뷰, 사주✕타로 융합 오라클 3종 결과 뷰(`TrinityOracleSection`), 타임라인 연속 리딩 뷰.

---

## 2. 시스템 아키텍처 및 흐름도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TTS Audio & Speech State                          │
│               activeSentence / activeText / isSpeaking                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (1) Active Sentence Broadcast
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Universal Smart Scroll Engine (Hook & Controller)            │
│                 useSmartScroll / SmartScrollProvider                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [사용자 제스처 감지기 (User Gesture Detector)]                                │
│   - Event Listeners: wheel, touchmove, pointerdown on scroll container       │
│   - Programmatic Scroll Flag: 오토 스크롤 중 발생한 scroll 이벤트는 무시        │
│                                                                             │
│  [상태 머신 (State Machine)]                                                 │
│   - AUTO_FOLLOWING: 하이라이트 문장 변경 시 컨테이너 중앙으로 smooth scroll       │
│   - USER_PAUSED: 수동 스크롤 감지 시 즉시 전환 (3초 타이머 시작 + 플로팅 버튼 노출)│
│   - RESUMING: 3초 타임아웃 또는 복귀 버튼 클릭 시 AUTO_FOLLOWING 복귀          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
 [모달 스크롤 뷰포트]                                           [메인 페이지 뷰포트]
 TodayTarotNarrationModal                                      TrinityApp / OracleSection
 Container: max-h-[90vh] overflow-y-auto                       Container: window / document.body
 Target: .tts-active-sentence-highlight                        Target: .tts-active-sentence-highlight
```

---

## 3. 세부 작업 항목

### Task 1: 스마트스크롤 코어 훅 및 유틸리티 개발 (`src/hooks/useSmartScroll.ts`)
- **수동 스크롤 감지 알고리즘**:
  - `wheel`, `touchmove`, `touchstart` 이벤트를 캡처하여 사용자가 의도적으로 개입했는지를 0.05초 내 즉시 판별.
  - 프로그램에 의한 `scrollIntoView` 또는 `scrollTo` 동작 중 발생하는 브라우저 기본 스크롤 이벤트와 사용자 제스처를 `isProgrammaticScrollingRef` 플래그로 완벽 분리.
- **오토 리줌(3초 딜레이) & 수동 리줌 인터페이스**:
  - 사용자 조작이 멈추면 3,000ms 디바운스 타이머 가동 후 부드럽게 자동 추적 복구.
  - `resumeAutoScroll()` 함수를 외부로 노출하여 플로팅 버튼에서도 즉각 호출 가능하게 설계.
- **중앙 배치 계산 수학 (Viewport Math)**:
  - 타겟 요소(`mark.tts-active-sentence-highlight`)의 상대 높이와 스크롤 컨테이너의 뷰포트 높이를 계산하여, 급격한 도약 없이 컨테이너의 50% 지점에 위치하도록 `scroll({ top: targetOffset, behavior: 'smooth' })` 실행.

### Task 2: 하이라이트 마크 컴포넌트 고도화 (`TTSHighlightedText.tsx` & `ttsHighlight.tsx`)
- `Streamdown` 마크다운 본문과 일반 텍스트 렌더러에서 생성되는 모든 `<mark>` 요소에 스마트 스크롤 타깃 클래스 및 데이터 속성(`data-tts-active="true"`) 부여.
- 이전 문장에서 다음 문장으로 넘어갈 때 중복 점프 방지(동일 문장 debounce 처리).
- 컨테이너가 `window`인 경우와 내부 스크롤 컨테이너(모달의 `overflow-y-auto` 엘리먼트)인 경우 모두 자동으로 가장 가까운 스크롤 부모(`closestScrollableElement`)를 찾아내어 올바른 컨테이너를 스크롤하도록 구현.

### Task 3: 낭독 위치 복귀 플로팅 컨트롤러 (`SmartScrollResumeButton.tsx`)
- 사용자가 수동 스크롤 중일 때만 화면 우측 하단(또는 모달 하단)에 아주 은은하고 세련된 미니멀 버튼 표출:
  - `[ 📍 낭독 위치로 이동 (3초 후 자동 복귀) ]`
  - 터치 시 햅틱 피드백과 함께 즉시 현재 낭독 중인 문장으로 부드럽게 이동하고 자동 추적 재개.
  - 방해되지 않도록 유리 질감(Glassmorphism)과 앰버 골드 엑센트로 안티-슬롭 디자인 원칙 준수.

### Task 4: 모달(`TodayTarotNarrationModal`) 및 메인 뷰포트 연동
- 오늘의 데일리 타로 모달 내부의 긴 5단계 리딩 스크롤 영역에 `useSmartScroll` 적용.
- 일반 타로 결과 및 오라클 3종 뷰포트에 동일 훅 연동.

---

## 4. 검증 및 배포 계획

1. **컴파일 & 린트 통과**: `tsc --noEmit` 타입 에러 0건 및 프로덕션 빌드 통과.
2. **동작 테스트**:
   - [x] TTS 전체 낭독 시작 시 첫 문장부터 화면 중앙으로 매끄럽게 자동 스크롤 이동.
   - [x] 사용자가 마우스 휠이나 터치로 다른 곳을 올려보거나 내려볼 때 화면이 강제로 끌려가지 않고 멈춤.
   - [x] 3초간 가만히 있으면 현재 읽는 위치로 부드럽게 복귀.
   - [x] '낭독 위치로 이동' 버튼 클릭 시 즉각 복귀.
   - [x] 모달 창 내부와 메인 페이지 전체에서 모두 일관되게 작동.
3. **규정 준수**:
   - `package.json` 버전 패치 업데이트 (`1.4.239` -> `1.4.240`)
   - `public/version.json` 및 `public/changelog.json` 업데이트
   - `git add .` 및 `git commit` 생성
