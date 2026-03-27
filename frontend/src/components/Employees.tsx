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
    departmentId: number | null;
    departmentName: string | null;
}

interface Department {
    id: number;
    name: string;
}

const Employees: React.FC = () => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination
    const [page, setPage] = useState(0);
    const pageSize = 10;

    // Reset page to 0 when filters change
    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    // Invite Link modal
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteConfig, setInviteConfig] = useState({
        expiresInDays: 7,
        maxUses: 1,
        managerId: '',
        departmentId: ''
    });
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            setIsLoading(true);
            try {
                const sessionResponse = await supabase.auth.getSession();
                if (!sessionResponse.data.session?.access_token) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: roleData } = await supabase
                    .from('profiles')
                    .select('role_id')
                    .eq('id', user.id)
                    .single();
                const isSA = roleData?.role_id === 1;
                setIsSuperadmin(isSA);
                setIsDemo(roleData?.role_id === 5 || roleData?.role_id === 6);

                const meResponse = await attendanceApi.get('/api/v1/profiles/me');
                if (meResponse.status !== 200 || !meResponse.data.payload) return;

                const currentTenantId = meResponse.data.payload.tenantId;

                if (isSA) {
                    const res = await attendanceApi.get('/api/v1/profiles/all');
                    if (res.status === 200 && res.data.payload) {
                        setProfiles(res.data.payload.content || []);
                    }
                } else if (currentTenantId) {
                    const res = await attendanceApi.get(`/api/v1/profiles/tenant/${currentTenantId}`);
                    if (res.status === 200 && res.data.payload) {
                        setProfiles(res.data.payload.content || []);
                    }

                    // Fetch departments
                    const deptRes = await attendanceApi.get(`/api/v1/departments?tenantId=${currentTenantId}`);
                    if (deptRes.status === 200 && deptRes.data.payload) {
                        setDepartments(deptRes.data.payload);
                    }
                }
            } catch (err) {
                console.error("Error fetching employees:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const handleDeleteProfile = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await attendanceApi.delete(`/api/v1/profiles/${deleteTarget.id}`);
            if (res.status === 200) {
                setProfiles(prev => prev.filter(p => p.id !== deleteTarget.id));
                setDeleteTarget(null);
            }
        } catch (err) {
            console.error("Error deleting profile:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleGenerateInviteLink = async () => {
        if (isDemo) {
            setIsGenerating(true);
            setTimeout(() => {
                const fakeToken = "demo-token-" + Math.random().toString(36).substring(7);
                const link = `${globalThis.location.origin}/register?token=${fakeToken}`;
                setGeneratedLink(link);
                setIsGenerating(false);
                addToast(t('demo_mode_invite_info', 'Simulazione: in un account reale verrebbe generato un link valido.'), 'info');
            }, 800);
            return;
        }
        setIsGenerating(true);
        try {
            const res = await attendanceApi.post('/api/v1/invites/generate', {
                expiresInDays: inviteConfig.expiresInDays,
                maxUses: inviteConfig.maxUses,
                managerId: inviteConfig.managerId || null,
                departmentId: inviteConfig.departmentId ? Number.parseInt(inviteConfig.departmentId) : null
            });
            if (res.status === 200 && res.data?.payload) {
                const { token } = res.data.payload;
                const link = `${globalThis.location.origin}/register?token=${token}`;
                setGeneratedLink(link);
            }
        } catch (err) {
            console.error("Error generating invite link:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const filtered = profiles.filter(p =>
        (p.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tenantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.departmentName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedProfiles = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;

    return (
        <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen flex w-full overflow-hidden">
            <Sidebar />

            <div className="flex-1 lg:ml-80 flex flex-col overflow-y-auto h-screen scroll-smooth">
                {/* Mobile top bar spacer */}
                <div className="lg:hidden h-16 shrink-0" />
                <main className="flex-1 w-full max-w-[1440px] mx-auto pt-4 px-4 pb-4 md:p-10 flex flex-col gap-6 md:gap-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="px-1 md:px-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#0e121b] dark:text-white tracking-tight">
                                {t('employees', 'Dipendenti')}
                            </h1>
                            <p className="text-sm md:text-base text-[#4e6797] dark:text-slate-400 mt-1">
                                {t('manage_employees', 'Gestisci i dipendenti del tuo team')}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <span className="material-icons text-lg">person_add</span>
                            {t('invite_employee', 'Invita Dipendente')}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search_employees', 'Cerca dipendenti...')}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all dark:text-white text-sm"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <span className="material-icons text-6xl text-slate-300 mb-4">person_off</span>
                            <h3 className="text-xl font-bold text-[#0e121b] dark:text-white text-center">
                                {t('no_employees', 'Nessun dipendente trovato')}
                            </h3>
                            <p className="text-base text-[#4e6797] mt-2 text-center max-w-sm">
                                {searchQuery
                                    ? t('no_search_results', 'Nessun risultato per la ricerca.')
                                    : t('no_employees_desc', 'Non ci sono ancora dipendenti registrati.')}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border border-transparent">
                            {/* Table header */}
                            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <span>{t('name', 'Nome')}</span>
                                <span>{t('role', 'Ruolo')}</span>
                                <span>{t('department', 'Dipartimento')}</span>
                                {isSuperadmin && <span>{t('tenant', 'Tenant')}</span>}
                                {!isSuperadmin && <span></span>}
                                <span className="text-right">{t('actions', 'Azioni')}</span>
                            </div>

                            {/* Rows */}
                            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {displayedProfiles.map(p => (
                                    <li key={p.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                        {/* Name */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold shrink-0">
                                                {(p.fullName || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {p.fullName || 'Utente sconosciuto'}
                                            </span>
                                        </div>

                                        {/* Role */}
                                        <div className="md:block text-left">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">
                                                {p.role ? t(`role_${p.role.toLowerCase()}`, p.role) : 'N/A'}
                                            </span>
                                        </div>

                                        {/* Department */}
                                        <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                            {p.departmentName && p.departmentName !== 'Unknown Department' ? p.departmentName : t('no_department_assigned')}
                                        </span>

                                        {/* Tenant (superadmin only) */}
                                        <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                            {isSuperadmin ? (p.tenantName || `Tenant #${p.tenantId}`) : ''}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setDeleteTarget(p)}
                                                className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title={t('delete_employee', 'Elimina dipendente')}
                                            >
                                                <span className="material-icons text-xl">delete</span>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Footer count and Pagination */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                    {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filtered.length)} di {filtered.length} {t('employees', 'dipendenti')}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                        <button
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <span className="material-icons text-xl">chevron_left</span>
                                        </button>

                                        <div className="flex items-center px-2 gap-1 overflow-x-auto hide-scrollbar max-w-[150px]">
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setPage(i)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${page === i
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={page === totalPages - 1}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <span className="material-icons text-xl">chevron_right</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
                <Footer />
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <span className="material-icons text-blue-600 dark:text-blue-400">send</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                        {t('invite_new_employee', 'Invita nuovo dipendente')}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsInviteModalOpen(false);
                                        setGeneratedLink(null);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <span className="material-icons text-slate-400">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {t('expires_in_days', 'Scade tra (giorni)')}
                                    </label>
                                    <input
                                        type="number"
                                        value={inviteConfig.expiresInDays}
                                        onChange={(e) => setInviteConfig({ ...inviteConfig, expiresInDays: Number.parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {t('max_uses', 'Utilizzi massimi')}
                                    </label>
                                    <input
                                        type="number"
                                        value={inviteConfig.maxUses}
                                        onChange={(e) => setInviteConfig({ ...inviteConfig, maxUses: Number.parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {t('assign_manager', 'Assegna Manager (Opzionale)')}
                                    </label>
                                    <select
                                        value={inviteConfig.managerId}
                                        onChange={(e) => setInviteConfig({ ...inviteConfig, managerId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    >
                                        <option value="">{t('no_manager', 'Nessun manager')}</option>
                                        {profiles
                                            .filter(p => p.roleId === 3) // Role 3 is MANAGER
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.fullName}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {t('assign_department', 'Assegna Dipartimento (Opzionale)')}
                                    </label>
                                    <select
                                        value={inviteConfig.departmentId}
                                        onChange={(e) => setInviteConfig({ ...inviteConfig, departmentId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    >
                                        <option value="">{t('no_department', 'Nessun dipartimento')}</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {generatedLink && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-icons text-sm">link</span>
                                            {t('invite_link', 'Link di invito')}
                                        </label>
                                        <div className="relative group">
                                            <input
                                                readOnly
                                                value={generatedLink}
                                                className="w-full pl-4 pr-12 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl font-mono text-xs text-blue-700 dark:text-blue-300 shadow-inner"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(generatedLink)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors text-blue-500"
                                            >
                                                <span className="material-icons text-lg">{copySuccess ? 'check' : 'content_copy'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleGenerateInviteLink}
                                        disabled={isGenerating}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70"
                                    >
                                        {isGenerating ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span className="material-icons text-xl">auto_fix_high</span>
                                                <span className="whitespace-nowrap">{t('generate_invite_link', 'Genera Link Invito')}</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsInviteModalOpen(false);
                                            setGeneratedLink(null);
                                        }}
                                        className="w-full py-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-semibold transition-colors"
                                    >
                                        {t('close_modal', 'Chiudi')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                                <span className="material-icons text-3xl text-red-500">warning</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                                {t('confirm_delete', 'Conferma eliminazione')}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                                {t('delete_employee_confirm', 'Sei sicuro di voler eliminare il dipendente')}
                            </p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white mb-4">
                                {deleteTarget.fullName}?
                            </p>
                            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-xl">
                                {t('delete_warning', 'Questa azione è irreversibile.')}
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {t('cancel', 'Annulla')}
                            </button>
                            <button
                                onClick={handleDeleteProfile}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center transition-colors disabled:opacity-70"
                            >
                                {isDeleting ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>{t('delete', 'Elimina')}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
