import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, TrendingUp, TrendingDown, Minus, MapPin,
    BrainCircuit, Zap, ShieldCheck, AlertTriangle, Clock, Calculator, PieChart
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts';

// ─── Seeded RNG (deterministic per crop+day) ─────────────────────────────────
function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);   // 0..1
}

// ─── Price History Generator ──────────────────────────────────────────────────
function generatePrediction(crop, currentPrice) {
    const base = crop.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

    // ── Historical: 5 days back (inverted walk toward currentPrice)
    const historical = [];
    for (let i = 4; i >= 0; i--) {
        const fluctuation = (seededRand(base + i * 7) * 400) - 200;
        const frac = i / 5;
        const p = Math.round(currentPrice + fluctuation * frac);
        historical.push({
            label: i === 0 ? 'Today' : `${i}d ago`,
            price: Math.max(50, p),
            predicted: null,
        });
    }
    historical[4] = { ...historical[4], price: currentPrice };

    // ── Predicted: 5 days forward
    const predicted = [];
    let walkPrice = currentPrice;
    for (let i = 1; i <= 5; i++) {
        const fluctuation = (seededRand(base + i * 13) * 400) - 200;
        walkPrice = Math.max(50, Math.round(walkPrice + fluctuation));
        const d = new Date();
        d.setDate(d.getDate() + i);
        const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        predicted.push({
            label: `+${i}d`,
            dayName: fullDays[d.getDay()],
            price: null,
            predicted: walkPrice,
        });
    }

    const todayBridge = { label: 'Today', price: currentPrice, predicted: currentPrice };
    const chartData = [
        ...historical.slice(0, 4),
        todayBridge,
        ...predicted,
    ];

    const predictedPrices = predicted.map(p => p.predicted);
    const avgPredicted = predictedPrices.reduce((a, b) => a + b, 0) / predictedPrices.length;
    const finalPrice = predictedPrices[predictedPrices.length - 1];
    const maxDev = Math.max(...predictedPrices.map(p => Math.abs(p - currentPrice)));
    const volatility = maxDev / currentPrice;

    const changePct = ((finalPrice - currentPrice) / currentPrice) * 100;
    const trend = changePct > 1.5 ? 'up' : changePct < -1.5 ? 'down' : 'stable';
    const confidence = volatility < 0.04 ? 'High' : volatility < 0.09 ? 'Medium' : 'Low';

    // Convert volatility to a 0-100% confidence score
    // volatility 0.00 -> 98%, volatility 0.15 -> ~50%
    const rawScore = 98 - (volatility * 300);
    const confidenceScore = Math.max(35, Math.min(99, Math.round(rawScore)));

    const maxPredicted = Math.max(...predictedPrices);

    const bestIdx = predicted.reduce((bi, p, i) => p.predicted > predicted[bi].predicted ? i : bi, 0);
    const bestSell = {
        label: predicted[bestIdx].label,
        dayName: predicted[bestIdx].dayName,
        price: predicted[bestIdx].predicted,
        chartDataIdx: 4 + 1 + bestIdx,
    };

    return { chartData, trend, confidence, confidenceScore, avgPredicted, changePct, finalPrice, maxPredicted, bestSell };
}

