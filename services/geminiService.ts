
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Utility function to handle API calls with exponential backoff retries for 429 errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaError && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Quota exceeded. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Verifies that a clear human face is present in the image for account security.
 * Now supports both male and female users.
 */
export const verifyIdentity = async (base64Image: string): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Identity Verification: Is there a clear, recognizable human face in this image? Respond ONLY in JSON: {\"isVerified\": true/false, \"reason\": \"string\"}" },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isVerified: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isVerified"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const result = JSON.parse(text);
    return result.isVerified;
  });
};

export const getReverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Approx address for: Lat ${lat}, Lng ${lng}? Concise (City/Area).`,
    });
    return response.text?.trim() || "Unknown Location";
  } catch (error) {
    return "Unknown Location";
  }
};

export const getLegalRights = async (location: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Key legal rights for safety and protection in ${location}. Include harassment laws and Zero FIR details. Markdown.`,
    });
    return response.text || "Unable to fetch legal rights.";
  } catch (error) {
    return "Unable to fetch legal rights.";
  }
};

export const getHotlines = async (location: string): Promise<{name: string, number: string}[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Emergency contacts for safety in ${location}. Return JSON array: [{"name": "str", "number": "str"}]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              number: { type: Type.STRING }
            },
            required: ["name", "number"]
          }
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    return [{ name: "National Helpline", number: "1091" }, { name: "Police", number: "100" }];
  }
};

export const findNearestPoliceStation = async (lat: number, lng: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Nearest police station for: Lat ${lat}, Lng ${lng}. Provide name and phone.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const links = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Police Station Info",
      uri: chunk.web?.uri
    })) || [];

    return {
      text: response.text || "No police station info found.",
      links: links
    };
  } catch (error) {
    return { text: "Unable to locate police station. Please call 100.", links: [] };
  }
};

export const generateCommunityAdvice = async (problem: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Advise on: "${problem}"`,
      config: {
        systemInstruction: "You are a supportive community mentor for Aparajita. Provide concise safety tips."
      }
    });
    return response.text || "Stay safe and alert.";
  } catch (error) {
    return "Stay safe and consider reaching out to local support.";
  }
};
