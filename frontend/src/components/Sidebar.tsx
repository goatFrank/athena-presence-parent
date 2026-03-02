import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';

const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: meData, error: meError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id);

                if (!meError && meData && meData.length > 0 && meData[0].full_name) {
                    setUserName(meData[0].full_name);
                } else {
                    const fallbackName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
                    setUserName(fallbackName);
                }
            }
        };
        fetchUser();
    }, []);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'it' ? 'en' : 'it';
        i18n.changeLanguage(newLang);
    };

    return (
        <aside className="w-72 bg-surface-light/90 dark:bg-surface-dark/95 backdrop-blur-md border-r border-blue-100 dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] rounded-r-3xl my-4 ml-4 h-[calc(100vh-2rem)]">
            <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">Athena</span>
                </div>
                {/* Language Switcher */}
                <button
                    onClick={toggleLanguage}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    {i18n.language.toUpperCase()}
                </button>
            </div>

            <nav className="flex-1 px-6 space-y-3 mt-6">
                <Link to="/dashboard" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/dashboard' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                    <span className={`material-icons text-[22px] transition-colors ${location.pathname !== '/dashboard' ? 'group-hover:text-blue-500' : ''}`}>dashboard</span>
                    {t('dashboard_title')}
                </Link>
                <Link to="/planning" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/planning' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                    <span className={`material-icons text-[22px] transition-colors ${location.pathname !== '/planning' ? 'group-hover:text-blue-500' : ''}`}>calendar_month</span>
                    {t('my_schedule')}
                </Link>
                <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#">
                    <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">groups</span>
                    {t('team')}
                </a>
                <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#">
                    <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">map</span>
                    {t('office_map')}
                </a>
                <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#">
                    <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">bar_chart</span>
                    {t('analytics')}
                </a>
            </nav>

            <div className="p-6">
                <div className="bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-blue-100 dark:border-slate-700">
                    <a className="flex items-center gap-3 hover:opacity-80 transition-opacity" href="#profile">
                        <img alt="User Profile" className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white dark:ring-slate-700" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=3B82F6&color=fff&rounded=true&bold=true&size=128`} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Product Designer</span>
                        </div>
                    </a>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
