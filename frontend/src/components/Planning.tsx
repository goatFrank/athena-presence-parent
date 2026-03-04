import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabase';
import Sidebar from './Sidebar';

// ── Types ──────────────────────────────────────────────────────────
interface AttendanceRecord {
    id?: number;
    workDate: string;      // "YYYY-MM-DD"
    status: string;        // "IN_OFFICE" | "REMOTE" | "SICK" | "HOLIDAY"
}

type StatusType = 'IN_OFFICE' | 'REMOTE' | 'SICK' | 'HOLIDAY';

interface DayInfo {
    day: number;
    dateIso: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isPast: boolean;
    isWeekend: boolean;
    status: StatusType | null;
    attendanceId?: number;
}

// ── Helpers ────────────────────────────────────────────────────────
const MONTH_NAMES_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const DAY_HEADERS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusConfig: Record<StatusType, { icon: string; label_it: string; label_en: string; pillClass: string; cellBg: string; hoverBorder: string; textHover: string; dotColor: string }> = {
    IN_OFFICE: {
        icon: 'business',
        label_it: 'Ufficio',
        label_en: 'Office',
        pillClass: 'text-indigo-600 border-indigo-100 bg-indigo-100/50',
        cellBg: 'bg-indigo-50/50',
        hoverBorder: 'hover:border-indigo-100',
        textHover: 'group-hover:text-indigo-600',
        dotColor: 'bg-indigo-600'
    },
    REMOTE: {
        icon: 'home',
        label_it: 'Remoto',
        label_en: 'Remote',
        pillClass: 'text-sky-600 border-sky-100 bg-sky-50',
        cellBg: 'bg-sky-50/30',
        hoverBorder: 'hover:border-sky-100',
        textHover: 'group-hover:text-sky-600',
        dotColor: 'bg-sky-400'
    },
    SICK: {
        icon: 'sick',
        label_it: 'Malattia',
        label_en: 'Sick',
        pillClass: 'text-red-500 border-red-100 bg-red-50',
        cellBg: 'bg-red-50/30',
        hoverBorder: 'hover:border-red-100',
        textHover: 'group-hover:text-red-500',
        dotColor: 'bg-red-400'
    },
    HOLIDAY: {
        icon: 'beach_access',
        label_it: 'Ferie',
        label_en: 'Holiday',
        pillClass: 'text-amber-600 border-amber-100 bg-amber-50',
        cellBg: 'bg-amber-50/30',
        hoverBorder: 'hover:border-amber-100',
        textHover: 'group-hover:text-amber-500',
        dotColor: 'bg-amber-400'
    }
};

function normalizeStatus(raw: string): StatusType | null {
    const s = raw?.toUpperCase().trim();
    if (s === 'IN_OFFICE' || s === 'OFFICE') return 'IN_OFFICE';
    if (s === 'REMOTE' || s === 'WORKING_REMOTELY') return 'REMOTE';
    if (s === 'SICK') return 'SICK';
    if (s === 'HOLIDAY' || s === 'VACATION') return 'HOLIDAY';
    return null;
}

function pad2(n: number) { return String(n).padStart(2, '0'); }

