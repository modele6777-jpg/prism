# TTS 텍스트 감정 분석 기반 동적 음성 톤(pitch & rate) 조절 로직 구현 계획

사용자의 요구사항 및 피드백에 따라, TTS 음성 낭독 시 현재 텍스트의 감정 분석 결과를 기반으로 음성의 톤(pitch: 음높이)과 템포(rate: 속도)를 문장별로 자연스럽고 섬세하게 동적 조절하는 로직을 구현합니다.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> 사용자가 Phase 1 질문에서 확정한 선택 사항을 바탕으로 시스템을 설계합니다.

- **[확정] 톤/속도 조절 강도**: **자연스러운 미세 조절 (속도 0.92~1.06배, 음높이 -2Hz~+2Hz)**
  - 기계적이거나 과장되지 않고, 실제 전문 성우나 아나운서가 감정 뉘앙스를 살려 낭독하는 수준의 부드럽고 세련된 prosody 제어를 적용합니다.
  - 슬픔/위로/평온/명상: 속도 0.92~0.96배(rate: `-8%` ~ `-4%`), pitch `-1.5Hz` ~ `-0.8Hz`
  - 기쁨/환희/활력: 속도 1.04~1.06배(rate: `+4%` ~ `+6%`), pitch `+1.2Hz` ~ `+1.8Hz`
  - 확신/강조/통찰: 속도 0.98배(rate: `-2%`), pitch `-0.5Hz` (단단하고 묵직한 톤)
  - 신비/오라클/타로: 속도 0.95배(rate: `-5%`), pitch `+0.5Hz` (몽환적이고 차분한 울림)
  - 중립/일반: 표준 1.00배(rate: `+0%`), pitch `+0Hz`
- **[확정] 적용 기준 단위**: **문장별 자동 분석 및 실시간 전환**
  - 긴 본문이나 타로 리딩, 일일 명상, 시 낭독 시 한 문장마다 독립적으로 감정을 분석하여 문장의 호흡과 감정 곡선에 따라 pitch와 rate를 실시간 전환합니다.
- **[확정] 감정 우선순위**: **자동 분석 기본 + 명시적 감정 태그/프롬프트 우선**
  - 명시적 감정 지정(`[EMOTION:...]` 태그 또는 파라미터로 전달된 emotion)이 있을 경우 이를 최우선으로 반영하고, 없는 문장은 키워드 및 문장 기호(! ? 등) 기반 자동 감정 분석 엔진을 실행합니다.

---

## 1. 아키텍처 및 시스템 흐름

```
[텍스트 입력 (타로 리딩, 조언, 일일 사주, 시 낭독 등)]
                    │
                    ▼
[splitSpeechIntoSentences() - 문장 단위 분할]
                    │
                    ▼ (각 문장 순회)
┌────────────────────────────────────────────────────────┐
│  문장별 감정 분석 (Sentence Emotion Analyzer)           │
│  1. 명시적 감정 파라미터 / [EMOTION:...] 태그 확인      │
│  2. 감정 키워드 스코어링 (기쁨, 평온, 명상, 슬픔, 신비, 활력) │
│  3. 문장부호 분석 (! ? 온점 등)                         │
│  => 감정 프로필 결정: { emotion, rateStr, pitchStr, speed }  │
└───────────────────────────┬────────────────────────────┘
                            │
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
[서버 EdgeTTS 엔진 (/api/ai/tts)]     [브라우저 Web Speech 엔진 fallback]
 - rate: "-6%", pitch: "-1.2Hz"       - utterance.rate: 0.94
 - 자연스러운 한국어 신경망 음성       - utterance.pitch: 0.96
 - 감정별 캐시 키 (rate, pitch 포함)  - 모바일 WebAudio / HTML5 Audio
       │                                         │
       └────────────────────┬────────────────────┘
                            │
                            ▼
      [실시간 문장 형광펜 하이라이트 동기화]
      - 문장 전환 시 이전 형광펜 즉시 소멸 & 현재 문장 골드 하이라이트
```

---

## 2. 변경 대상 모듈 및 작업 내용

