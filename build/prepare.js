// Copies the game (../verity-no-trono) into app/, bundles the fonts and the Firebase SDK so the app runs offline.
// Run: node build/prepare.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, '..', 'verity-no-trono');
const appDir = path.join(root, 'app');
const fontDir = path.join(appDir, 'fonts');
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;800;900&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

async function bundleFonts() {
  if (fs.existsSync(path.join(appDir, 'fonts.css')) && fs.readdirSync(fontDir).length) return 'kept';
  fs.mkdirSync(fontDir, { recursive: true });
  const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();
  const blocks = css.split('/*').slice(1).map(b => '/*' + b).filter(b => /\/\* (latin|latin-ext) \*\//.test(b));
  let out = ''; const seen = new Map();
  for (const b of blocks) {
    const url = (b.match(/url\((https:[^)]+)\)/) || [])[1]; if (!url) continue;
    let name = seen.get(url);
    if (!name) {
      name = `${/Lilita/.test(b) ? 'lilita' : 'nunito'}-${/latin-ext/.test(b) ? 'ext' : 'latin'}-${seen.size}.woff2`;
      fs.writeFileSync(path.join(fontDir, name), Buffer.from(await (await fetch(url)).arrayBuffer()));
      seen.set(url, name);
    }
    out += b.replace(url, 'fonts/' + name).replace(/^\/\*[^*]*\*\//, '').trim() + '\n';
  }
  fs.writeFileSync(path.join(appDir, 'fonts.css'), out);
  return seen.size + ' files';
}

async function main() {
  fs.mkdirSync(appDir, { recursive: true });
  for (const d of ['js']) fs.rmSync(path.join(appDir, d), { recursive: true, force: true });
  copyDir(path.join(src, 'js'), path.join(appDir, 'js'));
  fs.copyFileSync(path.join(src, 'style.css'), path.join(appDir, 'style.css'));
  const fonts = await bundleFonts();

  const vendor = path.join(appDir, 'vendor');
  fs.mkdirSync(vendor, { recursive: true });
  for (const f of ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'])
    fs.copyFileSync(path.join(root, 'node_modules', 'firebase', f), path.join(vendor, f));

  let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
  html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '')
             .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts.css">');
  fs.writeFileSync(path.join(appDir, 'index.html'), html);
  console.log(`fonts: ${fonts}, html: ${html.length} bytes, js: ${fs.readdirSync(path.join(appDir, 'js')).join(' ')}`);
}
main().catch(e => { console.error(e); process.exit(1); });
