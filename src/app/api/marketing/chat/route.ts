import { NextRequest, NextResponse } from "next/server";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages = [] } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave API do Gemini não configurada." }, { status: 500 });
    }

    const systemPrompt = `
Você é o Assistente de Marketing IA da Clínica Kinesis (Fisioterapia e Pilates).
Seu papel é ajudar o Daniel (administrador) a:
1. Sugerir ideias de posts de saúde (especialmente focados em Ortopedia, Pilates, Geriatria e Reumatologia).
2. Escrever e revisar legendas de posts para Instagram/Facebook.
3. Sugerir ideias criativas de imagens e prompts de design.
4. Elaborar estratégias de engajamento para pacientes da clínica.

Responda de forma profissional, simpática, acolhedora e focada em marketing ético de saúde baseado em evidências.
Mantenha suas respostas organizadas, usando emojis de forma equilibrada e bullet points quando apropriado.
`;

    // Map roles to Gemini API format ("user" / "model")
    const contents = messages.map((msg: any) => {
      const role = msg.role === "assistant" ? "model" : "user";
      const parts: any[] = [{ text: msg.content || "" }];
      
      if (msg.image && msg.image.startsWith("data:")) {
        const mimeType = msg.image.substring(5, msg.image.indexOf(";"));
        const base64Data = msg.image.substring(msg.image.indexOf("base64,") + 7);
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }
      
      return {
        role,
        parts
      };
    });

    const response = await generateGeminiContent({
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    }, apiKey);

    if (!response.ok) {
      const errJson = await response.json();
      return NextResponse.json({ error: errJson.error || "Erro na chamada do Gemini." }, { status: response.status });
    }

    const resJson = await response.json();
    const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      return NextResponse.json({ error: "Resposta vazia da API do Gemini." }, { status: 500 });
    }

    return NextResponse.json({ reply: textResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
