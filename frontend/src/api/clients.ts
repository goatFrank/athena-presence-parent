import axios from 'axios';

import { supabase } from './supabase';

// Instance for Attendance Service
// In production, this will be /api/attendance (proxied by Nginx)
// In development, this will be proxied by Vite
export const attendanceApi = axios.create({
    baseURL: import.meta.env.VITE_ATTENDANCE_API_URL || '/api/attendance',
});

// INTERCEPTOR: Inserisce automaticamente il token JWT in ogni chiamata alle presenze
attendanceApi.interceptors.request.use(async (config) => {
    // Recuperiamo la sessione in modo sicuro tramite SDK Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});