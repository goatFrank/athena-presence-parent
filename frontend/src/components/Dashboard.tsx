import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';

const Dashboard: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [userName, setUserName] = useState<string>('');
    const [colleagues, setColleagues] = useState<any[]>([]);
    const [colleagueFilter, setColleagueFilter] = useState<'all' | 'office' | 'remote'>('all');
    const [debugInfo, setDebugInfo] = useState<string>('');

    const [weeklyDates, setWeeklyDates] = useState<{ date: Date, dateIso: string, isToday: boolean, isPast: boolean, status: string, name: string }[]>([]);
    const [dashboardStats, setDashboardStats] = useState<{ officeDays: number, remoteDays: number, totalWorkingDays: number, teamPresencePercentage: number } | null>(null);

    useEffect(() => {
        const fetchUserAndColleagues = async () => {
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

                    if (myProfile.full_name) {
                        setUserName(myProfile.full_name);
                    } else {
                        const fallbackName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
                        setUserName(fallbackName);
                    }
                } else {
                    const fallbackName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
                    setUserName(fallbackName);
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
                const token = (await supabase.auth.getSession()).data.session?.access_token;

                let myWeeklyAttendances = [];
                try {
                    const response = await fetch(`http://localhost:8081/api/v1/attendance/me/range?startDate=${startDateIso}&endDate=${endDateIso}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const resData = await response.json();
                        myWeeklyAttendances = resData.payload || [];
                    } else {
                        console.error("Failed to fetch weekly attendance from backend:", response.status);
                    }
                } catch (err) {
                    console.error("Error fetching weekly attendance:", err);
                }

                try {
                    const statsResponse = await fetch(`http://localhost:8081/api/v1/attendance/stats/dashboard`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        setDashboardStats(statsData.payload);
                    } else {
                        console.error("Failed to fetch dashboard stats from backend:", statsResponse.status);
                    }
                } catch (err) {
                    console.error("Error fetching dashboard stats:", err);
                }

                const newWeeklyDates = weekDates.map(date => {
                    const dateIso = date.toISOString().split('T')[0];
                    const todayIso = new Date().toISOString().split('T')[0];
                    const att = myWeeklyAttendances?.find((a: any) => a.workDate === dateIso || a.work_date === dateIso);

                    const rawStatus = (att?.status || 'office').toLowerCase();
                    const isOffice = rawStatus.includes('office') || rawStatus.includes('sede') || rawStatus === 'in_office';
                    const isPast = dateIso < todayIso;

                    const dayNamesMap = ['mon', 'tue', 'wed', 'thu', 'fri'];

                    return {
                        date,
                        dateIso,
                        isToday: dateIso === todayIso,
                        isPast,
                        status: isOffice ? 'office' : 'remote',
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

                // Fetch today's attendance for everyone
                const today = new Date().toISOString().split('T')[0];
                const { data: attendances } = await supabase
                    .from('attendance')
                    .select('user_id, status, note')
                    .eq('work_date', today);

                if (!profilesError && profiles) {

                    const mappedColleagues = profiles.map((p: any) => {
                        const todayAtt = attendances?.find(a => a.user_id === p.id);
                        const rawStatus = (todayAtt?.status || 'remote').toLowerCase();
                        const isOffice = rawStatus.includes('office') || rawStatus.includes('sede') || rawStatus === 'in_office';

                        return {
                            id: p.id,
                            full_name: p.full_name || 'Utente',
                            avatar_url: '',
                            work_status: isOffice ? 'office' : 'remote',
                            location_details: todayAtt?.note || p.departments?.name || 'Available'
                        };
                    });
                    setColleagues(mappedColleagues);
                } else {
                    console.error("Could not fetch profiles. Error:", profilesError);
                }
            }
        };
        fetchUserAndColleagues();
    }, []);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'it' ? 'en' : 'it';
        i18n.changeLanguage(newLang);
    };

    const currentDay = new Date();
    const currentDayName = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(currentDay);
    const isFeminineDay = currentDay.getDay() === 0; // domenica/sunday is feminine in Italian greeting
    const greetingKey = isFeminineDay ? 'beautiful_day_f' : 'beautiful_day_m';

    return (
        <div className="bg-pattern text-slate-800 dark:text-slate-100 font-display min-h-screen flex w-full overflow-hidden">
            {/* Sidebar Left */}
            <aside className="w-72 bg-surface-light/90 dark:bg-surface-dark/95 backdrop-blur-md border-r border-blue-100 dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] rounded-r-3xl my-4 ml-4 h-[calc(100vh-2rem)]">
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">Athena</span>
                    </div>
                    {/* Language Switcher */}
                    <button
                        onClick={toggleLanguage}
                        className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        {i18n.language.toUpperCase()}
                    </button>
                </div>

                <nav className="flex-1 px-6 space-y-3 mt-6">
                    <a className="flex items-center gap-4 px-5 py-3.5 bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-semibold transition-all shadow-sm ring-1 ring-blue-100 dark:ring-blue-800" href="#">
                        <span className="material-icons text-[22px]">dashboard</span>
                        {t('dashboard_title')}
                    </a>
                    <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#">
                        <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">calendar_month</span>
                        {t('my_schedule')}
                    </a>
                    <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#">
                        <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">groups</span>
                        {t('team')}
                    </a>
                    <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#">
                        <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">map</span>
                        {t('office_map')}
                    </a>
                    <a className="flex items-center gap-4 px-5 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 transition-all rounded-2xl font-medium group hover:shadow-soft" href="#">
                        <span className="material-icons text-[22px] group-hover:text-blue-500 transition-colors">bar_chart</span>
                        {t('analytics')}
                    </a>
                </nav>

                <div className="p-6">
                    <div className="bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-blue-100 dark:border-slate-700">
                        <a className="flex items-center gap-3 hover:opacity-80 transition-opacity" href="#">
                            <img alt="User Profile" className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white dark:ring-slate-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1QBV7WZmz7TjVNshUYoQahDC_RdV-tUXrC2wyLqz-7Or5OBMk8T2J0NVFnFBkhABNaG0tRxaCeOwfEsWU2WF9CUrTP37ojylozW7VJjialXSqyAaREAiNp7NB5dk4kfo80qPyhstlMqMAMtXIVNlAwUgjWWj-Rq1ttRhRUrcoWbsCOURDnyqfDHnQ7kV9ZOSywfhC9GbK7gewj6RiRw0fRLv7pA4FtE_RWndNmQjtS6SBgPfZCd9hd3hDH9f8APAp6uiiG02nQko" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Product Designer</span>
                            </div>
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-80 mr-80 p-10 overflow-y-auto h-screen scroll-smooth">
                <header className="mb-10 relative overflow-hidden bg-gradient-to-r from-blue-100 to-cyan-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 shadow-soft flex items-center justify-between min-h-[180px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none mix-blend-multiply dark:mix-blend-soft-light"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300/30 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4 pointer-events-none mix-blend-multiply dark:mix-blend-soft-light"></div>

                    <div className="relative z-10 max-w-lg">
                        <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-300 mb-3 border border-white/50 dark:border-white/10 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">wb_sunny</span>
                            <span>Sunny Office Vibes</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">{t('good_morning')}, {userName}!</h1>
                        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-2">{t(greetingKey, { day: currentDayName })}</p>
                        {debugInfo && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg shadow-sm">
                                <p className="text-xs text-red-700 dark:text-red-300 font-mono break-words">{debugInfo}</p>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 hidden lg:block pr-8">
                        <svg className="drop-shadow-lg" fill="none" height="140" viewBox="0 0 200 140" width="200" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="160" cy="40" fill="#FDE047" fillOpacity="0.8" r="30"></circle>
                            <path d="M40 140V80C40 74.4772 44.4772 70 50 70H150C155.523 70 160 74.4772 160 80V140H40Z" fill="url(#paint0_linear)"></path>
                            <rect fill="white" fillOpacity="0.9" height="40" rx="4" width="90" x="55" y="90"></rect>
                            <rect fill="#E2E8F0" height="2" rx="1" width="70" x="65" y="100"></rect>
                            <rect fill="#E2E8F0" height="2" rx="1" width="50" x="65" y="108"></rect>
                            <path d="M20 140H60V110C60 104.477 55.523 100 50 100H30C24.4772 100 20 104.477 20 110V140Z" fill="#CBD5E1"></path>
                            <defs>
                                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="100" x2="100" y1="70" y2="140">
                                    <stop stopColor="#60A5FA"></stop>
                                    <stop offset="1" stopColor="#3B82F6"></stop>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </header>

                <section className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-soft border border-white dark:border-slate-700 p-8 mb-10 relative overflow-hidden">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 relative z-10 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full block"></span>
                        {t('where_are_you')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <label className="relative cursor-pointer group/card w-full">
                            <input defaultChecked className="peer sr-only" name="status" type="radio" />
                            <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] border-4 border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 peer-checked:border-transparent peer-checked:ring-4 peer-checked:ring-blue-400/30 relative overflow-hidden h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 peer-checked:bg-white/20 peer-checked:text-white flex items-center justify-center mb-4 transition-colors text-3xl shadow-inner">
                                        <span className="material-icons">business</span>
                                    </div>
                                    <span className="block text-xl font-bold text-slate-700 dark:text-white peer-checked:text-white mb-1">At the Office</span>
                                    <span className="text-sm font-medium text-slate-400 dark:text-slate-400 peer-checked:text-blue-100">Collaborating in person</span>
                                </div>
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white text-blue-600 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100 flex items-center justify-center shadow-md">
                                    <span className="material-icons text-sm font-bold">check</span>
                                </div>
                            </div>
                        </label>
                        <label className="relative cursor-pointer group/card w-full">
                            <input className="peer sr-only" name="status" type="radio" />
                            <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] border-4 border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 peer-checked:border-transparent peer-checked:ring-4 peer-checked:ring-cyan-400/30 relative overflow-hidden h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-400 opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-500 peer-checked:bg-white/20 peer-checked:text-white flex items-center justify-center mb-4 transition-colors text-3xl shadow-inner">
                                        <span className="material-icons">home</span>
                                    </div>
                                    <span className="block text-xl font-bold text-slate-700 dark:text-white peer-checked:text-white mb-1">Working Remotely</span>
                                    <span className="text-sm font-medium text-slate-400 dark:text-slate-400 peer-checked:text-blue-50">Focus time from home</span>
                                </div>
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white text-cyan-600 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100 flex items-center justify-center shadow-md">
                                    <span className="material-icons text-sm font-bold">check</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </section>

                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center justify-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-3">
                            <span className="material-icons">calendar_today</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{dashboardStats?.officeDays ?? 0}<span className="text-lg text-slate-400 font-medium">/{dashboardStats?.totalWorkingDays ?? 20}</span></p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('office_days')}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center justify-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-500 flex items-center justify-center mb-3">
                            <span className="material-icons">wifi</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{dashboardStats?.remoteDays ?? 0}<span className="text-lg text-slate-400 font-medium">/{dashboardStats?.totalWorkingDays ?? 20}</span></p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('remote_days')}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center justify-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mb-3">
                            <span className="material-icons">group</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{dashboardStats?.teamPresencePercentage ?? 0}%</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('team_presence')}</p>
                    </div>
                </div>

                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-cyan-400 rounded-full block"></span>
                            {t('weekly_plan')}
                        </h3>
                        <button className="text-sm bg-white dark:bg-slate-800 text-blue-600 font-semibold py-2 px-4 rounded-full shadow-sm hover:shadow border border-slate-100 dark:border-slate-700 transition-all">{t('edit_schedule')}</button>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                        {weeklyDates.map((dayObj) => {
                            const isToday = dayObj.isToday;
                            const isPast = dayObj.isPast;

                            if (isToday) {
                                return (
                                    <div key={dayObj.dateIso} className="bg-white dark:bg-surface-dark rounded-3xl p-4 ring-4 ring-blue-100 dark:ring-blue-900 shadow-lg relative transform scale-105 z-10">
                                        <span className="absolute top-3 right-3 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </span>
                                        <span className="text-xs font-bold text-blue-600 uppercase mb-3 block text-center">{t(dayObj.name)} {dayObj.date.getDate()}</span>
                                        <div className="flex flex-col items-center py-2">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-3 shadow-blue-200 shadow-lg">
                                                <span className="material-icons text-2xl">{dayObj.status === 'office' ? 'business' : 'home'}</span>
                                            </div>
                                            <span className="text-base font-bold text-slate-800 dark:text-white">{dayObj.status === 'office' ? t('at_office') : t('remote')}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (isPast) {
                                return (
                                    <div key={dayObj.dateIso} className="bg-slate-100/50 dark:bg-slate-800/30 rounded-3xl p-4 border border-transparent opacity-60 grayscale">
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-3 block text-center">{t(dayObj.name)} {dayObj.date.getDate()}</span>
                                        <div className="flex flex-col items-center py-2">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center mb-3">
                                                <span className="material-icons text-xl">{dayObj.status === 'office' ? 'business' : 'home'}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{dayObj.status === 'office' ? t('at_office') : t('remote')}</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={dayObj.dateIso} className="bg-white dark:bg-surface-dark rounded-3xl p-4 border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all cursor-pointer group hover:shadow-soft">
                                    <span className="text-xs font-bold text-slate-400 uppercase mb-3 block text-center">{t(dayObj.name)} {dayObj.date.getDate()}</span>
                                    <div className="flex flex-col items-center py-2">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-700 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all flex items-center justify-center mb-3">
                                            <span className="material-icons text-xl">{dayObj.status === 'office' ? 'business' : 'home'}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{dayObj.status === 'office' ? t('at_office') : t('remote')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Sidebar Right */}
            <aside className="w-80 bg-surface-light/90 dark:bg-surface-dark/95 backdrop-blur-md border-l border-blue-100 dark:border-slate-800 h-[calc(100vh-2rem)] fixed right-0 top-0 overflow-hidden z-10 flex flex-col my-4 mr-4 rounded-l-3xl shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-6 pb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        {t('whos_in')}
                    </h3>
                    <div className="relative mb-6 group">
                        <span className="material-icons absolute left-4 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors text-[20px]">search</span>
                        <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all shadow-inner" placeholder={t('find_teammate')} type="text" />
                    </div>
                    <div className="flex p-1.5 bg-slate-100/80 dark:bg-slate-800 rounded-2xl mb-4">
                        <button
                            onClick={() => setColleagueFilter('all')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${colleagueFilter === 'all' ? 'text-blue-700 dark:text-white bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'}`}
                        >
                            {t('all')}
                        </button>
                        <button
                            onClick={() => setColleagueFilter('office')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${colleagueFilter === 'office' ? 'text-blue-700 dark:text-white bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'}`}
                        >
                            {t('office')}
                        </button>
                        <button
                            onClick={() => setColleagueFilter('remote')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${colleagueFilter === 'remote' ? 'text-blue-700 dark:text-white bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'}`}
                        >
                            {t('remote')}
                        </button>
                    </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto px-4 pb-4">
                    {colleagues
                        .filter(c => colleagueFilter === 'all' || c.work_status === colleagueFilter)
                        .map(colleague => (
                            <div key={colleague.id} className={`flex items-center gap-3 group cursor-pointer p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all hover:shadow-soft border border-transparent hover:border-slate-50 dark:hover:border-slate-700 ${colleague.work_status === 'remote' ? 'opacity-70 hover:opacity-100' : ''}`}>
                                <div className="relative">
                                    <img alt={`${colleague.full_name} avatar`} className={`w-11 h-11 rounded-2xl object-cover ${colleague.work_status === 'office' ? 'ring-2 ring-white dark:ring-slate-700' : 'grayscale'}`} src={colleague.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(colleague.full_name)}&background=random`} />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center ${colleague.work_status === 'office' ? 'bg-green-500' : colleague.location_details === 'Busy' ? 'bg-amber-400' : 'bg-slate-400'}`}>
                                        {colleague.work_status === 'office' && <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{colleague.full_name}</p>
                                    <p className={`text-xs truncate font-medium ${colleague.work_status === 'office' ? 'text-blue-500' : 'text-slate-400'}`}>
                                        {colleague.work_status === 'office' ? 'In Office' : 'Remote'} • {colleague.location_details}
                                    </p>
                                </div>
                            </div>
                        ))
                    }
                    {colleagues.length === 0 && (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                            {t('no_colleagues_yet', 'Nessun collega qui...')}
                        </div>
                    )}
                </div>

                <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">{t('happening_now')}</h4>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 border border-orange-100 dark:border-orange-900/30 flex gap-3 items-center">
                        <div className="w-10 h-10 bg-white/80 dark:bg-white/10 p-2 rounded-xl text-orange-500 flex items-center justify-center shadow-sm">
                            <span className="material-icons text-[20px]">local_pizza</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{t('team_lunch')}</p>
                            <p className="text-xs text-slate-500 font-medium">{t('main_lobby')} • 12:30 PM</p>
                        </div>
                    </div>
                </div>
            </aside >
        </div >
    );
};

export default Dashboard;
