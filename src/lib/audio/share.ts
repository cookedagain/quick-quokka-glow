import { DEFAULT_SETTINGS, RebassSettings } from "./types";

export function encodeSettings(s: RebassSettings): string {
  const json = JSON.stringify(s);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeSettings(str: string): RebassSettings | null {
  try {
    const json = decodeURIComponent(escape(atob(str)));
    const parsed = JSON.parse(json) as Partial<RebassSettings>;
    // Merge over defaults so missing/older keys stay valid.
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return null;
  }
}

export function buildShareUrl(s: RebassSettings): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#s=${encodeSettings(s)}`;
}

export function readSettingsFromUrl(): RebassSettings | null {
  const hash = window.location.hash;
  const match = hash.match(/#s=(.+)$/);
  if (!match) return null;
  return decodeSettings(match[1]);
}