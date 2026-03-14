import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
    ArrowLeft,
    CheckCircle,
    Droplet,
    Wheat,
    Bell,
    BrainCircuit,
    Sun,
    CloudRain,
    CloudFog,
    CloudLightning,
    Loader2
} from 'lucide-react';

function MyCrops() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // ─── Shared State Retrieval ─────────────────────────────────────────────
    // Fetch the same crop and recommendation data from localStorage as Dashboard
    const [cropData, setCropData] = useState(() => {
        try {
            const saved = localStorage.getItem('cropData');
            if (saved && saved !== "undefined") {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.cropName) return parsed;
            }
        } catch (e) {
            console.error("Error parsing cropData from localStorage", e);
        }
        return {
            cropName: "Wheat (PBW-343)",
            growthPercentage: 75,
            stage: "Flowering",
            waterStatus: "Opt Water",
            healthStatus: "Healthy"
        };
    });

    const [recommendation, setRecommendation] = useState(() => {
        const saved = localStorage.getItem('recommendation');
        return saved || "Apply Urea fertilizer within next 48 hours for optimal yield.";
    });

    const [weather, setWeather] = useState(() => {
        const saved = localStorage.getItem('weather');
        return saved ? JSON.parse(saved) : { temp: "28°C", condition: "Sunny", season: "Rabi Season", subtext: "Fetching live weather...", icon: "CLEAR" };
    });

    // ─── Dynamic Recommendation from Dashboard logic ────────────────────────
    const dynamicRecommendation = useMemo(() => {
        const stage = cropData?.stage?.toLowerCase() || "";
        const water = cropData?.waterStatus?.toLowerCase() || "";
        const wCondition = weather?.condition?.toLowerCase() || "";
        const tempStr = weather?.temp || "25°C";
        const temp = parseInt(tempStr.replace(/\D/g, '')) || 25;

        if (water.includes("dry")) {
            return `Critical: Soil moisture is low. Irrigate ${cropData?.cropName || "your crop"} within next 24 hours to prevent heat stress.`;
        }
        if (wCondition.includes("rain") || wCondition.includes("storm")) {
            return `Heavy rain expected. Ensure proper drainage in the field to avoid waterlogging for your ${cropData?.cropName || "crop"}.`;
        }

        if (stage.includes("flowering") || stage.includes("growth") || stage.includes("vegetative")) {
            return `Optimal time for nutrient boost! Apply Urea or Nitrogen-based fertilizer to maximize ${cropData?.cropName || "crop"} yield.`;
        }
        if (stage.includes("harvest") || stage.includes("mature") || stage.includes("ripening")) {
            return `Crop is nearing readiness. Prepare harvesting equipment and check Mandi prices to plan your selling strategy.`;
        }
        if (stage.includes("seedling") || stage.includes("sowing")) {
            if (temp < 15) return `Cold temperatures detected. Protect young seedlings from frost if necessary.`;
            return `Ensure young seedlings receive light, frequent watering. Monitor for early pests.`;
        }

        if (cropData?.healthStatus?.toLowerCase().includes("healthy")) {
            return `${cropData?.cropName || "Crop"} is progressing perfectly. Continue current irrigation and monitoring schedule.`;
        }

        return `Monitor ${cropData?.cropName || "crop"} closely based on local weather conditions.`;

    }, [cropData, weather]);

    // ─── Animation Variants ────────────────────────────────────────────────
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
        <div className="bg-[#0F1A14] w-full h-full text-white font-sans pb-24 selection:bg-[#7CFF00]/30 overflow-hidden overflow-y-auto no-scrollbar relative flex flex-col">

            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#0F1A14]/90 backdrop-blur-xl border-b border-white/5 py-4 px-5 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-all active:scale-95">
                    <ArrowLeft size={22} className="text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-black tracking-wide flex items-center gap-2">
                        <Wheat className="text-[#7CFF00]" size={20} />
                        {t('my_crops', 'My Crops')}
                    </h1>
                </div>
            </div>

            <motion.div
                className="max-w-md mx-auto p-5 pb-10 w-full"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Active Crop Card (Matching Dashboard Style) */}
                <motion.div variants={itemVariants} className="relative bg-white/5 backdrop-blur-md rounded-[24px] p-6 mb-8 border border-white/10 overflow-hidden shadow-2xl">
                    {/* Glowing background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#7CFF00]/10 blur-3xl rounded-full mix-blend-screen pointer-events-none" />

                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-[#8a9d8f] mb-6 inline-flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7CFF00] mb-0.5 animate-pulse" />
                        {t('active_crop', 'ACTIVE CROP')}
                    </h2>

                    <div className="flex gap-5 items-center mb-6 relative z-10">
                        {/* Progress Ring */}
                        <div className="relative w-[104px] h-[104px] shrink-0">
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
                                    animate={{ strokeDasharray: `${cropData.growthPercentage}, 100` }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                                    className="text-[#7CFF00]" strokeWidth="4" strokeLinecap="round"
                                    stroke="currentColor" fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-0.5">
                                <span className="text-3xl font-black text-white">{cropData.growthPercentage}%</span>
                                <span className="text-[9px] font-bold tracking-[0.2em] text-[#8a9d8f] mt-0.5">{t('growth', 'GROWTH')}</span>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-[22px] font-black text-white leading-tight break-words pr-2">{cropData.cropName}</h3>
                            <p className="text-sm font-medium text-[#8a9d8f] mb-4 mt-1.5 flex items-center gap-1.5">
                                <span className="text-white/30 text-xs">●</span> {t('stage', 'Stage')}: {cropData.stage}
                            </p>

                            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-bold border border-blue-500/20 shadow-sm transition-transform hover:scale-105">
                                    <Droplet size={11} strokeWidth={3} /> {cropData.waterStatus}
                                </span>
                                <span className="bg-[#7CFF00]/10 text-[#7CFF00] text-[10px] px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-bold border border-[#7CFF00]/20 shadow-sm transition-transform hover:scale-105">
                                    <CheckCircle size={11} strokeWidth={3} /> {cropData.healthStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* AI Recommendation Section */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#7CFF00]/10 to-transparent backdrop-blur-md border border-[#7CFF00]/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7CFF00]/20 blur-3xl rounded-full pointer-events-none" />

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#7CFF00]/20 flex items-center justify-center border border-[#7CFF00]/30 shadow-[0_0_15px_rgba(124,255,0,0.2)]">
                            <BrainCircuit className="text-[#7CFF00]" size={20} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-base font-black text-white">{t('ai_recommendation', 'AI Recommendation')}</h3>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                        <p className="text-sm font-medium text-white/90 leading-relaxed">
                            {dynamicRecommendation}
                        </p>
                    </div>
                </motion.div>

                {/* Secondary Info / Future Expansion */}
                <motion.div variants={itemVariants} className="mt-6 flex justify-center">
                    <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase flex items-center gap-1.5">
                        <CheckCircle size={10} /> Data Synced Offline
                    </p>
                </motion.div>

            </motion.div>
        </div>
    );
}

export default MyCrops;
