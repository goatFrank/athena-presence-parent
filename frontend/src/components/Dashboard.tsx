import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import startingWorkIllustration from '../assets/illustrations/startingWork.svg';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Dashboard: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [userName, setUserName] = useState<string>('');
    const [colleagues, setColleagues] = useState<any[]>([]);
    const [colleagueFilter, setColleagueFilter] = useState<'all' | 'office' | 'remote' | 'leave' | 'unmarked'>('all');
    const [teamPage, setTeamPage] = useState(0);
    const teamPageSize = 10;

    useEffect(() => {
        setTeamPage(0);
    }, [colleagueFilter]);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [userTenantId, setUserTenantId] = useState<number | null>(null);
    const [userDeptId, setUserDeptId] = useState<number | null>(null);

    const [weeklyDates, setWeeklyDates] = useState<{ date: Date, dateIso: string, isToday: boolean, isPast: boolean, status: string, name: string }[]>([]);
    const [dashboardStats, setDashboardStats] = useState<{ officeDays: number, remoteDays: number, sickDays: number, holidayDays: number, totalWorkingDays: number, teamPresencePercentage: number } | null>(null);
    const [todayStatus, setTodayStatus] = useState<string | null>(null);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardStats = async () => {
        try {
            const statsResponse = await attendanceApi.get('/api/v1/attendance/stats/dashboard');

            if (statsResponse.status === 200) {
                const statsData = statsResponse.data;
                setDashboardStats(statsData.payload);
            }
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
        }
    };

    useEffect(() => {
        const fetchUserAndColleagues = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // ... existing profile and colleagues code ...
                const { data: meData, error: meError } = await supabase
                    .from('profiles')
                    .select('full_name, id, tenant_id, department_id')
                    .eq('id', user.id);

                if (meError) {
                    setDebugInfo(`Errore query profiles: ${meError.message}`);
                } else if (!meData || meData.length === 0) {
                    setDebugInfo(`Profilo non trovato nella tabella "profiles" per l'ID in auth: ${user.id}. Verifica che la riga esista in "profiles" e che la RLS permetta la lettura.`);
                } else if (!meData[0].full_name) {
                    setDebugInfo(`Profilo trovato, ma il campo "full_name" è null/vuoto nel DB.`);
                }

                let myTenantId = null;
                let myDeptId = null;

                if (!meError && meData && meData.length > 0) {
                    const myProfile = meData[0];
                    myTenantId = myProfile.tenant_id;
                    myDeptId = myProfile.department_id;

                    setCurrentUserId(user.id);
                    setUserTenantId(myTenantId);
                    setUserDeptId(myDeptId);

                    if (myProfile.full_name) {
                        setUserName(myProfile.full_name);
                    } else {
                        const fallbackName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
                        setUserName(fallbackName);
                    }
                } else {
                    const fallbackName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
                    setUserName(fallbackName);
                    setCurrentUserId(user.id);
                }

                // Calculate current week dates (Monday to Friday)
                const todayCurrent = new Date();
                const currentDayOfWeek = todayCurrent.getDay(); // 0 is Sunday, 1 is Monday
                const diffToMonday = todayCurrent.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1);

                const mondayDate = new Date(todayCurrent.setDate(diffToMonday));
                const weekDates = [];
                for (let i = 0; i < 5; i++) {
                    const tempDate = new Date(mondayDate);
                    tempDate.setDate(mondayDate.getDate() + i);
                    weekDates.push(tempDate);
                }

                const startDateIso = weekDates[0].toISOString().split('T')[0];
                const endDateIso = weekDates[4].toISOString().split('T')[0];

                // Fetch my attendance for the week from the backend API
                let myWeeklyAttendances = [];
                try {
                    const response = await attendanceApi.get('/api/v1/attendance/me/range', {
                        params: { startDate: startDateIso, endDate: endDateIso }
                    });

                    if (response.status === 200) {
                        const resData = response.data;
                        myWeeklyAttendances = resData.payload || [];
                    } else {
                        console.error("Failed to fetch weekly attendance from backend:", response.status);
                    }
                } catch (err) {
                    console.error("Error fetching weekly attendance:", err);
                }

                // Fetch today's planned status
                try {
                    const todayRes = await attendanceApi.get('/api/v1/attendance/me/today');
                    if (todayRes.status === 200) {
                        const todayData = todayRes.data;
                        if (todayData.payload && todayData.payload.status) {
                            setTodayStatus(todayData.payload.status);
                            setPendingStatus(todayData.payload.status);
                        } else {
                            setTodayStatus(null);
                            setPendingStatus(null);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching today status:', err);
                }

                await fetchDashboardStats();

                const newWeeklyDates = weekDates.map(date => {
                    const dateIso = date.toISOString().split('T')[0];
                    const todayIso = new Date().toISOString().split('T')[0];
                    const att = myWeeklyAttendances?.find((a: any) => a.workDate === dateIso || a.work_date === dateIso);

                    const rawStatus = att?.status || 'OFFICE';
                    const isPast = dateIso < todayIso;

                    const dayNamesMap = ['mon', 'tue', 'wed', 'thu', 'fri'];

                    return {
                        date,
                        dateIso,
                        isToday: dateIso === todayIso,
                        isPast,
                        status: rawStatus,
                        name: dayNamesMap[date.getDay() - 1] || 'mon' // getDay: Mon=1..Fri=5
                    };
                });

                setWeeklyDates(newWeeklyDates);

                // 2. Fetch colleagues from profiles table including department
                let profilesQuery = supabase
                    .from('profiles')
                    .select(`
                        id,
                        full_name,
                        avatar_url,
                        departments (
                            name
                        )
                    `)
                    .neq('id', user.id); // Escludi te stesso

                if (myTenantId !== null && myTenantId !== undefined) {
                    profilesQuery = profilesQuery.eq('tenant_id', myTenantId);
                }
                if (myDeptId !== null && myDeptId !== undefined) {
                    profilesQuery = profilesQuery.eq('department_id', myDeptId);
                }

                const { data: profiles, error: profilesError } = await profilesQuery;

                // Fetch today's attendance for everyone via backend (bypassing RLS)
                const today = new Date().toISOString().split('T')[0];
                let attendances: any[] = [];
                try {
                    let endpoint = `/api/v1/attendance/team-overview?date=${today}`;

                    if (myTenantId !== null && myDeptId !== null) {
                        endpoint = `/api/v1/attendance/team/${myTenantId}/${myDeptId}?date=${today}`;
                    } else if (myTenantId !== null) {
                        endpoint = `/api/v1/attendance/tenant/${myTenantId}?date=${today}`;
                    }

                    const res = await attendanceApi.get(endpoint);

                    if (res.status === 200) {
                        const td = res.data;
                        const payloadData = Array.isArray(td.payload) ? td.payload : (td.payload?.content || []);
                        attendances = payloadData;
                    } else {
                        setDebugInfo((prev: string) => prev + `\nAPI Fetch Failed for team overview: ${res.status}`);
                    }
                } catch (e: any) {
                    console.error('Error fetching attendances:', e);
                    setDebugInfo((prev: string) => prev + `\nException in team fetch: ${e.message}`);
                }

                if (!profilesError && profiles) {
                    const mappedColleagues = profiles
                        // Only include those who have explicitly set an attendance status for today
                        .filter((p: any) => attendances?.some((a: any) => a.id === p.id || a.userId === p.id))
                        .map((p: any) => {
                            const todayAtt = attendances?.find((a: any) => a.id === p.id || a.userId === p.id);

                            // the backend returns TeamColleagueDTO with workStatus like 'office', 'remote', or 'leave'
                            // OR it returns Attendance which has 'status' (e.g. 'OFFICE', 'REMOTE')
                            const rawStatus = (todayAtt?.workStatus || todayAtt?.status || '').toLowerCase();
                            const isOffice = rawStatus.includes('office') || rawStatus.includes('sede') || rawStatus === 'in_office';
                            const isSickOrHoliday = rawStatus.includes('sick') || rawStatus.includes('holiday') || rawStatus.includes('malattia') || rawStatus.includes('ferie') || rawStatus.includes('leave') || rawStatus.includes('absent');

                            let workStatus = 'unmarked';
                            if (isOffice) workStatus = 'office';
                            else if (isSickOrHoliday) workStatus = 'absent';
                            else if (rawStatus.includes('remote') || rawStatus.includes('smart')) workStatus = 'remote';

                            return {
                                id: p.id,
                                full_name: p.full_name || 'Utente',
                                avatar_url: p.avatar_url || '',
                                work_status: workStatus,
                                location_details: p.departments?.name || 'Senza Dipartimento'
                            };
                        })
                        .sort((a: any, b: any) => {
                            const statusWeight = (status: string) => {
                                if (status === 'office') return 1;
                                if (status === 'remote') return 2;
                                return 3; // absent/leave
                            };
                            return statusWeight(a.work_status) - statusWeight(b.work_status);
                        });
                    setColleagues(mappedColleagues);
                } else {
                    console.error("Could not fetch profiles. Error:", profilesError);
                }
            }
            setIsLoading(false);
        };
        fetchUserAndColleagues();
    }, []);

    const handleConfirmTodayStatus = async () => {
        if (!currentUserId || !pendingStatus || pendingStatus === todayStatus) return;

        setIsUpdatingStatus(true);

        // Optimistic update
        const todayIso = new Date().toISOString().split('T')[0];
        setWeeklyDates(prevDays =>
            prevDays.map(d => d.dateIso === todayIso ? { ...d, status: pendingStatus } : d)
        );

        try {
            await attendanceApi.post('/api/v1/attendance', {
                userId: currentUserId,
                workDate: todayIso,
                status: pendingStatus,
                tenantId: userTenantId,
                departmentId: userDeptId
            });

            setTodayStatus(pendingStatus);
            await fetchDashboardStats();
        } catch (err) {
            console.error('Error saving today attendance:', err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const currentDay = new Date();
    const currentDayName = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(currentDay);
    const isFeminineDay = currentDay.getDay() === 0; // domenica/sunday is feminine in Italian greeting
    const greetingKey = isFeminineDay ? 'beautiful_day_f' : 'beautiful_day_m';

    const getStatusDetails = (status: string) => {
        const s = status.toUpperCase();
        if (s.includes('SICK') || s.includes('MALATTIA')) {
            return { icon: 'sick', label: t('sick'), textColor: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', gradient: 'from-red-400 to-red-500', groupHoverBg: 'group-hover:bg-red-500', shadowColor: 'shadow-red-200 dark:shadow-red-900/30' };
        }
        if (s.includes('HOLIDAY') || s.includes('FERIE')) {
            return { icon: 'beach_access', label: t('holiday'), textColor: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20', gradient: 'from-amber-400 to-orange-400', groupHoverBg: 'group-hover:bg-amber-500', shadowColor: 'shadow-amber-200 dark:shadow-amber-900/30' };
        }
        if (s.includes('REMOTE') || s.includes('SMART')) {
            return { icon: 'home', label: t('remote'), textColor: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-slate-700', gradient: 'from-cyan-400 to-blue-400', groupHoverBg: 'group-hover:bg-cyan-500', shadowColor: 'shadow-cyan-200 dark:shadow-cyan-900/30' };
        }
        return { icon: 'business', label: t('at_office'), textColor: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-slate-700', gradient: 'from-blue-500 to-blue-600', groupHoverBg: 'group-hover:bg-blue-500', shadowColor: 'shadow-blue-200 dark:shadow-blue-900/30' };
    };

    if (isLoading) {
        return (
            <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen flex w-full overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col ml-0 lg:ml-80 lg:mr-80 items-center justify-center h-screen">
                    <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-sm font-medium text-[#4e6797] dark:text-slate-400">
                            {t('loading', 'Caricamento...')}
                        </p>
                    </div>
                </div>
                <aside className="hidden lg:flex w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-[calc(100vh-2rem)] fixed right-0 top-0 overflow-hidden z-20 flex-col my-4 mr-4 rounded-l-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 dark:border-slate-600"></div>
                </aside>
            </div>
        );
    }

    return (
        <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen">
            <div className="flex w-full overflow-hidden">
                <Sidebar />

                {/* Main Content wrapper */}
                <div className="flex-1 flex flex-col lg:ml-80 lg:mr-80 overflow-y-auto h-screen scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Mobile top bar spacer */}
                    <div className="lg:hidden h-16 shrink-0" />
                    <main className="flex-1 pt-4 px-4 pb-4 md:p-10 flex flex-col">
                        <header className="mb-6 md:mb-10 relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] min-h-[180px] md:min-h-[220px]">
                            <div className="relative z-10 p-6 md:p-10 flex items-center justify-between w-full h-full">
                                <div className="max-w-lg">
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white mb-3 border border-white/30 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">wb_sunny</span>
                                        <span>{t('sunny_vibes')}</span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">{t('good_morning')}, {userName}!</h1>
                                    <p className="text-white/90 text-sm md:text-lg leading-relaxed mb-2 font-medium">{t(greetingKey, { day: currentDayName })}</p>
                                    {debugInfo && (
                                        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg shadow-sm">
                                            <p className="text-xs text-red-700 dark:text-red-300 font-mono break-words">{debugInfo}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="hidden lg:block pr-8 relative h-[140px] w-[200px] flex items-center justify-center">
                                    <img 
                                        src={startingWorkIllustration} 
                                        alt="Welcome Illustration" 
                                        className="h-full w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500 ease-out"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140"><rect width="200" height="140" fill="rgba(255,255,255,0.2)" rx="16"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="white">startingWork.svg</text></svg>';
                                        }}
                                    />
                                </div>
                            </div>
                        </header>

                        <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 p-5 md:p-8 mb-6 md:mb-10 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <h2 className="text-lg md:text-xl font-bold text-[#0e121b] dark:text-white flex items-center gap-2 m-0">
                                    <span className="w-2 h-6 bg-blue-500 rounded-full block"></span>
                                    {t('where_are_you')}
                                </h2>
                                <button
                                    onClick={handleConfirmTodayStatus}
                                    disabled={isUpdatingStatus || pendingStatus === todayStatus || pendingStatus === null}
                                    className={`px-5 py-2 text-sm rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${pendingStatus !== null && pendingStatus !== todayStatus && !isUpdatingStatus
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isUpdatingStatus ? (
                                        <span className="material-icons animate-spin text-[18px]">autorenew</span>
                                    ) : (
                                        <span className="material-icons text-[18px]">check_circle</span>
                                    )}
                                    {t('confirm')}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                {[
                                    { key: 'OFFICE', icon: 'business', label: t('at_office'), gradient: 'from-blue-500 to-blue-600', ring: 'ring-blue-400/30', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', hoverRing: 'hover:ring-blue-400/50' },
                                    { key: 'REMOTE', icon: 'home', label: t('remote'), gradient: 'from-cyan-400 to-blue-400', ring: 'ring-cyan-400/30', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600', hoverRing: 'hover:ring-cyan-400/50' },
                                    { key: 'SICK', icon: 'sick', label: t('sick'), gradient: 'from-red-400 to-red-500', ring: 'ring-red-400/30', iconBg: 'bg-red-50', iconColor: 'text-red-500', hoverRing: 'hover:ring-red-400/50' },
                                    { key: 'HOLIDAY', icon: 'beach_access', label: t('holiday'), gradient: 'from-amber-400 to-orange-400', ring: 'ring-amber-400/30', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', hoverRing: 'hover:ring-amber-400/50' },
                                ].map((s) => {
                                    const isActive = pendingStatus === s.key;
                                    return (
                                        <button
                                            key={s.key}
                                            onClick={() => setPendingStatus(s.key)}
                                            className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden cursor-pointer w-full focus:outline-none ${isActive
                                                ? `border-transparent ring-4 ${s.ring} shadow-lg scale-105`
                                                : `border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60 hover:opacity-100 hover:scale-[1.02] hover:shadow-md hover:border-transparent hover:ring-2 ${s.hoverRing}`
                                                }`}>
                                            {isActive && <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-100`}></div>}
                                            <div className="relative z-10 flex flex-col items-center text-center">
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 text-2xl shadow-inner transition-colors ${isActive ? 'bg-white/20 text-white' : `${s.iconBg} ${s.iconColor}`}`}>
                                                    <span className="material-icons">{s.icon}</span>
                                                </div>
                                                <span className={`block text-sm font-bold mb-0.5 transition-colors ${isActive ? 'text-white' : 'text-slate-600 dark:text-white'}`}>{s.label}</span>
                                            </div>
                                            {isActive && (
                                                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white text-green-500 flex items-center justify-center shadow-md z-10">
                                                    <span className="material-icons text-sm font-bold">check</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 md:mb-10">
                            <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                            <span className="material-icons text-xl">calendar_month</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[#0e121b] dark:text-white uppercase tracking-wider">{t('monthly_plan')}</h3>
                                            <p className="text-xs text-[#4e6797] dark:text-slate-400 font-medium">
                                                {t('planned_days')} <span className="font-bold text-[#0e121b] dark:text-white">{(dashboardStats?.officeDays ?? 0) + (dashboardStats?.remoteDays ?? 0) + (dashboardStats?.sickDays ?? 0) + (dashboardStats?.holidayDays ?? 0)}</span> {t('of_working_days', { total: dashboardStats?.totalWorkingDays ?? 20 })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-[#0e121b] dark:text-white">
                                            {Math.min(Math.round((((dashboardStats?.officeDays ?? 0) + (dashboardStats?.remoteDays ?? 0) + (dashboardStats?.sickDays ?? 0) + (dashboardStats?.holidayDays ?? 0)) / (dashboardStats?.totalWorkingDays || 20)) * 100), 100)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Computed Progress Array */}
                                {(() => {
                                    const totalDays = dashboardStats?.totalWorkingDays || 20;
                                    const plannedStats = [
                                        { id: 'office', count: dashboardStats?.officeDays ?? 0, label: t('office'), color: 'bg-indigo-600' },
                                        { id: 'remote', count: dashboardStats?.remoteDays ?? 0, label: t('remote'), color: 'bg-sky-400' },
                                        { id: 'holiday', count: dashboardStats?.holidayDays ?? 0, label: t('holidays_leaves'), color: 'bg-amber-400' },
                                        { id: 'sick', count: dashboardStats?.sickDays ?? 0, label: t('sick'), color: 'bg-red-400' },
                                    ].filter(s => s.count > 0).sort((a, b) => b.count - a.count); // Sort descending

                                    const totalPlanned = plannedStats.reduce((sum, s) => sum + s.count, 0);
                                    const unplanned = Math.max(0, totalDays - totalPlanned);

                                    let currentLeft = 0;

                                    return (
                                        <>
                                            {/* Progress Bar */}
                                            <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                                {plannedStats.map(stat => {
                                                    // Cap at 100 to avoid overflow rendering
                                                    const widthPct = Math.min((stat.count / totalDays) * 100, 100 - currentLeft);
                                                    const style = { left: `${currentLeft}%`, width: `${widthPct}%` };
                                                    currentLeft += widthPct;
                                                    return (
                                                        <div
                                                            key={stat.id}
                                                            className={`absolute top-0 h-full ${stat.color} transition-all duration-1000 ease-out`}
                                                            style={style}
                                                        ></div>
                                                    );
                                                })}
                                            </div>

                                            {/* Legend */}
                                            <div className="flex items-center flex-wrap gap-4 text-xs font-semibold">
                                                {plannedStats.map(stat => (
                                                    <div key={stat.id} className="flex items-center gap-1.5 text-[#4e6797] dark:text-slate-300 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-md">
                                                        <span className={`w-2 h-2 rounded-full ${stat.color}`}></span>
                                                        {stat.label}: {stat.count}
                                                    </div>
                                                ))}
                                                {unplanned > 0 && (
                                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 ml-auto bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-md">
                                                        <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></span>
                                                        {t('to_plan')}: {unplanned}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center text-center justify-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                                    <span className="material-icons text-xl md:text-2xl">group</span>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-[#0e121b] dark:text-white mb-1">{dashboardStats?.teamPresencePercentage ?? 0}%</p>
                                <p className="text-[10px] md:text-xs font-bold text-[#4e6797] dark:text-slate-400 uppercase tracking-wider">{t('team_presence')}</p>
                            </div>
                        </div>

                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-[#0e121b] dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-6 bg-cyan-400 rounded-full block"></span>
                                    {t('weekly_plan')}
                                </h3>
                                <Link to="/planning" className="text-xs md:text-sm bg-white dark:bg-slate-800 text-blue-600 font-semibold py-2 px-4 rounded-full shadow-sm hover:shadow border border-slate-100 dark:border-slate-700 transition-all">{t('edit_schedule')}</Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {weeklyDates.map((dayObj) => {
                                    const isToday = dayObj.isToday;
                                    const isPast = dayObj.isPast;
                                    const statusDetails = getStatusDetails(dayObj.status);

                                    if (isToday) {
                                        return (
                                            <div key={dayObj.dateIso} className="bg-white dark:bg-slate-800 rounded-3xl p-4 ring-4 ring-blue-100 dark:ring-blue-900 shadow-lg relative transform scale-105 z-10">
                                                <span className="absolute top-3 right-3 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                </span>
                                                <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase mb-3 block text-center">{t(dayObj.name)} {dayObj.date.getDate()}</span>
                                                <div className="flex flex-col items-center py-2">
                                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${statusDetails.gradient} text-white flex items-center justify-center mb-3 shadow-lg ${statusDetails.shadowColor}`}>
                                                        <span className="material-icons text-xl md:text-2xl">{statusDetails.icon}</span>
                                                    </div>
                                                    <span className="text-sm md:text-base font-bold text-[#0e121b] dark:text-white text-center">{statusDetails.label}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (isPast) {
                                        return (
                                            <div key={dayObj.dateIso} className="bg-slate-100/50 dark:bg-slate-800/30 rounded-3xl p-4 border border-transparent opacity-60 grayscale">
                                                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mb-3 block text-center">{t(dayObj.name)} {dayObj.date.getDate()}</span>
                                                <div className="flex flex-col items-center py-2">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center mb-3">
                                                        <span className="material-icons text-xl">{statusDetails.icon}</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">{statusDetails.label}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={dayObj.dateIso} className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-all cursor-pointer group hover:shadow-md">
                                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mb-2 md:mb-3 block text-center">{t(dayObj.name)} {dayObj.date.getDate()}</span>
                                            <div className="flex flex-col items-center py-1 md:py-2">
                                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${statusDetails.bgColor} ${statusDetails.textColor} ${statusDetails.groupHoverBg} group-hover:text-white transition-all flex items-center justify-center mb-2 md:mb-3`}>
                                                    <span className="material-icons text-lg md:text-xl">{statusDetails.icon}</span>
                                                </div>
                                                <span className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">{statusDetails.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </main>

                    <Footer />
                </div>

                {/* Sidebar Right */}
                <aside className="hidden lg:flex w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-[calc(100vh-2rem)] fixed right-0 top-0 overflow-hidden z-10 flex-col my-4 mr-4 rounded-l-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="p-6 pb-2">
                        <h3 className="text-lg font-bold text-[#0e121b] dark:text-white mb-4 flex items-center gap-2">
                            {t('whos_in')}
                        </h3>
                        <div className="relative mb-6 group">
                            <span className="material-icons absolute left-4 top-2.5 text-[#4e6797] group-focus-within:text-blue-500 transition-colors text-[20px]">search</span>
                            <input className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm text-[#0e121b] dark:text-white placeholder-[#4e6797] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all shadow-inner" placeholder={t('find_teammate')} type="text" />
                        </div>
                        <div className="flex p-1.5 bg-slate-100/80 dark:bg-slate-700 rounded-2xl mb-4">
                            <button
                                onClick={() => setColleagueFilter('all')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${colleagueFilter === 'all' ? 'text-blue-700 dark:text-white bg-white dark:bg-slate-600 shadow-sm' : 'text-[#4e6797] dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-600/50 hover:text-[#0e121b] dark:hover:text-white'}`}
                            >
                                {t('all')}
                            </button>
                            <button
                                onClick={() => setColleagueFilter('office')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${colleagueFilter === 'office' ? 'text-blue-700 dark:text-white bg-white dark:bg-slate-600 shadow-sm' : 'text-[#4e6797] dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-600/50 hover:text-[#0e121b] dark:hover:text-white'}`}
                            >
                                {t('office')}
                            </button>
                            <button
                                onClick={() => setColleagueFilter('remote')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${colleagueFilter === 'remote' ? 'text-blue-700 dark:text-white bg-white dark:bg-slate-600 shadow-sm' : 'text-[#4e6797] dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-600/50 hover:text-[#0e121b] dark:hover:text-white'}`}
                            >
                                {t('remote')}
                            </button>
                            <button
                                onClick={() => setColleagueFilter('unmarked' as any)}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${colleagueFilter === ('unmarked' as any) ? 'text-slate-700 dark:text-white bg-white dark:bg-slate-600 shadow-sm' : 'text-[#4e6797] dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-600/50 hover:text-[#0e121b] dark:hover:text-white'}`}
                            >
                                {i18n.language === 'it' ? 'Mancante' : 'Missing'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto scroll-smooth px-4 pb-4">
                        {debugInfo && (
                            <div className="text-xs break-all text-red-500 bg-red-100 dark:bg-red-900/30 p-2 rounded-lg mb-2">DEBUG: {debugInfo}</div>
                        )}
                        {(() => {
                            const filteredColleagues = colleagues.filter(c => colleagueFilter === 'all' || (c.work_status === 'office' && colleagueFilter === 'office') || (c.work_status === 'remote' && colleagueFilter === 'remote') || (c.work_status === 'unmarked' && colleagueFilter === ('unmarked' as any)));
                            const displayedColleagues = filteredColleagues.slice(teamPage * teamPageSize, (teamPage + 1) * teamPageSize);
                            const totalPages = Math.ceil(filteredColleagues.length / teamPageSize) || 1;

                            return (
                                <>
                                    {displayedColleagues.map(colleague => {
                                        const isAbsent = colleague.work_status === 'leave' || colleague.work_status === 'absent';
                                        const isUnmarked = colleague.work_status === 'unmarked';
                                        return (
                                            <div key={colleague.id} className={`flex items-center gap-3 group cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600 hover:shadow-sm ${colleague.work_status === 'remote' ? 'opacity-90' : isAbsent ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : isUnmarked ? 'opacity-60' : ''}`}>
                                                <div className="relative">
                                                    <img alt={`${colleague.full_name} avatar`} className={`w-11 h-11 rounded-2xl object-cover ${colleague.work_status === 'office' ? 'ring-2 ring-white dark:ring-slate-700' : ''}`} src={colleague.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(colleague.full_name)}&background=random`} />
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center ${colleague.work_status === 'office' ? 'bg-green-500' : colleague.work_status === 'remote' ? 'bg-amber-400' : isUnmarked ? 'bg-slate-300' : 'bg-slate-400'}`}>
                                                        {colleague.work_status === 'office' && <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${isAbsent || isUnmarked ? 'text-slate-400' : 'text-[#0e121b] dark:text-white'}`}>{colleague.full_name}</p>
                                                    <p className={`text-xs truncate font-medium ${colleague.work_status === 'office' ? 'text-blue-500' : colleague.work_status === 'remote' ? 'text-amber-500' : 'text-slate-400'}`}>
                                                        {colleague.work_status === 'office' ? t('in_office_status') : colleague.work_status === 'remote' ? t('remote_status') : isUnmarked ? (i18n.language === 'it' ? 'Non inserita' : 'Not marked') : t('unavailable')} • {colleague.location_details}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredColleagues.length === 0 && (
                                        <div className="text-center py-8 text-[#4e6797] dark:text-slate-400 text-sm">
                                            {t('no_colleagues_yet', 'Nessun collega qui...')}
                                        </div>
                                    )}
                                    {totalPages > 1 && (
                                        <div className="mt-6 flex justify-center items-center gap-3 pb-2">
                                            <button
                                                onClick={() => setTeamPage(p => Math.max(0, p - 1))}
                                                disabled={teamPage === 0}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-all shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                            </button>
                                            
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                {teamPage + 1} / {totalPages}
                                            </span>

                                            <button
                                                onClick={() => setTeamPage(p => Math.min(totalPages - 1, p + 1))}
                                                disabled={teamPage === totalPages - 1}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-all shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
