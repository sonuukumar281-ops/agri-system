import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../translations';

export const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    // Load language from localStorage on initialization
    useEffect(() => {
        const savedLanguages = localStorage.getItem('app_language');
        if (savedLanguages && translations[savedLanguages]) {
            setLanguage(savedLanguages);
        }
    }, []);

    // Update language and localStorage
    const changeLanguage = (langCode) => {
        if (translations[langCode]) {
            setLanguage(langCode);
            localStorage.setItem('app_language', langCode);
        }
    };

    // Translation helper function
    const t = (key, fallbackText) => {
        // Return translation if exists, otherwise fallback to english, if not exists in english then return fallbackText or key
        return translations[language]?.[key] || translations['en']?.[key] || fallbackText || key;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
