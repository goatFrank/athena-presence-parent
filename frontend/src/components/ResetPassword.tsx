import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';

const ResetPassword: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we are in recovery mode (user clicked the link in the email)
        // Supabase automatically handles the session if detectSessionInUrl is true
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setIsRecoveryMode(true);
            }
        };

        checkSession();

        // Listen for auth state changes to detect when recovery link is clicked
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecoveryMode(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${globalThis.location.origin}/reset-password`,
            });

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({ type: 'success', text: t('reset_email_sent', 'Abbiamo inviato un link di ripristino alla tua email.') });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: t('passwords_dont_match', 'Le password non coincidono') });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({ type: 'success', text: t('password_updated_success', 'Password aggiornata con successo! Verrai reindirizzato al login.') });
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="fixed top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
            <div className="fixed bottom-10 right-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-white rounded-[32px] shadow-deep border border-slate-100 p-8 md:p-12 relative z-10 transition-all duration-500">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px]">shield</span>
                    </div>
                    <span className="text-2xl font-brand font-bold text-slate-800 tracking-tight">Athena</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {isRecoveryMode ? t('set_new_password', 'Nuova Password') : t('reset_your_password', 'Ripristina Password')}
                </h1>
                <p className="text-slate-500 mb-8 text-sm">
                    {isRecoveryMode 
                        ? t('enter_new_password_desc', 'Inserisci la tua nuova password sicura per accedere.')
                        : t('reset_password_desc', 'Inserisci la tua email e ti invieremo un link per creare una nuova password.')}
                </p>

                {message && (
                    <div className={`mb-6 p-4 rounded-2xl border text-sm flex items-start gap-3 ${
                        message.type === 'success' 
                            ? 'bg-green-50 border-green-100 text-green-700' 
                            : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                        <span className="material-icons text-lg">
                            {message.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <span>{message.text}</span>
                    </div>
                )}

                {isRecoveryMode ? (
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="password">
                                {t('new_password', 'Nuova Password')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">lock_outline</span>
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3.5 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="confirmPassword">
                                {t('confirm_password', 'Conferma Password')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">lock_outline</span>
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3.5 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white transition-all duration-200 transform ${loading
                                ? 'bg-indigo-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:-translate-y-0.5 shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                        >
                            {loading ? (
                                <><span className="material-icons animate-spin mr-2 text-sm">autorenew</span>{t('updating', 'Aggiornamento...')}</>
                            ) : (
                                t('update_password', 'Aggiorna Password')
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRequestReset} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="email">
                                {t('email_address')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">mail_outline</span>
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3.5 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                    id="email"
                                    type="email"
                                    placeholder="name@athena.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white transition-all duration-200 transform ${loading
                                ? 'bg-blue-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                        >
                            {loading ? (
                                <><span className="material-icons animate-spin mr-2 text-sm">autorenew</span>{t('sending', 'Invio in corso...')}</>
                            ) : (
                                t('send_reset_link', 'Invia link di ripristino')
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-10 text-center">
                    <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 group">
                        <span className="material-icons text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        {t('back_to_login', 'Torna al Login')}
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default ResetPassword;
