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
const typeConfig: Record<ToastType, { icon: string; iconColor: string; bg: string; border: string; progress: string }> = {
    error:   { icon: 'error_outline',        iconColor: 'text-red-500',   bg: 'bg-red-50/50 dark:bg-red-900/10',     border: 'border-red-100 dark:border-red-900/30',     progress: 'bg-red-500' },
    success: { icon: 'check_circle_outline',  iconColor: 'text-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-900/30', progress: 'bg-green-500' },
    warning: { icon: 'warning_amber',         iconColor: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-900/30', progress: 'bg-amber-500' },
    info:    { icon: 'info',                  iconColor: 'text-blue-500',  bg: 'bg-blue-50/50 dark:bg-blue-900/10',   border: 'border-blue-100 dark:border-blue-900/30',   progress: 'bg-blue-500' },
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
            className={`relative flex items-center gap-4 w-85 px-5 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border ${cfg.bg} ${cfg.border} text-slate-800 dark:text-slate-100 backdrop-blur-2xl transition-all duration-300 ${isExiting ? 'opacity-0 scale-95 translate-x-8' : 'opacity-100 scale-100 translate-x-0'}`}
            style={{ animation: isExiting ? undefined : 'toast-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
            <div className={`p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm shrink-0 flex items-center justify-center`}>
                <span className={`material-icons text-xl ${cfg.iconColor}`}>{cfg.icon}</span>
            </div>
            <p className="text-sm font-semibold flex-1 leading-relaxed">{toast.message}</p>
            <button onClick={handleDismiss} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg shrink-0">
                <span className="material-icons text-[18px]">close</span>
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-1.5 left-5 right-5 h-1 rounded-full overflow-hidden bg-slate-200/30 dark:bg-slate-700/30">
                <div className={`h-full ${cfg.progress} rounded-full opacity-60`} style={{ animation: 'toast-progress 5s linear forwards' }} />
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

    const contextValue = React.useMemo(() => ({ addToast }), [addToast]);

    return (
        <ToastContext.Provider value={contextValue}>
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
