import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import CropPriceModal from './CropPriceModal';
import {
    ArrowLeft, TrendingUp, TrendingDown, Minus,
    Search, RefreshCw, MapPin, Wheat, AlertCircle,
    Star, Wifi, WifiOff, Flame, ThumbsUp, AlertTriangle, BrainCircuit,
    Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── API Config ───────────────────────────────────────────────────────────────
const DATA_GOV_API_KEY = import.meta.env.VITE_MANDI_API_KEY || '';
const DATA_GOV_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const BACKEND_URL = '/api/mandi-prices';

// ─── Indian State Extractor ───────────────────────────────────────────────────
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh',
];
function extractStateFromLocation(str) {
    if (!str) return '';
    const lower = str.toLowerCase();
    return INDIAN_STATES.find(s => lower.includes(s.toLowerCase())) || '';
}

// ─── Previous Price Store (localStorage) ─────────────────────────────────────
const PREV_KEY = 'mandi_prev_prices';
function loadPrevPrices() {
    try { return JSON.parse(localStorage.getItem(PREV_KEY) || '{}'); } catch { return {}; }
}
function savePrevPrices(items) {
    const map = {};
    items.forEach(({ crop, market, price }) => { map[`${crop}||${market}`] = price; });
    localStorage.setItem(PREV_KEY, JSON.stringify(map));
}

// ─── Trend Computation ────────────────────────────────────────────────────────
// ① If prev localStorage price exists → real % change vs last refresh
// ② Else if min/max available → % deviation from day's midpoint (proxy)
// ③ Else → neutral dash
function computeTrend(crop, market, price, minP, maxP, prevMap) {
    const key = `${crop}||${market}`;

    if (key in prevMap) {
        const prev = prevMap[key];
        if (prev > 0 && price !== prev) {
            const pct = ((price - prev) / prev) * 100;
            return { trend: pct > 0 ? 'up' : 'down', pct: Math.abs(pct) };
        }
        return { trend: 'neutral', pct: 0 };
    }

    if (minP > 0 && maxP > 0 && minP !== maxP) {
        const mid = (minP + maxP) / 2;
        const pct = ((price - mid) / mid) * 100;
        return { trend: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'neutral', pct: Math.abs(pct) };
    }

    return { trend: 'neutral', pct: null };
}

// ─── Data Transform ───────────────────────────────────────────────────────────
function transformRecords(records) {
    return records
        .map(r => {
            const price = parseFloat(r.modal_price ?? r.price) || 0;
            if (price === 0) return null;
            const crop = r.commodity || r.crop || '';
            if (!crop) return null;
            return {
                crop,
                market: r.market || '',
                state: r.state || '',
                price,
                minP: parseFloat(r.min_price) || 0,
                maxP: parseFloat(r.max_price) || 0,
            };
        })
        .filter(Boolean);
}

