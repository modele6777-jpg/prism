import { db, doc, getDoc, getDocFromServer, setDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from './firebase';
import type { SharedState, UserProfile } from './sharedState';
import { safeLocalStorage } from '../utils/safeStorage';
import { pickNewestVersion } from './appVersion';
import { loadProfileFromAllVaults, saveProfileToAllVaults } from './profileVault';
import { pushToServerVault, pullFromServerVault } from './serverSyncClient';
import { loadSavedUnifiedMessages, mergeUnifiedMessages, saveUnifiedMessagesSafely, STORAGE_KEYS } from './chatHistorySync';

export const GUEST_STATE_KEY = 'lucy_state_guest';

export function sharedStateLocalKey(uid: string): string {
  return `lucy_state_${uid}`;
}

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAILY_SYNC_KEYS = [
  'lastMuseSync',
  'lastOrangeRefine',
  'lastBluebirdSync',
  'lastTrinitySync',
  'lastDailyOracleSync',
  'lastTrinityDailySync',
  'lastTrinitySoulSync',
  'lastOrangeDailySync',
  'lastOrangeSoulSync',
  'lastBluebirdDailySync',
  'lastBluebirdSoulSync',
  'lastHealDailySync',
  'lastHealSoulSync',
  'lastMuseDailySync',
  'lastMuseSoulSync',
  'lastEnergyAnalysis',
] as const;

const HISTORY_KEYS = [
  'deepSyncHistory',
  'museHistory',
  'orangeHistory',
  'bluebirdHistory',
  'healHistory',
  'trinityHistory',
  'prologueHistory',
  'epilogueHistory',
  'soulHistory',
  'emotionHistory',
] as const;

const PLACEHOLDERS = new Set(['여행자', '사용자', '정보 없음', '모름', '기본', 'none', 'unknown', '']);

function isPlaceholder(val: any): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return !trimmed || PLACEHOLDERS.has(trimmed.toLowerCase()) || trimmed === '여행자' || trimmed === '사용자';
  }
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

function profileCompleteness(profile?: UserProfile): number {
  if (!profile) return 0;
  let score = 0;
  const b = profile.basic;
  if (b?.name?.trim() && !isPlaceholder(b.name)) score += 3;
  if (b?.nickname?.trim() && !isPlaceholder(b.nickname)) score += 3;
  if (b?.birthdate?.trim() && !isPlaceholder(b.birthdate)) score += 3;
  if (b?.birthtime?.trim() && !isPlaceholder(b.birthtime)) score += 2;
  if (b?.gender && !isPlaceholder(b.gender)) score += 1;
  if (b?.birthCity?.trim() && !isPlaceholder(b.birthCity)) score += 2;
  if (profile.fate?.fateInterests?.length) score += 2;
  if (profile.fate?.lifeGoal?.trim() && !isPlaceholder(profile.fate.lifeGoal)) score += 2;
  if (profile.fate?.currentWorry?.trim() && !isPlaceholder(profile.fate.currentWorry)) score += 2;
  if (profile.music?.favoriteGenres?.length) score += 1;
  if (profile.psych?.mbti?.trim() && !isPlaceholder(profile.psych.mbti)) score += 2;
  if (profile.art?.favoriteArtStyle?.length) score += 1;
  return score;
}

function mergeProfileSection<T extends any>(baseSection?: T, incomingSection?: T, preferIncoming = false): T | undefined {
  if (!baseSection && !incomingSection) return undefined;
  if (!baseSection) return incomingSection;
  if (!incomingSection) return baseSection;

  const result: any = { ...(baseSection as any), ...(incomingSection as any) };
  const allKeys = new Set([...Object.keys(baseSection as any), ...Object.keys(incomingSection as any)]);

  for (const key of allKeys) {
    const bVal = (baseSection as any)[key];
    const iVal = (incomingSection as any)[key];

    const bEmpty = isPlaceholder(bVal);
    const iEmpty = isPlaceholder(iVal);

    if (bEmpty && iEmpty) {
      result[key] = !bEmpty ? bVal : (!iEmpty ? iVal : bVal || iVal);
      continue;
    }

    if (!bEmpty && iEmpty) {
      result[key] = bVal;
      continue;
    }

    if (bEmpty && !iEmpty) {
      result[key] = iVal;
      continue;
    }

    // Both are valid non-placeholder values
    if (Array.isArray(bVal) || Array.isArray(iVal)) {
      const bArr = Array.isArray(bVal) ? bVal : [];
      const iArr = Array.isArray(iVal) ? iVal : [];
      result[key] = Array.from(new Set([...bArr, ...iArr]));
      continue;
    }

    if (typeof bVal === 'string' && typeof iVal === 'string') {
      const bStr = bVal.trim();
      const iStr = iVal.trim();
      if (bStr === iStr) {
        result[key] = bStr;
      } else if (preferIncoming) {
        result[key] = iStr;
      } else {
        result[key] = iStr.length >= bStr.length ? iStr : bStr;
      }
      continue;
    }

    result[key] = preferIncoming ? iVal : (bVal !== undefined ? bVal : iVal);
  }

  return result as T;
}

export function mergeUserProfile(
  local?: UserProfile,
  remote?: UserProfile,
  localUpdatedAt = 0,
  remoteUpdatedAt = 0,
): UserProfile | undefined {
  if (!local && !remote) return undefined;
  if (!local) return remote;
  if (!remote) return local;

  const localScore = profileCompleteness(local);
  const remoteScore = profileCompleteness(remote);

  // Determine preference: if one side is vastly more complete, prefer it
  let preferRemote = remoteScore > localScore;
  if (remoteScore === localScore) {
    preferRemote = remoteUpdatedAt >= localUpdatedAt;
  }

  return {
    ...(preferRemote ? local : remote),
    ...(preferRemote ? remote : local),
    basic: mergeProfileSection(local.basic, remote.basic, preferRemote),
    fate: mergeProfileSection(local.fate, remote.fate, preferRemote),
    music: mergeProfileSection(local.music, remote.music, preferRemote),
    psych: mergeProfileSection(local.psych, remote.psych, preferRemote),
    art: mergeProfileSection(local.art, remote.art, preferRemote),
    completedAt: (preferRemote ? remote.completedAt : local.completedAt) || local.completedAt || remote.completedAt || Date.now(),
  };
}

export function getSharedStateUpdatedAt(state?: SharedState | null): number {
  if (!state) return 0;
  if (typeof state.clientUpdatedAt === 'number') return state.clientUpdatedAt;
  const updatedAt = state.updatedAt as { toMillis?: () => number } | number | undefined;
  if (typeof updatedAt === 'number') return updatedAt;
  return updatedAt?.toMillis?.() || 0;
}

export function getProfileUpdatedAt(state?: SharedState | null): number {
  if (!state) return 0;
  if (typeof state.profileUpdatedAt === 'number') return state.profileUpdatedAt;
  if (state.sourceApp === 'profile') return getSharedStateUpdatedAt(state);
  return 0;
}

/**
 * Collects all local activity feeds and oracle records across all PRISM sub-apps.
 */
