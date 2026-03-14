import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Droplet, FlaskConical, IndianRupee, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FABMenu({ isOpen, onClose }) {
    const navigate = useNavigate();

    // State to toggle between the main menu and specific forms
    const [activeForm, setActiveForm] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    // Form States
    const [amount, setAmount] = useState('');
    const [ph, setPh] = useState('');
    const [moisture, setMoisture] = useState('');
    const [title, setTitle] = useState('');

    // Close handler that also resets sub-forms
    const handleClose = () => {
        setActiveForm(null);
        setAmount(''); setPh(''); setMoisture(''); setTitle('');
        onClose();
    };

    const triggerToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const handleIrrigationSubmit = (e) => {
        e.preventDefault();
        const cur = JSON.parse(localStorage.getItem('irrigationLogs') || '[]');
        cur.push({ amount, date: new Date().toISOString() });
        localStorage.setItem('irrigationLogs', JSON.stringify(cur));
        triggerToast('Irrigation added ✅');
        handleClose();
    };

    const handleSoilSubmit = (e) => {
        e.preventDefault();
        const cur = JSON.parse(localStorage.getItem('soilData') || '[]');
        cur.push({ ph, moisture, date: new Date().toISOString() });
        localStorage.setItem('soilData', JSON.stringify(cur));
        triggerToast('Soil Data added ✅');
        handleClose();
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        const cur = JSON.parse(localStorage.getItem('expenses') || '[]');
        cur.push({ title, amount, date: new Date().toISOString() });
        localStorage.setItem('expenses', JSON.stringify(cur));
        triggerToast('Expense added ✅');
        handleClose();
    };

    const menuItems = [
        { icon: <Wheat size={24} />, label: "Add Crop", color: "text-[#7CFF00]", bg: "bg-[#7CFF00]/10", action: () => navigate('/add-crop') },
        { icon: <Droplet size={24} />, label: "Add Irrigation", color: "text-blue-400", bg: "bg-blue-400/10", action: () => setActiveForm('irrigation') },
        { icon: <FlaskConical size={24} />, label: "Add Soil Data", color: "text-purple-400", bg: "bg-purple-400/10", action: () => setActiveForm('soil') },
        { icon: <IndianRupee size={24} />, label: "Add Expense", color: "text-red-400", bg: "bg-red-400/10", action: () => setActiveForm('expense') }
    ];

    return (
        <AnimatePresence>
            {/* TOAST SYSTEM */}
            {toastMsg && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-[#7CFF00] text-black font-black tracking-wide px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(124,255,0,0.3)]"
                >
                    {toastMsg}
                </motion.div>
            )}

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-[#0c1a10] border-t border-white/10 rounded-t-3xl p-6 z-[101] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-white font-bold text-lg">
                                {!activeForm ? "Quick Actions" :
                                    activeForm === 'irrigation' ? "Record Irrigation" :
                                        activeForm === 'soil' ? "Input Soil Check" : "Log Expense"}
                            </h2>
                            <button onClick={handleClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {!activeForm ? (
                                <motion.div
                                    key="main-menu"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-2 gap-4 pb-4"
                                >
                                    {menuItems.map((item, index) => (
                                        <motion.button
                                            key={index}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={item.action}
                                            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors gap-3"
                                        >
                                            <div className={`p-4 rounded-full ${item.bg} ${item.color} shadow-lg`}>
                                                {item.icon}
                                            </div>
                                            <span className="text-white text-sm font-semibold tracking-wide">{item.label}</span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            ) : activeForm === 'irrigation' ? (
                                <motion.form key="form-irr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleIrrigationSubmit} className="flex flex-col gap-4 pb-4">
                                    <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block">Water Amount (Litres)</label>
                                    <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-blue-400/50" />
                                    <button type="submit" className="w-full py-4 mt-2 rounded-xl bg-blue-500 text-white font-bold tracking-wide">SAVE LOG</button>
                                </motion.form>
                            ) : activeForm === 'soil' ? (
                                <motion.form key="form-soil" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSoilSubmit} className="flex flex-col gap-4 pb-4">
                                    <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block">pH Value</label>
                                    <input type="number" step="0.1" required value={ph} onChange={(e) => setPh(e.target.value)} placeholder="e.g. 6.5" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-purple-400/50" />
                                    <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block mt-2">Moisture %</label>
                                    <input type="number" required value={moisture} onChange={(e) => setMoisture(e.target.value)} placeholder="e.g. 45" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-purple-400/50" />
                                    <button type="submit" className="w-full py-4 mt-2 rounded-xl bg-purple-500 text-white font-bold tracking-wide">SAVE SOIL DATA</button>
                                </motion.form>
                            ) : (
                                <motion.form key="form-exp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleExpenseSubmit} className="flex flex-col gap-4 pb-4">
                                    <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block">Title / Description</label>
                                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Seeds Purchase" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-red-400/50" />
                                    <label className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase pl-1 block mt-2">Amount (₹)</label>
                                    <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 2500" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-red-400/50" />
                                    <button type="submit" className="w-full py-4 mt-2 rounded-xl bg-red-500 text-white font-bold tracking-wide">SAVE EXPENSE</button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
