import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', label: 'English' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', label: 'हिंदी' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳', label: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳', label: 'தமிழ்' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳', label: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳', label: 'मराठी' },
    { code: 'bn', name: 'Bengali', flag: '🇮🇳', label: 'বাংলা' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳', label: 'ગુજરાતી' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳', label: 'ਪੰਜਾਬੀ' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳', label: 'മലയാളം' }
];

export default function LanguageSelection() {
    const navigate = useNavigate();
    const { language, changeLanguage, t } = useLanguage();
    const [selected, setSelected] = useState(language);

    const handleSelect = (code) => {
        setSelected(code);
        changeLanguage(code);
    };

    const handleContinue = () => {
        navigate('/home');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="z-10 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-2xl w-full max-w-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                        🌍 {t('select_language')}
                    </h1>
                    <p className="text-slate-400 mt-2">
                        {t('select_language_sub')}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 ${selected === lang.code
                                ? 'bg-emerald-500/20 border-emerald-500 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                                }`}
                        >
                            <span className="text-3xl mb-2">{lang.flag}</span>
                            <span className="font-semibold">{lang.name}</span>
                            <span className="text-sm text-slate-400">{lang.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white p-4 rounded-xl font-bold text-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                    {t('continue')} →
                </button>
            </div>
        </div>
    );
}
