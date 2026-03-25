import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import Footer from './Footer';

interface Department {
    id: number;
    name: string;
    tenantId: number;
    tenantName?: string;
}

interface Profile {
    id: string;
    fullName: string;
    departmentId: number | null;
    tenantId: number | null;
    role: string | null;
    tenantName: string | null;
}

const Departments: React.FC = () => {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setTenantId] = useState<number | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(false);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Assignment state
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);

    // Rename state
    const [renameDept, setRenameDept] = useState<Department | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    // Delete state
    const [deleteDept, setDeleteDept] = useState<Department | null>(null);
    const [isDeletingDept, setIsDeletingDept] = useState(false);

    // Expanded department cards to show members
    const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());

    const toggleExpand = (deptId: number) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptId)) next.delete(deptId);
            else next.add(deptId);
            return next;
        });
    };

    const openRenameModal = (dept: Department) => {
        setRenameDept(dept);
        setRenameValue(dept.name);
    };

    const handleRenameDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renameDept || !renameValue.trim()) return;
        setIsRenaming(true);
        try {
            const res = await attendanceApi.put(`/api/v1/departments/${renameDept.id}`, { name: renameValue.trim() });
            if (res.status === 200 && res.data.payload) {
                setDepartments(prev => prev.map(d => d.id === renameDept.id ? { ...d, ...res.data.payload } : d));
                setRenameDept(null);
            }
        } catch (err) {
            console.error('Error renaming department:', err);
        } finally {
            setIsRenaming(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!deleteDept) return;
        setIsDeletingDept(true);
        try {
            const res = await attendanceApi.delete(`/api/v1/departments/${deleteDept.id}`);
            if (res.status === 200) {
                setDepartments(prev => prev.filter(d => d.id !== deleteDept.id));
                setProfiles(prev => prev.map(p => p.departmentId === deleteDept.id ? { ...p, departmentId: null } : p));
                setDeleteDept(null);
            }
        } catch (err) {
            console.error('Error deleting department:', err);
        } finally {
            setIsDeletingDept(false);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const sessionResponse = await supabase.auth.getSession();
                if (!sessionResponse.data.session?.access_token) return;

                // 1. Detect role
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: roleData } = await supabase
                    .from('profiles')
                    .select('role_id')
                    .eq('id', user.id)
                    .single();
                const isSA = roleData?.role_id === 1;
                setIsSuperadmin(isSA);

                // 2. Get current user profile to find tenantId
                const meResponse = await attendanceApi.get('/api/v1/profiles/me');
                if (meResponse.status !== 200 || !meResponse.data.payload) return;

                const currentTenantId = meResponse.data.payload.tenantId;
                setTenantId(currentTenantId);

                // 3. Fetch departments
                // Superadmin: no tenantId param → gets ALL departments
                // Tenant admin: pass tenantId → gets only their departments
                let deptsUrl = '/api/v1/departments';
                if (!isSA && currentTenantId) {
                    deptsUrl += `?tenantId=${currentTenantId}`;
                }
                const deptsResponse = await attendanceApi.get(deptsUrl);
                if (deptsResponse.status === 200 && deptsResponse.data.payload) {
                    setDepartments(deptsResponse.data.payload);
                }

                // 4. Fetch profiles — independently of departments
                try {
                    if (isSA) {
                        // Superadmin: get ALL profiles from ALL tenants
                        const profilesResponse = await attendanceApi.get('/api/v1/profiles/all');
                        if (profilesResponse.status === 200 && profilesResponse.data.payload) {
                            setProfiles(profilesResponse.data.payload.content || []);
                        }
                    } else if (currentTenantId) {
                        // Tenant admin: get profiles from own tenant
                        const profilesResponse = await attendanceApi.get(`/api/v1/profiles/tenant/${currentTenantId}`);
                        if (profilesResponse.status === 200 && profilesResponse.data.payload) {
                            setProfiles(profilesResponse.data.payload.content || []);
                        }
                    }
                } catch (profileErr) {
                    console.error("Error fetching profiles:", profileErr);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;
        setIsCreating(true);
        try {
            const response = await attendanceApi.post('/api/v1/departments', { name: newDeptName.trim() });
            if (response.status === 200 && response.data.payload) {
                setDepartments(prev => [...prev, response.data.payload]);
                setIsCreateModalOpen(false);
                setNewDeptName('');
            }
        } catch (err) {
            console.error("Error creating department:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const openAssignModal = (dept: Department) => {
        setSelectedDepartment(dept);
        const currentlyAssigned = profiles
            .filter(p => p.departmentId === dept.id)
            .map(p => p.id);
        setSelectedUserIds(currentlyAssigned);
        setIsAssignModalOpen(true);
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleAssignUsers = async () => {
        if (!selectedDepartment) return;
        setIsAssigning(true);
        try {
            const response = await attendanceApi.put(
                `/api/v1/departments/${selectedDepartment.id}/assign`,
                { userIds: selectedUserIds }
            );
            if (response.status === 200) {
                setProfiles(prev =>
                    prev.map(p => {
                        if (selectedUserIds.includes(p.id)) {
                            return { ...p, departmentId: selectedDepartment.id };
                        } else if (p.departmentId === selectedDepartment.id) {
                            return { ...p, departmentId: null };
                        }
                        return p;
                    })
                );
                setIsAssignModalOpen(false);
            }
        } catch (err) {
            console.error("Error assigning users:", err);
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen flex w-full overflow-hidden">
            <Sidebar />

            <div className="flex-1 ml-0 md:ml-80 overflow-y-auto h-screen scroll-smooth">
                <main className="flex-1 w-full max-w-[1440px] mx-auto pt-20 px-4 pb-4 md:p-10 flex flex-col gap-6 md:gap-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="px-1 md:px-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#0e121b] dark:text-white tracking-tight">
                                {t('departments', 'Dipartimenti')}
                            </h1>
                            <p className="text-sm md:text-base text-[#4e6797] dark:text-slate-400 mt-1">
                                {t('manage_departments', 'Gestisci i dipartimenti e i membri')}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20"
                        >
                            <span className="material-icons text-sm">add</span>
                            {t('create_department', 'Crea Dipartimento')}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                        </div>
                    ) : departments.length === 0 ? (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <span className="material-icons text-6xl text-slate-300 mb-4">domain_disabled</span>
                            <h3 className="text-xl font-bold text-[#0e121b] dark:text-white text-center">
                                {t('no_departments', 'Nessun dipartimento')}
                            </h3>
                            <p className="text-base text-[#4e6797] mt-2 text-center max-w-sm">
                                {t('no_departments_desc', 'Crea il tuo primo dipartimento per iniziare a organizzare il team.')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                            {departments.map(dept => {
                                const members = profiles.filter(p => p.departmentId === dept.id);
                                const isExpanded = expandedDepts.has(dept.id);

                                return (
                                    <div
                                        key={dept.id}
                                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all border border-transparent hover:border-blue-500/20 flex flex-col"
                                    >
                                        {/* Card Header */}
                                        <div className="p-6 pb-4 flex items-start justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                    <span className="material-icons text-[24px]">domain</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-bold text-[#0e121b] dark:text-white truncate">
                                                        {dept.name}
                                                    </h3>
                                                    {(dept.tenantName || isSuperadmin) && (
                                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                            {(() => {
                                                                if (dept.tenantName && dept.tenantName !== 'Unknown Tenant') return dept.tenantName;
                                                                const p = profiles.find(prof => prof.tenantId === dept.tenantId);
                                                                return p?.tenantName || (isSuperadmin ? `Tenant #${dept.tenantId}` : '');
                                                            })()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openRenameModal(dept); }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    title={t('rename', 'Rinomina')}
                                                >
                                                    <span className="material-icons text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteDept(dept); }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title={t('delete_department', 'Elimina dipartimento')}
                                                >
                                                    <span className="material-icons text-lg">delete</span>
                                                </button>
                                                <div className="flex items-center gap-2 text-sm text-[#4e6797] dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl ml-1">
                                                    <span className="material-icons text-lg">group</span>
                                                    {members.length}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Members list */}
                                        <div className="px-6 pb-2">
                                            <button
                                                onClick={() => toggleExpand(dept.id)}
                                                className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors w-full"
                                            >
                                                <span className="material-icons text-[18px] transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                    chevron_right
                                                </span>
                                                {members.length > 0
                                                    ? `${t('show_members', 'Mostra membri')} (${members.length})`
                                                    : t('no_members', 'Nessun membro assegnato')
                                                }
                                            </button>

                                            {isExpanded && members.length > 0 && (
                                                <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto scroll-smooth pr-1">
                                                    {members.map(m => (
                                                        <li
                                                            key={m.id}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/40"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                                                                {(m.fullName || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <span className="text-sm font-semibold text-slate-800 dark:text-white truncate block">
                                                                    {m.fullName || 'Utente sconosciuto'}
                                                                </span>
                                                                {m.role && (
                                                                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate block">
                                                                        {m.role}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {isExpanded && members.length === 0 && (
                                                <p className="mt-3 text-sm text-slate-400 italic pl-6">
                                                    {t('no_members_hint', 'Usa il pulsante qui sotto per assegnare utenti.')}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action bar */}
                                        <div className="p-6 pt-4 mt-auto">
                                            <button
                                                onClick={() => openAssignModal(dept)}
                                                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <span className="material-icons text-sm">person_add</span>
                                                {t('assign_users', 'Assegna Utenti')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
                <Footer />
            </div>

            {/* Create Department Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-blue-600">domain_add</span>
                                {t('create_department', 'Crea Dipartimento')}
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateDepartment} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('department_name', 'Nome Dipartimento')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all dark:text-white"
                                    placeholder={t('department_name_placeholder', 'Es. Risorse Umane')}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('cancel', 'Annulla')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center min-w-[120px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        t('save', 'Salva')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Users Modal */}
            {isAssignModalOpen && selectedDepartment && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="material-icons text-blue-600">group_add</span>
                                    {t('assign_to', 'Assegna a')} {selectedDepartment.name}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">{selectedUserIds.length} {t('selected', 'selezionati')}</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-2 overflow-y-auto scroll-smooth flex-1">
                            {profiles.length === 0 ? (
                                <p className="p-6 text-center text-slate-500">{t('no_users_found', 'Nessun utente trovato nel tenant.')}</p>
                            ) : (
                                <ul className="space-y-1 p-2">
                                    {profiles.map(p => (
                                            <li key={p.id}>
                                                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            checked={selectedUserIds.includes(p.id)}
                                                            onChange={() => toggleUserSelection(p.id)}
                                                        />
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                                                        {(p.fullName || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.fullName || 'Utente sconosciuto'}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                            {p.role || 'Membro'}
                                                            {p.departmentId && p.departmentId !== selectedDepartment.id && (
                                                                <span className="ml-2 text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-md text-[10px]">
                                                                    {departments.find(d => d.id === p.departmentId)?.name || `Dept #${p.departmentId}`}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </label>
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={() => setIsAssignModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {t('cancel', 'Annulla')}
                            </button>
                            <button
                                type="button"
                                onClick={handleAssignUsers}
                                disabled={isAssigning}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center min-w-[120px] transition-colors shadow-sm disabled:opacity-70"
                            >
                                {isAssigning ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    t('save', 'Salva')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Department Modal */}
            {renameDept && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-blue-600">edit</span>
                                {t('rename_department', 'Rinomina Dipartimento')}
                            </h2>
                            <button onClick={() => setRenameDept(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleRenameDepartment} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('new_name', 'Nuovo nome')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRenameDept(null)}
                                    className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('cancel', 'Annulla')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRenaming}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center min-w-[120px] transition-colors disabled:opacity-70"
                                >
                                    {isRenaming ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        t('save', 'Salva')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Department Confirmation Modal */}
            {deleteDept && (
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
                                {t('delete_department_confirm', 'Sei sicuro di voler eliminare il dipartimento')}
                            </p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white mb-4">
                                {deleteDept.name}?
                            </p>
                            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-xl">
                                {t('delete_dept_warning', 'I membri del dipartimento non verranno eliminati, ma verrà rimossa la loro associazione.')}
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setDeleteDept(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {t('cancel', 'Annulla')}
                            </button>
                            <button
                                onClick={handleDeleteDepartment}
                                disabled={isDeletingDept}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center transition-colors disabled:opacity-70"
                            >
                                {isDeletingDept ? (
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

export default Departments;
