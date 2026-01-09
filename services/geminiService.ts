
import { GoogleGenAI, Type } from "@google/genai";
import { Stock, AIAnalysis, NewsItem } from "../types";

// Always use the process.env.API_KEY directly as a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStockAnalysis = async (stock: Stock): Promise<AIAnalysis> => {
  // Using 'gemini-3-pro-preview' for complex financial reasoning and analysis
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze the Indian stock ${stock.name} (${stock.symbol}). Current price: ₹${stock.price}. Recent change: ${stock.changePercent}%. Provide a detailed financial analysis suitable for a 20-year-old investor. Include risk assessment, target price, pros, and cons.`,
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
    // Accessing response.text as a property, not a method
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("Failed to parse AI analysis");
  }
};

export const compareStocks = async (stocks: Stock[]): Promise<string> => {
  const stockList = stocks.map(s => `${s.name} (${s.symbol}) at ₹${s.price}`).join(', ');
  // Using 'gemini-3-pro-preview' for comparative financial reasoning
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a senior Indian stock market advisor. Compare these stocks for a GenZ investor looking for long-term growth: ${stockList}. Be honest about risks and potential. Use informal but professional tone.`,
  });

  // Accessing response.text as a property, not a method
  return response.text || "Comparison unavailable at the moment.";
};

export const getMarketNews = async (): Promise<NewsItem> => {
  // Using gemini-3-flash-preview for fast real-time search queries
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Summarize the 5 most important news events happening today in the Indian stock market. Focus on Nifty, Sensex, and major corporate moves. Use a tone suitable for Gen Z investors. Format each news item with a clear headline and a 2-sentence breakdown.",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "Market neural pathways currently blocked. Re-initializing...";
  
  // Extract URLs from groundingChunks
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
