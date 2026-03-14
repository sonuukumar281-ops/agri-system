import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';

export default function ChatBox() {
    const { user } = useUser();
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('agri_chat');
        if (saved) return JSON.parse(saved);
        return [
            { id: 1, sender: 'ai', text: `👋 ${t('greeting')}! I am your AI Farming Assistant. Ask me anything!` }
        ];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        sessionStorage.setItem('agri_chat', JSON.stringify(messages));
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);

        // Harvest Context
        const activeCropData = JSON.parse(localStorage.getItem('activeCrop') || '{}');
        const weather = JSON.parse(localStorage.getItem('weather') || '{}');

        const payload = {
            message: newMsg.text,
            userName: user?.fullName || 'Farmer',
            cropName: activeCropData.name || 'your crop', // Using .name from activeCrop
            weatherTemp: weather.temp || 'current temperature',
            soilMoisture: 'Optimal' //activeCropData.waterStatus is no longer in simple schema, default to Optimal for context
        };

        try {
            const res = await axios.post('/api/chat', payload);
            const botReply = {
                id: Date.now() + 1,
                sender: 'ai',
                text: res.data.reply
            };
            setMessages(prev => [...prev, botReply]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="absolute bottom-24 right-4 z-50 w-14 h-14 bg-[#7CFF00] rounded-full shadow-[0_0_25px_rgba(124,255,0,0.5)] flex items-center justify-center border-2 border-[#16a34a]"
                >
                    <MessageSquare className="text-[#0F1A14]" size={24} strokeWidth={2.5} />
                </motion.button>
            )}

            {/* Chat Panel Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        className="absolute inset-x-0 bottom-0 z-[100] h-[75%] bg-[#0F1A14] border-t border-[#7CFF00]/30 rounded-t-3xl flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.5)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#7CFF00]/10 rounded-full border border-[#7CFF00]/30 animate-pulse">
                                    <Bot size={20} className="text-[#7CFF00]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black tracking-widest text-sm uppercase">{t('ai_assistant')}</h3>
                                    <p className="text-[#7CFF00] text-[9px] font-bold tracking-widest uppercase">Online • Ready to help</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                        {/* Avatar */}
                                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${msg.sender === 'user'
                                            ? 'bg-blue-500/20 border-blue-500/50'
                                            : 'bg-[#7CFF00]/20 border-[#7CFF00]/50'
                                            }`}>
                                            {msg.sender === 'user' ? <User size={12} className="text-blue-400" /> : <Bot size={12} className="text-[#7CFF00]" />}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`p-3 rounded-2xl text-sm shadow-md ${msg.sender === 'user'
                                            ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30 rounded-br-sm'
                                            : 'bg-white/5 text-white/90 border border-white/10 rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="flex items-center gap-2 max-w-[85%] flex-row">
                                        <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center border bg-[#7CFF00]/20 border-[#7CFF00]/50">
                                            <Bot size={12} className="text-[#7CFF00]" />
                                        </div>
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm shadow-md">
                                            <Loader2 size={14} className="animate-spin text-[#7CFF00]" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-black/20 border-t border-white/5 backdrop-blur-md">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your farming question..."
                                    className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-[#7CFF00]/50 focus:ring-1 focus:ring-[#7CFF00]/30 transition-all placeholder:text-white/30"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 p-2 bg-[#7CFF00] rounded-full text-[#0F1A14] disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={16} className={input.trim() ? "ml-0.5" : ""} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