function toIso(year: number, month: number, day: number) {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

// ── Component ──────────────────────────────────────────────────────
const Planning: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isIt = i18n.language === 'it';

    const [userName, setUserName] = useState('');
    const [userTenantId, setUserTenantId] = useState<number | null>(null);
    const [userDeptId, setUserDeptId] = useState<number | null>(null);
    const [allowOvertime, setAllowOvertime] = useState<boolean>(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
    const [days, setDays] = useState<DayInfo[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Stats
    const [officeCount, setOfficeCount] = useState(0);
    const [remoteCount, setRemoteCount] = useState(0);
    const [sickCount, setSickCount] = useState(0);
    const [holidayCount, setHolidayCount] = useState(0);

    const monthNames = isIt ? MONTH_NAMES_IT : MONTH_NAMES_EN;
    const dayHeaders = isIt ? DAY_HEADERS_IT : DAY_HEADERS_EN;

    // ── Fetch user profile (name, tenantId, departmentId) ──
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('full_name, tenant_id, department_id, allow_overtime').eq('id', user.id);
                if (data && data[0]) {
                    setUserName(data[0].full_name || user.email?.split('@')[0] || 'User');
                    setUserTenantId(data[0].tenant_id);
                    setUserDeptId(data[0].department_id);
                    setAllowOvertime(!!data[0].allow_overtime);
                } else {
                    setUserName(user.email?.split('@')[0] || 'User');
                }
            }
        };
        fetchUser();
    }, []);

    // ── Build calendar grid + fetch attendance ──
    const buildCalendar = useCallback(async () => {
        setLoading(true);
        const today = new Date();
        const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

        // First day of the month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startDow = firstDay.getDay(); // 0=Sun

        // Last day of the month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Build grid: fill previous month days
        const grid: DayInfo[] = [];

        // Previous month overflow
        const prevMonthLast = new Date(currentYear, currentMonth, 0);
        for (let i = startDow - 1; i >= 0; i--) {
            const d = prevMonthLast.getDate() - i;
            const pm = currentMonth === 0 ? 11 : currentMonth - 1;
            const py = currentMonth === 0 ? currentYear - 1 : currentYear;
            const iso = toIso(py, pm, d);
            grid.push({
                day: d,
                dateIso: iso,
                isCurrentMonth: false,
                isToday: false,
                isPast: iso < todayIso,
                isWeekend: false,
                status: null
            });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dow = new Date(currentYear, currentMonth, d).getDay();
            const iso = toIso(currentYear, currentMonth, d);
            grid.push({
                day: d,
                dateIso: iso,
                isCurrentMonth: true,
                isToday: iso === todayIso,
                isPast: iso < todayIso,
                isWeekend: dow === 0 || dow === 6,
                status: null
            });
        }

        // Next month overflow (fill to 42 cells = 6 rows)
        const remaining = 42 - grid.length;
        for (let d = 1; d <= remaining; d++) {
            const nm = currentMonth === 11 ? 0 : currentMonth + 1;
            const ny = currentMonth === 11 ? currentYear + 1 : currentYear;
            const iso = toIso(ny, nm, d);
            grid.push({
                day: d,
                dateIso: iso,
                isCurrentMonth: false,
                isToday: false,
                isPast: iso < todayIso,
                isWeekend: false,
                status: null
            });
        }

        // Fetch attendance for the visible range
        const startDate = grid[0].dateIso;
        const endDate = grid[grid.length - 1].dateIso;

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            const response = await fetch(
                `${import.meta.env.VITE_ATTENDANCE_API_URL}/api/v1/attendance/me/range?startDate=${startDate}&endDate=${endDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const json = await response.json();
                const records: AttendanceRecord[] = (json.payload || []).map((r: any) => ({
                    id: r.id,
                    workDate: r.workDate,
                    status: r.status
                }));

                // Map attendance to grid
                for (const rec of records) {
                    const idx = grid.findIndex(g => g.dateIso === rec.workDate);
                    if (idx >= 0) {
                        grid[idx].status = normalizeStatus(rec.status);
                        grid[idx].attendanceId = rec.id;
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }

        // Compute stats for current month only
        const monthDays = grid.filter(d => d.isCurrentMonth);
        setOfficeCount(monthDays.filter(d => d.status === 'IN_OFFICE').length);
        setRemoteCount(monthDays.filter(d => d.status === 'REMOTE').length);
        setSickCount(monthDays.filter(d => d.status === 'SICK').length);
        setHolidayCount(monthDays.filter(d => d.status === 'HOLIDAY').length);

        setDays(grid);
        setLoading(false);
    }, [currentYear, currentMonth]);

    useEffect(() => {
        buildCalendar();
    }, [buildCalendar]);

    // ── Navigation ──
    const goToPrevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
        setSelectedDay(null);
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
        setSelectedDay(null);
    };

    const goToToday = () => {
        const now = new Date();
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
        setSelectedDay(null);
    };

    // ── Save attendance ──
    const handleSelectStatus = async (dateIso: string, status: StatusType) => {
        setSelectedDay(null);
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Map frontend status to backend WorkMode enum
            const backendStatus = status === 'IN_OFFICE' ? 'OFFICE' : status;

            await fetch(`${import.meta.env.VITE_ATTENDANCE_API_URL}/api/v1/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    workDate: dateIso,
                    status: backendStatus,
                    tenantId: userTenantId,
                    departmentId: userDeptId
                })
            });

            // Refresh
            buildCalendar();
        } catch (err) {
            console.error('Error saving attendance:', err);
        }
    };

    // ── Delete attendance ──
    const handleDeleteAttendance = async (dateIso: string) => {
        setSelectedDay(null);
        const dayInfo = days.find(d => d.dateIso === dateIso);
        if (!dayInfo?.attendanceId) return;

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            await fetch(`http://localhost:8081/api/v1/attendance/${dayInfo.attendanceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            buildCalendar();
        } catch (err) {
            console.error('Error deleting attendance:', err);
        }
    };

    // ── Render helpers ──
    const getStatusLabel = (s: StatusType) => isIt ? statusConfig[s].label_it : statusConfig[s].label_en;

    const renderDayCell = (d: DayInfo, idx: number) => {
        if (!d.isCurrentMonth) {
            return (
                <div key={idx} className="aspect-square flex flex-col items-center justify-start pt-2 rounded-2xl transition-all duration-300 relative overflow-hidden opacity-30">
                    <span className="text-slate-400 text-sm font-bold">{d.day}</span>
                </div>
            );
        }

        // If weekend and overtime not allowed, render grey disabled cell
        if (d.isWeekend && !allowOvertime) {
            return (
                <div key={idx}
                    className="aspect-square flex flex-col items-center justify-start pt-2 rounded-2xl bg-slate-50/50 text-slate-300 relative overflow-hidden cursor-not-allowed"
                    title={t('weekend_disabled')}
                >
                    <span className="font-bold text-sm">{d.day}</span>
                </div>
            );
        }

        const cfg = d.status ? statusConfig[d.status] : null;
        const isSelected = selectedDay === d.dateIso;

        // Past days: show status dot but NOT clickable
        if (d.isPast) {
            return (
                <div key={idx}
                    className="aspect-square flex flex-col items-center justify-start pt-2 rounded-2xl relative overflow-hidden opacity-50 cursor-not-allowed bg-slate-50/30"
                    title={t('cannot_edit_past')}
                >
                    <span className="text-slate-400 text-sm font-bold">{d.day}</span>
                    {cfg && (
                        <div className={`w-3 h-3 rounded-full mt-1.5 shadow-sm ${cfg.dotColor}`}></div>
                    )}
                </div>
            );
        }

        // Today gets a special ring
        if (d.isToday) {
            return (
                <div key={idx}
                    className={`aspect-square flex flex-col items-center justify-start pt-2 rounded-2xl relative overflow-visible cursor-pointer bg-gradient-to-b from-white to-indigo-50 ring-4 ring-indigo-200 shadow-lg shadow-indigo-300/40 transition-all duration-300 ${isSelected ? 'z-50 scale-105' : 'z-20 scale-105 hover:z-30'}`}
                    onClick={() => setSelectedDay(isSelected ? null : d.dateIso)}
                >
                    <span className={`font-extrabold text-base drop-shadow-sm ${d.isWeekend ? 'text-red-400' : 'text-indigo-600'}`}>{d.day}</span>
                    <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none rounded-2xl"></div>
                    {cfg && (
                        <div className={`w-3 h-3 rounded-full mt-1.5 shadow-sm ${cfg.dotColor}`}></div>
                    )}
                    {isSelected && renderPopup(d)}
                </div>
            );
        }

        return (
            <div key={idx}
                className={`aspect-square flex flex-col items-center justify-start pt-2 rounded-2xl relative overflow-visible cursor-pointer group border-2 border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isSelected ? 'z-50 shadow-xl border-indigo-200' : `hover:z-30 ${cfg ? cfg.cellBg : (d.isWeekend ? 'bg-slate-50/50' : 'bg-white')}`} ${cfg ? cfg.hoverBorder : 'hover:border-indigo-100'}`}
                onClick={() => setSelectedDay(isSelected ? null : d.dateIso)}
            >
                <span className={`text-sm font-bold ${cfg ? cfg.textHover : (d.isWeekend ? 'text-red-300 group-hover:text-red-400' : 'text-slate-600 group-hover:text-indigo-600')}`}>{d.day}</span>
                {cfg && (
                    <div className={`w-3 h-3 rounded-full mt-1.5 shadow-sm ${cfg.dotColor}`}></div>
                )}
                {isSelected && renderPopup(d)}
            </div>
        );
    };

    const renderPopup = (d: DayInfo) => (
        <div className="absolute left-1/2 -translate-x-1/2 top-[105%] w-44 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-indigo-100/50 z-50 overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
                {(Object.keys(statusConfig) as StatusType[]).map((s) => (
                    <button key={s}
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ${d.status === s ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                        onClick={() => handleSelectStatus(d.dateIso, s)}
                    >
                        <span className={`w-2 h-2 rounded-full ${statusConfig[s].dotColor}`}></span>
                        {getStatusLabel(s)}
                    </button>
                ))}
                {d.status && (
                    <button
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 bg-transparent hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors border-t border-slate-100 mt-1 pt-2"
                        onClick={() => handleDeleteAttendance(d.dateIso)}
                    >
                        <span className="material-icons text-[14px]">delete</span>
                        {isIt ? 'Rimuovi' : 'Remove'}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-athena-soft text-slate-700 min-h-screen flex w-full overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(#E0E7FF 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            onClick={() => setSelectedDay(null)}
        >
            <Sidebar />

            <div className="flex-1 ml-80 overflow-y-auto h-screen scroll-smooth">
                {/* ── Main Content ── */}
                <main className="font-calendar antialiased max-w-7xl mx-auto w-full px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10"
                    onClick={(e) => e.stopPropagation()}>

                    {/* ── Calendar Area (8 cols) ── */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Month Header */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-glow border border-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                                    <span className="material-icons text-3xl">calendar_month</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-extrabold text-slate-800">
                                        {monthNames[currentMonth]} <span className="text-indigo-400">{currentYear}</span>
                                    </h2>
                                    <p className="text-slate-500 font-medium">
                                        {t('where_create_magic')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-sm border border-indigo-50">
                                <button onClick={goToPrevMonth} className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border-0">
                                    <span className="material-icons">chevron_left</span>
                                </button>
                                <button onClick={goToToday} className="px-6 font-bold text-slate-600 select-none bg-transparent hover:text-indigo-600 transition-colors border-0">
                                    {t('today')}
                                </button>
                                <button onClick={goToNextMonth} className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border-0">
                                    <span className="material-icons">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="bg-white rounded-3xl shadow-float border border-indigo-50/50 p-6 relative overflow-visible">
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 mb-4">
                                {dayHeaders.map((dh) => (
                                    <div key={dh} className="text-center text-xs font-bold uppercase tracking-wider text-indigo-300">{dh}</div>
                                ))}
                            </div>

                            {/* Day cells */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <span className="material-icons animate-spin text-indigo-300 text-4xl">autorenew</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-7 gap-3">
                                    {days.map((d, idx) => renderDayCell(d, idx))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Sidebar (4 cols) ── */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Greeting Card */}
                        <div className="bg-indigo-600 rounded-3xl shadow-xl overflow-hidden relative min-h-[220px] flex items-center justify-center text-center p-6 text-white">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-indigo-500 opacity-90"></div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 ring-4 ring-white/30">
                                    <span className="material-icons text-5xl text-indigo-500">face_5</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                    <p className="font-bold text-lg">{t('hello')}, {userName || 'User'}!</p>
                                    <p className="text-indigo-100 text-sm">
                                        {t('plan_your_month')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Pulse */}
                        <div className="bg-white rounded-3xl shadow-soft-glow border border-indigo-50 p-6 relative overflow-hidden">
                            <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                                {t('monthly_pulse')}
                            </h3>
                            <div className="space-y-6 relative z-10">
                                {/* Office */}
                                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 transition-transform hover:scale-[1.02]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                                                <span className="material-icons text-xl">business</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{t('in_office_label')}</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-indigo-600">{officeCount}</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3 p-0.5 shadow-inner">
                                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full shadow-sm transition-all duration-500"
                                            style={{ width: `${Math.min((officeCount / 20) * 100, 100)}%` }}></div>
                                    </div>
                                </div>

                                {/* Remote */}
                                <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100 transition-transform hover:scale-[1.02]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-sky-500">
                                                <span className="material-icons text-xl">home</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{t('remote_single')}</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-sky-500">{remoteCount}</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3 p-0.5 shadow-inner">
                                        <div className="bg-gradient-to-r from-sky-500 to-sky-300 h-2 rounded-full shadow-sm transition-all duration-500"
                                            style={{ width: `${Math.min((remoteCount / 20) * 100, 100)}%` }}></div>
                                    </div>
                                </div>

                                {/* Sick + Holiday */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 text-center hover:bg-red-50 transition-colors">
                                        <span className="material-icons text-red-400 mb-1">sick</span>
                                        <p className="text-xs font-bold text-red-400 uppercase">{t('sick_label')}</p>
                                        <span className="text-xl font-black text-slate-800">{sickCount}</span>
                                    </div>
                                    <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 text-center hover:bg-amber-50 transition-colors">
                                        <span className="material-icons text-amber-400 mb-1">beach_access</span>
                                        <p className="text-xs font-bold text-amber-400 uppercase">{t('holiday_label')}</p>
                                        <span className="text-xl font-black text-slate-800">{holidayCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-white">
                            <div className="flex flex-wrap gap-3 justify-center">
                                {(Object.keys(statusConfig) as StatusType[]).map((s) => (
                                    <div key={s} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                                        <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[s].dotColor}`}></span>
                                        <span className="text-xs font-bold text-slate-600">{getStatusLabel(s)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Back to Dashboard */}
                        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl shadow-soft-glow border border-indigo-100 p-6 relative overflow-hidden">
                            <div className="relative z-10 text-center">
                                <p className="text-slate-500 text-sm mb-4 font-medium">
                                    {t('back_to_overview')}
                                </p>
                                <Link to="/dashboard"
                                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                    <span className="material-icons text-sm">dashboard</span>
                                    Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </main >

                {/* ── Footer ── */}
                < footer className="mt-10 border-t border-indigo-100 bg-white/50 backdrop-blur-sm py-8" >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-slate-400 text-sm font-medium">© 2026 Athena Systems. Crafted with 💙 for the team.</p>
                    </div>
                </footer >
            </div >
        </div >
    );
};

export default Planning;
