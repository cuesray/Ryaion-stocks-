export interface Trendline {
  x1: string;
  y1: number;
  x2: string;
  y2: number;
}

export interface SavedTrendline extends Trendline {
  id: string;
  symbol: string;
  label: string;
}

export interface PriceAlert {
  id: string;
  stockId: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  marketCap: string;
  history: Array<{ time: string; value: number }>;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  volume?: string;
  peRatio?: number;
  description?: string;
}

export interface Transaction {
  id: string;
  stockId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string;
}

export interface Holding {
  stockId: string;
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface AIAnalysis {
  verdict: 'Buy' | 'Hold' | 'Sell' | 'Watch';
  summary: string;
  pros: string[];
  cons: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  targetPrice: string;
}

export interface NewsSource {
  uri: string;
  title: string;
}

export interface NewsItem {
  text: string;
  sources: NewsSource[];
}

export interface ComparisonResult {
  stocks: Stock[];
  analysis: string;
}

export type AppLanguage = 'English' | 'Hindi';