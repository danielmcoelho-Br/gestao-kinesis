const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'src', 'app', '(gestao)', 'api');
const DEST = path.join(__dirname, '..', 'src', 'app', 'api');

console.log(`🚚 Iniciando a consolidação física de APIs...`);
console.log(`Origem: ${SOURCE}`);
console.log(`Destino: ${DEST}`);

if (!fs.existsSync(SOURCE)) {
  console.error("🚨 Origem não encontrada!");
  process.exit(1);
}

function copyFolderRecursive(source, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      console.log(`📄 Copiando arquivo: ${entry.name} para ${dest}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const folders = fs.readdirSync(SOURCE);
  
  for (const folder of folders) {
    const fullSourcePath = path.join(SOURCE, folder);
    const fullDestPath = path.join(DEST, folder);

    if (fs.lstatSync(fullSourcePath).isDirectory()) {
      console.log(`📂 Consolidando módulo: ${folder}...`);
      copyFolderRecursive(fullSourcePath, fullDestPath);
      
      // Safely remove the source directory recursively after copying
      fs.rmSync(fullSourcePath, { recursive: true, force: true });
      console.log(`✅ Módulo ${folder} consolidado e limpo da origem.`);
    }
  }

  // Finally, remove the now-empty (gestao)/api folder itself
  if (fs.readdirSync(SOURCE).length === 0) {
    fs.rmSync(SOURCE, { recursive: true, force: true });
    console.log("🔥 Pasta (gestao)/api removida com sucesso por estar vazia!");
  }

  console.log("\n🏆 CONSOLIDAÇÃO FINALIZADA COM SUCESSO!");

} catch (error) {
  console.error("🚨 Erro durante a consolidação:", error);
}