// ─── Fetch Logic ──────────────────────────────────────────────────────────────
async function fetchMandiData() {
    if (DATA_GOV_API_KEY) {
        try {
            const res = await axios.get(DATA_GOV_URL, {
                params: { 'api-key': DATA_GOV_API_KEY, format: 'json', limit: 100 },
                timeout: 8000,
            });
            const t = transformRecords(res.data?.records || []);
            if (t.length > 0) return { data: t, source: 'live' };
        } catch (e) { console.warn('[Mandi] direct API:', e.message); }
    }
    try {
        const res = await axios.get(BACKEND_URL, { timeout: 8000 });
        const t = transformRecords(res.data || []);
        if (t.length > 0) return { data: t, source: 'live' };
    } catch (e) { console.warn('[Mandi] backend proxy:', e.message); }

    throw new Error('Unable to fetch live mandi data. Check your connection.');
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────
// Returns the single best crop recommendation based on all fetched data
function analyzeCrops(data) {
    if (!data.length) return null;

    // Group by crop name
    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.crop]) grouped[item.crop] = [];
        grouped[item.crop].push(item);
    });

    const summaries = Object.entries(grouped).map(([crop, items]) => {
        const prices = items.map(i => i.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const maxPrice = Math.max(...prices);
        const marketCount = items.length;
        // Spread ratio: how tight the prices are across markets (low = stable)
        const spread = prices.length > 1
            ? (Math.max(...prices) - Math.min(...prices)) / avgPrice
            : 0;
        // Top market = the one with highest price
        const topEntry = items.find(i => i.price === maxPrice);
        const topMarket = topEntry?.market || items[0]?.market || '';

        return { crop, avgPrice, maxPrice, marketCount, spread, topMarket };
    });

    // Score each crop
    const scored = summaries.map(s => {
        // Normalize: high price + more markets + tight spread = better
        const priceScore = s.avgPrice;
        const marketScore = s.marketCount * 200;   // bonus per market
        const stabilityPen = s.spread * s.avgPrice;  // penalise high spread
        const score = priceScore + marketScore - stabilityPen;
        return { ...s, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    // Assign tag
    let tag, tagIcon, tagColor;
    if (best.spread < 0.05) {
        tag = 'Stable'; tagIcon = '👍'; tagColor = 'blue';
    } else if (best.avgPrice >= 5000) {
        tag = 'High Profit'; tagIcon = '🔥'; tagColor = 'green';
    } else {
        tag = 'Risky'; tagIcon = '⚠️'; tagColor = 'yellow';
    }

    return { ...best, tag, tagIcon, tagColor };
}

// ─── BestCropCard Component ───────────────────────────────────────────────────
function BestCropCard({ insight, loading }) {
    const { t } = useLanguage();
    if (loading) {
        return (
            <div className="bg-white/4 border border-white/8 rounded-3xl p-4 animate-pulse">
                <div className="h-3 w-32 bg-white/10 rounded mb-3" />
                <div className="h-5 w-24 bg-white/10 rounded mb-2" />
                <div className="h-3 w-40 bg-white/10 rounded" />
            </div>
        );
    }
    if (!insight) return null;

    const colors = {
        green: { bg: 'bg-[#7CFF00]/8', border: 'border-[#7CFF00]/25', text: 'text-[#7CFF00]', badge: 'bg-[#7CFF00]/15 text-[#7CFF00] border-[#7CFF00]/30' },
        blue: { bg: 'bg-blue-500/8', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
        yellow: { bg: 'bg-yellow-500/8', border: 'border-yellow-500/20', text: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
    };
    const c = colors[insight.tagColor] || colors.green;

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 140 }}
            className={`relative rounded-3xl p-4 border overflow-hidden ${c.bg} ${c.border}`}
        >
            {/* Glow blob */}
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${c.bg}`} />

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${c.bg} border ${c.border}`}>
                    <BrainCircuit size={12} className={c.text} />
                </div>
                <p className="text-[9px] font-black tracking-[0.18em] text-white/40 uppercase">
                    {t('best_crop_sell')}
                </p>
                <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full border ${c.badge}`}>
                    {insight.tagIcon} {insight.tag}
                </span>
            </div>

            {/* Main info */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className={`text-xl font-black leading-tight ${c.text}`}>
                        {insight.crop}
                    </h2>
                    {insight.topMarket && (
                        <div className="flex items-center gap-1 mt-1">
                            <MapPin size={10} className="text-white/30" />
                            <span className="text-[10px] text-white/40 font-medium">
                                {insight.topMarket}
                            </span>
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <p className={`text-lg font-black font-mono ${c.text}`}>
                        ₹{Math.round(insight.avgPrice).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[9px] text-white/30 font-bold tracking-widest mt-0.5">
                        {t('avg_qtl')}
                    </p>
                </div>
            </div>

            {/* Sub-stats */}
            <div className="flex gap-3 mt-3 pt-3 border-t border-white/8">
                <div>
                    <p className={`text-xs font-black ${c.text}`}>
                        ₹{Math.round(insight.maxPrice).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[8px] text-white/25 font-bold tracking-wider uppercase">{t('top_price')}</p>
                </div>
                <div className="w-px bg-white/8" />
                <div>
                    <p className={`text-xs font-black ${c.text}`}>{insight.marketCount}</p>
                    <p className="text-[8px] text-white/25 font-bold tracking-wider uppercase">Markets</p>
                </div>
                <div className="w-px bg-white/8" />
                <div>
                    <p className={`text-xs font-black ${insight.spread < 0.05 ? 'text-[#7CFF00]' : 'text-yellow-400'}`}>
                        {insight.spread < 0.05 ? 'Stable' : (insight.spread * 100).toFixed(1) + '% var'}
                    </p>
                    <p className="text-[8px] text-white/25 font-bold tracking-wider uppercase">Volatility</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── TrendBadge ───────────────────────────────────────────────────────────────
function TrendBadge({ trend, pct }) {
    if (!pct || trend === 'neutral') return <Minus size={11} className="text-white/20" />;

    const isUp = trend === 'up';
    const Icon = isUp ? TrendingUp : TrendingDown;
    const color = isUp ? '#7CFF00' : '#f87171';

    return (
        <motion.div
            className="flex items-center gap-0.5"
            animate={{ y: isUp ? [0, -1.5, 0] : [0, 1.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
            <Icon size={11} style={{ color }} />
            <span className="text-[9px] font-black" style={{ color }}>
                {isUp ? '+' : '-'}{pct.toFixed(1)}%
            </span>
        </motion.div>
    );
}

// ─── StatPill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, accent }) {
    return (
        <div className={`flex-1 rounded-xl px-3 py-2 border text-center ${accent
            ? 'bg-[#7CFF00]/8 border-[#7CFF00]/25'
            : 'bg-white/4 border-white/6'}`}>
            <p className={`text-xs font-black ${accent ? 'text-[#7CFF00]' : 'text-white'}`}>{value}</p>
            <p className="text-[9px] text-white/30 font-bold tracking-wider mt-0.5 uppercase">{label}</p>
        </div>
    );
}

// ─── ShimmerBar: reusable shimmer element ────────────────────────────────────
function ShimmerBar({ className }) {
    return (
        <div className={`relative overflow-hidden rounded bg-white/6 ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}

// ─── SkeletonRow: shimmer placeholder for each data row ──────────────────────
function SkeletonRow({ delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
            className="grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-white/4"
        >
            <div className="col-span-5 flex items-center gap-3">
                <ShimmerBar className="w-7 h-7 rounded-full shrink-0" />
                <ShimmerBar className="h-3 w-20" />
            </div>
            <div className="col-span-4 flex items-center">
                <ShimmerBar className="h-3 w-24" />
            </div>
            <div className="col-span-3 flex justify-end">
                <ShimmerBar className="h-4 w-14" />
            </div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Market() {
    const navigate = useNavigate();

    const { user } = useUser();
    const { t } = useLanguage();
    const userState = useMemo(() => extractStateFromLocation(user?.location), [user?.location]);

    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [source, setSource] = useState('');
    const [insight, setInsight] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [nearbyOnly, setNearbyOnly] = useState(false);
    const [selState, setSelState] = useState('Haryana');
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedCrop, setSelectedCrop] = useState(null);  // for modal
    const [lastUpdated, setLastUpdated] = useState(null);    // Track data timestamp
    const [timeAgo, setTimeAgo] = useState(0);               // Ticker for 'sec ago'

    // Once userState resolves (async), auto-select it
    useEffect(() => {
        if (userState) setSelState(userState);
    }, [userState]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const prevMap = loadPrevPrices();
            const { data, source } = await fetchMandiData();

            // Merge trend into each item
            const enriched = data.map(item => ({
                ...item,
                ...computeTrend(item.crop, item.market, item.price, item.minP, item.maxP, prevMap),
            }));

            savePrevPrices(enriched);
            setAllData(enriched);
            setSource(source);
            setInsight(analyzeCrops(enriched));   // ← AI analysis on ALL data
            setLastUpdated(Date.now());
            setTimeAgo(0);

            const hasHaryana = enriched.some(d => d.state === 'Haryana');
            if (!hasHaryana) setSelState('All');
        } catch (e) {
            setAllData([]);
            setError(e.message);
            setSource('');
            setInsight(null);
            setLastUpdated(null);
        } finally {
            setLoading(false);
        }
    }, [refreshKey]);

    useEffect(() => { load(); }, [load]);

    // ── Real-time Auto Refresh (15s) & Ticker (1s) ──────────────────────────
    useEffect(() => {
        // Refresh data every 15s
        const fetchInterval = setInterval(() => {
            // Only trigger if we aren't already loading
            if (!loading) setRefreshKey(k => k + 1);
        }, 15000);

        // Update 'sec ago' text every second
        const tickInterval = setInterval(() => {
            if (lastUpdated) {
                setTimeAgo(Math.floor((Date.now() - lastUpdated) / 1000));
            }
        }, 1000);

        return () => {
            clearInterval(fetchInterval);
            clearInterval(tickInterval);
        };
    }, [loading, lastUpdated]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const stateOptions = useMemo(
        () => ['All', ...new Set(allData.map(d => d.state).filter(Boolean))].sort(),
        [allData]
    );

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return allData
            .filter(d => {
                const matchSearch = d.crop.toLowerCase().includes(q) || d.market.toLowerCase().includes(q);
                const matchState = selState === 'All' || d.state === selState;
                const matchNearby = !nearbyOnly || (userState && d.state === userState);
                return matchSearch && matchState && matchNearby;
            })
            .sort((a, b) => b.price - a.price)
            .slice(0, 30);
    }, [allData, searchTerm, selState, nearbyOnly, userState]);

    const maxPrice = filtered.length > 0 ? filtered[0].price : 0;

    return (
        <>
            <div className="w-full h-full bg-[#050B08] overflow-y-auto overflow-x-hidden text-white relative flex flex-col">

                {/* Background Glow */}
                <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#7CFF00]/6 to-transparent pointer-events-none" />

                {/* ── Header ── */}
                <div className="sticky top-0 z-30 bg-[#050B08]/90 backdrop-blur-xl border-b border-white/5 py-3.5 px-5 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-1 rounded-full hover:bg-white/10 transition-all active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-black tracking-wide flex items-baseline gap-2">
                            <TrendingUp className="text-[#7CFF00] shrink-0 translate-y-0.5" size={16} />
                            {t('mandi_prices')}
                        </h1>
                        {!loading && source === 'live' && (
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1.5 text-[8.5px] px-1.5 py-0.5 rounded
                                                 bg-[#7CFF00]/10 border border-[#7CFF00]/25 text-[#7CFF00] font-black tracking-widest">
                                    <motion.div
                                        className="w-1.5 h-1.5 rounded-full bg-[#7CFF00]"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    {t('live_analysis')}
                                </span>
                                {lastUpdated && (
                                    <span className="text-[9px] text-white/30 font-bold tracking-wide">
                                        {t('last_updated')}: {timeAgo} {t('sec_ago')}
                                    </span>
                                )}
                            </div>
                        )}
                        {!loading && error && (
                            <span className="flex items-center gap-1 mt-0.5 text-[9px] text-red-400 font-bold tracking-widest">
                                <WifiOff size={9} /> OFFLINE
                            </span>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setRefreshKey(k => k + 1)}
                        disabled={loading}
                        className="p-2 rounded-full bg-[#7CFF00]/10 border border-[#7CFF00]/20 text-[#7CFF00] hover:bg-[#7CFF00]/20 transition-all disabled:opacity-30"
                        title="Refresh prices"
                    >
                        <motion.div
                            animate={loading ? { rotate: 360 } : {}}
                            transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                        >
                            <RefreshCw size={16} />
                        </motion.div>
                    </motion.button>
                </div>

                {/* Page content — fade in on mount */}
                <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="px-5 py-4 pb-24 flex-1 flex flex-col gap-4 relative z-10"
                >

                    {/* ── Full Error State (when load fails entirely) ── */}
                    <AnimatePresence mode="wait">
                        {!loading && error && allData.length === 0 ? (
                            <motion.div
                                key="error-full"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <AlertCircle size={28} className="text-red-400" />
                                </div>

                                <div>
                                    <p className="text-base font-black text-white">{t('no_results', 'Failed to load mandi data')}</p>
                                    <p className="text-xs text-white/30 mt-1.5 leading-relaxed max-w-xs">
                                        {error}
                                    </p>
                                </div>

                                {/* Retry button */}
                                <motion.button
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => setRefreshKey(k => k + 1)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full
                                           bg-[#7CFF00]/10 border border-[#7CFF00]/30 text-[#7CFF00]
                                           text-sm font-black hover:bg-[#7CFF00]/20 transition-all"
                                >
                                    <RefreshCw size={14} />
                                    {t('try_different', 'Retry')}
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div key="main-content" className="flex flex-col gap-4">

                                {/* Inline error banner (data loaded but API unavailable) */}
                                {error && allData.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20
                                               text-red-400 text-xs font-semibold px-4 py-3 rounded-2xl"
                                    >
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                {/* ── AI Best Crop Card ── */}
                                <BestCropCard insight={insight} loading={loading} />

                                {/* ── Search ── */}
                                <div className="relative">
                                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder={t('search_crop_market')}
                                        className="w-full bg-white/5 border border-white/8 rounded-2xl py-3.5 pl-11 pr-4
                                   text-sm text-white placeholder:text-white/25 focus:outline-none
                                   focus:border-[#7CFF00]/50 focus:ring-1 focus:ring-[#7CFF00]/25 transition-all"
                                    />
                                </div>

                                {/* ── State Filter Chips + Nearby Toggle ── */}
                                {!loading && stateOptions.length > 1 && (
                                    <div className="space-y-2">
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                                            {stateOptions.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => { setSelState(s); setNearbyOnly(false); }}
                                                    className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all
                                        ${selState === s && !nearbyOnly
                                                            ? 'bg-[#7CFF00] text-[#050B08] border-[#7CFF00]'
                                                            : 'bg-white/5 text-white/40 border-white/8 hover:bg-white/10'}`}
                                                >
                                                    {s === userState ? `📍 ${s}` : s}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Nearby toggle — only shown if we know userState */}
                                        {userState && (
                                            <button
                                                onClick={() => { setNearbyOnly(n => !n); setSelState('All'); }}
                                                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all
                                    ${nearbyOnly
                                                        ? 'bg-[#7CFF00] text-[#050B08] border-[#7CFF00]'
                                                        : 'bg-white/5 text-white/40 border-white/8 hover:bg-white/10'}`}
                                            >
                                                <Navigation size={10} />
                                                {t('near_you', 'Nearby Markets')} {nearbyOnly ? 'ON' : 'OFF'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* ── Stats Row ── */}
                                {!loading && filtered.length > 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                                        <StatPill label={t('results')} value={filtered.length} />
                                        <StatPill label={t('highest_price')} value={`₹${maxPrice.toLocaleString('en-IN')}`} accent />
                                        <StatPill label={t('market_prices')} value={new Set(filtered.map(d => d.market)).size} />
                                    </motion.div>
                                )}

                                {/* ── Table ── */}
                                <div className="flex-1 bg-white/3 border border-white/6 rounded-3xl overflow-hidden shadow-xl">
                                    <div className="grid grid-cols-12 gap-1 bg-white/5 px-4 py-2.5 border-b border-white/8
                                    text-[9px] font-black tracking-[0.15em] text-[#8a9d8f] uppercase">
                                        <div className="col-span-5">{t('commodity')}</div>
                                        <div className="col-span-4">{t('market_prices')} / State</div>
                                        <div className="col-span-3 text-right">{t('price_qtl')}</div>
                                    </div>

                                    <div className="overflow-y-auto max-h-[46vh]">
                                        <AnimatePresence mode="popLayout">
                                            {loading ? (
                                                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                            ) : filtered.length === 0 ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    className="flex flex-col items-center justify-center py-16 text-white/20"
                                                >
                                                    <Wheat size={40} className="mb-3" />
                                                    <p className="text-sm font-semibold">{t('no_results')}</p>
                                                    <p className="text-xs mt-1 text-white/15">{t('try_different')}</p>
                                                </motion.div>
                                            ) : (
                                                filtered.map((item, idx) => {
                                                    const isTop = item.price === maxPrice;
                                                    return (
                                                        <motion.div
                                                            key={`${item.crop}-${item.market}-${idx}`}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            transition={{ delay: idx * 0.03, type: 'spring', stiffness: 160 }}
                                                            onClick={() => setSelectedCrop(item)}
                                                            className={`grid grid-cols-12 gap-1 px-4 py-3 items-center border-b border-white/4
                                                        cursor-pointer group transition-colors
                                                        ${isTop ? 'bg-[#7CFF00]/5 border-l-[3px] border-l-[#7CFF00]/50' : 'hover:bg-white/5 active:bg-white/8'}`}
                                                        >
                                                            {/* Crop */}
                                                            <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                                                                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center
                                                    transition-transform group-hover:scale-110
                                                    ${isTop ? 'bg-[#7CFF00]/20 text-[#7CFF00]' : 'bg-[#7CFF00]/10 text-[#7CFF00]/60'}`}>
                                                                    {isTop ? <Star size={12} fill="currentColor" /> : <Wheat size={12} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className={`text-xs font-bold truncate leading-tight ${isTop ? 'text-[#7CFF00]' : 'text-white'}`}>
                                                                        {item.crop}
                                                                    </p>
                                                                    {isTop && (
                                                                        <p className="text-[8px] font-black text-[#7CFF00]/50 tracking-widest">{t('top_price')}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Market + State */}
                                                            <div className="col-span-4 min-w-0">
                                                                {item.market && (
                                                                    <div className="flex items-center gap-1 min-w-0">
                                                                        <MapPin size={9} className="text-white/25 shrink-0" />
                                                                        <span className="text-[10px] text-white/45 font-medium truncate">{item.market}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1.5 pl-3.5 mt-0.5">
                                                                    {item.state && (
                                                                        <p className="text-[9px] text-white/20 font-medium truncate">{item.state}</p>
                                                                    )}
                                                                    {userState && item.state === userState && (
                                                                        <span className="shrink-0 text-[7px] font-black px-1.5 py-0.5 rounded-full
                                                                         bg-[#7CFF00]/15 text-[#7CFF00] border border-[#7CFF00]/25
                                                                         tracking-widest">
                                                                            {t('near_you')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Price + Trend */}
                                                            <div className="col-span-3 flex flex-col items-end gap-1">
                                                                <span className={`font-mono text-xs font-black leading-tight
                                                    ${item.trend === 'down' ? 'text-red-400' : 'text-[#7CFF00]'}`}>
                                                                    ₹{item.price.toLocaleString('en-IN')}
                                                                </span>
                                                                <TrendBadge trend={item.trend} pct={item.pct} />
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Footer */}
                                {!loading && allData.length > 0 && (
                                    <p className="text-center text-[10px] text-white/15 font-medium tracking-wide">
                                        {t('results')} {filtered.length} / {allData.length}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ── Price Prediction Modal ── */}
            {selectedCrop && (
                <CropPriceModal
                    item={selectedCrop}
                    onClose={() => setSelectedCrop(null)}
                />
            )}
        </>
    );
}

export default Market;
