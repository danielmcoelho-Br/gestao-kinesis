const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function inspectFile(filename) {
    const filePath = path.join(__dirname, '..', filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filename}`);
        return;
    }

    console.log(`\n==================================================================`);
    console.log(`INSPECTING FILE: ${filename}`);
    console.log(`==================================================================`);

    const workbook = XLSX.readFile(filePath);
    console.log(`Sheet Names:`, workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- SHEET: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        
        // Get dimensions
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        console.log(`Dimensions: ${sheet['!ref']} (${range.e.r + 1} rows, ${range.e.c + 1} cols)`);

        // Convert first few rows to array of arrays to inspect headers and layout
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }).slice(0, 15);
        
        console.log(`Sample Data (Top 15 rows):`);
        data.forEach((row, idx) => {
            // Truncate cell values for cleaner printing
            const cleanRow = row.map(cell => {
                const str = String(cell).trim();
                return str.length > 30 ? str.substring(0, 27) + '...' : str;
            });
            console.log(`[Row ${idx + 1}]:`, JSON.stringify(cleanRow));
        });
    });
}

inspectFile('Financeiro 26.xlsx');
inspectFile('Gestão Conta BB.xlsx');