// ─── PeakDot ──────────────────────────────────────────────────────────────────
function PeakDot({ cx, cy, index, peakIdx }) {
    if (index !== peakIdx) return <circle cx={cx} cy={cy} r={3} fill="#facc15" />;
    return (
        <g>
            <circle cx={cx} cy={cy} r={10} fill="rgba(250,204,21,0.15)" />
            <circle cx={cx} cy={cy} r={6} fill="rgba(250,204,21,0.30)" />
            <circle cx={cx} cy={cy} r={4} fill="#facc15" />
            <text x={cx} y={cy - 14} textAnchor="middle" fontSize={11}>🔥</text>
        </g>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value ?? payload[1]?.value;
    const isPredicted = payload[0]?.dataKey === 'predicted';
    return (
        <div className="bg-[#0D1A0E] border border-[#7CFF00]/20 rounded-xl px-3 py-2 text-xs font-bold shadow-xl">
            <p className="text-white/40 mb-0.5">{label}</p>
            <p className={isPredicted ? 'text-yellow-400' : 'text-[#7CFF00]'}>
                {isPredicted ? '📊 Predicted' : '⚡ Actual'}: ₹{val?.toLocaleString('en-IN')}
            </p>
        </div>
    );
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
    const styles = {
        High: { icon: ShieldCheck, color: 'text-[#7CFF00]', bg: 'bg-[#7CFF00]/10  border-[#7CFF00]/25' },
        Medium: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/25' },
        Low: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10    border-red-500/25' },
    };
    const s = styles[level] || styles.Medium;
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full border ${s.bg} ${s.color}`}>
            <Icon size={9} />
            {level} Confidence
        </span>
    );
}

// ─── Insight Generator ────────────────────────────────────────────────────────
function getInsights(trend, changePct, confidence) {
    const pct = Math.abs(changePct).toFixed(1);
    if (trend === 'up') return {
        headline: `Price expected to rise ~${pct}% in 5 days`,
        advice: confidence === 'High' ? '📈 Good time to wait — hold stock if possible.' : '📈 Likely to rise, but monitor market daily.',
        color: 'text-[#7CFF00]',
    };
    if (trend === 'down') return {
        headline: `Price may fall ~${pct}% over next 5 days`,
        advice: confidence === 'High' ? '🔔 Sell soon — price correction likely.' : '⚠️ Moderate chance of decline. Sell in 1–2 days.',
        color: 'text-red-400',
    };
    return {
        headline: 'Price expected to remain stable',
        advice: '👍 No urgency. Sell at your convenience.',
        color: 'text-blue-400',
    };
}

// ─── Decision Engine ──────────────────────────────────────────────────────────
function getDecision(trend, changePct, confidence, currentPrice, maxPredicted) {
    const peakGap = ((maxPredicted - currentPrice) / currentPrice) * 100;
    const isAtPeak = trend === 'up' && peakGap < 3;

    if (trend === 'down' && changePct < -6) return {
        label: 'SELL FAST', emoji: '🔥',
        sub: `Sharp drop of ~${Math.abs(changePct).toFixed(1)}% predicted. Act immediately.`,
        variant: 'sell-fast',
    };
    if (trend === 'down' || isAtPeak) return {
        label: 'SELL NOW', emoji: '🔥',
        sub: isAtPeak
            ? 'Price near predicted peak. Good moment to sell.'
            : `Price declining ~${Math.abs(changePct).toFixed(1)}%. Sell before it drops further.`,
        variant: 'sell',
    };
    if (trend === 'up' && changePct > 3) return {
        label: 'HOLD', emoji: '⏳',
        sub: `Price projected to rise ~${changePct.toFixed(1)}%. Higher returns expected.`,
        variant: 'hold',
    };
    return {
        label: 'WAIT', emoji: '⚠️',
        sub: 'Market signal is weak. Monitor for 1–2 days before deciding.',
        variant: 'wait',
    };
}

// ─── DecisionCard ─────────────────────────────────────────────────────────────
function DecisionCard({ decision, confidenceScore }) {
    const themes = {
        'sell-fast': { bg: 'bg-red-500/12', border: 'border-red-500/40', glow: 'shadow-[0_0_24px_rgba(239,68,68,0.18)]', label: 'text-red-400', sub: 'text-red-300/60', dot: 'bg-red-400' },
        sell: { bg: 'bg-red-500/8', border: 'border-red-500/25', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]', label: 'text-red-400', sub: 'text-red-300/50', dot: 'bg-red-400' },
        hold: { bg: 'bg-[#7CFF00]/8', border: 'border-[#7CFF00]/30', glow: 'shadow-[0_0_20px_rgba(124,255,0,0.15)]', label: 'text-[#7CFF00]', sub: 'text-[#7CFF00]/50', dot: 'bg-[#7CFF00]' },
        wait: { bg: 'bg-yellow-500/8', border: 'border-yellow-500/25', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.12)]', label: 'text-yellow-400', sub: 'text-yellow-300/50', dot: 'bg-yellow-400' },
    };
    const t = themes[decision.variant] || themes.wait;

    // Confidence color logic
    let confColor = 'text-red-400';
    let confBg = 'bg-red-400/10 border-red-400/20';
    if (confidenceScore >= 80) {
        confColor = 'text-[#7CFF00]';
        confBg = 'bg-[#7CFF00]/10 border-[#7CFF00]/20';
    } else if (confidenceScore >= 60) {
        confColor = 'text-yellow-400';
        confBg = 'bg-yellow-400/10 border-yellow-400/20';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
            className={`relative rounded-2xl border p-3 overflow-hidden shrink-0 ${t.bg} ${t.border} ${t.glow}`}
        >
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <motion.div
                    className={`w-2 h-2 rounded-full ${t.dot}`}
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className={`text-[8px] font-black tracking-widest ${t.sub}`}>LIVE</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <p className="text-[8px] font-black tracking-[0.2em] text-white/25 uppercase">AI Decision</p>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${confColor} ${confBg}`}>
                    {confidenceScore}% CONFIDENCE
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-2xl" role="img" aria-label={decision.label}>{decision.emoji}</span>
                <h3 className={`text-xl font-black tracking-tight leading-none ${t.label}`}>{decision.label}</h3>
            </div>
            <p className={`text-[11px] font-medium leading-relaxed mt-1.5 ${t.sub}`}>{decision.sub}</p>
        </motion.div>
    );
}

