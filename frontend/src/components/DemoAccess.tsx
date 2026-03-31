import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, setRememberMe } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import athenaLogo from '../assets/icons/athena.ico';
import dashboardImg from '../assets/illustrations/dashboard.svg';
import businessDecisionImg from '../assets/illustrations/businessDecision.svg';
import { ArrowRight, ArrowLeft, Shield, Eye, Users, Briefcase, Lock, Sparkles } from 'lucide-react';

const DEMO_ACCOUNTS = {
    manager: {
        email: 'manager@demo.com',
        password: 'demoPassword123!',
        role: 'Manager',
        roleTag: 'Manager Demo',
        icon: Briefcase,
        illustration: businessDecisionImg,
        gradient: 'from-violet-600 via-purple-600 to-indigo-700',
        glowColor: 'purple',
        ringColor: 'ring-purple-500/30',
        hoverRing: 'hover:ring-purple-400/60',
        bgAccent: 'bg-purple-50',
        textAccent: 'text-purple-600',
        borderAccent: 'border-purple-200',
        shadowAccent: 'shadow-purple-500/20',
        features: [
            { icon: '👥', text: 'Visualizza il team del dipartimento' },
            { icon: '📊', text: 'Monitora presenze e statistiche' },
            { icon: '🏢', text: 'Panoramica della sede in tempo reale' },
            { icon: '🔒', text: 'Modalità sola lettura (dati protetti)' },
        ]
    },
    employee: {
        email: 'employee@demo.com',
        password: 'demoPassword123!',
        role: 'Dipendente',
        roleTag: 'Employee Demo',
        icon: Users,
        illustration: dashboardImg,
        gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
        glowColor: 'blue',
        ringColor: 'ring-blue-500/30',
        hoverRing: 'hover:ring-blue-400/60',
        bgAccent: 'bg-blue-50',
        textAccent: 'text-blue-600',
        borderAccent: 'border-blue-200',
        shadowAccent: 'shadow-blue-500/20',
        features: [
            { icon: '📅', text: 'Esplora il calendario presenze' },
            { icon: '👀', text: 'Scopri chi è in ufficio oggi' },
            { icon: '📋', text: 'Naviga il tuo profilo personale' },
            { icon: '🔒', text: 'Modalità sola lettura (dati protetti)' },
        ]
    }
};

type DemoRole = 'manager' | 'employee';

