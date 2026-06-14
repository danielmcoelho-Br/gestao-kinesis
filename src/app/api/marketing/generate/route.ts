import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, focusAreas = [], customKeywords = "", customSource = "", customImage = null } = body;

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart é obrigatório." }, { status: 400 });
    }

    const parsedWeekStart = new Date(weekStart);
    if (isNaN(parsedWeekStart.getTime())) {
      return NextResponse.json({ error: "weekStart inválido." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave API do Gemini não configurada." }, { status: 500 });
    }

    const weekStartStr = parsedWeekStart.toISOString().split('T')[0];

    const prompt = `
Você é uma equipe de IAs especialistas em marketing de saúde para a clínica de Fisioterapia e Pilates "Kinesis".
Sua tarefa é planejar e criar exatamente 3 postagens completas de rede social (uma para Segunda-feira, uma para Quarta-feira e uma para Sexta-feira) para a semana de ${weekStartStr}.

Informações de entrada do usuário para direcionar os temas:
- Áreas de foco desejadas: ${focusAreas.length > 0 ? focusAreas.join(", ") : "Ortopedia, Geriatria, Reumatologia, Pilates"}
- Palavras-chave ou ideias adicionais: ${customKeywords || 'Nenhuma'}
- Notícia fonte ou texto bruto fornecido pelo usuário (use isso como base para reescrever se presente): ${customSource || 'Nenhuma'}

Sua equipe é composta pelos seguintes agentes virtuais:
1. **🔎 Agente Pesquisador:** Levanta temas científicos de alta relevância ou notícias recentes nas áreas de foco, ou sintetiza a notícia/texto bruto fornecida pelo usuário.
2. **✍️ Agente Redator:** Redige a legenda completa para o Instagram. O tom de voz deve ser acolhedor, profissional, baseado em autoridade científica, mas acessível. Inclua quebras de parágrafo limpas, emojis e hashtags relevantes no final do texto.
3. **🎨 Agente de Design:** Cria um prompt descritivo detalhado em inglês para geradores de imagem (como DALL-E) que ilustre a postagem de forma poética e profissional. Não inclua texto escrito na imagem.
4. **🔎 Agente Revisor:** Revisa toda a fisiologia, terminologia médica (deve ser impecável e baseada em evidências) e concordância gramatical.

Você deve responder estritamente com um objeto JSON contendo uma chave "posts", que é uma array de exatamente 3 objetos. Cada objeto deve possuir exatamente as seguintes chaves:
- "dayOfWeek": O dia correspondente ("Segunda-feira", "Quarta-feira" ou "Sexta-feira")
- "title": Título curto e chamativo do post
- "sourceTopic": O assunto científico, estudo ou notícia que serviu de base (explicando em 1 ou 2 frases)
- "content": A legenda completa gerada para o feed do Instagram (com parágrafos estruturados, emojis e hashtags)
- "imagePrompt": O prompt em inglês bem detalhado para gerar a imagem ilustrativa no DALL-E
- "storyContent": Uma sugestão criativa e interativa de Story para o Instagram para esse mesmo dia, utilizando a mesma proposta/tema do post (pode incluir sugestões de enquetes, caixas de perguntas, texto curto ou roteiro rápido para falar nos stories).

Exemplo de formato esperado:
{
  "posts": [
    {
      "dayOfWeek": "Segunda-feira",
      "title": "Dor no Ombro ao Dormir: O que Fazer?",
      "sourceTopic": "Diretriz da sociedade brasileira de ortopedia sobre lesões de manguito rotador e posições de repouso.",
      "content": "Você já acordou no meio da noite com aquela dor incômoda no ombro... [conteúdo do post] #fisioterapia #manguitorotador",
      "imagePrompt": "A close up photo of a person sleeping comfortably on their side on a orthopedic pillow, soft morning light, hyperrealistic",
      "storyContent": "💡 Dica rápida sobre dor no ombro! Quem aí também sofre para dormir? [caixa de perguntas: Qual seu lado preferido para dormir?] Veja a dica do post de hoje para aliviar o incômodo!"
    }
  ]
}

Responda APENAS o JSON válido. Não coloque blocos de código markdown (\`\`\`json) ou textos explicativos fora do JSON.
`;

    const parts: any[] = [{ text: prompt }];

    if (customImage && customImage.startsWith("data:")) {
      const mimeType = customImage.substring(5, customImage.indexOf(";"));
      const base64Data = customImage.substring(customImage.indexOf("base64,") + 7);
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    const response = await generateGeminiContent({
      contents: [
        {
          parts
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

    // Parse the JSON result
    const parsedData = JSON.parse(textResult.trim());
    if (!parsedData.posts || !Array.isArray(parsedData.posts)) {
      return NextResponse.json({ error: "Formato de JSON inválido retornado pelo Gemini." }, { status: 500 });
    }

    // Delete existing posts for this week to prevent clutter
    const startOfWeek = new Date(parsedWeekStart);
    startOfWeek.setUTCHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7);

    await prisma.marketingPost.deleteMany({
      where: {
        weekStart: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      }
    });

    // Save newly generated posts
    const createdPosts = [];
    for (const p of parsedData.posts) {
      const created = await prisma.marketingPost.create({
        data: {
          weekStart: startOfWeek,
          dayOfWeek: p.dayOfWeek,
          title: p.title,
          sourceTopic: p.sourceTopic,
          content: p.content,
          imagePrompt: p.imagePrompt,
          imageUrl: customImage,
          storyContent: p.storyContent || null,
          status: "DRAFT"
        }
      });
      createdPosts.push(created);
    }

    return NextResponse.json({ success: true, posts: createdPosts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
