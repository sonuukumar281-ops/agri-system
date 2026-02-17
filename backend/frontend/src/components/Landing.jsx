import { Link } from 'react-router-dom';
import { Sprout, ArrowRight, Sun, CloudRain } from 'lucide-react';
import { motion } from 'framer-motion';

function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col justify-center items-center p-6 text-center">

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
            >
                <div className="bg-green-100 p-4 rounded-full inline-block mb-4 shadow-lg shadow-green-200">
                    <Sprout size={64} className="text-green-600" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-green-900 mb-4 tracking-tight">
                    Agri Fair Price System
                </h1>
                <p className="text-xl text-green-700 max-w-2xl mx-auto leading-relaxed">
                    Empowering farmers with AI-driven crop recommendations and real-time market price insights.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <Link to="/dashboard" className="px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-full shadow-xl hover:bg-green-700 transition-transform active:scale-95 flex items-center gap-2 group">
                    Go to Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/analysis" className="px-8 py-4 bg-white text-green-700 border-2 border-green-200 text-lg font-bold rounded-full shadow-sm hover:border-green-400 hover:bg-green-50 transition-colors active:scale-95">
                    Quick Analysis
                </Link>
            </motion.div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full text-left">
                {[
                    { icon: <CloudRain className="text-blue-500" />, title: "Weather Insights", desc: "Real-time updates tailored for your farm location." },
                    { icon: <Sprout className="text-green-500" />, title: "Crop Advice", desc: "AI-powered suggestions for the best yield." },
                    { icon: <Sun className="text-orange-500" />, title: "Market Prices", desc: "Check fair prices and avoid losses." }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + (i * 0.1) }}
                        className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-green-50 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="mb-4">{item.icon}</div>
                        <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            <footer className="mt-20 text-green-800/60 font-medium">
                © 2024 Agri Fair Price System
            </footer>
        </div>
    );
}

export default Landing;