const DemoAccess: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<DemoRole | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hoveredCard, setHoveredCard] = useState<DemoRole | null>(null);

    const handleDemoLogin = async (role: DemoRole) => {
        setLoading(role);
        setError(null);

        const account = DEMO_ACCOUNTS[role];

        try {
            // Sign out any existing session first
            await supabase.auth.signOut();

            // Use sessionStorage for demo (don't persist)
            setRememberMe(false);

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: account.email,
                password: account.password,
            });

            if (signInError) {
                setError(`Errore di accesso: ${signInError.message}`);
                setLoading(null);
                return;
            }

            // Verify the profile exists and tenant is active
            try {
                const profileResponse = await attendanceApi.get('/api/v1/profiles/me');
                const profileData = profileResponse.data.payload;

                if (profileData && (profileData.tenantStatus === 'ACTIVE' || profileData.tenantStatus === 'PENDING')) {
                    navigate('/dashboard');
                } else {
                    setError('Account demo non configurato correttamente. Contatta il supporto.');
                    await supabase.auth.signOut();
                }
            } catch {
                // If the backend is cold-starting, still redirect
                navigate('/dashboard');
            }
        } catch (e: any) {
            setError(`Si è verificato un errore imprevisto: ${e.message || 'Unknown error'}`);
        } finally {
            setLoading(null);
        }
    };

    const renderCard = (role: DemoRole) => {
        const account = DEMO_ACCOUNTS[role];
        const isLoading = loading === role;
        const isOtherLoading = loading !== null && loading !== role;
        const isHovered = hoveredCard === role;
        const IconComponent = account.icon;

        return (
            <div
                key={role}
                className={`relative group cursor-pointer transition-all duration-700 ease-out ${isOtherLoading ? 'opacity-40 scale-95 pointer-events-none' : ''}`}
                onMouseEnter={() => setHoveredCard(role)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => !loading && handleDemoLogin(role)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleDemoLogin(role)}
            >
                {/* Card */}
                <div className={`relative overflow-hidden rounded-[2rem] border-2 transition-all duration-500 ${isHovered ? `${account.borderAccent} ring-8 ${account.ringColor} shadow-2xl ${account.shadowAccent}` : 'border-slate-200 shadow-lg shadow-slate-200/50'} ${isLoading ? 'scale-[0.98]' : ''}`}>

                    {/* Top gradient header */}
                    <div className={`relative h-48 md:h-56 bg-gradient-to-br ${account.gradient} overflow-hidden`}>
                        {/* Animated glow orbs */}
                        <div className={`absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl transition-opacity duration-700 ${isHovered ? 'opacity-60' : 'opacity-30'} ${account.glowColor === 'purple' ? 'bg-purple-300' : 'bg-cyan-300'}`} />
                        <div className={`absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700 ${isHovered ? 'opacity-40' : 'opacity-20'} ${account.glowColor === 'purple' ? 'bg-indigo-300' : 'bg-blue-300'}`} />

                        {/* Floating grid pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                        {/* Role badge */}
                        <div className="absolute top-5 left-5 z-10">
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
                                <Shield className="w-4 h-4 text-white" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">{account.roleTag}</span>
                            </div>
                        </div>

                        {/* Read-only badge */}
                        <div className="absolute top-5 right-5 z-10">
                            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
                                <Eye className="w-3.5 h-3.5 text-white/80" />
                                <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Sola lettura</span>
                            </div>
                        </div>

                        {/* Center illustration */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-700 ${isHovered ? 'scale-110 -translate-y-2' : 'scale-100'}`}>
                            <img
                                src={account.illustration}
                                alt={account.role}
                                className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl object-contain"
                            />
                        </div>

                        {/* Lock icon floating */}
                        <div className={`absolute bottom-4 right-4 w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-500 ${isHovered ? 'scale-110 rotate-12' : 'rotate-0'}`}>
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="bg-white p-6 md:p-8">
                        {/* Role title */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${account.bgAccent} flex items-center justify-center transition-all duration-500 ${isHovered ? 'scale-110 shadow-md' : ''}`}>
                                <IconComponent className={`w-6 h-6 ${account.textAccent}`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Accedi come {account.role}</h3>
                                <p className="text-xs text-slate-400 font-medium">{account.email}</p>
                            </div>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-3 mb-6">
                            {account.features.map((feature, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${isHovered ? `${account.bgAccent} translate-x-1` : 'bg-transparent'}`}
                                    style={{ transitionDelay: `${i * 50}ms` }}
                                >
                                    <span className="text-lg flex-shrink-0">{feature.icon}</span>
                                    <span className="text-sm text-slate-600 font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA button */}
                        <button
                            disabled={!!loading}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-500 flex items-center justify-center gap-3 group/btn ${isLoading
                                ? `bg-gradient-to-r ${account.gradient} text-white shadow-xl ${account.shadowAccent}`
                                : isHovered
                                    ? `bg-gradient-to-r ${account.gradient} text-white shadow-xl ${account.shadowAccent} hover:-translate-y-0.5`
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Accesso in corso...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'rotate-12 scale-110' : ''}`} />
                                    <span>Esplora come {account.role}</span>
                                    <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden relative">

            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '3s' }} />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-15 animate-pulse" style={{ animationDelay: '5s' }} />
            </div>

            {/* Minimal navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/50 py-3">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <img src={athenaLogo} alt="Athena" className="w-8 h-8 transition-transform group-hover:scale-110" />
                            <span className="font-bold text-xl tracking-tight text-slate-900">Athena</span>
                        </Link>
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Torna alla home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide uppercase mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                        </span>
                        Ambiente Demo Interattivo
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                        Esplora Athena{' '}
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                            senza impegno
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        Seleziona un ruolo e immergiti nella piattaforma. Nessuna registrazione necessaria,
                        i dati sono in <span className="text-slate-700 font-semibold">sola lettura</span>.
                    </p>
                </div>

                {/* Error display */}
                {error && (
                    <div className="max-w-lg mx-auto mb-10 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
                        <span className="material-icons text-red-500 text-lg flex-shrink-0">error_outline</span>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Cards grid */}
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
                    {renderCard('manager')}
                    {renderCard('employee')}
                </div>

                {/* Bottom info */}
                <div className="mt-16 text-center">
                    <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">Dati protetti e non modificabili</span>
                        </div>
                        <div className="hidden sm:block w-px h-5 bg-slate-200" />
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">Account reset automatico</span>
                        </div>
                        <div className="hidden sm:block w-px h-5 bg-slate-200" />
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Eye className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">Esperienza completa in lettura</span>
                        </div>
                    </div>
                </div>

                {/* CTA to register */}
                <div className="mt-16 text-center">
                    <p className="text-slate-500 mb-4 font-medium">Ti piace quello che vedi?</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:shadow-slate-300 hover:-translate-y-0.5 group"
                    >
                        Registra la tua Azienda
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200/50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <img src={athenaLogo} alt="Athena" className="w-5 h-5 opacity-60" />
                        <span>© {new Date().getFullYear()} Athena Inc.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link to="/login" className="hover:text-slate-600 transition-colors font-medium">Accedi</Link>
                        <Link to="/register" className="hover:text-slate-600 transition-colors font-medium">Registrati</Link>
                        <Link to="/" className="hover:text-slate-600 transition-colors font-medium">Home</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DemoAccess;
