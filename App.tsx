import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Brush, ReferenceLine, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Stock, AIAnalysis, AppLanguage, Trendline, Transaction, Holding, SavedTrendline, NewsItem, PriceAlert } from './types';
import { INDIAN_STOCKS, EDUCATION_MODULES } from './constants';
import { getStockAnalysis, compareStocks, getMarketNews } from './services/geminiService';

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substring(2, 11);

// --- Global Theme Colors ---
const COLORS = {
  sangria: '#6E1916',
  sangriaBright: '#A42420',
  sangriaDeep: '#3D0A08',
  green: '#00FFC2',
  red: '#FF4D4D',
  gold: '#E2B808',
  bg: '#0D0202',
  card: '#1a0505'
};

const CHART_COLORS = ['#6E1916', '#A42420', '#C9302C', '#7D1614', '#E2B808', '#FF4D4D', '#FF7E7E'];

// --- Custom Components ---

const Logo = () => (
  <div className="relative w-11 h-11 group cursor-pointer" role="img" aria-label="Ryaion Logo">
    <div className="absolute -inset-1 bg-gradient-to-r from-[#A42420] to-[#6E1916] rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
    <div className="relative w-full h-full bg-[#0D0202] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 transition-transform duration-500 group-hover:scale-110" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 22V12M12 12L20 7M12 12L4 7" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <path 
          d="M7.5 14.5C7.5 14.5 8.5 10 11.5 11C14.5 12 14.5 9 17 8.5" 
          stroke="#A42420" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_6px_rgba(164,36,32,0.9)]"
        />
        <circle cx="17" cy="8.5" r="1.2" fill="#00FFC2" className="animate-pulse" />
        <defs>
          <linearGradient id="logo-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A42420" />
            <stop offset="1" stopColor="#6E1916" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

const NewsTicker = () => (
  <div className="bg-[#6E1916]/10 border-y border-[#6E1916]/15 py-2.5 overflow-hidden whitespace-nowrap text-[10px] font-black tracking-[0.2em] uppercase text-[#A42420]">
    <div className="animate-[marquee_40s_linear_infinite] inline-block">
      <span className="mx-12">NIFTY 50 SURPASSES RESISTANCE AT 23,500</span>
      <span className="mx-12">RELIANCE EXPANDS GREEN ENERGY GRID</span>
      <span className="mx-12">FINTECH STARTUPS SEE 40% SURGE IN GENZ ADOPTION</span>
      <span className="mx-12">RYAION AI: BULLISH CROSSOVER DETECTED IN IT SECTOR</span>
      <span className="mx-12">GLOBAL MARKETS STABILIZE AS INFLATION COOLS</span>
    </div>
    <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  </div>
);

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
}

