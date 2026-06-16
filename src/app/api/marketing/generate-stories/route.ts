import { NextRequest, NextResponse } from "next/server";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, tone = "Educativo", quantity = 3, customRules = "" } = body;

    if (!theme) {
      return NextResponse.json({ error: "O tema (theme) é obrigatório." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave API do Gemini não configurada." }, { status: 500 });
    }

    const prompt = `
Você é um especialista em marketing digital especializado em clínicas de Fisioterapia e Pilates "Kinesis".
Sua tarefa é criar uma sequência de exatamente ${quantity} slides de Stories do Instagram sobre o seguinte tema:
Tema: "${theme}"
Tom de voz da publicação: "${tone}"

A sequência de stories deve ser envolvente, ter um fluxo lógico e convidar à interação.
Diretrizes para a sequência de stories:
1. Slide 1 (Gancho/Pergunta): Comece capturando a atenção com uma pergunta intrigante ou uma estatística chocante sobre o tema. Idealmente, inclua um sticker de enquete (poll) ou emoji-slider.
2. Slides intermediários (Conteúdo/Educação): Explique brevemente o problema e traga uma solução prática, dica de exercício ou alongamento, ou curiosidade científica.
3. Slide final (Chamada para Ação - CTA): Faça um convite claro (Ex: agendar uma avaliação, enviar uma dúvida na caixinha de perguntas, ver o link na bio). Recomenda-se usar um sticker de caixinha de perguntas (question) ou de enquete.

Tom de voz geral: Acolhedor, profissional, baseado em evidências científicas, mas simples e direto. Use emojis de forma moderada e quebras de linhas limpas para leitura em telas móveis.
${customRules ? `Regras adicionais de estilo, tom ou restrições que você DEVE obedecer rigorosamente: ${customRules}` : ""}

Você deve responder estritamente com um objeto JSON contendo o tema e a array de stories.
O JSON deve possuir exatamente a seguinte estrutura:
{
  "theme": "${theme}",
  "stories": [
    {
      "slideNumber": 1,
      "text": "Texto curto para exibir no slide. Deve ser direto e impactante (máximo 280 caracteres). Use emojis.",
      "sticker": {
        "type": "poll", // pode ser "poll", "question", "slider" ou "none"
        "question": "Pergunta curta para o sticker (máximo 40 caracteres, ex: 'Sente essa dor?' ou 'Quer saber mais?')",
        "options": ["Opção 1", "Opção 2"] // Apenas se type for "poll". Ex: ["Sim!", "Não"] ou ["Sinto muito", "Raramente"]. Máximo 2 opções.
      },
      "visualPrompt": "A detailed English prompt for an image generator (DALL-E/Pollinations AI) describing a fitting background image for this slide, matching the theme and tone, without any text in the image. e.g., 'A close up photo of a professional physiotherapist guiding an elderly person in a bright Pilates studio, soft natural light, clean aesthetic, high quality'"
    }
  ]
}

Responda APENAS o JSON válido. Não coloque blocos de código markdown (\`\`\`json) ou textos explicativos fora do JSON.
`;

    const response = await generateGeminiContent({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
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

    const parsedData = JSON.parse(textResult.trim());
    return NextResponse.json({ success: true, theme: parsedData.theme, stories: parsedData.stories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
