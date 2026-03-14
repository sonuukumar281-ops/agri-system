import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

function CropAI() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ temperature: 25, humidity: 70, ph: 6.5, rainfall: 200 });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Note: Since Vite proxy forwards /api over to http://127.0.0.1:8000
            // and the backend endpoint is at /predict-crop
            // Check vite.config.js for proxy rules; assuming direct for now or /api/
            // Actually, backend has it at /predict-crop
            const res = await axios.post('http://127.0.0.1:8000/predict-crop', formData);

            // Standardize output to match mock UI shape
            setResult({
                recommended_crop: res.data.crop ? res.data.crop.charAt(0).toUpperCase() + res.data.crop.slice(1) : "Unknown",
                confidence: res.data.confidence || 90,
                reasoning: `AI matched environmental conditions with highest probability to ${res.data.crop || "Unknown"}.`
            });
        } catch (err) {
            console.error(err);
            setResult({ recommended_crop: "Error", confidence: 0, reasoning: "Failed to connect to AI Predictor backend." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-[#0F1A14] overflow-y-auto overflow-x-hidden text-white relative pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-[#0F1A14]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 z-20 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold">Crop AI Predictor</h1>
            </div>

            <div className="px-6 py-4">
                <div className="bg-[#7CFF00]/5 border border-[#7CFF00]/20 rounded-2xl p-5 mb-6 flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#7CFF00]/20 flex items-center justify-center shrink-0">
                        <BrainCircuit className="text-[#7CFF00]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-[#7CFF00] font-bold text-sm mb-1">AI Environmental Model</h2>
                        <p className="text-xs text-white/60 leading-relaxed">Enter current localized weather or farm data to let AI predict the highest-yield crop.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Temperature (°C)</label>
                        <input type="number" step="0.1" value={formData.temperature} onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Humidity (%)</label>
                        <input type="number" step="0.1" value={formData.humidity} onChange={e => setFormData({ ...formData, humidity: parseFloat(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Soil pH Level</label>
                        <input type="number" step="0.1" value={formData.ph} onChange={e => setFormData({ ...formData, ph: parseFloat(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Rainfall (mm)</label>
                        <input type="number" step="0.1" value={formData.rainfall} onChange={e => setFormData({ ...formData, rainfall: parseFloat(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-[#7CFF00] text-[#0F1A14] font-extrabold rounded-xl hover:bg-[#6be000] transition-colors tracking-widest text-xs mt-6 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={16} strokeWidth={3} /> PREDICT BEST CROP</>}
                    </button>
                </form>

                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-gradient-to-br from-[#7CFF00]/10 to-transparent border border-[#7CFF00]/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7CFF00] opacity-10 blur-3xl rounded-full"></div>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#8a9d8f] mb-2 uppercase">AI Recommendation</h3>
                        <p className="text-4xl font-black text-white mb-1">{result.recommended_crop}</p>
                        <p className="text-sm font-bold text-[#7CFF00] mb-6">{result.confidence}% Match Confidence</p>

                        <div className="bg-[#0F1A14]/50 rounded-xl p-4 border border-white/5">
                            <p className="text-sm text-white/80 leading-relaxed">{result.reasoning}</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default CropAI;
