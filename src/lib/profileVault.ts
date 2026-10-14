/**
 * =========================================================================
 * PRISM & LUCY PRO - Unbreakable Profile Vault Engine
 * =========================================================================
 * 10중 다중 백업 및 무손실 병합 알고리즘을 통해, 브라우저 업데이트,
 * PWA 서비스워커 갱신, 캐시 새로고침이 발생하더라도 사용자의 소중한
 * 프로필(이름, 닉네임, 생년월일, 성별, 사주·운명, 심리, 예술 취향 등)이
 * 절대 유실되거나 초기화되지 않도록 영구 보존합니다.
 */

import { safeLocalStorage, safeSessionStorage } from '../utils/safeStorage';
import { type UserProfile, mergeUserProfiles } from './sharedState';

export const PROFILE_VAULT_KEYS = [
  'prism_user_profile',
  'prism_user_profile_vault',
  'prism_user_profile_backup_v1',
  'prism_user_profile_backup_v2',
  'prism_user_profile_secure',
  'prism_user_profile_cloud_cache',
  'lucy_user_profile_v1',
  'lucy_user_profile_permanent',
  'prism_soul_profile_master',
] as const;

export const DEFAULT_USER_PROFILE: UserProfile = {
  basic: {
    name: '박주형',
    nickname: '박주형',
    birthdate: '1994-01-24',
    birthtime: '13:20',
    gender: 'male',
    birthCity: '서울',
    lunarSolar: 'solar',
  },
  fate: {
    fateInterests: ['점성학', '사주', '타로', '별자리', '차트분석'],
    lifeGoal: '점성학적 본원과 우주적 질서를 통찰하여 나다운 온전한 잠재력 발현하기',
    currentWorry: '',
  },
  psych: {
    mbti: 'INTJ',
    counselingStyle: 'mixed',
    currentMood: '명료하고 호기심 넘치는 우주적 탐구심',
    personalityKeywords: ['독창성', '기민한 지성', '본질 통찰', '심미안', '자유로움'],
    aiPreference: '점성학적 천궁도와 본원 에너지를 깊이 있게 반영한 통찰력 있고 진솔한 대화',
  },
  music: {
    favoriteGenres: ['재즈', '클래식', '뉴에이지', '인디'],
    instruments: ['피아노', '작곡'],
    creativeGoal: '영혼과 우주적 주파수가 공명하는 예술적 창작',
    favoriteArtists: '쇼팽, 바흐, 사카모토 류이치',
  },
  art: {
    favoriteArtStyle: ['초현실주의', '인상주의', '미디어아트'],
    favoriteColors: ['골드 & 퍼플', '어스 톤', '차가운 톤'],
    favoritePoets: '라이너 마리아 릴케, 윤동주',
  },
  astrology: {
    chartType: 'Day Chart',
    chartTypeKo: '☀ 낮 차트 (Day Chart)',
    houseSystem: 'Whole Sign',
    sunSign: '물병자리',
    sunDegree: "3°57'",
    sunHouse: '9H',
    sunDignity: '디트리먼트 | 헤이즈',
    moonSign: '쌍둥이자리',
    moonDegree: "22°11'",
    moonHouse: '1H',
    ascendant: '쌍둥이자리 4°27\' (64.5°)',
    descendant: '사수자리 4°27\' (244.5°)',
    midheaven: '물병자리 12°49\' (312.8°)',
    ic: '사자자리 12°49\' (132.8°)',
    hourRuler: '수성',
    dayRuler: '달',
    planets: {
      saturn: { name: '토성', sign: '물병자리', degree: "29°26'", house: '9H', dignity: '도머사일 | 헤이즈' },
      jupiter: { name: '목성', sign: '전갈자리', degree: "12°45'", house: '6H' },
      mars: { name: '화성', sign: '염소자리', degree: "26°54'", house: '8H', dignity: '익절테이션 | 컴버스트' },
      sun: { name: '태양', sign: '물병자리', degree: "3°57'", house: '9H', dignity: '디트리먼트 | 헤이즈' },
      venus: { name: '금성', sign: '물병자리', degree: "5°38'", house: '9H', dignity: '컴버스트 | Ex 컨디션' },
      mercury: { name: '수성', sign: '물병자리', degree: "17°11'", house: '9H', dignity: '파시스 | Ex 컨디션' },
      moon: { name: '달', sign: '쌍둥이자리', degree: "22°11'", house: '1H' },
      northNode: { name: '북교점', sign: '전갈자리', degree: "29°52' R", house: '6H' },
      southNode: { name: '남교점', sign: '황소자리', degree: "29°52' R", house: '12H' },
      fortune: { name: '포르투나', sign: '천칭자리', degree: "22°41'", house: '5H' },
      spirit: { name: '스피릿', sign: '염소자리', degree: "16°13'", house: '8H' },
      syzygy: { name: '시저지', sign: '염소자리', degree: "21°30'", house: '8H' },
      uranus: { name: '천왕성', sign: '염소자리', degree: "22°56'", house: '8H' },
      neptune: { name: '해왕성', sign: '염소자리', degree: "21°20'", house: '8H' },
      pluto: { name: '명왕성', sign: '전갈자리', degree: "27°41'", house: '6H', dignity: '도머사일' },
    },
    housePlacements: {
      '1H': ['달 (쌍둥이 22°11\')'],
      '5H': ['포르투나 (천칭 22°41\')'],
      '6H': ['목성 (전갈 12°45\')', '북교점 (전갈 29°52\' R)', '명왕성 (전갈 27°41\')'],
      '8H': ['화성 (염소 26°54\')', '스피릿 (염소 16°13\')', '시저지 (염소 21°30\')', '천왕성 (염소 22°56\')', '해왕성 (염소 21°20\')'],
      '9H': ['토성 (물병 29°26\')', '태양 (물병 3°57\')', '금성 (물병 5°38\')', '수성 (물병 17°11\')'],
      '12H': ['남교점 (황소 29°52\' R)'],
    },
    aspects: [
      '태양 ☌ 금성 · 합 · 오브 1°42′ · 영향: 상호',
      '목성 □ 수성 · 스퀘어 · 오브 4°26′ · 목성=Sinister(좌), 수성=Dexter(우) · 영향: 상호',
      '수성 △ 달 · 트라인 · 오브 5°00′ · 수성=Sinister(좌), 달=Dexter(우) · 영향: 상호',
      '목성 □ 금성 · 스퀘어 · 오브 7°07′ · 목성=Sinister(좌), 금성=Dexter(우) · 영향: 목성→금성',
      '토성 △ 달 · 트라인 · 오브 7°16′ · 토성=Sinister(좌), 달=Dexter(우) · 영향: 상호',
      '목성 □ 태양 · 스퀘어 · 오브 8°49′ · 목성=Sinister(좌), 태양=Dexter(우) · 영향: 상호',
      '태양 ☌ 수성 · 합 · 오브 13°15′ · 영향: 태양→수성',
    ],
    moonPhases: {
      separating: '수성 트라인 (오브 4.99° · 0.5일 전)',
      applying: '토성 트라인 (오브 7.26° · 0.6일 후)',
    },
    rawChartText: `[박주형 님 네이탈 차트 - 1994.01.24 13:20:09 Seoul / Whole Sign / 낮 차트]
- 태양: 물병자리 3°57' | 9H | 디트리먼트 | 헤이즈
- 달: 쌍둥이자리 22°11' | 1H
- 상승궁(ASC): 쌍둥이자리 4°27' (64.5°) | 1H
- DSC: 사수자리 4°27' (244.5°) | 7H
- MC: 물병자리 12°49' (312.8°) | 9H
- IC: 사자자리 12°49' (132.8°) | 3H
- 수성: 물병자리 17°11' | 9H | 파시스 | Ex 컨디션
- 금성: 물병자리 5°38' | 9H | 컴버스트 | Ex 컨디션
- 화성: 염소자리 26°54' | 8H | 익절테이션 | 컴버스트
- 목성: 전갈자리 12°45' | 6H
- 토성: 물병자리 29°26' | 9H | 도머사일 | 헤이즈
- 북교점: 전갈자리 29°52' R (6H) / 남교점: 황소자리 29°52' R (12H)
- 포르투나: 천칭자리 22°41' (5H)
- 스피릿: 염소자리 16°13' (8H) / 시저지: 염소자리 21°30' (8H)
- 천왕성: 염소자리 22°56' (8H) / 해왕성: 염소자리 21°20' (8H)
- 명왕성: 전갈자리 27°41' (6H | 도머사일)
- 시주: 수성 / 일주: 달`,
  },
};

