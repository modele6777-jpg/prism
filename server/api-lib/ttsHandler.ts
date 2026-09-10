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
}

export interface TTSHandlerResult {
  audioContent: string;
  encoding: "mp3" | "pcm";
  sampleRate?: number;
}

export async function handleTTS(options: TTSHandlerOptions): Promise<TTSHandlerResult> {
  const { text, voice = "Kore", emotion } = options;
  if (!text) {
    throw new Error("Empty speech text");
  }

  const cleanText = prepareNaturalSpeechText(String(text || ""));
  if (!cleanText) {
    throw new Error("Empty speech text");
  }

  const resolvedVoiceKey = voice || "Kore";
  const cacheKey = `${resolvedVoiceKey}_${emotion || ""}_${cleanText}`;

  // 1. Check in-memory cache
  const cached = ttsServerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return {
      audioContent: cached.base64,
      encoding: cached.encoding,
      sampleRate: cached.sampleRate,
    };
  }

  const isKorean = /[가-힣]/.test(cleanText);
  const isMaleVoice =
    voice === "Fenrir" ||
    voice === "Charon" ||
    voice === "Michael" ||
    voice === "Guy" ||
    voice === "onyx" ||
    voice === "user" ||
    voice === "male" ||
    voice === "ko-KR-InJoonNeural" ||
    voice === "en-US-GuyNeural";

  // 2. Primary Engine: Edge Neural TTS (100% consistent timbre and prosody across sequential chunks)
  try {
    let voiceName = isMaleVoice ? "ko-KR-InJoonNeural" : "ko-KR-SunHiNeural";
    let lang = "ko-KR";
    let rate = "+0%";
    let pitch = "+0Hz";

    if (!isKorean) {
      lang = "en-US";
      voiceName = isMaleVoice ? "en-US-GuyNeural" : "en-US-AriaNeural";
    }

    if (emotion) {
      const emo = String(emotion).trim().toLowerCase();
      const slowHealingList = ["공감", "위로", "치유", "차분", "평온", "슬픔", "따뜻", "empathy", "comfort", "healing", "calm", "peace", "sadness", "sad", "warm"];
      const brightJoyList = ["기쁨", "응원", "설렘", "위트", "밝음", "재미", "신남", "joy", "cheer", "cheering", "excited", "witty", "happy", "fun", "bright"];
      const mysteryTarotList = ["신비", "진지", "경고", "몽환", "mystery", "serious", "warning", "dreamy", "mystic"];

      if (slowHealingList.some((item) => emo.includes(item))) {
        rate = "-5%";
        pitch = voiceName.includes("SunHi") ? "-1Hz" : "-1.5Hz";
      } else if (brightJoyList.some((item) => emo.includes(item))) {
        rate = "+2%";
        pitch = "+1Hz";
      } else if (mysteryTarotList.some((item) => emo.includes(item))) {
        rate = "-4%";
        pitch = "-1Hz";
      }
    }

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

      try {
        await Promise.race([
          tts.ttsPromise(safeText, tempPath),
          new Promise((_, reject) => setTimeout(() => reject(new Error("EdgeTTS timeout (6000ms)")), 6000)),
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
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        finalBuffer = await generateWithEdgeTTS(cleanText);
        if (finalBuffer && finalBuffer.length > 0) break;
      } catch (attemptErr) {
        console.warn(`[TTS] EdgeTTS attempt ${attempt}/2 warning:`, attemptErr);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 150 * attempt));
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
  } catch (edgeError: any) {
    console.warn("[TTS] EdgeTTS notice, trying Gemini / Google TTS fallback:", edgeError?.message || edgeError);
  }

  // 3. Secondary Engine: Google AI Studio Gemini Flash TTS via official @google/genai SDK
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.AI_API_KEY;
  if (geminiApiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const selectedVoice = isMaleVoice ? "Fenrir" : "Kore";

      const prompt = isMaleVoice
        ? `Read the following text aloud in Korean with a natural, clear male voice:\n\n${cleanText}`
        : `Read the following text aloud in Korean with a warm, gentle, clear female voice:\n\n${cleanText}`;

      const geminiResponse = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
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
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Gemini TTS timeout (3500ms)")), 3500)),
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
      console.warn("[TTS] Gemini AI Studio voice fallback notice:", geminiErr?.message || geminiErr);
    }
  }

  // 3. High-speed Direct Fallback: Google TTS (ultra-fast, 100% reliable on Vercel / serverless)
  try {
    const results = await googleTTS.getAllAudioBase64(cleanText, {
      lang: isKorean ? "ko" : "en",
      slow: false,
      host: "https://translate.google.com",
      splitPunct: ",.?!;:\n",
    });

    const buffers = results.map((r: any) => Buffer.from(r.base64, "base64"));
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
    const lang = isKorean ? "ko" : "en";
    const chunks = cleanText.match(/.{1,180}(\s|$)|.+/g) || [cleanText];
    const bufferPromises = chunks.map(async (chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return Buffer.alloc(0);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmed)}&tl=${lang}&client=tw-ob`;
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
    const combined = Buffer.concat(fetchedBuffers.filter((b) => b.length > 0));
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
