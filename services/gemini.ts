import { GoogleGenAI, Type } from "@google/genai";
import { Movie } from "../types";

const apiKey = import.meta.env.VITE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Simple cache for movie extras to avoid duplicate API calls
const extraCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getAIMovieRecommendation = async (userMood: string): Promise<Movie> => {
  const prompt = `You are a movie recommendation expert specializing in Indian Cinema (Bollywood, Tollywood, Kollywood, Mollywood, etc). I am feeling: "${userMood}". Recommend ONE INDIAN movie that fits this mood perfectly.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.STRING },
            desc: { type: Type.STRING },
            emoji: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ["title", "year", "desc", "emoji", "reason"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as Movie;
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    throw error;
  }
};

export const getMovieExtra = async (title: string, year: string, type: 'quote' | 'trivia'): Promise<string> => {
  // Create cache key
  const cacheKey = `${title}-${year}-${type}`;
  
  // Check cache first
  const cached = extraCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  let prompt = "";
  
  if (type === 'quote') {
    prompt = `For the Indian movie "${title}" (${year}), give me one ICONIC dialogue. Format: "Dialogue in original language (or transliteration)" - Character Name. Then a brief English translation. Keep it under 2 sentences.`;
  } else {
    prompt = `Tell me one fascinating, obscure behind-the-scenes fact about the Indian movie "${title}" (${year}). Keep it under 2 sentences.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const result = response.text || "Could not retrieve info.";
    
    // Cache the result
    extraCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    // Clean up expired cache entries (time-based cleanup)
    if (extraCache.size > 50) {
      const now = Date.now();
      for (const [key, value] of extraCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          extraCache.delete(key);
        }
      }
      // If still over limit after removing expired entries, remove oldest entries
      if (extraCache.size > 50) {
        const entriesToRemove = Array.from(extraCache.keys()).slice(0, extraCache.size - 50);
        entriesToRemove.forEach(key => extraCache.delete(key));
      }
    }
    
    return result;
  } catch (error) {
    console.error("AI Extra Content Error:", error);
    return "AI is taking a nap. Try again later.";
  }
};
