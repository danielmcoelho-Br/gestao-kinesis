export interface HordeOptions {
  width?: number;
  height?: number;
  steps?: number;
}

/**
 * Generates a high-quality image using the community-driven AI Horde (Stable Horde) API.
 * Uses realistic models and strict negative prompts to avoid body/face deformities.
 * 
 * @param prompt Image prompt in English
 * @param options Dimensions and steps
 * @returns Base64 Data URL (data:image/jpeg;base64,...)
 */
export async function generateHordeImage(
  prompt: string,
  options: HordeOptions = {}
): Promise<string> {
  const width = options.width || 512;
  const height = options.height || 512;
  const steps = options.steps || 25; // 25 steps for higher SDXL quality

  const urlSubmit = "https://stablehorde.net/api/v2/generate/async";
  
  // High-quality photorealistic models list
  const models = ["Juggernaut XL", "epicrealism", "Realistic Vision", "RealVisXL", "Dreamshaper"];

  // Negative prompt to strictly avoid anatomical distortions, extra limbs, cartoons, etc.
  const negativePrompt = "deformed, bad anatomy, disfigured, poorly drawn face, mutated limbs, extra limbs, ugly, blurry, bad hands, mutated hands, multiple arms, double body, missing limbs, amputee, cartoon, drawing, illustration, sketch, painting, low quality, worst quality, pixelated";

  console.log(`[AI Horde] Enviando solicitação de imagem HQ: "${prompt.substring(0, 50)}..." (${width}x${height})`);
  const resSubmit = await fetch(urlSubmit, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "0000000000",
      "Client-Agent": "KinesisLab:1.0:app"
    },
    body: JSON.stringify({
      prompt: prompt,
      params: {
        width,
        height,
        steps,
        n: 1,
        negative_prompt: negativePrompt
      },
      models
    })
  });

  if (resSubmit.status !== 202) {
    const errText = await resSubmit.text();
    throw new Error(`AI Horde submit falhou com status ${resSubmit.status}: ${errText}`);
  }

  const dataSubmit = await resSubmit.json();
  const jobId = dataSubmit.id;

  if (!jobId) {
    throw new Error("ID de job não retornado pela AI Horde.");
  }

  const urlCheck = `https://stablehorde.net/api/v2/generate/check/${jobId}`;
  const urlStatus = `https://stablehorde.net/api/v2/generate/status/${jobId}`;

  // Poll for status (max 25 attempts, 50 seconds)
  let done = false;
  const maxAttempts = 25;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    
    const resCheck = await fetch(urlCheck);
    if (!resCheck.ok) {
      console.warn(`[AI Horde] Falha ao checar status (tentativa ${i+1}): ${resCheck.status}`);
      continue;
    }
    
    const dataCheck = await resCheck.json();
    if (dataCheck.faulted) {
      throw new Error("O job falhou no servidor do AI Horde.");
    }
    
    if (dataCheck.done) {
      done = true;
      break;
    }
  }

  if (!done) {
    throw new Error("Tempo limite esgotado esperando a geração da imagem no AI Horde.");
  }

  // Get final status
  const resStatus = await fetch(urlStatus);
  if (!resStatus.ok) {
    throw new Error(`Falha ao obter status final da imagem: ${resStatus.status}`);
  }
  
  const dataStatus = await resStatus.json();
  if (!dataStatus.generations || dataStatus.generations.length === 0) {
    throw new Error("Nenhuma imagem retornada na resposta final do AI Horde.");
  }

  const imageUrl = dataStatus.generations[0].img;
  console.log(`[AI Horde] Imagem HQ gerada com sucesso! URL temporária: ${imageUrl} usando o modelo ${dataStatus.generations[0].model}`);

  // Fetch the image from Cloudflare R2 and convert to Base64 data URL
  const resImg = await fetch(imageUrl);
  if (!resImg.ok) {
    throw new Error(`Falha ao baixar a imagem final de Cloudflare: ${resImg.status}`);
  }

  const arrayBuffer = await resImg.arrayBuffer();
  const contentType = resImg.headers.get("content-type") || "image/jpeg";
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  
  return `data:${contentType};base64,${base64}`;
}