export function collectAllLocalActivities(uid?: string | null): Partial<SharedState> {
  if (typeof window === 'undefined') return {};

  const result: Partial<SharedState> = {};
  const todayKey = getTodayDateKey();
  const effectiveUid = uid || 'guest';

  // 1. Collect all local profile vaults
  const localVaultProfile = loadProfileFromAllVaults();
  if (localVaultProfile && profileCompleteness(localVaultProfile) > 0) {
    result.userProfile = localVaultProfile;
  }

  // 2. Collect feature activity history (prism_omni_feature_history)
  try {
    const rawFeat = safeLocalStorage.getItem('prism_omni_feature_history');
    if (rawFeat) {
      const parsed = JSON.parse(rawFeat);
      if (Array.isArray(parsed) && parsed.length > 0) {
        result.featureHistory = parsed;
      }
    }
  } catch (_) {}

  // 3. Collect all today and latest daily oracles from sub-apps
  const todayOracles: Record<string, Record<string, any>> = {};
  const latestDailyOracles: Record<string, any> = {};

  const subApps = ['trinity', 'orange', 'bluebird', 'heal', 'muse', 'hub', 'epilogue'];
  subApps.forEach((app) => {
    try {
      const todayRaw = safeLocalStorage.getItem(`prism_daily_oracle_${app}_${todayKey}`) ||
        safeLocalStorage.getItem(`${app}_daily_result_${effectiveUid}_${todayKey}`) ||
        safeLocalStorage.getItem(`${app}_daily_result_guest_${todayKey}`);
      if (todayRaw) {
        const parsed = JSON.parse(todayRaw);
        if (!todayOracles[todayKey]) todayOracles[todayKey] = {};
        todayOracles[todayKey][app] = parsed;
      }

      const latestRaw = safeLocalStorage.getItem(`prism_latest_daily_${app}`) ||
        safeLocalStorage.getItem(`${app}_daily_result_${effectiveUid}`) ||
        safeLocalStorage.getItem(`${app}_daily_result_guest`);
      if (latestRaw) {
        const parsed = JSON.parse(latestRaw);
        latestDailyOracles[app] = parsed;
      }
    } catch (_) {}
  });

  if (Object.keys(todayOracles).length > 0) {
    result.todayOracles = todayOracles;
  }
  if (Object.keys(latestDailyOracles).length > 0) {
    result.latestDailyOracles = latestDailyOracles;
  }

  // 4. Collect sub-app libraries & vaults
  try {
    const talisman = safeLocalStorage.getItem('prism_talisman_chest');
    if (talisman) result.orangeHistory = JSON.parse(talisman);
  } catch (_) {}

  try {
    const arts = safeLocalStorage.getItem('art_history');
    if (arts) result.museHistory = JSON.parse(arts);
  } catch (_) {}

  try {
    const secrets = safeLocalStorage.getItem('secret_messages');
    if (secrets) result.bluebirdHistory = JSON.parse(secrets);
  } catch (_) {}

  try {
    const sedona = safeLocalStorage.getItem('sedona_records') || safeLocalStorage.getItem('sedona_daily_latest');
    if (sedona) result.healHistory = [JSON.parse(sedona)];
  } catch (_) {}

  // 5. Collect Universal Insight Favorites
  try {
    const favs = safeLocalStorage.getItem('prism_universe_insight_favorites');
    if (favs) {
      const parsed = JSON.parse(favs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        result.favoriteInsightIds = parsed;
      }
    }
  } catch (_) {}

  // 6. Collect Re:Bible Verses (인생 경전 서재)
  try {
    const rebible = safeLocalStorage.getItem('prism_rebible_verses_v2');
    if (rebible) {
      const parsed = JSON.parse(rebible);
      if (Array.isArray(parsed) && parsed.length > 0) {
        result.rebibleVerses = parsed;
      }
    }
  } catch (_) {}

  // 7. Collect Unified Chat History (across personas & devices)
  try {
    const chatMsgs = loadSavedUnifiedMessages();
    if (Array.isArray(chatMsgs) && chatMsgs.length > 0) {
      result.chatHistory = chatMsgs.slice(-120);
    }
  } catch (_) {}

  // 8. Collect Muse Daily Art Recommendations (오늘의 예술 추천)
  try {
    const today = getTodayDateKey();
    const artRecRaw = safeLocalStorage.getItem('muse_today_art_recommendation_v18') ||
      safeLocalStorage.getItem('art_recommendation_cache') ||
      safeLocalStorage.getItem(`art_recommendation_cache_${today}`);
    const artDate = safeLocalStorage.getItem('muse_today_art_date') ||
      safeLocalStorage.getItem('art_recommendation_date') ||
      today;

    if (artRecRaw) {
      const parsedRec = JSON.parse(artRecRaw);
      const img = safeLocalStorage.getItem('muse_today_art_image_v18') ||
        safeLocalStorage.getItem('art_nanobanana_image') ||
        safeLocalStorage.getItem(`art_nanobanana_image_${today}`) ||
        parsedRec?.imageUrl;
      const imageSource = safeLocalStorage.getItem('muse_today_art_image_source_v18') ||
        safeLocalStorage.getItem('art_image_source') ||
        'dailyart';
      const moodLabel = safeLocalStorage.getItem('muse_today_art_mood_label') ||
        safeLocalStorage.getItem('art_current_mood') ||
        '창작의 막힘 & 슬럼프 극복';
      const userConcern = safeLocalStorage.getItem('muse_today_art_user_concern') || '';

      result.dailyArts = {
        [artDate]: {
          recommendation: parsedRec,
          image: img,
          imageSource,
          moodLabel,
          userConcern,
          timestamp: Date.now(),
        }
      };
    }
  } catch (_) {}

  // 9. Collect Trinity Daily Lucky Data (트리니티 럭키 데일리: 행운 리포트, 부적, 3대 퀘스트, 클로버 부스트)
  try {
    const today = getTodayDateKey();
    const luckyDataRaw = safeLocalStorage.getItem(`trinity_daily_lucky_data_v4_${effectiveUid}_${today}`) ||
      safeLocalStorage.getItem(`trinity_daily_lucky_data_v4_guest_${today}`) ||
      safeLocalStorage.getItem(`trinity_daily_lucky_data_v4_${today}`);
    const questsRaw = safeLocalStorage.getItem(`trinity_daily_lucky_quests_v4_${effectiveUid}_${today}`) ||
      safeLocalStorage.getItem(`trinity_daily_lucky_quests_v4_guest_${today}`) ||
      safeLocalStorage.getItem(`trinity_daily_lucky_quests_v4_${today}`);
    const isBoosted = safeLocalStorage.getItem(`trinity_daily_lucky_boost_v4_${effectiveUid}_${today}`) === 'true' ||
      safeLocalStorage.getItem(`trinity_daily_lucky_boost_v4_${today}`) === 'true';

    if (luckyDataRaw) {
      const parsedLucky = JSON.parse(luckyDataRaw);
      const parsedQuests = questsRaw ? JSON.parse(questsRaw) : {};
      result.trinityDailyLucky = {
        [today]: {
          luckyData: parsedLucky,
          completedQuests: parsedQuests,
          isBoosted,
          timestamp: Date.now(),
        }
      };
    }
  } catch (_) {}

  // 10. Collect Orange Daily Secrets (데일리 시크릿 활동: 소원, 확언, 실천, 감사, 스크립팅)
  try {
    const today = getTodayDateKey();
    let secretData: any = null;
    let rootTs = 0;
    const rawToday = safeLocalStorage.getItem(`orange_daily_secret_${today}`);
    const rawV2 = safeLocalStorage.getItem('orange_daily_secret_v2');
    const rawCache = safeLocalStorage.getItem('orange_daily_secret_cache');

    if (rawToday) {
      const parsed = JSON.parse(rawToday);
      secretData = parsed?.data || (parsed?.affirmation ? parsed : null);
      rootTs = Number(parsed?.updatedAt || parsed?.timestamp || 0);
    } else if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed?.date === today) {
        secretData = parsed?.data || (parsed?.affirmation ? parsed : null);
        rootTs = Number(parsed?.updatedAt || parsed?.timestamp || 0);
      }
    } else if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (parsed?.date === today) {
        secretData = parsed?.data || (parsed?.affirmation ? parsed : null);
        rootTs = Number(parsed?.updatedAt || parsed?.timestamp || 0);
      }
    }
    if (secretData) {
      const appliedWish = safeLocalStorage.getItem(`orange_daily_secret_applied_wish_${today}`) ||
        safeLocalStorage.getItem(`orange_daily_secret_wish_${today}`) ||
        secretData.appliedWish;
      const practiceRaw = safeLocalStorage.getItem(`orange_daily_secret_practice_${today}`);
      const gratitudeRaw = safeLocalStorage.getItem(`orange_daily_secret_gratitude_checked_${today}`);
      const extraGratitudeRaw = safeLocalStorage.getItem(`orange_daily_secret_gratitude_extra_${today}`);
      const script = safeLocalStorage.getItem(`orange_daily_secret_script_${today}`) || secretData.script;

      result.dailySecrets = {
        [today]: {
          ...secretData,
          appliedWish: appliedWish || undefined,
          updatedAt: secretData.updatedAt || rootTs || secretData.timestamp || Date.now(),
          practice: practiceRaw ? JSON.parse(practiceRaw) : secretData.practice,
          gratitudeChecked: gratitudeRaw ? JSON.parse(gratitudeRaw) : secretData.gratitudeChecked,
          extraGratitude: extraGratitudeRaw ? JSON.parse(extraGratitudeRaw) : secretData.extraGratitude,
          script: script || undefined,
        }
      };
    }
  } catch (_) {}

  return result;
}

