/**
 * OmniWarp Tarot Touch Analyzer
 * 손끝 물리량(체류 시간, 경로 길이, 직선 거리 대비 미세 떨림/망설임 지수) 측정 및 심리 타로 프롬프트 생성기
 */

export interface TarotTouchPoint {
  x: number;
  y: number;
  time: number;
}

export type TarotDepthMode =
  | '화이트홀 (현실 실행 모드)'
  | '사건의 지평선 (감정 정리 모드)'
  | '블랙홀 (무의식 심층 치유 모드)';

export interface TarotPhysicalMetadata {
  durationMs: number;
  jitterScore: number;
  depthMode: TarotDepthMode;
  tonePrompt: string;
  hesitationDetail: string;
  promptAddon: string;
}

export class TarotTouchAnalyzer {
  private startTime: number = 0;
  private points: TarotTouchPoint[] = [];
  public isTracking: boolean = false;

  startTracking(x: number, y: number): void {
    this.startTime = Date.now();
    this.points = [{ x, y, time: this.startTime }];
    this.isTracking = true;
  }

  recordPoint(x: number, y: number): void {
    if (!this.isTracking) return;
    const now = Date.now();
    // 16ms(60fps) 단위 샘플링 방어
    const last = this.points[this.points.length - 1];
    if (last && now - last.time < 12) return;
    this.points.push({ x, y, time: now });
  }

  endTrackingAndBuildPayload(cardName: string = '타로 카드'): TarotPhysicalMetadata | null {
    if (!this.isTracking || this.points.length === 0) return null;
    this.isTracking = false;

    const durationMs = Math.max(80, Date.now() - this.startTime);
    const startPoint = this.points[0];
    const endPoint = this.points[this.points.length - 1];

    // 떨림/망설임 지수 계산: 실제 이동 누적 경로 - 직선 이동 거리
    let totalPathLength = 0;
    for (let i = 1; i < this.points.length; i++) {
      const dx = this.points[i].x - this.points[i - 1].x;
      const dy = this.points[i].y - this.points[i - 1].y;
      totalPathLength += Math.sqrt(dx * dx + dy * dy);
    }
    const straightDist = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );
    const jitterScore = Math.max(0, Math.round(totalPathLength - straightDist));

    // 3단계 모드 분기 (사용자 인터랙션 규격)
    let depthMode: TarotDepthMode = '화이트홀 (현실 실행 모드)';
    let tonePrompt = '군더더기 없는 현실적 조언과 오늘 당장 실행할 1가지 행동 지침';

    if (durationMs >= 2000) {
      depthMode = '블랙홀 (무의식 심층 치유 모드)';
      tonePrompt = '내면의 억압된 상처와 무의식의 두려움을 어루만져 주는 깊은 정서적 치유 리딩';
    } else if (durationMs >= 800) {
      depthMode = '사건의 지평선 (감정 정리 모드)';
      tonePrompt = '현재의 내적 갈등과 병목을 객관적으로 짚어주는 균형 잡힌 코칭';
    }

    const hesitationDetail =
      jitterScore > 30
        ? '손끝에 상당한 망설임과 갈등이 감지됨'
        : '과감하고 직관적인 터치 감지됨';

    // Gemini API 프롬프트 조립
    const promptAddon = `
[사용자 인터랙션 손끝 물리량 메타데이터 (TarotTouchAnalyzer)]
- 뽑힌 카드: ${cardName}
- 터치 체류 시간: ${durationMs}ms (${depthMode})
- 망설임/떨림 지수: ${jitterScore} (${hesitationDetail})

[리딩 요청 사항]
1. 리딩 톤: ${tonePrompt}
2. 첫 문장에서 손끝의 망설임/집중도(${durationMs}ms 체류, ${hesitationDetail})를 자연스럽게 언급하며 깊은 공감대를 형성하세요.
3. 단순 길흉화복 예언 대신 심리적 원인과 구체적인 실천 방향을 제시하세요.
4. 한국어로 정중하고 몰입감 있게 작성하세요.
    `.trim();

    return {
      durationMs,
      jitterScore,
      depthMode,
      tonePrompt,
      hesitationDetail,
      promptAddon,
    };
  }

  reset(): void {
    this.startTime = 0;
    this.points = [];
    this.isTracking = false;
  }
}

/**
 * 기본 싱글톤 분석기 인스턴스
 */
export const defaultTarotTouchAnalyzer = new TarotTouchAnalyzer();
