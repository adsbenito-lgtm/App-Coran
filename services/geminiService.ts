import { GoogleGenAI } from "@google/genai";

// Initialize the client
// API Key is assumed to be in process.env.API_KEY per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTafseer = async (surahName: string, verseNumber: number, verseText: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are a knowledgeable Islamic scholar assistant.
      Please provide a concise Tafseer (interpretation) in Arabic for the following Quranic verse:
      Surah: ${surahName}, Verse: ${verseNumber}
      Text: "${verseText}"
      
      Structure the response as:
      1. Simple explanation (التفسير الميسر)
      2. Key lessons (الدروس المستفادة)
      
      Keep it respectful, accurate to mainstream Sunni tafseer sources (like Ibn Kathir or Al-Sa'di), and under 200 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "عذراً، لم أتمكن من جلب التفسير في الوقت الحالي.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
  }
};