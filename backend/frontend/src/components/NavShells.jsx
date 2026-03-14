import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export function Records() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    return (
        <div className="w-full h-full bg-[#0F1A14] flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-bold text-[#7CFF00] mb-4">{t('records')}</h1>
            <button onClick={() => navigate('/')} className="px-4 py-2 border border-[#7CFF00] rounded-xl text-[#7CFF00]">Go Back</button>
        </div>
    );
}

export function Community() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    return (
        <div className="w-full h-full bg-[#0F1A14] flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-bold text-[#7CFF00] mb-4">{t('community')}</h1>
            <button onClick={() => navigate('/')} className="px-4 py-2 border border-[#7CFF00] rounded-xl text-[#7CFF00]">Go Back</button>
        </div>
    );
}
