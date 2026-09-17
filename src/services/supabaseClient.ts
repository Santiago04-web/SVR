import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'svr_finanzas_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  syncPin: string; // Used as the unique vault key so multiple devices share the exact same financial state
  isEnabled: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return { url: '', anonKey: '', syncPin: 'svr-2026', isEnabled: false };
  }

  const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  // Fallback to environment variables if provided at build time
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    syncPin: 'svr-2026',
    isEnabled: Boolean(envUrl && envKey),
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  }
}

let cachedClient: SupabaseClient | null = null;
let currentConfigHash = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey || !config.isEnabled) {
    return null;
  }

  const hash = `${config.url}_${config.anonKey}`;
  if (cachedClient && currentConfigHash === hash) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
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
