import { useState } from 'react';
import axios from 'axios';
import { CloudRain, ThermometerSun, CheckCircle, AlertTriangle, Sprout, ArrowLeft, MapPin, FlaskConical, ArrowRight, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Wizard({ onBack }) {
    const [step, setStep] = useState(1);
    const [language, setLanguage] = useState('en'); // 'en' or 'hi'
    const [formData, setFormData] = useState({
        location: '',
        rainfall: '',
        temperature: '',
        soil_type: 'red',
        n: 0,
        p: 0,
        k: 0
    });
    const [recommendation, setRecommendation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const translations = {
        en: {
            title: "Crop Analysis Wizard",
            step1: "Location & Weather",
            step2: "Soil Details",
            step3: "Nutrient Levels (NPK)",
            location: "Farm Location",
            rainfall: "Rainfall (mm)",
            temp: "Temperature (°C)",
            soil: "Soil Type",
            nitrogen: "Nitrogen (N)",
            phosphorus: "Phosphorus (P)",
            potassium: "Potassium (K)",
            next: "Next Step",
            prev: "Previous",
            analyze: "Analyze Soil",
            analyzing: "Analyzing...",
            result: "Recommended for You"
        },
        hi: {
            title: "फसल विश्लेषण जादूगर",
            step1: "स्थान और मौसम",
            step2: "मिट्टी का विवरण",
            step3: "पोषक तत्व (NPK)",
            location: "खेत का स्थान",
            rainfall: "वर्षा (मिमी)",
            temp: "तापमान (°C)",
            soil: "मिट्टी का प्रकार",
            nitrogen: "नाइट्रोजन (N)",
            phosphorus: "फास्फोरस (P)",
            potassium: "पोटैशियम (K)",
            next: "अगला कदम",
            prev: "पिछला",
            analyze: "मिट्टी का विश्लेषण करें",
            analyzing: "विश्लेषण कर रहा है...",
            result: "आपके लिए अनुशंसित"
        }
    };

    const t = translations[language];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setRecommendation(null);

        try {
            const response = await axios.post('/api/recommend', {
                ...formData,
                rainfall: parseFloat(formData.rainfall),
                temperature: parseFloat(formData.temperature),
                n: parseInt(formData.n),
                p: parseInt(formData.p),
                k: parseInt(formData.k)
            });
            setRecommendation(response.data);
            setStep(4); // Move to results step
        } catch (err) {
            console.error(err);
            setError("Failed to fetch recommendation. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-green-700 font-semibold hover:underline"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <button
                    onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-green-800 font-medium hover:bg-green-50 transition-colors"
                >
                    <Languages size={18} /> {language === 'en' ? 'हिन्दी' : 'English'}
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-green-100 flex flex-col md:flex-row min-h-[500px]">
                {/* Progress Sidebar */}
                <div className="bg-green-800 text-white p-8 md:w-1/3 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                            <Sprout /> {t.title}
                        </h2>
                        <div className="space-y-6">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className={`flex items-center gap-4 ${step >= s ? 'opacity-100' : 'opacity-50'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= s ? 'bg-white text-green-800 border-white' : 'border-white text-white'}`}>
                                        {step > s ? <CheckCircle size={18} /> : s}
                                    </div>
                                    <span className="font-medium">{t[`step${s}`]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 opacity-75 text-sm">
                        Agri Fair Price System © 2024
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 md:w-2/3 bg-white relative">
                    {step < 4 ? (
                        <form onSubmit={(e) => { e.preventDefault(); if (step < 3) nextStep(); else handleSubmit(e); }} className="space-y-6 h-full flex flex-col justify-center">

                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">{t.step1}</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.location}</label>
                                        <div className="relative">
                                            <input name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. Punjab, Village X" className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rainfall}</label>
                                            <div className="relative">
                                                <input type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} required className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                                <CloudRain className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.temp}</label>
                                            <div className="relative">
                                                <input type="number" name="temperature" value={formData.temperature} onChange={handleChange} required className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                                <ThermometerSun className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">{t.step2}</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.soil}</label>
                                        <select name="soil_type" value={formData.soil_type} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                                            <option value="red">Red Soil (लाल मिट्टी)</option>
                                            <option value="black">Black Soil (काली मिट्टी)</option>
                                            <option value="clay">Clay Soil (चिकनी मिट्टी)</option>
                                            <option value="sandy">Sandy Soil (रेतीली मिट्टी)</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">{t.step3}</h3>

                                    <div className="space-y-4">
                                        {[
                                            { label: t.nitrogen, name: 'n', color: 'text-blue-600', val: formData.n },
                                            { label: t.phosphorus, name: 'p', color: 'text-orange-600', val: formData.p },
                                            { label: t.potassium, name: 'k', color: 'text-purple-600', val: formData.k },
                                        ].map((item, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between mb-1">
                                                    <label className={`text-sm font-medium ${item.color}`}>{item.label}</label>
                                                    <span className="text-sm font-bold text-gray-600">{item.val}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    name={item.name}
                                                    min="0" max="200"
                                                    value={item.val}
                                                    onChange={handleChange}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex gap-4 pt-4 mt-auto">
                                {step > 1 && (
                                    <button type="button" onClick={prevStep} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                        {t.prev}
                                    </button>
                                )}
                                <button type="submit" disabled={loading} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex justify-center items-center gap-2">
                                    {loading ? t.analyzing : (step === 3 ? t.analyze : <>{t.next} <ArrowRight size={18} /></>)}
                                </button>
                            </div>

                        </form>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t.result}</h3>

                            {recommendation && (
                                <div className="w-full space-y-4">
                                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                                        <p className="text-sm text-green-600 uppercase tracking-wide font-bold mb-1">Best Crop</p>
                                        <p className="text-4xl font-bold text-green-900">{recommendation.recommended_crop}</p>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                                        <p className="text-sm text-blue-600 uppercase tracking-wide font-bold mb-1">Fertilizer</p>
                                        <p className="text-3xl font-bold text-blue-900">{recommendation.fertilizer}</p>
                                    </div>
                                    <button onClick={() => { setStep(1); setRecommendation(null); }} className="text-green-600 font-medium hover:underline mt-4">
                                        Start New Analysis
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Wizard;
