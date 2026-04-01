import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useTranslation } from 'react-i18next';

type Platform = 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'android-firefox' | 'android-samsung';

interface StepData {
    icon: string;
    title: string;
    description: string;
}

const INSTRUCTIONS: Record<Platform, { label: string; browser: string; os: string; icon: string; color: string; bgColor: string; borderColor: string; steps: StepData[] }> = {
    'ios-safari': {
        label: 'Safari',
        browser: 'Safari',
        os: 'iOS',
        icon: 'travel_explore',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        steps: [
            { icon: 'open_in_browser', title: 'Apri Athena in Safari', description: 'Naviga su questo sito con il browser Safari sul tuo iPhone o iPad.' },
            { icon: 'ios_share', title: 'Tocca il pulsante Condividi', description: 'Premi l\'icona di condivisione (quadrato con freccia verso l\'alto) nella barra degli strumenti in basso.' },
            { icon: 'arrow_downward', title: 'Scorri verso il basso', description: 'Nel menu che appare, scorri verso il basso fino a trovare l\'opzione desiderata.' },
            { icon: 'add_box', title: '"Aggiungi alla schermata Home"', description: 'Tocca "Aggiungi alla schermata Home". Puoi personalizzare il nome, poi conferma con "Aggiungi".' },
            { icon: 'check_circle', title: 'Fatto!', description: 'L\'app Athena apparirà nella tua schermata Home come un\'app nativa, con icona e splash screen dedicati.' },
        ],
    },
    'ios-chrome': {
        label: 'Chrome',
        browser: 'Chrome',
        os: 'iOS',
        icon: 'language',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        steps: [
            { icon: 'open_in_browser', title: 'Apri Athena in Chrome', description: 'Naviga su questo sito usando Google Chrome sul tuo iPhone o iPad.' },
            { icon: 'ios_share', title: 'Tocca il pulsante Condividi', description: 'Premi l\'icona di condivisione (quadrato con freccia verso l\'alto) nell\'angolo in alto a destra o nella barra degli strumenti.' },
            { icon: 'add_box', title: '"Aggiungi alla schermata Home"', description: 'Nel menu che appare, cerca e tocca "Aggiungi alla schermata Home".' },
            { icon: 'edit', title: 'Personalizza il nome', description: 'Modifica il nome se desideri, poi conferma con "Aggiungi".' },
            { icon: 'check_circle', title: 'Fatto!', description: 'L\'app Athena è ora nella tua Home. Verrà aperta in modalità Safari in-app con la sua icona dedicata.' },
        ],
    },
    'android-chrome': {
        label: 'Chrome',
        browser: 'Chrome',
        os: 'Android',
        icon: 'language',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        steps: [
            { icon: 'open_in_browser', title: 'Apri Athena in Chrome', description: 'Naviga su questo sito usando Google Chrome sul tuo dispositivo Android.' },
            { icon: 'more_vert', title: 'Tocca il menu ⋮', description: 'Premi l\'icona con i tre puntini verticali nell\'angolo in alto a destra del browser.' },
            { icon: 'install_mobile', title: '"Installa app" o "Aggiungi alla schermata Home"', description: 'Cerca l\'opzione "Installa app" (se disponibile) oppure "Aggiungi alla schermata Home".' },
            { icon: 'touch_app', title: 'Conferma l\'installazione', description: 'Premi "Installa" nel popup che appare. L\'app verrà aggiunta automaticamente alla tua schermata Home.' },
            { icon: 'check_circle', title: 'Fatto!', description: 'Athena si comporterà come un\'app nativa con la propria finestra, icona e notifiche.' },
        ],
    },
    'android-firefox': {
        label: 'Firefox',
        browser: 'Firefox',
        os: 'Android',
        icon: 'local_fire_department',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        steps: [
            { icon: 'open_in_browser', title: 'Apri Athena in Firefox', description: 'Naviga su questo sito usando Firefox sul tuo dispositivo Android.' },
            { icon: 'more_vert', title: 'Tocca il menu ⋮', description: 'Premi i tre puntini verticali nell\'angolo in basso a destra (o in alto a destra) del browser.' },
            { icon: 'install_mobile', title: '"Installa"', description: 'Cerca l\'opzione "Installa" nel menu. Firefox rileva automaticamente le Progressive Web App.' },
            { icon: 'touch_app', title: 'Conferma', description: 'Tocca "Aggiungi" o "Installa" nella finestra di dialogo. L\'app verrà installata.' },
            { icon: 'check_circle', title: 'Fatto!', description: 'Athena apparirà nella tua schermata Home e nel drawer delle app, come un\'app nativa.' },
        ],
    },
    'android-samsung': {
        label: 'Samsung Internet',
        browser: 'Samsung Internet',
        os: 'Android',
        icon: 'public',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50 dark:bg-violet-900/20',
        borderColor: 'border-violet-200 dark:border-violet-800',
        steps: [
            { icon: 'open_in_browser', title: 'Apri Athena in Samsung Internet', description: 'Naviga su questo sito usando Samsung Internet sul tuo dispositivo Samsung.' },
            { icon: 'menu', title: 'Apri il menu del browser', description: 'Tocca l\'icona del menu (tre linee orizzontali o ≡) in basso a destra.' },
            { icon: 'add_to_home_screen', title: '"Aggiungi pagina a" → "Schermata Home"', description: 'Seleziona "Aggiungi pagina a" e poi scegli "Schermata Home".' },
            { icon: 'edit', title: 'Personalizza e conferma', description: 'Modifica il nome se desideri, poi conferma con "Aggiungi".' },
            { icon: 'check_circle', title: 'Fatto!', description: 'L\'app Athena è ora accessibile direttamente dalla tua Home con un singolo tap.' },
        ],
    },
};

