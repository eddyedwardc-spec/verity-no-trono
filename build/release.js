// Publishes a new version of Verity no Trono to GitHub Releases. Every installed copy updates itself on next launch.
// Usage: node build/release.js [version] ["notas da versão"]
//   version defaults to the next patch number (1.0.3 -> 1.0.4).
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

const GH = 'C:\\Program Files\\GitHub CLI\\gh.exe';
const REPO = 'verity-no-trono';
const root = path.join(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
const out = (cmd, args) => execFileSync(cmd, args, { cwd: root }).toString().trim();

const owner = out(GH, ['api', 'user', '-q', '.login']);
let ver = process.argv[2];
if (!ver) { const [a, b, c] = pkg.version.split('.').map(Number); ver = `${a}.${b}.${c + 1}`; }
if (!/^\d+\.\d+\.\d+$/.test(ver)) throw new Error('versão inválida: ' + ver);
const notes = process.argv[3] || `Versão ${ver}`;

pkg.version = ver;
pkg.build.publish = [{ provider: 'github', owner, repo: REPO }];
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

run(process.execPath, ['build/prepare.js']);
fs.rmSync(path.join(root, 'release'), { recursive: true, force: true });
run(process.execPath, [path.join(root, 'node_modules', 'electron-builder', 'cli.js'), '--win', 'nsis', '--x64', '--publish', 'never']);

const rel = path.join(root, 'release');
const files = ['latest.yml', `Verity-no-Trono-Setup-${ver}.exe`, `Verity-no-Trono-Setup-${ver}.exe.blockmap`].map(f => path.join(rel, f));
for (const f of files) if (!fs.existsSync(f)) throw new Error('faltou o arquivo ' + f);
run(GH, ['release', 'create', 'v' + ver, ...files, '--repo', `${owner}/${REPO}`, '--title', `Verity no Trono ${ver}`, '--notes', notes]);
console.log(`RELEASED v${ver} https://github.com/${owner}/${REPO}/releases/tag/v${ver}`);
