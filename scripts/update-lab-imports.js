const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('from "@/')) {
        content = content.replace(/from "@\//g, 'from "@/lab/');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed ' + fullPath);
      }
    }
  }
}

replaceInFiles(path.join(__dirname, 'src/lab/constants'));
replaceInFiles(path.join(__dirname, 'src/lab/contexts'));
replaceInFiles(path.join(__dirname, 'src/lab/data'));
replaceInFiles(path.join(__dirname, 'src/lab/scripts'));
replaceInFiles(path.join(__dirname, 'src/lab/services'));
replaceInFiles(path.join(__dirname, 'src/lab/utils'));
console.log('Done.');
