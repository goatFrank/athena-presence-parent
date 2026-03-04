import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

/**
 * Custom storage adapter that supports "Remember me" functionality.
 * - When "Remember me" is ON  → session is stored in localStorage (persists across browser close)
 * - When "Remember me" is OFF → session is stored in sessionStorage (cleared on browser close)
 *
 * Reads from both storages so the session is always found regardless of where it was saved.
 */
const REMEMBER_ME_KEY = 'athena-remember-me';

const customStorage = {
    getItem: (key: string): string | null => {
        // Try localStorage first, then sessionStorage
        return localStorage.getItem(key) ?? sessionStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
        const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
        if (rememberMe) {
            localStorage.setItem(key, value);
            sessionStorage.removeItem(key); // Clean up the other storage
        } else {
            sessionStorage.setItem(key, value);
            localStorage.removeItem(key); // Clean up the other storage
        }
    },
    removeItem: (key: string): void => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

/**
 * Call this before sign-in to set the "Remember me" preference.
 * The custom storage adapter will use this flag to decide where to store the session.
 */
export const setRememberMe = (remember: boolean): void => {
    if (remember) {
        localStorage.removeItem(REMEMBER_ME_KEY); // default behavior = remember
    } else {
        localStorage.setItem(REMEMBER_ME_KEY, 'false');
    }
};