/**
 * Calculates a concise signature representing the significant content of a SharedState.
 * Used for dirty-checking to bypass expensive re-hydration, re-persisting, and redundant renders.
 */
export function getSharedStateSignature(s: SharedState | null | undefined): string {
  if (!s) return 'null';
  const prof = s.userProfile?.basic;
  const psych = s.userProfile?.psych;
  const profStr = prof
    ? `${prof.nickname || ''}_${prof.birthdate || ''}_${prof.birthtime || ''}_${prof.gender || ''}_${prof.lunarSolar || ''}_${psych?.mbti || ''}`
    : '';
  const oracleKeys = s.todayOracles ? Object.keys(s.todayOracles).sort().join(',') : '';
  const secretKeys = s.dailySecrets ? Object.keys(s.dailySecrets).sort().join(',') : '';
  const artKeys = s.dailyArts ? Object.keys(s.dailyArts).sort().join(',') : '';
  const luckyKeys = s.trinityDailyLucky ? Object.keys(s.trinityDailyLucky).sort().join(',') : '';
  const hopoKeys = s.hoponoponoDaily ? Object.keys(s.hoponoponoDaily).sort().join(',') : '';
  const hLen = `${s.featureHistory?.length || 0}_${s.orangeHistory?.length || 0}_${s.museHistory?.length || 0}_${s.bluebirdHistory?.length || 0}_${s.favoriteInsightIds?.length || 0}_${s.rebibleVerses?.length || 0}_${(s as any).epilogueHistory?.length || 0}`;
  return `${s.unifiedAppVersion || ''}|${s.lastAppSyncAt || 0}|${profStr}|${s.themeColor || ''}|${s.currentVibe || ''}|${oracleKeys}|${secretKeys}|${artKeys}|${luckyKeys}|${hopoKeys}|${hLen}`;
}

let lastHydratedSignature = '';

/**
 * Unpacks and restores merged cloud data into the current device's local storage and dispatches UI events.
 */
