import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useTranslation } from 'react-i18next';
import { useToast } from './Toast';

const Downloads: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { addToast } = useToast();
    const [detectedOS, setDetectedOS] = useState<'windows' | 'macos' | 'linux' | 'other'>('other');
    const [isDownloading, setIsDownloading] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(true);

    const isIt = i18n.language === 'it' || i18n.language.startsWith('it-');


    useEffect(() => {
        const userAgent = globalThis.navigator.userAgent.toLowerCase();
        if (userAgent.includes('win')) setDetectedOS('windows');
        else if (userAgent.includes('mac')) setDetectedOS('macos');
        else if (userAgent.includes('linux')) setDetectedOS('linux');
    }, []);

    const handleDownload = async (platform: 'windows' | 'macos') => {
        setIsDownloading(true);

        try {
            // Fetch the latest release information to get the actual asset URLs
            const response = await fetch('https://api.github.com/repos/goatFrank/athena-presence-parent/releases/tags/v1.0.1');
            
            if (!response.ok) {
                throw new Error('Release not found');
            }

            const releaseData = await response.json();
            const assets = releaseData.assets || [];

            // Find the correct asset based on platform and standard naming
            const assetPatterns = {
                windows: /Athena_.*_(x64|x86_64|en-US)\.msi$/,
                macos: /Athena_.*_(x64|aarch64|arm64|universal)\.dmg$/
            };

            const targetAsset = assets.find((a: any) => assetPatterns[platform].test(a.name));

            if (!targetAsset) {
                // Check if the release exists but assets are still building
                throw new Error('BUILDING');
            }

            // Trigger the download using the browser's native download behavior
            globalThis.location.href = targetAsset.browser_download_url;
            
            addToast(t('download_started'), 'success');
        } catch (error: any) {
            console.error('Download error:', error);
            if (error.message === 'BUILDING') {
                addToast(t('download_building', 'La build è ancora in corso su GitHub. Riprova tra circa 10-15 minuti.'), 'info');
            } else {
                addToast(t('download_error', 'Errore nel download: la versione v1.0.1 non è ancora pronta. Verifica lo stato su GitHub.'), 'error');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 min-h-screen flex w-full overflow-hidden font-display">
            <Sidebar />
            <div className="flex-1 lg:ml-80 flex flex-col h-screen overflow-y-auto scroll-smooth">
                <main className="flex-1 pt-20 px-4 pb-12 md:p-8 lg:p-12">
                    <div className="max-w-5xl mx-auto space-y-12">

                        {/* Header Section */}
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">
                                Desktop Experience
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {t('download_title')}
                            </h1>
                            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                                {t('download_subtitle')}
                            </p>
                        </div>

                        {/* Download Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-lg lg:max-w-none mx-auto w-full px-2">
                            {/* Windows Card */}
                            <div className={`relative group p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border transition-all duration-500 w-full mx-auto ${detectedOS === 'windows' ? 'border-blue-500 shadow-2xl shadow-blue-500/10 lg:scale-[1.02] z-10' : 'border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-soft'}`}>
                                {detectedOS === 'windows' && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                                        {t('recommended')}
                                    </div>
                                )}
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <span className="material-icons text-3xl sm:text-4xl text-blue-600 dark:text-blue-400">window</span>
                                    </div>
                                    <div className="space-y-1 sm:space-y-2">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Windows</h3>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Windows 10, 11 (64-bit)</p>
                                    </div>
                                    <button
                                        onClick={() => handleDownload('windows')}
                                        disabled={isDownloading}
                                        className="w-full sm:w-auto py-3 px-4 sm:px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 mx-auto"
                                    >
                                        <span className="material-icons shrink-0 text-lg sm:text-xl">download</span>
                                        <span className="text-xs sm:text-base whitespace-nowrap">{isDownloading ? t('download_started') : t('download_windows')}</span>
                                    </button>
                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 w-full text-center">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter sm:tracking-wider mb-2">{t('installation_guide')}</p>
                                        <div className="flex justify-center">
                                            <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 flex items-start sm:items-center gap-2 max-w-[200px] sm:max-w-[240px]">
                                                <span className="material-icons text-blue-500 text-xs sm:text-sm shrink-0">info</span>
                                                <span className="leading-tight text-left sm:text-center">{t('windows_guide')}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* macOS Card */}
                            <div className={`relative group p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border transition-all duration-500 w-full mx-auto ${detectedOS === 'macos' ? 'border-blue-500 shadow-2xl shadow-blue-500/10 lg:scale-[1.02] z-10' : 'border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-soft'}`}>
                                {detectedOS === 'macos' && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                                        {t('recommended')}
                                    </div>
                                )}
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <span className="material-icons text-3xl sm:text-4xl text-slate-900 dark:text-white">apple</span>
                                    </div>
                                    <div className="space-y-1 sm:space-y-2">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">macOS</h3>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Intel & Apple Silicon (Universal)</p>
                                    </div>
                                    <button
                                        onClick={() => handleDownload('macos')}
                                        disabled={isDownloading}
                                        className="w-full sm:w-auto py-3 px-4 sm:px-8 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 mx-auto"
                                    >
                                        <span className="material-icons shrink-0 text-lg sm:text-xl">download</span>
                                        <span className="text-xs sm:text-base whitespace-nowrap">{isDownloading ? t('download_started') : t('download_macos')}</span>
                                    </button>
                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 w-full text-center">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter sm:tracking-wider mb-2">{t('installation_guide')}</p>
                                        <div className="flex justify-center">
                                            <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 flex items-start sm:items-center gap-2 max-w-[200px] sm:max-w-[240px]">
                                                <span className="material-icons text-blue-500 text-xs sm:text-sm shrink-0">info</span>
                                                <span className="leading-tight text-left sm:text-center">{t('macos_guide')}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Footer */}
                        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white dark:border-slate-700 rounded-[2rem] p-6 sm:p-8 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
                            <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{t('version')} 1.0.1</h4>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Stable Build • Released Mar 2026</p>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="material-icons text-blue-500 text-lg sm:text-xl">verified_user</span>
                                <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 italic">Digitally Signed & Secure</span>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {isDownloading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center space-y-4 max-w-sm text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('download_started')}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 tracking-tight leading-relaxed">Verifica la cartella dei download del tuo computer tra pochi istanti.</p>
                    </div>
                </div>
            )}
            {/* Maintenance Modal */}
            {showMaintenanceModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700 w-full max-w-md p-8 md:p-10 relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center border border-orange-100 dark:border-orange-800/30">
                                <span className="material-icons text-4xl text-orange-500">engineering</span>
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {isIt ? 'Download in manutenzione!' : 'Downloads under maintenance!'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    {isIt 
                                        ? 'Stiamo aggiornando i server di distribuzione per garantirti la migliore esperienza possibile. Il download potrebbe essere rallentato o temporaneamente non disponibile.' 
                                        : 'We are updating our distribution servers to ensure the best possible experience. Downloads might be slow or temporarily unavailable.'}
                                </p>
                            </div>

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={() => setShowMaintenanceModal(false)}
                                    className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98]"
                                >
                                    {isIt ? 'Ho capito, procedi' : 'Ho capito, procedi'}
                                </button>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                                    {isIt ? 'Athena v1.0.1 • Desktop App' : 'Athena v1.0.1 • Desktop App'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Downloads;