/**
 * 모든 로컬 저장소 키에서 프로필을 탐색하고 무손실 병합하여 최상의 복원본 반환
 */
export function loadProfileFromAllVaults(): UserProfile | undefined {
  let merged: UserProfile | undefined = undefined;

  for (const key of PROFILE_VAULT_KEYS) {
    try {
      const raw = safeLocalStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile;
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          merged = mergeUserProfiles(merged, parsed);
        }
      }
    } catch (_) {}
  }

  // SessionStorage 금고도 추가 확인
  try {
    const sessionRaw = safeSessionStorage.getItem('prism_user_profile_session_vault');
    if (sessionRaw) {
      const sessionParsed = JSON.parse(sessionRaw) as UserProfile;
      if (sessionParsed && typeof sessionParsed === 'object') {
        merged = mergeUserProfiles(merged, sessionParsed);
      }
    }
  } catch (_) {}

  // DEFAULT_USER_PROFILE과 무손실 병합 (사용자의 기존 커스텀 편집값 보존 + 기본/누락 필드 완벽 채움)
  const finalProfile = mergeUserProfiles(DEFAULT_USER_PROFILE, merged, false);

  // 로컬 볼트에 아직 정식 시딩되지 않았거나 업데이트가 필요한 경우 자동 1회 동기화
  if (typeof window !== 'undefined') {
    try {
      const seedKey = 'prism_user_profile_seeded_1994_v2';
      if (safeLocalStorage.getItem(seedKey) !== 'true') {
        saveProfileToAllVaults(finalProfile);
        safeLocalStorage.setItem(seedKey, 'true');
      }
    } catch (_) {}
  }

  return finalProfile;
}

/**
 * 프로필을 모든 다중 금고에 무손실 안전하게 저장
 */
export function saveProfileToAllVaults(profile: UserProfile | undefined): void {
  if (!profile || typeof profile !== 'object' || Object.keys(profile).length === 0) return;

  try {
    const existing = loadProfileFromAllVaults();
    // 기존에 있던 비어있지 않은 데이터를 빈 값으로 덮어쓰지 않도록 무손실 병합 (신규 저장 프로필 우선)
    const finalMerged = mergeUserProfiles(existing, profile, true);
    if (!finalMerged || Object.keys(finalMerged).length === 0) return;

    const serialized = JSON.stringify(finalMerged);

    // 1. 모든 LocalStorage 금고에 저장
    for (const key of PROFILE_VAULT_KEYS) {
      try {
        safeLocalStorage.setItem(key, serialized);
      } catch (_) {}
    }

    // 2. SessionStorage 금고에 저장
    try {
      safeSessionStorage.setItem('prism_user_profile_session_vault', serialized);
    } catch (_) {}
  } catch (e) {
    console.warn('[ProfileVault] Save error:', e);
  }
}
