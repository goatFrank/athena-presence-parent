import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { attendanceApi } from '../api/clients';

interface Tenant {
    id: number;
    name: string;
    status: string;
}

const SuperadminTenants: React.FC = () => {
    const { t } = useTranslation();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(0);
    const pageSize = 10;

    const fetchPendingTenants = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await attendanceApi.get('/api/v1/tenants/pending');
            setTenants(response.data.payload?.content || []);
        } catch (err: any) {
            console.error('Error fetching tenants:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error connecting to server';
            setError(`Failed to fetch pending tenants: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTenants();
    }, []);

    const handleUpdateStatus = async (id: number, action: 'approve' | 'reject') => {
        try {
            await attendanceApi.put(`/api/v1/tenants/${id}/${action}`);
            // Refresh list
            fetchPendingTenants();
        } catch (err: any) {
            console.error(`Error during ${action}:`, err);
        }
    };

    const displayedTenants = tenants.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(tenants.length / pageSize) || 1;

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-slate-900 flex">
            <Sidebar />
            <main className="flex-1 lg:ml-80 mr-0 md:mr-4 md:my-0 md:my-4 pt-20 px-4 pb-4 md:p-8 md:pt-12 rounded-none md:rounded-3xl bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-800/50 md:backdrop-blur-sm shadow-soft overflow-y-auto scroll-smooth h-screen md:h-[calc(100vh-2rem)]">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="px-1 md:px-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {t('tenant_approvals')}
                            </h1>
                            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                                {t('manage_tenant_requests', 'Gestisci le richieste di registrazione delle nuove aziende.')}
                            </p>
                        </div>
                        <button
                            onClick={fetchPendingTenants}
                            className="p-2.5 w-fit bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            <span className="material-icons text-[20px]">refresh</span>
                        </button>
                    </header>

                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <span className="material-icons animate-spin text-4xl text-blue-500">autorenew</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-red-600 flex items-center gap-4">
                            <span className="material-icons">error_outline</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && tenants.length === 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-soft">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="material-icons text-slate-400 text-3xl">domain_disabled</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('no_pending_tenants')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                Tutte le richieste sono state elaborate. Ottimo lavoro!
                            </p>
                        </div>
                    )}

                    {!loading && !error && tenants.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-800 overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-slate-50/50 dark:bg-slate-700/20 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('company_name_label')}</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">{t('status_label')}</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {displayedTenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                        {tenant.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{tenant.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-bold">
                                                    {tenant.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleUpdateStatus(tenant.id, 'approve')}
                                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95"
                                                    >
                                                        {t('approve')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(tenant.id, 'reject')}
                                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-bold transition-all active:scale-95"
                                                    >
                                                        {t('reject')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination Controls */}
                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                    {page * pageSize + 1} - {Math.min((page + 1) * pageSize, tenants.length)} di {tenants.length} aziende in attesa
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
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
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                                        page === i
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
                </div>
            </main>
        </div>
    );
};

export default SuperadminTenants;
