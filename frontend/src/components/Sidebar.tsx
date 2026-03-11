import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';

const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [userName, setUserName] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('');
    const [userAvatar, setUserAvatar] = useState<string>('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: meData, error: meError } = await supabase
                    .from('profiles')
                    .select('full_name, role_description, avatar_url')
                    .eq('id', user.id);

                if (!meError && meData && meData.length > 0) {
                    if (meData[0].full_name) setUserName(meData[0].full_name);
                    if (meData[0].role_description) setUserRole(meData[0].role_description);
                    if (meData[0].avatar_url) {
                        const rawAvatar = meData[0].avatar_url;
                        setUserAvatar(rawAvatar.startsWith('http') ? rawAvatar : `${import.meta.env.VITE_ATTENDANCE_API_URL}${rawAvatar}`);
                    }
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // The App.tsx router or auth listener should handle redirecting to login
        window.location.href = '/login';
    };

    return (
        <aside className="font-display w-72 bg-surface-light/90 dark:bg-surface-dark/95 backdrop-blur-md border-r border-blue-100 dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] rounded-r-3xl my-4 ml-4 h-[calc(100vh-2rem)]">
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
                <Link to="/team" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/team' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                    <span className={`material-icons text-[22px] transition-colors ${location.pathname !== '/team' ? 'group-hover:text-blue-500' : ''}`}>groups</span>
                    {t('team')}
                </Link>
                <Link to="/office-map" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/office-map' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                    <span className={`material-icons text-[22px] transition-colors ${location.pathname !== '/office-map' ? 'group-hover:text-blue-500' : ''}`}>map</span>
                    {t('office_map')}
                </Link>
                <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#analytics">
                    <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">bar_chart</span>
                    {t('analytics')}
                </a>
            </nav>

            <div className="p-6">
                <div className="relative">
                    {/* Popover Menu */}
                    {showProfileMenu && (
                        <div className="absolute bottom-[calc(100%+12px)] left-0 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 overflow-hidden">
                            <Link
                                to="/profile"
                                onClick={() => setShowProfileMenu(false)}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <span className="material-icons text-[20px] text-blue-500">person</span>
                                {t('profile', 'Profilo')}
                            </Link>
                            <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 mx-4"></div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <span className="material-icons text-[20px]">logout</span>
                                {t('logout', 'Logout')}
                            </button>
                        </div>
                    )}

                    {/* Profile Button */}
                    <div
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-blue-100 dark:border-slate-700 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                alt="User Profile"
                                className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white dark:ring-slate-700"
                                src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=3B82F6&color=fff&rounded=true&bold=true&size=128`}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=3B82F6&color=fff&rounded=true&bold=true&size=128`;
                                }}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{userRole || 'Team Member'}</span>
                            </div>
                        </div>
                        <span className={`material-icons text-slate-400 group-hover:text-blue-500 transition-all ${showProfileMenu ? 'rotate-180' : ''}`}>
                            expand_less
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
