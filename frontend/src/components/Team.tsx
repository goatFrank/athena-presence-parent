import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import Footer from './Footer';
import barbequeIllustration from '../assets/illustrations/barbeque.svg';

interface Colleague {
    id: string;
    full_name: string;
    avatar_url: string;
    work_status: 'office' | 'remote' | 'leave' | 'unmarked';
    location_details: string;
    role_description: string;
}

const Team: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [filter, setFilter] = useState<'all' | 'office' | 'remote' | 'leave' | 'unmarked'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Date formatting and manipulation helpers
    const getFormattedDate = (date: Date) => {
        const formatted = date.toLocaleDateString(i18n.language === 'it' ? 'it-IT' : 'en-US', {
            day: 'numeric',
            month: 'long'
        });
        // Capitalize the first letter of the text part (the month)
        return formatted.replace(/[a-zA-Z\u00C0-\u017F]+/, (match) => match.charAt(0).toUpperCase() + match.slice(1));
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getDayName = (date: Date) => {
        if (isToday(date)) return t('today');
        return date.toLocaleDateString(i18n.language === 'it' ? 'it-IT' : 'en-US', { weekday: 'long' });
    };

    useEffect(() => {
        const fetchColleagues = async () => {
            setIsLoading(true);
            try {
                // Get auth token to call backend
                const sessionResponse = await supabase.auth.getSession();
                if (!sessionResponse.data.session?.access_token) return;

                const params: any = {};
                if (filter && filter !== 'all') {
                    params.filter = filter;
                }
                if (searchQuery) {
                    params.search = searchQuery;
                }

                // Format date as YYYY-MM-DD for the backend
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const isoDate = `${year}-${month}-${day}`;
                params.date = isoDate;

                const response = await attendanceApi.get('/api/v1/attendance/team-overview', { params });

                if (response.status === 200) {
                    const resData = response.data;

                    // The backend now returns a properly formatted list of TeamColleagueDTO
                    if (resData.payload) {
                        const mappedColleagues = resData.payload.map((c: any) => ({
                            id: c.id,
                            full_name: c.fullName || 'Utente',
                            avatar_url: c.avatarUrl || '',
                            work_status: c.workStatus || 'unmarked',
                            location_details: c.locationDetails || '',
                            role_description: c.roleDescription || ''
                        })).sort((a: any, b: any) => {
                            const statusWeight = (status: string) => {
                                if (status === 'office') return 1;
                                if (status === 'remote') return 2;
                                if (status === 'leave') return 3; // leave/absent
                                return 4; // unmarked
                            };
                            return statusWeight(a.work_status) - statusWeight(b.work_status);
                        });
                        setColleagues(mappedColleagues);
                    }
                }
            } catch (err: any) {
                console.error("Error fetching team data:", err);
                if (err.response) {
                    console.error("Failed to fetch team overview from backend API:", err.response.status);
                }
            } finally {
                setIsLoading(false);
            }
        };

        // Adding debounce for search query
        const timeoutId = setTimeout(() => {
            fetchColleagues();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filter, searchQuery, selectedDate]);

    // Calculate counts for the UI buttons (we still need this, so we compute it from the fetched colleagues)
    // NOTE: Ideally counts come from a separate endpoint to be accurate regardless of active filters,
    // but for now we maintain them locally if we can. 
    // Wait, if the array is filtered by the backend, we lose the accurate counts of the un-filtered states!
    // To solve this properly, the backend should either return counts separately, or we fetch totals once.
    // For now, let's adjust it by calculating only if filter==="all", or we just show what we have.
    // Actually, Dashboard style: the backend usually returns totals. Let's make an extra call or just accept dynamic counts.
    // Let's do a quick independent fetch for the counts to keep the UI perfect.

    const filteredColleagues = colleagues;

    // Use a separate state for total counts so they don't break when filtered
    const [counts, setCounts] = useState({ office: 0, remote: 0, leave: 0, unmarked: 0, total: 1 });

    useEffect(() => {
        // Only update total counts when showing 'all' and no search string,
        // so the header numbers remain stable when users click a filter!
        if (filter === 'all' && !searchQuery) {
            setCounts({
                office: colleagues.filter(c => c.work_status === 'office').length,
                remote: colleagues.filter(c => c.work_status === 'remote').length,
                leave: colleagues.filter(c => c.work_status === 'leave').length,
                unmarked: colleagues.filter(c => c.work_status === 'unmarked').length,
                total: colleagues.length || 1
            });
        }
    }, [colleagues, filter, searchQuery]);

    const inOfficeCount = counts.office;
    const remoteCount = counts.remote;
    const leaveCount = counts.leave;
    const unmarkedCount = counts.unmarked;
    const totalCount = counts.total;

    const inOfficePct = Math.round((inOfficeCount / totalCount) * 100);
    const remotePct = Math.round((remoteCount / totalCount) * 100);
    const leavePct = Math.round((leaveCount / totalCount) * 100);
    const unmarkedPct = Math.round((unmarkedCount / totalCount) * 100);

    const dynamicGradient = `conic-gradient(#8b5cf6 0% ${inOfficePct}%, #38bdf8 ${inOfficePct}% ${inOfficePct + remotePct}%, #ef4444 ${inOfficePct + remotePct}% ${inOfficePct + remotePct + leavePct}%, #e2e8f0 ${inOfficePct + remotePct + leavePct}% 100%)`;

    // Helper syntax for Weekend
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
    const isWeekendEmpty = isWeekend && unmarkedCount === colleagues.length;

    return (
        <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen flex w-full overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-0 md:ml-80 overflow-y-auto h-screen scroll-smooth">
                <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 lg:p-10 flex flex-col gap-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#0e121b] dark:text-white tracking-tight">{t('team_overview')}</h1>
                            <p className="text-[#4e6797] dark:text-slate-400 mt-1">{t('manage_team')}</p>
                        </div>
                    </div>

                    {/* Merged Dashboard Banner */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-10 -left-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex-1 w-full relative z-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-xl font-bold text-[#0e121b] dark:text-white flex items-center gap-3">
                                    <span className="material-symbols-outlined text-purple-500">calendar_month</span>
                                    {i18n.language === 'it'
                                        ? `Riepilogo presenze del ${getFormattedDate(selectedDate)}`
                                        : t('presence_summary_for', { date: getFormattedDate(selectedDate) })}
                                </h2>

                                {/* Date Navigation */}
                                <div className="flex items-center bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-sm border border-indigo-50 dark:border-slate-700">
                                    <button
                                        onClick={() => changeDate(-1)}
                                        className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border-0"
                                        title={t('previous_day')}
                                    >
                                        <span className="material-icons">chevron_left</span>
                                    </button>

                                    <button
                                        onClick={() => setSelectedDate(new Date())}
                                        className="px-6 font-bold text-slate-600 dark:text-slate-300 select-none bg-transparent hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border-0 capitalize"
                                    >
                                        {getDayName(selectedDate)}
                                    </button>

                                    <button
                                        onClick={() => changeDate(1)}
                                        className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border-0"
                                        title={t('next_day')}
                                    >
                                        <span className="material-icons">chevron_right</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6 sm:gap-8 lg:gap-12">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                                        <span className="text-sm font-medium text-[#4e6797] dark:text-slate-400 uppercase tracking-wide">{t('in_office')}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-[#0e121b] dark:text-white">{inOfficeCount}</span>
                                        <span className="text-sm text-purple-500 font-medium ml-1">{inOfficePct}%</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-sky-400 dark:bg-sky-400"></div>
                                        <span className="text-sm font-medium text-[#4e6797] dark:text-slate-400 uppercase tracking-wide">{t('remote_label')}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-[#0e121b] dark:text-white">{remoteCount}</span>
                                        <span className="text-sm text-sky-400 font-medium ml-1">{remotePct}%</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-500"></div>
                                        <span className="text-sm font-medium text-[#4e6797] dark:text-slate-400 uppercase tracking-wide">{t('absent')}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-[#0e121b] dark:text-white">{leaveCount}</span>
                                        <span className="text-sm text-red-500 font-medium ml-1">{leavePct}%</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                                        <span className="text-sm font-medium text-[#4e6797] dark:text-slate-400 uppercase tracking-wide">{i18n.language === 'it' ? 'Non Inserita' : 'Unmarked'}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-[#0e121b] dark:text-white">{unmarkedCount}</span>
                                        <span className="text-sm text-slate-500 font-medium ml-1">{unmarkedPct}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 relative z-10 hidden sm:flex pr-4">
                            <div className="w-32 h-32 rounded-full relative flex items-center justify-center transition-transform duration-500 hover:scale-105 shadow-xl shadow-purple-500/10" style={isWeekendEmpty ? {background: '#e2e8f0'} : { background: dynamicGradient }}>
                                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 flex flex-col items-center justify-center shadow-inner">
                                    <span className="text-3xl font-black text-[#0e121b] dark:text-white">{isWeekendEmpty ? 0 : colleagues.length}</span>
                                    <span className="text-[10px] text-[#4e6797] font-bold uppercase tracking-widest mt-0.5">{t('totals')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4e6797] group-focus-within:text-blue-500 transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white dark:bg-slate-800 text-[#0e121b] dark:text-white placeholder-[#4e6797] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                                placeholder={t('search_colleagues')}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar items-center">
                            <button
                                onClick={() => setFilter('all')}
                                className={`whitespace-nowrap px-5 py-3 rounded-xl font-semibold transition-all text-sm active:scale-95 border ${filter === 'all' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 border-transparent' : 'bg-white dark:bg-slate-800 text-[#4e6797] hover:text-blue-500 border-slate-200 dark:border-slate-700 hover:border-blue-500/30'}`}>
                                {t('all')}
                            </button>
                            <button
                                onClick={() => setFilter('office')}
                                className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all text-sm active:scale-95 border ${filter === 'office' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20 border-transparent' : 'bg-white dark:bg-slate-800 text-[#4e6797] hover:text-purple-500 border-slate-200 dark:border-slate-700 hover:border-purple-500/30'}`}>
                                {t('in_office')} <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'office' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{inOfficeCount}</span>
                            </button>
                            <button
                                onClick={() => setFilter('remote')}
                                className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all text-sm active:scale-95 border ${filter === 'remote' ? 'bg-sky-400 text-white shadow-md shadow-sky-400/20 border-transparent' : 'bg-white dark:bg-slate-800 text-[#4e6797] hover:text-sky-500 border-slate-200 dark:border-slate-700 hover:border-sky-500/30'}`}>
                                {t('remote_label')} <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'remote' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{remoteCount}</span>
                            </button>
                            <button
                                onClick={() => setFilter('leave')}
                                className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all text-sm active:scale-95 border ${filter === 'leave' ? 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md shadow-red-500/20 border-transparent' : 'bg-white dark:bg-slate-800 text-[#4e6797] hover:text-red-500 border-slate-200 dark:border-slate-700 hover:border-red-500/30'}`}>
                                {t('absent')} <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'leave' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{leaveCount}</span>
                            </button>
                            <button
                                onClick={() => setFilter('unmarked')}
                                className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all text-sm active:scale-95 border ${filter === 'unmarked' ? 'bg-slate-200 text-slate-700 shadow-md shadow-slate-200/20 border-transparent dark:bg-slate-700 dark:text-white' : 'bg-white dark:bg-slate-800 text-[#4e6797] hover:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-500/30'}`}>
                                {i18n.language === 'it' ? 'Non inserita' : 'Unmarked'} <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'unmarked' ? 'bg-black/10 dark:bg-white/20 text-current' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{unmarkedCount}</span>
                            </button>
                        </div>
                    </div>

                    {/* Team Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {isLoading ? (
                            <div className="col-span-full py-12 flex justify-center items-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                            </div>
                        ) : isWeekendEmpty ? (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="h-48 w-48 mb-6 relative flex justify-center items-center">
                                    <img 
                                        src={barbequeIllustration} 
                                        alt="Weekend Illustration" 
                                        className="h-full w-auto object-contain drop-shadow-lg opacity-90 transition-transform duration-500 hover:scale-105"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="rgba(0,0,0,0.05)" rx="16"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#64748b">empty.svg (weekend)</text></svg>';
                                        }}
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-[#0e121b] dark:text-white text-center">
                                    {i18n.language === 'it' ? "È il weekend!" : "It's the weekend!"}
                                </h3>
                                <p className="text-base text-[#4e6797] mt-2 text-center max-w-sm">
                                    {i18n.language === 'it' 
                                        ? "Nessuna presenza registrata per oggi. Il team si sta riposando." 
                                        : "No attendances recorded for today. The team is resting."}
                                </p>
                            </div>
                        ) : filteredColleagues.length === 0 ? (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="h-40 w-40 mb-5 relative flex justify-center items-center">
                                    <img 
                                        src={barbequeIllustration} 
                                        alt="Empty Illustration" 
                                        className="h-full w-auto object-contain drop-shadow-md opacity-75 grayscale sepia-0 transition-all duration-500 hover:grayscale-0 hover:scale-105"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="rgba(0,0,0,0.05)" rx="16"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">barbeque</text></svg>';
                                        }}
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-[#0e121b] dark:text-white">{t('no_colleague_found')}</h3>
                                <p className="text-sm text-[#4e6797] mt-1">{t('try_change_filters')}</p>
                            </div>
                        ) : (
                            filteredColleagues.map(colleague => (
                                <div key={colleague.id} className={`group relative flex flex-col bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-transparent 
                                    ${colleague.work_status === 'office' ? 'hover:border-purple-500/20' : colleague.work_status === 'remote' ? 'hover:border-sky-500/20' : colleague.work_status === 'leave' ? 'hover:border-red-500/20 opacity-80 hover:opacity-100' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}>

                                    <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100 dark:border-slate-700 relative">

                                        <div className="relative mb-4">
                                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-700/50 overflow-hidden">
                                                <img
                                                    src={colleague.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(colleague.full_name || 'U')}&background=195de6&color=fff&rounded=true&bold=true&size=256`}
                                                    alt={colleague.full_name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(colleague.full_name || 'U')}&background=195de6&color=fff&rounded=true&bold=true&size=256`;
                                                    }}
                                                />
                                            </div>
                                            <div className={`absolute bottom-1 right-1 size-5 border-2 border-white dark:border-slate-800 rounded-full 
                                                ${colleague.work_status === 'office' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : colleague.work_status === 'remote' ? 'bg-sky-400' : colleague.work_status === 'leave' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#0e121b] dark:text-white line-clamp-1 w-full" title={colleague.full_name}>{colleague.full_name}</h3>

                                        {colleague.role_description && (
                                            <p className="text-sm font-medium text-[#4e6797] dark:text-slate-400 mt-1 line-clamp-1">
                                                {colleague.role_description}
                                            </p>
                                        )}

                                        <div className="mt-3">
                                            {colleague.work_status === 'office' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-purple-500/10 text-indigo-600 dark:text-purple-400 text-xs font-bold ring-1 ring-purple-500/20 shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px]">apartment</span>
                                                    {t('in_office')}
                                                </span>
                                            )}
                                            {colleague.work_status === 'remote' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold ring-1 ring-sky-500/20 shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px]">home</span>
                                                    {t('remote_label')}
                                                </span>
                                            )}
                                            {colleague.work_status === 'leave' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-400 to-red-500 text-white text-xs font-bold shadow-sm shadow-red-500/20">
                                                    <span className="material-symbols-outlined text-[14px]">event_busy</span>
                                                    {t('absent')}
                                                </span>
                                            )}
                                            {colleague.work_status === 'unmarked' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold ring-1 ring-slate-200 dark:ring-slate-600 shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px]">help_center</span>
                                                    {i18n.language === 'it' ? 'Non inserita' : 'Not marked'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-between items-center text-sm text-[#4e6797] font-medium">
                                        <div className="flex items-center gap-1.5 truncate max-w-[100%]">
                                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                                            <span className="truncate">{colleague.location_details}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Team;
