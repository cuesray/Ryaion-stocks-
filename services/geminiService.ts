import { GoogleGenAI, Type } from "@google/genai";
import { Stock, AIAnalysis, NewsItem } from "../types";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStockAnalysis = async (stock: Stock): Promise<AIAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze the Indian stock ${stock.name} (${stock.symbol}). Current price: ₹${stock.price}. Recent change: ${stock.changePercent}%. Provide a detailed financial analysis suitable for a 20-year-old investor. Use Gen-Z slang occasionally but stay insightful. Include risk assessment, target price, pros, and cons.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, description: "Buy, Sell, Hold, or Watch" },
          summary: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskLevel: { type: Type.STRING, description: "Low, Medium, or High" },
          targetPrice: { type: Type.STRING }
        },
        required: ["verdict", "summary", "pros", "cons", "riskLevel", "targetPrice"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Failed to parse AI analysis");
  }
};

export const getStockVibe = async (stock: Stock): Promise<{ vibe: string, score: number, hypeReason: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `What is the current 'vibe' and social sentiment of ${stock.symbol} in the Indian market today? Return a JSON object with: 
    - vibe: a short slang phrase (e.g., 'To the Moon', 'Down Bad', 'Pure Aura', 'Mid AF')
    - score: 1 to 100 (sentiment strength)
    - hypeReason: 1 short sentence why people are talking about it.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vibe: { type: Type.STRING },
          score: { type: Type.NUMBER },
          hypeReason: { type: Type.STRING }
        },
        required: ["vibe", "score", "hypeReason"]
      }
    }
  });
  return JSON.parse(response.text || '{"vibe": "Neutral", "score": 50, "hypeReason": "Checking nodes..."}');
};

export interface MarketVibeResponse extends NewsItem {
  score: number;
}

export const getMarketVibeCheck = async (): Promise<MarketVibeResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Perform a real-time web search for the current Indian stock market (Nifty/Sensex) sentiment. Return a JSON object with 'text' (a 1-sentence vibe check with Gen-Z slang) and 'score' (0-100, where 0 is extreme panic and 100 is maximum hype).",
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          score: { type: Type.NUMBER }
        },
        required: ["text", "score"]
      }
    }
  });
  
  const data = JSON.parse(response.text || '{"text": "Market vibe is currently decrypting...", "score": 50}');
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .map((chunk: any) => chunk.web)
    .filter(Boolean)
    .map((web: any) => ({
      uri: web.uri,
      title: web.title || 'Market Intel',
    }));

  return { ...data, sources };
};

export const askRya = async (query: string): Promise<NewsItem> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are Rya, a Gen-Z Indian stock market expert. Answer this query concisely using Indian market context: "${query}". Keep it helpful, honest, and slightly informal. Use web search to ensure accuracy.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  
  const text = response.text || "My neural links are fuzzy. Try asking again.";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .map((chunk: any) => chunk.web)
    .filter(Boolean)
    .map((web: any) => ({
      uri: web.uri,
      title: web.title || 'Source',
    }));

  return { text, sources };
};

export const compareStocks = async (stocks: Stock[]): Promise<string> => {
  const stockList = stocks.map(s => `${s.name} (${s.symbol}) at ₹${s.price}`).join(', ');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a senior Indian stock market advisor. Compare these stocks for a GenZ investor looking for long-term growth: ${stockList}. Be honest about risks and potential. Use informal but professional tone.`,
  });
  return response.text || "Comparison unavailable at the moment.";
};

export const getMarketNews = async (): Promise<NewsItem> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Summarize the 5 most important news events happening today in the Indian stock market. Focus on Nifty, Sensex, and major corporate moves. Use a tone suitable for Gen Z investors. Format each news item with a clear headline and a 2-sentence breakdown.",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "Market news sync failed.";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .map((chunk: any) => chunk.web)
    .filter(Boolean)
    .map((web: any) => ({
      uri: web.uri,
      title: web.title || 'News Intel',
    }));

  return { text, sources };
};