import axios from 'axios';

// Istanza per Auth Service (8082)
export const authApi = axios.create({
    baseURL: import.meta.env.VITE_AUTH_API_URL,
});

// Istanza per Attendance Service (8081)
export const attendanceApi = axios.create({
    baseURL: import.meta.env.VITE_ATTENDANCE_API_URL,
});

// INTERCEPTOR: Inserisce automaticamente il token JWT in ogni chiamata alle presenze
attendanceApi.interceptors.request.use(async (config) => {
    // Recuperiamo la sessione persistente di Supabase
    const session = JSON.parse(localStorage.getItem('sb-wrmtllklfwohgbvkigio-auth-token') || '{}');
    const token = session?.access_token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});