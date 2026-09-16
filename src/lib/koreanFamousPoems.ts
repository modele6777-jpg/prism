import {
  KOREAN_FAMOUS_POEMS,
  KOREAN_POEM_THEMES,
  type KoreanPoemItem,
  type KoreanPoemTheme,
} from "../../server/api-lib/koreanFamousPoems";

export {
  KOREAN_FAMOUS_POEMS,
  KOREAN_POEM_THEMES,
  type KoreanPoemItem,
  type KoreanPoemTheme,
};

/** Get a poem by its ID */
export function getKoreanPoemById(id: string): KoreanPoemItem | undefined {
  return KOREAN_FAMOUS_POEMS.find((p) => p.id === id);
}

/** Get random Korean poem with deterministic date or numeric seed */
export function getRandomKoreanPoem(seedOffset = 0): KoreanPoemItem {
  const index = Math.abs(seedOffset) % KOREAN_FAMOUS_POEMS.length;
  return KOREAN_FAMOUS_POEMS[index];
}

/** Filter poems by theme */
export function getKoreanPoemsByTheme(theme?: KoreanPoemTheme | "all"): KoreanPoemItem[] {
  if (!theme || theme === "all") return KOREAN_FAMOUS_POEMS;
  return KOREAN_FAMOUS_POEMS.filter((p) => p.theme === theme);
}

/** Search Korean poems by poet or title or excerpt keyword */
export function searchKoreanPoems(query: string, theme?: KoreanPoemTheme | "all"): KoreanPoemItem[] {
  const base = getKoreanPoemsByTheme(theme);
  const q = query.trim().toLowerCase();
  if (!q) return base;

  return base.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      (p.titleOriginal && p.titleOriginal.toLowerCase().includes(q)) ||
      p.poet.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.whyRecommended.toLowerCase().includes(q) ||
      p.themeLabel.toLowerCase().includes(q)
    );
  });
}
