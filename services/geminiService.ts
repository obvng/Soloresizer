import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is missing");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const describeImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<string> => {
    try {
        const ai = getGeminiClient();
        
        // Remove data URL prefix if present
        const cleanBase64 = base64Data.split(',')[1] || base64Data;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64
                        }
                    },
                    {
                        text: "Analyze this image and provide a concise description suitable for an 'alt' text attribute. Also mention dominant colors and mood."
                    }
                ]
            }
        });

        return response.text || "No description generated.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Failed to analyze image using AI. Please check your API configuration.";
    }
};
