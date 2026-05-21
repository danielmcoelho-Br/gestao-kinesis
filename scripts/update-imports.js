const fs = require('fs');
const path = require('path');

function replaceInFiles(dir, search, replacement) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath, search, replacement);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(search)) {
        content = content.replace(new RegExp(search, 'g'), replacement);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

// Lab
replaceInFiles(path.join(__dirname, 'src/app/(lab)'), 'from "@/', 'from "@/lab/');
replaceInFiles(path.join(__dirname, 'src/lab'), 'from "@/', 'from "@/lab/');
// Gestao
replaceInFiles(path.join(__dirname, 'src/app/(gestao)'), 'from "@/', 'from "@/gestao/');
replaceInFiles(path.join(__dirname, 'src/gestao'), 'from "@/', 'from "@/gestao/');

console.log('Imports updated successfully.');
