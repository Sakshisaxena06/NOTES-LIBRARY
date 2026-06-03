const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    if (file === 'dist' || file === 'node_modules' || file.startsWith('.') || file === 'build.js' || file === 'vite.config.js') return;
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    if (fs.statSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      let content = fs.readFileSync(srcFile);
      if (srcFile.endsWith('.html')) {
        let text = content.toString('utf8');
        // Fallback to local env var if exists
        let envVal = process.env.VITE_API_URL;
        if (!envVal && fs.existsSync('.env')) {
          const envContent = fs.readFileSync('.env', 'utf8');
          const match = envContent.match(/VITE_API_URL=(.*)/);
          if (match) envVal = match[1].trim();
        }
        text = text.replace(/%VITE_API_URL%/g, envVal || '');
        fs.writeFileSync(destFile, text);
      } else {
        fs.copyFileSync(srcFile, destFile);
      }
    }
  });
}
copyDir('.', 'dist');
console.log("Custom build completed.");
