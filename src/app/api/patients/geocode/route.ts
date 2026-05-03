import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Google Maps não configurada no .env" }, { status: 400 });
    }

    // Buscar pacientes sem coordenadas
    const patientsToGeocode = await prisma.patient.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ],
        AND: [
          { address: { not: null, not: "" } }
        ]
      },
      take: 100 // Aumentado para processar mais de uma vez
    });

    if (patientsToGeocode.length === 0) {
      return NextResponse.json({ message: "Nenhum paciente pendente de geocodificação encontrado." });
    }

    let successCount = 0;
    let errorCount = 0;
    let lastStatus = "";

    for (const patient of patientsToGeocode) {
      try {
        // Limpeza básica do endereço para melhorar a precisão
        const cleanAddress = patient.address?.replace(/\r?\n|\r/g, " ").trim();
        const fullAddress = `${cleanAddress}, ${patient.provenance || ""}, Ribeirão Preto, SP, Brasil`;
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
        );
        const data = await response.json();
        lastStatus = data.status;

        if (data.status === "OK") {
          const { lat, lng } = data.results[0].geometry.location;
          await prisma.patient.update({
            where: { id: patient.id },
            data: { latitude: lat, longitude: lng }
          });
          successCount++;
        } else if (data.status === "OVER_QUERY_LIMIT") {
          // Se bater o limite, para o loop e retorna o que já foi feito
          break;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    const remaining = await prisma.patient.count({ 
      where: { 
        latitude: null, 
        address: { not: null, not: "" } 
      } 
    });

    return NextResponse.json({ 
      message: successCount > 0 ? `${successCount} endereços processados com sucesso.` : "Nenhum endereço processado.", 
      successCount, 
      errorCount,
      lastStatus,
      remaining
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
