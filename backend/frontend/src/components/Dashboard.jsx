import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import {
    FlaskConical,
    BrainCircuit,
    TrendingUp,
    Sun,
    Droplet,
    Wheat,
    CheckCircle,
    Bell,
    Home,
    BookOpen,
    Users,
    User,
    Plus,
    X,
    CloudRain,
    CloudFog,
    CloudLightning,
    Loader2
} from 'lucide-react';
import FABMenu from './FABMenu';

const API_KEY = "cfcd2bdee96dd57b54a72d17c9b83ac5"; // Replace with real key if needed
// ─── Seeded RNG for Market Prediction ──────────────────────────────────────────
function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

function Dashboard() {
    const navigate = useNavigate();
    const { user } = useUser();  // 🌐 Global user state
    const { t, language: lang, changeLanguage } = useLanguage();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNotifs, setShowNotifs] = useState(false);
    const [weather, setWeather] = useState(() => {
        const saved = localStorage.getItem('weather');
        return saved ? JSON.parse(saved) : { temp: "28°C", condition: "Sunny", season: "Rabi Season", subtext: "Fetching live weather...", icon: "CLEAR" };
    });
    const [weatherLoading, setWeatherLoading] = useState(!localStorage.getItem('weather'));
    const [showFAB, setShowFAB] = useState(false);

    const [cropData, setCropData] = useState(() => {
        try {
            const saved = localStorage.getItem('activeCrop');
            if (saved && saved !== "undefined") {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.name) return parsed;
            }
        } catch (e) {
            console.error("Error parsing activeCrop from localStorage", e);
        }
        return {
            name: "Wheat (PBW-343)",
            growth: 75,
            stage: "Flowering"
        };
    });

    const [recommendation, setRecommendation] = useState(() => {
        const saved = localStorage.getItem('recommendation');
        return saved || "Apply Urea fertilizer within next 48 hours for optimal yield.";
    });

    // ─── Translations handled by LanguageContext ──────────────────────────────────

    useEffect(() => {
        // Fetch Prices
        axios.get('/api/market-prices')
            .then(res => setPrices(res.data))
            .catch(() => {
                // Fallback mock data
                setPrices([
                    { crop: "Wheat (Kanak)", mandi: "KARNAL MANDI", price: "₹2,125 / qtl", change: "+ ₹15.00", up: true, neutral: false, iconType: "wheat" },
                    { crop: "Basmati Rice", mandi: "PANIPAT MANDI", price: "₹3,450 / qtl", change: "- ₹42.00", up: false, neutral: false, iconType: "rice" },
                    { crop: "Mustard (Sarson)", mandi: "REGIONAL AVG", price: "₹5,200 / qtl", change: "NO CHANGE", up: false, neutral: true, iconType: "mustard" }
                ]);
            })
            .finally(() => setLoading(false));

        // Fetch Weather
        const fetchWeather = async () => {
            try {
                const city = user.location || 'Karnal';
                const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);

                const wtr = {
                    temp: `${Math.round(res.data.main.temp)}°C`,
                    condition: res.data.weather[0].main, // "Clear", "Clouds", "Rain"
                    season: "Rabi Season",
                    subtext: `${res.data.name}, ${res.data.sys.country}`,
                    icon: res.data.weather[0].main.toUpperCase()
                };

                setWeather(wtr);
                localStorage.setItem('weather', JSON.stringify(wtr));
            } catch (err) {
                console.log("Weather API failed, using fallback", err);
                if (!weather) {
                    setWeather({ temp: "28°C", condition: "Sunny", season: "Rabi Season", subtext: "Karnal (Fallback)", icon: "CLEAR" });
                }
            } finally {
                setWeatherLoading(false);
            }
        };

        fetchWeather();
        const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000); // 10 mins

        // Fetch AI Recommendation
        axios.get('/api/recommendation')
            .then(res => {
                setRecommendation(res.data.text);
                localStorage.setItem('recommendation', res.data.text);
            })
            .catch(err => console.log("Recommendation fallback used"));

        // Initial localStorage save for static fallbacks
        localStorage.setItem('activeCrop', JSON.stringify(cropData));

        // Listen for crop updates from AddCrop component
        const handleCropUpdate = () => {
            const saved = localStorage.getItem('activeCrop');
            if (saved) {
                setCropData(JSON.parse(saved));
            }
        };
        window.addEventListener('cropUpdated', handleCropUpdate);

        return () => {
            clearInterval(weatherInterval);
            window.removeEventListener('cropUpdated', handleCropUpdate);
        }
    }, [cropData, user.location]);
    // --- AI Smart Sell Alert Logic ---
    const aiAlert = useMemo(() => {
        const crop = (cropData?.name || 'Wheat').split(' ')[0]; // E.g., 'Wheat'
        const marketItem = prices.find(p => p.crop.includes(crop)) || prices[0];
        const currentPrice = marketItem ? parseInt(marketItem.price.replace(/\D/g, '')) || 2500 : 2500;

        const base = crop.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        let walkPrice = currentPrice;
        for (let i = 1; i <= 5; i++) {
            const fluctuation = (seededRand(base + i * 13) * 400) - 200;
            walkPrice = Math.max(50, Math.round(walkPrice + fluctuation));
        }
        const changePct = ((walkPrice - currentPrice) / currentPrice) * 100;
        const trend = changePct > 0 ? 'up' : 'down';

        let decision = "HOLD ⏳";
        let color = "text-[#7CFF00]";
        let bg = "bg-[#7CFF00]/10";
        let border = "border-[#7CFF00]/20";
        let reason = `Price expected to rise ~${changePct.toFixed(1)}% in next 5 days.`;

        if (trend === 'down') {
            decision = changePct < -6 ? "SELL FAST 🔥" : "SELL NOW 🔥";
            color = "text-red-400";
            bg = "bg-red-400/10";
            border = "border-red-400/30";
            reason = `Price expected to drop ~${Math.abs(changePct).toFixed(1)}% in next 2-3 days.`;
        } else if (changePct < 3) {
            decision = "WAIT ⚠️";
            color = "text-yellow-400";
            bg = "bg-yellow-400/10";
            border = "border-yellow-400/30";
            reason = "Market fluctuating. Monitor for 1-2 days for clear signal.";
        }

        return { crop, decision, reason, color, bg, border };
    }, [cropData.name, prices]);

    // --- Dynamic AI Agronomy Recommendation ---
    const dynamicRecommendation = useMemo(() => {
        const stage = cropData?.stage?.toLowerCase() || "";
        const wCondition = weather?.condition?.toLowerCase() || "";
        const tempStr = weather?.temp || "25°C";
        const temp = parseInt(tempStr.replace(/\D/g, '')) || 25;

        // 1. Critical Water Rules
        if (wCondition.includes("rain") || wCondition.includes("storm")) {
            return `Heavy rain expected. Ensure proper drainage in the field to avoid waterlogging for your ${cropData?.name || "crop"}.`;
        }

        // 2. Stage Rules
        if (stage.includes("flowering") || stage.includes("growth") || stage.includes("vegetative")) {
            return `Optimal time for nutrient boost! Apply Urea or Nitrogen-based fertilizer to maximize ${cropData?.name || "crop"} yield.`;
        }
        if (stage.includes("harvest") || stage.includes("mature") || stage.includes("ripening")) {
            return `Crop is nearing readiness. Prepare harvesting equipment and check Mandi prices to plan your selling strategy.`;
        }
        if (stage.includes("seedling") || stage.includes("sowing")) {
            if (temp < 15) return `Cold temperatures detected. Protect young seedlings from frost if necessary.`;
            return `Ensure young seedlings receive light, frequent watering. Monitor for early pests.`;
        }

        // 3. Fallback General Rule based on health
        return `Monitor ${cropData?.name || "crop"} closely based on local weather conditions.`;

    }, [cropData, weather]);

    // --- Dynamic Notifications Component ---
    const notifications = useMemo(() => {
        return [
            {
                id: 1,
                title: "🚨 Smart Sell Alert",
                message: aiAlert.reason,
                time: "Just now",
                icon: <TrendingUp className={aiAlert.color.replace('text-', '')} size={16} />,
                bg: `${aiAlert.bg} border ${aiAlert.border}`
            },
            {
                id: 2,
                title: "🌱 AI Priority Action",
                message: dynamicRecommendation,
                time: "1h ago",
                icon: <BrainCircuit className="text-[#7CFF00]" size={16} />,
                bg: "bg-[#7CFF00]/10 border border-[#7CFF00]/20"
            },
            {
                id: 3,
                title: "⛈️ Weather Update",
                message: `${weather.condition} expected. ${weather.subtext}`,
                time: "3h ago",
                icon: <Droplet size={16} className="text-blue-400" />,
                bg: "bg-blue-400/10 border border-blue-400/20"
            }
        ];
    }, [aiAlert, dynamicRecommendation, weather]);

    const renderIcon = (type) => {
        if (type === 'wheat') return <div className="w-full h-full bg-[#182a1b] rounded-lg flex items-center justify-center"><Wheat className="text-[#ffcc00]" size={20} strokeWidth={2.5} /></div>;
        if (type === 'rice') return <div className="w-full h-full bg-[#182a1b] rounded-lg flex items-center justify-center"><div className="w-5 h-5 rounded-full bg-white opacity-90 shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"></div></div>;
        if (type === 'mustard') return <div className="w-full h-full bg-[#182a1b] rounded-lg flex items-center justify-center"><div className="w-5 h-5 rounded-full bg-[#ffcc00] shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"></div></div>;
        return null;
    };

    // --- Dynamic Weather Theme ---
    const wTheme = useMemo(() => {
        if (!weather || weatherLoading) {
            return { bg: "bg-gradient-to-r from-white/10 to-transparent border-white/10", glow: "bg-[#7CFF00] opacity-10", text: "text-green-200", accent: "text-[#7CFF00]", emoji: "" };
        }
        if (weather.icon.includes('RAIN') || weather.icon.includes('DRIZZLE')) {
            return { bg: "bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/20", glow: "bg-blue-400 opacity-20", text: "text-blue-200", accent: "text-blue-400", emoji: "🌧️" };
        } else if (weather.icon.includes('CLOUD')) {
            return { bg: "bg-gradient-to-r from-gray-500/10 to-transparent border-gray-500/20", glow: "bg-gray-400 opacity-20", text: "text-gray-300", accent: "text-gray-400", emoji: "☁️" };
        } else if (weather.icon.includes('THUNDERSTORM')) {
            return { bg: "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20", glow: "bg-yellow-400 opacity-20", text: "text-yellow-200", accent: "text-yellow-400", emoji: "⚡" };
        } else {
            return { bg: "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20", glow: "bg-yellow-400 opacity-20", text: "text-yellow-200", accent: "text-yellow-400", emoji: "☀️" };
        }
    }, [weather, weatherLoading]);

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
        <div className="bg-[#0F1A14] w-full h-full text-white font-sans pb-24 selection:bg-[#7CFF00]/30 overflow-hidden">
            <motion.div
                className="max-w-md mx-auto p-4 pt-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Header */}
                <motion.header variants={itemVariants} className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-[#16a34a] p-[1px]">
                            <div className="w-full h-full rounded-full bg-green-800 overflow-hidden flex items-center justify-center">
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-green-500 font-bold tracking-widest uppercase">{t('greeting')}</p>
                            <h1 className="text-xl font-bold text-white">{user.fullName}</h1>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowNotifs(true)} className="relative p-2 bg-white/5 rounded-full ring-1 ring-white/10 hover:bg-white/10 transition-colors">
                                <Bell size={16} className="text-white" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0F1A14]"></span>
                            </button>
                            <button onClick={() => navigate('/language')} className="bg-white/5 text-[#7CFF00] px-3 py-1 rounded-full text-[10px] font-bold ring-1 ring-[#7CFF00]/30 hover:bg-white/10 transition-colors backdrop-blur-md">
                                {lang.toUpperCase()}
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#7CFF00] font-bold tracking-wider mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7CFF00] animate-pulse shadow-[0_0_5px_#7CFF00]"></span>
                            System Online
                        </div>
                    </div>
                </motion.header>

                {/* Weather Card */}
                <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className={`backdrop-blur-md rounded-2xl p-4 mb-8 border shadow-xl relative overflow-hidden ${wTheme.bg}`}>
                    {/* Subtle bg texture/glow */}
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${wTheme.glow}`}></div>

                    <div className="flex items-center justify-between relative z-10">
                        {weatherLoading && !weather ? (
                            <div className="flex items-center gap-3 text-white/50 py-2">
                                <Loader2 className="animate-spin" size={20} />
                                <span className="text-xs font-bold tracking-widest">FETCHING LIVE WEATHER...</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    {weather.icon.includes('RAIN') || weather.icon.includes('DRIZZLE') ? <CloudRain size={40} className="text-blue-400" /> :
                                        weather.icon.includes('CLOUD') ? <CloudFog size={40} className="text-gray-300" /> :
                                            weather.icon.includes('THUNDERSTORM') ? <CloudLightning size={40} className="text-yellow-400" /> :
                                                <Sun size={40} className="text-[#7CFF00]" />}
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-extrabold text-white">{weather.temp}</span>
                                            <span className={`text-sm font-medium ${wTheme.text}`}>{wTheme.emoji} {weather.condition}</span>
                                        </div>
                                        <p className={`text-xs font-bold mt-1 ${wTheme.accent}`}>{weather.subtext}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-bold tracking-widest uppercase ${wTheme.accent}`}>{t('season')}</p>
                                    <p className="font-bold text-white leading-tight">{weather.season}</p>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.h2 variants={itemVariants} className="text-[11px] font-bold tracking-[0.2em] text-[#8a9d8f] mb-4">{t('quick_actions')}</motion.h2>
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-8">
                    <ActionCard
                        label={t('soil_analysis')}
                        icon={<FlaskConical className="text-white" size={24} strokeWidth={2.5} />}
                        onClick={() => navigate('/soil-check')}
                    />
                    <ActionCard
                        label={t('crop_planner')}
                        icon={<BrainCircuit className="text-white" size={24} strokeWidth={2.5} />}
                        onClick={() => navigate('/crop-ai')}
                    />
                    <ActionCard
                        label={t('market_prices')}
                        icon={<TrendingUp className="text-white" size={24} strokeWidth={2.5} />}
                        onClick={() => navigate('/market')}
                    />
                </motion.div>

                {/* Active Crop */}
                <motion.div variants={itemVariants} className="relative bg-white/5 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/10 overflow-hidden shadow-lg">
                    {/* Blockchain Badge */}
                    <div className="absolute top-0 right-0 bg-[#7CFF00]/10 text-[#7CFF00] text-[9px] font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1.5 border-b border-l border-white/10 backdrop-blur-sm">
                        <CheckCircle size={10} strokeWidth={3} />
                        {t('blockchain')}
                    </div>

                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-[#8a9d8f] mb-5 mt-1">{t('active_crop')}</h2>

                    <div className="flex gap-4 items-center mb-5">
                        {/* Progress Ring */}
                        <div className="relative w-24 h-24 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                {/* Background Track */}
                                <path
                                    className="text-[#1e2d23]" strokeWidth="4"
                                    stroke="currentColor" fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                {/* Progress Track */}
                                <motion.path
                                    initial={{ strokeDasharray: "0, 100" }}
                                    animate={{ strokeDasharray: `${cropData.growth}, 100` }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                    className="text-[#7CFF00]" strokeWidth="4" strokeLinecap="round"
                                    stroke="currentColor" fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-0.5">
                                <span className="text-2xl font-extrabold text-white">{cropData.growth}%</span>
                                <span className="text-[8px] font-bold tracking-widest text-[#8a9d8f] mt-0.5">{t('growth')}</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white leading-tight">{cropData.name}</h3>
                            <p className="text-sm font-medium text-[#8a9d8f] mb-3 mt-1">{t('stage')}: {cropData.stage}</p>
                            <div className="flex gap-2">
                                <span className="bg-white/10 text-[#7CFF00] text-[10px] px-2.5 py-1 rounded flex items-center gap-1.5 font-bold border border-white/5">
                                    <Droplet size={10} strokeWidth={3} /> Opt Water
                                </span>
                                <span className="bg-white/10 text-[#7CFF00] text-[10px] px-2.5 py-1 rounded flex items-center gap-1.5 font-bold border border-white/5">
                                    <CheckCircle size={10} strokeWidth={3} /> Healthy
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AI Recommendation Box */}
                    <div className="flex gap-4 pt-5 mt-2 border-t border-white/10">
                        <div className="w-10 h-10 rounded bg-[#7CFF00]/10 flex items-center justify-center shrink-0 border border-[#7CFF00]/20">
                            <Bell className="text-[#7CFF00]" size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#7CFF00] mb-1">{t('ai_recommendation')}</p>
                            <p className="text-xs font-medium text-white/70 leading-relaxed pr-2">{dynamicRecommendation}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Smart Sell Alert */}
                <motion.div variants={itemVariants} className={`relative backdrop-blur-md rounded-2xl p-5 mb-8 border shadow-xl ${aiAlert.bg} ${aiAlert.border} overflow-hidden`}>
                    <div className={`absolute top-0 right-0 ${aiAlert.bg} ${aiAlert.color} text-[9px] font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1.5 border-b border-l border-white/5 backdrop-blur-sm`}>
                        <TrendingUp size={10} strokeWidth={3} />
                        Mandi AI Sync
                    </div>

                    <h2 className={`text-xs font-black tracking-widest uppercase mb-4 mt-1 flex items-center gap-2 ${aiAlert.color}`}>
                        🚨 {t('smart_sell_alert')}
                    </h2>

                    <div className="flex flex-col gap-1 mb-4">
                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                            <div>
                                <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-0.5">{t('crop')}</p>
                                <p className="text-sm font-black text-white">{aiAlert.crop}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-0.5">{t('status')}</p>
                                <p className={`text-lg font-black tracking-wider ${aiAlert.color}`}>{aiAlert.decision}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-start gap-3 mt-2">
                        <div className="mt-0.5 shrink-0">
                            <BrainCircuit size={14} className={aiAlert.color} />
                        </div>
                        <div>
                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">{t('ai_reasoning')}</p>
                            <p className="text-xs font-semibold text-white/90 leading-snug">{aiAlert.reason}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Market Prices */}
                <motion.div variants={itemVariants} className="flex justify-between items-end mb-4">
                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-[#8a9d8f]">{t('mandi_prices')}</h2>
                    <span className="text-[10px] font-bold text-[#8a9d8f] uppercase">{t('updated_2h_ago')}</span>
                </motion.div>

                <motion.div variants={containerVariants} className="space-y-3 mb-6">
                    {loading ? (
                        <p className="text-[#8a9d8f] text-center py-4 text-xs font-bold tracking-widest animate-pulse">{t('loading_market_data')}</p>
                    ) : (
                        prices.map((item, idx) => (
                            <motion.div key={idx} variants={itemVariants}>
                                <MarketItem
                                    icon={renderIcon(item.iconType)}
                                    title={item.crop}
                                    subtitle={item.mandi}
                                    price={item.price}
                                    change={item.change}
                                    up={item.up}
                                    neutral={item.neutral}
                                />
                            </motion.div>
                        ))
                    )}
                </motion.div>

                <motion.button onClick={() => navigate('/market')} variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-[#7CFF00]/10 text-[#7CFF00] backdrop-blur-md font-extrabold rounded-xl border border-[#7CFF00]/30 hover:bg-[#7CFF00]/20 transition-all tracking-[0.1em] text-xs shadow-lg">
                    {t('view_all')}
                </motion.button>
            </motion.div>

            {/* Bottom Nav */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 80, delay: 0.5 }}
                className="absolute bottom-0 left-0 right-0 bg-[#0F1A14]/90 backdrop-blur-xl border-t border-white/10 rounded-b-[40px] px-6 py-2 z-50 overflow-visible"
            >
                <div className="max-w-md mx-auto flex justify-between items-center relative h-16">
                    <NavItem icon={<Home size={24} />} label={t('dashboard')} active={true} onClick={() => navigate('/home')} />
                    <NavItem icon={<Wheat size={24} />} label={t('my_crops', 'My Crops')} onClick={() => navigate('/records')} />

                    {/* Empty space for central FAB */}
                    <div className="w-16"></div>

                    <NavItem icon={<Users size={24} />} label={t('community')} onClick={() => navigate('/community')} />
                    <NavItem icon={<User size={24} />} label={t('profile')} onClick={() => navigate('/profile')} />

                    {/* FAB */}
                    <motion.button
                        onClick={() => setShowFAB(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ boxShadow: ["0px 0px 10px rgba(124, 255, 0, 0.2)", "0px 0px 30px rgba(124, 255, 0, 0.6)", "0px 0px 10px rgba(124, 255, 0, 0.2)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute left-1/2 -top-10 -translate-x-1/2 w-[68px] h-[68px] rounded-full bg-[#7CFF00] text-[#0F1A14] flex items-center justify-center border-[8px] border-[#0F1A14] z-50 cursor-pointer"
                    >
                        <Plus size={32} strokeWidth={4} />
                    </motion.button>
                </div>
            </motion.div>

            {/* Floating Action Button Bottom Sheet Menu */}
            <FABMenu isOpen={showFAB} onClose={() => setShowFAB(false)} />

            {/* Notification Panel Overlay */}
            <AnimatePresence>
                {showNotifs && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifs(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 140, damping: 20 }}
                            className="relative bg-[#0F1A14] border-t border-white/10 rounded-t-3xl p-5 pb-10 pointer-events-auto min-h-[50vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 shrink-0" />
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h2 className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">
                                    <Bell size={16} className="text-[#7CFF00]" />
                                    {t('notifications')}
                                </h2>
                                <button onClick={() => setShowNotifs(false)} className="p-1.5 bg-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/20 transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                                {notifications.map(n => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className={`p-4 rounded-xl flex gap-3 ${n.bg} backdrop-blur-sm shadow-lg`}
                                    >
                                        <div className="mt-0.5 shrink-0 bg-white/5 p-2 rounded-full border border-white/10">
                                            {n.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90">{n.title}</h3>
                                                <span className="text-[9px] font-bold tracking-widest text-white/40 shrink-0">{n.time}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-white/70 leading-snug">{n.message}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Subcomponents

function ActionCard({ label, icon, onClick }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] flex flex-col items-center justify-center py-5 px-2 gap-3 hover:bg-white/10 transition-colors shadow-lg"
        >
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#7CFF00] to-[rgba(124,255,0,0.5)] flex items-center justify-center shadow-[0_0_20px_rgba(124,255,0,0.3)] ring-1 ring-[#7CFF00]/50">
                {icon}
            </div>
            <span className="text-[11px] font-extrabold text-center text-white tracking-wide">{label}</span>
        </motion.button>
    );
}

function MarketItem({ icon, title, subtitle, price, change, up, neutral }) {
    return (
        <motion.div
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)" }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex justify-between items-center transition-colors shadow-sm cursor-pointer"
        >
            <div className="flex gap-4 items-center">
                <div className="w-12 h-12 shrink-0">
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-white text-[15px] leading-snug">{title}</h4>
                    <p className="text-[10px] font-bold tracking-widest text-[#8a9d8f] uppercase mt-0.5">{subtitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-white text-[15px] leading-snug">{price}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                    {!neutral && up ? <span className="text-[#7CFF00] text-xs">▲</span> : !neutral && !up ? <span className="text-red-500 text-xs">▼</span> : null}
                    <p className={`text-[10px] font-extrabold tracking-wider ${neutral ? 'text-[#8a9d8f]' : up ? 'text-[#7CFF00]' : 'text-red-500'}`}>
                        {change}
                    </p>
                </div>
            </div>
        </motion.div>
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

// Simple internal icon
function RefreshIcon({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-10.36l5.67-5.67" />
        </svg>
    );
}

export default Dashboard;
