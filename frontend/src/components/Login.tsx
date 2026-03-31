import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, setRememberMe as setRememberMePref } from '../api/supabase';
import { attendanceApi } from '../api/clients';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
    const [showServerWarning, setShowServerWarning] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                try {
                    const profileResponse = await attendanceApi.get('/api/v1/profiles/me');
                    const profileData = profileResponse.data.payload;
                    
                    if (profileData && profileData.tenantStatus === 'ACTIVE') {
                        navigate('/dashboard', { replace: true });
                    } else if (profileData) {
                        await supabase.auth.signOut();
                        if (profileData.tenantStatus === 'PENDING') {
                            setError(t('tenant_pending_approval'));
                        } else if (profileData.tenantStatus === 'REJECTED') {
                            setError(t('tenant_rejected_approval', 'Il tuo account aziendale è stato rifiutato.'));
                        }
                    }
                } catch (e: any) {
                    console.error('Error checking status for existing session:', e);
                    // If error fetching profile, stay on login page and consider signing out
                    await supabase.auth.signOut();
                }
            }
        };
        checkExistingSession();
    }, [navigate, t]);

    useEffect(() => {
        const hasShownWarning = sessionStorage.getItem('athena_server_warning_shown');
        if (!hasShownWarning) {
            setShowServerWarning(true);
            sessionStorage.setItem('athena_server_warning_shown', 'true');
        }
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            setRememberMePref(rememberMe);

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                if (signInError.message === 'Invalid login credentials') {
                    setError(t('login_invalid_credentials'));
                } else {
                    setError(signInError.message);
                }
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    try {
                        const profileResponse = await attendanceApi.get('/api/v1/profiles/me');
                        const profileData = profileResponse.data.payload;
                        const { tenantStatus, roleId } = profileData;
                        
                        // Access Logic:
                        // 1. Superadmin (1) -> Always allow
                        // 2. Active Tenant -> Always allow
                        // 3. Pending Tenant -> Allow only if role is Manager (3) or Employee (4)
                        
                        const isSuperAdmin = roleId === 1;
                        const isActive = tenantStatus === 'ACTIVE';
                        const isInvitedUser = roleId === 3 || roleId === 4;
                        const isPending = tenantStatus === 'PENDING';

                        if (isSuperAdmin || isActive || (isPending && isInvitedUser)) {
                            // Allowed
                        } else if (tenantStatus === 'REJECTED') {
                            setError(t('tenant_rejected_approval', 'Il tuo account aziendale è stato rifiutato.'));
                            await supabase.auth.signOut();
                            setLoading(false);
                            return;
                        } else {
                            // Probably PENDING and role is Admin (2)
                            setError(t('tenant_pending_approval'));
                            await supabase.auth.signOut();
                            setLoading(false);
                            return;
                        }
                    } catch (e: any) {
                        console.error('Error fetching profile during login:', e);
                        // If profile fetch fails (e.g. server down / cold start), don't navigate
                        setError(t('error_network', 'Il server non risponde. Potrebbe essere in fase di avvio (cold start). Riprova tra 30-60 secondi.'));
                        setLoading(false);
                        return; // Stop here, don't navigate to dashboard
                    }
                }
                navigate('/dashboard');
            }
        } catch (e: any) {
            setError(`${t('login_error_unexpected')}: ${e.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            setError(t('email_required', 'Email is required for Magic Link'));
            return;
        }
        setError(null);
        setLoading(true);
        setMagicLinkSent(false);

        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: globalThis.location.origin + '/dashboard',
                },
            });

            if (otpError) {
                setError(otpError.message);
            } else {
                setMagicLinkSent(true);
            }
        } catch (e: any) {
            setError(t('magic_link_error') + (e.message ? ": " + e.message : ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="w-full max-w-5xl relative z-10 m-auto">
            <style>
                {`
                    @keyframes spyRight {
                        0% { transform: translate(0, 0); }
                        100% { transform: translate(4px, 0); }
                    }
                    .character-eye-spy {
                        animation: spyRight 0.3s forwards;
                    }
                    .character-head-spy {
                        transform: rotate(15deg) translateX(64px) translateY(-10px);
                        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    .character-hand {
                        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                `}
            </style>
            <div className="fixed top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
            <div className="fixed bottom-10 right-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl"></div>
            <div className="bg-white rounded-[32px] shadow-deep border border-slate-100 flex flex-col md:flex-row overflow-hidden min-h-[600px] relative z-20 mx-4 lg:mx-0 mt-8 mb-8">
                {/* Left Side (Illustration) - Hidden on mobile, visible on md+ */}
                <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 relative flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                    <div className="relative z-10 w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
                        <div className="relative w-64 h-64">
                            {/* The Character */}
                            <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-24 h-28 bg-orange-200 rounded-[2rem] shadow-lg z-20 transition-all duration-300 ${focusedField === 'email' ? 'character-head-spy' : ''}`}>
                                {/* Eyes - moved back up slightly and styled to pop */}
                                <div className={`absolute top-10 left-4 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden transition-all duration-300 ${focusedField === 'email' ? 'scale-125' : ''}`}>
                                    <div className={`w-3 h-3 bg-slate-800 rounded-full transition-all duration-300 ${focusedField === 'email' ? 'translate-x-1.5' : ''}`}></div>
                                </div>
                                <div className={`absolute top-10 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden transition-all duration-300 ${focusedField === 'email' ? 'scale-125' : ''}`}>
                                    <div className={`w-3 h-3 bg-slate-800 rounded-full transition-all duration-300 ${focusedField === 'email' ? 'translate-x-1.5' : ''}`}></div>
                                </div>

                                {/* Mouth/Blush */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-6 h-3 bg-red-300 rounded-full opacity-50"></div>

                                {/* Hair/Helmet - moved up to -top-6 */}
                                <div className="absolute -top-6 -left-2 w-28 h-16 bg-slate-800 rounded-t-full rounded-bl-3xl"></div>

                                {/* Hands that cover eyes when password is focused */}
                                <div className={`absolute top-8 left-1 w-8 h-8 bg-orange-200 rounded-full shadow-md z-30 character-hand ${focusedField === 'password' ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-12 opacity-0'}`}></div>
                                <div className={`absolute top-8 right-1 w-8 h-8 bg-orange-200 rounded-full shadow-md z-30 character-hand ${focusedField === 'password' ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-12 opacity-0'}`}></div>
                            </div>

                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-slate-200 rounded-xl shadow-xl z-30 flex items-center justify-center border-b-8 border-slate-300">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="material-icons text-blue-500 text-sm">shield</span>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-24 bg-blue-500 rounded-t-[3rem] z-10"></div>

                            {/* Animated floating items */}
                            <div className="absolute top-0 right-0 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center rotate-12 animate-bounce flex-shrink-0" style={{ animationDuration: '3s' }}>
                                <span className="material-icons text-yellow-500">work</span>
                            </div>
                            <div className="absolute bottom-20 -left-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center -rotate-12 animate-bounce flex-shrink-0" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                                <span className="material-icons text-green-500">check_circle</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center relative z-10">
                        <h2 className="text-2xl font-brand font-semibold text-slate-800 mb-2">{t('workspace_freedom')}</h2>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">{t('workspace_freedom_desc')}</p>
                    </div>
                </div>

                {/* Right Side (Form) */}
                <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="mb-10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
                                <div className="relative w-6 h-6">
                                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[20px] text-white">shield</span>
                                    <span className="material-symbols-outlined absolute -top-1 left-0 w-full flex justify-center text-[12px] text-white">visibility</span>
                                </div>
                            </div>
                            <span className="text-2xl font-brand font-bold text-slate-800 tracking-tight">Athena</span>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('welcome_back')}</h1>
                        <p className="text-slate-500 mb-8 text-sm">{t('enter_details')}</p>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                                <span className="material-icons text-red-500 text-lg">error_outline</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {magicLinkSent && (
                            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm flex items-center gap-2">
                                <span className="material-icons text-green-500 text-lg">check_circle_outline</span>
                                <span>{t('magic_link_sent')}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
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
                                        name="email"
                                        placeholder="name@athena.com"
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="password">
                                    {t('password')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">lock_outline</span>
                                    </div>
                                    <input
                                        className="block w-full pl-11 pr-12 py-3.5 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors focus:outline-none"
                                    >
                                        <span className="material-icons text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center">
                                    <input
                                        className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        disabled={loading}
                                    />
                                    <label className="ml-2 block text-sm text-slate-600" htmlFor="remember-me">{t('remember_me')}</label>
                                </div>
                                <Link to="/reset-password" title={t('forgot_password')} className="text-sm font-semibold text-primary hover:text-blue-700 transition-colors bg-transparent border-none p-0 cursor-pointer">
                                    {t('forgot_password')}
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white transition-all duration-200 transform ${loading
                                    ? 'bg-blue-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-icons animate-spin mr-2 text-sm">autorenew</span>
                                        {t('signing_in')}
                                    </>
                                ) : (
                                    t('sign_in')
                                )}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-wide">
                                <span className="px-4 bg-white text-slate-400 font-medium">{t('continue_with_magic_link')}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleMagicLink}
                            disabled={loading || !email}
                            className={`w-full flex justify-center items-center py-3.5 px-4 border border-slate-200 rounded-2xl bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-all duration-200 group ${(!email || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            type="button"
                        >
                            <span className="material-icons mr-3 text-blue-500 opacity-80 group-hover:opacity-100 transition-opacity">auto_fix_high</span>
                            {loading ? t('signing_in') : t('magic_link')}
                        </button>

                        <p className="mt-8 text-center text-sm text-slate-500">
                            {t('no_account')} <Link className="text-primary font-semibold hover:underline" to="/register">{t('sign_up', 'Sign Up')}</Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center pb-8">
                <div className="flex justify-center space-x-6 text-xs text-slate-400 font-medium">
                    <button type="button" className="hover:text-slate-600 transition-colors bg-transparent border-none p-0 cursor-pointer">{t('privacy')}</button>
                    <span className="text-slate-300">•</span>
                    <button type="button" className="hover:text-slate-600 transition-colors bg-transparent border-none p-0 cursor-pointer">{t('terms')}</button>
                    <span className="text-slate-300">•</span>
                    <button type="button" className="hover:text-slate-600 transition-colors bg-transparent border-none p-0 cursor-pointer">{t('help')}</button>
                </div>
                <p className="mt-4 text-[10px] text-slate-400 opacity-60">
                    © 2024 Athena Inc. Internal System.
                </p>
            </div>

            {/* Server Cold Start Warning Modal */}
            {showServerWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowServerWarning(false)}></div>
                    
                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>

                        <div className="relative z-10 p-8 md:p-10 flex flex-col items-center text-center">
                            {/* Warning Icon Container */}
                            <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-8 shadow-inner">
                                <span className="material-icons text-4xl text-amber-500 animate-pulse">timer</span>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                {t('attention', 'Attenzione')}
                            </h3>
                            
                            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-10">
                                {t('server_cold_start_warning', 'Il login potrebbe richiedere dai 30 ai 60 secondi se il portale è rimasto inutilizzato per un lungo periodo.')}
                            </p>

                            <button
                                onClick={() => setShowServerWarning(false)}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 outline-none"
                            >
                                {t('understand_close', 'Ho capito, chiudi')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Login;
