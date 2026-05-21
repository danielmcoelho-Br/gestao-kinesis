const fs = require('fs');
const path = require('path');

function replaceInFiles(dir, replacementString) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath, replacementString);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      if (content.includes("from '@/")) {
        content = content.replace(/from '@\//g, "from '" + replacementString);
        changed = true;
      }
      if (content.includes("import '@/")) {
        content = content.replace(/import '@\//g, "import '" + replacementString);
        changed = true;
      }
      if (content.includes("import \"@/")) {
        content = content.replace(/import \"@\//g, "import \"" + replacementString);
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed quotes in ' + fullPath);
      }
    }
  }
}

replaceInFiles(path.join(__dirname, 'src/lab'), '@/lab/');
replaceInFiles(path.join(__dirname, 'src/app/(lab)'), '@/lab/');
replaceInFiles(path.join(__dirname, 'src/gestao'), '@/gestao/');
replaceInFiles(path.join(__dirname, 'src/app/(gestao)'), '@/gestao/');
console.log('Done.');
