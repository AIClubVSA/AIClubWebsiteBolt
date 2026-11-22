/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** AI Summit: the Apps Script web-app URL that returns breakout seat counts (summit/README.md). */
  readonly VITE_BREAKOUTS_ENDPOINT?: string;
  /** AI Summit: the Google Form students use to rank breakouts. */
  readonly VITE_BREAKOUT_FORM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
