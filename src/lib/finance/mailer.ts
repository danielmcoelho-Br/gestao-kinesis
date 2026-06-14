import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { EXCEL_ITEMS, runFinancialCalculations } from './calculations';
import * as XLSX from 'xlsx';

const monthsPt = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export async function sendClosingReportEmail(month: number, year: number) {
  try {
    const monthName = monthsPt[month];
    console.log(`[MAILER] Starting email generation for month: ${monthName} / ${year}`);

    // 1. Fetch transactions and run calculations
    const startDate = new Date(Date.UTC(year, month, 1, 3, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 1, 2, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        OR: [
          { ownerId: null },
          { ownerId: { not: 'DELETED' } }
        ]
      }
    });

    const calc = runFinancialCalculations(transactions, month, year);
    const {
      totalGeral, totalSecretaria, totalKinesis, cpflSum, cpflSala02,
      totalArrecadado, totalShared, saldoFinal,
      arrecadadoPilates, juliaPilates, ausenciaPilates, custosPilates, impostoPilates, saldoFinalPilates,
      danielShare, stuartShare, paulaShare,
      fundoVal, totalExclusivoFisio, totalExclusivoPilates,
      findMappedTransaction, allMappedIds
    } = calc;

    // 2. Fetch partners' email addresses (users who are not SECRETARIA / Secretaria / secretaria)
    const partners = await prisma.user.findMany({
      where: {
        role: {
          notIn: ['SECRETARIA', 'Secretaria', 'secretaria']
        }
      },
      select: { email: true, name: true }
    });

    let recipientEmails = partners
      .map(p => p.email?.trim().toLowerCase())
      .filter((email): email is string => !!email && email !== 'kinesisrp@gmail.com');

    // Add Paula's email if not already present
    const paulaEmail = 'paula.polizello@kinesis.com.br';
    if (!recipientEmails.includes(paulaEmail)) {
      recipientEmails.push(paulaEmail);
    }

    if (recipientEmails.length === 0) {
      console.warn("[MAILER] No partner email addresses found in the database. Defaulting to empty list.");
    }

    // 3. Build HTML Body
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fechamento Financeiro Clínico - Kinesis</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500; }
            .content { padding: 30px 24px; }
            .message { font-size: 14px; color: #475569; margin-bottom: 24px; }
            .card { background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
            .card h2 { margin: 0 0 14px 0; font-size: 14px; font-weight: 800; color: #0f172a; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
            td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #475569; }
            td.label { font-weight: 600; color: #334155; }
            td.value { text-align: right; font-weight: 800; }
            tr.total-row td { border-top: 1.5px solid #e2e8f0; border-bottom: none; font-weight: 900; font-size: 13px; color: #0f172a; padding-top: 12px; }
            .text-green { color: #16a34a; }
            .text-red { color: #dc2626; }
            .grid-3 { display: table; width: 100%; border-spacing: 12px 0; margin-left: -12px; margin-right: -12px; }
            .grid-col { display: table-cell; width: 33.33%; background-color: #ffffff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 12px; }
            .grid-col strong { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; }
            .grid-col .val { font-size: 15px; font-weight: 900; color: #1e3a8a; margin-top: 4px; }
            .grid-col .breakdown { font-size: 10px; color: #475569; margin-top: 8px; line-height: 1.4; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .footer a { color: #4f46e5; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fechamento Financeiro Clínico</h1>
              <p>Clínica Kinesis — Fechamento Oficial de ${monthName} de ${year}</p>
            </div>
            <div class="content">
              <div class="message">
                Olá sócios, o período de <strong>${monthName} de ${year}</strong> foi oficialmente fechado para edições e reconciliado. Segue abaixo o resumo consolidado de desempenho e distribuição dos lucros:
              </div>

              <!-- Fisioterapia Card -->
              <div class="card">
                <h2>Resumo Fisioterapia (40 / 40 / 20)</h2>
                <table>
                  <tr>
                    <td class="label">Faturamento Arrecadado</td>
                    <td class="value text-green">R$ ${totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td class="label">Custos Compartilhados (Rateio)</td>
                    <td class="value text-red">- R$ ${totalShared.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td class="label">Custos Exclusivos (100% Fisio)</td>
                    <td class="value text-red">- R$ ${totalExclusivoFisio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr class="total-row">
                    <td>LUCRO LÍQUIDO FISIOTERAPIA</td>
                    <td class="value ${saldoFinal >= 0 ? 'text-green' : 'text-red'}">R$ ${saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>

              <!-- Pilates Card -->
              <div class="card">
                <h2>Resumo Pilates (1/3 Cada)</h2>
                <table>
                  <tr>
                    <td class="label">Faturamento Operacional</td>
                    <td class="value text-green">R$ ${(juliaPilates + ausenciaPilates).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td class="label">Custos Operacionais (Rateio)</td>
                    <td class="value text-red">- R$ ${custosPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td class="label">Custos Exclusivos (100% Pilates)</td>
                    <td class="value text-red">- R$ ${totalExclusivoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td class="label">Imposto Pilates</td>
                    <td class="value text-red">- R$ ${impostoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr class="total-row">
                    <td>LUCRO LÍQUIDO PILATES</td>
                    <td class="value ${saldoFinalPilates >= 0 ? 'text-green' : 'text-red'}">R$ ${saldoFinalPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>

              <!-- Partners Distribution Card -->
              <div class="card">
                <h2>Distribuição Consolidada de Sócios</h2>
                <div class="grid-3">
                  <!-- Daniel -->
                  <div class="grid-col" style="border-left: 3px solid #16a34a;">
                    <strong>Daniel</strong>
                    <div class="val text-green">R$ ${danielShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div class="breakdown">
                      Fisio (40%): R$ ${(saldoFinal * 0.4).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}<br/>
                      Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}<br/>
                      Reembolso/Aj: R$ ${(calc.danielPaid + calc.danielAdj - calc.crisEarning).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <!-- Stuart -->
                  <div class="grid-col" style="border-left: 3px solid #3b82f6;">
                    <strong>Stuart</strong>
                    <div class="val text-green">R$ ${stuartShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div class="breakdown">
                      Fisio (40%): R$ ${(saldoFinal * 0.4).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}<br/>
                      Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}<br/>
                      Reembolso/Aj: R$ ${(calc.stuartPaid + calc.stuartAdj).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <!-- Paula -->
                  <div class="grid-col" style="border-left: 3px solid #ec4899;">
                    <strong>Paula</strong>
                    <div class="val text-green">R$ ${paulaShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div class="breakdown">
                      Fisio (20%): R$ ${(saldoFinal * 0.2).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}<br/>
                      Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}<br/>
                      Reembolso/Aj: R$ ${(calc.paulaPaid + calc.paulaAdj).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>

              <div class="message" style="margin-top: 24px; font-size: 12px;">
                * Em anexo a esta mensagem seguem as planilhas oficiais de fluxo e de custos consolidadas referentes a este fechamento para arquivamento ou análise.
              </div>
            </div>
            <div class="footer">
              Este e-mail foi enviado automaticamente pelo <a href="#">Gestão Kinesis</a>.<br/>
              © 2026 Clínica Kinesis. Todos os direitos reservados.
            </div>
          </div>
        </body>
      </html>
    `;

    // 4. Generate attachments dynamically (Excel and PDF)
    const allMappedTransactions = transactions.map((t: any) => ({
      ...t,
      description: t.clinicDesc ?? t.description,
      amount: t.clinicAmount ?? t.amount,
      category: t.clinicCat ?? t.category,
      favorecido: t.clinicFavorecido || t.favorecido
    }));

    // --- Excel Generation ---
    const wb = XLSX.utils.book_new();
    const excelRows: any[][] = [];
    
    excelRows.push(["RELATÓRIO DE CUSTOS E PARTILHA DA CLÍNICA"]);
    excelRows.push([`${monthName.toUpperCase()} DE ${year}`]);
    excelRows.push([]);

    const addExcelBlock = (title: string, blockName: string, itemsList: any[], total: number) => {
      excelRows.push([title.toUpperCase()]);
      excelRows.push(["Item", "Lançamento Vinculado", "Pago por", "Valor (R$)"]);

      const hiddenItemKeys = allMappedTransactions
        .filter((t: any) => t.bank === 'HIDDEN_ITEM')
        .map((t: any) => (t.description || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim());
      const visibleItems = itemsList.filter(i => !hiddenItemKeys.includes(i.key));

      visibleItems.forEach(item => {
        const tx = findMappedTransaction(item);
        excelRows.push([
          item.label,
          tx ? (tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '') : '--',
          tx ? tx.favorecido || 'KINESIS' : '--',
          tx ? (tx.clinicAmount ?? tx.amount) : 0
        ]);
      });

      const blockCat = blockName === 'cpfl' ? null : blockName.toUpperCase();
      const extraItems = blockName === 'exclusivo'
        ? allMappedTransactions.filter((t: any) =>
            t.type === 'EXPENSE' &&
            ['EXCLUSIVO_FISIO', 'EXCLUSIVO_PILATES'].includes(t.category?.toUpperCase() || '')
          )
        : (blockCat ? allMappedTransactions.filter((t: any) =>
            t.type === 'EXPENSE' &&
            t.category?.toUpperCase() === blockCat &&
            !allMappedIds.includes(t.id)
          ) : []);

      extraItems.forEach((tx: any) => {
        const catName = tx.category === 'EXCLUSIVO_FISIO' ? 'EXCLUSIVO FISIOTERAPIA' : tx.category === 'EXCLUSIVO_PILATES' ? 'EXCLUSIVO PILATES' : 'Despesa Extra';
        excelRows.push([
          (tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, ''),
          catName,
          tx.favorecido || 'KINESIS',
          (tx.clinicAmount ?? tx.amount)
        ]);
      });

      excelRows.push([`TOTAL ${title.toUpperCase()}`, "", "", total]);
      excelRows.push([]);
    };

    addExcelBlock("Gastos Gerais", "geral", EXCEL_ITEMS.filter((i: any) => i.block === 'geral'), totalGeral);
    addExcelBlock("Gastos Secretária", "secretaria", EXCEL_ITEMS.filter((i: any) => i.block === 'secretaria'), totalSecretaria);
    addExcelBlock("Gastos Kinesis", "kinesis", EXCEL_ITEMS.filter((i: any) => i.block === 'kinesis'), totalKinesis);
    addExcelBlock("CPFL por Sala", "cpfl", EXCEL_ITEMS.filter((i: any) => i.block === 'cpfl'), cpflSum + cpflSala02);
    addExcelBlock("Custos Exclusivos (100% Área)", "exclusivo", [], totalExclusivoFisio + totalExclusivoPilates);

    excelRows.push(["RESUMO DA PARTILHA E RATEIO FINAL"]);
    excelRows.push(["Fisioterapia - Lucro Líquido", "", "", saldoFinal]);
    excelRows.push(["Pilates - Lucro Líquido", "", "", saldoFinalPilates]);
    excelRows.push([]);

    excelRows.push(["DISTRIBUIÇÃO CONSOLIDADA DE SÓCIOS"]);
    excelRows.push(["Sócio", "Fisioterapia", "Pilates", "Reembolso", "Ajustes", "Participação Sócio"]);
    excelRows.push(["Daniel", saldoFinal * 0.4, saldoFinalPilates / 3, calc.danielPaid || 0, (calc.danielAdj || 0) - (calc.crisEarning || 0), danielShare]);
    excelRows.push(["Stuart", saldoFinal * 0.4, saldoFinalPilates / 3, calc.stuartPaid || 0, calc.stuartAdj || 0, stuartShare]);
    excelRows.push(["Paula", saldoFinal * 0.2, saldoFinalPilates / 3, calc.paulaPaid || 0, calc.paulaAdj || 0, paulaShare]);

    const excelWs = XLSX.utils.aoa_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(wb, excelWs, "Custos da Clínica");
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // --- PDF Generation ---
    const pdfmake = require('pdfmake');
    pdfmake.setFonts({
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    });

    const pdfContent: any[] = [
      { text: `Fechamento Financeiro Clínico - Kinesis (${monthName}/${year})`, fontSize: 16, bold: true, color: '#0f172a', margin: [0, 0, 0, 2] },
      { text: `Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, fontSize: 8, color: '#64748b', margin: [0, 0, 0, 15] },
      
      { text: 'Resumo da Partilha e Rateio Final', fontSize: 11, bold: true, color: '#1e293b', margin: [0, 10, 0, 6] },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Fisioterapia', fontSize: 10, bold: true, color: '#1e293b', margin: [0, 0, 0, 4] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [{ text: 'Custos Compartilhados:', fontSize: 8 }, { text: `- R$ ${totalShared.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right' }],
                    [{ text: 'Custos Exclusivos:', fontSize: 8 }, { text: `- R$ ${totalExclusivoFisio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right' }],
                    [{ text: 'Faturamento Arrecadado:', fontSize: 8 }, { text: `+ R$ ${totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right' }],
                    [{ text: 'LUCRO LÍQUIDO FISIO:', fontSize: 8, bold: true }, { text: `R$ ${saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right', bold: true }]
                  ]
                },
                layout: 'noBorders'
              }
            ],
            margin: [0, 0, 10, 0]
          },
          {
            width: '*',
            stack: [
              { text: 'Pilates', fontSize: 10, bold: true, color: '#1e293b', margin: [0, 0, 0, 4] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [{ text: 'Custos Operacionais:', fontSize: 8 }, { text: `- R$ ${custosPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right' }],
                    [{ text: 'Custos Exclusivos:', fontSize: 8 }, { text: `- R$ ${totalExclusivoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right' }],
                    [{ text: 'Lucro Bruto:', fontSize: 8 }, { text: `+ R$ ${(juliaPilates + ausenciaPilates).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right' }],
                    [{ text: 'Imposto Pilates:', fontSize: 8 }, { text: `- R$ ${impostoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right' }],
                    [{ text: 'LUCRO LÍQUIDO PILATES:', fontSize: 8, bold: true }, { text: `R$ ${saldoFinalPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, alignment: 'right', bold: true }]
                  ]
                },
                layout: 'noBorders'
              }
            ]
          }
        ],
        margin: [0, 0, 0, 15]
      },

      { text: 'Distribuição Consolidada de Sócios', fontSize: 11, bold: true, color: '#1e293b', margin: [0, 10, 0, 6] },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Daniel', bold: true, fontSize: 9, color: '#16a34a', margin: [0, 0, 0, 3] },
              { text: `Fisio (40%): R$ ${(saldoFinal * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Reembolso: R$ ${(calc.danielPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Ajustes/Cris: R$ ${((calc.danielAdj || 0) - (calc.crisEarning || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `PARTICIPAÇÃO: R$ ${danielShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bold: true, fontSize: 8, margin: [0, 3, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { text: 'Stuart', bold: true, fontSize: 9, color: '#3b82f6', margin: [0, 0, 0, 3] },
              { text: `Fisio (40%): R$ ${(saldoFinal * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Reembolso: R$ ${(calc.stuartPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Ajustes: R$ ${(calc.stuartAdj || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `PARTICIPAÇÃO: R$ ${stuartShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bold: true, fontSize: 8, margin: [0, 3, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { text: 'Paula', bold: true, fontSize: 9, color: '#ec4899', margin: [0, 0, 0, 3] },
              { text: `Fisio (20%): R$ ${(saldoFinal * 0.2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Reembolso: R$ ${(calc.paulaPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `Ajustes: R$ ${(calc.paulaAdj || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5 },
              { text: `PARTICIPAÇÃO: R$ ${paulaShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bold: true, fontSize: 8, margin: [0, 3, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      { text: 'Detalhamento dos Custos', fontSize: 11, bold: true, color: '#1e293b', margin: [0, 10, 0, 6] }
    ];

    const addPdfBlock = (title: string, blockName: string, total: number) => {
      const items = blockName === 'exclusivo' ? [] : EXCEL_ITEMS.filter((i: any) => i.block === blockName);
      const hiddenItemKeys = allMappedTransactions
        .filter((t: any) => t.bank === 'HIDDEN_ITEM')
        .map((t: any) => (t.description || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim());
      const visibleItems = items.filter(i => !hiddenItemKeys.includes(i.key));

      const blockCat = blockName === 'cpfl' ? null : blockName.toUpperCase();
      const extraItems = blockName === 'exclusivo'
        ? allMappedTransactions.filter((t: any) =>
            t.type === 'EXPENSE' &&
            ['EXCLUSIVO_FISIO', 'EXCLUSIVO_PILATES'].includes(t.category?.toUpperCase() || '')
          )
        : (blockCat ? allMappedTransactions.filter((t: any) =>
            t.type === 'EXPENSE' &&
            t.category?.toUpperCase() === blockCat &&
            !allMappedIds.includes(t.id)
          ) : []);

      if (visibleItems.length === 0 && extraItems.length === 0) return;

      const tableRows: any[] = [
        [
          { text: 'Item', fontSize: 8, bold: true, fillColor: '#f8fafc' },
          { text: 'Lançamento', fontSize: 8, bold: true, fillColor: '#f8fafc' },
          { text: 'Pago por', fontSize: 8, bold: true, fillColor: '#f8fafc' },
          { text: 'Valor', fontSize: 8, bold: true, alignment: 'right', fillColor: '#f8fafc' }
        ]
      ];

      visibleItems.forEach(item => {
        const tx = findMappedTransaction(item);
        tableRows.push([
          { text: item.label, fontSize: 7.5 },
          { text: tx ? (tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '') : '--', fontSize: 7.5 },
          { text: tx ? tx.favorecido || 'KINESIS' : '--', fontSize: 7.5 },
          { text: `R$ ${(tx ? (tx.clinicAmount ?? tx.amount) : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5, alignment: 'right' }
        ]);
      });

      extraItems.forEach((tx: any) => {
        const isExclusivo = blockName === 'exclusivo';
        const areaLabel = isExclusivo
          ? (tx.category === 'EXCLUSIVO_FISIO' ? ' (FISIO)' : ' (PILATES)')
          : '';
        tableRows.push([
          { text: (tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '') + areaLabel, fontSize: 7.5 },
          { text: 'Despesa Extra', fontSize: 7.5 },
          { text: tx.favorecido || 'KINESIS', fontSize: 7.5 },
          { text: `R$ ${(tx.clinicAmount ?? tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 7.5, alignment: 'right' }
        ]);
      });

      tableRows.push([
        { text: `TOTAL ${title.toUpperCase()}`, fontSize: 8, bold: true },
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
        { text: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fontSize: 8, bold: true, alignment: 'right' }
      ]);

      pdfContent.push({ text: `${title}`, fontSize: 9.5, bold: true, color: '#475569', margin: [0, 8, 0, 4] });
      pdfContent.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', 'auto', 'auto'],
          body: tableRows
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length - 1 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#cbd5e1',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 4,
          paddingBottom: () => 4
        },
        margin: [0, 0, 0, 10]
      });
    };

    addPdfBlock("Gastos Gerais", "geral", totalGeral);
    addPdfBlock("Gastos Secretária", "secretaria", totalSecretaria);
    addPdfBlock("Gastos Kinesis", "kinesis", totalKinesis);
    addPdfBlock("CPFL por Sala", "cpfl", cpflSum + cpflSala02);
    addPdfBlock("Custos Exclusivos (100% Área)", "exclusivo", totalExclusivoFisio + totalExclusivoPilates);

    const docDef = {
      content: pdfContent,
      defaultStyle: {
        font: 'Roboto'
      }
    };

    const pdfDoc = pdfmake.createPdf(docDef);
    const pdfBuffer = await pdfDoc.getBuffer();

    const attachments = [
      {
        filename: `Fechamento_Clinica_${monthName}_${year}.xlsx`,
        content: excelBuffer
      },
      {
        filename: `Fechamento_Clinica_${monthName}_${year}.pdf`,
        content: pdfBuffer
      }
    ];

    // 5. Check SMTP variables and send
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      console.log(`[MAILER] SMTP Credentials found. Sending mail to: ${recipientEmails.join(', ')}`);
      
      const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Gestão Kinesis" <${user}>`,
        to: recipientEmails.join(', '),
        subject: `[FECHAMENTO] Clínica Kinesis — Resumo Consolidado ${monthName}/${year}`,
        html: htmlBody,
        attachments
      });

      console.log("[MAILER] Email sent successfully. Message ID:", info.messageId);
      return { success: true, mode: 'sent', messageId: info.messageId };
    } else {
      // Simulation Mode: write to scratch log
      console.log("[MAILER] SMTP config missing in .env. Running in SIMULATION MODE.");
      const scratchDir = path.join(process.cwd(), 'scratch');
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir);
      }
      const reportLogPath = path.join(scratchDir, `Fechamento_Log_${monthName}_${year}.html`);
      fs.writeFileSync(reportLogPath, htmlBody);
      console.log(`[MAILER] Simulation complete. Report HTML written to: ${reportLogPath}`);
      return { success: true, mode: 'simulated', path: reportLogPath };
    }
  } catch (error: any) {
    console.error("[MAILER] Fatal error in email generation/send:", error);
    return { success: false, error: error.message };
  }
}
