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
            <main className="flex-1 overflow-y-auto scroll-smooth pt-20 px-4 pb-4 md:p-8 ml-0 md:ml-80 mr-0 md:mr-4 md:my-0 md:my-4 rounded-none md:rounded-3xl bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-800/50 md:backdrop-blur-sm shadow-soft">
                <div className="max-w-6xl mx-auto">
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
                                    className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64 text-sm md:text-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={fetchAllTenants}
                                className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"
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
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-deep dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider uppercase">{t('company_id', 'ID')}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider uppercase">{t('company_name', 'Nome Azienda')}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider uppercase">{t('status', 'Stato')}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider uppercase text-right">{t('actions', 'Azioni')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <span>{t('loading_tenants', 'Caricamento aziende...')}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                                {t('no_tenants_found', 'Nessuna azienda trovata')}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTenants.map((tenant) => (
                                            <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-400 dark:text-slate-500 font-mono text-sm">#{tenant.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-900 dark:text-white">{tenant.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(tenant.status)} uppercase`}>
                                                        {t(`status_${tenant.status.toLowerCase()}`, tenant.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {tenant.status === 'ACTIVE' ? (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(tenant.id, tenant.name, 'ACTIVE')}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-all text-xs font-bold group border border-slate-200 hover:border-red-100"
                                                            >
                                                                <span className="material-icons text-sm">block</span>
                                                                {t('deactivate', 'Disattiva')}
                                                            </button>
                                                        ) : (
                                                            tenant.status !== 'PENDING' && (
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(tenant.id, tenant.name, tenant.status)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all text-xs font-bold border border-blue-100"
                                                                >
                                                                    <span className="material-icons text-sm">check_circle</span>
                                                                    {t('activate', 'Attiva')}
                                                                </button>
                                                            )
                                                        )}
                                                        
                                                        {tenant.status === 'PENDING' && (
                                                            <span className="text-xs text-slate-400 italic">
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
