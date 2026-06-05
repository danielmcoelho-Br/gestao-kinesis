import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, description, amount, category, bank, favorecido, isClinicEdit, resetClinic } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    const updateData: any = {};

    if (resetClinic) {
      updateData.clinicCat = 'UNMAPPED';
      updateData.clinicDesc = null;
      updateData.clinicAmount = null;
    } else {
      const baseDescForFav = (isClinicEdit ? (tx.clinicDesc ?? tx.description) : tx.description) || '';
      let currentFav = baseDescForFav.match(/\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i)?.[1] || '';
      if (favorecido !== undefined) {
        currentFav = favorecido ? favorecido.trim().toUpperCase() : '';
      }

      if (description !== undefined) {
        const cleanDesc = description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
        const finalDesc = currentFav ? `${cleanDesc} (${currentFav})` : cleanDesc;
        if (isClinicEdit) updateData.clinicDesc = finalDesc;
        else updateData.description = finalDesc;
      } else if (favorecido !== undefined) {
        const baseDesc = (isClinicEdit ? (tx.clinicDesc ?? tx.description) : tx.description) || '';
        const cleanDesc = baseDesc.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
        const finalDesc = currentFav ? `${cleanDesc} (${currentFav})` : cleanDesc;
        if (isClinicEdit) updateData.clinicDesc = finalDesc;
        else updateData.description = finalDesc;
      }

      if (amount !== undefined) {
        if (isClinicEdit) updateData.clinicAmount = parseFloat(amount) || 0;
        else updateData.amount = parseFloat(amount) || 0;
      }

      if (category !== undefined) {
        if (isClinicEdit) updateData.clinicCat = category ? category.toUpperCase() : null;
        else updateData.category = category ? category.toUpperCase() : null;
      }

      if (bank !== undefined) {
        updateData.bank = bank;
      }

      if (body.isChecked !== undefined) {
        updateData.isChecked = body.isChecked;
      }

      if (tx.type === 'INCOME' && currentFav) {
        if (isClinicEdit) updateData.clinicCat = currentFav;
        else updateData.category = currentFav;
      }
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
