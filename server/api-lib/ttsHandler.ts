import { prepareNaturalSpeechText } from "./speechText";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import googleTTS from "google-tts-api";
import { EdgeTTS } from "node-edge-tts";

const fsPromises = fs.promises;

interface TTSCacheEntry {
  base64: string;
  encoding: "mp3" | "pcm";
  sampleRate: number;
  timestamp: number;
}
const ttsServerCache = new Map<string, TTSCacheEntry>();

export interface TTSHandlerOptions {
  text: string;
  voice?: string;
  emotion?: string;
  rate?: string;
  pitch?: string;
  speed?: number;
  language?: string;
}

export interface TTSHandlerResult {
  audioContent: string;
  encoding: "mp3" | "pcm";
  sampleRate?: number;
}

// Circuit breakers to prevent repeated 403/429 spam and latency when upstream endpoints block or exhaust quota
let edgeTtsBlockedUntil = 0;
let geminiTtsQuotaBlockedUntil = 0;

export function analyzeServerTextEmotion(text: string, explicitEmotion?: string): { emotion: string; rate: string; pitch: string } {
  let declared = explicitEmotion ? String(explicitEmotion).trim() : '';
  if (!declared && text) {
    const match = text.match(/\[EMOTION:\s*([^\]]+)\]/i);
    if (match) declared = match[1].trim();
  }

  if (declared) {
    const norm = declared.toLowerCase();
    if (
      norm.includes('meditation') ||
      norm.includes('명상') ||
      norm.includes('호흡') ||
      norm.includes('들숨') ||
      norm.includes('날숨') ||
      norm.includes('방하착') ||
      norm.includes('1분') ||
      norm.includes('이완') ||
      norm.includes('마인드풀') ||
      norm.includes('zen')
    ) {
      return { emotion: 'meditation', rate: '-8%', pitch: '-1.8Hz' };
    }
    if (
      norm.includes('joy') ||
      norm.includes('기쁨') ||
      norm.includes('환희') ||
      norm.includes('행복') ||
      norm.includes('축하') ||
      norm.includes('설렘') ||
      norm.includes('happy') ||
      norm.includes('축복') ||
      norm.includes('대박')
    ) {
      return { emotion: 'joy', rate: '+5%', pitch: '+1.5Hz' };
    }
    if (
      norm.includes('calm') ||
      norm.includes('평온') ||
      norm.includes('안식') ||
      norm.includes('치유') ||
      norm.includes('위로') ||
      norm.includes('다정') ||
      norm.includes('따뜻') ||
      norm.includes('peace') ||
      norm.includes('relax') ||
      norm.includes('쉼')
    ) {
      return { emotion: 'calm', rate: '-5%', pitch: '-1.0Hz' };
    }
    if (
      norm.includes('emphasis') ||
      norm.includes('강조') ||
      norm.includes('확신') ||
      norm.includes('결단') ||
      norm.includes('focus') ||
      norm.includes('insight') ||
      norm.includes('통찰') ||
      norm.includes('중요') ||
      norm.includes('결의')
    ) {
      return { emotion: 'emphasis', rate: '-3%', pitch: '-0.6Hz' };
    }
    if (
      norm.includes('sad') ||
      norm.includes('슬픔') ||
      norm.includes('위로') ||
      norm.includes('비움') ||
      norm.includes('애도') ||
      norm.includes('아픔') ||
      norm.includes('눈물') ||
      norm.includes('grief')
    ) {
      return { emotion: 'sadness', rate: '-6%', pitch: '-1.5Hz' };
    }
    if (
      norm.includes('mystic') ||
      norm.includes('신비') ||
      norm.includes('오라클') ||
      norm.includes('우주') ||
      norm.includes('oracle') ||
      norm.includes('tarot') ||
      norm.includes('타로') ||
      norm.includes('별자리') ||
      norm.includes('운명')
    ) {
      return { emotion: 'mystic', rate: '-5%', pitch: '+0.5Hz' };
    }
    if (
      norm.includes('vitality') ||
      norm.includes('활력') ||
      norm.includes('생기') ||
      norm.includes('에너지') ||
      norm.includes('energy') ||
      norm.includes('역동') ||
      norm.includes('생체')
    ) {
      return { emotion: 'vitality', rate: '+6%', pitch: '+1.8Hz' };
    }
  }

  const clean = text.replace(/\[[^\]]*\]/g, ' ').toLowerCase();

  let meditationScore = 0;
  let joyScore = 0;
  let calmScore = 0;
  let emphasisScore = 0;
  let sadnessScore = 0;
  let mysticScore = 0;
  let vitalityScore = 0;

  const meditationKeywords = ['명상', '호흡', '들숨', '날숨', '방하착', '숨결', '숨을', '들이쉬', '내쉬', '단전', '차크라', '정좌', '좌선', '1분 명상', '마인드 리셋'];
  const joyKeywords = ['기쁨', '행복', '환희', '축하', '설렘', '즐거', '반가', '웃음', '신나', '빛나', '희망', '감사', '사랑', '대단', '좋아', '멋진', '축복', '환대', '대박', '화이팅'];
  const calmKeywords = ['평온', '안식', '이완', '고요', '쉼', '휴식', '편안', '잠시', '부드럽', '따뜻', '차분', '비우', '흘러', '정화', '다정', '안아', '안정', '느슨', '온기'];
  const emphasisKeywords = ['중요', '반드시', '기억', '확신', '결단', '핵심', '명심', '결코', '도전', '의지', '성공', '달성', '도약', '강력', '성찰', '통찰', '진실', '분명', '결정', '주의사항', '경고'];
  const sadnessKeywords = ['슬픔', '눈물', '아픔', '상처', '외로', '지친', '힘든', '버거운', '애도', '위로', '고단', '그리움', '상실', '괴로', '아쉽'];
  const mysticKeywords = ['운명', '우주', '오라클', '타로', '별자리', '영혼', '직관', '신비', '차원', '공명', '시공간', '비밀', '흐름', '성좌', '수호', '카르마'];
  const vitalityKeywords = ['활력', '에너지', '생기', '생체', '역동', '운동', '스트레칭', '파워', '깨어나', '시작', '실행', '리듬', '생명', '건강', '기운차'];

  meditationKeywords.forEach(k => { if (clean.includes(k)) meditationScore += 2; });
  joyKeywords.forEach(k => { if (clean.includes(k)) joyScore++; });
  calmKeywords.forEach(k => { if (clean.includes(k)) calmScore++; });
  emphasisKeywords.forEach(k => { if (clean.includes(k)) emphasisScore++; });
  sadnessKeywords.forEach(k => { if (clean.includes(k)) sadnessScore++; });
  mysticKeywords.forEach(k => { if (clean.includes(k)) mysticScore++; });
  vitalityKeywords.forEach(k => { if (clean.includes(k)) vitalityScore++; });

  if (clean.includes('!')) {
    joyScore += 0.5;
    vitalityScore += 0.5;
    emphasisScore += 0.5;
  }
  if (clean.includes('?') || clean.includes('~')) {
    mysticScore += 0.3;
    calmScore += 0.3;
  }
  if (clean.includes('...') || clean.includes('…')) {
    calmScore += 0.3;
    sadnessScore += 0.3;
  }

  const scores = [
    { type: 'meditation', score: meditationScore, rate: '-8%', pitch: '-1.8Hz' },
    { type: 'joy', score: joyScore, rate: '+5%', pitch: '+1.5Hz' },
    { type: 'calm', score: calmScore, rate: '-5%', pitch: '-1.0Hz' },
    { type: 'emphasis', score: emphasisScore, rate: '-3%', pitch: '-0.6Hz' },
    { type: 'sadness', score: sadnessScore, rate: '-6%', pitch: '-1.5Hz' },
    { type: 'mystic', score: mysticScore, rate: '-5%', pitch: '+0.5Hz' },
    { type: 'vitality', score: vitalityScore, rate: '+6%', pitch: '+1.8Hz' },
  ];

  scores.sort((a, b) => b.score - a.score);

  if (scores[0].score > 0) {
    return { emotion: scores[0].type, rate: scores[0].rate, pitch: scores[0].pitch };
  }

  return { emotion: 'neutral', rate: '+0%', pitch: '+0Hz' };
}

