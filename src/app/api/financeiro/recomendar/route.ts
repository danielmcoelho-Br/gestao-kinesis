import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Chave de API do Gemini não configurada no servidor (.env).' 
      }, { status: 500 });
    }

    const { transactions } = await req.json();
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Nenhuma transação fornecida para classificação.' }, { status: 400 });
    }

    // 1. Fetch some historical mapped transactions to serve as few-shot examples
    const examples = await prisma.transaction.findMany({
      where: {
        OR: [
          { clinicCat: { not: 'UNMAPPED' } },
          { category: { not: 'RECEBIMENTO' } }
        ],
        isChecked: true
      },
      take: 30,
      orderBy: {
        date: 'desc'
      },
      select: {
        description: true,
        clinicDesc: true,
        category: true,
        clinicCat: true,
        amount: true,
        type: true
      }
    });

    // 2. Build the context and prompt
    const systemInstruction = `Você é o Assistente de Classificação Financeira Kinesis. Seu trabalho é analisar transações bancárias não classificadas e sugerir:
1. "favorecido": O sócio, área ou destino (deve ser EXCLUSIVAMENTE um dos seguintes: DANIEL, STUART, PAULA, KINESIS, PILATES, FUNDO, ou vazio "" se nenhum desses se aplicar).
2. "categoria": Para despesas/saídas (type: EXPENSE), a categoria do custo (deve ser uma de: GERAL, SECRETARIA, KINESIS, CPFL_SALA_01, CPFL_SALA_02, CPFL_SALA_03, CPFL_SALA_04, CPFL_SALA_05, CPFL_SALA_06, OUTROS). Para receitas (type: INCOME), o favorecido ou RECEBIMENTO.

Você deve responder APENAS com um array JSON válido contendo os objetos classificados no formato abaixo, sem tags markdown ou explicações externas:
[
  {
    "id": "id_da_transacao",
    "favorecido": "DANIEL | STUART | PAULA | KINESIS | PILATES | FUNDO | \\"\\"",
    "categoria": "CATEGORIA_MAPEADA",
    "justificativa": "breve explicação"
  }
]`;

    const formattedExamples = examples.map(e => ({
      descrição: e.clinicDesc || e.description,
      valor: e.amount,
      tipo: e.type,
      categoria_atribuida: e.clinicCat || e.category,
      favorecido_atribuido: (e.clinicDesc || e.description).match(/\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i)?.[1]?.toUpperCase() || ""
    }));

    const unmappedInput = transactions.map(t => ({
      id: t.id,
      descrição: t.description,
      valor: t.amount,
      tipo: t.type,
      data: t.date
    }));

    const userPrompt = `Abaixo estão exemplos de classificações anteriores na clínica:
${JSON.stringify(formattedExamples, null, 2)}

Por favor, classifique a seguinte lista de transações não classificadas:
${JSON.stringify(unmappedInput, null, 2)}

Retorne APENAS o JSON conforme especificado nas instruções.`;

    // 3. Query the Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("[GEMINI_RECOMENDAR] API Error:", errText);
      return NextResponse.json({ error: `Erro na API do Gemini: ${geminiResponse.status}` }, { status: geminiResponse.status });
    }

    const resData = await geminiResponse.json();
    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Parse response
    let suggestions = [];
    try {
      suggestions = JSON.parse(rawText.trim());
    } catch (parseError) {
      console.error("[GEMINI_RECOMENDAR] Error parsing Gemini JSON output. Raw output was:", rawText);
      // Clean up markdown block format just in case the model ignored responseMimeType
      const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      suggestions = JSON.parse(cleanedText);
    }

    return NextResponse.json({ success: true, recommendations: suggestions });
  } catch (error: any) {
    console.error("[GEMINI_RECOMENDAR] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
