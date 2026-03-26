import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { attendanceApi } from '../api/clients';

interface Tenant {
    id: number;
    name: string;
    status: string;
}

const SuperadminManageTenants: React.FC = () => {
    const { t } = useTranslation();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModalData, setConfirmModalData] = useState<{ id: number, name: string, newStatus: string, actionLabel: string } | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const fetchAllTenants = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await attendanceApi.get('/api/v1/tenants/all');
            setTenants(response.data.payload?.content || []);
        } catch (err: any) {
            console.error('Error fetching tenants:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error connecting to server';
            setError(`Failed to fetch tenants: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllTenants();
    }, []);

    const handleUpdateStatus = (id: number, name: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        const actionLabel = newStatus === 'ACTIVE' ? t('activate', 'Attiva') : t('deactivate', 'Disattiva');
        setConfirmModalData({ id, name, newStatus, actionLabel });
    };

    const executeStatusUpdate = async () => {
        if (!confirmModalData) return;
        setIsUpdatingStatus(true);
        try {
            await attendanceApi.put(`/api/v1/tenants/${confirmModalData.id}/status?status=${confirmModalData.newStatus}`);
            setConfirmModalData(null);
            fetchAllTenants();
        } catch (err: any) {
            console.error(`Error during status update:`, err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const filteredTenants = tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            case 'DISABLED': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 overflow-y-auto scroll-smooth px-4 pb-4 md:p-8 ml-0 lg:ml-80 mr-0 md:mr-4 md:my-0 md:my-4 rounded-none md:rounded-3xl bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-800/50 md:backdrop-blur-sm shadow-soft">
                {/* Mobile top bar spacer */}
                <div className="lg:hidden h-16 shrink-0" />
                <div className="max-w-6xl mx-auto pt-4 md:pt-0">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="px-1 md:px-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {t('manage_companies', 'Gestione Aziende')}
                            </h1>
                            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                                {t('manage_all_tenants_desc', 'Visualizza e gestisci lo stato di attivazione di tutte le aziende registrate.')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                                <input 
                                    type="text"
                                    placeholder={t('search_tenants', 'Cerca...')}
                                    className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-sm md:text-base transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={fetchAllTenants}
                                className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-900 transition-all"
                                title={t('refresh', 'Aggiorna')}
                            >
                                <span className="material-icons text-[20px]">refresh</span>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <span className="material-icons">error_outline</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Table Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] w-24">{t('company_id', 'ID')}</th>
                                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{t('company_name', 'Nome Azienda')}</th>
                                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] w-48">{t('status', 'Stato')}</th>
                                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] w-48">{t('actions', 'Azioni')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-slate-500">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-10 h-10 border-[3px] border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                                        <span className="text-sm font-medium animate-pulse">{t('loading_tenants', 'Caricamento aziende...')}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredTenants.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                                    <div className="flex flex-col items-center gap-2 opacity-60">
                                                        <span className="material-icons text-4xl mb-2">search_off</span>
                                                        {t('no_tenants_found', 'Nessuna azienda trovata')}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTenants.map((tenant) => (
                                                <tr key={tenant.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200">
                                                    <td className="px-8 py-5">
                                                        <span className="text-slate-400 dark:text-slate-500 font-mono text-xs bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">#{tenant.id}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold shadow-sm group-hover:scale-110 transition-transform">
                                                                <img 
                                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.name)}&background=3B82F6&color=fff&rounded=false&bold=true&size=80`} 
                                                                    alt="" 
                                                                    className="w-full h-full rounded-xl object-cover"
                                                                />
                                                            </div>
                                                            <span className="font-bold text-slate-800 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tenant.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold border shadow-sm ${getStatusColor(tenant.status)} uppercase tracking-wider`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse"></span>
                                                            {t(`status_${tenant.status.toLowerCase()}`, tenant.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-left">
                                                        <div className="flex items-center justify-start gap-3 transition-opacity">
                                                            {tenant.status === 'ACTIVE' ? (
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(tenant.id, tenant.name, 'ACTIVE')}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl transition-all text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 shadow-sm"
                                                                >
                                                                    <span className="material-icons text-sm">block</span>
                                                                    {t('deactivate', 'Disattiva')}
                                                                </button>
                                                            ) : (
                                                                tenant.status !== 'PENDING' && (
                                                                    <button 
                                                                        onClick={() => handleUpdateStatus(tenant.id, tenant.name, tenant.status)}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-blue-200 dark:shadow-none hover:-translate-y-0.5"
                                                                    >
                                                                        <span className="material-icons text-sm">check_circle</span>
                                                                        {t('activate', 'Attiva')}
                                                                    </button>
                                                                )
                                                            )}
                                                            
                                                            {tenant.status === 'PENDING' && (
                                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                                                    {t('approve_on_other_page', 'Richiede approvazione')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {confirmModalData && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300 ${confirmModalData.newStatus === 'ACTIVE' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                                <span className="material-icons text-4xl">{confirmModalData.newStatus === 'ACTIVE' ? 'check_circle' : 'warning'}</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                                {confirmModalData.actionLabel} {t('company', 'Azienda')}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed px-4">
                                {t('confirm_action', 'Sei sicuro di voler')} <span className="font-bold lowercase">{confirmModalData.actionLabel}</span> {t('the_following_company', 'la seguente azienda')}?
                            </p>
                            <p className="text-base font-extrabold text-slate-900 dark:text-white mb-6 bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-2xl">
                                {confirmModalData.name}
                            </p>
                        </div>
                        <div className="p-8 pt-0 flex gap-3">
                            <button
                                onClick={() => setConfirmModalData(null)}
                                className="flex-1 px-6 py-3.5 rounded-2xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                            >
                                {t('cancel', 'Annulla')}
                            </button>
                            <button
                                onClick={executeStatusUpdate}
                                disabled={isUpdatingStatus}
                                className={`flex-1 px-6 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-70 ${confirmModalData.newStatus === 'ACTIVE' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                            >
                                {isUpdatingStatus ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>{confirmModalData.actionLabel}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperadminManageTenants;
