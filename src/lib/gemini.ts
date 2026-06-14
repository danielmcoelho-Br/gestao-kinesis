export async function generateGeminiContent(
  payload: {
    contents: any[];
    systemInstruction?: { parts: any[] };
    generationConfig?: any;
  },
  apiKey: string
): Promise<Response> {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite"
  ];

  let lastError: any = null;
  
  for (const model of models) {
    try {
      console.log(`[Gemini] Tentando chamar o modelo: ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // If status is 200, return the response directly
      if (res.status === 200) {
        console.log(`[Gemini] Sucesso com o modelo: ${model}`);
        return res;
      }

      // Read error text for logging
      const errText = await res.text();
      console.warn(`[Gemini] Modelo ${model} falhou com status ${res.status}: ${errText.substring(0, 200)}`);
      lastError = { status: res.status, text: errText };

    } catch (e: any) {
      console.error(`[Gemini] Erro de rede ou exceção ao chamar ${model}:`, e);
      lastError = e;
    }
  }

  // If all models failed, return a mock Response with the error
  const errMsg = lastError?.text || lastError?.message || "Todos os modelos Gemini falharam.";
  const errStatus = lastError?.status || 500;
  
  return new Response(JSON.stringify({ error: `Gemini API error: ${errMsg}` }), {
    status: errStatus,
    headers: { "Content-Type": "application/json" }
  });
}