export async function handleTTS(options: TTSHandlerOptions): Promise<TTSHandlerResult> {
  const { text, voice = "Kore", emotion, speed, language } = options;
  if (!text) {
    throw new Error("Empty speech text");
  }

  const cleanText = prepareNaturalSpeechText(String(text || ""));
  if (!cleanText) {
    throw new Error("Empty speech text");
  }

  const resolvedVoiceKey = "Kore";
  const normVoice = (voice || "").toLowerCase();

  // 🌟 Strict female-only voice enforcement across all engines per user instruction
  const isMaleVoice = false;

  // Determine language context: keep Korean neural voice consistent throughout the session,
  // even if an individual chunk consists of numbers, English terms, or symbols.
  const hasKoreanInText = /[가-힣]/.test(cleanText);
  const isExplicitEnglishVoice =
    voice.startsWith("en-US-") ||
    voice.startsWith("en-GB-") ||
    ((normVoice === "jenny" || normVoice === "aria") && language === "en");

  let lang = "ko-KR";
  let voiceName = "ko-KR-SunHiNeural"; // Consistent, warm Korean female neural voice

  if (isExplicitEnglishVoice && !hasKoreanInText) {
    lang = "en-US";
    voiceName = "en-US-AriaNeural"; // Warm English female neural voice
  }

  // 🌟 문장의 감정 분석 결과 기반 동적 음성 톤 (pitch, rate) 미세 조절
  const analyzed = analyzeServerTextEmotion(cleanText, emotion);
  const resolvedEmotion = emotion || analyzed.emotion;
  const rate = options.rate && options.rate.trim() ? options.rate.trim() : analyzed.rate;
  const pitch = options.pitch && options.pitch.trim() ? options.pitch.trim() : analyzed.pitch;

  const cacheKey = `female_${resolvedVoiceKey}_${resolvedEmotion}_${rate}_${pitch}_${cleanText}`;

  // Check in-memory cache
  const cached = ttsServerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return {
      audioContent: cached.base64,
      encoding: cached.encoding,
      sampleRate: cached.sampleRate,
    };
  }

  // Primary Engine: Edge Neural TTS (with circuit-breaker for 403 blocks)
  if (Date.now() >= edgeTtsBlockedUntil) {
    try {
      const generateWithEdgeTTS = async (textToSpeak: string): Promise<Buffer | null> => {
        // Strip any stray emojis or non-speech symbols that might disrupt EdgeTTS websocket
        const safeText = textToSpeak
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
          .replace(/[【】★☆✦✧🌙🔮✨⭐※▶◆◇■□▲△▼▽“”‘’`~]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!safeText) return null;

        const tts = new EdgeTTS({
          voice: voiceName,
          lang,
          rate,
          pitch,
          outputFormat: "audio-24khz-96kbitrate-mono-mp3",
        });

        const tempPath = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);
        const edgeTimeoutMs = Math.max(10000, Math.min(24000, safeText.length * 45));

        try {
          await Promise.race([
            tts.ttsPromise(safeText, tempPath),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`EdgeTTS timeout (${edgeTimeoutMs}ms)`)), edgeTimeoutMs)),
          ]);

          const buf = await fsPromises.readFile(tempPath);
          await fsPromises.unlink(tempPath).catch(() => undefined);
          return buf && buf.length > 0 ? buf : null;
        } catch (err) {
          await fsPromises.unlink(tempPath).catch(() => undefined);
          throw err;
        }
      };

      let finalBuffer: Buffer | null = null;
      try {
        finalBuffer = await generateWithEdgeTTS(cleanText);
      } catch (attemptErr: any) {
        const errMsg = String(attemptErr?.message || attemptErr);
        if (errMsg.includes('403') || errMsg.includes('Forbidden')) {
          edgeTtsBlockedUntil = Date.now() + 10 * 60 * 1000;
        } else {
          try {
            await new Promise((r) => setTimeout(r, 200));
            finalBuffer = await generateWithEdgeTTS(cleanText);
          } catch (retryErr: any) {
            const retryMsg = String(retryErr?.message || retryErr);
            if (retryMsg.includes('403') || retryMsg.includes('Forbidden')) {
              edgeTtsBlockedUntil = Date.now() + 10 * 60 * 1000;
            }
          }
        }
      }

      if (finalBuffer && finalBuffer.length > 0) {
        const base64 = finalBuffer.toString("base64");
        if (ttsServerCache.size > 500) {
          const oldestKey = ttsServerCache.keys().next().value;
          if (oldestKey) ttsServerCache.delete(oldestKey);
        }
        ttsServerCache.set(cacheKey, { base64, encoding: "mp3", sampleRate: 24000, timestamp: Date.now() });

        return {
          audioContent: base64,
          encoding: "mp3",
        };
      }
    } catch (_edgeError: any) {
      // Gracefully fall through to Google / Gemini engines
    }
  }

  // 2. Secondary Engine: Google AI Studio Gemini Flash TTS via official @google/genai SDK
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.AI_API_KEY;
  if (geminiApiKey && Date.now() >= geminiTtsQuotaBlockedUntil) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const selectedVoice = "Kore"; // Guaranteed female voice

      const prompt = `Read the following text aloud in Korean at natural standard 1.0x pace with a warm, clear, comfortable female voice (여성 목소리):\n\n${cleanText}`;

      const geminiResponse = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Gemini TTS timeout (8000ms)")), 8000)),
      ]);

      const candidate = geminiResponse?.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith("audio/"));
      if (audioPart?.inlineData?.data) {
        const base64 = audioPart.inlineData.data;
        const mimeType = String(audioPart.inlineData.mimeType || "").toLowerCase();
        let encoding: "pcm" | "mp3" = "pcm";
        if (mimeType.includes("mp3") || mimeType.includes("mpeg") || mimeType.includes("wav")) {
          encoding = "mp3";
        }
        let sampleRate = 24000;
        if (mimeType.includes("rate=")) {
          const match = mimeType.match(/rate=(\d+)/);
          if (match) sampleRate = parseInt(match[1], 10);
        }

        if (ttsServerCache.size > 500) {
          const oldestKey = ttsServerCache.keys().next().value;
          if (oldestKey) ttsServerCache.delete(oldestKey);
        }
        ttsServerCache.set(cacheKey, { base64, encoding, sampleRate, timestamp: Date.now() });
        return {
          audioContent: base64,
          encoding,
          sampleRate,
        };
      }
    } catch (geminiErr: any) {
      const gMsg = String(geminiErr?.message || geminiErr);
      if (gMsg.includes('429') || gMsg.includes('RESOURCE_EXHAUSTED') || gMsg.includes('quota')) {
        geminiTtsQuotaBlockedUntil = Date.now() + 15 * 60 * 1000; // 15 min cooldown on quota exhaustion
      }
    }
  }

function stripID3Header(buf: Buffer): Buffer {
  if (buf.length >= 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) { // 'ID3'
    const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    const totalHeaderLen = 10 + size;
    if (buf.length > totalHeaderLen) {
      return buf.subarray(totalHeaderLen);
    }
  }
  return buf;
}

  // 3. High-speed Direct Fallback: Google TTS (ultra-fast, 100% reliable on Vercel / serverless)
  const googleLang = lang.startsWith("ko") ? "ko" : "en";
  try {
    const results = await googleTTS.getAllAudioBase64(cleanText, {
      lang: googleLang,
      slow: false,
      host: "https://translate.google.com",
      splitPunct: ",.?!;:\n",
    });

    const buffers = results.map((r: any, idx: number) => {
      const b = Buffer.from(r.base64, "base64");
      return idx === 0 ? b : stripID3Header(b);
    });
    const combinedBuffer = Buffer.concat(buffers);
    const base64 = combinedBuffer.toString("base64");

    if (base64.length > 500) {
      if (ttsServerCache.size > 500) {
        const oldestKey = ttsServerCache.keys().next().value;
        if (oldestKey) ttsServerCache.delete(oldestKey);
      }
      ttsServerCache.set(cacheKey, { base64, encoding: "mp3", sampleRate: 24000, timestamp: Date.now() });

      return {
        audioContent: base64,
        encoding: "mp3",
      };
    }
  } catch (googleError: any) {
    console.warn("[TTS] google-tts-api fallback attempt 1, trying direct HTTP stream:", googleError?.message || googleError);
  }

  // 3.5. Direct HTTP Stream Fallback (Bypasses library limitations on Vercel Serverless)
  try {
    const chunks = cleanText.match(/.{1,180}(\s|$)|.+/g) || [cleanText];
    const bufferPromises = chunks.map(async (chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return Buffer.alloc(0);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmed)}&tl=${googleLang}&client=tw-ob`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });
      if (!res.ok) throw new Error(`Google TTS status ${res.status}`);
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    });

    const fetchedBuffers = await Promise.all(bufferPromises);
    const validBuffers = fetchedBuffers.filter((b) => b.length > 0);
    const strippedBuffers = validBuffers.map((b, idx) => (idx === 0 ? b : stripID3Header(b)));
    const combined = Buffer.concat(strippedBuffers);
    if (combined.length > 500) {
      const base64 = combined.toString("base64");
      ttsServerCache.set(cacheKey, { base64, encoding: "mp3", sampleRate: 24000, timestamp: Date.now() });
      return {
        audioContent: base64,
        encoding: "mp3",
      };
    }
  } catch (directError: any) {
    console.error("[TTS] Direct Google TTS HTTP fallback error:", directError?.message || directError);
  }

  // 4. OpenAI TTS Fallback (if configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiModule = await import("openai");
      const OpenAIClass = (openaiModule as any).default || openaiModule.OpenAI || openaiModule;
      const openai = new OpenAIClass({ apiKey: process.env.OPENAI_API_KEY });
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: isMaleVoice ? "onyx" : "nova",
        input: cleanText,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64 = buffer.toString("base64");

      ttsServerCache.set(cacheKey, { base64, encoding: "mp3", sampleRate: 24000, timestamp: Date.now() });
      return {
        audioContent: base64,
        encoding: "mp3",
      };
    } catch (openaiError: any) {
      console.error("[TTS] OpenAI TTS fallback failed:", openaiError);
    }
  }

  throw new Error("All TTS engines failed to generate audio.");
}
