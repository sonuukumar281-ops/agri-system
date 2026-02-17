import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sprout, TrendingUp, AlertCircle, Sun, CloudRain, Wind } from 'lucide-react';
import { motion } from 'framer-motion';

function Dashboard({ onNavigate }) {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock data fallback if API fails
    const mockPrices = [
        { crop: "Wheat", mandi_price: 2100, msp_price: 2275, status: "Below MSP" },
        { crop: "Rice", mandi_price: 3200, msp_price: 2183, status: "Above MSP" },
    ];

    useEffect(() => {
        // Try to fetch from backend via proxy
        axios.get('/api/market-prices')
            .then(res => setPrices(res.data))
            .catch(err => {
                console.error("Error fetching prices:", err);
                setPrices(mockPrices);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-green-900">Welcome Back, Farmer! 🌾</h1>
                <p className="text-green-600">Here's your farm's overview for today.</p>
            </header>

            {/* Quick Stats / Weather Mock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-yellow-100 to-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
                    <div className="bg-orange-200 p-3 rounded-full text-orange-600">
                        <Sun size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Temperature</p>
                        <p className="text-2xl font-bold text-gray-800">28°C</p>
                        <p className="text-xs text-orange-500">Sunny Day</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-cyan-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
                    <div className="bg-blue-200 p-3 rounded-full text-blue-600">
                        <CloudRain size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Humidity</p>
                        <p className="text-2xl font-bold text-gray-800">65%</p>
                        <p className="text-xs text-blue-500">Chance of rain</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-100 to-emerald-50 p-6 rounded-2xl shadow-sm border border-green-100 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
                    <div className="bg-green-200 p-3 rounded-full text-green-600">
                        <Wind size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Wind Speed</p>
                        <p className="text-2xl font-bold text-gray-800">12 km/h</p>
                        <p className="text-xs text-green-500">Normal breeze</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Crop Cycle Overview */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Sprout className="text-green-600" /> Current Crop Cycle
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-green-900">Active Crop: Wheat</p>
                                <p className="text-sm text-green-600">Stage: Vegetative Growth (Day 45)</p>
                            </div>
                            <div className="bg-green-200 px-3 py-1 rounded-full text-green-800 text-xs font-bold">
                                Healthy
                            </div>
                        </div>

                        <div className="relative pt-4">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">
                                        45% Complete
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                                <div style={{ width: "45%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                            </div>
                        </div>

                        <button
                            onClick={() => onNavigate('wizard')}
                            className="w-full mt-2 py-2 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium flex justify-center items-center gap-2"
                        >
                            <Sprout size={18} /> Start New Analysis
                        </button>
                    </div>
                </div>

                {/* Market Prices */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-600" /> Market Prices vs MSP
                    </h2>

                    {loading ? (
                        <p className="text-gray-500 animate-pulse">Loading market data...</p>
                    ) : (
                        <div className="space-y-3">
                            {prices.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0 cursor-pointer">
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.crop}</p>
                                        <p className="text-xs text-gray-500">Mandi: ₹{item.mandi_price} / MSP: ₹{item.msp_price}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.status.includes('Above') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {item.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                        <button onClick={() => onNavigate('prices')} className="text-blue-600 text-sm font-medium hover:underline flex items-center justify-center gap-1 mx-auto">
                            View Full Price Report <TrendingUp size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
                {[
                    { label: 'Soil Health', icon: <Sprout />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { label: 'Fertilizer Plan', icon: <AlertCircle />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                    { label: 'Crop Doctor', icon: <Sun />, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                    { label: 'Loan Schemes', icon: <TrendingUp />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                ].map((action, i) => (
                    <button
                        key={i}
                        className={`p-6 rounded-xl flex flex-col items-center gap-3 ${action.color} font-semibold shadow-sm transition-all duration-200 hover:scale-105`}
                    >
                        <div>{action.icon}</div>
                        <span className="text-sm">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
