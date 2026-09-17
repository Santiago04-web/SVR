import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'svr_finanzas_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  syncPin: string; // Used as the unique vault key so multiple devices share the exact same financial state
  isEnabled: boolean;
}

export function sanitizeSupabaseUrl(input: string): string {
  let trimmed = (input || '').trim();
  if (!trimmed) return 'https://xdexbunttiykmaykpoyr.supabase.co';
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    if (!trimmed.includes('.')) {
      trimmed = `https://${trimmed}.supabase.co`;
    } else {
      trimmed = `https://${trimmed}`;
    }
  }
  return trimmed;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const defaultUrl = 'https://xdexbunttiykmaykpoyr.supabase.co';
  const defaultAnonKey = 'sb_publishable_AoWQ1iCtVWRQ_FBf_EhKsg_I3IM5MzS';

  if (typeof window === 'undefined') {
    return { url: defaultUrl, anonKey: defaultAnonKey, syncPin: 'svr-2026', isEnabled: true };
  }

  const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      parsed.url = sanitizeSupabaseUrl(parsed.url || defaultUrl);
      if (!parsed.anonKey) parsed.anonKey = defaultAnonKey;
      if (parsed.isEnabled === undefined) parsed.isEnabled = true;
      return parsed;
    } catch {
      // fallback
    }
  }

  // Fallback to environment variables or hardcoded project defaults
  const envUrl = sanitizeSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL || defaultUrl);
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

  return {
    url: envUrl,
    anonKey: envKey,
    syncPin: 'svr-2026',
    isEnabled: true,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  if (typeof window !== 'undefined') {
    const sanitized = {
      ...config,
      url: sanitizeSupabaseUrl(config.url),
    };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(sanitized));
  }
}

let cachedClient: SupabaseClient | null = null;
let currentConfigHash = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  const sanitizedUrl = sanitizeSupabaseUrl(config.url);
  if (!sanitizedUrl || !config.anonKey || !config.isEnabled) {
    return null;
  }

  const hash = `${sanitizedUrl}_${config.anonKey}`;
  if (cachedClient && currentConfigHash === hash) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(sanitizedUrl, config.anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfigHash = hash;
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
}