const Navbar = ({ activeTab, setActiveTab, lang, setLang }: NavbarProps) => (
  <>
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-5 glass-card border-b border-white/[0.03]">
      <div className="flex items-center gap-3 md:gap-5">
        <Logo />
        <h1 className="text-xl md:text-2xl font-black tracking-tightest gradient-text font-heading uppercase select-none">RYAION</h1>
      </div>
      
      <div className="hidden md:flex items-center gap-10 ml-20 flex-1 text-[10px] font-black uppercase tracking-[0.25em]">
        {['Market', 'News', 'Learn', 'Advisor', 'Compare', 'Portfolio'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`transition-all duration-300 hover:text-white relative py-1 ${activeTab === tab ? 'text-white tab-active' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setLang('English')}
            className={`px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black transition-all ${lang === 'English' ? 'bg-[#6E1916] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >EN</button>
          <button 
            onClick={() => setLang('Hindi')}
            className={`px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black transition-all ${lang === 'Hindi' ? 'bg-[#6E1916] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >HI</button>
        </div>
        <button className="hidden sm:block bg-white text-black hover:bg-[#A42420] hover:text-white text-[10px] px-6 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-black/20">
          Terminal
        </button>
      </div>
    </nav>

    {/* Mobile Bottom Navigation */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] glass-card border-t border-white/5 px-2 py-3 flex justify-around items-center">
      {[
        { id: 'Market', icon: 'fa-chart-line' },
        { id: 'News', icon: 'fa-newspaper' },
        { id: 'Advisor', icon: 'fa-robot' },
        { id: 'Portfolio', icon: 'fa-wallet' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#FF7E7E]' : 'text-gray-500'}`}
        >
          <i className={`fas ${tab.icon} text-lg`}></i>
          <span className="text-[8px] font-black uppercase tracking-widest">{tab.id}</span>
        </button>
      ))}
      <button
        onClick={() => setActiveTab('Learn')}
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'Learn' ? 'text-[#FF7E7E]' : 'text-gray-500'}`}
      >
        <i className="fas fa-graduation-cap text-lg"></i>
        <span className="text-[8px] font-black uppercase tracking-widest">Learn</span>
      </button>
    </div>
  </>
);

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
  const [selectedTrendlineId, setSelectedTrendlineId] = useState<string | null>(null);

  const handleChartClick = (state: any) => {
    if (!drawingTrendline || !state || !state.activeLabel) return;
    
    const x = state.activeLabel;
    const y = state.activePayload?.[0]?.value || 0;

    if (clickCount === 0) {
      setTrendline({ x1: x, y1: y, x2: x, y2: y });
      setClickCount(1);
    } else if (clickCount === 1) {
      setTrendline(prev => prev ? ({ ...prev, x2: x, y2: y }) : null);
      setClickCount(2); 
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (range === '1D') return data.slice(-10);
    if (range === '1W') return data.slice(-30);
    return data;
  }, [data, range]);

  const activeSavedTrendlines = savedTrendlines.filter(t => t.symbol === symbol);
  const selectedTrendline = activeSavedTrendlines.find(t => t.id === selectedTrendlineId);

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

  const handleLineClick = (id: string, e: any) => {
    e.stopPropagation();
    setSelectedTrendlineId(id === selectedTrendlineId ? null : id);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div className="flex gap-1 md:gap-2 bg-black/40 p-1 md:p-1.5 rounded-xl border border-white/5 overflow-x-auto max-w-full">
          {['1D', '1W', '1M', 'ALL'].map(r => (
            <button 
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black tracking-tighter transition-all whitespace-nowrap ${range === r ? 'bg-[#6E1916] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {r}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {clickCount === 2 && trendline ? (
            <div className="flex items-center gap-2 md:gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
              <input 
                type="text" 
                placeholder="LABEL" 
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-[10px] font-black text-white outline-none focus:border-[#A42420] transition-all w-24 md:w-40 uppercase tracking-widest"
                value={trendlineLabel}
                onChange={(e) => setTrendlineLabel(e.target.value)}
              />
              <button onClick={handleSave} className="btn-sangria px-3 py-1.5 md:px-5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest">SAVE</button>
              <button onClick={handleCancel} className="bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-1.5 md:px-5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/5">DISCARD</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setDrawingTrendline(!drawingTrendline); if(!drawingTrendline) setTrendline(null); setSelectedTrendlineId(null); }}
                className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black flex items-center gap-2 md:gap-3 border transition-all tracking-widest ${drawingTrendline ? 'bg-[#A42420]/20 border-[#A42420] text-[#A42420]' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'}`}
              >
                <i className="fas fa-pen-nib"></i>
                <span className="hidden sm:inline">{drawingTrendline ? 'ACTIVE PLOT' : 'DRAW TREND'}</span>
                <span className="sm:hidden">{drawingTrendline ? 'ACTIVE' : 'DRAW'}</span>
              </button>
              
              {selectedTrendlineId && (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <span className="text-[9px] font-black text-[#FF7E7E] uppercase">{selectedTrendline?.label}</span>
                  <button 
                    onClick={() => { onDeleteTrendline(selectedTrendlineId); setSelectedTrendlineId(null); }}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
                  >
                    DELETE
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-[250px] md:h-[340px] w-full relative group">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={filteredData} onClick={handleChartClick}>
            <defs>
              <linearGradient id={`color-main-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis dataKey="time" stroke="#374151" fontSize={8} minTickGap={30} tickLine={false} axisLine={false} tick={{fontWeight: 'bold'}} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ background: '#120202', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}
              cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1.5 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#color-main-${symbol})`} 
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1500}
            />
            {trendline && (
              <ReferenceLine 
                segment={[{ x: trendline.x1, y: trendline.y1 }, { x: trendline.x2, y: trendline.y2 }]} 
                stroke="#E2B808" 
                strokeWidth={2} 
                strokeDasharray="6 6"
              />
            )}
            {activeSavedTrendlines.map(tl => (
              <ReferenceLine 
                key={tl.id}
                segment={[{ x: tl.x1, y: tl.y1 }, { x: tl.x2, y: tl.y2 }]} 
                stroke={tl.id === selectedTrendlineId ? '#00FFC2' : '#A42420'} 
                strokeWidth={tl.id === selectedTrendlineId ? 3 : 1.5} 
                strokeDasharray={tl.id === selectedTrendlineId ? "0" : "4 4"}
                className="cursor-pointer"
                label={{ 
                  position: 'top', 
                  value: tl.label, 
                  fill: tl.id === selectedTrendlineId ? '#00FFC2' : '#FF7E7E', 
                  fontSize: 7, 
                  fontWeight: '900', 
                  letterSpacing: '0.1em',
                  className: 'cursor-pointer'
                }}
                onClick={(e: any) => handleLineClick(tl.id, e)}
              />
            ))}
            <Brush dataKey="time" height={20} stroke="#6E1916" fill="#0D0202" travellerWidth={10} strokeWidth={1} />
          </AreaChart>
        </ResponsiveContainer>
        
        {activeSavedTrendlines.length > 0 && !drawingTrendline && !selectedTrendlineId && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[7px] md:text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Click trendlines to manage</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Watchlist = ({ stocks, onStockClick, currentId }: { stocks: Stock[], onStockClick: (s: Stock) => void, currentId?: string }) => (
  <div className="w-full lg:w-80 h-full border-r border-white/[0.03] bg-black/30 flex flex-col">
    <div className="p-4 md:p-6 border-b border-white/[0.03] flex justify-between items-center">
      <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Surveillance</h3>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {stocks.map(s => (
        <div 
          key={s.id} 
          onClick={() => onStockClick(s)}
          className={`p-4 md:p-6 border-b border-white/[0.02] cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ${currentId === s.id ? 'bg-[#6E1916]/10' : ''}`}
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${currentId === s.id ? 'bg-[#A42420]' : 'bg-transparent group-hover:bg-[#6E1916]'}`}></div>
          <div>
            <p className={`font-black text-xs md:text-sm transition-colors tracking-tight uppercase font-heading ${currentId === s.id ? 'text-[#FF7E7E]' : 'group-hover:text-[#FF7E7E]'}`}>{s.symbol}</p>
            <p className="text-[8px] md:text-[9px] text-gray-600 uppercase font-bold tracking-wider">{s.sector}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-xs md:text-sm font-mono tracking-tighter">₹{s.price.toFixed(2)}</p>
            <p className={`text-[8px] md:text-[9px] font-black tracking-widest ${s.change >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
              {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.changePercent).toFixed(2)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Page Components ---

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMarketNews();
      setNews(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-700 mb-20 md:mb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-16 gap-6 md:gap-8">
        <div>
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-6 uppercase font-heading tracking-tightest leading-none">INTEL STREAM</h2>
          <p className="text-gray-500 text-sm md:text-lg font-medium tracking-wide max-w-2xl leading-relaxed uppercase tracking-[0.2em] opacity-40">AI-Synthesized Global Grounding for Indian Markets.</p>
        </div>
        <button 
          onClick={fetchNews}
          disabled={loading}
          className="btn-sangria w-full md:w-auto px-6 md:px-10 py-3 md:py-5 rounded-[16px] md:rounded-[24px] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50"
        >
          {loading ? 'CALIBRATING...' : 'SYNC NEURAL FEED'}
        </button>
      </div>

      {loading ? (
        <div className="h-64 md:h-96 flex flex-col items-center justify-center space-y-6 md:space-y-8">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#6E1916] border-t-[#00FFC2] rounded-full animate-spin"></div>
          <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#FF7E7E] animate-pulse text-center">Routing through Global Data Nodes...</p>
        </div>
      ) : news && (
        <div className="glass-card p-6 md:p-10 rounded-[32px] md:rounded-[48px] border-l-8 border-l-[#6E1916] shadow-2xl">
          <div className="flex items-center gap-4 mb-6 md:mb-10">
            <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-[#FF7E7E]">Market Synopsis</h3>
          </div>
          <div className="text-base md:text-xl text-gray-200 whitespace-pre-line leading-relaxed italic font-medium">
            {news.text}
          </div>
          {news.sources.length > 0 && (
            <div className="mt-8 md:mt-16 pt-6 md:pt-10 border-t border-white/[0.05]">
              <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-6 md:mb-8">Verified Sources</h4>
              <div className="flex flex-wrap gap-2 md:gap-4">
                {news.sources.map((src, idx) => (
                  <a key={`${src.uri}-${idx}`} href={src.uri} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-[#6E1916]/20 border border-white/10 px-3 py-2 md:px-5 md:py-3 rounded-xl transition-all">
                    <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{src.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MarketPage = ({ stocks, onStockClick, selectedStock }: { stocks: Stock[], onStockClick: (s: Stock) => void, selectedStock: Stock | null }) => (
  <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] animate-in fade-in duration-700 overflow-hidden mb-20 md:mb-0">
    <div className="hidden lg:block">
      <Watchlist stocks={stocks} onStockClick={onStockClick} currentId={selectedStock?.id} />
    </div>
    
    <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#0D0202]/50">
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <h2 className="text-3xl md:text-5xl font-black mb-1 md:mb-3 font-heading tracking-tightest leading-none">MARKET TERMINAL</h2>
      </div>

      {selectedStock && (
        <div className="mb-8 md:mb-12 glass-card p-6 md:p-10 rounded-[24px] md:rounded-[48px] border-l-8 border-l-[#A42420] animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <i className="fas fa-terminal text-6xl"></i>
          </div>
          <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#FF7E7E] mb-3 md:mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7E7E] animate-pulse"></span>
            Focus Intelligence Dossier: {selectedStock.symbol}
          </h3>
          <p className="text-sm md:text-lg text-gray-300 leading-relaxed font-medium">
            {selectedStock.description || "Intelligence briefing currently encrypted or unavailable in this sector."}
          </p>
        </div>
      )}

      {/* Watchlist horizontal for mobile */}
      <div className="lg:hidden mb-8 overflow-x-auto pb-4 flex gap-4 no-scrollbar">
        {stocks.map(stock => (
          <div 
            key={stock.id} 
            onClick={() => onStockClick(stock)}
            className={`flex-shrink-0 w-48 glass-card p-4 rounded-[20px] border-l-4 transition-all ${selectedStock?.id === stock.id ? 'border-l-[#A42420] bg-[#A42420]/5' : 'border-l-transparent'}`}
          >
            <p className="font-black text-xs font-heading uppercase tracking-widest mb-1">{stock.symbol}</p>
            <p className="text-sm font-black font-mono mb-2">₹{stock.price.toFixed(2)}</p>
            <p className={`text-[8px] font-black ${stock.change >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
              {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {stocks.slice(0, 6).map(stock => (
          <div key={stock.id} onClick={() => onStockClick(stock)} className="glass-card p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-l-4 border-l-[#6E1916] group cursor-pointer relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
              <div>
                <h3 className="text-lg md:text-2xl font-black font-heading group-hover:text-[#FF7E7E] uppercase tracking-tight">{stock.symbol}</h3>
                <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-[0.1em]">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-black font-mono">₹{stock.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-20 md:h-24 w-full mt-2 md:mt-4 relative z-10">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={stock.history.slice(-20)}>
                   <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={stock.change >= 0 ? COLORS.green : COLORS.red} 
                    fill={stock.change >= 0 ? COLORS.green : COLORS.red} 
                    fillOpacity={0.1} 
                    strokeWidth={2}
                    isAnimationActive={false}
                   />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface AdvisorPageProps {
  stocks: Stock[];
  selectedStock: Stock | null;
  setSelectedStock: (stock: Stock | null) => void;
  savedTrendlines: SavedTrendline[];
  onSaveTrendline: (line: Omit<SavedTrendline, 'id'>) => void;
  onDeleteTrendline: (id: string) => void;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'isActive' | 'isTriggered' | 'createdAt'>) => void;
}

const AdvisorPage = ({ 
  stocks, 
  selectedStock, 
  setSelectedStock,
  savedTrendlines,
  onSaveTrendline,
  onDeleteTrendline,
  onAddAlert
}: AdvisorPageProps) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertForm, setAlertForm] = useState({ price: '', condition: 'ABOVE' as 'ABOVE' | 'BELOW' });

  const fetchAnalysis = useCallback(async (stock: Stock) => {
    setLoading(true);
    try {
      const result = await getStockAnalysis(stock);
      setAnalysis(result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedStock) fetchAnalysis(selectedStock);
  }, [selectedStock, fetchAnalysis]);

  const currentLiveStock = stocks.find(s => s.id === selectedStock?.id) || selectedStock;

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLiveStock || !alertForm.price) return;
    onAddAlert({
      stockId: currentLiveStock.id,
      symbol: currentLiveStock.symbol,
      targetPrice: Number(alertForm.price),
      condition: alertForm.condition
    });
    setAlertForm({ ...alertForm, price: '' });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] overflow-hidden mb-20 md:mb-0">
      <div className="hidden lg:block">
        <Watchlist stocks={stocks} onStockClick={setSelectedStock} currentId={selectedStock?.id} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#0D0202]/60">
        <div className="lg:hidden mb-6 overflow-x-auto pb-4 flex gap-3 no-scrollbar">
           {stocks.map(s => (
             <button
              key={s.id}
              onClick={() => setSelectedStock(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedStock?.id === s.id ? 'bg-[#6E1916] border-[#A42420] text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}
             >
               {s.symbol}
             </button>
           ))}
        </div>

        {!currentLiveStock ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 p-8 text-center">
            <h2 className="text-xl md:text-3xl font-black font-heading uppercase tracking-widest">INITIALIZE NEURAL SCAN</h2>
            <p className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-30">Select an instrument from the grid to begin telemetry.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-4xl md:text-6xl font-black font-heading uppercase leading-none">{currentLiveStock.symbol}</h2>
                <p className="text-[8px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.5em] text-gray-600 uppercase mt-2 md:mt-4">{currentLiveStock.name} | {currentLiveStock.sector}</p>
              </div>
              <div className="text-left md:text-right">
                 <p className="text-2xl md:text-4xl font-black font-mono">₹{currentLiveStock.price.toLocaleString()}</p>
                 <p className={`text-[10px] md:text-sm font-black uppercase tracking-widest mt-1 md:mt-2 ${currentLiveStock.change >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                   {currentLiveStock.change >= 0 ? 'Surge' : 'Entropy'} {Math.abs(currentLiveStock.changePercent).toFixed(2)}%
                 </p>
              </div>
            </div>

            <InteractiveChart 
              data={currentLiveStock.history} 
              symbol={currentLiveStock.symbol} 
              color={currentLiveStock.change >= 0 ? COLORS.green : COLORS.red} 
              savedTrendlines={savedTrendlines}
              onSaveTrendline={onSaveTrendline}
              onDeleteTrendline={onDeleteTrendline}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {loading ? (
                <div className="glass-card p-8 md:p-10 rounded-[24px] md:rounded-[48px] border-l-8 border-l-gray-800 flex items-center justify-center h-48 md:h-64">
                  <p className="animate-pulse text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 text-center">Syncing AI Verdict...</p>
                </div>
              ) : analysis && (
                <div className="glass-card p-8 md:p-10 rounded-[24px] md:rounded-[48px] border-l-8 border-l-[#6E1916]">
                  <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#FF7E7E] mb-4 md:mb-6">AI Terminal Verdict</h3>
                  <h4 className={`text-3xl md:text-5xl font-black mb-4 md:mb-6 ${analysis.verdict === 'Buy' ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>{analysis.verdict}</h4>
                  <p className="text-base md:text-xl italic text-gray-200 leading-relaxed">{analysis.summary}</p>
                </div>
              )}

              <div className="glass-card p-8 md:p-10 rounded-[24px] md:rounded-[48px] border-l-8 border-l-white/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-4 md:mb-6">Neural Alert Radar</h3>
                  <form onSubmit={handleAlertSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-2">
                       <select 
                        value={alertForm.condition} 
                        onChange={e => setAlertForm({...alertForm, condition: e.target.value as any})}
                        className="bg-black/40 border border-white/5 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-[#FF7E7E]"
                       >
                         <option value="ABOVE">ABOVE</option>
                         <option value="BELOW">BELOW</option>
                       </select>
                       <input 
                        type="number" 
                        placeholder="TARGET PRICE" 
                        step="0.1"
                        value={alertForm.price}
                        onChange={e => setAlertForm({...alertForm, price: e.target.value})}
                        className="flex-1 bg-black/40 border border-white/5 px-4 py-2 rounded-xl text-white font-black font-mono text-sm"
                        required
                       />
                    </div>
                    <button type="submit" className="btn-sangria w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase">DEPLOY RADAR</button>
                  </form>
                </div>
              </div>
            </div>

            {/* Prominent Intelligence Dossier Section */}
            <div className="glass-card p-8 md:p-12 rounded-[32px] md:rounded-[64px] border-l-8 border-l-[#A42420] animate-in slide-in-from-bottom-6 duration-700">
               <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-[#FF7E7E] mb-6 md:mb-8 flex items-center gap-4">
                 <i className="fas fa-file-contract text-lg"></i>
                 <span>Company Intelligence Dossier</span>
               </h3>
               <div className="max-w-4xl">
                 <p className="text-lg md:text-2xl text-gray-200 leading-relaxed font-medium italic">
                   {currentLiveStock.description || "Intelligence relays are currently gathering sector data. Check back momentarily."}
                 </p>
                 <div className="mt-8 flex gap-4 opacity-30">
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-[#A42420] to-transparent"></div>
                   <span className="text-[8px] font-black uppercase tracking-[1em]">END OF DATA STREAM</span>
                   <div className="h-[1px] flex-1 bg-gradient-to-l from-[#A42420] to-transparent"></div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface PortfolioPageProps {
  stocks: Stock[];
  transactions: Transaction[];
  alerts: PriceAlert[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onRemoveTransaction: (id: string) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
}

const PortfolioPage = ({ stocks, transactions, alerts, onAddTransaction, onRemoveTransaction, onRemoveAlert, onToggleAlert }: PortfolioPageProps) => {
  const [form, setForm] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' as 'BUY' | 'SELL' });
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<'DASHBOARD' | 'HISTORY' | 'ALERTS'>('DASHBOARD');

  const stats = useMemo(() => {
    const currentHoldings: Record<string, { stockId: string, symbol: string, quantity: number, avgBuyPrice: number }> = {};
    let totalRealizedPL = 0;
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTransactions.forEach(t => {
      if (!currentHoldings[t.stockId]) {
        currentHoldings[t.stockId] = { stockId: t.stockId, symbol: t.symbol, quantity: 0, avgBuyPrice: 0 };
      }
      const h = currentHoldings[t.stockId];
      if (t.type === 'BUY') {
        const totalCost = (h.quantity * h.avgBuyPrice) + (t.quantity * t.price);
        h.quantity += t.quantity;
        h.avgBuyPrice = h.quantity > 0 ? totalCost / h.quantity : 0;
      } else {
        const sellQty = Math.min(t.quantity, h.quantity);
        totalRealizedPL += (t.price - h.avgBuyPrice) * sellQty;
        h.quantity -= sellQty;
        if (h.quantity === 0) h.avgBuyPrice = 0;
      }
    });

    let totalCurrentVal = 0;
    let totalInvestedVal = 0;
    let totalUnrealizedPL = 0;

    const activeHoldings = Object.values(currentHoldings).filter(h => h.quantity > 0);
    
    const holdingsWithLiveStats = activeHoldings.map(h => {
      const stock = stocks.find(s => s.id === h.stockId);
      const livePrice = stock?.price || h.avgBuyPrice;
      const currentVal = h.quantity * livePrice;
      const investedVal = h.quantity * h.avgBuyPrice;
      const unrealizedPL = currentVal - investedVal;
      
      totalCurrentVal += currentVal;
      totalInvestedVal += investedVal;
      totalUnrealizedPL += unrealizedPL;

      return {
        ...h,
        livePrice,
        currentVal,
        investedVal,
        unrealizedPL,
        percentChange: investedVal !== 0 ? (unrealizedPL / investedVal) * 100 : 0
      };
    });

    const assetAllocationData = holdingsWithLiveStats.map(h => ({
      name: h.symbol,
      value: h.currentVal
    }));

    return { 
      active: holdingsWithLiveStats, 
      realizedPL: totalRealizedPL, 
      unrealizedPL: totalUnrealizedPL,
      currentVal: totalCurrentVal, 
      investedVal: totalInvestedVal,
      totalPL: totalRealizedPL + totalUnrealizedPL,
      assetAllocationData 
    };
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
    <div className="p-4 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-700 mb-24 md:mb-0">
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 md:mb-16 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black uppercase font-heading tracking-tightest">THE VAULT</h2>
          <p className="text-[10px] font-black tracking-[0.4em] text-[#FF7E7E]/40 uppercase mt-1 md:mt-2">by rya to you all</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
          <button 
            onClick={() => setView('DASHBOARD')} 
            className={`flex-1 md:flex-none px-4 py-3 md:px-6 md:py-4 rounded-[12px] md:rounded-[20px] font-black text-[9px] md:text-[10px] uppercase border transition-all ${view === 'DASHBOARD' ? 'bg-[#6E1916] border-[#A42420] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            BOARD
          </button>
          <button 
            onClick={() => setView('ALERTS')} 
            className={`flex-1 md:flex-none px-4 py-3 md:px-6 md:py-4 rounded-[12px] md:rounded-[20px] font-black text-[9px] md:text-[10px] uppercase border transition-all ${view === 'ALERTS' ? 'bg-[#6E1916] border-[#A42420] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            ALERTS
          </button>
          <button 
            onClick={() => setView('HISTORY')} 
            className={`flex-1 md:flex-none px-4 py-3 md:px-6 md:py-4 rounded-[12px] md:rounded-[20px] font-black text-[9px] md:text-[10px] uppercase border transition-all ${view === 'HISTORY' ? 'bg-[#6E1916] border-[#A42420] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            LEDGER
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex-1 md:flex-none btn-sangria px-4 py-3 md:px-8 md:py-4 rounded-[12px] md:rounded-[20px] font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em]">
            {showAdd ? 'CANCEL' : 'COMMIT'}
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="glass-card p-6 md:p-10 rounded-[24px] md:rounded-[48px] mb-10 md:mb-16 grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 animate-in zoom-in duration-300">
           <input placeholder="SYMBOL" className="bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl text-white uppercase font-black text-sm" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})} required />
           <input type="number" placeholder="UNITS" className="bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl text-white font-black text-sm" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
           <input type="number" step="0.01" placeholder="PRICE" className="bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl text-white font-black text-sm" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
           <select className="bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl text-white font-black text-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
           </select>
           <button type="submit" className="bg-white text-black font-black p-3 md:p-4 rounded-xl text-sm hover:bg-[#A42420] hover:text-white transition-colors">LOG</button>
        </form>
      )}

      {view === 'DASHBOARD' && (
        <div className="space-y-8 md:space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
             <div className="glass-card p-6 md:p-10 rounded-[24px] md:rounded-[40px] border-t-4 border-t-[#6E1916]">
               <p className="text-gray-600 text-[8px] md:text-[10px] font-black uppercase mb-1 md:mb-2 tracking-widest">Net Assets</p>
               <h3 className="text-lg md:text-4xl font-black font-mono leading-tight">₹{stats.currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
             </div>
             <div className="glass-card p-6 md:p-10 rounded-[24px] md:rounded-[40px] border-t-4 border-t-white/10">
               <p className="text-gray-600 text-[8px] md:text-[10px] font-black uppercase mb-1 md:mb-2 tracking-widest">Invested</p>
               <h3 className="text-lg md:text-4xl font-black font-mono text-gray-400 leading-tight">₹{stats.investedVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
             </div>
             <div className={`glass-card p-6 md:p-10 rounded-[24px] md:rounded-[40px] border-t-4 transition-colors ${stats.unrealizedPL >= 0 ? 'border-t-[#00FFC2]' : 'border-t-[#FF4D4D]'}`}>
               <p className="text-gray-600 text-[8px] md:text-[10px] font-black uppercase mb-1 md:mb-2 tracking-widest">Delta (P/L)</p>
               <h3 className={`text-lg md:text-4xl font-black font-mono leading-tight ${stats.unrealizedPL >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                 {stats.unrealizedPL >= 0 ? '+' : '-'}₹{Math.abs(stats.unrealizedPL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </h3>
             </div>
             <div className={`glass-card p-6 md:p-10 rounded-[24px] md:rounded-[40px] border-t-4 ${stats.realizedPL >= 0 ? 'border-t-[#E2B808]' : 'border-t-[#FF4D4D]'}`}>
               <p className="text-gray-600 text-[8px] md:text-[10px] font-black uppercase mb-1 md:mb-2 tracking-widest">Alpha</p>
               <h3 className={`text-lg md:text-4xl font-black font-mono leading-tight ${stats.realizedPL >= 0 ? 'text-[#E2B808]' : 'text-[#FF4D4D]'}`}>
                 {stats.realizedPL >= 0 ? '+' : '-'}₹{Math.abs(stats.realizedPL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </h3>
             </div>
          </div>
          
          <div className="h-[300px] md:h-[400px] w-full glass-card p-6 md:p-10 rounded-[32px] md:rounded-[48px]">
            <h3 className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 mb-6 md:mb-8 tracking-[0.3em]">Allocation Strategy</h3>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie 
                  data={stats.assetAllocationData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={window.innerWidth < 768 ? 40 : 70} 
                  outerRadius={window.innerWidth < 768 ? 70 : 110} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {stats.assetAllocationData.map((_, index) => (
                    <Cell key={`asset-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#120202', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-[32px] md:rounded-[48px] overflow-x-auto border border-white/5">
             <div className="p-6 md:p-8 bg-white/[0.02] border-b border-white/[0.05]">
                <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Current Positions</h4>
             </div>
             <table className="w-full text-left min-w-[600px] md:min-w-0">
               <thead className="bg-black/40">
                 <tr>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Instrument</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-center">Qty</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Avg Cost</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Market</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-right">Delta</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.03]">
                 {stats.active.length === 0 ? (
                   <tr><td colSpan={5} className="p-16 md:p-24 text-center text-gray-700 font-black uppercase tracking-[0.3em] md:tracking-[0.4em] italic opacity-20 text-[9px] md:text-xs">Zero live positions in the neural grid</td></tr>
                 ) : stats.active.map(h => (
                   <tr key={h.stockId} className="hover:bg-white/[0.03] transition-colors group">
                     <td className="px-6 md:px-8 py-6 md:py-8">
                       <p className="font-black text-sm md:text-xl group-hover:text-[#FF7E7E] transition-all font-heading uppercase tracking-tighter">{h.symbol}</p>
                     </td>
                     <td className="px-6 md:px-8 py-6 md:py-8 text-center font-black font-mono text-gray-400 text-sm">{h.quantity}</td>
                     <td className="px-6 md:px-8 py-6 md:py-8 font-mono text-gray-500 text-xs">₹{h.avgBuyPrice.toFixed(2)}</td>
                     <td className="px-6 md:px-8 py-6 md:py-8 font-mono font-black text-white text-xs">₹{h.livePrice.toFixed(2)}</td>
                     <td className="px-6 md:px-8 py-6 md:py-8 text-right">
                       <p className={`font-black font-mono text-sm md:text-lg tracking-tightest ${h.unrealizedPL >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                         {h.unrealizedPL >= 0 ? '+' : '-'}₹{Math.abs(h.unrealizedPL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </p>
                       <p className={`text-[8px] md:text-[10px] font-black tracking-widest mt-1 ${h.unrealizedPL >= 0 ? 'text-[#00FFC2]/50' : 'text-[#FF4D4D]/50'}`}>
                         {h.percentChange.toFixed(2)}%
                       </p>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {view === 'ALERTS' && (
        <div className="glass-card rounded-[32px] md:rounded-[48px] overflow-hidden">
           <div className="p-6 md:p-8 bg-white/[0.02] border-b border-white/[0.05]">
              <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Neural Alerts</h4>
           </div>
           <table className="w-full text-left">
              <thead className="bg-black/40">
                <tr>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase">Symbol</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase">Radar Condition</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase">Target</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase">Status</th>
                   <th className="px-6 md:px-8 py-4 md:py-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                 {alerts.length === 0 ? (
                   <tr><td colSpan={5} className="p-16 text-center text-gray-700 font-black uppercase italic opacity-30 text-xs tracking-widest">No neural alerts configured</td></tr>
                 ) : alerts.map(a => (
                   <tr key={a.id} className="hover:bg-white/[0.03]">
                      <td className="px-6 md:px-8 py-6 font-black uppercase text-sm">{a.symbol}</td>
                      <td className="px-6 md:px-8 py-6 font-black text-[10px] tracking-widest">
                         {a.condition === 'ABOVE' ? <span className="text-[#00FFC2]">CROSSING ABOVE</span> : <span className="text-[#FF4D4D]">DROPPING BELOW</span>}
                      </td>
                      <td className="px-6 md:px-8 py-6 font-mono font-black">₹{a.targetPrice.toLocaleString()}</td>
                      <td className="px-6 md:px-8 py-6">
                         {a.isTriggered ? (
                           <span className="bg-[#A42420]/20 text-[#FF7E7E] px-3 py-1 rounded-lg text-[8px] font-black uppercase border border-[#A42420]/30 animate-pulse">TRIGGERED</span>
                         ) : (
                           <button 
                            onClick={() => onToggleAlert(a.id)}
                            className={`${a.isActive ? 'text-[#00FFC2]' : 'text-gray-600'} text-[10px] font-black uppercase tracking-widest`}
                           >
                             {a.isActive ? 'ACTIVE RADAR' : 'STANDBY'}
                           </button>
                         )}
                      </td>
                      <td className="px-6 md:px-8 py-6 text-right">
                         <button onClick={() => onRemoveAlert(a.id)} className="text-gray-700 hover:text-red-500 transition-colors">
                            <i className="fas fa-trash-alt"></i>
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {view === 'HISTORY' && (
        <div className="glass-card rounded-[32px] md:rounded-[48px] overflow-x-auto">
          <table className="w-full text-left min-w-[600px] md:min-w-0">
            <thead className="bg-black/40">
              <tr>
                <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase">Symbol</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase">Type</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase">Units</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase text-right">Credit/Debit</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {transactions.length === 0 ? (
                 <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-black italic text-xs uppercase opacity-40">NO TRANSACTIONS LOGGED</td></tr>
              ) : [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                <tr key={t.id} className="hover:bg-white/[0.03]">
                  <td className="px-6 md:px-8 py-6 md:py-8 font-black uppercase text-sm">{t.symbol}</td>
                  <td className="px-6 md:px-8 py-6 md:py-8 font-black text-xs">
                    <span className={t.type === 'BUY' ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}>{t.type}</span>
                  </td>
                  <td className="px-6 md:px-8 py-6 md:py-8 font-mono text-sm">{t.quantity}</td>
                  <td className="px-6 md:px-8 py-6 md:py-8 text-right font-mono font-black text-sm">₹{(t.quantity * t.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="px-6 md:px-8 py-6 md:py-8 text-right">
                    <button onClick={() => onRemoveTransaction(t.id)} aria-label="Delete" className="text-gray-700 hover:text-red-500 p-2 transition-colors">
                      <i className="fas fa-trash"></i>
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

const EducationPage = () => (
  <div className="p-4 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-700 mb-20 md:mb-0">
    <div className="mb-10 md:mb-20">
      <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase font-heading tracking-tightest">INTEL CENTER</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
      {EDUCATION_MODULES.map(module => (
        <div key={module.id} className="group cursor-pointer">
          <div className="relative aspect-video rounded-[24px] md:rounded-[40px] overflow-hidden mb-6 md:mb-8 border border-white/5 glass-card">
            <img src={module.videoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100" alt={module.title} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all">
                <i className="fas fa-play text-white ml-1"></i>
              </div>
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-black font-heading mb-2 md:mb-3 uppercase group-hover:text-[#FF7E7E] transition-colors">{module.title}</h3>
          <p className="text-gray-500 text-[10px] md:text-sm font-medium uppercase tracking-widest">{module.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const ComparePage = ({ stocks }: { stocks: Stock[] }) => {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState('');

  const run = async () => {
    setLoading(true);
    try { setRes(await compareStocks(stocks.filter(s => ids.includes(s.id)))); }
    catch { setRes("ERROR IN SYNC"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto text-center mb-20 md:mb-0">
      <h2 className="text-3xl md:text-5xl font-black mb-10 md:mb-16 uppercase font-heading tracking-tightest">BATTLE ARENA</h2>
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10 md:mb-16">
        {stocks.map(s => (
          <button 
            key={s.id} 
            onClick={() => setIds(ids.includes(s.id) ? ids.filter(i => i !== s.id) : [...ids, s.id])} 
            className={`px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] border transition-all ${ids.includes(s.id) ? 'bg-[#6E1916] border-[#A42420] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
          >
            {s.symbol}
          </button>
        ))}
      </div>
      <button 
        onClick={run} 
        disabled={ids.length < 2 || loading} 
        className="btn-sangria w-full md:w-auto px-10 md:px-16 py-4 md:py-6 rounded-[16px] md:rounded-[32px] text-[10px] md:text-[12px] font-black uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? 'CALIBRATING BATTLE...' : 'INITIALIZE BATTLE'}
      </button>
      {res && (
        <div className="mt-12 md:mt-24 glass-card p-6 md:p-12 rounded-[24px] md:rounded-[64px] text-left animate-in slide-in-from-bottom-12 duration-1000">
           <div className="flex items-center gap-3 mb-8">
              <i className="fas fa-microchip text-[#FF7E7E]"></i>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">AI Comparative Analytics</span>
           </div>
           <div className="italic text-base md:text-xl leading-relaxed text-gray-300">
             {res}
           </div>
        </div>
      )}
    </div>
  );
};

// --- Notification Toast Component ---

// Fix: Use React.FC to allow standard React props like 'key' and prevent assignment errors during list rendering
const NotificationToast: React.FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in slide-in-from-top-12 duration-500">
    <div className="glass-card p-6 rounded-[24px] border-l-8 border-l-[#00FFC2] shadow-[0_0_50px_rgba(0,255,194,0.2)] flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#00FFC2]/10 flex items-center justify-center animate-pulse">
          <i className="fas fa-bolt text-[#00FFC2]"></i>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
        <i className="fas fa-times"></i>
      </button>
    </div>
  </div>
);

// --- App Root ---

export default function App() {
  const [activeTab, setActiveTab] = useState('Market');
  const [lang, setLang] = useState<AppLanguage>('English');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  const [stocks, setStocks] = useState<Stock[]>(() => {
    return INDIAN_STOCKS.map(s => {
      const hist = [...Array(100)].map((_, i) => ({
        time: `${10 - Math.floor((100 - i)/10)}:${(i%10)*6}:00`,
        value: s.price * (0.95 + Math.random() * 0.1)
      }));
      return { ...s, history: hist };
    });
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('ryaion_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [savedTrendlines, setSavedTrendlines] = useState<SavedTrendline[]>(() => {
    try {
      const saved = localStorage.getItem('ryaion_trendlines');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('ryaion_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('ryaion_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('ryaion_trendlines', JSON.stringify(savedTrendlines)); }, [savedTrendlines]);
  useEffect(() => { localStorage.setItem('ryaion_alerts', JSON.stringify(alerts)); }, [alerts]);

  // Combined real-time loop for price updates and alert checks
  useEffect(() => {
    const itv = setInterval(() => {
      setStocks(currStocks => {
        const nextStocks = currStocks.map(s => {
          const cp = (Math.random() * 0.3 - 0.15);
          const np = s.price * (1 + cp / 100);
          return { 
            ...s, 
            price: np, 
            history: [...s.history, { time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), value: np }].slice(-100), 
            changePercent: s.changePercent + cp
          };
        });

        // Neural Scan: Check for triggered alerts
        setAlerts(currAlerts => {
          const newNotifications: string[] = [];
          const updatedAlerts = currAlerts.map(a => {
            if (!a.isActive || a.isTriggered) return a;
            
            const stock = nextStocks.find(s => s.id === a.stockId);
            if (!stock) return a;

            const isMet = (a.condition === 'ABOVE' && stock.price >= a.targetPrice) || 
                          (a.condition === 'BELOW' && stock.price <= a.targetPrice);

            if (isMet) {
              newNotifications.push(`NEURAL ALERT: ${a.symbol} crossed ₹${a.targetPrice.toLocaleString()}!`);
              return { ...a, isTriggered: true, isActive: false };
            }
            return a;
          });

          if (newNotifications.length > 0) {
            setNotifications(prev => [...prev, ...newNotifications]);
          }

          return updatedAlerts;
        });

        return nextStocks;
      });
    }, 8000);
    return () => clearInterval(itv);
  }, []);

  const handleSaveTrendline = (line: Omit<SavedTrendline, 'id'>) => {
    setSavedTrendlines(prev => [...prev, { ...line, id: generateId() }]);
  };

  const handleDeleteTrendline = (id: string) => {
    setSavedTrendlines(prev => prev.filter(t => t.id !== id));
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...t, id: generateId() }]);
  };

  const addAlert = (a: Omit<PriceAlert, 'id' | 'isActive' | 'isTriggered' | 'createdAt'>) => {
    const newAlert: PriceAlert = {
      ...a,
      id: generateId(),
      isActive: true,
      isTriggered: false,
      createdAt: new Date().toISOString()
    };
    setAlerts(prev => [...prev, newAlert]);
    setNotifications(prev => [...prev, `NEURAL RADAR DEPLOYED: Monitoring ${a.symbol} @ ₹${a.targetPrice}`]);
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen pb-20 md:pb-24 flex flex-col overflow-x-hidden">
      {/* Toast Notifications */}
      <div className="contents">
        {notifications.map((msg, i) => (
          <NotificationToast 
            key={`${msg}-${i}`} 
            message={msg} 
            onClose={() => setNotifications(prev => prev.filter((_, idx) => idx !== i))} 
          />
        ))}
      </div>

      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className="glass-card max-w-md w-full p-8 md:p-14 rounded-[32px] md:rounded-[64px] text-center border-t-4 border-t-[#6E1916]">
            <Logo />
            <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 uppercase tracking-tightest leading-none mt-6">PRIVACY PROTOCOL</h2>
            <p className="text-gray-500 mb-8 font-black uppercase text-[8px] md:text-[10px] tracking-widest opacity-60">Neural session persistence active. No external leakage confirmed. Welcome to Ryaion.</p>
            <button onClick={() => setShowPrivacy(false)} className="w-full bg-white text-black py-4 md:py-5 rounded-[16px] md:rounded-[24px] font-black uppercase text-[10px] md:text-[11px] tracking-[0.4em] hover:bg-[#A42420] hover:text-white transition-all">ACKNOWLEDGE</button>
          </div>
        </div>
      )}

      <NewsTicker />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang} />

      <main className="flex-1 relative overflow-x-hidden">
        {activeTab === 'Market' && (
          <MarketPage 
            stocks={stocks} 
            selectedStock={selectedStock}
            onStockClick={(s) => { setSelectedStock(s); if (window.innerWidth < 1024) setActiveTab('Advisor'); }} 
          />
        )}
        {activeTab === 'News' && <NewsPage />}
        {activeTab === 'Advisor' && (
          <AdvisorPage 
            stocks={stocks} 
            selectedStock={selectedStock} 
            setSelectedStock={setSelectedStock} 
            savedTrendlines={savedTrendlines} 
            onSaveTrendline={handleSaveTrendline} 
            onDeleteTrendline={handleDeleteTrendline} 
            onAddAlert={addAlert}
          />
        )}
        {activeTab === 'Compare' && <ComparePage stocks={stocks} />}
        {activeTab === 'Learn' && <EducationPage />}
        {activeTab === 'Portfolio' && (
          <PortfolioPage 
            stocks={stocks} 
            transactions={transactions} 
            alerts={alerts}
            onAddTransaction={addTransaction} 
            onRemoveTransaction={(id) => setTransactions(transactions.filter(t => t.id !== id))} 
            onRemoveAlert={removeAlert}
            onToggleAlert={toggleAlert}
          />
        )}
      </main>

      <footer className="hidden md:flex fixed bottom-0 left-0 right-0 py-4 px-8 bg-black/80 backdrop-blur-md border-t border-white/5 justify-between items-center z-40">
        <div className="text-[9px] font-black text-gray-600 tracking-[0.3em] uppercase">RYAION NEURAL GRID v2.8</div>
        <div className="flex gap-6">
          <i className="fab fa-discord text-gray-600 hover:text-white transition-colors cursor-pointer"></i>
          <i className="fab fa-twitter text-gray-600 hover:text-white transition-colors cursor-pointer"></i>
          <i className="fab fa-github text-gray-600 hover:text-white transition-colors cursor-pointer"></i>
        </div>
      </footer>
    </div>
  );
}
