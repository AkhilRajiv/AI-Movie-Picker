import { GoogleGenAI, Type } from "@google/genai";
import { Movie } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

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
    return response.text || "Could not retrieve info.";
  } catch (error) {
    console.error("AI Extra Content Error:", error);
    return "AI is taking a nap. Try again later.";
  }
};