export function unpackAndHydrateLocalStorage(uid: string | null | undefined, state: SharedState): void {
  if (typeof window === 'undefined' || !state) return;

  const currentSignature = `${uid || 'guest'}::${getSharedStateSignature(state)}`;
  if (lastHydratedSignature && lastHydratedSignature === currentSignature) {
    return;
  }
  lastHydratedSignature = currentSignature;

  const todayKey = getTodayDateKey();
  const effectiveUid = uid || 'guest';

  // 1. Hydrate User Profile to all 10 local vaults
  if (state.userProfile && Object.keys(state.userProfile).length > 0) {
    saveProfileToAllVaults(state.userProfile);
    try {
      safeLocalStorage.setItem('lucy_user_profile', JSON.stringify(state.userProfile));
    } catch (_) {}
  }

  // 2. Hydrate Feature Activity History (prism_omni_feature_history)
  if (Array.isArray(state.featureHistory) && state.featureHistory.length > 0) {
    try {
      const existingRaw = safeLocalStorage.getItem('prism_omni_feature_history');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const mergedMap = new Map<string, any>();
      (state.featureHistory || []).forEach((item) => {
        if (item && item.id) mergedMap.set(item.id, item);
      });
      existing.forEach((item: any) => {
        if (item && item.id) mergedMap.set(item.id, item);
      });
      const combined = Array.from(mergedMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 80);
      safeLocalStorage.setItem('prism_omni_feature_history', JSON.stringify(combined));
    } catch (_) {}
  }

  // 3. Hydrate Today Oracles & Latest Daily Oracles
  if (state.todayOracles) {
    Object.entries(state.todayOracles).forEach(([dateKey, appObj]) => {
      if (appObj && typeof appObj === 'object') {
        Object.entries(appObj).forEach(([app, summary]) => {
          if (app !== 'lastUpdated' && summary) {
            try {
              const summaryStr = JSON.stringify(summary);
              safeLocalStorage.setItem(`prism_daily_oracle_${app}_${dateKey}`, summaryStr);
              if (dateKey === todayKey) {
                safeLocalStorage.setItem(`prism_latest_daily_${app}`, summaryStr);
                safeLocalStorage.setItem(`${app}_daily_result_${effectiveUid}_${todayKey}`, summaryStr);
                safeLocalStorage.setItem(`${app}_daily_result_guest_${todayKey}`, summaryStr);
                safeLocalStorage.setItem(`limit_daily_${app}_${effectiveUid}_${todayKey}`, 'true');
                safeLocalStorage.setItem(`limit_daily_${app}_guest_${todayKey}`, 'true');
                safeLocalStorage.setItem(`lucy_autorun_${app}_${effectiveUid}_${todayKey}`, 'true');
                safeLocalStorage.setItem(`lucy_autorun_${app}_guest_${todayKey}`, 'true');

                // App-specific cache keys for instant offline / cross-device restoration
                if (app === 'heal') {
                  safeLocalStorage.setItem(`heal_sedona_oracle_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`sedona_oracle_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`sedona_meditation_done_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`sedona_card_flipped_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`limit_daily_heal_sedona_${effectiveUid}_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`limit_daily_heal_sedona_guest_${todayKey}`, 'true');
                } else if (app === 'trinity') {
                  safeLocalStorage.setItem(`trinity_daily_result_${effectiveUid}_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`trinity_daily_result_guest_${todayKey}`, summaryStr);
                } else if (app === 'orange') {
                  safeLocalStorage.setItem(`orange_daily_result_${effectiveUid}_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`orange_daily_result_guest_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`orange_daily_checked_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`limit_daily_orange_${effectiveUid}_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`limit_daily_orange_guest_${todayKey}`, 'true');
                } else if (app === 'bluebird') {
                  safeLocalStorage.setItem(`bluebird_daily_result_${effectiveUid}_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`bluebird_daily_result_guest_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`limit_daily_bluebird_${effectiveUid}_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`limit_daily_bluebird_guest_${todayKey}`, 'true');
                } else if (app === 'muse') {
                  safeLocalStorage.setItem(`muse_daily_result_${effectiveUid}_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`muse_daily_result_guest_${todayKey}`, summaryStr);
                  safeLocalStorage.setItem(`muse_daily_checked_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`limit_daily_muse_${effectiveUid}_${todayKey}`, 'true');
                  safeLocalStorage.setItem(`limit_daily_muse_guest_${todayKey}`, 'true');
                }
              }
            } catch (_) {}
          }
        });
      }
    });
  }

  if (state.latestDailyOracles) {
    Object.entries(state.latestDailyOracles).forEach(([app, summary]) => {
      if (summary && (summary as any).dateKey === todayKey) {
        try {
          const summaryStr = JSON.stringify(summary);
          safeLocalStorage.setItem(`prism_latest_daily_${app}`, summaryStr);
          safeLocalStorage.setItem(`${app}_daily_result_${effectiveUid}_${todayKey}`, summaryStr);
          safeLocalStorage.setItem(`${app}_daily_result_guest_${todayKey}`, summaryStr);
          safeLocalStorage.setItem(`limit_daily_${app}_${effectiveUid}_${todayKey}`, 'true');
          safeLocalStorage.setItem(`limit_daily_${app}_guest_${todayKey}`, 'true');
        } catch (_) {}
      }
    });
  }

  // 3b. Hydrate Orange Daily Secrets across devices with timestamp protection
  if (state.dailySecrets) {
    Object.entries(state.dailySecrets).forEach(([dateKey, secretData]) => {
      if (secretData) {
        try {
          const secretTs = Number(secretData.updatedAt || secretData.timestamp || 0);
          const currentLocalRaw = safeLocalStorage.getItem(`orange_daily_secret_${dateKey}`);
          let localTs = 0;
          if (currentLocalRaw) {
            try {
              const parsed = JSON.parse(currentLocalRaw);
              localTs = Number(parsed?.data?.updatedAt || parsed?.updatedAt || 0);
            } catch (_) {}
          }

          // Guard against stale cloud snapshots overwriting fresh local submissions
          if (secretTs === 0 || localTs === 0 || secretTs >= localTs) {
            const secretStr = JSON.stringify({ date: dateKey, data: secretData, updatedAt: secretTs || Date.now() });
            safeLocalStorage.setItem(`orange_daily_secret_${dateKey}`, secretStr);
            if (dateKey === todayKey) {
              safeLocalStorage.setItem('orange_daily_secret_cache', secretStr);
              safeLocalStorage.setItem('orange_daily_secret_v2', secretStr);
            }
            if (secretData.appliedWish) {
              safeLocalStorage.setItem(`orange_daily_secret_applied_wish_${dateKey}`, secretData.appliedWish);
              safeLocalStorage.setItem(`orange_daily_secret_wish_${dateKey}`, secretData.appliedWish);
              safeLocalStorage.setItem(`orange_daily_secret_wish_applied_${dateKey}`, 'true');
            } else if (secretData.appliedWish === null || secretData.appliedWish === '') {
              safeLocalStorage.removeItem(`orange_daily_secret_applied_wish_${dateKey}`);
              safeLocalStorage.removeItem(`orange_daily_secret_wish_applied_${dateKey}`);
            }
            if (secretData.practice) {
              safeLocalStorage.setItem(`orange_daily_secret_practice_${dateKey}`, JSON.stringify(secretData.practice));
            }
            if (secretData.gratitudeChecked) {
              safeLocalStorage.setItem(`orange_daily_secret_gratitude_checked_${dateKey}`, JSON.stringify(secretData.gratitudeChecked));
            }
            if (secretData.extraGratitude) {
              safeLocalStorage.setItem(`orange_daily_secret_gratitude_extra_${dateKey}`, JSON.stringify(secretData.extraGratitude));
            }
            if (secretData.script) {
              safeLocalStorage.setItem(`orange_daily_secret_script_${dateKey}`, secretData.script);
            }
          }
        } catch (_) {}
      }
    });
  }

  // 3c. Hydrate Bluebird Hoponopono Daily Cleansing across devices
  if (state.hoponoponoDaily) {
    Object.entries(state.hoponoponoDaily).forEach(([dateKey, hopoData]) => {
      if (hopoData) {
        try {
          if (hopoData.result) {
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_result`, JSON.stringify(hopoData.result));
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_guest_result`, JSON.stringify(hopoData.result));
            safeLocalStorage.setItem('hoponopono_last_result', JSON.stringify(hopoData.result));
          }
          if (hopoData.image) {
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_image`, hopoData.image);
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_guest_image`, hopoData.image);
          }
          if (hopoData.tool) {
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_tool`, JSON.stringify(hopoData.tool));
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_guest_tool`, JSON.stringify(hopoData.tool));
          }
          if (hopoData.toolId) {
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_tool_id`, hopoData.toolId);
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_guest_tool_id`, hopoData.toolId);
          }
          if (hopoData.subject) {
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_subject`, hopoData.subject);
            safeLocalStorage.setItem(`bluebird_hoponopono_${dateKey}_guest_subject`, hopoData.subject);
            safeLocalStorage.setItem('hoponopono_last_subject', hopoData.subject);
          }
          safeLocalStorage.setItem(`limit_daily_bluebird_hoponopono_${effectiveUid}_${dateKey}`, 'true');
          safeLocalStorage.setItem(`limit_daily_bluebird_hoponopono_guest_${dateKey}`, 'true');
        } catch (_) {}
      } else {
        // Explicitly cleared or reset
        try {
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_result`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_guest_result`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_image`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_guest_image`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_tool`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_guest_tool`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_tool_id`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_guest_tool_id`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_${effectiveUid}_subject`);
          safeLocalStorage.removeItem(`bluebird_hoponopono_${dateKey}_guest_subject`);
          safeLocalStorage.removeItem(`limit_daily_bluebird_hoponopono_${effectiveUid}_${dateKey}`);
          safeLocalStorage.removeItem(`limit_daily_bluebird_hoponopono_guest_${dateKey}`);
          if (dateKey === getTodayDateKey()) {
            safeLocalStorage.removeItem('hoponopono_last_result');
            safeLocalStorage.removeItem('hoponopono_last_image');
            safeLocalStorage.removeItem('hoponopono_last_subject');
          }
        } catch (_) {}
      }
    });
  }

  // 3d. Hydrate Muse Daily Art Recommendations across devices
  if (state.dailyArts) {
    Object.entries(state.dailyArts).forEach(([dateKey, artData]) => {
      if (artData) {
        try {
          const rec = artData.recommendation || (artData.title ? artData : null);
          const img = artData.image || artData.nanobananaImage || artData.imageUrl || rec?.imageUrl;
          const imageSource = artData.imageSource || artData.artworkImageSource || 'dailyart';
          const moodLabel = artData.moodLabel || artData.currentMoodLabel || '창작의 막힘 & 슬럼프 극복';
          const userConcern = artData.userConcern || '';

          if (dateKey === todayKey) {
            safeLocalStorage.setItem('muse_today_art_date', dateKey);
            safeLocalStorage.setItem('art_recommendation_date', dateKey);

            if (rec) {
              const recStr = JSON.stringify(rec);
              safeLocalStorage.setItem('muse_today_art_recommendation_v18', recStr);
              safeLocalStorage.setItem('art_recommendation_cache', recStr);
              safeLocalStorage.setItem(`art_recommendation_cache_${dateKey}`, recStr);
            }
            if (img) {
              safeLocalStorage.setItem('muse_today_art_image_v18', img);
              safeLocalStorage.setItem('art_nanobanana_image', img);
              safeLocalStorage.setItem(`art_nanobanana_image_${dateKey}`, img);
            }
            if (imageSource) {
              safeLocalStorage.setItem('muse_today_art_image_source_v18', imageSource);
              safeLocalStorage.setItem('art_image_source', imageSource);
            }
            if (moodLabel) {
              safeLocalStorage.setItem('muse_today_art_mood_label', moodLabel);
              safeLocalStorage.setItem('art_current_mood', moodLabel);
            }
            if (userConcern) {
              safeLocalStorage.setItem('muse_today_art_user_concern', userConcern);
            }
          }
          if (artData.completedChallenges) {
            safeLocalStorage.setItem(`art_challenges_${dateKey}`, JSON.stringify(artData.completedChallenges));
          }
          if (artData.reflectionText) {
            safeLocalStorage.setItem(`art_reflection_${dateKey}`, artData.reflectionText);
          }
        } catch (_) {}
      }
    });

    try {
      window.dispatchEvent(new CustomEvent('prism:daily_art_updated'));
    } catch (_) {}
  }

  // 3e. Hydrate Trinity Daily Lucky Data across devices (PC <-> Mobile)
  if (state.trinityDailyLucky) {
    Object.entries(state.trinityDailyLucky).forEach(([dateKey, item]) => {
      if (item && item.luckyData) {
        try {
          const luckyStr = JSON.stringify(item.luckyData);
          safeLocalStorage.setItem(`trinity_daily_lucky_data_v4_${effectiveUid}_${dateKey}`, luckyStr);
          safeLocalStorage.setItem(`trinity_daily_lucky_data_v4_guest_${dateKey}`, luckyStr);
          safeLocalStorage.setItem(`trinity_daily_lucky_data_v4_${dateKey}`, luckyStr);

          if (item.completedQuests) {
            const questStr = JSON.stringify(item.completedQuests);
            safeLocalStorage.setItem(`trinity_daily_lucky_quests_v4_${effectiveUid}_${dateKey}`, questStr);
            safeLocalStorage.setItem(`trinity_daily_lucky_quests_v4_guest_${dateKey}`, questStr);
            safeLocalStorage.setItem(`trinity_daily_lucky_quests_v4_${dateKey}`, questStr);
          }

          if (typeof item.isBoosted === 'boolean') {
            safeLocalStorage.setItem(`trinity_daily_lucky_boost_v4_${effectiveUid}_${dateKey}`, String(item.isBoosted));
            safeLocalStorage.setItem(`trinity_daily_lucky_boost_v4_guest_${dateKey}`, String(item.isBoosted));
            safeLocalStorage.setItem(`trinity_daily_lucky_boost_v4_${dateKey}`, String(item.isBoosted));
          }
        } catch (_) {}
      }
    });

    try {
      window.dispatchEvent(new CustomEvent('prism:trinity_lucky_updated', { detail: state.trinityDailyLucky }));
      window.dispatchEvent(new CustomEvent('trinity:daily_lucky_synced', { detail: state.trinityDailyLucky }));
    } catch (_) {}
  }

  // 4. Hydrate Sub-App histories
  if (Array.isArray(state.orangeHistory) && state.orangeHistory.length > 0) {
    try {
      safeLocalStorage.setItem('prism_talisman_chest', JSON.stringify(state.orangeHistory));
    } catch (_) {}
  }

  if (Array.isArray(state.museHistory) && state.museHistory.length > 0) {
    try {
      safeLocalStorage.setItem('art_history', JSON.stringify(state.museHistory));
    } catch (_) {}
  }

  if (Array.isArray(state.bluebirdHistory) && state.bluebirdHistory.length > 0) {
    try {
      safeLocalStorage.setItem('secret_messages', JSON.stringify(state.bluebirdHistory));
    } catch (_) {}
  }

  // 4b. Hydrate Universal Insight Favorites
  if (Array.isArray(state.favoriteInsightIds)) {
    try {
      safeLocalStorage.setItem('prism_universe_insight_favorites', JSON.stringify(state.favoriteInsightIds));
      window.dispatchEvent(new CustomEvent('universe-insight-favorites-updated', { detail: state.favoriteInsightIds }));
    } catch (_) {}
  }

  // 4c. Hydrate Re:Bible Verses across devices
  if (Array.isArray(state.rebibleVerses) && state.rebibleVerses.length > 0) {
    try {
      const currentRaw = safeLocalStorage.getItem('prism_rebible_verses_v2');
      const current = currentRaw ? JSON.parse(currentRaw) : [];
      const verseMap = new Map<string, any>();
      current.forEach((v: any) => { if (v?.id) verseMap.set(v.id, v); });
      state.rebibleVerses.forEach((v: any) => { if (v?.id) verseMap.set(v.id, v); });
      const mergedVerses = Array.from(verseMap.values()).sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime());
      safeLocalStorage.setItem('prism_rebible_verses_v2', JSON.stringify(mergedVerses));
      window.dispatchEvent(new CustomEvent('rebible-verses-updated', { detail: mergedVerses }));
    } catch (_) {}
  }

  // 4d. Hydrate Unified Chat History across devices (PC <-> Mobile)
  if (Array.isArray(state.chatHistory) && state.chatHistory.length > 0) {
    try {
      const currentMsgs = loadSavedUnifiedMessages();
      const mergedMsgs = mergeUnifiedMessages(currentMsgs, state.chatHistory);
      saveUnifiedMessagesSafely(mergedMsgs);
      safeLocalStorage.setItem(STORAGE_KEYS.PRIMARY_V3, JSON.stringify(mergedMsgs));
      safeLocalStorage.setItem('prism_unified_chat_history', JSON.stringify(mergedMsgs));
      window.dispatchEvent(new CustomEvent('prism:chat_synced', { detail: mergedMsgs }));
    } catch (_) {}
  }

  // 5. Dispatch Custom Events across the whole app to instantly re-render UI
  try {
    window.dispatchEvent(new CustomEvent('prism:daily_oracle_updated', { detail: state.todayOracles }));
    window.dispatchEvent(new CustomEvent('prism:feature_updated', { detail: state }));
    window.dispatchEvent(new CustomEvent('prism:profile_updated', { detail: state.userProfile }));
  } catch (_) {}
}

export function mergeSharedState(
  local: SharedState,
  remote: SharedState,
  localUpdatedAt = getSharedStateUpdatedAt(local),
  remoteUpdatedAt = getSharedStateUpdatedAt(remote),
): SharedState {
  const newerIsLocal = localUpdatedAt >= remoteUpdatedAt;
  const merged: SharedState = newerIsLocal
    ? { ...remote, ...local }
    : { ...local, ...remote };

  // 1. Lossless User Profile Merge
  merged.userProfile = mergeUserProfile(
    local.userProfile,
    remote.userProfile,
    getProfileUpdatedAt(local),
    getProfileUpdatedAt(remote),
  );

  merged.profileUpdatedAt = Math.max(
    getProfileUpdatedAt(local),
    getProfileUpdatedAt(remote),
    local.profileUpdatedAt || 0,
    remote.profileUpdatedAt || 0,
  );

  // 2. Merge Today Oracles across all dates
  const mergedTodayOracles: Record<string, Record<string, any>> = {
    ...(remote.todayOracles || {}),
    ...(local.todayOracles || {}),
  };
  const allDates = new Set([...Object.keys(remote.todayOracles || {}), ...Object.keys(local.todayOracles || {})]);
  allDates.forEach((d) => {
    mergedTodayOracles[d] = {
      ...((remote.todayOracles || {})[d] || {}),
      ...((local.todayOracles || {})[d] || {}),
    };
  });
  merged.todayOracles = mergedTodayOracles;

  // 3. Merge Latest Daily Oracles
  merged.latestDailyOracles = {
    ...(remote.latestDailyOracles || {}),
    ...(local.latestDailyOracles || {}),
  };

  // 3b. Merge Daily Secrets (Orange) with timestamp-aware conflict resolution
  const mergedDailySecrets: Record<string, any> = { ...(remote.dailySecrets || {}) };
  if (local.dailySecrets) {
    Object.entries(local.dailySecrets).forEach(([dateKey, localSecret]) => {
      const remoteSecret = mergedDailySecrets[dateKey];
      if (!remoteSecret) {
        mergedDailySecrets[dateKey] = localSecret;
      } else if (!localSecret) {
        // keep remote
      } else {
        const localTs = Number(localSecret?.updatedAt || localSecret?.timestamp || 0);
        const remoteTs = Number(remoteSecret?.updatedAt || remoteSecret?.timestamp || 0);
        if (localTs > 0 || remoteTs > 0) {
          mergedDailySecrets[dateKey] = localTs >= remoteTs ? localSecret : remoteSecret;
        } else {
          mergedDailySecrets[dateKey] = {
            ...remoteSecret,
            ...localSecret,
          };
        }
      }
    });
  }
  merged.dailySecrets = mergedDailySecrets;

  // 3c. Merge Hoponopono Daily Cleansings (Bluebird)
  const mergedHoponoponoDaily: Record<string, any> = { ...(remote.hoponoponoDaily || {}) };
  if (local.hoponoponoDaily) {
    Object.entries(local.hoponoponoDaily).forEach(([dateKey, localHopo]) => {
      const remoteHopo = mergedHoponoponoDaily[dateKey];
      if (localHopo === null) {
        delete mergedHoponoponoDaily[dateKey];
      } else if (!remoteHopo) {
        mergedHoponoponoDaily[dateKey] = localHopo;
      } else {
        const localTs = Number(localHopo?.timestamp || 0);
        const remoteTs = Number(remoteHopo?.timestamp || 0);
        mergedHoponoponoDaily[dateKey] = localTs >= remoteTs ? localHopo : remoteHopo;
      }
    });
  }
  merged.hoponoponoDaily = mergedHoponoponoDaily;

  // 3d. Merge Daily Arts (Muse)
  const mergedDailyArts: Record<string, any> = { ...(remote.dailyArts || {}) };
  if (local.dailyArts) {
    Object.entries(local.dailyArts).forEach(([dateKey, localArt]) => {
      const remoteArt = mergedDailyArts[dateKey];
      if (!remoteArt) {
        mergedDailyArts[dateKey] = localArt;
      } else {
        const localHasRec = !!(localArt?.recommendation?.title || localArt?.title);
        const remoteHasRec = !!(remoteArt?.recommendation?.title || remoteArt?.title);
        if (localHasRec && !remoteHasRec) {
          mergedDailyArts[dateKey] = localArt;
        } else if (localHasRec && remoteHasRec) {
          const localTs = localArt?.timestamp || 0;
          const remoteTs = remoteArt?.timestamp || 0;
          mergedDailyArts[dateKey] = localTs >= remoteTs ? localArt : remoteArt;
        }
      }
    });
  }
  merged.dailyArts = mergedDailyArts;

  // 3e. Merge Trinity Daily Lucky Data across devices
  const mergedTrinityLucky: Record<string, any> = { ...(remote.trinityDailyLucky || {}) };
  if (local.trinityDailyLucky) {
    Object.entries(local.trinityDailyLucky).forEach(([dateKey, localLucky]) => {
      const remoteLucky = mergedTrinityLucky[dateKey];
      if (!remoteLucky) {
        mergedTrinityLucky[dateKey] = localLucky;
      } else {
        const localHasData = !!localLucky?.luckyData;
        const remoteHasData = !!remoteLucky?.luckyData;
        if (localHasData && !remoteHasData) {
          mergedTrinityLucky[dateKey] = localLucky;
        } else if (localHasData && remoteHasData) {
          // Merge quests & boost union
          const mergedQuests = {
            ...(remoteLucky.completedQuests || {}),
            ...(localLucky.completedQuests || {}),
          };
          const mergedBoost = !!(remoteLucky.isBoosted || localLucky.isBoosted);
          const localTs = localLucky?.timestamp || 0;
          const remoteTs = remoteLucky?.timestamp || 0;
          const baseLuckyData = localTs >= remoteTs ? localLucky.luckyData : remoteLucky.luckyData;
          mergedTrinityLucky[dateKey] = {
            luckyData: baseLuckyData,
            completedQuests: mergedQuests,
            isBoosted: mergedBoost,
            timestamp: Math.max(localTs, remoteTs),
          };
        }
      }
    });
  }
  merged.trinityDailyLucky = mergedTrinityLucky;

  // 4. Merge Feature Activity History (newest first, deduped by ID, up to 100)
  const featMap = new Map<string, any>();
  (remote.featureHistory || []).forEach((item: any) => { if (item?.id) featMap.set(item.id, item); });
  (local.featureHistory || []).forEach((item: any) => { if (item?.id) featMap.set(item.id, item); });
  merged.featureHistory = Array.from(featMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 100);

  // 5. Merge Daily Sync Timestamps
  for (const key of DAILY_SYNC_KEYS) {
    const localValue = local[key];
    const remoteValue = remote[key];
    if (typeof localValue === 'number' || typeof remoteValue === 'number') {
      merged[key] = Math.max(localValue || 0, remoteValue || 0) as SharedState[typeof key];
    }
  }

  // 6. Merge History Keys
  for (const key of HISTORY_KEYS) {
    const localValue = local[key];
    const remoteValue = remote[key];
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      merged[key] = (localValue.length >= remoteValue.length ? localValue : remoteValue) as SharedState[typeof key];
    } else if (Array.isArray(localValue)) {
      merged[key] = localValue as SharedState[typeof key];
    } else if (Array.isArray(remoteValue)) {
      merged[key] = remoteValue as SharedState[typeof key];
    }
  }

  // 6b. Merge Universal Insight Favorite IDs
  const localFavs = Array.isArray(local.favoriteInsightIds) ? local.favoriteInsightIds : [];
  const remoteFavs = Array.isArray(remote.favoriteInsightIds) ? remote.favoriteInsightIds : [];
  const combinedFavs = Array.from(new Set([...localFavs, ...remoteFavs]));
  if (combinedFavs.length > 0) {
    merged.favoriteInsightIds = combinedFavs;
  }

  // 6c. Merge Re:Bible Verses (lossless union by ID, newest recordedAt/updatedAt first)
  const verseMap = new Map<string, any>();
  (remote.rebibleVerses || []).forEach((v: any) => { if (v?.id) verseMap.set(v.id, v); });
  (local.rebibleVerses || []).forEach((v: any) => {
    if (v?.id) {
      const existing = verseMap.get(v.id);
      if (!existing || (new Date(v.updatedAt || 0).getTime() >= new Date(existing.updatedAt || 0).getTime())) {
        verseMap.set(v.id, v);
      }
    }
  });
  if (verseMap.size > 0) {
    merged.rebibleVerses = Array.from(verseMap.values()).sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime());
  }

  // 6d. Merge Unified Chat History
  const chatMap = new Map<string, any>();
  (remote.chatHistory || []).forEach((m: any) => { if (m?.id) chatMap.set(m.id, m); });
  (local.chatHistory || []).forEach((m: any) => { if (m?.id) chatMap.set(m.id, m); });
  if (chatMap.size > 0) {
    merged.chatHistory = Array.from(chatMap.values()).sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
  }

  merged.clientAppVersions = {
    desktop: pickNewestVersion(local.clientAppVersions?.desktop, remote.clientAppVersions?.desktop),
    mobile: pickNewestVersion(local.clientAppVersions?.mobile, remote.clientAppVersions?.mobile),
    tablet: pickNewestVersion(local.clientAppVersions?.tablet, remote.clientAppVersions?.tablet),
  };
  merged.unifiedAppVersion = pickNewestVersion(
    local.unifiedAppVersion,
    remote.unifiedAppVersion,
    merged.clientAppVersions.desktop,
    merged.clientAppVersions.mobile,
    merged.clientAppVersions.tablet,
  );
  merged.lastAppSyncAt = Math.max(local.lastAppSyncAt || 0, remote.lastAppSyncAt || 0) || undefined;
  merged.clientUpdatedAt = Math.max(localUpdatedAt, remoteUpdatedAt, Date.now());
  return merged;
}

export function loadSharedStateFromLocal(uid?: string | null): SharedState | null {
  try {
    const key = uid ? sharedStateLocalKey(uid) : GUEST_STATE_KEY;
    const raw = safeLocalStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SharedState) : null;
  } catch {
    return null;
  }
}

export function saveSharedStateToLocal(uid: string | null | undefined, state: SharedState) {
  try {
    const key = uid ? sharedStateLocalKey(uid) : GUEST_STATE_KEY;
    const payload: SharedState = {
      ...state,
      clientUpdatedAt: Date.now(),
    };
    safeLocalStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function cleanFirestoreData<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'object') return input;
  if (input instanceof Date) return input;
  // Preserve Firestore Timestamp and FieldValue (such as serverTimestamp)
  if (
    'toMillis' in (input as any) ||
    '_methodName' in (input as any) ||
    (input as any).constructor?.name === 'FieldValue' ||
    (input as any).constructor?.name === 'Timestamp'
  ) {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => cleanFirestoreData(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  const res: Record<string, any> = {};
  for (const [key, val] of Object.entries(input as Record<string, any>)) {
    if (val !== undefined && typeof val !== 'function') {
      res[key] = cleanFirestoreData(val);
    }
  }
  return res as T;
}

const FIRESTORE_TIMEOUT_MS = 4500;

function promiseWithTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms)),
  ]);
}

export async function loadSharedStateFromFirestore(uid: string): Promise<{
  state: SharedState;
  updatedAt: number;
} | null> {
  if (!uid || uid === 'developer-bypass-uid') {
    return null;
  }
  try {
    const fetchPromise = getDoc(doc(db, 'sharedState', uid)).then((snap) => {
      if (!snap.exists()) return null;
      const state = snap.data() as SharedState;
      return {
        state,
        updatedAt: (state.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.()
          || getSharedStateUpdatedAt(state),
      };
    });
    return await promiseWithTimeout(fetchPromise, FIRESTORE_TIMEOUT_MS, null);
  } catch (error) {
    console.warn('[SharedStateSync] Firestore load fallback:', error);
    return null;
  }
}

export async function loadSharedStateFromFirestoreServer(uid: string): Promise<{
  state: SharedState;
  updatedAt: number;
} | null> {
  if (!uid || uid === 'developer-bypass-uid') {
    return null;
  }
  try {
    const fetchPromise = promiseWithTimeout(
      getDocFromServer(doc(db, 'sharedState', uid)).then((snap) => {
        if (!snap.exists()) return null;
        const state = snap.data() as SharedState;
        return {
          state,
          updatedAt: (state.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.()
            || getSharedStateUpdatedAt(state),
        };
      }),
      3500,
      null
    );
    const result = await fetchPromise;
    if (result) return result;
    return await loadSharedStateFromFirestore(uid);
  } catch (error) {
    return loadSharedStateFromFirestore(uid);
  }
}

export async function saveSharedStateToFirestore(uid: string, state: SharedState): Promise<void> {
  // Push to Server Vault in background
  if (uid) {
    void pushToServerVault(uid, state).catch(() => {});
  }
  if (!uid || uid === 'developer-bypass-uid') {
    return;
  }
  try {
    const { clientUpdatedAt, updatedAt, ...rest } = state;
    const cleanPayload = cleanFirestoreData({
      ...rest,
      uid,
      updatedAt: serverTimestamp(),
    });
    const savePromise = setDoc(doc(db, 'sharedState', uid), cleanPayload, { merge: true });
    await promiseWithTimeout(savePromise, 4000, undefined);
  } catch (err: any) {
    console.warn('[SharedStateSync] Firestore save notice (cached locally):', err?.message || err);
  }
}

export type SharedStateSyncResult = {
  success: boolean;
  state: SharedState;
  error?: string;
  hadRemote: boolean;
};

export async function syncSharedStateWithCloud(
  uid: string,
  currentState?: SharedState | null,
): Promise<SharedStateSyncResult> {
  // 1. Gather all local activities, vaults, and oracles before syncing
  const localActivities = collectAllLocalActivities(uid);
  const baseLocal = loadSharedStateFromLocal(uid) || currentState || {};
  const local: SharedState = {
    ...baseLocal,
    ...localActivities,
    userProfile: mergeUserProfile(baseLocal.userProfile, localActivities.userProfile),
    todayOracles: {
      ...(baseLocal.todayOracles || {}),
      ...(localActivities.todayOracles || {}),
    },
    latestDailyOracles: {
      ...(baseLocal.latestDailyOracles || {}),
      ...(localActivities.latestDailyOracles || {}),
    },
  };
  try {
    const localUpdatedAt = getSharedStateUpdatedAt(local);
    const subColls = [
      { key: 'trinity', coll: 'trinity_history' },
      { key: 'orange', coll: 'orange_history' },
      { key: 'muse', coll: 'muse_history' },
      { key: 'bluebird', coll: 'bluebird_history' },
      { key: 'heal', coll: 'heal_history' },
    ];

    const results = await Promise.allSettled([
      loadSharedStateFromFirestoreServer(uid),
      promiseWithTimeout(getDoc(doc(db, 'userProfiles', uid)), 3500, null).catch(() => null),
      pullFromServerVault(uid).catch(() => null),
      ...subColls.map(({ key, coll }) =>
        promiseWithTimeout(
          getDocs(query(collection(db, coll, uid, 'entries'), orderBy('createdAt', 'desc'), limit(15))),
          3500,
          null
        )
          .then((snap: any) => ({
            key,
            entries: snap && snap.docs ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [],
          }))
          .catch(() => ({ key, entries: [] }))
      ),
    ]);

    const remoteRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const userProfileRes = results[1].status === 'fulfilled' ? results[1].value : null;
    const serverVaultRes = results[2].status === 'fulfilled' ? results[2].value : null;
    const subCollDocs = results.slice(3).map((r) => (r.status === 'fulfilled' ? r.value : { key: '', entries: [] }));

    let remoteState = remoteRes?.state;
    if (serverVaultRes) {
      remoteState = remoteState ? mergeSharedState(remoteState, serverVaultRes) : serverVaultRes;
    }
    if (userProfileRes && userProfileRes.exists && userProfileRes.exists()) {
      const pData = userProfileRes.data() as UserProfile;
      if (remoteState) {
        remoteState.userProfile = mergeUserProfile(remoteState.userProfile, pData);
      }
    }

    const merged = remoteState
      ? mergeSharedState(local, remoteState, localUpdatedAt, remoteRes?.updatedAt || 0)
      : { ...local, clientUpdatedAt: Date.now() };

    // Inject entries from Firestore sub-collections into merged state
    subCollDocs.forEach((res) => {
      if (res && res.entries && res.entries.length > 0) {
        const { key, entries } = res;
        if (key === 'trinity') merged.trinityHistory = entries;
        else if (key === 'orange') merged.orangeHistory = entries;
        else if (key === 'muse') merged.museHistory = entries;
        else if (key === 'bluebird') merged.bluebirdHistory = entries;
        else if (key === 'heal') merged.healHistory = entries;

        entries.forEach((e: any) => {
          if (e && !merged.featureHistory?.some((f: any) => f.id === e.id)) {
            merged.featureHistory = merged.featureHistory || [];
            merged.featureHistory.unshift({
              id: e.id || `feat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              app: key,
              appName: key.toUpperCase(),
              featureName: e.title || e.type || '활동 기록',
              summary: e.content || e.summary || e.diagnosis || '',
              details: e,
              timestamp: e.createdAt?.toMillis?.() || e.timestamp || Date.now(),
              dateKey: getTodayDateKey(),
            });
          }
        });
      }
    });

    // Save locally
    saveSharedStateToLocal(uid, merged);

    // Save to Firestore sharedState & userProfiles in parallel safely
    try {
      const cleanProfile = merged.userProfile ? cleanFirestoreData(merged.userProfile) : null;
      await Promise.allSettled([
        saveSharedStateToFirestore(uid, merged),
        cleanProfile ? setDoc(doc(db, 'userProfiles', uid), cleanProfile, { merge: true }) : Promise.resolve(),
        pushToServerVault(uid, merged),
      ]);
    } catch (e) {
      console.warn('[SharedStateSync] Background save warning:', e);
    }

    // Unpack and hydrate all local storage slots on this device
    unpackAndHydrateLocalStorage(uid, merged);

    return {
      success: true,
      state: merged,
      hadRemote: !!remoteRes || !!serverVaultRes,
    };
  } catch (error) {
    console.warn('[SharedStateSync] Cloud sync fallback to local merge:', error);
    saveSharedStateToLocal(uid, local);
    unpackAndHydrateLocalStorage(uid, local);
    return {
      success: true,
      state: local,
      hadRemote: false,
    };
  }
}

export function migrateGuestProfileIntoAccount(uid: string): SharedState | null {
  const accountLocal = loadSharedStateFromLocal(uid);
  const guestLocal = loadSharedStateFromLocal(null);
  const guestActivities = collectAllLocalActivities(null);

  const guestCombined = {
    ...(guestLocal || {}),
    ...guestActivities,
    userProfile: mergeUserProfile(guestLocal?.userProfile, guestActivities.userProfile),
  };

  if (!guestCombined.userProfile && !guestCombined.featureHistory && !guestCombined.todayOracles) {
    return accountLocal;
  }

  const merged = mergeSharedState(
    accountLocal || {},
    { ...guestCombined, profileUpdatedAt: guestCombined.profileUpdatedAt || guestCombined.clientUpdatedAt },
    getProfileUpdatedAt(accountLocal),
    getProfileUpdatedAt(guestCombined),
  );

  saveSharedStateToLocal(uid, merged);
  unpackAndHydrateLocalStorage(uid, merged);
  return merged;
}