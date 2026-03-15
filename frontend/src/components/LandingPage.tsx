import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  UserCheck, 
  CalendarDays, 
  MapPin, 
  TrendingUp, 
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

import heroImg from '../assets/illustrations/hero.svg';
import dashboardImg from '../assets/illustrations/dashboard.svg';
import businessDecisionImg from '../assets/illustrations/businessDecision.svg';
import workingRemotelyImg from '../assets/illustrations/workingRemotely.svg';

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
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/70 backdrop-blur-lg shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                A
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Athena</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Come funziona</a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Prezzi</a>
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
                Il Futuro dell'Hybrid Work
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                {/* 
                  ========================================
                  REACT BITS: TEXT ANIMATION
                  ========================================
                  Qui inserisci <SplitText> o <BlurText> da React Bits!
                  Il testo "Sincronizza il tuo team" entra parola per parola.
                */}
                Sincronizza il tuo team,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  ovunque si trovi.
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
                La piattaforma B2B per gestire in modo intelligente presenze in ufficio e smart working. Dai più potere ai manager, flessibilità ai dipendenti e controllo all'azienda.
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

              <div className="relative w-full max-w-xl group perspective-1000">
                {/* Main Dashboard floating card */}
                <div className="relative bg-white p-2 rounded-2xl shadow-2xl border border-slate-200/60 transform transition-all duration-700 hover:rotate-y-[-5deg] hover:rotate-x-[5deg] hover:scale-[1.02]">
                  
                  {/* Fake Browser/App Header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                      <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                      <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    </div>
                    <div className="mx-auto w-1/2 h-2 rounded-full bg-slate-200/50"></div>
                  </div>

                  {/* App Content Area with SVG */}
                  <div className="bg-slate-50/50 p-8 rounded-b-xl flex justify-center items-center aspect-[4/3] overflow-hidden relative">
                    <img 
                      src={heroImg} 
                      alt="Athena Dashboard Environment" 
                      className="w-full max-w-md h-auto drop-shadow-xl relative z-10 transition-transform duration-700 group-hover:scale-105" 
                    />
                    
                    {/* Decorative internal blobs */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200/30 rounded-full blur-2xl"></div>
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl"></div>
                  </div>
                </div>

                {/* Floating Metric Card 1 */}
                <div className="absolute -left-12 bottom-12 bg-white px-5 py-4 rounded-xl shadow-xl border border-slate-100 transform -rotate-6 hover:rotate-0 transition-all duration-300 hidden md:block group-hover:-translate-y-2 group-hover:-translate-x-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <TrendingUp className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Operatività</p>
                      <p className="text-lg font-bold text-slate-800">98% in sede</p>
                    </div>
                  </div>
                </div>

                {/* Floating Metric Card 2 */}
                <div className="absolute -right-8 top-16 bg-white px-5 py-4 rounded-xl shadow-xl border border-slate-100 transform rotate-3 hover:rotate-0 transition-all duration-300 hidden md:block group-hover:-translate-y-2 group-hover:translate-x-2">
                   <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <UserCheck className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Approvazioni</p>
                      <p className="text-lg font-bold text-slate-800">12 Smart</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LOW-OPACITY LOGOs / TRUST SECTION --- */}
      <section className="border-y border-slate-200/60 bg-white py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest">Scelto dai team più innovativi</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Sostituisci con veri loghi vettoriali di aziende */}
            <div className="text-xl font-bold tracking-tighter">Acme Corp</div>
            <div className="text-xl font-bold tracking-tighter italic">Globex</div>
            <div className="text-xl font-bold tracking-tighter uppercase">Soylent</div>
            <div className="text-xl font-bold tracking-tighter">Initech</div>
          </div>
        </div>
      </section>

      {/* --- COME FUNZIONA (Gerarchia / Flow) --- */}
      <section id="how-it-works" className="py-24 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-3">Flusso Operativo</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Tre livelli, un'unica dashboard</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Abbiamo progettato un sistema gerarchico che rispetta la struttura reale della tua azienda, 
              delegando la complessità e semplificando le decisioni.
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
                  Registra l'azienda, configura le policy per lo smart working, 
                  imposta la capienza delle sedi e invita i dipendenti.
                  L'admin ha la visione macro su tutta l'organizzazione.
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
                  Riceve la delega dall'amministratore per gestire team specifici.
                  Approva le richieste di smart working, monitora la presenza
                  del proprio gruppo e garantisce la copertura in ufficio.
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
                  Pianifica la propria settimana in due clic, segnalando i giorni 
                  da casa o prenotando la scrivania in ufficio. Interfaccia pulita e mobile-first.
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
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">Ottimizza gli spazi, <br/>massimizza la produttività</h3>
            </div>
            <div>
               <Link to="/features" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 bg-indigo-50 px-5 py-2.5 rounded-full hover:bg-indigo-100 transition-colors">
                  Scopri tutte le features <ArrowRight className="w-4 h-4" />
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
              { icon: CalendarDays, title: "Pianificazione Agile", desc: "Dipendenti e manager definiscono la struttura settimanale in blocco con pochi tap da smartphone." },
              { icon: MapPin, title: "Mappa Interattiva 2D", desc: "Visualizza i planimetri degli uffici reali per sapere non solo chi è in sede, ma a quale scrivania lavora." },
              { icon: TrendingUp, title: "Analytics Real-Time", desc: "Dati ed esportazioni custom per HR per misurare trend di occupazione e abbattere costi inutili sulle location." },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-[2rem] p-10 border border-slate-200 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-300 group cursor-default relative overflow-hidden">
                {/* Glow di background interno per le feature card */}
                <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-bl from-indigo-50 to-transparent w-full h-full pointer-events-none rounded-tr-[2rem]"></div>

                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100 group-hover:border-indigo-500 group-hover:scale-110">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4 relative z-10">{feature.title}</h4>
                <p className="text-slate-600 text-lg leading-relaxed relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="py-32 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950"></div>
        {/*
           ========================================
           REACT BITS: BACKGROUND PARTICLES
           ========================================
           Inserisci qui un background mozzafiato come <StarrySky> 
           o <Particles> (React Bits) per dare profondità spaziale e un effetto WoW al CTA finale.
        */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat mix-blend-overlay"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight">
            Pronto a trasformare la tua organizzazione?
          </h2>
          <p className="text-xl text-indigo-200/80 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Unisciti alle aziende all'avanguardia che hanno già semplificato la gestione dei loro team ibridi. Provalo gratis senza carta di credito.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
             <Link to="/register" className="bg-indigo-500 text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-indigo-400 transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1">
                Registra la tua Azienda
             </Link>
             <Link to="/contact" className="bg-transparent text-white border border-white/20 px-10 py-5 rounded-full text-lg font-bold hover:bg-white/10 transition-all">
                Contatta le Vendite
             </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#0b0f19] pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6 opacity-90">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">A</div>
                <span className="font-bold text-2xl tracking-tight text-white">Athena</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-8 leading-relaxed text-sm">
                Software B2B premium per gestire presenze e workweek ibride. Massima trasparenza per l'azienda, 
                fluidità e benessere per chi lavora.
              </p>
              
              {/* Form Newsletter veloce */}
              <form className="flex gap-2 max-w-xs group" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Iscriviti alla newsletter" className="bg-slate-800/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 transition-colors group-hover:scale-105 active:scale-95">
                  <ArrowRight className="w-5 h-5"/>
                </button>
              </form>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Prodotto</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><Link to="/features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-indigo-400 transition-colors">Prezzi</Link></li>
                <li><Link to="/integrations" className="hover:text-indigo-400 transition-colors">Integrazioni</Link></li>
                <li><Link to="/changelog" className="hover:text-indigo-400 transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div className="md:col-span-1">
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Risorse</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><Link to="/blog" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
                <li><Link to="/docs" className="hover:text-indigo-400 transition-colors">Documentazione API</Link></li>
                <li><Link to="/community" className="hover:text-indigo-400 transition-colors">Community</Link></li>
                <li><Link to="/help" className="hover:text-indigo-400 transition-colors">Help Center</Link></li>
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
            <p>&copy; {new Date().getFullYear()} Athena Inc. Made with ❤️ per team ibridi.</p>
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
