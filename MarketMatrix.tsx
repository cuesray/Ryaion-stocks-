import React from 'react';
import { AreaChart, Area } from 'recharts';
import { Stock } from './types';
import SafeChartContainer from './SafeChartContainer';

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

/**
 * 🛰️ Market Matrix Component
 * A high-density neural grid for real-time stock surveillance.
 */
export const MarketMatrix = ({ stocks, onStockClick, selectedStockId }: { stocks: Stock[], onStockClick: (s: Stock) => void, selectedStockId?: string }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
      {stocks.map(stock => {
        const isSelected = selectedStockId === stock.id;
        const isUp = stock.changePercent >= 0;
        const volatility = Math.min(Math.abs(stock.changePercent) * 20, 100);
        
        return (
          <div 
            key={stock.id} 
            onClick={() => onStockClick(stock)} 
            className={`glass-card p-8 md:p-10 rounded-[40px] md:rounded-[56px] border-l-8 group cursor-pointer relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 ${
              isSelected 
                ? 'border-l-[#A42420] bg-[#6E1916]/20 ring-4 ring-[#A42420]/30' 
                : 'border-l-[#6E1916]/20'
            }`}
            style={{
              boxShadow: isSelected 
                ? `0 0 ${40 + volatility}px rgba(164, 36, 32, 0.5)` 
                : '0 4px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Neural Scan Line Effect */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#A42420]/60 to-transparent -translate-y-full group-hover:animate-[scan_2.5s_linear_infinite] z-20"></div>
            
            {/* Ping Indicator */}
            <div className="absolute top-6 right-8 flex gap-2 items-center">
              <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-[#00FFC2]' : 'bg-[#FF4D4D]'} animate-pulse`}></span>
              <span className="text-[7px] font-black text-white/10 uppercase tracking-[0.3em]">TELEMETRY_LINK_0{stock.id}</span>
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="max-w-[70%]">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-2xl md:text-3xl font-black font-heading transition-colors uppercase tracking-tightest ${isSelected ? 'text-[#FF7E7E]' : 'group-hover:text-[#FF7E7E]'}`}>{stock.symbol}</h3>
                  <span className="text-[8px] font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-500 uppercase tracking-widest">{stock.sector}</span>
                </div>
                <p className="text-[9px] md:text-[11px] text-gray-500 font-black uppercase tracking-[0.2em] truncate opacity-50">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl md:text-3xl font-black font-mono leading-none tracking-tightest">₹{stock.price.toLocaleString()}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-3 ${isUp ? 'bg-[#00FFC2]/10 text-[#00FFC2]' : 'bg-[#FF4D4D]/10 text-[#FF4D4D]'}`}>
                  <span className="text-[11px] font-black font-mono">{isUp ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <div className="w-full relative z-10 mb-8 bg-black/40 rounded-3xl overflow-hidden border border-white/5">
              {/* Added aspect={2.5} to maintain sleek sparkline geometry */}
              <SafeChartContainer aspect={2.5} minHeight={120}>
                {stock.history.length > 0 && (
                  <AreaChart data={stock.history.slice(-40)}>
                    <Area 
                      type="stepAfter" 
                      dataKey="value" 
                      stroke={isUp ? COLORS.green : COLORS.red} 
                      fill={isUp ? COLORS.green : COLORS.red} 
                      fillOpacity={0.12} 
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </AreaChart>
                )}
              </SafeChartContainer>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/[0.05] group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.4em] mb-1">DATA NODES</span>
                <span className="text-[12px] font-black text-white font-mono tracking-tighter">{stock.marketCap}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.4em] mb-1">SIGNAL RATIO</span>
                <span className="text-[12px] font-black text-white font-mono tracking-tighter">{stock.peRatio} (PE)</span>
              </div>
            </div>

            <style>{`
              @keyframes scan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(600%); }
              }
            `}</style>
          </div>
        );
      })}
    </div>
  );
};