// ─── Explainability Generator ───────────────────────────────────────────────────
function getExplanation(trend, changePct, confidenceScore, item, decision) {
    const isUp = trend === 'up';
    const isFastDrop = trend === 'down' && changePct < -5;

    // Derived Risk Level & Color
    let riskLevel = 'Medium';
    let riskColor = 'yellow';
    if (confidenceScore > 85 && !isFastDrop) { riskLevel = 'Low'; riskColor = 'green'; }
    if (isFastDrop || confidenceScore < 55) { riskLevel = 'High'; riskColor = 'red'; }

    // Demand
    const demand = isUp ? 'High' : (trend === 'down' ? 'Low' : 'Medium');

    // Smart Selling Split Strategy
    let split = { sellNow: 50, hold: 50, holdDays: 2 };

    // Farmer-friendly simple advice
    let advice = 'Prices are somewhat stable. Selling now or waiting both seem fine.';
    let alternative = 'Hold off for 2 days to see if prices rise.';

    if (decision.variant === 'sell-fast') {
        advice = 'Prices are crashing fast! Selling immediately will save you from major losses.';
        alternative = 'If you cannot sell today, try to sell at least 50% now to minimize risk.';
        split = { sellNow: 100, hold: 0, holdDays: 0 };
    } else if (decision.variant === 'sell') {
        advice = isUp
            ? 'Prices have hit a peak. Selling now locks in your best profit.'
            : 'Prices are starting to drop. Sell soon before they fall further.';
        alternative = 'Sell 80% now, hold 20% just in case it bounces back.';
        split = { sellNow: 80, hold: 20, holdDays: 1 };
    } else if (decision.variant === 'hold') {
        advice = 'A strong upward trend is expected. Keep your stock for higher returns in a few days.';
        alternative = 'If you need cash urgently, sell only 20% and hold the rest.';
        split = { sellNow: 20, hold: 80, holdDays: 3 };
    } else {
        advice = 'The market is mixed. Waiting 1-2 days provides a clearer picture.';
        alternative = 'Sell a small portion (10-20%) if you need immediate cash, otherwise wait.';
        split = { sellNow: 30, hold: 70, holdDays: 2 };
    }

    return {
        trendStr: isUp ? 'Rising' : (trend === 'down' ? 'Falling' : 'Stable'),
        demand,
        riskLevel,
        riskColor,
        advice,
        alternative,
        confidenceScore,
        split
    };
}

