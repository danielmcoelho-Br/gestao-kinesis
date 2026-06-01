const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const pdfPath = path.join(__dirname, "G4 Skills - Diagnóstico de Maturidade - Daniel Martins Coelho.pdf");
    const buffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse(new Uint8Array(buffer));
    const res = await parser.getText();
    fs.writeFileSync(path.join(__dirname, "../g4_skills_text.txt"), res.text);
    console.log("PDF parsed successfully and written to g4_skills_text.txt. Length:", res.text.length);
  } catch (err) {
    console.error("Error parsing PDF:", err);
  }
}

main();
