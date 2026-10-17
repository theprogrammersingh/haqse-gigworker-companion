/** Thresholds and tunables. Values are references, not legal figures (PRD §12). */

/** A day is flagged when payout per hour falls below this share of the platform median. */
export const ANOMALY_RATIO = 0.75
/** Prior days needed on the same platform before a median is trusted. */
export const MIN_PRIOR_DAYS = 3
/** Rolling window for medians, insights and AI context. */
export const LOOKBACK_DAYS = 14
/** Documents expiring within this many days raise an alert. */
export const EXPIRY_WINDOW_DAYS = 30
/** Local hour (inclusive) at which night shift starts. */
export const NIGHT_START_HOUR = 21
/** Local hour (exclusive) at which night shift ends. */
export const NIGHT_END_HOUR = 5
/** Hard cap on the JSON context sent to Gemini. */
export const CONTEXT_MAX_BYTES = 1536
/** AI response cache lifetime. */
export const AI_CACHE_TTL_MS = 24 * 60 * 60 * 1000
/** How long a fetched model list is reused. */
export const MODEL_LIST_TTL_MS = 24 * 60 * 60 * 1000
/** Longest edge of an image sent to Gemini. */
export const IMAGE_MAX_PX = 1024
/** JPEG quality for downscaled uploads. */
export const JPEG_QUALITY = 0.7
/** Base delay before the single retry on 429/5xx. */
export const RETRY_BASE_MS = 800
/** Undo window after deleting a record. */
export const UNDO_MS = 5000
/** Long-press duration that triggers SOS. */
export const SOS_HOLD_MS = 800
/** Maximum alert cards on Home. */
export const MAX_HOME_ALERTS = 3

/** Fallback net-per-hour floor (₹) when no user target or state reference exists. */
export const DEFAULT_MIN_HOURLY = 60
/**
 * Approximate unskilled minimum wage per hour (₹), derived from daily rates / 8.
 * Reference values only, verified Oct 2026; shown to users as "reference".
 */
export const STATE_MIN_HOURLY: Readonly<Record<string, number>> = {
  DL: 90,
  PB: 55,
  RJ: 36,
  KA: 60,
  MH: 55,
  HR: 55,
  UP: 50,
  TN: 55,
  WB: 50,
  TG: 55,
}

export const EMERGENCY_NUMBER = '112'
export const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey'
