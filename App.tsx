
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Brush, ReferenceLine, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Stock, AIAnalysis, AppLanguage, Trendline, Transaction, Holding, SavedTrendline } from './types';
import { INDIAN_STOCKS, EDUCATION_MODULES } from './constants';
import { getStockAnalysis, compareStocks } from './services/geminiService';

// --- Global Theme Colors ---
const COLORS = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#00d09c',
  red: '#eb5b3c',
  bg: '#03040b',
  card: '#0d1122'
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#00d09c', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

// --- Utility Components ---

const NewsTicker = () => (
  <div className="bg-blue-600/10 border-y border-blue-500/20 py-2 overflow-hidden whitespace-nowrap text-[10px] font-bold tracking-widest uppercase text-blue-400">
    <div className="animate-[marquee_30s_linear_infinite] inline-block">
      <span className="mx-8">NIFTY 50 ATH: 23,450.12 (+0.45%)</span>
      <span className="mx-8">SENSEX SURGES AS IT SECTOR GAINS MOMENTUM</span>
      <span className="mx-8">RBI HOLDS RATES: BANKING STOCKS SEE VOLATILITY</span>
      <span className="mx-8">RYAION AI ADVISOR: RELIANCE INDICATES STRONG ACCUMULATION ZONE</span>
      <span className="mx-8">ZOMATO PROFITABILITY MILESTONE DRIVES INVESTOR SENTIMENT</span>
    </div>
    <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  </div>
);

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight uppercase ${color}`}>
    {text}
  </span>
);

const Navbar = ({ activeTab, setActiveTab, lang, setLang }: any) => (
  <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 glass-card border-b border-white/5">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
        <i className="fas fa-terminal text-white text-lg"></i>
      </div>
      <h1 className="text-xl font-black tracking-tightest gradient-text font-heading uppercase">RYAION</h1>
    </div>
    
    <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest">
      {['Market', 'Learn', 'Advisor', 'Compare', 'Portfolio'].map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`transition-all duration-300 ${activeTab === tab ? 'text-white tab-active' : 'text-gray-500 hover:text-white'}`}
        >
          {tab}
        </button>
      ))}
    </div>

    <div className="flex items-center gap-4">
      <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
        <button 
          onClick={() => setLang('English')}
          className={`px-2 py-1 rounded text-[10px] font-bold ${lang === 'English' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
        >EN</button>
        <button 
          onClick={() => setLang('Hindi')}
          className={`px-2 py-1 rounded text-[10px] font-bold ${lang === 'Hindi' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
        >HI</button>
      </div>
      <button className="bg-white text-black hover:bg-blue-500 hover:text-white text-[11px] px-5 py-2 rounded-lg font-black uppercase transition-all">
        Terminal
      </button>
    </div>
  </nav>
);

// --- Enhanced Chart Component ---

const InteractiveChart = ({ 
  data, 
  symbol, 
  color,
  savedTrendlines,
  onSaveTrendline,
  onDeleteTrendline
}: { 
  data: any[], 
  symbol: string, 
  color: string,
  savedTrendlines: SavedTrendline[],
  onSaveTrendline: (line: Omit<SavedTrendline, 'id'>) => void,
  onDeleteTrendline: (id: string) => void
}) => {
  const [range, setRange] = useState('1D');
  const [drawingTrendline, setDrawingTrendline] = useState(false);
  const [trendline, setTrendline] = useState<Trendline | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [trendlineLabel, setTrendlineLabel] = useState('');

  const handleChartClick = (state: any) => {
    if (!drawingTrendline || !state || !state.activeLabel) return;
    if (clickCount === 0) {
      setTrendline({
        x1: state.activeLabel, y1: state.activePayload[0].value,
        x2: state.activeLabel, y2: state.activePayload[0].value
      });
      setClickCount(1);
    } else if (clickCount === 1) {
      setTrendline(prev => prev ? ({ ...prev, x2: state.activeLabel, y2: state.activePayload[0].value }) : null);
      setClickCount(2); // Waiting for label/save
    }
  };

  const filteredData = useMemo(() => {
    if (range === '1D') return data.slice(-10);
    if (range === '1W') return data.slice(-30);
    return data;
  }, [data, range]);

  const activeSavedTrendlines = savedTrendlines.filter(t => t.symbol === symbol);

  const handleSave = () => {
    if (trendline) {
      onSaveTrendline({
        ...trendline,
        symbol,
        label: trendlineLabel || `Trend ${activeSavedTrendlines.length + 1}`
      });
      setTrendline(null);
      setClickCount(0);
      setDrawingTrendline(false);
      setTrendlineLabel('');
    }
  };

  const handleCancel = () => {
    setTrendline(null);
    setClickCount(0);
    setDrawingTrendline(false);
    setTrendlineLabel('');
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg">
          {['1D', '1W', '1M', 'ALL'].map(r => (
            <button 
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-[10px] font-black tracking-tighter transition-all ${range === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {r}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {clickCount === 2 && trendline ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
              <input 
                type="text" 
                placeholder="Name trend..." 
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-bold text-white outline-none focus:border-blue-500 transition-all w-32"
                value={trendlineLabel}
                onChange={(e) => setTrendlineLabel(e.target.value)}
              />
              <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">Save</button>
              <button onClick={handleCancel} className="bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">Discard</button>
            </div>
          ) : (
            <button 
              onClick={() => { setDrawingTrendline(!drawingTrendline); if(!drawingTrendline) setTrendline(null); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-2 border transition-all ${drawingTrendline ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
            >
              <i className="fas fa-pen-nib"></i>
              {drawingTrendline ? 'MARK POINTS' : 'DRAW TREND'}
            </button>
          )}
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} onClick={handleChartClick}>
            <defs>
              <linearGradient id={`color-main`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="time" stroke="#4b5563" fontSize={10} minTickGap={30} tickLine={false} axisLine={false} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ background: '#0d1122', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#color-main)`} 
              strokeWidth={3}
              isAnimationActive={true}
            />
            {trendline && (
              <ReferenceLine 
                segment={[{ x: trendline.x1, y: trendline.y1 }, { x: trendline.x2, y: trendline.y2 }]} 
                stroke="#f97316" 
                strokeWidth={2} 
                strokeDasharray="5 5"
              />
            )}
            {activeSavedTrendlines.map(tl => (
              <ReferenceLine 
                key={tl.id}
                segment={[{ x: tl.x1, y: tl.y1 }, { x: tl.x2, y: tl.y2 }]} 
                stroke="#3b82f6" 
                strokeWidth={1.5} 
                strokeDasharray="3 3"
                label={{ position: 'top', value: tl.label, fill: '#3b82f6', fontSize: 8, fontWeight: 'bold' }}
              />
            ))}
            <Brush dataKey="time" height={25} stroke="#3b82f6" fill="#03040b" travellerWidth={10} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {activeSavedTrendlines.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest w-full mb-1">Saved Technicals</p>
          {activeSavedTrendlines.map(tl => (
            <div key={tl.id} className="bg-blue-600/10 border border-blue-500/20 px-2 py-1 rounded-md flex items-center gap-2 group transition-all">
              <span className="text-[9px] font-bold text-blue-400 uppercase">{tl.label}</span>
              <button onClick={() => onDeleteTrendline(tl.id)} className="text-[9px] text-gray-600 hover:text-red-500 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Watchlist Sidebar Component ---

const Watchlist = ({ stocks, onStockClick }: { stocks: Stock[], onStockClick: (s: Stock) => void }) => (
  <div className="w-full lg:w-80 h-full border-r border-white/5 bg-black/20 flex flex-col">
    <div className="p-4 border-b border-white/5 flex justify-between items-center">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Watchlist</h3>
      <div className="flex gap-2">
        <i className="fas fa-search text-gray-600 text-xs cursor-pointer"></i>
        <i className="fas fa-filter text-gray-600 text-xs cursor-pointer"></i>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {stocks.map(s => (
        <div 
          key={s.id} 
          onClick={() => onStockClick(s)}
          className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all flex justify-between items-center group"
        >
          <div>
            <p className="font-black text-sm group-hover:text-blue-400 transition-colors tracking-tight">{s.symbol}</p>
            <p className="text-[10px] text-gray-600 uppercase font-bold">{s.sector}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">₹{s.price.toFixed(2)}</p>
            <p className={`text-[10px] font-bold ${s.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {s.change >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Page Components ---

const MarketPage = ({ stocks, onStockClick }: { stocks: Stock[], onStockClick: (s: Stock) => void }) => {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] animate-in fade-in duration-500 overflow-hidden">
      <Watchlist stocks={stocks} onStockClick={onStockClick} />
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black mb-2 font-heading tracking-tightest">MARKET TERMINAL</h2>
            <p className="text-gray-500 text-sm font-medium">Real-time surveillance of Indian equity movers.</p>
          </div>
          <div className="flex gap-4">
             <div className="glass-card px-4 py-2 rounded-xl text-center min-w-[120px]">
               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Nifty 50</p>
               <p className="text-sm font-black text-green-400">23,456.10 (+0.4%)</p>
             </div>
             <div className="glass-card px-4 py-2 rounded-xl text-center min-w-[120px]">
               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Sensex</p>
               <p className="text-sm font-black text-green-400">77,123.45 (+0.3%)</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stocks.slice(0, 4).map(stock => (
            <div 
              key={stock.id} 
              onClick={() => onStockClick(stock)}
              className="glass-card p-6 rounded-2xl border-l-2 border-l-blue-500 hover:bg-white/[0.03] transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black font-heading group-hover:text-blue-400 transition-colors uppercase">{stock.symbol}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black font-mono tracking-tighter">₹{stock.price.toLocaleString()}</p>
                  <p className={`text-xs font-black ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="h-32 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stock.history.slice(-15)}>
                    <defs>
                      <linearGradient id={`grad-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stock.change >= 0 ? COLORS.green : COLORS.red} stopOpacity={0.2}/>
                        <stop offset="100%" stopColor={stock.change >= 0 ? COLORS.green : COLORS.red} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="step" 
                      dataKey="value" 
                      stroke={stock.change >= 0 ? COLORS.green : COLORS.red} 
                      strokeWidth={2}
                      fill={`url(#grad-${stock.id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Day Low</p>
                  <p className="text-[11px] font-bold">₹{stock.dayLow || '---'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Day High</p>
                  <p className="text-[11px] font-bold">₹{stock.dayHigh || '---'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdvisorPage = ({ 
  stocks, 
  selectedStock, 
  setSelectedStock,
  savedTrendlines,
  onSaveTrendline,
  onDeleteTrendline
}: { 
  stocks: Stock[], 
  selectedStock: Stock | null, 
  setSelectedStock: any,
  savedTrendlines: SavedTrendline[],
  onSaveTrendline: (line: Omit<SavedTrendline, 'id'>) => void,
  onDeleteTrendline: (id: string) => void
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async (stock: Stock) => {
    setLoading(true);
    try {
      const result = await getStockAnalysis(stock);
      setAnalysis(result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedStock) fetchAnalysis(selectedStock);
  }, [selectedStock?.id]);

  const currentLiveStock = stocks.find(s => s.id === selectedStock?.id) || selectedStock;

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden">
      <Watchlist stocks={stocks} onStockClick={setSelectedStock} />
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/40">
        {!currentLiveStock ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <i className="fas fa-brain text-7xl mb-6 text-blue-500/20 animate-pulse-soft"></i>
            <h2 className="text-2xl font-black font-heading mb-2">SELECT ASSET FOR AI SCAN</h2>
            <p className="text-sm font-medium max-w-xs text-center uppercase tracking-widest">Initiate deep neural analysis on market fundamentals.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-5xl font-black font-heading tracking-tightest uppercase">{currentLiveStock.symbol}</h2>
                  <Badge text={currentLiveStock.sector} color="bg-blue-600/20 text-blue-400 border border-blue-500/30" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">{currentLiveStock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black font-mono tracking-tighter">₹{currentLiveStock.price.toFixed(2)}</p>
                <div className="flex items-center justify-end gap-2">
                   <p className={`text-sm font-bold ${currentLiveStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {currentLiveStock.change >= 0 ? '▲' : '▼'} {currentLiveStock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Day Range', val: `₹${currentLiveStock.dayLow} - ₹${currentLiveStock.dayHigh}` },
                 { label: '52W Range', val: `₹${currentLiveStock.yearLow} - ₹${currentLiveStock.yearHigh}` },
                 { label: 'Market Cap', val: currentLiveStock.marketCap },
                 { label: 'PE Ratio', val: currentLiveStock.peRatio?.toFixed(1) || '---' }
               ].map(m => (
                 <div key={m.label} className="glass-card p-4 rounded-xl border-white/5">
                   <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{m.label}</p>
                   <p className="text-sm font-black">{m.val}</p>
                 </div>
               ))}
            </div>

            <div className="glass-card p-8 rounded-3xl border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                 <i className="fas fa-chart-line text-[120px]"></i>
               </div>
               <InteractiveChart 
                data={currentLiveStock.history} 
                symbol={currentLiveStock.symbol} 
                color={currentLiveStock.change >= 0 ? COLORS.green : COLORS.red} 
                savedTrendlines={savedTrendlines}
                onSaveTrendline={onSaveTrendline}
                onDeleteTrendline={onDeleteTrendline}
               />
            </div>

            {/* Company Profile Section */}
            <div className="glass-card p-8 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                 <i className="fas fa-building text-blue-500"></i>
                 <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 font-heading">Company Profile</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {currentLiveStock.description || "Detailed profile data being synthesized from market nodes..."}
                  </p>
                  <div className="flex gap-4">
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Primary Sector</p>
                      <p className="text-[10px] font-bold text-gray-300">{currentLiveStock.sector}</p>
                    </div>
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Asset Class</p>
                      <p className="text-[10px] font-bold text-gray-300">Equity (Large Cap)</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Market Cap</p>
                      <p className="text-lg font-black">{currentLiveStock.marketCap}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">P/E Ratio (TTM)</p>
                      <p className="text-lg font-black">{currentLiveStock.peRatio?.toFixed(1) || '---'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">24h Vol</p>
                      <p className="text-lg font-black">{currentLiveStock.volume || '---'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Symbol Link</p>
                      <p className="text-lg font-black text-blue-500 cursor-pointer hover:underline uppercase">{currentLiveStock.symbol}.NS</p>
                   </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mb-6"></div>
                <p className="text-xs font-black uppercase tracking-widest animate-pulse">RYAION Neural Core Analysing {currentLiveStock.symbol}...</p>
              </div>
            ) : analysis && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="glass-card p-8 rounded-3xl border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3 mb-6">
                       <i className="fas fa-robot text-blue-500"></i>
                       <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">GenAI Strategic Summary</h4>
                    </div>
                    <p className="text-lg font-medium leading-relaxed italic text-gray-200">"{analysis.summary}"</p>
                    <div className="mt-8 flex gap-4">
                       <div className="flex-1 p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                          <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-3">Bullish Factors</p>
                          <ul className="space-y-2">
                             {analysis.pros.map((p, i) => <li key={i} className="text-[11px] text-gray-400 font-medium flex gap-2"><span>•</span>{p}</li>)}
                          </ul>
                       </div>
                       <div className="flex-1 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3">Bearish Risks</p>
                          <ul className="space-y-2">
                             {analysis.cons.map((c, i) => <li key={i} className="text-[11px] text-gray-400 font-medium flex gap-2"><span>•</span>{c}</li>)}
                          </ul>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass-card p-8 rounded-3xl text-center border-t-4 border-t-purple-500">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Neural Verdict</p>
                    <h4 className={`text-5xl font-black font-heading uppercase mb-4 ${analysis.verdict === 'Buy' ? 'text-green-400' : 'text-purple-400'}`}>
                      {analysis.verdict}
                    </h4>
                    <div className="py-3 px-6 bg-white/5 rounded-xl inline-block mb-6">
                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Target Zone</p>
                       <p className="text-xl font-black">{analysis.targetPrice}</p>
                    </div>
                    <div className="flex justify-between items-center text-left pt-6 border-t border-white/5">
                       <div>
                         <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Risk Meter</p>
                         <p className={`text-xs font-black ${analysis.riskLevel === 'High' ? 'text-red-400' : 'text-green-400'}`}>{analysis.riskLevel}</p>
                       </div>
                       <button className="bg-white text-black font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                         EXECUTE
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PortfolioPage = ({ stocks, transactions, onAddTransaction, onRemoveTransaction }: { stocks: Stock[], transactions: Transaction[], onAddTransaction: (t: Omit<Transaction, 'id'>) => void, onRemoveTransaction: (id: string) => void }) => {
  const [form, setForm] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' as 'BUY' | 'SELL' });
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<'DASHBOARD' | 'HISTORY'>('DASHBOARD');

  const stats = useMemo(() => {
    const currentHoldings: Record<string, Holding> = {};
    let realizedPL = 0;
    
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(t => {
      if (!currentHoldings[t.stockId]) currentHoldings[t.stockId] = { stockId: t.stockId, symbol: t.symbol, quantity: 0, avgBuyPrice: 0 };
      const h = currentHoldings[t.stockId];
      if (t.type === 'BUY') {
        const totalCost = (h.quantity * h.avgBuyPrice) + (t.quantity * t.price);
        h.quantity += t.quantity;
        h.avgBuyPrice = totalCost / h.quantity;
      } else {
        realizedPL += (t.price - h.avgBuyPrice) * t.quantity;
        h.quantity -= t.quantity;
        if (h.quantity <= 0) { h.quantity = 0; h.avgBuyPrice = 0; }
      }
    });

    let unrealizedPL = 0;
    let currentVal = 0;
    let investedVal = 0;
    const active = Object.values(currentHoldings).filter(h => h.quantity > 0);
    
    const assetAllocationData: any[] = [];
    const sectorAllocationMap: Record<string, number> = {};

    active.forEach(h => {
      const stock = stocks.find(s => s.id === h.stockId);
      const live = stock?.price || h.avgBuyPrice;
      const holdingValue = h.quantity * live;
      
      investedVal += h.quantity * h.avgBuyPrice;
      currentVal += holdingValue;
      unrealizedPL += (live - h.avgBuyPrice) * h.quantity;

      assetAllocationData.push({ name: h.symbol, value: holdingValue });
      
      const sector = stock?.sector || 'Unknown';
      sectorAllocationMap[sector] = (sectorAllocationMap[sector] || 0) + holdingValue;
    });

    const sectorAllocationData = Object.entries(sectorAllocationMap).map(([name, value]) => ({ name, value }));

    return { active, realizedPL, unrealizedPL, investedVal, currentVal, assetAllocationData, sectorAllocationData };
  }, [transactions, stocks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = stocks.find(s => s.symbol === form.symbol.toUpperCase());
    if (!stock) return alert('Invalid Ticker');
    onAddTransaction({ ...form, stockId: stock.id, symbol: stock.symbol, quantity: Number(form.quantity), price: Number(form.price), date: new Date().toISOString() });
    setForm({ ...form, symbol: '', quantity: '', price: '' });
    setShowAdd(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black mb-4 uppercase font-heading tracking-tightest">PRIVATE VAULT</h2>
          <div className="flex gap-4">
             {['DASHBOARD', 'HISTORY'].map(v => (
               <button 
                key={v}
                onClick={() => setView(v as any)}
                className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${view === v ? 'border-blue-500 text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}
               >
                 {v}
               </button>
             ))}
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-[11px] uppercase tracking-widest"
        >
          {showAdd ? 'CANCEL ENTRY' : 'NEW TRANSACTION'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-[32px] mb-12 animate-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Type</label>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  <button type="button" onClick={() => setForm({...form, type: 'BUY'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black ${form.type === 'BUY' ? 'bg-green-500 text-white' : 'text-gray-600'}`}>BUY</button>
                  <button type="button" onClick={() => setForm({...form, type: 'SELL'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black ${form.type === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-600'}`}>SELL</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Ticker</label>
                <input placeholder="SYMBOL" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl outline-none focus:border-blue-500 transition-all font-black uppercase text-sm" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Qty</label>
                <input type="number" placeholder="0" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl outline-none focus:border-blue-500 transition-all font-black text-sm" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Price</label>
                <input type="number" step="0.01" placeholder="0.00" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl outline-none focus:border-blue-500 transition-all font-black text-sm" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-white text-black font-black p-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[11px] uppercase tracking-widest">COMMIT LOG</button>
              </div>
           </div>
        </form>
      )}

      {view === 'DASHBOARD' ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="glass-card p-8 rounded-3xl border-t-2 border-t-blue-500">
               <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">Portfolio Value</p>
               <h3 className="text-3xl font-black font-mono">₹{stats.currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
             </div>
             <div className="glass-card p-8 rounded-3xl border-t-2 border-t-green-500">
               <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">Unrealized Returns</p>
               <h3 className={`text-3xl font-black font-mono ${stats.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                 {stats.unrealizedPL >= 0 ? '+' : ''}₹{Math.abs(stats.unrealizedPL).toLocaleString()}
               </h3>
             </div>
             <div className="glass-card p-8 rounded-3xl border-t-2 border-t-purple-500">
               <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">Realized Profit</p>
               <h3 className={`text-3xl font-black font-mono ${stats.realizedPL >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                 {stats.realizedPL >= 0 ? '+' : ''}₹{Math.abs(stats.realizedPL).toLocaleString()}
               </h3>
             </div>
             <div className="glass-card p-8 rounded-3xl border-t-2 border-t-white/10">
               <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">Total Capital</p>
               <h3 className="text-3xl font-black font-mono text-gray-400">₹{stats.investedVal.toLocaleString()}</h3>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="glass-card p-8 rounded-[32px] border border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-6">Asset Allocation</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.assetAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.assetAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0d1122', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val: number) => `₹${val.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[32px] border border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-6">Sector Diversification</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.sectorAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.sectorAllocationMap ? [] : stats.sectorAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0d1122', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val: number) => `₹${val.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[32px] overflow-hidden border border-white/5">
             <div className="p-6 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest">Active Inventory</h4>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             </div>
             <table className="w-full text-left">
               <thead className="bg-black/20 text-gray-600">
                 <tr>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest">Instrument</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Qty</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest">Avg Cost</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest">Market Price</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Returns</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {stats.active.length === 0 ? (
                   <tr><td colSpan={5} className="p-20 text-center text-gray-600 font-bold uppercase tracking-widest italic opacity-20 text-xs">No active positions detected</td></tr>
                 ) : stats.active.map(h => {
                   const stock = stocks.find(s => s.id === h.stockId);
                   const live = stock?.price || h.avgBuyPrice;
                   const pl = (live - h.avgBuyPrice) * h.quantity;
                   return (
                     <tr key={h.stockId} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="p-6">
                         <p className="font-black text-lg group-hover:text-blue-400 transition-all font-heading uppercase">{h.symbol}</p>
                         <p className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">{stock?.name}</p>
                       </td>
                       <td className="p-6 text-center font-bold">{h.quantity}</td>
                       <td className="p-6 font-mono text-gray-400">₹{h.avgBuyPrice.toFixed(2)}</td>
                       <td className="p-6 font-mono font-bold">₹{live.toFixed(2)}</td>
                       <td className="p-6 text-right">
                         <p className={`font-black font-mono ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {pl >= 0 ? '+' : ''}₹{Math.abs(pl).toLocaleString()}
                         </p>
                         <p className={`text-[9px] font-black ${pl >= 0 ? 'text-green-500/60' : 'text-red-500/60'}`}>
                           {((pl/(h.avgBuyPrice*h.quantity))*100).toFixed(2)}%
                         </p>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-[32px] overflow-hidden border border-white/5 animate-in fade-in duration-300">
           <div className="p-6 bg-white/[0.02] border-b border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest">Audit Trail</h4>
           </div>
           <table className="w-full text-left">
              <thead className="bg-black/20 text-gray-600">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Action</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Ticker</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Execution</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Value</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center text-gray-600 font-bold uppercase tracking-widest italic opacity-20 text-xs">No records in the ledger</td></tr>
                ) : transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6 text-[10px] font-bold text-gray-600">{new Date(t.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="p-6">
                       <span className={`px-2 py-1 rounded text-[9px] font-black ${t.type === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{t.type}</span>
                    </td>
                    <td className="p-6 font-black font-heading text-sm">{t.symbol}</td>
                    <td className="p-6 text-xs text-gray-500 font-medium">{t.quantity} SHARES @ ₹{t.price.toFixed(2)}</td>
                    <td className="p-6 text-right font-mono font-bold">₹{(t.quantity * t.price).toLocaleString()}</td>
                    <td className="p-6 text-right">
                       <button onClick={() => onRemoveTransaction(t.id)} className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                         <i className="fas fa-trash-alt text-xs"></i>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

// --- Education, Compare, and Shared Logic ---

const EducationPage = () => (
  <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
    <div className="mb-14">
      <h2 className="text-4xl font-black mb-4 uppercase font-heading tracking-tightest">KNOWLEDGE HUB</h2>
      <p className="text-gray-500 font-medium">Master the financial grid with Zero Jargon modules.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {EDUCATION_MODULES.map(module => (
        <div key={module.id} className="group cursor-pointer">
          <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 border border-white/5 glass-card">
            <img src={module.videoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" alt={module.title} />
            <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay group-hover:bg-transparent transition-all"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                 <i className="fas fa-play ml-1"></i>
               </div>
            </div>
          </div>
          <h3 className="text-lg font-black font-heading mb-2 group-hover:text-blue-400 transition-colors uppercase">{module.title}</h3>
          <p className="text-gray-500 text-xs font-medium leading-relaxed uppercase tracking-tight">{module.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const ComparePage = ({ stocks }: { stocks: Stock[] }) => {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState('');

  const toggle = (id: string) => {
    if (ids.includes(id)) setIds(ids.filter(i => i !== id));
    else if (ids.length < 3) setIds([...ids, id]);
  };

  const run = async () => {
    setLoading(true);
    try { setRes(await compareStocks(stocks.filter(s => ids.includes(s.id)))); }
    catch { setRes("NEURAL ENGINE FAULT. RETRY."); }
    finally { setLoading(false); }
  };

  const sel = stocks.filter(s => ids.includes(s.id));

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-14 text-center">
        <h2 className="text-4xl font-black mb-4 uppercase font-heading tracking-tightest">ASSET BATTLEGROUND</h2>
        <p className="text-gray-500 font-medium">Compare fundamentals side-by-side using AI logic.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {stocks.map(s => (
          <button key={s.id} onClick={() => toggle(s.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${ids.includes(s.id) ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}>
            {s.symbol}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
        {[0, 1, 2].map(idx => {
          const s = sel[idx];
          return s ? (
            <div key={s.id} className="glass-card p-8 rounded-[40px] border-t-2 border-t-blue-500 animate-in zoom-in duration-300">
               <h3 className="text-3xl font-black font-heading uppercase mb-2">{s.symbol}</h3>
               <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-8">{s.sector}</p>
               <div className="space-y-4">
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Valuation</span>
                   <span className="text-sm font-black">₹{s.price.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Market Cap</span>
                   <span className="text-sm font-black">{s.marketCap}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">PE Ratio</span>
                   <span className="text-sm font-black">{s.peRatio || '---'}</span>
                 </div>
               </div>
            </div>
          ) : (
            <div key={idx} className="glass-card p-8 rounded-[40px] border-dashed border-2 border-white/5 flex items-center justify-center text-gray-700 italic font-bold uppercase text-[10px] tracking-widest">Slot {idx+1} Available</div>
          )
        })}
      </div>

      <div className="text-center">
        <button onClick={run} disabled={ids.length < 2 || loading} className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${ids.length < 2 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-2xl shadow-blue-500/10'}`}>
          {loading ? 'CALCULATING NEURAL DELTA...' : 'INITIATE COMPARISON'}
        </button>
      </div>

      {res && (
        <div className="mt-16 glass-card p-10 rounded-[48px] border-white/5 prose prose-invert max-w-none">
          <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6">Strategic AI Conclusion</h4>
          <div className="text-gray-300 whitespace-pre-line leading-relaxed italic text-lg">{res}</div>
        </div>
      )}
    </div>
  );
};

// --- App Entry ---

export default function App() {
  const [activeTab, setActiveTab] = useState('Market');
  const [lang, setLang] = useState<AppLanguage>('English');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(true);
  
  const [stocks, setStocks] = useState<Stock[]>(() => {
    return INDIAN_STOCKS.map(s => {
      const hist = [...Array(100)].map((_, i) => ({
        time: `${10 - Math.floor((100 - i)/10)}:${(i%10)*6}:00`,
        value: s.price * (0.9 + Math.random() * 0.2)
      }));
      return { ...s, history: hist };
    });
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ryaion_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedTrendlines, setSavedTrendlines] = useState<SavedTrendline[]>(() => {
    const saved = localStorage.getItem('ryaion_trendlines');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('ryaion_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('ryaion_trendlines', JSON.stringify(savedTrendlines)); }, [savedTrendlines]);

  useEffect(() => {
    const itv = setInterval(() => {
      setStocks(curr => curr.map(s => {
        const cp = (Math.random() * 0.4 - 0.2);
        const np = s.price * (1 + cp / 100);
        const time = new Date().toLocaleTimeString([], { hour12: false });
        return { ...s, price: np, history: [...s.history, { time, value: np }].slice(-100), changePercent: s.changePercent + cp };
      }));
    }, 10000);
    return () => clearInterval(itv);
  }, []);

  const handleSaveTrendline = (line: Omit<SavedTrendline, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setSavedTrendlines([...savedTrendlines, { ...line, id }]);
  };

  const handleDeleteTrendline = (id: string) => {
    setSavedTrendlines(savedTrendlines.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen pb-16 flex flex-col">
      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card max-sm p-10 rounded-[48px] text-center border-t-2 border-t-blue-500 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <i className="fas fa-fingerprint text-2xl text-blue-500"></i>
            </div>
            <h2 className="text-xl font-black font-heading mb-4 uppercase tracking-tight">PRIVACY PROTOCOL</h2>
            <p className="text-gray-500 text-xs font-medium mb-8 leading-relaxed uppercase">Neural trackers are used only for session persistence. No data leaks beyond this local grid.</p>
            <button onClick={() => setShowPrivacy(false)} className="w-full bg-white text-black hover:bg-blue-600 hover:text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">ACKNOWLEDGE</button>
          </div>
        </div>
      )}

      <NewsTicker />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang} />

      <main className="flex-1">
        {activeTab === 'Market' && <MarketPage stocks={stocks} onStockClick={(s) => { setSelectedStock(s); setActiveTab('Advisor'); }} />}
        {activeTab === 'Advisor' && (
          <AdvisorPage 
            stocks={stocks} 
            selectedStock={selectedStock} 
            setSelectedStock={setSelectedStock}
            savedTrendlines={savedTrendlines}
            onSaveTrendline={handleSaveTrendline}
            onDeleteTrendline={handleDeleteTrendline}
          />
        )}
        {activeTab === 'Compare' && <ComparePage stocks={stocks} />}
        {activeTab === 'Learn' && <EducationPage />}
        {activeTab === 'Portfolio' && (
          <PortfolioPage stocks={stocks} transactions={transactions} onAddTransaction={(t) => setTransactions([...transactions, { ...t, id: Math.random().toString(36).substr(2,9) }])} onRemoveTransaction={(id) => setTransactions(transactions.filter(t => t.id !== id))} />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 py-3 px-8 glass-card border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-gray-600 z-40 bg-black/80">
        <div>RYAION NEURAL GRID v2.5.0</div>
        <div className="max-w-xl text-center hidden md:block opacity-30 italic">TRADING INVOLVES RISK. AI ADVICE IS FOR SIMULATION PURPOSES. RYAION IS NOT RESPONSIBLE FOR CAPITAL DECAY.</div>
        <div className="flex gap-4">
          <i className="fab fa-discord hover:text-white cursor-pointer transition-all"></i>
          <i className="fab fa-github hover:text-white cursor-pointer transition-all"></i>
        </div>
      </footer>
    </div>
  );
}
