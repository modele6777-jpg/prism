/**
 * 🔮 PRISM 오늘의 타로 결과 공유 & 고해상도 카드 이미지(PNG) 익스포터
 * 
 * 1. 클립보드 텍스트 복사 (카카오톡, 메모, 인스타그램 공유 최적화)
 * 2. 1080x1560 초고해상도 레티나 캔버스 카드 이미지 생성 및 PNG 다운로드
 * 3. 모바일 Web Share API 연동 (이미지 파일 + 텍스트 네이티브 공유)
 */

export interface TodayTarotShareData {
  card: {
    id?: string;
    nameKo: string;
    name: string;
    reversed: boolean;
    keywords?: string[];
    imageUrl?: string;
  } | null;
  dateStr?: string;
  conciseSummaryBullets?: string[];
  diagnosis?: string;
  rawBlessing?: string;
  frequency?: string;
  luckyNumber?: string;
  luckyColor?: string;
}

/**
 * 📋 텍스트 복사용 포맷팅 함수 (메신저/SNS 친화적)
 */
export function formatTodayTarotShareText(data: TodayTarotShareData): string {
  const cardName = data.card?.nameKo || '운명의 카드';
  const cardEn = data.card?.name ? ` (${data.card.name})` : '';
  const orientation = data.card?.reversed ? '역방향 (Reversed)' : '정방향 (Upright)';
  const dateText = data.dateStr || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const keywords = data.card?.keywords && data.card.keywords.length > 0
    ? data.card.keywords.map((k) => `#${k}`).join(' ')
    : '';

  const summaryBullets = data.conciseSummaryBullets && data.conciseSummaryBullets.length > 0
    ? `\n【✨ 오늘의 핵심 비전 요약】\n${data.conciseSummaryBullets.map((b) => `• ${b}`).join('\n')}\n`
    : '';

  const diag = data.diagnosis
    ? `\n【🏛️ 마스터 심층 비전 리딩】\n${data.diagnosis.slice(0, 500)}${data.diagnosis.length > 500 ? '...' : ''}\n`
    : '';

  const cosmicInfo = [
    data.frequency ? `주파수: ${data.frequency}` : null,
    data.luckyNumber ? `행운수: ${data.luckyNumber}` : null,
    data.luckyColor ? `행운색: ${data.luckyColor}` : null,
  ].filter(Boolean).join(' · ');

  const blessing = data.rawBlessing
    ? `\n【🌟 행운의 파동과 축복】\n${cosmicInfo ? `• ${cosmicInfo}\n` : ''}"${data.rawBlessing}"\n`
    : cosmicInfo ? `\n【🌟 행운의 에너지】\n• ${cosmicInfo}\n` : '';

  return (
    `🔮 [PRISM 오늘의 타로] ${dateText}\n` +
    `✨ 운명의 카드: ${cardName}${cardEn} · ${orientation}\n` +
    (keywords ? `🏷️ 키워드: ${keywords}\n` : '') +
    summaryBullets +
    diag +
    blessing +
    `\n───\n✦ PRISM TRINITY ORACLE ✦\n매일 만나는 영혼의 나침반`
  );
}

/**
 * 캔버스용 한글/영문 텍스트 자동 줄바꿈 헬퍼
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 5
): number {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, curY);
        return curY + lineHeight;
      }
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim() && lineCount < maxLines) {
    ctx.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }
  return curY;
}

/**
 * 이미지 사전 로드 헬퍼 (CORS anonymous 지원)
 */
async function loadCardImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * 🖼️ 1080 x 1560 초고해상도 카드 캔버스 렌더링
 */
