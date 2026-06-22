import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const useNominatim = !apiKey;

    // Buscar pacientes sem coordenadas
    const patientsToGeocode = await prisma.patient.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ],
        AND: [
          { address: { not: null } },
          { address: { not: "" } }
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

    for (let i = 0; i < patientsToGeocode.length; i++) {
      const patient = patientsToGeocode[i];
      try {
        // Limpeza básica do endereço para melhorar a precisão
        const cleanAddress = patient.address?.replace(/\r?\n|\r/g, " ").trim();
        const fullAddress = `${cleanAddress}, ${patient.provenance || ""}, Ribeirão Preto, SP, Brasil`;
        
        if (useNominatim) {
          if (i > 0) {
            // Atraso de 1 segundo para respeitar limites de taxa do Nominatim (max 1 req/sec)
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`,
            {
              headers: {
                "User-Agent": "KinesisApp/1.0 (contact: danielmcoelho-Br/gestao-kinesis)"
              }
            }
          );
          if (!response.ok) {
            errorCount++;
            lastStatus = `Nominatim HTTP error: ${response.status}`;
            continue;
          }
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              await prisma.patient.update({
                where: { id: patient.id },
                data: { latitude: lat, longitude: lng }
              });
              successCount++;
              lastStatus = "OK";
            } else {
              errorCount++;
              lastStatus = "Invalid coordinates format";
            }
          } else {
            errorCount++;
            lastStatus = "No results found";
          }
        } else {
          // Google Maps
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
        }
      } catch (err: any) {
        errorCount++;
        lastStatus = err.message || "Unknown error";
      }
    }

    const remaining = await prisma.patient.count({ 
      where: { 
        latitude: null, 
        AND: [
          { address: { not: null } },
          { address: { not: "" } }
        ]
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
