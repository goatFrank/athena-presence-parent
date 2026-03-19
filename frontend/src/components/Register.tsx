import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';

const Register: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [inviteToken, setInviteToken] = useState<string | null>(searchParams.get('token'));
    const [inviteData, setInviteData] = useState<any | null>(null);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | 'confirmPassword' | 'fullName' | 'companyName' | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/dashboard', { replace: true });
            }
        };
        checkExistingSession();

        // Validate token if present
        if (inviteToken) {
            const validateToken = async () => {
                try {
                    const response = await attendanceApi.get(`/api/v1/invites/validate/${inviteToken}`);
                    if (response.data.status === 'SUCCESS') {
                        setTokenValid(true);
                        setInviteData(response.data.payload);
                        // If token is valid, we might want to pre-fill or hide company name
                        setCompanyName(response.data.payload.tenantName || 'Joining established organization...');
                    } else {
                        setTokenValid(false);
                        setError(t('invalid_invite_token'));
                    }
                } catch (err: any) {
                    console.error('Token validation error:', err);
                    setTokenValid(false);
                    const serverMessage = err.response?.data?.message;
                    setError(serverMessage || t('invalid_invite_token'));
                }
            };
            validateToken();
        }
    }, [inviteToken, navigate, t]);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError(t('passwords_dont_match'));
            return;
        }

        setLoading(true);

        try {
            // 1. Sign up on Supabase Auth
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        company_name: companyName,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                // 2. Setup Profile and Tenant in our Database via Backend
                try {
                    await attendanceApi.post(`/api/v1/profiles/setup`, {
                        email,
                        fullName,
                        companyName: inviteToken ? 'JOINING_BY_INVITE' : companyName,
                        password: '****',
                        inviteToken: inviteToken || undefined
                    });

                    // Explicitly sign out to prevent the auto-login session from persisting 
                    // while waiting for admin approval
                    await supabase.auth.signOut();

                    setSuccess(true);
                    setError(null);
                } catch (backendError: any) {
                    console.error('Backend Setup Error:', backendError);
                    const errorMessage = backendError.response?.data?.message || backendError.message || 'Connection error';
                    
                    if (backendError.response?.status === 409) {
                        setError(t('company_already_registered'));
                    } else {
                        setError(`${t('register_error_unexpected')}: ${errorMessage}`);
                    }
                    
                    // Clean up auth user if backend setup fails
                    await supabase.auth.signOut();
                }
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(`${t('register_error_unexpected')}: ${err.message || 'Unknown error'}`);
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
                {/* Left Side (Illustration) */}
                <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 relative flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                    <div className="relative z-10 w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
                        <div className="relative w-64 h-64">
                            {/* The Character */}
                            <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-24 h-28 bg-orange-200 rounded-[2rem] shadow-lg z-20 transition-all duration-300 ${(focusedField === 'email' || focusedField === 'fullName' || focusedField === 'companyName') ? 'character-head-spy' : ''}`}>
                                {/* Eyes */}
                                <div className={`absolute top-10 left-4 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden transition-all duration-300 ${(focusedField === 'email' || focusedField === 'fullName' || focusedField === 'companyName') ? 'scale-125' : ''}`}>
                                    <div className={`w-3 h-3 bg-slate-800 rounded-full transition-all duration-300 ${(focusedField === 'email' || focusedField === 'fullName' || focusedField === 'companyName') ? 'translate-x-1.5' : ''}`}></div>
                                </div>
                                <div className={`absolute top-10 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden transition-all duration-300 ${(focusedField === 'email' || focusedField === 'fullName' || focusedField === 'companyName') ? 'scale-125' : ''}`}>
                                    <div className={`w-3 h-3 bg-slate-800 rounded-full transition-all duration-300 ${(focusedField === 'email' || focusedField === 'fullName' || focusedField === 'companyName') ? 'translate-x-1.5' : ''}`}></div>
                                </div>

                                {/* Mouth/Blush */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-6 h-3 bg-red-300 rounded-full opacity-50"></div>

                                {/* Hair/Helmet */}
                                <div className="absolute -top-6 -left-2 w-28 h-16 bg-slate-800 rounded-t-full rounded-bl-3xl"></div>

                                {/* Hands that cover eyes when password is focused */}
                                <div className={`absolute top-8 left-1 w-8 h-8 bg-orange-200 rounded-full shadow-md z-30 character-hand ${focusedField === 'password' || focusedField === 'confirmPassword' ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-12 opacity-0'}`}></div>
                                <div className={`absolute top-8 right-1 w-8 h-8 bg-orange-200 rounded-full shadow-md z-30 character-hand ${focusedField === 'password' || focusedField === 'confirmPassword' ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-12 opacity-0'}`}></div>
                            </div>

                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-slate-200 rounded-xl shadow-xl z-30 flex items-center justify-center border-b-8 border-slate-300">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="material-icons text-blue-500 text-sm">person_add</span>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-24 bg-blue-500 rounded-t-[3rem] z-10"></div>

                            {/* Animated floating items */}
                            <div className="absolute top-0 right-0 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center rotate-12 animate-bounce flex-shrink-0" style={{ animationDuration: '3s' }}>
                                <span className="material-icons text-yellow-500">celebration</span>
                            </div>
                            <div className="absolute bottom-20 -left-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center -rotate-12 animate-bounce flex-shrink-0" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                                <span className="material-icons text-green-500">verified</span>
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
                        <div className="mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
                                <div className="relative w-6 h-6">
                                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[20px] text-white">shield</span>
                                    <span className="material-symbols-outlined absolute -top-1 left-0 w-full flex justify-center text-[12px] text-white">person_add</span>
                                </div>
                            </div>
                            <span className="text-2xl font-brand font-bold text-slate-800 tracking-tight">Athena</span>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('create_account')}</h1>
                        <p className="text-slate-500 mb-6 text-sm">
                            {inviteData ? (
                                <span className="text-blue-600 font-semibold flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-500">
                                    <span className="material-icons text-lg">domain</span>
                                    {t('invited_to_join', { tenantName: inviteData.tenantName })}
                                </span>
                            ) : t('enter_details_register')}
                        </p>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                                <span className="material-icons text-red-500 text-lg">error_outline</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in duration-500">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="material-icons text-blue-600 text-2xl">
                                        {inviteToken ? 'check_circle' : 'hourglass_empty'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">
                                        {inviteToken 
                                            ? t('registration_complete', 'Registrazione completata!') 
                                            : t('registration_pending', 'Registrazione in attesa')}
                                    </h3>
                                    <p className="text-sm opacity-90">
                                        {inviteToken 
                                            ? t('registration_complete_desc', 'Il tuo account è stato creato. Ora puoi effettuare il login.')
                                            : t('registration_pending_desc', 'La tua richiesta è stata inviata. Un amministratore approverà la tua azienda a breve.')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {t('back_to_login', 'Vai al Login')}
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="fullName">
                                    {t('full_name')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">person_outline</span>
                                    </div>
                                    <input
                                        className="block w-full pl-11 pr-4 py-3 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                        id="fullName"
                                        name="fullName"
                                        placeholder="John Doe"
                                        required
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        onFocus={() => setFocusedField('fullName')}
                                        onBlur={() => setFocusedField(null)}
                                        disabled={loading || success}
                                    />
                                </div>
                            </div>

                            {!inviteToken && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="companyName">
                                        {t('company_name')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">business</span>
                                        </div>
                                        <input
                                            className="block w-full pl-11 pr-4 py-3 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                            id="companyName"
                                            name="companyName"
                                            placeholder="Athena Inc."
                                            required={!inviteToken}
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            onFocus={() => setFocusedField('companyName')}
                                            onBlur={() => setFocusedField(null)}
                                            disabled={loading || success}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="email">
                                    {t('email_address')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">mail_outline</span>
                                    </div>
                                    <input
                                        className="block w-full pl-11 pr-4 py-3 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                        id="email"
                                        name="email"
                                        placeholder="name@athena.com"
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        disabled={loading || success}
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
                                        className="block w-full pl-11 pr-12 py-3 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        disabled={loading || success}
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

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="confirmPassword">
                                    {t('confirm_password')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">lock_reset</span>
                                    </div>
                                    <input
                                        className="block w-full pl-11 pr-4 py-3 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onFocus={() => setFocusedField('confirmPassword')}
                                        onBlur={() => setFocusedField(null)}
                                        disabled={loading || success}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success}
                                className={`w-full flex justify-center items-center py-3.5 px-4 mt-2 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white transition-all duration-200 transform ${loading || success
                                    ? 'bg-blue-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-icons animate-spin mr-2 text-sm">autorenew</span>
                                        {t('signing_up')}
                                    </>
                                ) : (
                                    t('sign_up')
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-slate-500">
                            {t('already_have_account')} <Link className="text-blue-600 font-semibold hover:underline" to="/login">{t('sign_in')}</Link>
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
        </main>
    );
};

export default Register;
