import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isPlaceholderAddress(address: string): boolean {
  if (!address) return true;
  const clean = address.trim().toLowerCase();
  
  if (
    clean === "nº - , - ," ||
    clean === "nº - ," ||
    clean === "nº - xxx, ribeirão preto - sp," ||
    clean === "nº - xxx, araraquara - sp," ||
    clean.startsWith("nº - xxx") ||
    clean.startsWith("nº - ,")
  ) {
    return true;
  }
  
  const stripped = clean.replace(/[nº\-\s,x]/gi, "");
  if (stripped === "" || stripped === "ribeiraopretosp" || stripped === "araraquarasp") {
    return true;
  }
  
  return false;
}

function formatAddressForGeocoding(address: string): string {
  if (!address) return "";
  
  // 1. Basic clean up of line breaks and extra spaces
  let clean = address.replace(/\r?\n|\r/g, " ").trim();
  
  // 2. Remove "Nº -" or "Nº - xxx" or "Nº - XXX" or similar placeholders
  clean = clean.replace(/N[oº]\s*-\s*(?:xxx|XXX)?/gi, "");
  // Remove standalone "- xxx" or "- XXX"
  clean = clean.replace(/-\s*(?:xxx|XXX)/gi, "");
  
  // 3. Clean up the placeholder commas/hyphens
  clean = clean.replace(/-\s*,\s*-\s*,/g, ",");
  clean = clean.replace(/-\s*,\s*,/g, ",");
  clean = clean.replace(/,\s*-\s*,/g, ",");
  clean = clean.replace(/\s*-\s*,\s*/g, ", ");
  clean = clean.replace(/,\s*-\s*$/g, "");
  clean = clean.replace(/-\s*,\s*$/g, "");
  
  // Clean up multiple commas, spaces, hyphens
  clean = clean.replace(/,\s*,+/g, ",");
  clean = clean.replace(/-\s*-+/g, "-");
  clean = clean.replace(/\s+/g, " ");
  clean = clean.trim();
  
  // Remove spaces before commas
  clean = clean.replace(/\s+,\s*/g, ", ");
  
  // Remove trailing/leading punctuation
  clean = clean.replace(/^[\s,:-]+|[\s,:-]+$/g, "");
  
  // 4. City and Country logic
  const hasState = /\b(SP|MG|RJ|PR|SC|RS|BA|GO|DF)\b/i.test(clean);
  const hasRibeirao = /Ribeir[aã]o\s+Preto/i.test(clean);
  
  if (hasState) {
    if (!clean.toLowerCase().includes("brasil")) {
      clean += ", Brasil";
    }
  } else {
    if (hasRibeirao) {
      clean += ", SP, Brasil";
    } else {
      clean += ", Ribeirão Preto, SP, Brasil";
    }
  }
  
  return clean;
}

async function fetchNominatim(query: string): Promise<{ lat: number, lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "KinesisApp/1.0 (contact: danielmcoelho-Br/gestao-kinesis)"
      }
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
  } catch (error) {
    console.error("Error fetching Nominatim:", error);
  }
  return null;
}

async function geocodePatient(
  address: string,
  useNominatim: boolean,
  apiKey: string | undefined
): Promise<{ lat: number, lng: number } | null> {
  
  if (isPlaceholderAddress(address)) {
    return { lat: 0, lng: 0 };
  }

  const cleanAddress = formatAddressForGeocoding(address);
  if (!cleanAddress) return { lat: 0, lng: 0 };

  const queries: string[] = [cleanAddress];

  const noNumber = cleanAddress.replace(/N[oº]\s*\d+/gi, "").replace(/\s+/g, " ").trim();
  if (noNumber && noNumber !== cleanAddress) {
    queries.push(noNumber);
  }

  const parts = address.split("-").map(p => p.trim());
  if (parts.length >= 2) {
    const neighborhood = parts[1];
    const isBairroPlaceholder = 
      neighborhood === "" || 
      neighborhood.toLowerCase() === "xxx" || 
      /^\s*,\s*$/.test(neighborhood);

    if (!isBairroPlaceholder) {
      let cityAndState = "Ribeirão Preto, SP";
      if (cleanAddress.toLowerCase().includes("cravinhos")) {
        cityAndState = "Cravinhos, SP";
      } else if (cleanAddress.toLowerCase().includes("araraquara")) {
        cityAndState = "Araraquara, SP";
      } else if (cleanAddress.toLowerCase().includes("santa rita do passa quatro")) {
        cityAndState = "Santa Rita do Passa Quatro, SP";
      } else if (cleanAddress.toLowerCase().includes("bonfim paulista")) {
        cityAndState = "Bonfim Paulista, SP";
      }
      
      queries.push(`${neighborhood}, ${cityAndState}, Brasil`);
    }
  }

  for (let q = 0; q < queries.length; q++) {
    const query = queries[q];
    
    if (useNominatim) {
      if (q > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const coords = await fetchNominatim(query);
      if (coords) {
        return { lat: coords.lat, lng: coords.lon };
      }
    } else {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
        );
        const data = await response.json();
        if (data.status === "OK") {
          const { lat, lng } = data.results[0].geometry.location;
          return { lat, lng };
        } else if (data.status === "OVER_QUERY_LIMIT") {
          return null;
        }
      } catch (err) {
        console.error("Google Maps geocoding error:", err);
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const useNominatim = !apiKey;

    const batchSize = useNominatim ? 10 : 50;

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
      take: batchSize
    });

    if (patientsToGeocode.length === 0) {
      return NextResponse.json({ message: "Nenhum paciente pendente de geocodificação encontrado." });
    }

    let successCount = 0;
    let errorCount = 0;
    let placeholderCount = 0;
    let lastStatus = "";

    for (let i = 0; i < patientsToGeocode.length; i++) {
      const patient = patientsToGeocode[i];
      try {
        if (useNominatim && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const coords = await geocodePatient(patient.address || "", useNominatim, apiKey);

        if (coords) {
          await prisma.patient.update({
            where: { id: patient.id },
            data: { latitude: coords.lat, longitude: coords.lng }
          });
          if (coords.lat === 0 && coords.lng === 0) {
            placeholderCount++;
          } else {
            successCount++;
          }
          lastStatus = "OK";
        } else {
          errorCount++;
          lastStatus = useNominatim ? "Nominatim geocoding error" : "Google OVER_QUERY_LIMIT or error";
          if (!useNominatim) {
            break;
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
      message: `${successCount} endereços geocodificados com sucesso. ${placeholderCount} placeholders marcados como 0,0.`, 
      successCount, 
      placeholderCount,
      errorCount,
      lastStatus,
      remaining,
      hasGoogleMapsKey: !useNominatim
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
