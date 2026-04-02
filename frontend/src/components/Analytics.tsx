import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { attendanceApi } from '../api/clients';
import Sidebar from './Sidebar';
import Footer from './Footer';

// ── Types ──────────────────────────────────────────────────────────
interface AttendanceRecord {
    workDate: string; // "YYYY-MM-DD"
    status: string;
}

interface DashboardStats {
    officeDays: number;
    remoteDays: number;
    sickDays: number;
    holidayDays: number;
    totalWorkingDays: number;
    teamPresencePercentage: number;
}

type NormalizedStatus = 'office' | 'remote' | 'sick' | 'holiday' | null;

// ── Helpers ────────────────────────────────────────────────────────
function normalizeStatus(raw: string): NormalizedStatus {
    const s = raw?.toUpperCase().trim();
    if (s === 'IN_OFFICE' || s === 'OFFICE') return 'office';
    if (s === 'REMOTE' || s === 'WORKING_REMOTELY') return 'remote';
    if (s === 'SICK') return 'sick';
    if (s === 'HOLIDAY' || s === 'VACATION') return 'holiday';
    return null;
}

function pad2(n: number) { return String(n).padStart(2, '0'); }
function toIso(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

function getMonday(d: Date): Date {
    const copy = new Date(d);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function isWeekend(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
}

// ── Component ──────────────────────────────────────────────────────
const Analytics: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isIt = i18n.language === 'it';

    const [userName, setUserName] = useState('');
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
    const [prevMonthRecords, setPrevMonthRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // ── Data Fetching ──────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Profile
                const profileRes = await attendanceApi.get('/api/v1/profiles/me');
                if (profileRes.data?.payload) {
                    setUserName(profileRes.data.payload.fullName || 'User');
                }

                // Dashboard stats (current month)
                const statsRes = await attendanceApi.get('/api/v1/attendance/stats/dashboard');
                if (statsRes.status === 200) {
                    setDashStats(statsRes.data.payload);
                }

                // 3 months of attendance history
                const today = new Date();
                const threeMonthsAgo = new Date(today);
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                threeMonthsAgo.setDate(1);

                const rangeRes = await attendanceApi.get('/api/v1/attendance/me/range', {
                    params: { startDate: toIso(threeMonthsAgo), endDate: toIso(today) }
                });
                if (rangeRes.status === 200) {
                    setRecords((rangeRes.data.payload || []).map((r: any) => ({
                        workDate: r.workDate,
                        status: r.status
                    })));
                }

                // Previous month range
                const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                const prevRes = await attendanceApi.get('/api/v1/attendance/me/range', {
                    params: { startDate: toIso(prevMonthStart), endDate: toIso(prevMonthEnd) }
                });
                if (prevRes.status === 200) {
                    setPrevMonthRecords((prevRes.data.payload || []).map((r: any) => ({
                        workDate: r.workDate,
                        status: r.status
                    })));
                }
            } catch (err) {
                console.error('Analytics fetch error:', err);
            } finally {
                setIsLoading(false);
                setTimeout(() => setMounted(true), 50);
            }
        };
        fetchData();
    }, []);

    // ── Computed Data ──────────────────────────────────────────────

    // Status map for quick lookup
    const statusMap = useMemo(() => {
        const map = new Map<string, NormalizedStatus>();
        records.forEach(r => {
            const ns = normalizeStatus(r.status);
            if (ns) map.set(r.workDate, ns);
        });
        return map;
    }, [records]);

    // ── 1. HEATMAP DATA (12 weeks × 5 days) ──
    const heatmapData = useMemo(() => {
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
                week.push({ date: day, iso, status: statusMap.get(iso) || null });
            }
            weeks.push(week);
        }
        return weeks;
    }, [statusMap]);

    // ── 2. TREND DATA (daily, last 3 months → aggregated per week) ──
    const trendData = useMemo(() => {
        const weeks: { label: string; office: number; remote: number }[] = [];
        const today = new Date();
        const currentMonday = getMonday(today);

        for (let w = 11; w >= 0; w--) {
            const weekStart = new Date(currentMonday);
            weekStart.setDate(weekStart.getDate() - w * 7);
            let office = 0, remote = 0;
            for (let d = 0; d < 5; d++) {
                const day = new Date(weekStart);
                day.setDate(day.getDate() + d);
                const s = statusMap.get(toIso(day));
                if (s === 'office') office++;
                if (s === 'remote') remote++;
            }
            const weekLabel = `${pad2(weekStart.getDate())}/${pad2(weekStart.getMonth() + 1)}`;
            weeks.push({ label: weekLabel, office, remote });
        }
        return weeks;
    }, [statusMap]);

    // ── 3. STREAK DATA ──
    const streakData = useMemo(() => {
        const today = new Date();
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;

        // Walk backwards from today
        const d = new Date(today);
        while (true) {
            if (isWeekend(d)) { d.setDate(d.getDate() - 1); continue; }
            const iso = toIso(d);
            if (statusMap.has(iso)) {
                currentStreak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
            if (d < new Date(today.getFullYear(), today.getMonth() - 3, 1)) break;
        }

        // Walk through all records chronologically for max streak
        const sorted = [...records].sort((a, b) => a.workDate.localeCompare(b.workDate));
        for (const rec of sorted) {
            const ns = normalizeStatus(rec.status);
            if (ns) {
                tempStreak++;
                maxStreak = Math.max(maxStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        // Also handle consecutive calendar days approach for max
        // Walk day by day through range
        if (sorted.length > 0) {
            const start = new Date(sorted[0].workDate + 'T00:00:00');
            const end = new Date(sorted[sorted.length - 1].workDate + 'T00:00:00');
            let streak2 = 0;
            let max2 = 0;
            const iter = new Date(start);
            while (iter <= end) {
                if (!isWeekend(iter)) {
                    if (statusMap.has(toIso(iter))) {
                        streak2++;
                        max2 = Math.max(max2, streak2);
                    } else {
                        streak2 = 0;
                    }
                }
                iter.setDate(iter.getDate() + 1);
            }
            maxStreak = Math.max(maxStreak, max2);
        }

        // Best month for office & remote
        const monthCounts: Record<string, { office: number; remote: number }> = {};
        records.forEach(r => {
            const ns = normalizeStatus(r.status);
            const monthKey = r.workDate.substring(0, 7); // YYYY-MM
            if (!monthCounts[monthKey]) monthCounts[monthKey] = { office: 0, remote: 0 };
            if (ns === 'office') monthCounts[monthKey].office++;
            if (ns === 'remote') monthCounts[monthKey].remote++;
        });

        const MONTH_NAMES_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let bestOfficeMonth = '';
        let bestOfficeCount = 0;
        let bestRemoteMonth = '';
        let bestRemoteCount = 0;

        Object.entries(monthCounts).forEach(([key, val]) => {
            const [y, m] = key.split('-');
            const monthIdx = parseInt(m) - 1;
            const label = `${(isIt ? MONTH_NAMES_IT : MONTH_NAMES_EN)[monthIdx]} ${y}`;
            if (val.office > bestOfficeCount) { bestOfficeCount = val.office; bestOfficeMonth = label; }
            if (val.remote > bestRemoteCount) { bestRemoteCount = val.remote; bestRemoteMonth = label; }
        });

        return { currentStreak, maxStreak, bestOfficeMonth, bestOfficeCount, bestRemoteMonth, bestRemoteCount };
    }, [records, statusMap, isIt]);

    // ── 4. MONTH COMPARISON ──
    const monthComparison = useMemo(() => {
        const prevCounts = { office: 0, remote: 0, sick: 0, holiday: 0 };
        prevMonthRecords.forEach(r => {
            const ns = normalizeStatus(r.status);
            if (ns) prevCounts[ns]++;
        });

        const curr = {
            office: dashStats?.officeDays ?? 0,
            remote: dashStats?.remoteDays ?? 0,
            sick: dashStats?.sickDays ?? 0,
            holiday: dashStats?.holidayDays ?? 0,
        };

        return {
            current: curr,
            previous: prevCounts,
            delta: {
                office: curr.office - prevCounts.office,
                remote: curr.remote - prevCounts.remote,
                sick: curr.sick - prevCounts.sick,
                holiday: curr.holiday - prevCounts.holiday,
            }
        };
    }, [dashStats, prevMonthRecords]);

    // ── 5. CONSISTENCY SCORE ──
    const consistencyScore = useMemo(() => {
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        threeMonthsAgo.setDate(1);

        // Count working days in the 3 month range
        let totalWorkingDays = 0;
        let plannedDays = 0;
        const iter = new Date(threeMonthsAgo);
        while (iter <= today) {
            if (!isWeekend(iter)) {
                totalWorkingDays++;
                if (statusMap.has(toIso(iter))) plannedDays++;
            }
            iter.setDate(iter.getDate() + 1);
        }

        // Coverage score (0-40)
        const coveragePct = totalWorkingDays > 0 ? plannedDays / totalWorkingDays : 0;
        const coverageScore = Math.round(coveragePct * 40);

        // Streak bonus (0-30)
        const streakBonus = Math.min(30, Math.round((streakData.currentStreak / 20) * 30));

        // Balance score (0-30): how balanced office vs remote
        let officeDays3m = 0, remoteDays3m = 0;
        records.forEach(r => {
            const ns = normalizeStatus(r.status);
            if (ns === 'office') officeDays3m++;
            if (ns === 'remote') remoteDays3m++;
        });
        const total = officeDays3m + remoteDays3m;
        const balance = total > 0 ? 1 - Math.abs(officeDays3m - remoteDays3m) / total : 0;
        const balanceScore = Math.round(balance * 30);

        return Math.min(100, coverageScore + streakBonus + balanceScore);
    }, [statusMap, records, streakData]);

    // ── 6. DAY-OF-WEEK DISTRIBUTION ──
    const dayDistribution = useMemo(() => {
        const days = [
            { name: isIt ? 'Lunedì' : 'Monday', short: isIt ? 'Lun' : 'Mon', office: 0, remote: 0, other: 0 },
            { name: isIt ? 'Martedì' : 'Tuesday', short: isIt ? 'Mar' : 'Tue', office: 0, remote: 0, other: 0 },
            { name: isIt ? 'Mercoledì' : 'Wednesday', short: isIt ? 'Mer' : 'Wed', office: 0, remote: 0, other: 0 },
            { name: isIt ? 'Giovedì' : 'Thursday', short: isIt ? 'Gio' : 'Thu', office: 0, remote: 0, other: 0 },
            { name: isIt ? 'Venerdì' : 'Friday', short: isIt ? 'Ven' : 'Fri', office: 0, remote: 0, other: 0 },
        ];

        records.forEach(r => {
            const d = new Date(r.workDate + 'T00:00:00');
            const dow = d.getDay(); // 0=Sun, 1=Mon...5=Fri
            if (dow >= 1 && dow <= 5) {
                const ns = normalizeStatus(r.status);
                if (ns === 'office') days[dow - 1].office++;
                else if (ns === 'remote') days[dow - 1].remote++;
                else if (ns) days[dow - 1].other++;
            }
        });

        const maxTotal = Math.max(...days.map(d => d.office + d.remote + d.other), 1);

        // Find favorite office and remote days
        let favOfficeDay = '';
        let favRemoteDay = '';
        let maxOffice = 0, maxRemote = 0;
        days.forEach(d => {
            if (d.office > maxOffice) { maxOffice = d.office; favOfficeDay = d.name; }
            if (d.remote > maxRemote) { maxRemote = d.remote; favRemoteDay = d.name; }
        });

        return { days, maxTotal, favOfficeDay, favRemoteDay };
    }, [records, isIt]);

    // ── SVG Trend chart builder ──
    const buildTrendSVG = () => {
        const w = 600, h = 160, padding = 20;
        const maxVal = Math.max(...trendData.map(d => Math.max(d.office, d.remote)), 1);
        const stepX = (w - padding * 2) / (trendData.length - 1 || 1);

        const buildPath = (key: 'office' | 'remote') => {
            const points = trendData.map((d, i) => ({
                x: padding + i * stepX,
                y: h - padding - (d[key] / maxVal) * (h - padding * 2)
            }));
            const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            const area = `${line} L${points[points.length - 1].x},${h - padding} L${points[0].x},${h - padding} Z`;
            return { line, area };
        };

        return { w, h, padding, maxVal, stepX, officePath: buildPath('office'), remotePath: buildPath('remote') };
    };

    const trend = buildTrendSVG();

    // ── Heatmap color ──
    const getHeatmapColor = (status: NormalizedStatus, dark: boolean) => {
        if (!status) return dark ? 'rgb(51,65,85)' : 'rgb(241,245,249)';
        if (status === 'office') return dark ? 'rgb(99,102,241)' : 'rgb(99,102,241)';
        if (status === 'remote') return dark ? 'rgb(56,189,248)' : 'rgb(56,189,248)';
        if (status === 'sick') return dark ? 'rgb(239,68,68)' : 'rgb(239,68,68)';
        if (status === 'holiday') return dark ? 'rgb(251,191,36)' : 'rgb(251,146,60)';
        return dark ? 'rgb(51,65,85)' : 'rgb(241,245,249)';
    };

    const getHeatmapLabel = (status: NormalizedStatus) => {
        if (!status) return isIt ? 'Non inserita' : 'Not marked';
        if (status === 'office') return isIt ? 'Ufficio' : 'Office';
        if (status === 'remote') return isIt ? 'Remoto' : 'Remote';
        if (status === 'sick') return isIt ? 'Malattia' : 'Sick';
        if (status === 'holiday') return isIt ? 'Ferie' : 'Holiday';
        return '';
    };

    // ── Ring chart helper ──
    const RingChart: React.FC<{ data: { office: number; remote: number; sick: number; holiday: number }; size?: number; label: string }> = ({ data, size = 120, label }) => {
        const total = data.office + data.remote + data.sick + data.holiday || 1;
        const r = (size - 12) / 2;
        const circumference = 2 * Math.PI * r;

        const segments = [
            { value: data.office, color: '#6366f1' },
            { value: data.remote, color: '#38bdf8' },
            { value: data.sick, color: '#ef4444' },
            { value: data.holiday, color: '#f59e0b' },
        ];

        let offset = 0;
        return (
            <div className="flex flex-col items-center gap-2">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-700" />
                    {segments.map((seg, i) => {
                        const dashLen = (seg.value / total) * circumference;
                        const el = (
                            <circle
                                key={i}
                                cx={size / 2}
                                cy={size / 2}
                                r={r}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth="8"
                                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        );
                        offset += dashLen;
                        return el;
                    })}
                    <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-slate-800 dark:fill-white text-lg font-black transform rotate-90" style={{ transformOrigin: 'center', fontSize: '18px', fontWeight: 900 }}>
                        {total}
                    </text>
                </svg>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
        );
    };

    // ── Circular Progress ──
    const CircularProgress: React.FC<{ value: number; size?: number }> = ({ value, size = 160 }) => {
        const r = (size - 16) / 2;
        const circumference = 2 * Math.PI * r;
        const dashLen = (value / 100) * circumference;

        const getColor = (v: number) => {
            if (v >= 80) return '#22c55e';
            if (v >= 60) return '#6366f1';
            if (v >= 40) return '#f59e0b';
            return '#ef4444';
        };

        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-700" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={getColor(value)}
                    strokeWidth="10"
                    strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
                <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-slate-800 dark:fill-white transform rotate-90" style={{ transformOrigin: 'center', fontSize: '28px', fontWeight: 900 }}>
                    {value}
                </text>
            </svg>
        );
    };

    // ── Stagger delay helper ──
    const stagger = (i: number) => ({
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`
    });

    // Day abbreviations for heatmap rows
    const dayLabels = isIt ? ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    const MONTH_NAMES_IT_FULL = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const MONTH_NAMES_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const currentMonthName = (isIt ? MONTH_NAMES_IT_FULL : MONTH_NAMES_EN_FULL)[now.getMonth()];
    const prevMonthName = (isIt ? MONTH_NAMES_IT_FULL : MONTH_NAMES_EN_FULL)[(now.getMonth() - 1 + 12) % 12];

    // ── Loading State ──
    if (isLoading) {
        return (
            <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen flex w-full overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col ml-0 lg:ml-80 items-center justify-center h-screen">
                    <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-sm font-medium text-[#4e6797] dark:text-slate-400">
                            {t('loading', 'Caricamento...')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div className="bg-[#f0f4f8] dark:bg-[#0f172a] text-[#0e121b] dark:text-slate-100 min-h-screen">
            <div className="flex w-full overflow-hidden">
                <Sidebar />

                <div className="flex-1 flex flex-col lg:ml-80 overflow-y-auto h-screen scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Mobile top bar spacer */}
                    <div className="lg:hidden h-16 shrink-0" />

                    <main className="flex-1 pt-4 px-4 pb-8 md:p-10 flex flex-col gap-6 md:gap-8 max-w-[1400px] mx-auto w-full">

                        {/* ── Header ── */}
                        <div style={stagger(0)}>
                            <header className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] min-h-[140px] md:min-h-[180px]">
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
                                </div>
                                <div className="relative z-10 p-6 md:p-10 flex items-center justify-between w-full">
                                    <div>
                                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white mb-3 border border-white/30">
                                            <span className="material-symbols-outlined text-[16px]">insights</span>
                                            <span>{isIt ? 'I tuoi dati' : 'Your insights'}</span>
                                        </div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
                                            {isIt ? 'Statistiche' : 'Analytics'}, {userName}
                                        </h1>
                                        <p className="text-white/80 text-sm md:text-base">
                                            {isIt ? 'Analisi delle tue presenze negli ultimi 3 mesi' : 'Your attendance analysis for the last 3 months'}
                                        </p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                            <span className="material-symbols-outlined text-white text-3xl">analytics</span>
                                        </div>
                                    </div>
                                </div>
                            </header>
                        </div>

                        {/* Row 1: Heatmap + Score */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                            {/* ── 1. HEATMAP ── */}
                            <div className="lg:col-span-2" style={stagger(1)}>
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 p-5 md:p-8 h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xl">grid_view</span>
                                            </div>
                                            <div>
                                                <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                                                    {isIt ? 'Mappa Presenze' : 'Attendance Heatmap'}
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {isIt ? 'Ultime 12 settimane' : 'Last 12 weeks'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <div className="min-w-[460px]">
                                            <div className="flex gap-1.5">
                                                {/* Day labels column */}
                                                <div className="flex flex-col gap-1.5 pt-0 mr-1">
                                                    {dayLabels.map(l => (
                                                        <div key={l} className="h-6 md:h-7 flex items-center">
                                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-7">{l}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Weeks */}
                                                {heatmapData.map((week, wi) => (
                                                    <div key={wi} className="flex flex-col gap-1.5 flex-1">
                                                        {week.map((day, di) => {
                                                            const isFuture = day.date > new Date();
                                                            return (
                                                                <div
                                                                    key={di}
                                                                    className={`h-6 md:h-7 rounded-md transition-all duration-200 ${isFuture ? 'opacity-20' : 'hover:scale-110 hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-500 cursor-pointer'}`}
                                                                    style={{ backgroundColor: getHeatmapColor(day.status, false) }}
                                                                    title={`${day.iso} — ${getHeatmapLabel(day.status)}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center gap-3 mt-5 flex-wrap">
                                        {[
                                            { color: 'bg-indigo-500', label: isIt ? 'Ufficio' : 'Office' },
                                            { color: 'bg-sky-400', label: isIt ? 'Remoto' : 'Remote' },
                                            { color: 'bg-red-500', label: isIt ? 'Malattia' : 'Sick' },
                                            { color: 'bg-amber-500', label: isIt ? 'Ferie' : 'Holiday' },
                                            { color: 'bg-slate-200 dark:bg-slate-600', label: isIt ? 'Vuoto' : 'Empty' },
                                        ].map(l => (
                                            <div key={l.label} className="flex items-center gap-1.5">
                                                <div className={`w-3 h-3 rounded-sm ${l.color}`}></div>
                                                <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400">{l.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── 5. CONSISTENCY SCORE ── */}
                            <div style={stagger(2)}>
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 p-5 md:p-8 h-full flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">verified</span>
                                        </div>
                                        <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                                            {isIt ? 'Punteggio Regolarità' : 'Consistency Score'}
                                        </h2>
                                    </div>
                                    <CircularProgress value={consistencyScore} />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 max-w-[200px] leading-relaxed font-medium">
                                        {consistencyScore >= 80
                                            ? (isIt ? 'Eccellente! Sei molto costante nella pianificazione.' : 'Excellent! You\'re very consistent.')
                                            : consistencyScore >= 60
                                                ? (isIt ? 'Buono! Continua a pianificare regolarmente.' : 'Good! Keep planning regularly.')
                                                : consistencyScore >= 40
                                                    ? (isIt ? 'Discreto. Prova a pianificare più giorni.' : 'Fair. Try planning more days.')
                                                    : (isIt ? 'Inizia a pianificare le presenze regolarmente!' : 'Start planning your attendance regularly!')}
                                    </p>
                                    <div className="grid grid-cols-3 gap-3 mt-6 w-full">
                                        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{isIt ? 'Copertura' : 'Coverage'}</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{Math.round((consistencyScore / 100) * 40)}/40</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Streak</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{Math.min(30, Math.round((streakData.currentStreak / 20) * 30))}/30</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{isIt ? 'Equilibrio' : 'Balance'}</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{consistencyScore - Math.round((consistencyScore / 100) * 40) - Math.min(30, Math.round((streakData.currentStreak / 20) * 30))}/30</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Trend + Streaks */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                            {/* ── 2. TREND LINE ── */}
                            <div className="lg:col-span-2" style={stagger(3)}>
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 p-5 md:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xl">trending_up</span>
                                            </div>
                                            <div>
                                                <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                                                    {isIt ? 'Trend Settimanale' : 'Weekly Trend'}
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {isIt ? 'Giorni ufficio vs remoto per settimana' : 'Office vs remote days per week'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-1.5 rounded-full bg-indigo-500"></div>
                                                <span className="text-[10px] font-bold text-slate-500">{isIt ? 'Ufficio' : 'Office'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-1.5 rounded-full bg-sky-400"></div>
                                                <span className="text-[10px] font-bold text-slate-500">{isIt ? 'Remoto' : 'Remote'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <svg viewBox={`0 0 ${trend.w} ${trend.h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                                        {/* Grid lines */}
                                        {[0, 1, 2, 3, 4, 5].map(v => {
                                            const y = trend.h - trend.padding - (v / 5) * (trend.h - trend.padding * 2);
                                            return (
                                                <g key={v}>
                                                    <line x1={trend.padding} y1={y} x2={trend.w - trend.padding} y2={y} stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-700" />
                                                    <text x={trend.padding - 8} y={y + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: '9px' }}>{v}</text>
                                                </g>
                                            );
                                        })}
                                        {/* Area fills */}
                                        <path d={trend.remotePath.area} fill="#38bdf8" opacity="0.12" />
                                        <path d={trend.officePath.area} fill="#6366f1" opacity="0.12" />
                                        {/* Lines */}
                                        <path d={trend.remotePath.line} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d={trend.officePath.line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        {/* Dots */}
                                        {trendData.map((d, i) => (
                                            <g key={i}>
                                                <circle cx={trend.padding + i * trend.stepX} cy={trend.h - trend.padding - (d.office / trend.maxVal) * (trend.h - trend.padding * 2)} r="3" fill="#6366f1" />
                                                <circle cx={trend.padding + i * trend.stepX} cy={trend.h - trend.padding - (d.remote / trend.maxVal) * (trend.h - trend.padding * 2)} r="3" fill="#38bdf8" />
                                            </g>
                                        ))}
                                        {/* X labels */}
                                        {trendData.map((d, i) => (
                                            <text key={i} x={trend.padding + i * trend.stepX} y={trend.h - 4} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: '8px' }}>{d.label}</text>
                                        ))}
                                    </svg>
                                </div>
                            </div>

                            {/* ── 3. STREAKS ── */}
                            <div style={stagger(4)}>
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 p-5 md:p-8 h-full flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl">local_fire_department</span>
                                        </div>
                                        <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                                            {isIt ? 'Streak & Record' : 'Streak & Records'}
                                        </h2>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {/* Current streak */}
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
                                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">{isIt ? 'Streak Attuale' : 'Current Streak'}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-800 dark:text-white">{streakData.currentStreak}</span>
                                                <span className="text-sm font-bold text-slate-500">{isIt ? 'giorni' : 'days'}</span>
                                                {streakData.currentStreak >= 5 && <span className="text-xl">🔥</span>}
                                            </div>
                                        </div>

                                        {/* Record */}
                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{isIt ? 'Record' : 'Best Streak'}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-slate-800 dark:text-white">{streakData.maxStreak}</span>
                                                <span className="text-sm font-bold text-slate-500">{isIt ? 'giorni' : 'days'}</span>
                                                {streakData.maxStreak >= 15 && <span className="text-lg">🏆</span>}
                                            </div>
                                        </div>

                                        {/* Best months */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
                                                <span className="material-symbols-outlined text-indigo-500 text-lg mb-1 block">business</span>
                                                <p className="text-[9px] font-bold text-indigo-500 uppercase">{isIt ? 'Top Ufficio' : 'Top Office'}</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-white mt-0.5">{streakData.bestOfficeMonth || '—'}</p>
                                                <p className="text-[10px] text-slate-500">{streakData.bestOfficeCount}d</p>
                                            </div>
                                            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-100 dark:border-sky-800/30">
                                                <span className="material-symbols-outlined text-sky-500 text-lg mb-1 block">home</span>
                                                <p className="text-[9px] font-bold text-sky-500 uppercase">{isIt ? 'Top Remoto' : 'Top Remote'}</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-white mt-0.5">{streakData.bestRemoteMonth || '—'}</p>
                                                <p className="text-[10px] text-slate-500">{streakData.bestRemoteCount}d</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Month Comparison + Day Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                            {/* ── 4. MONTH vs MONTH ── */}
                            <div style={stagger(5)}>
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 p-5 md:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl">compare_arrows</span>
                                        </div>
                                        <div>
                                            <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                                                {isIt ? 'Confronto Mensile' : 'Monthly Comparison'}
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                {currentMonthName} vs {prevMonthName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-8 md:gap-12 mb-6">
                                        <RingChart data={monthComparison.current} label={currentMonthName} />
                                        <div className="text-2xl text-slate-300 dark:text-slate-600 font-bold">vs</div>
                                        <RingChart data={monthComparison.previous} label={prevMonthName} />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {([
                                            { key: 'office' as const, icon: 'business', label: isIt ? 'Ufficio' : 'Office', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                                            { key: 'remote' as const, icon: 'home', label: isIt ? 'Remoto' : 'Remote', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
                                            { key: 'sick' as const, icon: 'sick', label: isIt ? 'Malattia' : 'Sick', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                                            { key: 'holiday' as const, icon: 'beach_access', label: isIt ? 'Ferie' : 'Holiday', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                                        ]).map(item => {
                                            const delta = monthComparison.delta[item.key];
                                            return (
                                                <div key={item.key} className={`${item.bg} rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700`}>
                                                    <span className={`material-icons ${item.color} text-lg mb-1`}>{item.icon}</span>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</p>
                                                    <div className="flex items-center justify-center gap-1 mt-1">
                                                        <span className="text-lg font-black text-slate-800 dark:text-white">{monthComparison.current[item.key]}</span>
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
                            </div>

                            {/* ── 6. DAY-OF-WEEK DISTRIBUTION ── */}
                            <div style={stagger(6)}>
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 p-5 md:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl">calendar_view_week</span>
                                        </div>
                                        <div>
                                            <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                                                {isIt ? 'Abitudini Settimanali' : 'Weekly Habits'}
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                {isIt ? 'Distribuzione per giorno' : 'Distribution by day'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {dayDistribution.days.map(day => {
                                            const total = day.office + day.remote + day.other;
                                            const officePct = total > 0 ? (day.office / dayDistribution.maxTotal) * 100 : 0;
                                            const remotePct = total > 0 ? (day.remote / dayDistribution.maxTotal) * 100 : 0;
                                            return (
                                                <div key={day.short} className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 shrink-0">{day.short}</span>
                                                    <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex relative">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-l-lg transition-all duration-700 ease-out"
                                                            style={{ width: `${officePct}%` }}
                                                        />
                                                        <div
                                                            className="h-full bg-sky-400 transition-all duration-700 ease-out"
                                                            style={{ width: `${remotePct}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 w-16 shrink-0 justify-end">
                                                        <span className="text-xs font-bold text-indigo-500">{day.office}</span>
                                                        <span className="text-slate-300 dark:text-slate-600 text-[10px]">/</span>
                                                        <span className="text-xs font-bold text-sky-400">{day.remote}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Insights */}
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
                                            <p className="text-[9px] font-bold text-indigo-500 uppercase">{isIt ? 'Giorno preferito in ufficio' : 'Favorite office day'}</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{dayDistribution.favOfficeDay || '—'}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-100 dark:border-sky-800/30">
                                            <p className="text-[9px] font-bold text-sky-500 uppercase">{isIt ? 'Giorno preferito da remoto' : 'Favorite remote day'}</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{dayDistribution.favRemoteDay || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </main>

                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default Analytics;
