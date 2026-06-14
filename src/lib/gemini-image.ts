import { generateHordeImage } from "./horde";

/**
 * Generates an image using Google's gemini-3.1-flash-image (Nano Banana 2).
 * If the user's API key is on the free tier (which has a limit of 0 for image models),
 * it automatically falls back to generating using AI Horde (Stable Horde) with realistic presets.
 * 
 * @param prompt Image prompt in English
 * @param options Dimensions and config
 * @returns Base64 Data URL (data:image/jpeg;base64,...)
 */
export async function generateImageWithFallback(
  prompt: string,
  options: { width?: number; height?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      console.log(`[Gemini Image] Tentando gerar com gemini-3.1-flash-image (Nano Banana 2)...`);
      
      // We call the standard generateContent endpoint for the image model
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      });

      if (res.status === 200) {
        const resJson = await res.json();
        const firstPart = resJson.candidates?.[0]?.content?.parts?.[0];
        
        if (firstPart && firstPart.inlineData) {
          const mimeType = firstPart.inlineData.mimeType || "image/jpeg";
          const base64Data = firstPart.inlineData.data;
          console.log(`[Gemini Image] Sucesso! Imagem gerada com Nano Banana 2.`);
          return `data:${mimeType};base64,${base64Data}`;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error?.message || "Erro na API";
        console.warn(`[Gemini Image] Modelo gemini-3.1-flash-image indisponível (Status ${res.status}): ${errMsg}`);
        
        if (res.status === 429 || errMsg.includes("Quota exceeded") || errMsg.includes("paid plans")) {
          console.log(`[Gemini Image] Quota/Limite de plano gratuito detectado para o Nano Banana 2. Ativando fallback gratuito.`);
        }
      }
    } catch (e) {
      console.error(`[Gemini Image] Exceção ao tentar gerar com Gemini Nano Banana:`, e);
    }
  }

  // Fallback to AI Horde
  console.log(`[Gemini Image] Ativando fallback: Gerando imagem via AI Horde...`);
  return generateHordeImage(prompt, options);
}
