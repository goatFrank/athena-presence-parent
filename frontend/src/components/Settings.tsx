import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import Footer from './Footer';
import { useToast } from './Toast';

interface Profile {
    id: string;
    fullName: string;
    role: string | null;
    roleId: number | null;
    tenantId: number | null;
    tenantName: string | null;
    avatarUrl: string | null;
}

const Settings: React.FC = () => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [tenantName, setTenantName] = useState('');
    const [originalTenantName, setOriginalTenantName] = useState('');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingTenant, setIsSavingTenant] = useState(false);
    const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        const fetchSettingsData = async () => {
            setIsLoading(true);
            try {
                const sessionResponse = await supabase.auth.getSession();
                if (!sessionResponse.data.session?.access_token) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const meResponse = await attendanceApi.get('/api/v1/profiles/me');
                if (meResponse.status === 200 && meResponse.data.payload) {
                    const me = meResponse.data.payload;
                    setTenantName(me.tenantName || '');
                    setOriginalTenantName(me.tenantName || '');
                    setIsDemo(me.roleId === 5 || me.roleId === 6);

                    if (me.tenantId) {
                        const profilesRes = await attendanceApi.get(`/api/v1/profiles/tenant/${me.tenantId}`);
                        if (profilesRes.status === 200 && profilesRes.data.payload) {
                            setProfiles(profilesRes.data.payload.content || []);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching settings data:", err);
                addToast(t('error_fetching_settings', 'Errore nel caricamento delle impostazioni'), 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettingsData();
    }, [t, addToast]);

    const handleUpdateTenantName = async () => {
        if (!tenantName.trim() || tenantName === originalTenantName) return;
        
        if (isDemo) {
            addToast(t('demo_mode_restriction', 'Questa azione non è disponibile in modalità demo'), 'warning');
            return;
        }

        setIsSavingTenant(true);
        try {
            const res = await attendanceApi.put('/api/v1/tenants/me', { name: tenantName });
            if (res.status === 200) {
                setOriginalTenantName(tenantName);
                addToast(t('tenant_name_updated', 'Nome azienda aggiornato con successo'), 'success');
            }
        } catch (err) {
            console.error("Error updating tenant name:", err);
            addToast(t('error_updating_tenant_name', 'Errore nell\'aggiornamento dell\'azienda'), 'error');
        } finally {
            setIsSavingTenant(false);
        }
    };

    const handleUpdateRole = async (profileId: string, roleId: number) => {
        if (isDemo) {
            addToast(t('demo_mode_restriction', 'Questa azione non è disponibile in modalità demo'), 'warning');
            return;
        }

        setUpdatingRoleFor(profileId);
        try {
            const res = await attendanceApi.put(`/api/v1/profiles/${profileId}/role?roleId=${roleId}`);
            if (res.status === 200) {
                setProfiles(prev => prev.map(p => 
                    p.id === profileId ? { ...p, roleId: roleId, role: getRoleName(roleId) } : p
                ));
                addToast(t('role_updated', 'Ruolo aggiornato con successo'), 'success');
            }
        } catch (err) {
            console.error("Error updating role:", err);
            addToast(t('error_updating_role', 'Errore nell\'aggiornamento del ruolo'), 'error');
        } finally {
            setUpdatingRoleFor(null);
        }
    };

    const getRoleName = (roleId: number) => {
        switch (roleId) {
            case 1: return 'SUPERADMIN';
            case 2: return 'ADMIN_TENANT';
            case 3: return 'MANAGER';
            case 4: return 'EMPLOYEE';
            case 5: return 'MANAGER_DEMO';
            case 6: return 'EMPLOYEE_DEMO';
            default: return 'UNKNOWN';
        }
    };

    const getRoleBadgeClasses = (roleId: number | null) => {
        switch (roleId) {
            case 2: return 'bg-amber-50 text-amber-700 ring-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400';
            case 3: return 'bg-blue-50 text-blue-700 ring-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'bg-slate-50 text-slate-700 ring-slate-200/50 dark:bg-slate-900/20 dark:text-slate-400';
        }
    };

    const getRoleDisplayName = (profile: Profile) => {
        const roleBase = (profile.role || 'employee').toLowerCase().replace('_demo', '');
        const roleLabel = t(`role_${roleBase}`);
        const isDemoRole = profile.roleId !== null && (profile.roleId === 5 || profile.roleId === 6);
        return `${roleLabel}${isDemoRole ? ' (Demo)' : ''}`;
    };

    const getRoleIndicatorColor = (roleId: number | null) => {
        switch (roleId) {
            case 2: return 'bg-amber-400';
            case 3: return 'bg-blue-400';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen flex w-full overflow-hidden font-display">
            <Sidebar />

            <div className="flex-1 lg:ml-80 flex flex-col overflow-y-auto h-screen scroll-smooth">
                <div className="lg:hidden h-16 shrink-0" />
                <main className="flex-1 w-full max-w-[1200px] mx-auto pt-4 px-4 pb-4 md:p-10 flex flex-col gap-6 md:gap-12 animate-in fade-in duration-700">
                    
                    {/* Header Section */}
                    <div className="px-1 md:px-0">
                        <div className="flex items-center gap-3 md:gap-4 mb-2">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <span className="material-icons text-white text-xl md:text-2xl">settings</span>
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {t('settings', 'Impostazioni')}
                                </h1>
                                <p className="text-xs md:text-base text-slate-500 dark:text-slate-400">
                                    {t('manage_org_settings', 'Gestisci le impostazioni della tua organizzazione e i ruoli dei membri')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="text-slate-500 font-medium animate-pulse">{t('loading_settings', 'Caricamento impostazioni...')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 md:gap-10">
                            
                            {/* Organization Settings Card */}
                            <section className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[24px] md:rounded-[32px] border border-white/50 dark:border-slate-700/50 p-5 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:bg-white/80 dark:hover:bg-slate-800/70">
                                <div className="flex items-center gap-3 mb-6 md:mb-8">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <span className="material-icons text-blue-600 dark:text-blue-400 text-sm md:text-base">business</span>
                                    </div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                                        {t('organization_details', 'Dettagli Organizzazione')}
                                    </h2>
                                </div>

                                <div className="max-w-2xl">
                                    <div className="space-y-2">
                                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            {t('organization_name', 'Nome Azienda')}
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                            <div className="relative flex-1 group">
                                                <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">edit</span>
                                                <input
                                                    type="text"
                                                    value={tenantName}
                                                    onChange={(e) => setTenantName(e.target.value)}
                                                    placeholder={t('enter_org_name', 'Inserisci il nome dell\'azienda')}
                                                    className="w-full pl-12 pr-4 py-3 md:py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-semibold text-sm md:text-base"
                                                />
                                            </div>
                                            <button
                                                onClick={handleUpdateTenantName}
                                                disabled={isSavingTenant || tenantName === originalTenantName}
                                                className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 min-w-[120px] md:min-w-[140px] text-sm md:text-base"
                                            >
                                                {isSavingTenant ? (
                                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <span className="material-icons text-xl">save</span>
                                                        {t('save', 'Salva')}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* User Roles & Permissions Section */}
                            <section className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[24px] md:rounded-[32px] border border-white/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all hover:bg-white/80 dark:hover:bg-slate-800/70">
                                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <span className="material-icons text-indigo-600 dark:text-indigo-400 text-sm md:text-base">admin_panel_settings</span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                                                {t('member_roles', 'Ruoli dei Membri')}
                                            </h2>
                                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                {t('manage_roles_desc', 'Assegna ruoli amministrativi o collaborativi ai membri del team')}
                                            </p>
                                            <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/30">
                                                <span className="material-icons text-amber-600 dark:text-amber-400 text-sm md:text-base shrink-0 mt-0.5">info</span>
                                                <p className="text-[10px] md:text-xs text-amber-800/80 dark:text-amber-300/80 font-medium leading-relaxed italic">
                                                    {t('location_warning', 'Nota: Per modificare le sedi di lavoro (Location) dei membri, è necessario andare nella sezione "Dipartimenti" e modificare il dipartimento corrispondente.')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Card View (visible only on mobile) */}
                                <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {profiles.map((profile) => (
                                        <div key={profile.id} className="p-5 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random&color=fff&size=80`}
                                                        alt={profile.fullName}
                                                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{profile.fullName}</p>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ring-1 mt-0.5 ${getRoleBadgeClasses(profile.roleId)}`}>
                                                            {getRoleDisplayName(profile)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {updatingRoleFor === profile.id && (
                                                    <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                                )}
                                            </div>
                                            
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                <button
                                                    onClick={() => handleUpdateRole(profile.id, 2)}
                                                    disabled={profile.roleId === 2 || updatingRoleFor === profile.id}
                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        profile.roleId === 2 
                                                            ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' 
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    Admin
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateRole(profile.id, 3)}
                                                    disabled={profile.roleId === 3 || updatingRoleFor === profile.id}
                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        profile.roleId === 3 
                                                            ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' 
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    Manager
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateRole(profile.id, 4)}
                                                    disabled={profile.roleId === 4 || updatingRoleFor === profile.id}
                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        profile.roleId === 4 
                                                            ? 'bg-white dark:bg-slate-800 text-slate-600 shadow-sm' 
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    User
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View (hidden on mobile) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-left">
                                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('member', 'Membro')}</th>
                                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('current_role', 'Ruolo Attuale')}</th>
                                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">{t('assign_new_role', 'Assegna Nuovo Ruolo')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {profiles.map((profile) => (
                                                <tr key={profile.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <img
                                                                    src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random&color=fff&size=80`}
                                                                    alt={profile.fullName}
                                                                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm"
                                                                />
                                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${getRoleIndicatorColor(profile.roleId)}`}></div>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white">{profile.fullName}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">ID: {profile.id.substring(0, 8)}...</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ring-1 ${getRoleBadgeClasses(profile.roleId)}`}>
                                                            {getRoleDisplayName(profile)}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {updatingRoleFor === profile.id ? (
                                                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                                            ) : (
                                                                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 gap-1">
                                                                    <button
                                                                        onClick={() => handleUpdateRole(profile.id, 2)}
                                                                        disabled={profile.roleId === 2}
                                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                                            profile.roleId === 2 
                                                                                ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' 
                                                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                                                        }`}
                                                                    >
                                                                        Admin
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateRole(profile.id, 3)}
                                                                        disabled={profile.roleId === 3}
                                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                                            profile.roleId === 3 
                                                                                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' 
                                                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                                                        }`}
                                                                    >
                                                                        Manager
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateRole(profile.id, 4)}
                                                                        disabled={profile.roleId === 4}
                                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                                            profile.roleId === 4 
                                                                                ? 'bg-white dark:bg-slate-800 text-slate-600 shadow-sm' 
                                                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                                                        }`}
                                                                    >
                                                                        User
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {profiles.length === 0 && (
                                    <div className="p-10 md:p-20 flex flex-col items-center justify-center text-center">
                                        <span className="material-icons text-5xl md:text-6xl text-slate-200 dark:text-slate-700 mb-4">group_off</span>
                                        <p className="text-slate-500 font-medium text-sm md:text-base">Nessun membro trovato per questa organizzazione</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Settings;
