import React, { useState, useEffect, useMemo } from 'react';
import athenaLogo from '../assets/icons/athena-logo-transparent.png';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import { Eye, EyeOff, Mail, Lock, User, Building2, Sparkles, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

/* ─── Floating Particle ─── */
const Particle: React.FC<{ delay: number; size: number; x: number; y: number; duration: number }> = ({ delay, size, x, y, duration }) => (
    <div className="absolute rounded-full pointer-events-none" style={{ width: size, height: size, left: `${x}%`, top: `${y}%`, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', animation: `float-particle ${duration}s ease-in-out ${delay}s infinite` }} />
);

/* ─── Password Strength ─── */
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
    const getStrength = (pw: string) => {
        if (!pw) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
        if (/\d/.test(pw)) score++;
        if (/[@$!%*?&]/.test(pw)) score++;
        if (score <= 1) return { level: 1, label: 'Debole', color: 'bg-red-500' };
        if (score === 2) return { level: 2, label: 'Media', color: 'bg-amber-500' };
        if (score === 3) return { level: 3, label: 'Buona', color: 'bg-blue-500' };
        return { level: 4, label: 'Forte', color: 'bg-emerald-500' };
    };
    const { level, label, color } = getStrength(password);
    if (!password) return null;
    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (<div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= level ? color : 'bg-slate-100'}`} />))}
            </div>
            <p className={`text-[11px] font-medium transition-colors duration-300 ${level <= 1 ? 'text-red-500' : level === 2 ? 'text-amber-500' : level === 3 ? 'text-blue-500' : 'text-emerald-500'}`}>{label}</p>
        </div>
    );
};

/* ═══ OWL MASCOT — looks at password / branch covers eyes 🦉 ═══ */
const OwlMascot: React.FC<{ isTextFocused: boolean; isPasswordFocused: boolean }> = ({ isTextFocused, isPasswordFocused }) => {
    /* Pupil position: when text fields focused, look down-right toward password */
    const pupilTransform = isTextFocused
        ? 'translate(3px, 4px)'
        : 'translate(0, 0)';

    /* Subtle head tilt when looking at password field */
    const headTransform = isTextFocused
        ? 'rotate(4deg) translateY(2px)'
        : 'rotate(0deg) translateY(0)';

    /* Branch drops over face + half body when password focused */
    const branchCoverTransform = isPasswordFocused
        ? 'translateY(0) rotate(2deg)'
        : 'translateY(-200px) rotate(-20deg)';
    const branchCoverOpacity = isPasswordFocused ? 1 : 0;

    return (
        <div className="relative w-56 h-56 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center" style={{ transform: headTransform, transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
                {/* BODY */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[130px] h-[150px] bg-gradient-to-b from-slate-500 to-slate-600 rounded-[3.5rem] rounded-b-[4rem] shadow-xl z-10 overflow-hidden">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85px] h-[95px] bg-gradient-to-b from-amber-50 to-amber-100 rounded-t-[3rem] rounded-b-[3rem]" />
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
                        <div className="w-5 h-0.5 bg-amber-400 rounded-full" /><div className="w-7 h-0.5 bg-amber-400 rounded-full" /><div className="w-5 h-0.5 bg-amber-400 rounded-full" />
                    </div>
                </div>
                {/* Ear tufts */}
                <div className="absolute -top-1 left-[calc(50%-40px)] w-5 h-10 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-full rotate-[-15deg] z-10" />
                <div className="absolute -top-1 right-[calc(50%-40px)] w-5 h-10 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-full rotate-[15deg] z-10" />
                {/* Head / Face disc */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[115px] h-[78px] bg-gradient-to-b from-slate-400 to-slate-500 rounded-[3rem] z-20">
                    <div className="absolute inset-1 bg-gradient-to-b from-slate-300/20 to-transparent rounded-[2.5rem]" />
                    {/* Left Eye */}
                    <div className={`absolute top-3 left-2.5 w-[42px] h-[42px] bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 ${isTextFocused ? 'scale-110' : ''}`}>
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                            <div className="w-3.5 h-3.5 bg-slate-900 rounded-full relative" style={{ transform: pupilTransform, transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-90" />
                            </div>
                        </div>
                    </div>
                    {/* Right Eye */}
                    <div className={`absolute top-3 right-2.5 w-[42px] h-[42px] bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 ${isTextFocused ? 'scale-110' : ''}`}>
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
                {/* Feet & branch */}
                <div className="absolute bottom-4 left-[calc(50%-26px)] z-5"><div className="flex gap-1"><div className="w-2 h-3.5 bg-amber-500 rounded-b-full" /><div className="w-2 h-4.5 bg-amber-500 rounded-b-full" /><div className="w-2 h-3.5 bg-amber-500 rounded-b-full" /></div></div>
                <div className="absolute bottom-4 right-[calc(50%-26px)] z-5"><div className="flex gap-1"><div className="w-2 h-3.5 bg-amber-500 rounded-b-full" /><div className="w-2 h-4.5 bg-amber-500 rounded-b-full" /><div className="w-2 h-3.5 bg-amber-500 rounded-b-full" /></div></div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-40 h-3 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-full shadow-md z-0" />
            </div>
            <div className="absolute -top-3 -right-5 w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center rotate-12 shadow-md z-30" style={{ animation: 'float-particle 4s ease-in-out infinite' }}><Sparkles className="w-4 h-4 text-amber-500" /></div>
            <div className="absolute bottom-8 -left-7 w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center -rotate-12 shadow-md z-30" style={{ animation: 'float-particle 5s ease-in-out 1s infinite' }}><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /></div>
        </div>
    );
};

const Register: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [inviteToken] = useState<string | null>(searchParams.get('token'));
    const [inviteData, setInviteData] = useState<any | null>(null);
    const [, setTokenValid] = useState<boolean | null>(null);
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
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

    useEffect(() => {
        const checkExistingSession = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) navigate('/dashboard', { replace: true }); };
        checkExistingSession();
        if (inviteToken) {
            const validateToken = async () => {
                try {
                    const response = await attendanceApi.get(`/api/v1/invites/validate/${inviteToken}`);
                    if (response.data.status === 'SUCCESS') { setTokenValid(true); setInviteData(response.data.payload); setCompanyName(response.data.payload.tenantName || 'Joining established organization...'); }
                    else { setTokenValid(false); setError(t('invalid_invite_token')); }
                } catch (err: any) { console.error('Token validation error:', err); setTokenValid(false); setError(err.response?.data?.message || t('invalid_invite_token')); }
            };
            validateToken();
        }
    }, [inviteToken, navigate, t]);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setError(null);
        if (password !== confirmPassword) { setError(t('passwords_dont_match')); return; }
        if (password.length < 8) { setError(t('password_too_short')); return; }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) { setError(t('password_complexity')); return; }
        setLoading(true);
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, company_name: companyName } } });
            if (signUpError) { setError(signUpError.message); setLoading(false); return; }
            if (data.user) {
                try {
                    await attendanceApi.post(`/api/v1/profiles/setup`, { email, fullName, companyName: inviteToken ? 'JOINING_BY_INVITE' : companyName, inviteToken: inviteToken || undefined });
                    await supabase.auth.signOut(); setSuccess(true); setError(null);
                } catch (backendError: any) {
                    console.error('Backend Setup Error:', backendError);
                    const errorMessage = backendError.response?.data?.message || backendError.message || 'Connection error';
                    setError(backendError.response?.status === 409 ? t('company_already_registered') : `${t('register_error_unexpected')}: ${errorMessage}`);
                    await supabase.auth.signOut();
                }
            }
        } catch (err: any) { console.error('Registration error:', err); setError(`${t('register_error_unexpected')}: ${err.message || 'Unknown error'}`); }
        finally { setLoading(false); }
    };

    const isTextFieldFocused = focusedField === 'email' || focusedField === 'fullName' || focusedField === 'companyName';
    const isPasswordFieldFocused = focusedField === 'password' || focusedField === 'confirmPassword';

    const particles = useMemo(() => {
        const seed = [0.15, 0.75, 0.35, 0.85, 0.05, 0.55, 0.25, 0.95, 0.45, 0.65];
        return Array.from({ length: 10 }, (_, i) => ({ x: seed[i] * 100, y: seed[(i + 4) % 10] * 100, size: 4 + seed[(i + 6) % 10] * 8, delay: seed[(i + 2) % 10] * 5, duration: 6 + seed[(i + 8) % 10] * 6 }));
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
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-soft-xl flex flex-col lg:flex-row overflow-hidden min-h-[660px]">
                    {/* Left — Owl */}
                    <div className="hidden lg:flex w-[45%] relative flex-col items-center justify-center p-10 overflow-hidden bg-gradient-to-br from-blue-50/80 to-indigo-50/50">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-blue-200/30" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-blue-100/20" />
                        <div className="animate-owl-bob"><OwlMascot isTextFocused={isTextFieldFocused} isPasswordFocused={isPasswordFieldFocused} /></div>
                        <div className="mt-10 text-center relative z-10 animate-slide-up-d1">
                            <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">{t('workspace_freedom')}</h2>
                            <p className="text-slate-400 text-sm max-w-[260px] mx-auto leading-relaxed">{t('workspace_freedom_desc')}</p>
                        </div>
                    </div>
                    {/* Right — Form */}
                    <div className="w-full lg:w-[55%] p-8 md:p-10 lg:p-12 flex flex-col justify-center relative overflow-y-auto">
                        <div className="w-full max-w-sm mx-auto">
                            <div className="mb-8 flex items-center gap-3 animate-slide-up">
                                <img src={athenaLogo} alt="Athena" className="w-10 h-10 object-contain" />
                                <span className="text-2xl font-bold text-slate-900 tracking-tight">Athena</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight animate-slide-up-d1">{t('create_account')}</h1>
                            <div className="mb-6 animate-slide-up-d2">
                                {inviteData ? (
                                    <span className="text-blue-600 font-semibold flex items-center gap-1.5 text-sm"><Building2 className="w-4 h-4" />{t('invited_to_join', { tenantName: inviteData.tenantName })}</span>
                                ) : (
                                    <p className="text-slate-400 text-sm">{t('enter_details_register')}</p>
                                )}
                            </div>

                            {error && (<div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2.5 animate-shake"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" /><span className="font-medium">{error}</span></div>)}
                            {success && (
                                <div className="mb-4 p-6 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center text-center gap-4" style={{ animation: 'slide-up-fade 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">{inviteToken ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <span className="material-icons text-blue-500 text-2xl">hourglass_empty</span>}</div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 mb-1">{inviteToken ? t('registration_complete', 'Registrazione completata!') : t('registration_pending', 'Registrazione in attesa')}</h3>
                                        <p className="text-slate-500 text-sm">{inviteToken ? t('registration_complete_desc', 'Il tuo account è stato creato. Ora puoi effettuare il login.') : t('registration_pending_desc', 'La tua richiesta è stata inviata. Un amministratore approverà la tua azienda a breve.')}</p>
                                    </div>
                                    <button onClick={() => navigate('/login')} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 group">{t('back_to_login', 'Vai al Login')}<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></button>
                                </div>
                            )}

                            <form onSubmit={handleRegister} className="space-y-4 animate-slide-up-d3">
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="fullName">{t('full_name')}</label>
                                    <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'fullName' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'fullName' ? 'text-blue-500' : 'text-slate-300'}`} /></div>
                                        <input className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="fullName" name="fullName" placeholder="John Doe" required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} onFocus={() => setFocusedField('fullName')} onBlur={() => setFocusedField(null)} disabled={loading || success} />
                                    </div>
                                </div>
                                {!inviteToken && (
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="companyName">{t('company_name')}</label>
                                        <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'companyName' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building2 className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'companyName' ? 'text-blue-500' : 'text-slate-300'}`} /></div>
                                            <input className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="companyName" name="companyName" placeholder="Athena Inc." required={!inviteToken} type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} onFocus={() => setFocusedField('companyName')} onBlur={() => setFocusedField(null)} disabled={loading || success} />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="email">{t('email_address')}</label>
                                    <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-500' : 'text-slate-300'}`} /></div>
                                        <input className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="email" name="email" placeholder="name@athena.com" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} disabled={loading || success} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="password">{t('password')}</label>
                                    <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-500' : 'text-slate-300'}`} /></div>
                                        <input className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="password" name="password" placeholder="••••••••" required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} disabled={loading || success} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 cursor-pointer transition-colors focus:outline-none">{showPassword ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}</button>
                                    </div>
                                    <PasswordStrength password={password} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="confirmPassword">{t('confirm_password')}</label>
                                    <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'confirmPassword' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-blue-500' : 'text-slate-300'}`} /></div>
                                        <input className="block w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="confirmPassword" name="confirmPassword" placeholder="••••••••" required type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} disabled={loading || success} />
                                        {confirmPassword && <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">{password === confirmPassword ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}</div>}
                                    </div>
                                </div>
                                <button type="submit" disabled={loading || success} className={`w-full flex justify-center items-center py-3.5 px-4 mt-2 rounded-2xl text-sm font-bold text-white transition-all duration-300 transform relative overflow-hidden group ${loading || success ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40'}`}>
                                    {!loading && !success && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}
                                    {loading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('signing_up')}</>) : (<span className="flex items-center gap-2">{t('sign_up')}<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>)}
                                </button>
                            </form>
                            <p className="mt-8 text-center text-sm text-slate-400">{t('already_have_account')}{' '}<Link className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" to="/login">{t('sign_in')}</Link></p>
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
        </main>
    );
};

export default Register;
