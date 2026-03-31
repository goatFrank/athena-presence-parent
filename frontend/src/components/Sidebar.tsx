import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';
import athenaLogo from '../assets/icons/athena.ico';

const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [userName, setUserName] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('');
    const [technicalRole, setTechnicalRole] = useState<string>('');
    const [isSuperadmin, setIsSuperadmin] = useState<boolean>(false);
    const [isTenantAdmin, setIsTenantAdmin] = useState<boolean>(false);
    const [userAvatar, setUserAvatar] = useState<string>('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const scrollToActive = () => {
            if (navRef.current) {
                const path = location.pathname;
                const activeLink = navRef.current.querySelector(`a[href="${path}"]`) as HTMLElement;
                
                if (activeLink) {
                    activeLink.scrollIntoView({ block: 'nearest', behavior: 'instant' as any });
                }
            }
        };

        // Run immediately
        scrollToActive();
        
        // Also run after a short delay to handle cases where layout might still be settling
        const timer = setTimeout(scrollToActive, 100);
        return () => clearTimeout(timer);
    }, [location.pathname, isSuperadmin, isTenantAdmin]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: meData, error: meError } = await supabase
                    .from('profiles')
                    .select('full_name, role_description, avatar_url, role_id, roles:role_id ( name )')
                    .eq('id', user.id);

                if (!meError && meData && meData.length > 0) {
                    const profile = meData[0];
                    if (profile.full_name) setUserName(profile.full_name);
                    if (profile.role_description) setUserRole(profile.role_description);
                    
                    // Check if superadmin
                    const roles = profile.roles as any;
                    const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name;
                    setTechnicalRole(roleName || '');

                    if (roleName === 'SUPERADMIN') {
                        setIsSuperadmin(true);
                    }
                    
                    if (profile.role_id === 3 || profile.role_id === 5 || roleName === 'AMMINISTRATORE_TENANT' || roleName === 'ADMIN_TENANT') {
                        setIsTenantAdmin(true);
                    }
                    
                    if (profile.avatar_url) {
                        const avatar = profile.avatar_url;
                        setUserAvatar(avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_ATTENDANCE_API_URL}${avatar}`);
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
        // Redirect to the landing page after logout
        globalThis.location.href = '/';
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return t('dashboard_title');
        if (path === '/planning') return t('my_schedule');
        if (path === '/team') return t('team');
        if (path === '/office-map') return t('office_map');
        if (path === '/profile') return t('profile');
        if (path === '/departments') return t('departments', 'Dipartimenti');
        if (path === '/employees') return t('employees', 'Dipendenti');
        if (path === '/downloads') return t('download_desktop');
        if (path === '/superadmin/tenants') return t('tenant_approvals');
        if (path === '/superadmin/manage-tenants') return t('manage_tenants');
        if (path === '/settings') return t('settings', 'Impostazioni');
        return 'Athena';
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-[60] flex items-center px-4">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    aria-label="Open Menu"
                >
                    <span className="material-icons text-[28px]">menu</span>
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {getPageTitle()}
                    </h1>
                </div>
                <div className="w-10"></div> {/* Spacer for symmetry */}
            </div>

            {/* Backdrop for Mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            <aside className={`
                font-display bg-surface-light/95 dark:bg-surface-dark/98 backdrop-blur-xl border-blue-100 dark:border-slate-800 
                flex flex-col fixed z-[80] shadow-[0_-8px_32px_rgba(0,0,0,0.1)] lg:shadow-[4px_0_24px_rgba(0,0,0,0.02)]
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                
                /* Desktop: Sidebar fixed on left */
                lg:w-72 lg:h-screen lg:left-0 lg:top-0 lg:rounded-none lg:border-r lg:translate-x-0 lg:max-h-none
                
                /* Mobile: Bottom Sheet */
                xs:w-full bottom-0 left-0 right-0 h-auto max-h-[85vh] rounded-t-[2.5rem] border-t
                ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-full lg:translate-y-0 opacity-0 lg:opacity-100'}
            `}>
                {/* Bottom Sheet Handle (Mobile only) */}
                <div className="lg:hidden flex justify-center p-3 pt-4">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full opacity-50" />
                </div>
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={athenaLogo} alt="Athena" className="w-10 h-10 rounded-2xl shadow-lg" />
                        <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">Athena</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            {i18n.language.toUpperCase()}
                        </button>
                        {/* Close button for mobile */}
                        <button 
                            onClick={closeMobileMenu} 
                            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            aria-label="Close Menu"
                        >
                            <span className="material-icons text-[24px]">close</span>
                        </button>
                    </div>
                </div>

                <nav ref={navRef} className="flex-1 px-6 space-y-2 mt-2 lg:mt-6 overflow-y-auto scroll-smooth pb-10 lg:pb-0">
                    <Link to="/dashboard" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-4 lg:py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/dashboard' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                        <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>dashboard</span>
                        {t('dashboard_title')}
                    </Link>
                    <Link to="/planning" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/planning' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                        <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/planning' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>calendar_month</span>
                        {t('my_schedule')}
                    </Link>
                    <Link to="/team" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/team' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                        <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/team' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>groups</span>
                        {t('team')}
                    </Link>
                    <Link to="/office-map" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/office-map' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                        <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/office-map' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>map</span>
                        {t('office_map')}
                    </Link>
                    {(isSuperadmin || isTenantAdmin) && (
                        <Link to="/departments" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/departments' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                            <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/departments' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>domain</span>
                            {t('departments', 'Dipartimenti')}
                        </Link>
                    )}
                    {(isSuperadmin || isTenantAdmin) && (
                        <Link to="/employees" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/employees' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                            <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/employees' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>badge</span>
                            {t('employees', 'Dipendenti')}
                        </Link>
                    )}
                    {(isSuperadmin || isTenantAdmin) && (
                        <Link to="/settings" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/settings' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                            <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/settings' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>settings</span>
                            {t('settings', 'Impostazioni')}
                        </Link>
                    )}
                    {isSuperadmin && (
                        <>
                            <Link to="/superadmin/tenants" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/superadmin/tenants' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                                <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/superadmin/tenants' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>how_to_reg</span>
                                {t('tenant_approvals')}
                            </Link>
                            <Link to="/superadmin/manage-tenants" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/superadmin/manage-tenants' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                                <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/superadmin/manage-tenants' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>settings_input_component</span>
                                {t('manage_tenants')}
                            </Link>
                        </>
                    )}
                    <a className="flex items-center gap-4 px-5 py-4 lg:py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#analytics">
                        <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">bar_chart</span>
                        {t('analytics')}
                    </a>
                    <Link to="/downloads" onClick={closeMobileMenu} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all ${location.pathname === '/downloads' ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 group hover:shadow-soft'}`}>
                        <span className={`material-icons text-[22px] transition-colors ${location.pathname === '/downloads' ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-500'}`}>desktop_windows</span>
                        {t('download_desktop')}
                    </Link>
                </nav>

                <div className="p-6">
                    <div className="relative">
                        {/* Popover Menu */}
                        {showProfileMenu && (
                            <div className="absolute bottom-[calc(100%+12px)] left-0 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 overflow-hidden">
                                <Link
                                    to="/profile"
                                    onClick={() => { setShowProfileMenu(false); closeMobileMenu(); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <span className="material-icons text-[20px] text-blue-500">person</span>
                                    {t('profile', 'Profilo')}
                                </Link>
                                {isSuperadmin && (
                                    <div className="pt-2">
                                        <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('superadmin', 'Superadmin')}</p>
                                        <nav className="space-y-1">
                                            <Link
                                                to="/superadmin/tenants"
                                                onClick={() => { setShowProfileMenu(false); closeMobileMenu(); }}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${location.pathname === '/superadmin/tenants'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 group'
                                                    }`}
                                            >
                                                <span className={`material-icons text-[20px] transition-colors ${location.pathname === '/superadmin/tenants' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                    how_to_reg
                                                </span>
                                                <span className="truncate">{t('tenant_approvals', 'Approvazioni Aziende')}</span>
                                            </Link>
                                            <Link
                                                to="/superadmin/manage-tenants"
                                                onClick={() => { setShowProfileMenu(false); closeMobileMenu(); }}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${location.pathname === '/superadmin/manage-tenants'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 group'
                                                    }`}
                                            >
                                                <span className={`material-icons text-[20px] transition-colors ${location.pathname === '/superadmin/manage-tenants' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                    settings_input_component
                                                </span>
                                                <span className="truncate">{t('manage_tenants', 'Gestione Aziende')}</span>
                                            </Link>
                                        </nav>
                                    </div>
                                )}
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
                                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {t('role_' + (technicalRole?.toLowerCase().replace(/\s+/g, '_') || 'employee'), userRole || 'Team Member')}
                                    </span>
                                </div>
                            </div>
                            <span className={`material-icons text-slate-400 group-hover:text-blue-500 transition-all ${showProfileMenu ? 'rotate-180' : ''}`}>
                                expand_less
                            </span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
