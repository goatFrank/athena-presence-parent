import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useToast } from './Toast';

interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string;
    department: string;
    officeLocation: string;
    roleDescription: string;
    phone: string;
    allowOvertime?: boolean;
}

interface DashboardStats {
    officeDays: number;
    remoteDays: number;
    sickDays: number;
    holidayDays: number;
    totalWorkingDays: number;
    teamPresencePercentage: number;
}

const Profile: React.FC = () => {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const { addToast } = useToast();

    // Settings mock state
    const [emailNotifications, setEmailNotifications] = useState(true);


    // Phone editing state
    const [editPhone, setEditPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Avatar Upload State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (file: File) => {
        setUploadError(null);
        if (!file.type.startsWith('image/')) {
            setUploadError(t('error_must_be_image', 'Il file deve essere un\'immagine.'));
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            setUploadError(t('error_file_too_large', 'Il file è troppo grande. Massimo 4MB.'));
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile || !profile) return;
        if (isDemo) {
            addToast(t('demo_mode_avatar_error', 'Questo è un account demo, aggiornamento avatar disabilitato'), 'info');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // 1. Upload file to Supabase Storage 'avatars' bucket
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, { upsert: true });

            if (uploadError) {
                console.error('Supabase storage upload error:', uploadError);
                throw new Error(uploadError.message);
            }

            // 2. Get public URL of the uploaded image
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Send the public URL string to the Python backend to update the database record
            const response = await attendanceApi.post('/api/v1/profiles/me/avatar', { avatarUrl: publicUrl });

            if (response.status === 200 || response.status === 201) {
                setProfile(prev => prev ? { ...prev, avatarUrl: publicUrl } : null);
                setIsAvatarModalOpen(false);
                setAvatarFile(null);
                setAvatarPreview(null);
            }
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            const response = error.response;
            if (response) {
                let errorMessage = t('upload_failed_generic', 'Caricamento fallito. Impossibile aggiornare l\'avatar.');
                const errorData = response.data;
                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                } else if (response.status === 413) {
                    errorMessage = t('error_file_too_large', 'L\'immagine è troppo grande. Il limite massimo è 4MB.');
                } else if (response.status === 400) {
                    errorMessage = t('error_bad_request', 'Il formato del file non è corretto o l\'immagine è corrotta.');
                } else if (response.status === 401 || response.status === 403) {
                    errorMessage = t('error_unauthorized', 'Sessione scaduta o non sei autorizzato. Prova ad effettuare nuovamente il login.');
                } else if (response.status >= 500) {
                    errorMessage = t('error_server', 'Si è verificato un errore sul server. Riprova più tardi.');
                }
                setUploadError(errorMessage);
            } else {
                setUploadError(error.message || t('error_connection', 'Errore durante il caricamento. Controlla il bucket Supabase.'));
            }
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch user profile from Backend
                const profileRes = await attendanceApi.get('/api/v1/profiles/me');
                if (profileRes.status !== 200) {
                    console.error("Error fetching profile from backend:", profileRes);
                } else {
                    const profileData = profileRes.data.payload;
                    const rawAvatarUrl = profileData.avatarUrl;
                    let finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.fullName || 'U')}&background=195de6&color=fff&rounded=true&bold=true&size=256`;
                    if (rawAvatarUrl) {
                        finalAvatarUrl = rawAvatarUrl.startsWith('http')
                            ? rawAvatarUrl
                            : `${import.meta.env.VITE_ATTENDANCE_API_URL}${rawAvatarUrl}`;
                    }

                    setProfile({
                        id: profileData.id,
                        email: user.email || '',
                        fullName: profileData.fullName || user.email?.split('@')[0] || 'User',
                        avatarUrl: finalAvatarUrl,
                        department: (profileData.departmentName && profileData.departmentName !== 'Unknown Department') ? profileData.departmentName : t('no_department_assigned'),
                        officeLocation: (profileData.locationName && profileData.locationName !== 'Unknown Location') ? profileData.locationName : t('no_location_assigned'),
                        roleDescription: profileData.roleDescription || 'Team Member',
                        phone: profileData.profileCellphone || '',
                        allowOvertime: !!profileData.allowOvertime
                    });
                    setEditPhone(profileData.profileCellphone || '');
                    setIsDemo(profileData.roleId === 5 || profileData.roleId === 6);
                }

                // Fetch Work Statistics from backend
                const statsRes = await attendanceApi.get('/api/v1/attendance/stats/dashboard');

                if (statsRes.status === 200) {
                    const statsData = statsRes.data;
                    setStats(statsData.payload);
                }

            } catch (e) {
                console.error("Exception fetching profile details:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleSaveProfile = async () => {
        if (!profile) return;
        if (isDemo) {
            addToast(t('demo_mode_profile_save', 'Questo è un account demo, salvataggio impostazioni disabilitato'), 'info');
            return;
        }
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            await attendanceApi.put('/api/v1/profiles/me/phone', { phone: editPhone });
            setProfile(prev => prev ? { ...prev, phone: editPhone } : null);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (e) {
            console.error('Exception saving profile:', e);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 min-h-screen flex w-full overflow-hidden">
            <Sidebar />
            <main className="flex-1 lg:ml-80 px-4 pb-4 md:p-8 lg:p-12 overflow-y-auto scroll-smooth flex items-center justify-center">
                {/* Mobile top bar spacer */}
                <div className="lg:hidden h-16 shrink-0" />
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </main>
            </div>
        );
    }

    // Calculate percentages
    const totalDays = stats && stats.totalWorkingDays > 0 ? stats.totalWorkingDays : 1; // avoid division by zero
    const remotePercent = stats ? Math.round((stats.remoteDays / totalDays) * 100) : 0;
    const officePercent = stats ? Math.round((stats.officeDays / totalDays) * 100) : 0;

    // Dynamic offset for SVG pie chart rendering
    // removed unused variable
    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 min-h-screen flex w-full overflow-hidden font-display">
            <Sidebar />
            <div className="flex-1 lg:ml-80 flex flex-col h-screen overflow-y-auto scroll-smooth overflow-x-hidden">
                {/* Mobile top bar spacer */}
                <div className="lg:hidden h-16 shrink-0" />
                <main className="flex-1 pt-4 px-4 pb-4 md:p-8 lg:p-12">
                    <div className="max-w-5xl mx-auto space-y-8">

                        {/* Header Area */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative group">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-1 cursor-pointer transition-transform hover:scale-105">
                                    <img
                                        alt={profile?.fullName || 'User Profile'}
                                        className="w-full h-full object-cover rounded-full border-4 border-white dark:border-slate-800"
                                        src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || 'U')}&background=195de6&color=fff&rounded=true&bold=true&size=256`}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // Prevent infinite loop if fallback also fails
                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || 'U')}&background=195de6&color=fff&rounded=true&bold=true&size=256`;
                                        }}
                                    />
                                </div>
                                <button onClick={() => setIsAvatarModalOpen(true)} className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-full p-2 md:p-2.5 shadow-lg hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors border border-slate-100 dark:border-slate-600 group-hover:scale-110 flex items-center justify-center">
                                    <span className="material-icons text-[18px] md:text-[20px] leading-none">edit</span>
                                </button>
                            </div>
                            <div className="text-center px-4">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">{profile?.fullName}</h1>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    {profile?.roleDescription}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-lg lg:max-w-none mx-auto w-full px-2">

                            {/* Personal Information Form */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 shadow-[0_10px_40px_-10px_rgba(25,93,230,0.08)] border border-slate-100 dark:border-slate-700">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-500">
                                            <span className="material-icons text-xl md:text-2xl">person</span>
                                        </div>
                                        {t('personal_information', 'Personal Information')}
                                    </h2>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {isSaving ? (
                                            <><span className="animate-spin material-icons text-[14px] md:text-[16px]">autorenew</span> {t('saving', 'Salvataggio...')}</>
                                        ) : saveSuccess ? (
                                            <><span className="material-icons text-[14px] md:text-[16px] text-green-500">check_circle</span> {t('saved', 'Salvato!')}</>
                                        ) : (
                                            t('save_changes', 'Save Changes')
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t('email_address', 'Email Address')} {isDemo && <span className="material-icons text-[14px] text-slate-400 align-middle ml-1">lock</span>}</label>
                                        <input
                                            className={`w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 outline-none transition-all font-medium ${isDemo ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800'}`}
                                            type="email"
                                            defaultValue={profile?.email}
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t('phone_number', 'Phone Number')} {isDemo && <span className="material-icons text-[14px] text-slate-400 align-middle ml-1">lock</span>}</label>
                                        <input
                                            className={`w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 outline-none transition-all font-medium ${isDemo ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800'}`}
                                            type="tel"
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(e.target.value)}
                                            placeholder="+39 000 000 0000"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                            {t('department', 'Department')}
                                            <span className="material-icons text-[14px] text-slate-400 align-middle ml-1" title="Gestito dall'amministratore">lock</span>
                                        </label>
                                        <input
                                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 outline-none transition-all text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed font-medium"
                                            type="text"
                                            disabled
                                            value={profile?.department}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                            {t('office_location', 'Office Location')}
                                            <span className="material-icons text-[14px] text-slate-400 align-middle ml-1" title="Gestito dall'amministratore">lock</span>
                                        </label>
                                        <input
                                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 outline-none transition-all text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed font-medium"
                                            type="text"
                                            disabled
                                            value={profile?.officeLocation}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 flex flex-col">

                                {/* Work Statistics - Dynamic SVG Chart */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 shadow-[0_10px_40px_-10px_rgba(25,93,230,0.08)] border border-slate-100 dark:border-slate-700 flex-1">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-500">
                                            <span className="material-icons text-xl md:text-2xl">pie_chart</span>
                                        </div>
                                        {t('work_statistics', 'Work Statistics')}
                                    </h2>

                                    <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
                                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-[8px] md:border-[10px] border-slate-50 dark:border-slate-700/50 flex items-center justify-center drop-shadow-sm shrink-0">
                                            {/* SVG Circular Progress Bar representing Remote/Office distribution */}
                                            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                {/* Base circle background */}
                                                <circle cx="18" cy="18" r="15.9155" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="4" />
                                                
                                                {/* Remote status (Sky) */}
                                                <circle 
                                                    cx="18" cy="18" r="15.9155" fill="none" 
                                                    className="stroke-sky-500" strokeWidth="4" 
                                                    strokeDasharray={`${remotePercent} 100`}
                                                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                                                />

                                                {/* Office status (Indigo) - overlapping or offset */}
                                                <circle 
                                                    cx="18" cy="18" r="15.9155" fill="none" 
                                                    className="stroke-indigo-600" strokeWidth="4" 
                                                    strokeDasharray={`${officePercent} 100`}
                                                    strokeDashoffset={-remotePercent}
                                                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                                                />
                                            </svg>
                                        </div>

                                        <div className="space-y-4 flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50"></div>
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('remote_work')}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">{remotePercent}% <span className="text-slate-400 font-medium ml-1">({stats?.remoteDays || 0}d)</span></span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm shadow-indigo-600/50"></div>
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('office')}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">{officePercent}% <span className="text-slate-400 font-medium ml-1">({stats?.officeDays || 0}d)</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Settings Area */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 shadow-[0_10px_40px_-10px_rgba(25,93,230,0.08)] border border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-6">
                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-500">
                                            <span className="material-icons text-xl md:text-2xl">settings</span>
                                        </div>
                                        {t('settings', 'Settings')}
                                    </h2>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600 cursor-pointer" onClick={() => setEmailNotifications(!emailNotifications)}>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('email_notifications')}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('email_notifications_desc')}</p>
                                            </div>
                                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 cursor-not-allowed opacity-80 group">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-500 transition-colors">Abilitato agli straordinari</p>
                                                    <span className="material-icons text-[15px] text-slate-400">lock</span>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Permesso gestito dall'amministrazione.</p>
                                            </div>
                                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile?.allowOvertime ? 'bg-green-500/70' : 'bg-slate-200/70 dark:bg-slate-600/70'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile?.allowOvertime ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Achievements Area */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 shadow-[0_10px_40px_-10px_rgba(25,93,230,0.08)] border border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-500">
                                    <span className="material-icons text-xl md:text-2xl">military_tech</span>
                                </div>
                                {t('my_achievements', 'My Achievements')}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                                <div className="flex flex-col items-center p-4 md:p-6 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-700/50 dark:to-slate-800 rounded-2xl md:rounded-3xl border border-blue-100/50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all group">
                                    <div className="w-14 h-14 md:w-16 md:h-16 mb-4 md:mb-5 rounded-xl md:rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-200 dark:bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        <span className="material-icons text-2xl md:text-3xl text-blue-600 dark:text-blue-400">home_work</span>
                                    </div>
                                    <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white text-center">{t('remote_champion')}</h3>
                                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center font-medium">{t('days_working_remotely', { count: stats?.remoteDays || 0 })}</p>
                                </div>

                                <div className="flex flex-col items-center p-4 md:p-6 bg-gradient-to-b from-amber-50/50 to-white dark:from-slate-700/50 dark:to-slate-800 rounded-2xl md:rounded-3xl border border-amber-100/50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all group">
                                    <div className="w-14 h-14 md:w-16 md:h-16 mb-4 md:mb-5 rounded-xl md:rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-amber-200 dark:bg-amber-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        <span className="material-icons text-2xl md:text-3xl text-amber-600 dark:text-amber-400">domain</span>
                                    </div>
                                    <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white text-center">{t('office_regular')}</h3>
                                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center font-medium">{t('days_in_office', { count: stats?.officeDays || 0 })}</p>
                                </div>

                                <div className="flex flex-col items-center p-4 md:p-6 bg-gradient-to-b from-emerald-50/50 to-white dark:from-slate-700/50 dark:to-slate-800 rounded-2xl md:rounded-3xl border border-emerald-100/50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all group">
                                    <div className="w-14 h-14 md:w-16 md:h-16 mb-4 md:mb-5 rounded-xl md:rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        <span className="material-icons text-2xl md:text-3xl text-emerald-600 dark:text-emerald-400">event_available</span>
                                    </div>
                                    <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white text-center">{t('always_updated')}</h3>
                                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center font-medium">{t('logged_days', { count: stats?.totalWorkingDays || 0 })}</p>
                                </div>

                                <div className="flex flex-col items-center p-4 md:p-6 bg-gradient-to-b from-rose-50/50 to-white dark:from-slate-700/50 dark:to-slate-800 rounded-2xl md:rounded-3xl border border-rose-100/50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all group opacity-60 grayscale hover:grayscale-0">
                                    <div className="w-14 h-14 md:w-16 md:h-16 mb-4 md:mb-5 rounded-xl md:rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-rose-200 dark:bg-rose-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        <span className="material-icons text-2xl md:text-3xl text-rose-600 dark:text-rose-400">local_cafe</span>
                                    </div>
                                    <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white text-center">{t('coffee_lover')}</h3>
                                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center font-medium">{t('coming_soon')}</p>
                                </div>

                            </div>
                        </div>

                    </div>
                </main>

                <Footer />
            </div>

            {/* Avatar Upload Modal */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-blue-500">add_photo_alternate</span>
                                {t('change_avatar', 'Cambia Immagine Profilo')}
                            </h3>
                            <button
                                onClick={() => { setIsAvatarModalOpen(false); setAvatarFile(null); setAvatarPreview(null); setUploadError(null); }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {uploadError && (
                                <div className="p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm flex items-center gap-3 border border-red-100 dark:border-red-800">
                                    <span className="material-icons text-xl shrink-0">error_outline</span>
                                    <p className="mt-0.5 font-medium">{uploadError}</p>
                                </div>
                            )}

                            {!avatarPreview ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                handleFileSelect(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <span className={`material-icons text-3xl transition-colors ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500'}`}>cloud_upload</span>
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">{t('drag_and_drop', 'Trascina qui l\'immagine')}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('or_click_to_browse', 'oppure clicca per cercare')}</p>
                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-4 px-3 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full">{t('max_size', 'Max 4MB (JPG, PNG)')}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center justify-center p-6 border border-slate-100 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-900/50 relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden relative">
                                            <img
                                                src={avatarPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || 'U')}&background=195de6&color=fff&rounded=true&bold=true&size=256`;
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                                                    className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                                                    title={t('remove', 'Rimuovi')}
                                                >
                                                    <span className="material-icons text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                                            disabled={isUploading}
                                            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                        >
                                            {t('cancel', 'Annulla')}
                                        </button>
                                        <button
                                            onClick={handleAvatarUpload}
                                            disabled={isUploading}
                                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <span className="animate-spin material-icons text-[20px]">autorenew</span>
                                                    {t('uploading', 'Caricamento...')}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-icons text-[20px] group-hover:-translate-y-1 transition-transform">upload</span>
                                                    {t('save_avatar', 'Salva Avatar')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
