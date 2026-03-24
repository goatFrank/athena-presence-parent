import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { attendanceApi } from '../api/clients';

// ── Types ──
export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// ── Hook ──
export function useToast(): ToastContextType {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}

// ── Styling per type ──
const typeConfig: Record<ToastType, { icon: string; iconColor: string; border: string; progress: string }> = {
    error:   { icon: 'error_outline',        iconColor: 'text-red-500',   border: 'border-red-200 dark:border-red-800',     progress: 'bg-red-500' },
    success: { icon: 'check_circle_outline',  iconColor: 'text-green-500', border: 'border-green-200 dark:border-green-800', progress: 'bg-green-500' },
    warning: { icon: 'warning_amber',         iconColor: 'text-amber-500', border: 'border-amber-200 dark:border-amber-800', progress: 'bg-amber-500' },
    info:    { icon: 'info',                  iconColor: 'text-blue-500',  border: 'border-blue-200 dark:border-blue-800',   progress: 'bg-blue-500' },
};

// ── Single toast item ──
const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const cfg = typeConfig[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    };

    return (
        <div
            className={`relative flex items-start gap-3 w-80 px-4 py-3.5 rounded-2xl shadow-2xl border bg-white dark:bg-slate-800 ${cfg.border} text-slate-800 dark:text-slate-100 backdrop-blur-xl transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
            style={{ animation: isExiting ? undefined : 'toast-slide-in 0.3s ease-out' }}
        >
            <span className={`material-icons text-xl mt-0.5 shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>
            <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 mt-0.5">
                <span className="material-icons text-[16px]">close</span>
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                <div className={`h-full ${cfg.progress} rounded-full`} style={{ animation: 'toast-progress 5s linear forwards' }} />
            </div>
        </div>
    );
};

// ── Global keyframes (injected once) ──
const ToastStyles = () => (
    <style>{`
        @keyframes toast-slide-in {
            from { opacity: 0; transform: translateX(2rem); }
            to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toast-progress {
            from { width: 100%; }
            to   { width: 0%; }
        }
    `}</style>
);

// ── Provider ──
let toastCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'error') => {
        const id = ++toastCounter;
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // ── Axios interceptor: auto-show error toasts for ALL API errors ──
    useEffect(() => {
        const interceptorId = attendanceApi.interceptors.response.use(
            response => response,
            error => {
                const msg =
                    error.response?.data?.message ||
                    error.message ||
                    'Si è verificato un errore imprevisto.';

                // Don't toast on 401 (handled by auth flow)
                if (error.response?.status !== 401) {
                    addToast(msg, 'error');
                }

                return Promise.reject(error);
            }
        );

        return () => {
            attendanceApi.interceptors.response.eject(interceptorId);
        };
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            <ToastStyles />
            {children}
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};

export default ToastProvider;
