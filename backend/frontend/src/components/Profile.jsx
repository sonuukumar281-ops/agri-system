import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Camera,
    Edit2,
    Save,
    MapPin,
    Phone,
    User as UserIcon,
    Ruler,
    Settings,
    Moon,
    Globe,
    Bell,
    CheckCircle,
    Wheat,
    Droplet,
    LogOut,
    Home,
    BookOpen,
    Users,
    User,
    Plus,
    Loader2,
    AlertCircle
} from 'lucide-react';

function Profile() {
    const navigate = useNavigate();
    const { user, updateUser } = useUser();  // 🌐 Global user state
    const { t } = useLanguage();

    // States
    const [isEditing, setIsEditing] = useState(false);
    const [showSynced, setShowSynced] = useState(false);

    // Image Upload States
    const [isUploading, setIsUploading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const fileInputRef = useRef(null);

    // Local draft of profile while editing — only committed on Save
    const [draft, setDraft] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        location: user?.location || '',
        farmSize: user?.farmSize || '',
    });

    // Keep draft in sync if user context changes externally
    useEffect(() => {
        setDraft({
            fullName: user?.fullName || '',
            phone: user?.phone || '',
            location: user?.location || '',
            farmSize: user?.farmSize || '',
        });
    }, [user?.fullName, user?.phone, user?.location, user?.farmSize]);

    // App Settings (offline sync)
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('appSettings');
        return saved ? JSON.parse(saved) : {
            language: "ENG",
            darkMode: true,
            notifications: true
        };
    });

    // Farm details (simulated/static)
    const farmDetails = {
        activeCrop: t('active_crop_name', 'Wheat (PBW-343)'),
        growth: 75,
        soilStatus: t('soil_status', 'Healthy'),
        waterStatus: t('water_status', 'Opt Water')
    };

    // Activity Feed
    const activities = [
        { id: 1, action: t('act_soil', 'Soil Check Done'), time: t('2h_ago', '2 hours ago'), icon: <CheckCircle size={16} className="text-[#7CFF00]" /> },
        { id: 2, action: t('act_crop', 'Crop Recommendation Viewed'), time: t('1d_ago', '1 day ago'), icon: <Wheat size={16} className="text-[#8a9d8f]" /> },
        { id: 3, action: t('act_market', 'Market Prices Checked'), time: t('2d_ago', '2 days ago'), icon: <BookOpen size={16} className="text-[#4facfe]" /> }
    ];

    // Persist settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    const handleSave = () => {
        // Commit draft to global context (also persists to localStorage inside updateUser)
        updateUser(draft);
        setIsEditing(false);
        // Show synced indicator
        setShowSynced(true);
        setTimeout(() => setShowSynced(false), 2000);
    };

    const handleLogout = () => {
        navigate('/landing');
    };

    const handleImageClick = () => {
        if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const showToast = (message, type = 'success') => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            showToast('Only JPG and PNG images are allowed.', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            showToast('Image size must be less than 2MB.', 'error');
            return;
        }

        setIsUploading(true);

        // Simulate API upload & read file to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Image = reader.result;

            // Mock API delay
            setTimeout(() => {
                // Simulate 10% chance of failure for complete flow demo
                if (Math.random() > 0.9) {
                    showToast('Upload failed! Please try again.', 'error');
                    setIsUploading(false);
                } else {
                    // ✅ Update via context — syncs to Dashboard instantly
                    updateUser({ profileImage: base64Image });
                    showToast('Profile image updated successfully!', 'success');
                    setIsUploading(false);
                }
            }, 1000);
        };
        reader.onerror = () => {
            showToast('Failed to read image file.', 'error');
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    // --- Animation Variants ---
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="bg-[#0F1A14] w-full h-full text-white font-sans pb-24 selection:bg-[#7CFF00]/30 overflow-hidden relative overflow-y-auto no-scrollbar">

            {/* Sync Indicator indicator */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: showSynced && !isEditing ? 1 : 0, y: showSynced && !isEditing ? 0 : -20 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#7CFF00]/10 backdrop-blur-md border border-[#7CFF00]/30 text-[#7CFF00] text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"
            >
                <CheckCircle size={12} strokeWidth={3} />
                {t('offline_synced')}
            </motion.div>

            {/* Toast Notification */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: toastMessage ? 1 : 0, y: toastMessage ? 0 : -20 }}
                className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md border border-white/10 text-[11px] font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-colors ${toastMessage?.type === 'error'
                    ? 'bg-red-500/20 border-red-500/50 text-red-500'
                    : 'bg-[#7CFF00]/20 border-[#7CFF00]/50 text-[#7CFF00]'
                    }`}
                style={{ pointerEvents: toastMessage ? 'auto' : 'none' }}
            >
                {toastMessage?.type === 'error' ? <AlertCircle size={14} strokeWidth={3} /> : <CheckCircle size={14} strokeWidth={3} />}
                {toastMessage?.message}
            </motion.div>

            <motion.div
                className="max-w-md mx-auto p-4 pt-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Header Section */}
                <motion.header variants={itemVariants} className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                    <h1 className="text-base font-bold tracking-widest text-white uppercase flex items-center gap-2">{t('profile')}</h1>
                    <div className="w-10 h-10"></div> {/* Spacer for centering */}
                </motion.header>

                {/* Avatar & Greeting */}
                <motion.div variants={itemVariants} className="flex flex-col items-center mb-8 relative">
                    <div className="relative group cursor-pointer" onClick={handleImageClick}>
                        <div className="w-24 h-24 rounded-full border-2 border-[#7CFF00] p-[2px] mb-3 relative overflow-hidden ring-4 ring-[#7CFF00]/10 transition-transform hover:scale-105 active:scale-95 duration-300">
                            <div className="w-full h-full rounded-full bg-[#0F1A14] overflow-hidden flex items-center justify-center relative">
                                <img src={user?.profileImage} alt="Avatar" className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-40' : 'opacity-100'}`} />

                                {/* Overlay icon */}
                                {!isUploading && (
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={24} className="text-white mb-1" />
                                        <span className="text-[9px] text-white font-bold tracking-wider uppercase">{t('edit')}</span>
                                    </div>
                                )}

                                {/* Loading Spinner */}
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                        <Loader2 size={24} className="text-[#7CFF00] animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Status Dot / Edit Badge */}
                        <div className="absolute bottom-4 right-2 w-7 h-7 bg-[#0F1A14] rounded-full border-[2.5px] border-[#7CFF00] flex items-center justify-center text-[#7CFF00] hover:bg-[#7CFF00] hover:text-[#0F1A14] transition-colors shadow-lg z-10">
                            <Edit2 size={12} strokeWidth={3} />
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/jpeg, image/png"
                        className="hidden"
                    />

                    <p className="text-[12px] text-[#7CFF00] font-bold tracking-widest uppercase mb-1">{t('greeting')} 👋</p>
                    <h2 className="text-2xl font-bold text-white leading-tight">{user?.fullName}</h2>
                </motion.div>

                {/* User Info Card */}
                <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#8a9d8f]">{t('personal_info')}</h3>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="text-[#7CFF00] flex items-center gap-1.5 text-xs font-bold hover:text-white transition-colors">
                                <Edit2 size={12} strokeWidth={3} /> {t('edit')}
                            </button>
                        ) : (
                            <button onClick={handleSave} className="bg-[#7CFF00] text-[#0F1A14] px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-extrabold ring-1 ring-[#7CFF00]/50 hover:bg-[#8aff1a] transition-colors shadow-[0_0_10px_rgba(124,255,0,0.3)]">
                                <Save size={14} strokeWidth={3} /> {t('save')}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <EditableField
                            icon={<UserIcon size={18} className="text-[#7CFF00]" />}
                            label={t('full_name')}
                            value={draft.fullName}
                            isEditing={isEditing}
                            onChange={(val) => setDraft({ ...draft, fullName: val })}
                        />
                        <EditableField
                            icon={<Phone size={18} className="text-[#7CFF00]" />}
                            label={t('phone_number')}
                            value={draft.phone}
                            isEditing={isEditing}
                            onChange={(val) => setDraft({ ...draft, phone: val })}
                        />
                        <EditableField
                            icon={<MapPin size={18} className="text-[#7CFF00]" />}
                            label={t('location')}
                            value={draft.location}
                            isEditing={isEditing}
                            onChange={(val) => setDraft({ ...draft, location: val })}
                        />
                        <EditableField
                            icon={<Ruler size={18} className="text-[#7CFF00]" />}
                            label={t('farm_size')}
                            value={draft.farmSize}
                            isEditing={isEditing}
                            onChange={(val) => setDraft({ ...draft, farmSize: val })}
                        />
                    </div>
                </motion.div>

                {/* Farm Details Card */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-white/5 to-[#7CFF00]/5 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/10 shadow-lg relative overflow-hidden">
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#8a9d8f] mb-4">{t('farm_details')}</h3>

                    <div className="flex justify-between items-center bg-black/20 rounded-xl p-3 mb-4 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-[#7CFF00]/30 flex items-center justify-center bg-[#7CFF00]/10 shrink-0">
                                <Wheat size={20} className="text-[#7CFF00]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-0.5">{t('active_crop')}</p>
                                <p className="text-sm font-bold text-white">{farmDetails.activeCrop}</p>
                            </div>
                        </div>
                        <div className="text-right pl-2">
                            <span className="text-xl font-extrabold text-[#7CFF00]">{farmDetails.growth}%</span>
                            <p className="text-[9px] text-[#8a9d8f] font-bold uppercase tracking-wider">{t('growth')}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 bg-black/20 rounded-lg p-2.5 flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-[#8a9d8f]/20 flex items-center justify-center">
                                    <CheckCircle size={14} className="text-[#8a9d8f]" />
                                </div>
                                <span className="text-xs font-medium text-white/70">{t('soil')}</span>
                            </div>
                            <span className="text-xs font-bold text-white">{farmDetails.soilStatus}</span>
                        </div>
                        <div className="flex-1 bg-black/20 rounded-lg p-2.5 flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-[#4facfe]/20 flex items-center justify-center">
                                    <Droplet size={14} className="text-[#4facfe]" />
                                </div>
                                <span className="text-xs font-medium text-white/70">{t('water')}</span>
                            </div>
                            <span className="text-xs font-bold text-white">{farmDetails.waterStatus}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Activity Feed */}
                <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/10 shadow-lg">
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#8a9d8f] mb-4">{t('recent_activity')}</h3>
                    <div className="space-y-4 relative">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-3 bottom-0 w-[2px] bg-white/10 z-0"></div>

                        {activities.map((act) => (
                            <div key={act.id} className="flex items-start gap-4 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-[#0F1A14] border-2 border-white/20 flex items-center justify-center shrink-0 mt-0.5 z-10 transition-colors hover:border-[#7CFF00]">
                                    {act.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white leading-snug">{act.action}</p>
                                    <p className="text-[10px] text-[#8a9d8f] mt-0.5 font-bold tracking-wider">{act.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Settings Section */}
                <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 mb-6 border border-white/10 shadow-lg flex flex-col">
                    <SettingToggle
                        icon={<Globe size={18} className="text-white/70" />}
                        label={t('select_language')}
                        value={true}
                        onChange={() => navigate('/language')}
                        text={settings?.language || "ENG"}
                    />
                    <div className="h-px bg-white/10 mx-3"></div>
                    <SettingToggle
                        icon={<Moon size={18} className="text-white/70" />}
                        label={t('dark_mode')}
                        value={settings.darkMode}
                        onChange={(val) => setSettings({ ...settings, darkMode: val })}
                    />
                    <div className="h-px bg-white/10 mx-3"></div>
                    <SettingToggle
                        icon={<Bell size={18} className="text-white/70" />}
                        label={t('notifications')}
                        value={settings.notifications}
                        onChange={(val) => setSettings({ ...settings, notifications: val })}
                    />
                </motion.div>

                {/* Logout */}
                <motion.button
                    variants={itemVariants}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl py-4 flex items-center justify-center gap-2 font-bold text-sm tracking-widest hover:bg-red-500/20 transition-colors mb-8 shadow-sm hover:shadow-red-500/20"
                >
                    <LogOut size={18} strokeWidth={2.5} /> {t('logout_securely')}
                </motion.button>

                {/* Bottom padding for fixed dock */}
                <div className="h-20"></div>

            </motion.div>

            {/* Bottom Nav */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 80, delay: 0.5 }}
                className="absolute bottom-0 left-0 right-0 bg-[#0F1A14]/90 backdrop-blur-xl border-t border-white/10 rounded-b-[40px] px-6 py-2 z-50 overflow-visible"
            >
                <div className="max-w-md mx-auto flex justify-between items-center relative h-16">
                    <NavItem icon={<Home size={24} />} label={t('dashboard')} onClick={() => navigate('/home')} />
                    <NavItem icon={<Wheat size={24} />} label={t('my_crops', 'My Crops')} onClick={() => navigate('/records')} />

                    {/* Empty space for central FAB */}
                    <div className="w-16"></div>

                    <NavItem icon={<Users size={24} />} label={t('community')} onClick={() => navigate('/community')} />
                    <NavItem icon={<User size={24} />} label={t('profile')} active={true} onClick={() => navigate('/profile')} />

                    {/* FAB */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ boxShadow: ["0px 0px 10px rgba(124, 255, 0, 0.2)", "0px 0px 30px rgba(124, 255, 0, 0.6)", "0px 0px 10px rgba(124, 255, 0, 0.2)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute left-1/2 -top-10 -translate-x-1/2 w-[68px] h-[68px] rounded-full bg-[#7CFF00] text-[#0F1A14] flex items-center justify-center border-[8px] border-[#0F1A14] z-50"
                    >
                        <Plus size={32} strokeWidth={4} />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

// Subcomponents

function EditableField({ icon, label, value, isEditing, onChange }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0 border border-white/5 text-[#7CFF00]">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-[9px] text-[#8a9d8f] font-bold uppercase tracking-widest leading-tight mb-1">{label}</p>
                {isEditing ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-black/40 text-white text-sm font-bold px-3 py-2 rounded border border-[#7CFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#7CFF00] transition-colors"
                    />
                ) : (
                    <p className="text-[15px] text-white font-semibold">{value}</p>
                )}
            </div>
        </div>
    );
}

function SettingToggle({ icon, label, value, onChange, text }) {
    return (
        <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-[15px] font-medium text-white">{label}</span>
            </div>
            {text ? (
                <button
                    onClick={onChange}
                    className="text-xs font-bold text-[#7CFF00] bg-[#7CFF00]/10 px-3 py-1.5 rounded ring-1 ring-[#7CFF00]/30 hover:bg-[#7CFF00]/20 transition-colors"
                >
                    {text}
                </button>
            ) : (
                <button
                    onClick={() => onChange(!value)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${value ? 'bg-[#7CFF00]' : 'bg-white/20'}`}
                >
                    <motion.div
                        animate={{ x: value ? 20 : 0 }}
                        className="w-4 h-4 bg-[#0F1A14] rounded-full shadow-sm origin-center"
                    />
                </button>
            )}
        </div>
    );
}

function NavItem({ icon, label, active, onClick }) {
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1.5 w-14 h-14 rounded-xl ${active ? 'text-[#7CFF00]' : 'text-white/50 hover:text-white transition-colors'}`}
        >
            {icon}
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
        </motion.button>
    );
}

export default Profile;
