import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Wheat } from 'lucide-react';

export default function AddCrop() {
    const navigate = useNavigate();

    // Default dummy states
    const [cropName, setCropName] = useState('');
    const [stage, setStage] = useState('Sowing');
    const [area, setArea] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Build the crop object mimicking the new simple schema
        const randomGrowth = Math.floor(Math.random() * (75 - 50 + 1)) + 50; // Random 50-75
        const newCropData = {
            name: cropName,
            stage: stage,
            growth: randomGrowth
        };

        // Save to Local Storage
        localStorage.setItem('activeCrop', JSON.stringify(newCropData));

        // Dispatch an event so the Dashboard immediately picks up the new data
        window.dispatchEvent(new Event('cropUpdated'));

        // Go back to the dashboard Home
        navigate('/home');
    };

    return (
        <div className="bg-[#0F1A14] w-full min-h-[844px] text-white font-sans overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#7CFF00] rounded-full blur-[150px] opacity-10 pointer-events-none" />

            <div className="max-w-md mx-auto relative z-10 px-6 py-12">
                {/* Header */}
                <header className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors"
                    >
                        <ChevronLeft size={24} className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Add New Crop</h1>
                        <p className="text-xs text-[#8a9d8f] font-bold tracking-widest uppercase mt-1">Farm Management</p>
                    </div>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="bg-[#0c1a10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">

                        {/* Decorative Icon */}
                        <div className="absolute top-4 right-4 opacity-10">
                            <Wheat size={100} />
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">

                            {/* Crop Name */}
                            <div>
                                <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block mb-2">Crop Name</label>
                                <input
                                    type="text"
                                    required
                                    value={cropName}
                                    onChange={(e) => setCropName(e.target.value)}
                                    placeholder="e.g. Wheat (PBW-343)"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-[#7CFF00]/50 focus:bg-black/60 transition-all font-semibold"
                                />
                            </div>

                            {/* Growth Stage */}
                            <div>
                                <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block mb-2">Current Stage</label>
                                <div className="relative">
                                    <select
                                        value={stage}
                                        onChange={(e) => setStage(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white appearance-none outline-none focus:border-[#7CFF00]/50 focus:bg-black/60 transition-all font-semibold"
                                    >
                                        <option value="Sowing">Sowing 🌱</option>
                                        <option value="Growing">Growing 🌿</option>
                                        <option value="Flowering">Flowering 🌼</option>
                                        <option value="Harvesting">Harvesting 🌾</option>
                                    </select>
                                    {/* Custom Select Arrow */}
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            {/* Cultivation Area */}
                            <div>
                                <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block mb-2">Cultivation Area</label>
                                <input
                                    type="text"
                                    required
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    placeholder="e.g. 5 Acres"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-[#7CFF00]/50 focus:bg-black/60 transition-all font-semibold"
                                />
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full mt-4 py-5 rounded-2xl bg-[#7CFF00] text-black font-black tracking-wide shadow-[0_0_20px_rgba(124,255,0,0.2)] hover:shadow-[0_0_30px_rgba(124,255,0,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                <Wheat size={20} strokeWidth={3} />
                                SAVE CROP DATA
                            </motion.button>

                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
