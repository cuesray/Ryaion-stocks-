import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { Stock, AIAnalysis, NewsItem, PortfolioItem, Transaction } from './types';
import { INDIAN_STOCKS, EDUCATION_MODULES } from './constants';
import { getStockAnalysis, compareStocks, getMarketNews, askRya, getStockVibe, getMarketVibeCheck, MarketVibeResponse } from './services/geminiService';
import SafeChartContainer from './SafeChartContainer';
import ChartGate from './ChartGate';
import { MarketMatrix } from './MarketMatrix';

const generateId = () => Math.random().toString(36).substring(2, 11);

// --- Sub-Components ---

const MarketVibeSection = () => {
  const [vibe, setVibe] = useState<MarketVibeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketVibeCheck().then(res => {
      setVibe(res);
      setLoading(false);
    });
  }, []);

  const score = vibe?.score || 50;
  const isHyped = score > 50;

  return (
    <div className="mb-12 glass-card p-8 md:p-10 rounded-[48px] border-t-4 border-t-[#00FFC2] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700">
        <i className="fas fa-radar text-8xl text-[#00FFC2]"></i>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00FFC2] animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#00FFC2]">SENTIMENT_NODE_01</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black italic leading-tight text-white/90">
            {loading ? "Decrypting market signal..." : vibe?.text}
          </h3>
          {!loading && vibe?.sources && vibe.sources.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
              {vibe.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#00FFC2] hover:text-black transition-all">
                  Source {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-black/40 p-6 rounded-[32px] border border-white/5 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hype Meter</span>
            <span className={`text-xl font-black font-mono ${isHyped ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>{score}%</span>
          </div>
          <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,255,194,0.4)] ${isHyped ? 'bg-[#00FFC2]' : 'bg-[#FF4D4D]'}`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-600">
            <span>Panic</span>
            <span>Aura Level</span>
            <span>Moon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PortfolioItemCard: React.FC<{ item: PortfolioItem, stocks: Stock[] }> = ({ item, stocks }) => {
  const s = stocks.find(x => x.symbol === item.symbol);
  if (!s) return null;
  const val = s.price * item.quantity;
  const pl = val - (item.avgPrice * item.quantity);
  const isUp = pl >= 0;

  return (
    <div className="glass-card p-10 rounded-[56px] border border-white/5 relative overflow-hidden group hover:border-[#A42420]/30 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-2xl font-black uppercase tracking-tightest group-hover:text-[#FF7E7E] transition-colors">{item.symbol}</h4>
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">
            {item.quantity} Units @ ₹{item.avgPrice.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black font-mono">₹{val.toLocaleString()}</p>
          <p className={`text-[10px] font-black font-mono ${isUp ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
            {isUp ? '+' : ''}₹{pl.toFixed(1)}
          </p>
        </div>
      </div>
      <div className="h-24">
        <SafeChartContainer aspect={3}>
          <AreaChart data={s.history.slice(-30)}>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isUp ? '#00FFC2' : '#FF4D4D'} 
              fill={isUp ? '#00FFC211' : '#FF4D4D11'} 
              strokeWidth={2} 
            />
          </AreaChart>
        </SafeChartContainer>
      </div>
    </div>
  );
};

const NewsTicker = () => (
  <div className="bg-[#6E1916] py-2.5 overflow-hidden whitespace-nowrap border-b border-white/10 relative z-[60]">
    <div className="inline-block animate-marquee">
      {Array(3).fill(0).map((_, i) => (
        <React.Fragment key={i}>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white mx-8">🚀 NIFTY 50: 22,450.20 (+0.45%)</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white mx-8">📈 SENSEX: 73,850.15 (+0.38%)</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00FFC2] mx-8">🍔 ZOMATO: ₹184.30 (+2.90%)</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white mx-8">🔥 INFY: ₹1,512.20 (+1.50%)</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white mx-8">💎 RELIANCE: ₹2,950.45 (+0.42%)</span>
        </React.Fragment>
      ))}
    </div>
    <style>{`
      @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
      .animate-marquee { display: inline-block; animation: marquee 40s linear infinite; }
    `}</style>
  </div>
);

const StockModal = ({ stock, onClose, onAnalyze, onTrade, balance, currentQty }: { 
  stock: Stock, 
  onClose: () => void, 
  onAnalyze: (s: Stock) => void,
  onTrade: (type: 'BUY' | 'SELL', qty: number) => void,
  balance: number,
  currentQty: number
}) => {
  const [tradeQty, setTradeQty] = useState(1);
  const [vibeData, setVibeData] = useState<{ vibe: string, score: number, hypeReason: string } | null>(null);
  const totalCost = tradeQty * stock.price;

  useEffect(() => {
    getStockVibe(stock).then(setVibeData);
  }, [stock]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="glass-card w-full max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[48px] border-t-8 border-t-[#A42420] relative z-10 flex flex-col md:flex-row shadow-[0_0_100px_rgba(164,36,32,0.3)]">
        <div className="md:w-1/2 p-10 border-r border-white/5">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[9px] font-black text-[#A42420] uppercase tracking-[0.4em] block mb-2">{stock.sector} Node</span>
              <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">{stock.symbol}</h2>
              <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-widest">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black font-mono tracking-tightest">₹{stock.price.toLocaleString()}</p>
              <span className={`text-xs font-black uppercase ${stock.changePercent >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="mb-8 p-6 bg-[#A42420]/5 rounded-[32px] border border-[#A42420]/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i className="fas fa-bolt text-8xl text-white"></i>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Neural Vibe Stream</span>
              <span className="text-[10px] font-black text-[#A42420] animate-pulse">LIVE_SENTIMENT</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                <div 
                  className="absolute inset-0 rounded-full border-4 border-t-[#A42420] transition-all duration-1000"
                  style={{ transform: `rotate(${(vibeData?.score || 50) * 3.6}deg)` }}
                ></div>
                <span className="text-xl font-black">{vibeData?.score || '--'}</span>
              </div>
              <div>
                <h4 className="text-2xl font-black uppercase text-[#FF7E7E] italic">"{vibeData?.vibe || 'Analyzing...'}"</h4>
                <p className="text-[10px] text-gray-400 font-medium mt-1 leading-relaxed">{vibeData?.hypeReason || 'Waiting for market signal node decryption...'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-black/40 rounded-3xl border border-white/5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Trade Terminal</span>
              <span className="text-[10px] font-black text-[#00FFC2]">Cash: ₹{balance.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <input 
                type="number" 
                min="1" 
                value={tradeQty} 
                onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-black font-mono outline-none focus:border-[#A42420]"
              />
              <div className="text-right">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">Total Cost</span>
                <p className="text-xl font-black font-mono">₹{totalCost.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button disabled={balance < totalCost} onClick={() => onTrade('BUY', tradeQty)} className="py-4 rounded-2xl bg-[#00FFC2] text-black font-black uppercase text-xs tracking-[0.2em] disabled:opacity-30 hover:scale-105 transition-all">Buy Node</button>
              <button disabled={currentQty < tradeQty} onClick={() => onTrade('SELL', tradeQty)} className="py-4 rounded-2xl bg-[#FF4D4D] text-white font-black uppercase text-xs tracking-[0.2em] disabled:opacity-30 hover:scale-105 transition-all">Sell Node</button>
            </div>
          </div>

          <button onClick={() => { onAnalyze(stock); onClose(); }} className="w-full bg-white/5 border border-white/10 text-white/50 hover:text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.5em] transition-all">
            CONSULT AI ORACLE
          </button>
        </div>

        <div className="md:w-1/2 bg-black/40 p-10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Neural History Stream</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#A42420] transition-all">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {stock.history.length > 0 ? (
              <ChartGate height={420}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stock.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <Area type="monotone" dataKey="value" stroke="#A42420" fill="url(#sangriaGradient)" strokeWidth={3} animationDuration={1000} />
                    <defs>
                      <linearGradient id="sangriaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A42420" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#A42420" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </ChartGate>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvisorPage = ({ stocks, selectedStock, setSelectedStock }: any) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const getAnalysis = async () => {
    if (!selectedStock) return;
    setAnalysis(null);
    setLoading(true);
    try {
      const res = await getStockAnalysis(selectedStock);
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/3 space-y-10">
          <div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tightest leading-none">AI Oracle</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mt-6">NEURAL STOCK DECODING</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stocks.map((s: Stock) => (
              <button key={s.id} onClick={() => setSelectedStock(s)} className={`p-6 rounded-[32px] border transition-all text-[11px] font-black uppercase tracking-[0.2em] ${selectedStock?.id === s.id ? 'bg-[#A42420] border-[#A42420] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                {s.symbol}
              </button>
            ))}
          </div>
          {selectedStock && (
            <button onClick={getAnalysis} disabled={loading} className="w-full btn-sangria py-8 rounded-[40px] font-black uppercase text-[12px] tracking-[0.6em] transition-all">
              {loading ? 'CALIBRATING...' : 'INITIATE DEEP SCAN'}
            </button>
          )}
        </div>

        <div className="flex-1 space-y-10 relative">
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(164,36,32,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(164,36,32,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          {analysis ? (
            <>
              <div className="glass-card p-12 rounded-[72px] border-l-8 border-l-[#A42420] animate-in slide-in-from-right-12 duration-700">
                <h3 className={`text-7xl md:text-9xl font-black uppercase tracking-tighter mb-8 ${analysis.verdict === 'Buy' ? 'text-[#00FFC2]' : analysis.verdict === 'Sell' ? 'text-[#FF4D4D]' : 'text-white'}`}>{analysis.verdict}</h3>
                <p className="text-2xl text-gray-100 italic font-bold mb-16">"{analysis.summary}"</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/5">
                  <div className="space-y-6">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-[#00FFC2]">Bullish Signal</h4>
                    <ul className="space-y-4">
                      {analysis.pros.map((p, i) => <li key={i} className="text-base text-gray-400 font-medium border-l-2 border-[#00FFC2]/30 pl-6">{p}</li>)}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-[#FF4D4D]">Bearish Signal</h4>
                    <ul className="space-y-4">
                      {analysis.cons.map((c, i) => <li key={i} className="text-base text-gray-400 font-medium border-l-2 border-[#FF4D4D]/30 pl-6">{c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="glass-card p-10 rounded-[48px] border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Confidence Mapping (Line)</span>
                  <span className="text-[10px] font-black text-[#A42420]">SIGMA_ANALYTICS</span>
                </div>
                {selectedStock.history.length > 0 ? (
                  <ChartGate height={360}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedStock.history.slice(-30)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Line type="monotone" dataKey="value" stroke="#A42420" strokeWidth={4} dot={false} animationDuration={1500} />
                        <Tooltip contentStyle={{ background: '#1a0505', border: 'none', borderRadius: '12px' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartGate>
                ) : null}
              </div>
            </>
          ) : loading ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-card rounded-[72px] border border-dashed border-white/10 opacity-30 text-center p-10">
              <i className="fas fa-atom fa-spin text-8xl mb-8 text-[#A42420]"></i>
              <p className="text-[12px] font-black uppercase tracking-[0.8em]">CALIBRATING NEURAL MODELS...</p>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-card rounded-[72px] border border-dashed border-white/10 opacity-30 text-center p-10">
              <i className="fas fa-fingerprint text-8xl mb-8 text-[#A42420]"></i>
              <p className="text-[12px] font-black uppercase tracking-[0.8em]">SELECT A NODE TO ANALYZE</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AskRyaChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'bot', text: string, sources?: any[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await askRya(userMsg);
      setMessages(prev => [...prev, { type: 'bot', text: res.text, sources: res.sources }]);
    } catch (e) {
      setMessages(prev => [...prev, { type: 'bot', text: "Signal lost. Reconnecting..." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[100]">
      {isOpen ? (
        <div className="w-[360px] h-[500px] glass-card rounded-[40px] border-t-8 border-t-[#A42420] shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-widest">RYA_STREAM</h4>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white"><i className="fas fa-times"></i></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-medium ${m.type === 'user' ? 'bg-[#A42420] text-white' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
                  {m.text}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-2">
                      {m.sources.map((s, si) => (
                        <a key={si} href={s.uri} target="_blank" className="text-[7px] uppercase font-black opacity-50 hover:opacity-100">Node {si+1}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-[8px] font-black uppercase tracking-widest text-[#A42420] animate-pulse">Processing...</div>}
          </div>
          <div className="p-6 border-t border-white/5">
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type query..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-[#A42420]" />
              <button onClick={handleSend} className="w-10 h-10 rounded-xl bg-[#A42420] text-white flex items-center justify-center"><i className="fas fa-paper-plane text-xs"></i></button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 rounded-2xl bg-[#A42420] flex items-center justify-center text-white text-xl shadow-lg hover:scale-110 transition-transform"><i className="fas fa-robot"></i></button>
      )}
    </div>
  );
};

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketNews().then(res => {
      setNews(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      <h2 className="text-6xl font-black uppercase tracking-tightest">Global Intel</h2>
      <div className="glass-card p-12 rounded-[56px] border-l-8 border-l-[#A42420]">
        {loading ? (
          <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Accessing grounding nodes...</div>
        ) : (
          <div className="prose prose-invert text-lg text-gray-300 whitespace-pre-wrap leading-relaxed">
            {news?.text}
            <div className="mt-12 flex flex-wrap gap-4">
              {news?.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#A42420] hover:text-white transition-all">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ComparePage = ({ stocks }: { stocks: Stock[] }) => {
  const [s1, setS1] = useState<Stock | null>(stocks[0]);
  const [s2, setS2] = useState<Stock | null>(stocks[1]);
  const [comp, setComp] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!s1 || !s2) return;
    setLoading(true);
    try {
      setComp(await compareStocks([s1, s2]));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="text-center">
        <h2 className="text-7xl font-black uppercase tracking-tightest">Battle Arena</h2>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mt-4">PVP STOCK PERFORMANCE SIMULATION</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
        <div className={`flex-1 glass-card p-10 rounded-[48px] border-2 transition-all duration-500 ${loading ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
          <div className="flex flex-col items-center gap-6">
            <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:border-[#A42420]" value={s1?.id} onChange={e => setS1(stocks.find(x => x.id === e.target.value) || null)}>
              {stocks.map(x => <option key={x.id} value={x.id} className="bg-[#0D0202]">{x.symbol}</option>)}
            </select>
            {s1 && (
              <div className="text-center">
                <p className="text-4xl font-black">₹{s1.price.toLocaleString()}</p>
                <span className={`text-[10px] font-black ${s1.changePercent >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                  {s1.changePercent >= 0 ? '+' : ''}{s1.changePercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#A42420] text-white flex items-center justify-center font-black text-3xl shadow-[0_0_30px_rgba(164,36,32,0.6)] z-10">VS</div>
        </div>

        <div className={`flex-1 glass-card p-10 rounded-[48px] border-2 transition-all duration-500 ${loading ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
          <div className="flex flex-col items-center gap-6">
            <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:border-[#A42420]" value={s2?.id} onChange={e => setS2(stocks.find(x => x.id === e.target.value) || null)}>
              {stocks.map(x => <option key={x.id} value={x.id} className="bg-[#0D0202]">{x.symbol}</option>)}
            </select>
            {s2 && (
              <div className="text-center">
                <p className="text-4xl font-black">₹{s2.price.toLocaleString()}</p>
                <span className={`text-[10px] font-black ${s2.changePercent >= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                  {s2.changePercent >= 0 ? '+' : ''}{s2.changePercent}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={run} disabled={loading} className="btn-sangria py-6 px-16 rounded-full font-black uppercase text-[12px] tracking-widest hover:scale-105 active:scale-95 transition-all">
          {loading ? 'SIMULATING COMBAT...' : 'INITIALIZE FIGHT'}
        </button>
      </div>

      <div className="glass-card p-12 rounded-[56px] text-left min-h-[400px] relative overflow-hidden">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20"><i className="fas fa-atom fa-spin text-4xl text-[#A42420]"></i></div>}
        <div className="prose prose-invert max-w-none text-gray-300">
          {comp ? (
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#A42420]">DEEP SCAN RESULTS</h4>
              <div className="text-lg whitespace-pre-wrap leading-relaxed">{comp}</div>
            </div>
          ) : (
            <div className="text-center opacity-30 py-20 flex flex-col items-center gap-4">
              <i className="fas fa-sword text-6xl"></i>
              <p className="text-[10px] font-black uppercase tracking-widest">Select two stock nodes to simulate battle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Market');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [detailStock, setDetailStock] = useState<Stock | null>(null);
  const [balance, setBalance] = useState(1000000);
  const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>(() => INDIAN_STOCKS.map(s => ({
    ...s,
    history: [...Array(100)].map((_, i) => ({
      time: `${10 + Math.floor(i / 10)}:${(i % 10) * 6}:00`,
      value: s.price * (0.95 + Math.random() * 0.1)
    }))
  })));

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const itv = setInterval(() => {
      setStocks(curr => curr.map(s => {
        const delta = (Math.random() * 0.4 - 0.2);
        const np = s.price * (1 + (delta / 100));
        return { 
          ...s, 
          price: np, 
          history: [...s.history, { time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), value: np }].slice(-100), 
          changePercent: s.changePercent + delta
        };
      }));
    }, 5000);
    return () => clearInterval(itv);
  }, []);

  const handleTrade = (type: 'BUY' | 'SELL', qty: number) => {
    if (!detailStock) return;
    const total = qty * detailStock.price;
    if (type === 'BUY') {
      if (balance < total) return;
      setBalance(b => b - total);
      setHoldings(h => {
        const ex = h.find(x => x.symbol === detailStock.symbol);
        if (ex) return h.map(x => x.symbol === detailStock.symbol ? { ...x, quantity: x.quantity + qty, avgPrice: ((x.avgPrice * x.quantity) + total) / (x.quantity + qty) } : x);
        return [...h, { symbol: detailStock.symbol, quantity: qty, avgPrice: detailStock.price }];
      });
    } else {
      const ex = holdings.find(x => x.symbol === detailStock.symbol);
      if (!ex || ex.quantity < qty) return;
      setBalance(b => b + total);
      setHoldings(h => {
        const nq = ex.quantity - qty;
        return nq <= 0 ? h.filter(x => x.symbol !== detailStock.symbol) : h.map(x => x.symbol === detailStock.symbol ? { ...x, quantity: nq } : x);
      });
    }
    setDetailStock(null);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#A42420] selection:text-white pb-safe">
      <NewsTicker />
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 glass-card border-b border-white/[0.03] bg-[#0D0202]/80 backdrop-blur-3xl">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('Market')}>
          <div className="w-10 h-10 rounded-xl bg-[#A42420] flex items-center justify-center shadow-lg hover:rotate-6 transition-transform">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <h1 className="text-xl md:text-2xl font-black gradient-text uppercase tracking-tightest">RYAION</h1>
        </div>
        <div className="hidden md:flex items-center gap-10 flex-1 justify-center text-[10px] font-black uppercase tracking-[0.2em]">
          {['Market', 'News', 'Learn', 'Advisor', 'Compare', 'Portfolio'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`transition-all hover:text-white relative py-2 ${activeTab === t ? 'text-white tab-active' : 'text-gray-500'}`}>
              {t === 'Portfolio' ? 'The Vault' : t}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-black font-mono bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 animate-pulse-soft">
          <span className="text-gray-500 opacity-50 uppercase tracking-widest hidden lg:inline">BALANCE</span>
          <span className="text-[#00FFC2] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse"></span>
            ₹{balance.toLocaleString()}
          </span>
        </div>
      </nav>

      <main className="flex-1 pb-20 overflow-y-auto custom-scrollbar">
        {activeTab === 'Market' && (
          <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-1000">
            <div className="mb-12">
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tightest leading-none">The Matrix</h2>
              <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.8em] mt-6">REAL-TIME SECTOR SURVEILLANCE</p>
            </div>
            <MarketVibeSection />
            <MarketMatrix stocks={stocks} onStockClick={setDetailStock} selectedStockId={detailStock?.id} />
          </div>
        )}
        {activeTab === 'News' && <NewsPage />}
        {activeTab === 'Learn' && (
          <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-1000">
            <h2 className="text-6xl font-black uppercase tracking-tightest mb-12">Academy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {EDUCATION_MODULES.map(m => (
                <div key={m.id} className="glass-card rounded-[40px] overflow-hidden group hover:scale-[1.02] transition-all">
                  <div className="h-48 bg-black/40 relative">
                    <img src={m.videoUrl} className="w-full h-full object-cover opacity-30 group-hover:opacity-60 grayscale group-hover:grayscale-0 transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#A42420] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                        <i className="fas fa-play"></i>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-black uppercase mb-2 group-hover:text-[#FF7E7E] transition-colors">{m.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'Advisor' && <AdvisorPage stocks={stocks} selectedStock={selectedStock} setSelectedStock={setSelectedStock} />}
        {activeTab === 'Compare' && <ComparePage stocks={stocks} />}
        {activeTab === 'Portfolio' && (
          <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-1000">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-6xl font-black uppercase tracking-tightest">The Vault</h2>
                <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.8em] mt-2">PORTFOLIO INTELLIGENCE CORE</p>
              </div>
            </div>
            {holdings.length === 0 ? (
              <div className="glass-card p-20 rounded-[64px] border border-dashed border-white/10 text-center opacity-30">
                <i className="fas fa-wallet text-6xl mb-6 text-[#A42420]"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No assets in vault. Initialize trades.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {holdings.map(h => <PortfolioItemCard key={h.symbol} item={h} stocks={stocks} />)}
              </div>
            )}
          </div>
        )}
      </main>

      {detailStock && (
        <StockModal 
          stock={detailStock} 
          balance={balance} 
          currentQty={holdings.find(h => h.symbol === detailStock.symbol)?.quantity || 0} 
          onClose={() => setDetailStock(null)} 
          onAnalyze={(s) => { setSelectedStock(s); setActiveTab('Advisor'); }} 
          onTrade={handleTrade} 
        />
      )}
      <AskRyaChat />
    </div>
  );
}