const InstallApp: React.FC = () => {
    const { t } = useTranslation();
    const [detectedOS, setDetectedOS] = useState<'ios' | 'android' | 'desktop'>('desktop');
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('ios-safari');
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 50);
        const ua = globalThis.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(ua)) {
            setDetectedOS('ios');
            setSelectedPlatform('ios-safari');
        } else if (/android/.test(ua)) {
            setDetectedOS('android');
            setSelectedPlatform('android-chrome');
        } else {
            setDetectedOS('desktop');
            setSelectedPlatform('ios-safari');
        }
    }, []);

    const currentInstructions = INSTRUCTIONS[selectedPlatform];

    const platformTabs: { id: Platform; label: string; os: string }[] = [
        { id: 'ios-safari', label: 'Safari', os: 'iOS' },
        { id: 'ios-chrome', label: 'Chrome', os: 'iOS' },
        { id: 'android-chrome', label: 'Chrome', os: 'Android' },
        { id: 'android-firefox', label: 'Firefox', os: 'Android' },
        { id: 'android-samsung', label: 'Samsung', os: 'Android' },
    ];

    const iosTabs = platformTabs.filter(t => t.os === 'iOS');
    const androidTabs = platformTabs.filter(t => t.os === 'Android');

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 min-h-screen flex w-full overflow-hidden font-display">
            <Sidebar />
            <div className="flex-1 lg:ml-80 flex flex-col h-screen overflow-y-auto scroll-smooth">
                <main className="flex-1 pt-20 px-4 pb-12 md:p-8 lg:p-12">
                    <div className={`max-w-4xl mx-auto space-y-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

                        {/* ═══ Header ═══ */}
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">
                                <span className="material-icons text-sm mr-1.5">smartphone</span>
                                Mobile App
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {t('install_app_title', 'Installa Athena')}
                            </h1>
                            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                                {t('install_app_subtitle', 'Aggiungi Athena alla tua schermata Home per un\'esperienza nativa. Nessun App Store richiesto.')}
                            </p>
                        </div>

                        {/* ═══ Auto-detect Banner ═══ */}
                        {detectedOS !== 'desktop' && (
                            <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${detectedOS === 'ios' ? 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800' : 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800'}`}>
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${detectedOS === 'ios' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                    <span className={`material-icons text-xl ${detectedOS === 'ios' ? 'text-blue-600' : 'text-amber-600'}`}>
                                        {detectedOS === 'ios' ? 'phone_iphone' : 'phone_android'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {detectedOS === 'ios' ? 'Dispositivo iOS rilevato' : 'Dispositivo Android rilevato'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('install_app_detected_desc', 'Abbiamo selezionato automaticamente le istruzioni per il tuo dispositivo.')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ═══ Desktop Notice ═══ */}
                        {detectedOS === 'desktop' && (
                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons text-xl text-slate-500">desktop_windows</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {t('install_app_desktop_notice_title', 'Stai navigando da desktop')}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('install_app_desktop_notice_desc', 'Queste istruzioni sono per dispositivi mobili. Apri questa pagina dal tuo smartphone per installare l\'app.')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ═══ OS Section Tabs ═══ */}
                        <div className="space-y-8">

                            {/* iOS Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
                                        <span className="material-icons text-white dark:text-slate-900 text-lg">phone_iphone</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">iPhone / iPad</h2>
                                    {detectedOS === 'ios' && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider">Il tuo</span>
                                    )}
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 px-1">
                                    {iosTabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setSelectedPlatform(tab.id); setExpandedStep(null); }}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${selectedPlatform === tab.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600'
                                                }`}
                                        >
                                            <span className="material-icons text-base">{INSTRUCTIONS[tab.id].icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Android Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                                        <span className="material-icons text-white text-lg">phone_android</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Android</h2>
                                    {detectedOS === 'android' && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">Il tuo</span>
                                    )}
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 px-1">
                                    {androidTabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setSelectedPlatform(tab.id); setExpandedStep(null); }}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${selectedPlatform === tab.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600'
                                                }`}
                                        >
                                            <span className="material-icons text-base">{INSTRUCTIONS[tab.id].icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ═══ Instructions Card ═══ */}
                        <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] border ${currentInstructions.borderColor} shadow-soft overflow-hidden transition-all duration-500`}>
                            {/* Card Header */}
                            <div className={`${currentInstructions.bgColor} px-8 py-6 border-b ${currentInstructions.borderColor}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm`}>
                                        <span className={`material-icons text-2xl ${currentInstructions.color}`}>{currentInstructions.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            {currentInstructions.browser} <span className="text-slate-400 font-medium">su</span> {currentInstructions.os}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {currentInstructions.steps.length} passaggi per installare l'app
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="p-6 md:p-8 space-y-4">
                                {currentInstructions.steps.map((step, index) => {
                                    const isLast = index === currentInstructions.steps.length - 1;
                                    const isExpanded = expandedStep === index;
                                    return (
                                        <div
                                            key={`${selectedPlatform}-${index}`}
                                            className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer ${isExpanded
                                                ? `${currentInstructions.bgColor} ${currentInstructions.borderColor} shadow-md`
                                                : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm'
                                                }`}
                                            onClick={() => setExpandedStep(isExpanded ? null : index)}
                                        >
                                            <div className="flex items-center gap-4 p-5">
                                                {/* Step Number */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black transition-all duration-300 ${isLast
                                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                    : isExpanded
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600'
                                                    }`}>
                                                    {isLast ? (
                                                        <span className="material-icons text-lg">check</span>
                                                    ) : (
                                                        index + 1
                                                    )}
                                                </div>

                                                {/* Step Title */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                                        {step.title}
                                                    </h4>
                                                    {!isExpanded && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                                            {step.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Step Icon */}
                                                <span className={`material-icons text-xl flex-shrink-0 transition-all duration-300 ${isExpanded ? currentInstructions.color : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`}>
                                                    {isExpanded ? 'expand_less' : step.icon}
                                                </span>
                                            </div>

                                            {/* Expanded Description */}
                                            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className="px-5 pb-5 pl-[4.5rem]">
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ═══ Pro Tips ═══ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons text-blue-600 dark:text-blue-400">offline_bolt</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('install_tip_offline_title', 'Accesso rapido')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t('install_tip_offline_desc', 'L\'app si aprirà istantaneamente dalla tua Home, senza barra degli indirizzi, come un\'app nativa.')}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons text-emerald-600 dark:text-emerald-400">security</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('install_tip_secure_title', 'Sicuro e aggiornato')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t('install_tip_secure_desc', 'L\'app si aggiorna automaticamente ogni volta che la apri. Nessun aggiornamento manuale richiesto.')}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons text-amber-600 dark:text-amber-400">storage</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('install_tip_storage_title', 'Zero spazio')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t('install_tip_storage_desc', 'Non occupa spazio sul tuo dispositivo come le app tradizionali. È un collegamento intelligente.')}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons text-violet-600 dark:text-violet-400">delete_sweep</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('install_tip_remove_title', 'Facile da rimuovere')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t('install_tip_remove_desc', 'Per disinstallarla, tieni premuta l\'icona e seleziona "Rimuovi" o "Elimina", come qualsiasi altra app.')}</p>
                                </div>
                            </div>
                        </div>

                        {/* ═══ Help Footer ═══ */}
                        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white dark:border-slate-700 rounded-[2rem] p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="material-icons text-blue-500 text-xl">help_outline</span>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                    {t('install_app_help_title', 'Hai bisogno di aiuto?')}
                                </h4>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg">
                                {t('install_app_help_desc', 'Se il tuo browser non supporta l\'installazione, prova ad usare Safari su iOS o Chrome su Android. Contatta il supporto per ulteriore assistenza.')}
                            </p>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default InstallApp;
