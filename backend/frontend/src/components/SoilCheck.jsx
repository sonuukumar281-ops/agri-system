import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FlaskConical, Droplet, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function SoilCheck() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nitrogen: 45, phosphorus: 30, potassium: 40, ph_level: 6.5 });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/api/soil-analysis', formData);
            setResult(res.data);
        } catch (err) {
            setResult({ health_status: "Average", score: 42.5, suggestion: "Mock Fallback: Soil balance is acceptable but could use slight NPK boost." });
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
                <h1 className="text-lg font-bold">Soil Analysis</h1>
            </div>

            <div className="px-6 py-4">
                <div className="bg-[#7CFF00]/5 border border-[#7CFF00]/20 rounded-2xl p-5 mb-6 flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#7CFF00]/20 flex items-center justify-center shrink-0">
                        <FlaskConical className="text-[#7CFF00]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-[#7CFF00] font-bold text-sm mb-1">Laboratory Input</h2>
                        <p className="text-xs text-white/60 leading-relaxed">Enter your recent N-P-K readings to get a health score and AI recommendation.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Nitrogen (N)</label>
                            <input type="number" value={formData.nitrogen} onChange={e => setFormData({ ...formData, nitrogen: parseInt(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Phosphorus (P)</label>
                            <input type="number" value={formData.phosphorus} onChange={e => setFormData({ ...formData, phosphorus: parseInt(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Potassium (K)</label>
                            <input type="number" value={formData.potassium} onChange={e => setFormData({ ...formData, potassium: parseInt(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">pH Level</label>
                            <input type="number" step="0.1" value={formData.ph_level} onChange={e => setFormData({ ...formData, ph_level: parseFloat(e.target.value) })} className="w-full bg-[#1A251E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF00]/50" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-[#7CFF00] text-[#0F1A14] font-extrabold rounded-xl hover:bg-[#6be000] transition-colors tracking-widest text-xs mt-6 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'ANALYZE SOIL'}
                    </button>
                </form>

                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#8a9d8f] mb-4">ANALYSIS RESULTS</h3>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs text-white/60 mb-1">Health Status</p>
                                <p className={`text-xl font-bold ${result.health_status === 'Poor' ? 'text-red-500' : 'text-[#7CFF00]'}`}>{result.health_status}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white/60 mb-1">Overall Score</p>
                                <p className="text-2xl font-black text-white">{result.score}/100</p>
                            </div>
                        </div>
                        <div className="bg-[#1A251E] rounded-xl p-4 border border-white/5">
                            <p className="text-sm text-white/80 leading-relaxed font-medium">{result.suggestion}</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default SoilCheck;
