import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';
import athenaLogo from '../assets/icons/athena-logo-transparent.png';
import { Mail, Lock, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const ResetPassword: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) setIsRecoveryMode(true);
        };
        checkSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => { if (event === 'PASSWORD_RECOVERY') setIsRecoveryMode(true); });
        return () => { subscription.unsubscribe(); };
    }, []);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${globalThis.location.origin}/reset-password` });
            if (error) { setMessage({ type: 'error', text: error.message }); }
            else { setMessage({ type: 'success', text: t('reset_email_sent', 'Abbiamo inviato un link di ripristino alla tua email.') }); }
        } catch (err: any) { setMessage({ type: 'error', text: err.message || 'An unexpected error occurred' }); }
        finally { setLoading(false); }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) { setMessage({ type: 'error', text: t('passwords_dont_match', 'Le password non coincidono') }); return; }
        setLoading(true); setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) { setMessage({ type: 'error', text: error.message }); }
            else { setMessage({ type: 'success', text: t('password_updated_success', 'Password aggiornata con successo! Verrai reindirizzato al login.') }); setTimeout(() => navigate('/login'), 3000); }
        } catch (err: any) { setMessage({ type: 'error', text: err.message || 'An unexpected error occurred' }); }
        finally { setLoading(false); }
    };

    return (
        <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-mesh font-display text-slate-900">
            <style>{`
                @keyframes slide-up-fade { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-4px)} 20%,40%,60%,80%{transform:translateX(4px)} }
                .animate-slide-up { animation: slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) forwards }
                .animate-slide-up-d1 { animation: slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s forwards; opacity: 0 }
                .animate-slide-up-d2 { animation: slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) 0.16s forwards; opacity: 0 }
                .animate-shake { animation: shake 0.5s ease-in-out }
            `}</style>

            {/* Subtle background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[15%] left-[10%] w-[450px] h-[450px] bg-blue-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse" />
                <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-15 animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className={`relative z-10 w-full max-w-md mx-4 transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-soft-xl p-8 md:p-12 relative overflow-hidden">
                    <div className="relative z-10">
                        <Link to="/" className="mb-10 flex items-center gap-3 animate-slide-up group cursor-pointer transition-transform hover:scale-[1.02] active:scale-95">
                            <img src={athenaLogo} alt="Athena" className="w-10 h-10 object-contain" />
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">Athena</span>
                        </Link>

                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 animate-slide-up">
                            <ShieldCheck className="w-7 h-7 text-blue-500" />
                        </div>

                        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight animate-slide-up-d1">
                            {isRecoveryMode ? t('set_new_password', 'Nuova Password') : t('reset_your_password', 'Ripristina Password')}
                        </h1>
                        <p className="text-slate-400 mb-8 text-sm animate-slide-up-d2">
                            {isRecoveryMode 
                                ? t('enter_new_password_desc', 'Inserisci la tua nuova password sicura per accedere.')
                                : t('reset_password_desc', 'Inserisci la tua email e ti invieremo un link per creare una nuova password.')}
                        </p>

                        {message && (
                            <div className={`mb-6 p-4 rounded-2xl border text-sm flex items-start gap-3 ${
                                message.type === 'success' 
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                    : 'bg-red-50 border-red-100 text-red-600 animate-shake'
                            }`}>
                                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        )}

                        {isRecoveryMode ? (
                            <form onSubmit={handleUpdatePassword} className="space-y-5 animate-slide-up-d2">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="password">{t('new_password', 'Nuova Password')}</label>
                                    <div className={`relative group rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-500' : 'text-slate-300'}`} />
                                        </div>
                                        <input className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} disabled={loading} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="confirmPassword">{t('confirm_password', 'Conferma Password')}</label>
                                    <div className={`relative group rounded-2xl transition-all duration-300 ${focusedField === 'confirmPassword' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-blue-500' : 'text-slate-300'}`} />
                                        </div>
                                        <input className="block w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="confirmPassword" type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} disabled={loading} />
                                        {confirmPassword && (
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                {password === confirmPassword ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className={`w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-bold text-white transition-all duration-300 transform relative overflow-hidden group ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40'}`}>
                                    {!loading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}
                                    {loading ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('updating', 'Aggiornamento...')}</>
                                    ) : t('update_password', 'Aggiorna Password')}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRequestReset} className="space-y-6 animate-slide-up-d2">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400" htmlFor="email">{t('email_address')}</label>
                                    <div className={`relative group rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-blue-500/30 ring-offset-1 ring-offset-white' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className={`w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-500' : 'text-slate-300'}`} />
                                        </div>
                                        <input className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-300 text-sm font-medium" id="email" type="email" placeholder="name@athena.com" required value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} disabled={loading} />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className={`w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-bold text-white transition-all duration-300 transform relative overflow-hidden group ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40'}`}>
                                    {!loading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}
                                    {loading ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('sending', 'Invio in corso...')}</>
                                    ) : t('send_reset_link', 'Invia link di ripristino')}
                                </button>
                            </form>
                        )}

                        <div className="mt-10 text-center">
                            <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 group transition-colors">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                {t('back_to_login', 'Torna al Login')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ResetPassword;