### 1) 감정 프로필 및 파라미터 매핑 엔진 확장 (`src/lib/audio.ts`)
- `TTSEmotionProfile` 인터페이스에 EdgeTTS 규격 문자열(`rateStr`, `pitchStr`) 및 Web Speech/HTMLAudio 규격 배율(`speedMultiplier`, `pitchMultiplier`) 확장
- 사용자가 선택한 **자연스러운 미세 조절 범위**(-8%~+6% rate, -2Hz~+2Hz pitch)로 프로필 재조정:
  - `meditation` (명상/호흡): rate `-8%` (0.92x), pitch `-1.8Hz` (0.95x)
  - `calm` (평온/안식): rate `-5%` (0.95x), pitch `-1.0Hz` (0.97x)
  - `sadness` (슬픔/위로): rate `-6%` (0.94x), pitch `-1.5Hz` (0.96x)
  - `emphasis` (강조/확신): rate `-3%` (0.97x), pitch `-0.6Hz` (0.98x)
  - `mystic` (신비/오라클): rate `-5%` (0.95x), pitch `+0.5Hz` (1.02x)
  - `joy` (기쁨/환희): rate `+5%` (1.05x), pitch `+1.5Hz` (1.05x)
  - `vitality` (활력/생기): rate `+6%` (1.06x), pitch `+1.8Hz` (1.06x)
  - `neutral` (중립/일반): rate `+0%` (1.00x), pitch `+0Hz` (1.00x)
- `analyzeTextEmotion(text, explicitEmotion)` 함수 개선: 문장의 텍스트 뉘앙스를 정교하게 가중치 채점하여 최적의 프로필 반환

### 2) 클라이언트 TTS 스트리밍 큐 및 캐시 키 연동 (`src/utils/tts.ts`)
- `prefetchTTS` 및 `playTTS`에서 감정 분석 결과의 `rate`와 `pitch`를 추출하여 `/api/ai/tts` 페이로드로 전송
- `getTTSCacheKey`: 텍스트, 보이스뿐만 아니라 동적 감정/rate/pitch를 포함하도록 캐시 키 고도화
- `playTTSInChunks`: 각 문장 청크(`chunks[i]`)마다 독립적으로 `analyzeTextEmotion(chunks[i], emotion)`을 수행하여, 문장 단위로 동적 감정과 톤을 개별 산출하여 스트리밍 재생
- 브라우저 Web Speech Fallback(`playNativeBrowserSpeech`)에서도 해당 감정 프로필의 `playbackRate`와 `pitch`를 `utterance`에 동적 바인딩

### 3) 백엔드 TTS 핸들러 고도화 (`server/api-lib/ttsHandler.ts` & `server.ts`)
- 프론트엔드에서 전달된 감정 및 rate, pitch 파라미터를 EdgeTTS 인스턴스에 온전히 반영
- 서버 단에서도 감정이 직접 지정되지 않은 단독 호출 시 `analyzeTextEmotion`을 거쳐 지능적으로 rate/pitch를 계산
- 서버 인메모리 캐시 키에 `rate`와 `pitch`를 정확히 반영하여 음성 왜곡 없이 초고속 서빙

### 4) 실시간 문장 형광펜 하이라이트 동기화 검증
- 문장별 rate와 pitch가 변하더라도 `activeSentence` 및 `TTSHighlightText` / `Streamdown` 하이라이트가 음성 재생 시작/끝 타이밍에 정확히 일치하는지 검증
- 오디오 종료(`ended`) 및 세션 전환 이벤트 흐름 무결성 확인

---

## 3. 검증 계획 (Verification Plan)

1. **감정별 Rate/Pitch 계산 단위 테스트 (`npx tsx`)**:
   - 기쁨, 슬픔, 평온, 명상, 신비 문장 각각에 대해 `analyzeTextEmotion`이 올바른 rate/pitch 값을 산출하는지 확인
2. **빌드 및 린트 검증**:
   - `npm run lint` 및 `npm run build`를 실행하여 타입 에러, 빌드 실패 없는지 확인
3. **버전 관리 및 배포 규칙 준수 (AGENTS.md)**:
   - `package.json` 패치 버전 업데이트 (1.4.236 -> 1.4.237)
   - `public/version.json` 및 `public/changelog.json` 업데이트
