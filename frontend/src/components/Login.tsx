import React, { useState, useEffect, useMemo } from 'react';
import athenaLogo from '../assets/icons/athena-logo-transparent.png';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, setRememberMe as setRememberMePref } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

/* ─── Floating Particle (light theme) ─── */
const Particle: React.FC<{ delay: number; size: number; x: number; y: number; duration: number }> = ({ delay, size, x, y, duration }) => (
    <div
        className="absolute rounded-full pointer-events-none"
        style={{
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            animation: `float-particle ${duration}s ease-in-out ${delay}s infinite`,
        }}
    />
);

/* ═══════════════════════════════════════════
   OWL MASCOT — looks at password / branch covers eyes 🦉
   ═══════════════════════════════════════════ */
const OwlMascot: React.FC<{ focusedField: 'email' | 'password' | null }> = ({ focusedField }) => {
    /* Pupil position: when email focused, look down-right toward password */
    const pupilTransform = focusedField === 'email'
        ? 'translate(3px, 4px)'
        : 'translate(0, 0)';

    /* Subtle head tilt when looking at password field */
    const headTransform = focusedField === 'email'
        ? 'rotate(4deg) translateY(2px)'
        : 'rotate(0deg) translateY(0)';

    /* Branch drops over face + half body when password focused */
    const branchCoverTransform = focusedField === 'password'
        ? 'translateY(0) rotate(2deg)'
        : 'translateY(-200px) rotate(-20deg)';
    const branchCoverOpacity = focusedField === 'password' ? 1 : 0;

    return (
        <div className="relative w-56 h-56 flex items-center justify-center">
            <div
                className="relative w-full h-full flex items-center justify-center"
                style={{
                    transform: headTransform,
                    transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                {/* Owl Body */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[130px] h-[150px] bg-gradient-to-b from-slate-500 to-slate-600 rounded-[3.5rem] rounded-b-[4rem] shadow-xl z-10 overflow-hidden">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85px] h-[95px] bg-gradient-to-b from-amber-50 to-amber-100 rounded-t-[3rem] rounded-b-[3rem]" />
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
                        <div className="w-5 h-0.5 bg-amber-400 rounded-full" />
                        <div className="w-7 h-0.5 bg-amber-400 rounded-full" />
                        <div className="w-5 h-0.5 bg-amber-400 rounded-full" />
                    </div>
                </div>
                {/* Ear tufts */}
                <div className="absolute -top-1 left-[calc(50%-40px)] w-5 h-10 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-full rotate-[-15deg] z-10" />
                <div className="absolute -top-1 right-[calc(50%-40px)] w-5 h-10 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-full rotate-[15deg] z-10" />
                {/* Head / Face disc */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[115px] h-[78px] bg-gradient-to-b from-slate-400 to-slate-500 rounded-[3rem] z-20">
                    <div className="absolute inset-1 bg-gradient-to-b from-slate-300/20 to-transparent rounded-[2.5rem]" />
                    {/* Left Eye */}
                    <div className={`absolute top-3 left-2.5 w-[42px] h-[42px] bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 ${focusedField === 'email' ? 'scale-110' : ''}`}>
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                            <div className="w-3.5 h-3.5 bg-slate-900 rounded-full relative" style={{ transform: pupilTransform, transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-90" />
                            </div>
                        </div>
                    </div>
                    {/* Right Eye */}
                    <div className={`absolute top-3 right-2.5 w-[42px] h-[42px] bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 ${focusedField === 'email' ? 'scale-110' : ''}`}>
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                            <div className="w-3.5 h-3.5 bg-slate-900 rounded-full relative" style={{ transform: pupilTransform, transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-90" />
                            </div>
                        </div>
                    </div>
                    {/* Beak */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 z-30" style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '11px solid #f59e0b', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
                </div>

                {/* ══ Leafy Branch — drops over entire face + half body ══ */}
                <div
                    className="absolute z-50 pointer-events-none"
                    style={{
                        top: '-10px',
                        left: '50%',
                        transform: `translateX(-50%) ${branchCoverTransform}`,
                        opacity: branchCoverOpacity,
                        transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
                        width: '170px',
                    }}
                >
                    {/* Main branch stick */}
                    <div style={{ position: 'absolute', top: '12px', left: '5px', width: '160px', height: '7px', background: 'linear-gradient(90deg, #78350f, #92400e, #b45309, #92400e, #78350f)', borderRadius: '4px', zIndex: 2 }} />
                    {/* Small twig branching off */}
                    <div style={{ position: 'absolute', top: '8px', left: '130px', width: '30px', height: '4px', background: '#92400e', borderRadius: '2px', transform: 'rotate(25deg)', transformOrigin: 'left center' }} />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', width: '25px', height: '4px', background: '#92400e', borderRadius: '2px', transform: 'rotate(-20deg)', transformOrigin: 'right center' }} />
                    {/* Dense leaves covering face and half body */}
                    <svg width="170" height="140" viewBox="0 0 170 140" fill="none" style={{ position: 'absolute', top: '-5px', left: '0' }}>
                        {/* Top row of leaves */}
                        <ellipse cx="25" cy="12" rx="18" ry="10" fill="#15803d" transform="rotate(-30 25 12)" />
                        <ellipse cx="50" cy="8" rx="16" ry="9" fill="#166534" transform="rotate(15 50 8)" />
                        <ellipse cx="80" cy="10" rx="20" ry="11" fill="#15803d" transform="rotate(-10 80 10)" />
                        <ellipse cx="110" cy="8" rx="17" ry="9" fill="#166534" transform="rotate(20 110 8)" />
                        <ellipse cx="140" cy="12" rx="18" ry="10" fill="#15803d" transform="rotate(35 140 12)" />
                        {/* Second dense row */}
                        <ellipse cx="15" cy="28" rx="16" ry="10" fill="#166534" transform="rotate(-20 15 28)" />
                        <ellipse cx="40" cy="25" rx="19" ry="11" fill="#16a34a" transform="rotate(10 40 25)" />
                        <ellipse cx="65" cy="22" rx="18" ry="10" fill="#15803d" transform="rotate(-15 65 22)" />
                        <ellipse cx="95" cy="24" rx="20" ry="11" fill="#16a34a" transform="rotate(5 95 24)" />
                        <ellipse cx="120" cy="26" rx="17" ry="10" fill="#15803d" transform="rotate(-25 120 26)" />
                        <ellipse cx="150" cy="28" rx="16" ry="9" fill="#166534" transform="rotate(30 150 28)" />
                        {/* Third row — covering mid face */}
                        <ellipse cx="20" cy="45" rx="17" ry="10" fill="#14532d" transform="rotate(-10 20 45)" />
                        <ellipse cx="50" cy="42" rx="20" ry="12" fill="#15803d" transform="rotate(20 50 42)" />
                        <ellipse cx="85" cy="40" rx="22" ry="12" fill="#166534" transform="rotate(-5 85 40)" />
                        <ellipse cx="115" cy="42" rx="19" ry="11" fill="#15803d" transform="rotate(15 115 42)" />
                        <ellipse cx="145" cy="45" rx="17" ry="10" fill="#14532d" transform="rotate(25 145 45)" />
                        {/* Fourth row — covering lower face */}
                        <ellipse cx="30" cy="60" rx="18" ry="11" fill="#16a34a" transform="rotate(8 30 60)" />
                        <ellipse cx="60" cy="58" rx="20" ry="12" fill="#166534" transform="rotate(-12 60 58)" />
                        <ellipse cx="90" cy="56" rx="21" ry="12" fill="#16a34a" transform="rotate(10 90 56)" />
                        <ellipse cx="120" cy="58" rx="18" ry="11" fill="#166534" transform="rotate(-8 120 58)" />
                        <ellipse cx="150" cy="60" rx="16" ry="10" fill="#16a34a" transform="rotate(18 150 60)" />
                        {/* Fifth row — covering upper body */}
                        <ellipse cx="25" cy="78" rx="17" ry="10" fill="#15803d" transform="rotate(-15 25 78)" />
                        <ellipse cx="55" cy="75" rx="19" ry="11" fill="#14532d" transform="rotate(8 55 75)" />
                        <ellipse cx="85" cy="73" rx="21" ry="12" fill="#15803d" transform="rotate(-5 85 73)" />
                        <ellipse cx="115" cy="75" rx="18" ry="11" fill="#14532d" transform="rotate(12 115 75)" />
                        <ellipse cx="145" cy="78" rx="16" ry="10" fill="#15803d" transform="rotate(22 145 78)" />
                        {/* Sixth row — mid body coverage */}
                        <ellipse cx="35" cy="95" rx="18" ry="10" fill="#166534" transform="rotate(5 35 95)" />
                        <ellipse cx="65" cy="92" rx="20" ry="11" fill="#16a34a" transform="rotate(-10 65 92)" />
                        <ellipse cx="95" cy="90" rx="20" ry="12" fill="#166534" transform="rotate(8 95 90)" />
                        <ellipse cx="130" cy="92" rx="18" ry="10" fill="#16a34a" transform="rotate(-15 130 92)" />
                        {/* Bottom leaves — solid */}
                        <ellipse cx="45" cy="110" rx="16" ry="9" fill="#15803d" transform="rotate(12 45 110)" />
                        <ellipse cx="80" cy="108" rx="18" ry="10" fill="#14532d" transform="rotate(-8 80 108)" />
                        <ellipse cx="115" cy="110" rx="16" ry="9" fill="#15803d" transform="rotate(15 115 110)" />
                        {/* Very bottom */}
                        <ellipse cx="60" cy="125" rx="14" ry="8" fill="#166534" transform="rotate(5 60 125)" />
                        <ellipse cx="100" cy="125" rx="14" ry="8" fill="#166534" transform="rotate(-5 100 125)" />
                    </svg>
                </div>

                {/* Feet */}
                <div className="absolute bottom-4 left-[calc(50%-26px)] z-5">
                    <div className="flex gap-1">
                        <div className="w-2 h-3.5 bg-amber-500 rounded-b-full" />
                        <div className="w-2 h-4.5 bg-amber-500 rounded-b-full" />
                        <div className="w-2 h-3.5 bg-amber-500 rounded-b-full" />
                    </div>
                </div>
                <div className="absolute bottom-4 right-[calc(50%-26px)] z-5">
                    <div className="flex gap-1">
                        <div className="w-2 h-3.5 bg-amber-500 rounded-b-full" />
                        <div className="w-2 h-4.5 bg-amber-500 rounded-b-full" />
                        <div className="w-2 h-3.5 bg-amber-500 rounded-b-full" />
                    </div>
                </div>
                {/* Branch (perch) */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-40 h-3 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-full shadow-md z-0" />
            </div>

            {/* Floating sparkle badges (outside transform) */}
            <div className="absolute -top-3 -right-5 w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center rotate-12 shadow-md z-30" style={{ animation: 'float-particle 4s ease-in-out infinite' }}>
                <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div className="absolute bottom-8 -left-7 w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center -rotate-12 shadow-md z-30" style={{ animation: 'float-particle 5s ease-in-out 1s infinite' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
        </div>
    );
};

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
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

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
                        if (profileData.tenantStatus === 'PENDING') setError(t('tenant_pending_approval'));
                        else if (profileData.tenantStatus === 'REJECTED') setError(t('tenant_rejected_approval', 'Il tuo account aziendale è stato rifiutato.'));
                    }
                } catch (e: any) { console.error('Error checking status for existing session:', e); await supabase.auth.signOut(); }
            }
        };
        checkExistingSession();
    }, [navigate, t]);

    useEffect(() => {
        const hasShownWarning = sessionStorage.getItem('athena_server_warning_shown');
        if (!hasShownWarning) { setShowServerWarning(true); sessionStorage.setItem('athena_server_warning_shown', 'true'); }
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setError(null); setLoading(true);
        try {
            setRememberMePref(rememberMe);
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                setError(signInError.message === 'Invalid login credentials' ? t('login_invalid_credentials') : signInError.message);
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    try {
                        const profileResponse = await attendanceApi.get('/api/v1/profiles/me');
                        const { tenantStatus, roleId } = profileResponse.data.payload;
                        const isSuperAdmin = roleId === 1;
                        const isActive = tenantStatus === 'ACTIVE';
                        const isInvitedUser = roleId === 3 || roleId === 4;
                        const isPending = tenantStatus === 'PENDING';
                        if (isSuperAdmin || isActive || (isPending && isInvitedUser)) { /* allowed */ }
                        else if (tenantStatus === 'REJECTED') { setError(t('tenant_rejected_approval', 'Il tuo account aziendale è stato rifiutato.')); await supabase.auth.signOut(); setLoading(false); return; }
                        else { setError(t('tenant_pending_approval')); await supabase.auth.signOut(); setLoading(false); return; }
                    } catch (e: any) { console.error('Error fetching profile during login:', e); setError(t('error_network', 'Il server non risponde. Potrebbe essere in fase di avvio (cold start). Riprova tra 30-60 secondi.')); setLoading(false); return; }
                }
                navigate('/dashboard');
            }
        } catch (e: any) { setError(`${t('login_error_unexpected')}: ${e.message || 'Unknown error'}`); }
        finally { setLoading(false); }
    };

    const handleMagicLink = async () => {
        if (!email) { setError(t('email_required', 'Email is required for Magic Link')); return; }
        setError(null); setLoading(true); setMagicLinkSent(false);
        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: globalThis.location.origin + '/dashboard' } });
            if (otpError) setError(otpError.message); else setMagicLinkSent(true);
        } catch (e: any) { setError(t('magic_link_error') + (e.message ? ": " + e.message : "")); }
        finally { setLoading(false); }
    };

    const particles = useMemo(() => {
        const seed = [0.2, 0.7, 0.4, 0.9, 0.1, 0.6, 0.3, 0.8, 0.5, 0.15];
        return Array.from({ length: 10 }, (_, i) => ({
            x: seed[i] * 100, y: seed[(i + 3) % 10] * 100, size: 4 + seed[(i + 5) % 10] * 8,
            delay: seed[(i + 7) % 10] * 5, duration: 6 + seed[(i + 1) % 10] * 6,
        }));
    }, []);

    return (
        <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-mesh font-display text-slate-900">
            <style>{`
                @keyframes float-particle { 0%,100%{transform:translateY(0) scale(1);opacity:0.5} 50%{transform:translateY(-18px) scale(1.2);opacity:0.9} }
                @keyframes slide-up-fade { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-4px)} 20%,40%,60%,80%{transform:translateX(4px)} }
                @keyframes owl-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
                .animate-slide-up { animation: slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) forwards }
                .animate-slide-up-d1 { animation: slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s forwards; opacity: 0 }
                .animate-slide-up-d2 { animation: slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) 0.16s forwards; opacity: 0 }
                .animate-slide-up-d3 { animation: slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) 0.24s forwards; opacity: 0 }
                .animate-shake { animation: shake 0.5s ease-in-out }
                .animate-owl-bob { animation: owl-bob 3.5s ease-in-out infinite }
            `}</style>

            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {particles.map((p, i) => <Particle key={i} {...p} />)}
                <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-blue-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse" />
                <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-15 animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className={`relative z-10 w-full max-w-[1060px] mx-4 my-8 transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-soft-xl flex flex-col lg:flex-row overflow-hidden min-h-[620px]">
                    
                    {/* ═══ Left Panel — Owl ═══ */}
                    <div className="hidden lg:flex w-[45%] relative flex-col items-center justify-center p-10 overflow-hidden bg-gradient-to-br from-blue-50/80 to-indigo-50/50">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-blue-200/30" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-blue-100/20" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] rounded-full border border-blue-50/20" />
                        <div className="animate-owl-bob">
                            <OwlMascot focusedField={focusedField} />
                        </div>
                        <div className="mt-10 text-center relative z-10 animate-slide-up-d1">
                            <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">{t('workspace_freedom')}</h2>
                            <p className="text-slate-400 text-sm max-w-[260px] mx-auto leading-relaxed">{t('workspace_freedom_desc')}</p>
                        </div>
                    </div>

                    {/* ═══ Right Panel — Form ═══ */}
                    <div className="w-full lg:w-[55%] p-8 md:p-12 lg:p-14 flex flex-col justify-center relative">
                        <div className="w-full max-w-sm mx-auto">
                            <div className="mb-10 flex items-center gap-3 animate-slide-up">
                                <img src={athenaLogo} alt="Athena" className="w-10 h-10 object-contain" />
                                <span className="text-2xl font-bold text-slate-900 tracking-tight">Athena</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight animate-slide-up-d1">{t('welcome_back')}</h1>
                            <p className="text-slate-400 mb-8 text-sm animate-slide-up-d2">{t('enter_details')}</p>

                            {error && (
                                <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2.5 animate-shake">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}
                            {magicLinkSent && (
                                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                                    <span className="font-medium">{t('magic_link_sent')}</span>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-5 animate-slide-up-d3">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="email">{t('email_address')}</label>
                                    <div className={`relative group rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-500' : 'text-slate-300'}`} />
                                        </div>
                                        <input className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="email" name="email" placeholder="name@athena.com" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} disabled={loading} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="password">{t('password')}</label>
                                    <div className={`relative group rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-500' : 'text-slate-300'}`} />
                                        </div>
                                        <input className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="password" name="password" placeholder="••••••••" required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} disabled={loading} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 cursor-pointer transition-colors focus:outline-none">
                                            {showPassword ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2.5 cursor-pointer group" htmlFor="remember-me">
                                        <div className="relative">
                                            <input className="sr-only peer" id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={loading} />
                                            <div className="w-4 h-4 rounded-md border border-slate-200 bg-slate-50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200 flex items-center justify-center">
                                                {rememberMe && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-400 group-hover:text-slate-600 transition-colors">{t('remember_me')}</span>
                                    </label>
                                    <Link to="/reset-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">{t('forgot_password')}</Link>
                                </div>

                                <button type="submit" disabled={loading} className={`w-full flex justify-center items-center py-3.5 px-4 rounded-2xl text-sm font-bold text-white transition-all duration-300 transform relative overflow-hidden group ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40'}`}>
                                    {!loading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}
                                    {loading ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('signing_in')}</>
                                    ) : (
                                        <span className="flex items-center gap-2">{t('sign_in')}<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
                                    )}
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                                <div className="relative flex justify-center text-[11px] uppercase tracking-widest"><span className="px-4 bg-white text-slate-300 font-medium">{t('continue_with_magic_link')}</span></div>
                            </div>

                            <button onClick={handleMagicLink} disabled={loading || !email} className={`w-full flex justify-center items-center py-3.5 px-4 border border-slate-200 rounded-2xl bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 focus:outline-none transition-all duration-300 group ${(!email || loading) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} type="button">
                                <Sparkles className="w-4 h-4 mr-2.5 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                                {loading ? t('signing_in') : t('magic_link')}
                            </button>

                            <p className="mt-8 text-center text-sm text-slate-400">
                                {t('no_account')}{' '}
                                <Link className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" to="/register">{t('sign_up', 'Sign Up')}</Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center pb-4">
                    <div className="flex justify-center space-x-6 text-xs text-slate-300 font-medium">
                        <button type="button" className="hover:text-slate-500 transition-colors bg-transparent border-none p-0 cursor-pointer">{t('privacy')}</button>
                        <span className="text-slate-200">•</span>
                        <button type="button" className="hover:text-slate-500 transition-colors bg-transparent border-none p-0 cursor-pointer">{t('terms')}</button>
                        <span className="text-slate-200">•</span>
                        <button type="button" className="hover:text-slate-500 transition-colors bg-transparent border-none p-0 cursor-pointer">{t('help')}</button>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-300">© {new Date().getFullYear()} Athena Inc. Internal System.</p>
                </div>
            </div>

            {showServerWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowServerWarning(false)} />
                    <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden" style={{ animation: 'slide-up-fade 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                        <div className="relative z-10 p-8 md:p-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6">
                                <span className="material-icons text-3xl text-amber-500 animate-pulse">timer</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{t('attention', 'Attenzione')}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">{t('server_cold_start_warning', 'Il login potrebbe richiedere dai 30 ai 60 secondi se il portale è rimasto inutilizzato per un lungo periodo.')}</p>
                            <button onClick={() => setShowServerWarning(false)} className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40 outline-none">
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
