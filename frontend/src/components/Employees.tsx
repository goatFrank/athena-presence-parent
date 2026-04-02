import React, { useState, useEffect, useMemo } from 'react';
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
    profileCellphone?: string | null;
    locationId?: number | null;
    roleDescription?: string | null;
}

interface Department {
    id: number;
    name: string;
}

const Employees: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myProfileId, setMyProfileId] = useState<string | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editTarget, setEditTarget] = useState<Profile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [myRoleId, setMyRoleId] = useState<number | null>(null);

    // Stats modal
    const [statsTarget, setStatsTarget] = useState<Profile | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsRecords, setStatsRecords] = useState<any[]>([]);
    const [statsDash, setStatsDash] = useState<any>(null);
    const [statsPrevMonthRecords, setStatsPrevMonthRecords] = useState<any[]>([]);

    // Context (3-dot) menu
    const [menuTarget, setMenuTarget] = useState<string | null>(null);

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

                const myProfile = meResponse.data.payload;
                setMyRoleId(myProfile.roleId);
                setMyProfileId(myProfile.id);
                const currentTenantId = myProfile.tenantId;

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

    const handleSaveProfile = async () => {
        if (!editTarget) return;
        setIsEditing(true);
        try {
            const res = await attendanceApi.put(`/api/v1/profiles/${editTarget.id}`, {
                fullName: editTarget.fullName,
                profileCellphone: editTarget.profileCellphone,
                roleId: editTarget.roleId,
                departmentId: editTarget.departmentId,
                locationId: editTarget.locationId || null,
                roleDescription: editTarget.roleDescription
            });
            if (res.status === 200) {
                addToast(t('profile_updated_success', 'Profilo aggiornato con successo'), 'success');
                // Aggiorniamo lo stato locale
                setProfiles(prev => prev.map(p => p.id === editTarget.id ? { ...p, ...editTarget } : p));
                setEditTarget(null);
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            addToast(t('profile_updated_error', 'Errore durante l\'aggiornamento del profilo'), 'error');
        } finally {
            setIsEditing(false);
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

    // ── Stats helpers ──
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const toIso = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

    type NormalizedStatus = 'office' | 'remote' | 'sick' | 'holiday' | null;
    const normalizeStatus = (raw: string): NormalizedStatus => {
        const s = raw?.toUpperCase().trim();
        if (s === 'IN_OFFICE' || s === 'OFFICE') return 'office';
        if (s === 'REMOTE' || s === 'WORKING_REMOTELY') return 'remote';
        if (s === 'SICK') return 'sick';
        if (s === 'HOLIDAY' || s === 'VACATION') return 'holiday';
        return null;
    };

    const isWeekend = (d: Date) => { const day = d.getDay(); return day === 0 || day === 6; };

    const getMonday = (d: Date): Date => {
        const copy = new Date(d);
        const day = copy.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        copy.setDate(copy.getDate() + diff);
        copy.setHours(0, 0, 0, 0);
        return copy;
    };

    const handleOpenStats = async (profile: Profile) => {
        setStatsTarget(profile);
        setStatsLoading(true);
        setStatsRecords([]);
        setStatsDash(null);
        setStatsPrevMonthRecords([]);

        try {
            const today = new Date();
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            threeMonthsAgo.setDate(1);

            // Fetch 3-month attendance range
            const rangeRes = await attendanceApi.get(`/api/v1/attendance/user/${profile.id}/range`, {
                params: { startDate: toIso(threeMonthsAgo), endDate: toIso(today) }
            });
            if (rangeRes.status === 200) {
                setStatsRecords((rangeRes.data.payload || []).map((r: any) => ({
                    workDate: r.workDate, status: r.status
                })));
            }

            // Fetch dashboard stats
            const dashRes = await attendanceApi.get(`/api/v1/attendance/stats/dashboard/${profile.id}`);
            if (dashRes.status === 200) {
                setStatsDash(dashRes.data.payload);
            }

            // Previous month
            const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            const prevRes = await attendanceApi.get(`/api/v1/attendance/user/${profile.id}/range`, {
                params: { startDate: toIso(prevMonthStart), endDate: toIso(prevMonthEnd) }
            });
            if (prevRes.status === 200) {
                setStatsPrevMonthRecords((prevRes.data.payload || []).map((r: any) => ({
                    workDate: r.workDate, status: r.status
                })));
            }
        } catch (err) {
            console.error('Error fetching employee stats:', err);
            addToast(t('error_fetching_stats', 'Errore nel caricamento delle statistiche'), 'error');
        } finally {
            setStatsLoading(false);
        }
    };

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setMenuTarget(null);
        if (menuTarget) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [menuTarget]);

    // ── Computed stats data ──
    const statsStatusMap = useMemo(() => {
        const map = new Map<string, NormalizedStatus>();
        statsRecords.forEach((r: any) => {
            const ns = normalizeStatus(r.status);
            if (ns) map.set(r.workDate, ns);
        });
        return map;
    }, [statsRecords]);

    const isIt = i18n.language === 'it';

    // Heatmap
    const statsHeatmap = useMemo(() => {
        const weeks: { date: Date; iso: string; status: NormalizedStatus }[][] = [];
        const today = new Date();
        const currentMonday = getMonday(today);
        for (let w = 11; w >= 0; w--) {
            const weekStart = new Date(currentMonday);
            weekStart.setDate(weekStart.getDate() - w * 7);
            const week: { date: Date; iso: string; status: NormalizedStatus }[] = [];
            for (let d = 0; d < 5; d++) {
                const day = new Date(weekStart);
                day.setDate(day.getDate() + d);
                const iso = toIso(day);
                week.push({ date: day, iso, status: statsStatusMap.get(iso) || null });
            }
            weeks.push(week);
        }
        return weeks;
    }, [statsStatusMap]);

    // Day distribution
    const statsDayDist = useMemo(() => {
        const days = [
            { name: isIt ? 'Lunedì' : 'Monday', short: isIt ? 'Lun' : 'Mon', office: 0, remote: 0 },
            { name: isIt ? 'Martedì' : 'Tuesday', short: isIt ? 'Mar' : 'Tue', office: 0, remote: 0 },
            { name: isIt ? 'Mercoledì' : 'Wednesday', short: isIt ? 'Mer' : 'Wed', office: 0, remote: 0 },
            { name: isIt ? 'Giovedì' : 'Thursday', short: isIt ? 'Gio' : 'Thu', office: 0, remote: 0 },
            { name: isIt ? 'Venerdì' : 'Friday', short: isIt ? 'Ven' : 'Fri', office: 0, remote: 0 },
        ];
        statsRecords.forEach((r: any) => {
            const d = new Date(r.workDate + 'T00:00:00');
            const dow = d.getDay();
            if (dow >= 1 && dow <= 5) {
                const ns = normalizeStatus(r.status);
                if (ns === 'office') days[dow - 1].office++;
                else if (ns === 'remote') days[dow - 1].remote++;
            }
        });
        const maxTotal = Math.max(...days.map(d => d.office + d.remote), 1);
        return { days, maxTotal };
    }, [statsRecords, isIt]);

    // Month comparison
    const statsMonthComp = useMemo(() => {
        const prevCounts = { office: 0, remote: 0, sick: 0, holiday: 0 };
        statsPrevMonthRecords.forEach((r: any) => {
            const ns = normalizeStatus(r.status);
            if (ns) prevCounts[ns]++;
        });
        const curr = {
            office: statsDash?.officeDays ?? 0,
            remote: statsDash?.remoteDays ?? 0,
            sick: statsDash?.sickDays ?? 0,
            holiday: statsDash?.holidayDays ?? 0,
        };
        return {
            current: curr, previous: prevCounts,
            delta: {
                office: curr.office - prevCounts.office,
                remote: curr.remote - prevCounts.remote,
                sick: curr.sick - prevCounts.sick,
                holiday: curr.holiday - prevCounts.holiday,
            }
        };
    }, [statsDash, statsPrevMonthRecords]);

    // Streak data
    const statsStreak = useMemo(() => {
        let currentStreak = 0;
        const today = new Date();
        const d = new Date(today);
        while (true) {
            if (isWeekend(d)) { d.setDate(d.getDate() - 1); continue; }
            if (statsStatusMap.has(toIso(d))) { currentStreak++; d.setDate(d.getDate() - 1); }
            else break;
            if (d < new Date(today.getFullYear(), today.getMonth() - 3, 1)) break;
        }

        let maxStreak = 0;
        const sorted = [...statsRecords].sort((a: any, b: any) => a.workDate.localeCompare(b.workDate));
        if (sorted.length > 0) {
            const start = new Date(sorted[0].workDate + 'T00:00:00');
            const end = new Date(sorted[sorted.length - 1].workDate + 'T00:00:00');
            let streak = 0;
            const iter = new Date(start);
            while (iter <= end) {
                if (!isWeekend(iter)) {
                    if (statsStatusMap.has(toIso(iter))) { streak++; maxStreak = Math.max(maxStreak, streak); }
                    else streak = 0;
                }
                iter.setDate(iter.getDate() + 1);
            }
        }
        return { currentStreak, maxStreak };
    }, [statsRecords, statsStatusMap]);

    // Consistency score
    const statsConsistency = useMemo(() => {
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        threeMonthsAgo.setDate(1);
        let totalWorkingDays = 0, plannedDays = 0;
        const iter = new Date(threeMonthsAgo);
        while (iter <= today) {
            if (!isWeekend(iter)) {
                totalWorkingDays++;
                if (statsStatusMap.has(toIso(iter))) plannedDays++;
            }
            iter.setDate(iter.getDate() + 1);
        }
        const coverage = totalWorkingDays > 0 ? Math.round((plannedDays / totalWorkingDays) * 40) : 0;
        const streakBonus = Math.min(30, Math.round((statsStreak.currentStreak / 20) * 30));
        let office3m = 0, remote3m = 0;
        statsRecords.forEach((r: any) => {
            const ns = normalizeStatus(r.status);
            if (ns === 'office') office3m++;
            if (ns === 'remote') remote3m++;
        });
        const total = office3m + remote3m;
        const balance = total > 0 ? Math.round((1 - Math.abs(office3m - remote3m) / total) * 30) : 0;
        return Math.min(100, coverage + streakBonus + balance);
    }, [statsStatusMap, statsRecords, statsStreak]);

    const getHeatColor = (status: NormalizedStatus, isDark: boolean = false) => {
        if (!status) return isDark ? 'rgb(51,65,85)' : 'rgb(241,245,249)';
        if (status === 'office') return 'rgb(99,102,241)';
        if (status === 'remote') return 'rgb(56,189,248)';
        if (status === 'sick') return 'rgb(239,68,68)';
        if (status === 'holiday') return 'rgb(251,146,60)';
        return isDark ? 'rgb(51,65,85)' : 'rgb(241,245,249)';
    };

    const getStatusLabel = (status: NormalizedStatus): string => {
        if (!status) return isIt ? 'Non registrato' : 'Not recorded';
        if (status === 'office') return isIt ? 'Ufficio' : 'Office';
        if (status === 'remote') return isIt ? 'Remoto' : 'Remote';
        if (status === 'sick') return isIt ? 'Malattia' : 'Sick';
        if (status === 'holiday') return isIt ? 'Ferie' : 'Holiday';
        return '';
    };

    const MONTH_NAMES_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = (isIt ? MONTH_NAMES_IT : MONTH_NAMES_EN)[new Date().getMonth()];
    const prevMonthName = (isIt ? MONTH_NAMES_IT : MONTH_NAMES_EN)[(new Date().getMonth() - 1 + 12) % 12];

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
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => setEditTarget(p)}
                                                className="p-2 rounded-xl text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                title={t('edit_employee', 'Modifica dipendente')}
                                            >
                                                <span className="material-icons text-xl">edit</span>
                                            </button>
                                            {/* 3-dot menu (managers & admins only) */}
                                            {(myRoleId === 1 || myRoleId === 2 || myRoleId === 3 || myRoleId === 5) && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuTarget(menuTarget === p.id ? null : p.id);
                                                        }}
                                                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        title={t('more_options', 'Altre opzioni')}
                                                    >
                                                        <span className="material-icons text-xl">more_vert</span>
                                                    </button>
                                                    {menuTarget === p.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <button
                                                                onClick={() => {
                                                                    setMenuTarget(null);
                                                                    handleOpenStats(p);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            >
                                                                <span className="material-icons text-lg">bar_chart</span>
                                                                {t('analytics', 'Statistiche')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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

            {/* Edit Modal */}
            {editTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 dark:border-slate-700 max-h-[90vh] flex flex-col scale-in-center">
                        <div className="p-8 pb-4 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <span className="material-icons text-blue-600 dark:text-blue-400">edit</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {t('edit_profile', 'Modifica Profilo')}
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditTarget(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <span className="material-icons text-slate-400">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('full_name', 'Nome Completo')}
                                    </label>
                                    <input
                                        type="text"
                                        value={editTarget.fullName || ''}
                                        onChange={(e) => setEditTarget({ ...editTarget, fullName: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('phone', 'Cellulare')}
                                    </label>
                                    <input
                                        type="tel"
                                        value={editTarget.profileCellphone || ''}
                                        onChange={(e) => setEditTarget({ ...editTarget, profileCellphone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                                    />
                                </div>

                                {/* Technical Role */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('technical_role', 'Ruolo Tecnico')}
                                    </label>
                                    {editTarget.id === myProfileId ? (
                                        <div className="flex items-center justify-between px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl group transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                    <span className="material-icons text-xl">verified_user</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {t('role_' + (editTarget?.role?.toLowerCase().replaceAll(/\s+/g, '_') || 'employee'))}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {t('account_protected_desc', 'Questo ruolo è protetto per il tuo account')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                                                <span className="material-icons text-slate-400 text-[18px]" title={t('cannot_edit_self_role', 'Non puoi modificare il tuo ruolo')}>lock</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <select
                                            value={editTarget.roleId || ''}
                                            onChange={(e) => setEditTarget({ ...editTarget, roleId: Number.parseInt(e.target.value), role: e.target.options[e.target.selectedIndex].text })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                                        >
                                            <option value={2} disabled={myRoleId !== 1 && myRoleId !== 2}>{t('role_amministratore_tenant', 'Amministratore')}</option>
                                            <option value={3} disabled={myRoleId !== 1 && myRoleId !== 2 && myRoleId !== 3}>{t('role_manager', 'Manager')}</option>
                                            <option value={4}>{t('role_employee', 'Dipendente')}</option>
                                        </select>
                                    )}
                                </div>

                                {/* Company Role (Description) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('company_role', 'Ruolo Aziendale')}
                                    </label>
                                    <input
                                        type="text"
                                        value={editTarget.roleDescription || ''}
                                        onChange={(e) => setEditTarget({ ...editTarget, roleDescription: e.target.value })}
                                        placeholder={t('example_developer', 'es. Sviluppatore')}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                                    />
                                </div>

                                {/* Department */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('department', 'Dipartimento')}
                                    </label>
                                    <select
                                        value={editTarget.departmentId || ''}
                                        onChange={(e) => {
                                            const deptId = Number.parseInt(e.target.value);
                                            setEditTarget({ 
                                                ...editTarget, 
                                                departmentId: deptId, 
                                                departmentName: e.target.options[e.target.selectedIndex].text 
                                            });
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                                    >
                                        <option value="">{t('no_department', 'Nessun dipartimento')}</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-4 shrink-0 flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                            <button
                                onClick={() => setEditTarget(null)}
                                className="flex-1 py-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-semibold transition-colors order-2 sm:order-1"
                            >
                                {t('cancel', 'Annulla')}
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isEditing || !editTarget.fullName}
                                className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70 transition-all order-1 sm:order-2"
                            >
                                {isEditing ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-icons text-lg">save</span>
                                        {t('save_changes', 'Salva Modifiche')}
                                    </>
                                )}
                            </button>
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

            {/* ── STATS MODAL ── */}
            {statsTarget && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex justify-center items-start p-4 pt-8 md:pt-12 overflow-y-auto" onClick={() => setStatsTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-3xl border border-slate-100 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-8 py-6">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                            </div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold border border-white/30">
                                        {(statsTarget.fullName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{statsTarget.fullName}</h2>
                                        <p className="text-white/70 text-sm">{statsTarget.departmentName || t('no_department_assigned')}</p>
                                    </div>
                                </div>
                                <button onClick={() => setStatsTarget(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors group">
                                    <span className="material-icons text-white/80 group-hover:text-white">close</span>
                                </button>
                            </div>
                        </div>

                        {statsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                            </div>
                        ) : statsRecords.length === 0 && !statsDash ? (
                            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4">query_stats</span>
                                <p className="text-base font-bold text-slate-500 dark:text-slate-400">{isIt ? 'Nessun dato disponibile' : 'No data available'}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{isIt ? 'Questo dipendente non ha ancora registrato presenze.' : 'This employee has not recorded any attendance yet.'}</p>
                            </div>
                        ) : (
                            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                {/* Row 1: Heatmap + Score */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                    {/* Heatmap */}
                                    <div className="md:col-span-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-indigo-500 text-lg">grid_view</span>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{isIt ? 'Mappa Presenze' : 'Attendance Heatmap'}</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <div className="min-w-[300px] flex gap-1">
                                                <div className="flex flex-col gap-1 mr-1">
                                                    {(isIt ? ['L', 'M', 'M', 'G', 'V'] : ['M', 'T', 'W', 'T', 'F']).map((l, i) => (
                                                        <div key={i} className="h-5 flex items-center"><span className="text-[9px] font-bold text-slate-400 w-4">{l}</span></div>
                                                    ))}
                                                </div>
                                                {statsHeatmap.map((week, wi) => (
                                                    <div key={wi} className="flex flex-col gap-1 flex-1">
                                                        {week.map((day, di) => {
                                                            const isDark = document.documentElement.classList.contains('dark');
                                                            return (
                                                                <div
                                                                    key={di}
                                                                    className={`h-5 rounded-sm transition-all ${day.date > new Date() ? 'opacity-20' : 'hover:ring-1 hover:ring-slate-400 dark:hover:ring-slate-500 cursor-default'}`}
                                                                    style={{ backgroundColor: getHeatColor(day.status, isDark) }}
                                                                    title={`${day.iso} — ${getStatusLabel(day.status)}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-3 flex-wrap">
                                            {[
                                                { color: 'bg-slate-200 dark:bg-slate-600', label: isIt ? 'Non registrato' : 'Not recorded' },
                                                { color: 'bg-indigo-500', label: isIt ? 'Ufficio' : 'Office' },
                                                { color: 'bg-sky-400', label: isIt ? 'Remoto' : 'Remote' },
                                                { color: 'bg-red-500', label: isIt ? 'Malattia' : 'Sick' },
                                                { color: 'bg-orange-400', label: isIt ? 'Ferie' : 'Holiday' },
                                            ].map(l => (
                                                <div key={l.label} className="flex items-center gap-1">
                                                    <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`}></div>
                                                    <span className="text-[9px] font-semibold text-slate-400">{l.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Consistency Score */}
                                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{isIt ? 'Regolarità' : 'Consistency'}</h3>
                                        <div className="relative" style={{ width: 120, height: 120 }}>
                                            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-600" />
                                                <circle cx="60" cy="60" r="52" fill="none"
                                                    stroke={statsConsistency >= 80 ? '#22c55e' : statsConsistency >= 60 ? '#6366f1' : statsConsistency >= 40 ? '#f59e0b' : '#ef4444'}
                                                    strokeWidth="8"
                                                    strokeDasharray={`${(statsConsistency / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-black text-slate-800 dark:text-white">{statsConsistency}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-0.5">
                                            {statsConsistency >= 80 && <span className="text-lg">🏆</span>}
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {statsConsistency >= 80 ? (isIt ? 'Eccellente!' : 'Excellent!') : statsConsistency >= 60 ? (isIt ? 'Buono' : 'Good') : statsConsistency >= 40 ? (isIt ? 'Nella media' : 'Average') : (isIt ? 'Da migliorare' : 'Needs improvement')}
                                            </p>
                                            <p className="text-[9px] text-slate-400">{isIt ? 'su 100' : 'out of 100'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Month comparison + Streak */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Month comparison */}
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-rose-500 text-lg">compare_arrows</span>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{currentMonthName} vs {prevMonthName}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                { key: 'office' as const, icon: 'business', label: isIt ? 'Ufficio' : 'Office', color: 'text-indigo-500', bg: 'bg-indigo-100/80 dark:bg-indigo-900/30' },
                                                { key: 'remote' as const, icon: 'home', label: isIt ? 'Remoto' : 'Remote', color: 'text-sky-500', bg: 'bg-sky-100/80 dark:bg-sky-900/30' },
                                                { key: 'sick' as const, icon: 'sick', label: isIt ? 'Malattia' : 'Sick', color: 'text-red-500', bg: 'bg-red-100/80 dark:bg-red-900/30' },
                                                { key: 'holiday' as const, icon: 'beach_access', label: isIt ? 'Ferie' : 'Holiday', color: 'text-amber-500', bg: 'bg-amber-100/80 dark:bg-amber-900/30' },
                                            ]).map(item => {
                                                const delta = statsMonthComp.delta[item.key];
                                                return (
                                                    <div key={item.key} className={`${item.bg} rounded-xl p-3 text-center`}>
                                                        <span className={`material-icons ${item.color} text-base`}>{item.icon}</span>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{item.label}</p>
                                                        <div className="flex items-center justify-center gap-1 mt-0.5">
                                                            <span className="text-lg font-black text-slate-800 dark:text-white">{statsMonthComp.current[item.key]}</span>
                                                            {delta !== 0 && (
                                                                <span className={`text-[10px] font-bold ${delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                    {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Streak */}
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">local_fire_department</span>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Streak</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
                                                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">{isIt ? 'Streak Attuale' : 'Current Streak'}</p>
                                                <div className="flex items-baseline gap-1.5 mt-1">
                                                    <span className="text-2xl font-black text-slate-800 dark:text-white">{statsStreak.currentStreak}</span>
                                                    <span className="text-xs font-bold text-slate-500">{isIt ? 'giorni' : 'days'}</span>
                                                    {statsStreak.currentStreak >= 5 && <span>🔥</span>}
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{isIt ? 'Record Personale' : 'Personal Record'}</p>
                                                <div className="flex items-baseline gap-1.5 mt-1">
                                                    <span className="text-xl font-black text-slate-800 dark:text-white">{statsStreak.maxStreak}</span>
                                                    <span className="text-xs font-bold text-slate-500">{isIt ? 'giorni' : 'days'}</span>
                                                    {statsStreak.maxStreak >= 15 && <span>🏆</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Day distribution */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-teal-500 text-lg">calendar_view_week</span>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">{isIt ? 'Abitudini Settimanali' : 'Weekly Habits'}</h3>
                                        <div className="flex items-center gap-3 ml-auto">
                                            <div className="flex items-center gap-1"><div className="w-2.5 h-1 rounded-full bg-indigo-500"></div><span className="text-[9px] font-bold text-slate-400">{isIt ? 'Ufficio' : 'Office'}</span></div>
                                            <div className="flex items-center gap-1"><div className="w-2.5 h-1 rounded-full bg-sky-400"></div><span className="text-[9px] font-bold text-slate-400">{isIt ? 'Remoto' : 'Remote'}</span></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {statsDayDist.days.map(day => {
                                            const officePct = (day.office / statsDayDist.maxTotal) * 100;
                                            const remotePct = (day.remote / statsDayDist.maxTotal) * 100;
                                            return (
                                                <div key={day.short} className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500 w-7 shrink-0">{day.short}</span>
                                                    <div className="flex-1 h-6 bg-slate-200/50 dark:bg-slate-600/30 rounded-md overflow-hidden flex">
                                                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${officePct}%` }} />
                                                        <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: `${remotePct}%` }} />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 w-12 shrink-0 justify-end">
                                                        <span className="text-[11px] font-bold text-indigo-500">{day.office}</span>
                                                        <span className="text-slate-300 text-[9px]">/</span>
                                                        <span className="text-[11px] font-bold text-sky-400">{day.remote}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