// ─── ExplainabilityCard ───────────────────────────────────────────────────────
function ExplainabilityCard({ exp }) {
    const colors = {
        green: { text: 'text-[#7CFF00]', bg: 'bg-[#7CFF00]/20', border: 'border-[#7CFF00]/30' },
        yellow: { text: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30' },
        red: { text: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30' },
    };
    const rC = colors[exp.riskColor];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 140 }}
            className="rounded-2xl border border-white/8 bg-white/4 flex flex-col overflow-hidden shrink-0"
        >
            <div className="p-3 bg-black/20 border-b border-white/5">
                <p className="text-[9px] font-black tracking-[0.18em] text-white/50 uppercase flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-[#7CFF00]" /> Why this decision?
                </p>
            </div>

            <div className="p-3 space-y-4">
                {/* 1. Bullet Points Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                        <p className="text-[8px] font-bold text-white/40 uppercase mb-0.5">Price Trend</p>
                        <p className="text-xs font-black text-white">{exp.trendStr}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                        <p className="text-[8px] font-bold text-white/40 uppercase mb-0.5">Demand</p>
                        <p className="text-xs font-black text-white">{exp.demand}</p>
                    </div>
                </div>

                {/* Risk & Confidence */}
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">Confidence</span>
                            <span className="text-[10px] font-black text-white">{exp.confidenceScore}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${exp.confidenceScore}%` }}
                                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                                className={`h-full ${exp.confidenceScore > 80 ? 'bg-[#7CFF00]' : exp.confidenceScore > 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                            />
                        </div>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-wide mb-1">Risk Level</p>
                        <div className={`text-[10px] font-black px-1.5 py-0.5 rounded border inline-block ${rC.text} ${rC.bg} ${rC.border}`}>
                            {exp.riskLevel}
                        </div>
                    </div>
                </div>

                {/* 2. Simple Advice (Farmer Friendly) */}
                <div className="bg-[#7CFF00]/5 border border-[#7CFF00]/20 rounded-xl p-3">
                    <p className="text-[10px] font-black text-[#7CFF00] tracking-widest uppercase mb-1 flex items-center gap-1">
                        📢 Simple Advice
                    </p>
                    <p className="text-xs text-white/90 font-medium leading-relaxed">
                        "{exp.advice}"
                    </p>
                </div>

                {/* 3. Alternative Suggestion */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-[9px] font-black text-white/40 tracking-widest uppercase mb-1 flex items-center gap-1">
                        💡 Alternative Plan
                    </p>
                    <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                        {exp.alternative}
                    </p>
                </div>

                <p className="text-[8px] font-medium text-white/20 text-center uppercase tracking-widest pt-1">
                    Based on last 7 days data + predictive AI model
                </p>
            </div>
        </motion.div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function CropPriceModal({ item, onClose }) {
    const [quantity, setQuantity] = useState(10); // default 10 quintals

    const { chartData, trend, confidence, confidenceScore, changePct, finalPrice, maxPredicted, bestSell } =
        useMemo(() => generatePrediction(item.crop, item.price), [item.crop, item.price]);

    const insight = getInsights(trend, changePct, confidence);
    const decision = getDecision(trend, changePct, confidence, item.price, maxPredicted);
    // 3. Explainability
    const explanation = useMemo(
        () => getExplanation(trend, changePct, confidenceScore, item, decision),
        [trend, changePct, confidenceScore, item, decision]
    );
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? '#7CFF00' : trend === 'down' ? '#f87171' : '#60a5fa';

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />

            {/* Full-height sheet */}
            <motion.div
                key="sheet"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 130, damping: 18 }}
                className="fixed inset-0 z-50 h-[100dvh] w-full
                           bg-[#050B08] flex flex-col overflow-hidden"
            >
                {/* Drag handle */}
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 shrink-0" />

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="flex items-start justify-between px-5 pt-3 pb-4 shrink-0 border-b border-white/5">
                    <div>
                        <div className="flex items-center gap-2">
                            <BrainCircuit size={13} className="text-[#7CFF00]" />
                            <p className="text-[9px] font-black tracking-[0.18em] text-white/30 uppercase">
                                AI Price Prediction
                            </p>
                        </div>
                        <h2 className="text-xl font-black text-white mt-0.5">{item.crop}</h2>
                        {item.market && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <MapPin size={9} className="text-white/30" />
                                <span className="text-[10px] text-white/35 font-medium">
                                    {item.market}{item.state ? ` · ${item.state}` : ''}
                                </span>
                            </div>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/8 hover:bg-white/15 transition-all"
                    >
                        <X size={16} />
                    </motion.button>
                </div>

                {/* ── Two-column body ───────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ━━━ LEFT: Market Trend ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <div className="flex flex-col w-[54%] px-4 pt-4 pb-6 border-r border-white/5">

                        <p className="text-[9px] font-black tracking-[0.2em] text-white/25 uppercase mb-3 shrink-0">
                            📈 Market Trend
                        </p>

                        {/* Price + forecast mini-cards */}
                        <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                            <div className="rounded-xl bg-[#7CFF00]/6 border border-[#7CFF00]/15 p-2.5">
                                <p className="text-[8px] text-white/30 font-bold tracking-wider uppercase mb-0.5">Current</p>
                                <p className="text-sm font-black text-[#7CFF00] font-mono leading-tight">
                                    ₹{item.price.toLocaleString('en-IN')}
                                </p>
                                <p className="text-[8px] text-white/20 font-bold">/ quintal</p>
                            </div>
                            <div className="rounded-xl bg-white/4 border border-white/8 p-2.5">
                                <p className="text-[8px] text-white/30 font-bold tracking-wider uppercase mb-0.5">5-Day</p>
                                <div className="flex items-center gap-1">
                                    <TrendIcon size={11} style={{ color: trendColor }} />
                                    <span className="text-sm font-black font-mono leading-tight" style={{ color: trendColor }}>
                                        ₹{finalPrice.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <p className="text-[8px] font-black mt-0.5" style={{ color: trendColor }}>
                                    {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Confidence + legend */}
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <ConfidenceBadge level={confidence} />
                            <div className="flex items-center gap-2 text-[8px] font-bold text-white/25">
                                <span className="flex items-center gap-0.5">
                                    <span className="w-3.5 h-0.5 bg-[#7CFF00] rounded inline-block" /> Live
                                </span>
                                <span className="flex items-center gap-0.5">
                                    <span className="w-3.5 h-0.5 border-t-2 border-dashed border-yellow-400 inline-block" /> AI
                                </span>
                            </div>
                        </div>

                        {/* Chart — fills remaining height via relative container */}
                        <div className="flex-1 relative min-h-0">
                            <motion.div
                                className="absolute inset-0"
                                initial={{ opacity: 0, scaleX: 0.85 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 14, right: 4, left: -26, bottom: 0 }}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 7.5, fontWeight: 700 }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 7.5 }}
                                            axisLine={false} tickLine={false}
                                            tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <ReferenceLine
                                            y={item.price}
                                            stroke="rgba(124,255,0,0.18)"
                                            strokeDasharray="5 4"
                                            label={{ value: 'Now', fill: 'rgba(124,255,0,0.35)', fontSize: 7 }}
                                        />
                                        <Line
                                            type="monotone" dataKey="price"
                                            stroke="#7CFF00" strokeWidth={2.5}
                                            dot={{ fill: '#7CFF00', strokeWidth: 0, r: 3.5 }}
                                            activeDot={{ r: 5, fill: '#7CFF00' }}
                                            connectNulls={false}
                                            isAnimationActive animationDuration={800} animationEasing="ease-out"
                                        />
                                        <Line
                                            type="monotone" dataKey="predicted"
                                            stroke="#facc15" strokeWidth={2} strokeDasharray="6 3"
                                            dot={(props) => <PeakDot {...props} peakIdx={bestSell.chartDataIdx} />}
                                            activeDot={{ r: 5, fill: '#facc15' }}
                                            connectNulls={false}
                                            isAnimationActive animationDuration={1000} animationEasing="ease-out" animationBegin={200}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </motion.div>
                        </div>
                    </div>

                    {/* ━━━ RIGHT: AI Insights ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <div className="flex-1 flex flex-col gap-3 px-3.5 pt-4 pb-6 overflow-y-auto">

                        <p className="text-[9px] font-black tracking-[0.2em] text-white/25 uppercase shrink-0">
                            🧠 AI Insights
                        </p>

                        {/* Best Day to Sell */}
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08, type: 'spring', stiffness: 150 }}
                            className="rounded-2xl bg-yellow-500/8 border border-yellow-500/25 p-3 shrink-0"
                        >
                            <p className="text-[8px] font-black tracking-widest text-white/25 uppercase mb-1.5">
                                Best Day to Sell
                            </p>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-sm font-black text-yellow-300 leading-tight">{bestSell.dayName}</p>
                                    <p className="text-[9px] text-white/30 font-medium mt-0.5">{bestSell.label}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5
                                                     rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 block mb-1">
                                        🔥 Peak Day
                                    </span>
                                    <p className="text-sm font-black font-mono text-yellow-300">
                                        ₹{bestSell.price.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* AI Decision */}
                        <DecisionCard decision={decision} confidenceScore={confidenceScore} />

                        {/* Why this decision - Advanced UI */}
                        <ExplainabilityCard exp={explanation} />

                        {/* AI Insight text */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-white/8 bg-white/4 p-3 space-y-1.5 shrink-0"
                        >
                            <div className="flex items-center gap-1.5">
                                <BrainCircuit size={11} className="text-[#7CFF00]" />
                                <p className="text-[8px] font-black tracking-widest text-white/30 uppercase">AI Insight</p>
                            </div>
                            <p className={`text-xs font-black leading-snug ${insight.color}`}>
                                {insight.headline}
                            </p>
                            <p className="text-[11px] text-white/45 font-medium leading-relaxed">
                                {insight.advice}
                            </p>
                            <div className="flex items-center gap-1 pt-0.5">
                                <Clock size={8} className="text-white/15" />
                                <p className="text-[8px] text-white/15 font-medium">Simulated forecast</p>
                            </div>
                        </motion.div>

                        {/* Smart Strategy & Profit Calculator */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="rounded-2xl border border-[#7CFF00]/10 bg-gradient-to-b from-[#7CFF00]/10 to-transparent p-3 shrink-0 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7CFF00] opacity-5 blur-3xl rounded-full pointer-events-none"></div>

                            <div className="flex items-center gap-1.5 mb-3">
                                <PieChart size={12} className="text-[#7CFF00]" />
                                <p className="text-[9px] font-black tracking-widest text-[#7CFF00] uppercase">Smart Selling Strategy</p>
                            </div>

                            {/* Split Visualizer */}
                            <div className="flex bg-black/40 rounded-lg p-3 mb-4 items-center gap-3 border border-white/5">
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                                        <span className={explanation.split.sellNow > 0 ? "text-[#7CFF00]" : "text-white/30"}>Sell {explanation.split.sellNow}% Today</span>
                                        <span className={explanation.split.hold > 0 ? "text-yellow-400" : "text-white/30"}>Hold {explanation.split.hold}%</span>
                                    </div>
                                    <div className="h-2 w-full flex rounded-full overflow-hidden bg-white/10">
                                        {explanation.split.sellNow > 0 && <div className="h-full bg-[#7CFF00]" style={{ width: `${explanation.split.sellNow}%` }}></div>}
                                        {explanation.split.hold > 0 && <div className="h-full bg-yellow-400" style={{ width: `${explanation.split.hold}%` }}></div>}
                                    </div>
                                    <p className="text-[9px] text-center text-white/40 mt-1.5 font-medium">
                                        Hold {explanation.split.hold}% for {explanation.split.holdDays} days
                                    </p>
                                </div>
                            </div>

                        </motion.div>

                        {/* Traditional Profit Calculator */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl border border-white/8 bg-white/4 p-3 shrink-0"
                        >
                            <div className="flex items-center gap-1.5 mb-4">
                                <Calculator size={11} className="text-[#7CFF00]" />
                                <p className="text-[8px] font-black tracking-widest text-[#7CFF00] uppercase">Basic Profit Calculator</p>
                            </div>

                            <div className="flex items-center gap-2 mb-4 bg-black/40 rounded-lg p-2 border border-white/5">
                                <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest pl-1">Available Qty (Quintals):</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="bg-black/60 border border-[#7CFF00]/20 text-[#7CFF00] rounded-lg px-2 py-1.5 flex-1 text-sm font-black focus:outline-none focus:border-[#7CFF00]/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40 font-medium">If you sell now ({item.price.toLocaleString('en-IN')} × {quantity})</span>
                                    <span className="font-black text-white">₹{(item.price * quantity).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40 font-medium">If you wait ({bestSell.price.toLocaleString('en-IN')} × {quantity})</span>
                                    <span className="font-black text-yellow-300">₹{(bestSell.price * quantity).toLocaleString('en-IN')} <span className="text-[9px] text-white/30 font-normal ml-1">(est.)</span></span>
                                </div>

                                <div className="h-px bg-white/10 my-1"></div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Difference</span>
                                    {bestSell.price > item.price ? (
                                        <span className="text-sm font-black text-[#7CFF00]">+₹{((bestSell.price - item.price) * quantity).toLocaleString('en-IN')} gain</span>
                                    ) : bestSell.price < item.price ? (
                                        <span className="text-sm font-black text-red-400">-₹{((item.price - bestSell.price) * quantity).toLocaleString('en-IN')} loss</span>
                                    ) : (
                                        <span className="text-sm font-black text-white/50">No difference</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