export async function generateTodayTarotCardCanvas(data: TodayTarotShareData): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = 1560;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Cosmic Obsidian & Deep Purple Radial Background
  const bgGrad = ctx.createRadialGradient(width / 2, height * 0.35, 120, width / 2, height / 2, height * 0.75);
  bgGrad.addColorStop(0, '#1c1535');
  bgGrad.addColorStop(0.35, '#120d24');
  bgGrad.addColorStop(0.7, '#0a0815');
  bgGrad.addColorStop(1, '#05040a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Cosmic Nebula Particle & Constellation Dust
  ctx.save();
  for (let i = 0; i < 90; i++) {
    // Deterministic pseudo-random placement
    const px = Math.abs(Math.sin(i * 997 + 1)) * (width - 80) + 40;
    const py = Math.abs(Math.cos(i * 541 + 2)) * (height - 80) + 40;
    const radius = 0.6 + Math.abs(Math.sin(i * 13)) * 1.8;
    const alpha = 0.15 + Math.abs(Math.cos(i * 7)) * 0.45;

    ctx.fillStyle = i % 3 === 0
      ? `rgba(250, 204, 21, ${alpha})`
      : i % 2 === 0
      ? `rgba(168, 85, 247, ${alpha * 0.8})`
      : `rgba(255, 255, 255, ${alpha * 0.9})`;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Luxurious Sacred Double Gold Border & Corner Ornaments
  ctx.save();
  // Outer Border
  ctx.strokeStyle = 'rgba(202, 138, 4, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Inner Border
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Golden Corner Brackets & Diamonds
  const cSize = 28;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(48, 48 + cSize);
  ctx.lineTo(48, 48);
  ctx.lineTo(48 + cSize, 48);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - 48 - cSize, 48);
  ctx.lineTo(width - 48, 48);
  ctx.lineTo(width - 48, 48 + cSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(48, height - 48 - cSize);
  ctx.lineTo(48, height - 48);
  ctx.lineTo(48 + cSize, height - 48);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - 48 - cSize, height - 48);
  ctx.lineTo(width - 48, height - 48);
  ctx.lineTo(width - 48, height - 48 - cSize);
  ctx.stroke();
  ctx.restore();

  // 4. Header Seal & Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 20px "Cinzel", "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('✦ PRISM TRINITY ORACLE ✦', width / 2, 95);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('오늘의 데일리 타로 리딩', width / 2, 142);

  // Date Badge
  const todayFormatted = data.dateStr || new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
  ctx.lineWidth = 1.5;
  const dateBadgeW = 220;
  const dateBadgeH = 34;
  ctx.beginPath();
  ctx.roundRect((width - dateBadgeW) / 2, 160, dateBadgeW, dateBadgeH, 17);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fde047';
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(todayFormatted, width / 2, 183);

  // 5. Card Illustration Area
  const cardW = 240;
  const cardH = 380;
  const cardX = (width - cardW) / 2;
  const cardY = 215;

  // Golden Glow behind card
  const glowGrad = ctx.createRadialGradient(width / 2, cardY + cardH / 2, 60, width / 2, cardY + cardH / 2, 220);
  glowGrad.addColorStop(0, 'rgba(234, 179, 8, 0.28)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(cardX - 100, cardY - 50, cardW + 200, cardH + 100);

  // Try loading real tarot card image
  const cardImg = data.card?.imageUrl ? await loadCardImage(data.card.imageUrl) : null;

  ctx.save();
  // Card border shape
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 18);
  ctx.clip();

  if (cardImg) {
    if (data.card?.reversed) {
      // Draw reversed image
      ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(cardImg, -cardW / 2, -cardH / 2, cardW, cardH);
      ctx.rotate(-Math.PI);
      ctx.translate(-(cardX + cardW / 2), -(cardY + cardH / 2));
    } else {
      ctx.drawImage(cardImg, cardX, cardY, cardW, cardH);
    }
  } else {
    // Elegant Sacred Geometric Fallback Card Back
    const cardBackGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardBackGrad.addColorStop(0, '#2d1b4e');
    cardBackGrad.addColorStop(0.5, '#1e1136');
    cardBackGrad.addColorStop(1, '#0e081c');
    ctx.fillStyle = cardBackGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX + 12, cardY + 12, cardW - 24, cardH - 24);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 50px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦', width / 2, cardY + cardH / 2 - 10);
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillText(data.card?.nameKo || 'TAROT', width / 2, cardY + cardH / 2 + 40);
  }
  ctx.restore();

  // Card Outer Glow Border
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 18);
  ctx.stroke();

  // Reversed Tag Ribbon on Card
  if (data.card?.reversed) {
    ctx.fillStyle = 'rgba(185, 28, 28, 0.9)';
    ctx.beginPath();
    ctx.roundRect(cardX + 20, cardY + cardH - 36, cardW - 40, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#fee2e2';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('역방향 (REVERSED)', width / 2, cardY + cardH - 18);
  }

  // 6. Card Identity Text Area
  const nameKo = data.card?.nameKo || '운명의 카드';
  const nameEn = data.card?.name ? `(${data.card.name})` : '';
  const isRev = !!data.card?.reversed;

  ctx.textAlign = 'center';
  ctx.fillStyle = isRev ? '#f87171' : '#facc15';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(isRev ? '◆ REVERSED ENERGY ◆' : '★ UPRIGHT SACRED ALIGNMENT ★', width / 2, cardY + cardH + 34);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Cinzel", -apple-system, BlinkMacSystemFont, "Pretendard", serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(`${nameKo} ${nameEn}`, width / 2, cardY + cardH + 74);

  // Keywords
  if (data.card?.keywords && data.card.keywords.length > 0) {
    ctx.fillStyle = '#fde047';
    ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.letterSpacing = '1px';
    const kwText = data.card.keywords.slice(0, 4).map((k) => `#${k}`).join('   ');
    ctx.fillText(kwText, width / 2, cardY + cardH + 104);
  }

  // 7. Core 3-Line Summary Card (Quick Summary Box)
  const boxX = 70;
  const boxY = 750;
  const boxW = width - 140;
  const boxH = 360;

  // Glass Box Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 24);
  ctx.fill();
  ctx.stroke();

  // Inner Subtle Top Accent Line
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(boxX + 40, boxY);
  ctx.lineTo(boxX + boxW - 40, boxY);
  ctx.stroke();

  // Summary Header
  ctx.textAlign = 'left';
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('✨ 오늘의 핵심 3줄 비전 요약 (Quick Summary)', boxX + 35, boxY + 45);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 35, boxY + 62);
  ctx.lineTo(boxX + boxW - 35, boxY + 62);
  ctx.stroke();

  // 3 Bullets
  const bullets = (data.conciseSummaryBullets && data.conciseSummaryBullets.length > 0)
    ? data.conciseSummaryBullets
    : [
        '[현재 에너지] 오늘 하루 당신의 내면 깊은 곳에서 새로운 직관과 의지가 솟아납니다.',
        '[방향과 결단] 작은 망설임을 거두고 가장 자연스러운 흐름을 신뢰하세요.',
        '[실천 처방] 심호흡 세 번과 함께 나 자신을 향한 온전한 확신을 품어보세요.',
      ];

  let currentBulletY = boxY + 102;
  bullets.slice(0, 3).forEach((b) => {
    const match = b.match(/^\[([^\]]+)\]\s*(.*)$/);
    const tag = match ? match[1] : null;
    const content = match ? match[2] : b;

    ctx.textAlign = 'left';

    // Bullet Dot
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('•', boxX + 35, currentBulletY);

    let textStartX = boxX + 55;

    // Tag badge
    if (tag) {
      ctx.font = 'bold 15px -apple-system, sans-serif';
      const tagW = ctx.measureText(`[${tag}]`).width;
      ctx.fillStyle = '#fde047';
      ctx.fillText(`[${tag}]`, textStartX, currentBulletY);
      textStartX += tagW + 10;
    }

    // Content text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    currentBulletY = drawWrappedText(ctx, content, textStartX, currentBulletY, boxW - (textStartX - boxX) - 35, 26, 2);
    currentBulletY += 16;
  });

  // 8. Cosmic Planetary & Frequency Energy Section
  const energyY = 1145;
  const energyBoxH = 175;

  ctx.fillStyle = 'rgba(250, 204, 21, 0.05)';
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, energyY, boxW, energyBoxH, 20);
  ctx.fill();
  ctx.stroke();

  // Energy Pill Badges
  const pills = [
    `주파수: ${data.frequency || '528Hz 솔페지오'}`,
    `행운수: ${data.luckyNumber || '7'}`,
    `행운색: ${data.luckyColor || '골드'}`,
  ];

  ctx.textAlign = 'center';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';

  const pillW = 260;
  const pillSpacing = 28;
  const totalPillsW = pills.length * pillW + (pills.length - 1) * pillSpacing;
  let pillStartX = (width - totalPillsW) / 2;

  pills.forEach((pText) => {
    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pillStartX, energyY + 22, pillW, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.fillText(pText, pillStartX + pillW / 2, energyY + 45);
    pillStartX += pillW + pillSpacing;
  });

  // Master Blessing Quote
  const blessingText = data.rawBlessing || '오늘 하루 마주할 모든 순간이 당신의 가장 찬란한 성장을 응원합니다.';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'italic 17px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  drawWrappedText(ctx, `"${blessingText}"`, width / 2, energyY + 95, boxW - 80, 26, 2);

  // 9. Footer Emblem & Signature
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ca8a04';
  ctx.font = 'bold 14px "Cinzel", Georgia, serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('❖ PRISM ✕ LUCY • DESTINY TAROT FUSION ❖', width / 2, 1420);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('Personalized Cosmic Daily Wisdom & Mindfulness Archive', width / 2, 1445);

  return canvas;
}

