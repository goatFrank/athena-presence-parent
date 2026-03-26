import React from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Footer from './Footer';
import mapIllustration from '../assets/illustrations/map.svg';

const OfficeMap: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen">
            <div className="flex w-full overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col ml-0 md:ml-80 pt-20 px-0 pb-0 md:mr-8 md:pt-0 md:px-0 overflow-y-auto h-screen scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <main className="max-w-5xl mx-auto w-full px-4 md:px-10 py-10 flex-1">
                        {/* Title and Breadcrumbs */}
                        <div className="mb-8 mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-[#0e121b] dark:text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                        <span className="material-symbols-outlined text-[20px] sm:text-[24px]">map</span>
                                    </div>
                                    <span className="truncate">{t('office_map', 'Athena Office Location')}</span>
                                </h1>
                                <p className="text-[#4e6797] dark:text-slate-400 mt-2 font-medium text-sm sm:text-base">
                                    {t('office_map_subtitle', 'Find your way to our main headquarters')}
                                </p>
                            </div>
                            <div className="hidden lg:flex flex-shrink-0">
                                <img 
                                    src={mapIllustration} 
                                    alt="Remote Working Illustration" 
                                    className="h-24 w-auto object-contain drop-shadow-md hover:-translate-y-1 transition-transform duration-300"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="rgba(0,0,0,0.05)" rx="16"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">map.svg</text></svg>';
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Interactive Google Map Section */}
                        <div className="relative group mb-10">
                            <div className="w-full h-[300px] sm:h-[450px] rounded-[2rem] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-[#e2e8f0] dark:border-slate-700 relative bg-slate-200 dark:bg-slate-800">
                                <iframe
                                    title="Google Map"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019576356561!2d-122.39575088468164!3d37.79011317975661!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858063071bb219%3A0x6bba3bcaf4cbae!2s123%20Mission%20St%2C%20San%20Francisco%2C%20CA%2094105%2C%20USA!5e0!3m2!1sen!2sit!4v1700000000000!5m2!1sen!2sit"
                                ></iframe>
                            </div>
                        </div>

                        {/* Address Card */}
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 w-full mb-10 group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex gap-4 sm:gap-5 items-center">
                                    <div className="bg-blue-50 dark:bg-slate-700 p-3 sm:p-4 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <span className="material-icons text-2xl sm:text-3xl">apartment</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-[#0e121b] dark:text-white mb-1.5">{t('main_headquarters', 'Main Headquarters')}</h3>
                                        <p className="text-[#4e6797] dark:text-slate-400 text-sm sm:text-[15px] font-medium leading-relaxed">
                                            123 Athena Tech Plaza, Floor 12-16<br/>
                                            San Francisco, CA 94105
                                        </p>
                                    </div>
                                </div>
                                <a 
                                    href="https://maps.google.com/?q=San+Francisco,+CA" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-[20px]">directions</span>
                                    {t('get_directions', 'Get Directions')}
                                </a>
                            </div>
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default OfficeMap;
