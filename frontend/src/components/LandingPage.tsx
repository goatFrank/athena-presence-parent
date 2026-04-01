import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CardSwap, { Card } from './CardSwap';
import ElectricBorder from './ElectricBorder';
import SplitText from './SplitText';
import CurvedLoop from './CurvedLoop';
import TrueFocus from './TrueFocus';
import {
  Building2,
  Users,
  UserCheck,
  CalendarDays,
  MapPin,
  TrendingUp,
  ArrowRight,
  Menu,
  X,
  Monitor,
  Smartphone,
  Download
} from 'lucide-react';

import dashboardImg from '../assets/illustrations/dashboard.svg';
import businessDecisionImg from '../assets/illustrations/businessDecision.svg';
import workingRemotelyImg from '../assets/illustrations/workingRemotely.svg';
import athenaLogo from '../assets/icons/athena-logo-transparent.png';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lineHeight, setLineHeight] = useState(0);
  const flowSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      if (flowSectionRef.current) {
        const rect = flowSectionRef.current.getBoundingClientRect();
        // The element is completely above the viewport
        if (rect.bottom < 0) {
          setLineHeight(100);
        } else if (rect.top > window.innerHeight) {
          // The element is completely below the viewport
          setLineHeight(0);
        } else {
          // The element is in the viewport
          // Start filling when the top of the section hits the middle of the screen
          const startPoint = window.innerHeight / 2;
          const scrollDistance = startPoint - rect.top;
          const totalDistance = rect.height;

          if (scrollDistance < 0) {
            setLineHeight(0);
          } else {
            let percentage = (scrollDistance / totalDistance) * 100;
            // Add a small buffer so it completes slightly before the section ends
            percentage = Math.min(100, Math.max(0, percentage * 1.2));
            setLineHeight(percentage);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialization
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden relative">

      {/* 
        ========================================
        REACT BITS: BACKGROUND (Opzionale)
        ========================================
        Inserisci qui il componente <FuzzyOverlay /> per dare una 
        leggera texture granulosa al background e un look "premium SaaS"
        simile a Stripe/Linear.
        Esempio: <FuzzyOverlay opacity={0.03} /> 
      */}

      {/* --- NAVBAR --- */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/70 backdrop-blur-lg shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 group">
              <div className="relative">
                <img src={athenaLogo} alt="Athena" className="w-9 h-9 object-contain" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Athena</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Come funziona</a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
              <Link to="/demo" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Demo</Link>
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Accedi
              </Link>
              {/* 
                ========================================
                REACT BITS: BUTTON ANIMATION
                ========================================
                In futuro sostituisci questo div/Link con <StarBorder> o 
                simili <ShinyButton> per l'high impact design.
              */}
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-200 active:scale-95 flex items-center gap-2"
              >
                Inizia gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 lg:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-all duration-500" onClick={() => setMobileMenuOpen(false)}></div>
        <div className={`absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out border-l border-slate-200 dark:border-slate-800 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img src={athenaLogo} alt="Athena" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">Athena</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-900 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <nav className="flex flex-col space-y-6">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors">Come funziona</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors">Features</a>
              <Link to="/demo" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors">Demo</Link>
            </nav>
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors border border-slate-200 dark:border-slate-700 rounded-2xl">Accedi</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-white bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                Inizia gratis <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Hero Left Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Gestione Presenze Intelligente
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.2] relative text-left">
                <SplitText
                  text="Gestisci le presenze del tuo team, ovunque."
                  className="block"
                  delay={40}
                  duration={1}
                  ease="power4.out"
                  textAlign="left"
                />
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
                La piattaforma per organizzare la settimana lavorativa del tuo team. Pianifica i giorni in ufficio e da remoto, visualizza chi è presente e gestisci le presenze con semplicità.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-slate-900 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:shadow-slate-300 flex items-center justify-center gap-2 group">
                  Registra la tua Azienda
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/demo" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-base font-semibold hover:bg-slate-50 transition-all flex items-center justify-center">
                  Guarda la Demo
                </Link>
              </div>
            </div>

            {/* Hero Right - Dashboard Preview & Illustration */}
            <div className="relative lg:h-[600px] flex items-center justify-center mt-12 lg:mt-0">

              {/* Background abstract shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-100/40 via-purple-50/40 to-transparent rounded-full blur-3xl -z-10"></div>

              <div className="relative w-full h-[400px] lg:h-[500px] flex items-center justify-center perspective-1000">
                <CardSwap
                  width={340}
                  height={380}
                  cardDistance={35}
                  verticalDistance={40}
                  delay={4000}
                  pauseOnHover={true}
                >
                  <Card>
                    <div className="flex flex-col h-full w-full bg-white text-slate-900 p-8 rounded-[24px] group">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:bg-indigo-600">
                        <CalendarDays className="w-7 h-7 text-indigo-600 transition-colors group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 tracking-tight">Pianifica la Settimana</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Ogni dipendente indica i giorni in cui sarà in ufficio o da remoto. Il manager ha la visione completa del team.
                      </p>
                    </div>
                  </Card>

                  <Card>
                    <div className="flex flex-col h-full w-full bg-white text-slate-900 p-8 rounded-[24px] group">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:bg-emerald-600">
                        <UserCheck className="w-7 h-7 text-emerald-600 transition-colors group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 tracking-tight">Visibilità del Team</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Sai sempre chi è in ufficio oggi, domani e per tutta la settimana. Ottieni una dashboard chiara sulle presenze.
                      </p>
                    </div>
                  </Card>

                  <Card>
                    <div className="flex flex-col h-full w-full bg-white text-slate-900 p-8 rounded-[24px] group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-0"></div>
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:bg-slate-800">
                        <MapPin className="w-7 h-7 text-slate-700 transition-colors group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 tracking-tight">Mappa dell'Ufficio</h3>
                      <p className="text-slate-600 leading-relaxed relative z-10">
                        Visualizza la planimetria del tuo ufficio e scopri dove si trovano i colleghi presenti in sede.
                      </p>
                    </div>
                  </Card>
                </CardSwap>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LOW-OPACITY LOGOs / TRUST SECTION --- */}
      <section className="border-y border-slate-200/60 bg-white py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-widest">Progettato per team moderni</p>
        </div>
        <CurvedLoop
          marqueeText="Pianificazione Settimanale ✦ Dashboard Presenze ✦ Mappa Ufficio ✦ Gestione Team ✦ App Desktop ✦ App Mobile ✦ Multi-Dipartimento ✦"
          speed={1.5}
          curveAmount={150}
          direction="left"
          interactive
        />
      </section>

      {/* --- COME FUNZIONA (Gerarchia / Flow) --- */}
      <section id="how-it-works" className="py-24 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-3">Flusso Operativo</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
              <TrueFocus
                sentence="Tre livelli,|un'unica dashboard"
                separator="|"
                manualMode={false}
                blurAmount={4}
                borderColor="#4f46e5"
                glowColor="rgba(79, 70, 229, 0.4)"
                animationDuration={1}
                pauseBetweenAnimations={2}
                className="text-3xl md:text-5xl font-bold text-slate-900"
              />
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Athena rispecchia la struttura organizzativa della tua azienda: ogni ruolo ha strumenti e visibilità dedicati.
            </p>
          </div>

          <div ref={flowSectionRef} className="space-y-24 relative mt-16">
            {/* Struttura della linea verticale - visibile solo Desktop */}
            <div className="absolute left-[50%] top-6 bottom-6 w-1 bg-slate-100 hidden lg:block -translate-x-1/2 rounded-full overflow-hidden">
              {/* Linea colorata animata */}
              <div
                className="w-full bg-gradient-to-b from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 ease-out rounded-full"
                style={{ height: `${lineHeight}%` }}
              ></div>
            </div>

            {/* Step 1: Admin */}
            {/* 
              ========================================
              REACT BITS: SCROLL ANIMATIONS
              ========================================
              Applica <ScrollReveal> o <FadeContent> ai div sottostanti 
              per farli apparire progressivamente durante lo scroll
            */}
            <div className="grid lg:grid-cols-2 gap-10 items-center relative group">
              <div className="lg:text-right lg:pr-16 order-2 lg:order-1 transition-all duration-500 group-hover:-translate-x-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 relative z-10 lg:ml-auto shadow-sm ring-1 ring-indigo-100/50">
                  <Building2 className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">1. Amministratore</h4>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Registra l'azienda, crea i dipartimenti, invita i dipendenti e i manager.
                  Ha la visione completa su presenze, team e organizzazione.
                </p>
              </div>
              <div className="order-1 lg:order-2 lg:pl-16 flex justify-start">
                {/* Admin Setup Illustration */}
                <div className="w-full max-w-md aspect-[4/3] bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center p-8 shadow-xl shadow-slate-200/50 transition-transform group-hover:scale-105 duration-500">
                  <img
                    src={dashboardImg}
                    alt="Dashboard Setup"
                    className="w-full h-auto max-h-48 drop-shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Manager */}
            <div className="grid lg:grid-cols-2 gap-10 items-center relative group">
              <div className="order-2 lg:order-2 lg:pl-16 transition-all duration-500 group-hover:translate-x-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mb-6 relative z-10 shadow-sm ring-1 ring-purple-100/50">
                  <Users className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-3">2. Manager</h4>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Il manager supervisiona il proprio dipartimento: visualizza la pianificazione del team,
                  verifica chi è in ufficio e monitora le presenze settimanali dei propri collaboratori.
                </p>
              </div>
              <div className="order-1 lg:order-1 flex justify-end lg:pr-16">
                {/* Manager / Team Approval Illustration */}
                <div className="w-full max-w-md aspect-[4/3] bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center p-8 shadow-xl shadow-slate-200/50 transition-transform group-hover:scale-105 duration-500">
                  <img
                    src={businessDecisionImg}
                    alt="Manager making decisions"
                    className="w-full h-auto max-h-48 drop-shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Dipendente */}
            <div className="grid lg:grid-cols-2 gap-10 items-center relative group">
              <div className="lg:text-right lg:pr-16 order-2 lg:order-1 transition-all duration-500 group-hover:-translate-x-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-6 relative z-10 lg:ml-auto shadow-sm ring-1 ring-emerald-100/50">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-3">3. Dipendente</h4>
                <p className="text-slate-600 leading-relaxed text-lg">
                  I dipendenti pianificano la propria settimana indicando i giorni in ufficio e da remoto.
                  Possono consultare la mappa dell'ufficio e vedere chi è presente, tutto da web o dall'app.
                </p>
              </div>
              <div className="order-1 lg:order-2 lg:pl-16 flex justify-start">
                {/* Employee Smart Working Illustration */}
                <div className="w-full max-w-md aspect-[4/3] bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center p-8 shadow-xl shadow-slate-200/50 transition-transform group-hover:scale-105 duration-500">
                  <img
                    src={workingRemotelyImg}
                    alt="Employee working remotely"
                    className="w-full h-auto max-h-48 drop-shadow-md"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-32 bg-slate-50 relative border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4">Vantaggi Principali</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">Tutto ciò che serve, <br />niente di superfluo</h3>
            </div>
            <div>
              <Link to="/register" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 bg-indigo-50 px-5 py-2.5 rounded-full hover:bg-indigo-100 transition-colors">
                Prova gratuitamente <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 
                ========================================
                REACT BITS: SPOTLIGHT / TILT CARDS
                ========================================
                Implementare qui <SpotlightCard> o <TiltCard> di React Bits al posto
                dei semplici div per avere l'effetto bagliore dinamico 
                al passaggio del cursore (effetto tipico di Vercel/Linear).
              */}
            {[
              { icon: CalendarDays, title: "Pianificazione Settimanale", desc: "Ogni membro del team indica se sarà in ufficio o da remoto, giorno per giorno. Il manager ha sempre il quadro completo." },
              { icon: MapPin, title: "Mappa dell'Ufficio", desc: "Visualizza la planimetria della sede per vedere chi è presente e dove si trova, in modo semplice e intuitivo." },
              { icon: TrendingUp, title: "Dashboard Presenze", desc: "Una panoramica chiara e in tempo reale su chi è in ufficio, chi lavora da remoto e le presenze del giorno." },
            ].map((feature) => (
              <ElectricBorder
                key={feature.title}
                color="#4f46e5"
                speed={0.5}
                chaos={0.15}
                thickness={2}
                style={{ borderRadius: 32 }}
                className="h-full"
              >
                <div className="bg-white rounded-[2rem] p-10 border border-slate-200 hover:border-indigo-300 transition-all duration-300 group cursor-default relative overflow-hidden h-full">
                  {/* Glow di background interno per le feature card */}
                  <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-bl from-indigo-50 to-transparent w-full h-full pointer-events-none rounded-tr-[2rem]"></div>

                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100 group-hover:border-indigo-500 group-hover:scale-110">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-4 relative z-10">{feature.title}</h4>
                  <p className="text-slate-600 text-lg leading-relaxed relative z-10">{feature.desc}</p>
                </div>
              </ElectricBorder>
            ))}
          </div>
        </div>
      </section>

      {/* --- DOWNLOAD APPS SECTION --- */}
      <section className="py-24 bg-white border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4">Disponibile Ovunque</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">Usa Athena da qualsiasi dispositivo</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Accedi da browser, scarica l'app desktop per Windows e macOS, oppure installa l'app mobile direttamente dal tuo smartphone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Desktop App Card */}
            <div className="relative group p-8 md:p-10 rounded-[2rem] bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all duration-500 hover:shadow-xl">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500">
                  <Monitor className="w-10 h-10 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-slate-900">App Desktop</h4>
                  <p className="text-sm text-slate-500">Windows & macOS</p>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Scarica l'applicazione nativa per il tuo computer. Disponibile per Windows 10/11 e macOS (Intel & Apple Silicon).
                </p>
                <Link
                  to="/downloads"
                  className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <Download className="w-5 h-5" />
                  Scarica per Desktop
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Mobile App Card */}
            <div className="relative group p-8 md:p-10 rounded-[2rem] bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all duration-500 hover:shadow-xl">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-500">
                  <Smartphone className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-slate-900">App Mobile</h4>
                  <p className="text-sm text-slate-500">iPhone, iPad & Android</p>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Installa Athena sulla schermata Home del tuo smartphone. Nessun App Store richiesto, basta un tap dal browser.
                </p>
                <Link
                  to="/install-app"
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <Smartphone className="w-5 h-5" />
                  Installa su Mobile
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="py-32 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat mix-blend-overlay"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight">
            Pronto a organizzare il tuo team?
          </h2>
          <p className="text-xl text-indigo-200/80 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Registra la tua azienda e inizia subito a gestire le presenze in modo semplice e trasparente. Gratuito, senza carta di credito.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/register" className="bg-indigo-500 text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-indigo-400 transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1">
              Registra la tua Azienda
            </Link>
            <Link to="/demo" className="bg-transparent text-white border border-white/20 px-10 py-5 rounded-full text-lg font-bold hover:bg-white/10 transition-all">
              Prova la Demo
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#0b0f19] pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6 opacity-90 group">
                <div className="relative">
                  <img src={athenaLogo} alt="Athena" className="w-9 h-9 object-contain" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-white">Athena</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-8 leading-relaxed text-sm">
                La piattaforma per organizzare le presenze in ufficio e da remoto. Pianificazione settimanale,
                visibilità del team e mappa dell'ufficio in un unico strumento.
              </p>

              {/* Form Newsletter veloce */}
              <form className="flex gap-2 max-w-xs group" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Iscriviti alla newsletter" className="bg-slate-800/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 transition-colors group-hover:scale-105 active:scale-95">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            <div className="md:col-span-1">
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Prodotto</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Registrati</Link></li>
                <li><Link to="/demo" className="hover:text-indigo-400 transition-colors">Demo</Link></li>
                <li><Link to="/downloads" className="hover:text-indigo-400 transition-colors">App Desktop</Link></li>
                <li><Link to="/install-app" className="hover:text-indigo-400 transition-colors">App Mobile</Link></li>
              </ul>
            </div>
            <div className="md:col-span-1">
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Funzionalità</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><a href="#how-it-works" className="hover:text-indigo-400 transition-colors">Come Funziona</a></li>
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Funzionalità</a></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Accedi</Link></li>
              </ul>
            </div>
            <div className="md:col-span-1">
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Legale</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">Termini e Condizioni</Link></li>
                <li><Link to="/cookies" className="hover:text-indigo-400 transition-colors">Gestione Cookie</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 pt-8 gap-4 font-medium">
            <p>&copy; {new Date().getFullYear()} Athena Presence. Gestione presenze per team moderni.</p>
            <div className="flex gap-6">
              <Link to="/twitter" className="hover:text-white transition-colors">Twitter</Link>
              <Link to="/linkedin" className="hover:text-white transition-colors">LinkedIn</Link>
              <Link to="/github" className="hover:text-white transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