/**
 * 💾 캔버스를 고해상도 PNG 파일로 자동 다운로드
 */
export async function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, 'image/png');
  });
}

/**
 * 🌟 원스톱 오늘의 타로 이미지 카드 생성 및 다운로드
 */
export async function exportTodayTarotCardImage(data: TodayTarotShareData, customFilename?: string): Promise<string> {
  const canvas = await generateTodayTarotCardCanvas(data);
  const cardName = (data.card?.nameKo || 'today_tarot').replace(/\s+/g, '_');
  const dateKey = (data.dateStr || new Date().toISOString().slice(0, 10)).replace(/[^\d]/g, '');
  const filename = customFilename || `prism_today_tarot_${dateKey}_${cardName}.png`;

  await downloadCanvasAsPng(canvas, filename);
  return canvas.toDataURL('image/png');
}

/**
 * 📱 모바일 네이티브 공유 또는 클립보드 복사 원클릭 핸들러
 */
export async function shareTodayTarot(
  data: TodayTarotShareData,
  canvas?: HTMLCanvasElement
): Promise<'shared' | 'copied' | 'failed'> {
  const shareText = formatTodayTarotShareText(data);
  const cardName = data.card?.nameKo || '오늘의 타로';

  // 1. Try Navigator Web Share API (with file if supported)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (canvas && typeof navigator.canShare === 'function') {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const file = new File([blob], `prism_tarot_${cardName}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `[PRISM] 오늘의 타로 - ${cardName}`,
              text: shareText,
              files: [file],
            });
            return 'shared';
          }
        }
      }

      // Share text only via Web Share API
      await navigator.share({
        title: `[PRISM] 오늘의 타로 - ${cardName}`,
        text: shareText,
      });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return 'failed'; // User cancelled the modal
      }
      console.warn('Web Share failed, fallback to clipboard', e);
    }
  }

  // 2. Fallback: Clipboard text copy
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      return 'copied';
    }
  } catch (err) {
    console.error('Clipboard copy error', err);
  }

  return 'failed';
}
