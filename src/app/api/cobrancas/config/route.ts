import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    }

    const config = await prisma.billingConfig.findUnique({
      where: {
        month_year: {
          month,
          year,
        },
      },
    });

    return NextResponse.json(config || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      month, 
      year, 
      notaFiscalPatients, 
      emitaPatients, 
      patientEntities, 
      patientSubEntities, 
      taxRate, 
      patientSplits, 
      manualInvoices, 
      patientEditedValues 
    } = body;

    if (month === undefined || year === undefined) {
      return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    }

    const config = await prisma.billingConfig.upsert({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        notaFiscalPatients: JSON.stringify(notaFiscalPatients || []),
        emitaPatients: JSON.stringify(emitaPatients || []),
        patientEntities: JSON.stringify(patientEntities || {}),
        patientSubEntities: JSON.stringify(patientSubEntities || {}),
        taxRate: parseFloat(taxRate || 0),
        patientSplits: JSON.stringify(patientSplits || {}),
        manualInvoices: JSON.stringify(manualInvoices || []),
        patientEditedValues: JSON.stringify(patientEditedValues || {}),
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        notaFiscalPatients: JSON.stringify(notaFiscalPatients || []),
        emitaPatients: JSON.stringify(emitaPatients || []),
        patientEntities: JSON.stringify(patientEntities || {}),
        patientSubEntities: JSON.stringify(patientSubEntities || {}),
        taxRate: parseFloat(taxRate || 0),
        patientSplits: JSON.stringify(patientSplits || {}),
        manualInvoices: JSON.stringify(manualInvoices || []),
        patientEditedValues: JSON.stringify(patientEditedValues || {}),
      },
    });

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
