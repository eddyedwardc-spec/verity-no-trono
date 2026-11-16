const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const SMOKE = process.env.VERITY_SMOKE === '1';   // hidden self-test, used while building
const ICON_OUT = process.env.VERITY_ICON_OUT;     // when set, renders the icon PNGs and exits

app.setName('Cague um Verity');
// Saves live in %APPDATA%\Verity no Trono since the first version (the game's old name). Never change this path,
// or every player's local profile and their online login (anonymous Firebase account) would be left behind.
app.setPath('userData', path.join(app.getPath('appData'), 'Verity no Trono'));
Menu.setApplicationMenu(null);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 720, useContentSize: true,
    minWidth: 800, minHeight: 450,
    show: false,
    backgroundColor: '#000000',
    title: 'Cague um Verity',
    icon: path.join(__dirname, 'app', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });
  win.setAspectRatio(16 / 9);

  const sendFs = () => { if (!win.isDestroyed()) win.webContents.send('fs:changed', win.isFullScreen()); };
  win.on('enter-full-screen', sendFs);
  win.on('leave-full-screen', sendFs);

  // F11 / Alt+Enter: fullscreen. Ctrl+Shift+I: devtools.
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.control && input.shift && input.key.toLowerCase() === 'i') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  // Links to other sites open in the normal browser, never inside the game window.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) e.preventDefault(); });

  if (SMOKE || ICON_OUT) win.webContents.setAudioMuted(true);
  win.loadFile(path.join(__dirname, 'app', 'index.html'), (SMOKE || ICON_OUT) ? { query: { smoke: '1' } } : undefined);
  if (!SMOKE && !ICON_OUT) win.once('ready-to-show', () => win.show());
  return win;
}

/* ---------- auto-update from GitHub Releases ---------- */
const UPDTEST = process.env.VERITY_UPDTEST === '1';  // headless: check + download, print, quit without installing
let updState = { state: 'idle', pct: 0, ver: '' }, updWaiters = [], updater = null;
function setUpd(s) {
  updState = { ...updState, ...s };
  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send('upd:status', updState);
  if (UPDTEST) console.log('UPD ' + JSON.stringify(updState));
  if (['none', 'error', 'available'].includes(updState.state)) { updWaiters.forEach(r => r(updState.state)); updWaiters = []; }
  if (UPDTEST && ['none', 'error', 'ready'].includes(updState.state)) setTimeout(() => app.exit(0), 300);
}
function initUpdater() {
  if (!app.isPackaged || SMOKE || ICON_OUT) { setUpd({ state: 'none' }); return; }
  try { updater = require('electron-updater').autoUpdater; } catch (e) { setUpd({ state: 'error', msg: 'updater missing' }); return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = !UPDTEST;
  updater.on('checking-for-update', () => setUpd({ state: 'checking' }));
  updater.on('update-available', i => setUpd({ state: 'available', ver: i.version, pct: 0 }));
  updater.on('update-not-available', () => setUpd({ state: 'none' }));
  updater.on('download-progress', p => setUpd({ state: 'downloading', pct: Math.round(p.percent || 0) }));
  updater.on('update-downloaded', i => setUpd({ state: 'ready', ver: i.version, pct: 100 }));
  updater.on('error', e => setUpd({ state: 'error', msg: String(e && e.message || e).slice(0, 200) }));
  updater.checkForUpdates().catch(() => {});
  setInterval(() => { if (['none', 'error'].includes(updState.state)) updater.checkForUpdates().catch(() => {}); }, 30 * 60 * 1000);
}
ipcMain.handle('upd:get', () => updState);
ipcMain.handle('upd:wait', () => updState.state !== 'idle' && updState.state !== 'checking' ? updState.state
  : new Promise(r => { updWaiters.push(r); setTimeout(() => r('timeout'), 8000); }));
ipcMain.handle('upd:install', () => { if (updater && updState.state === 'ready') updater.quitAndInstall(true, true); });
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('fs:toggle', e => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.setFullScreen(!w.isFullScreen()); return w && w.isFullScreen(); });
ipcMain.handle('fs:set', (e, v) => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.setFullScreen(!!v); return !!v; });
ipcMain.handle('app:quit', () => app.quit());

async function smoke(win) {
  const errors = [];
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 3) errors.push(message); });
  win.webContents.on('render-process-gone', (_e, d) => errors.push('renderer gone: ' + d.reason));
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await new Promise(r => setTimeout(r, 1500));
  const report = await win.webContents.executeJavaScript(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const out={title:document.title,bridge:!!(window.desktop&&window.desktop.isApp),fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+' '+f.weight),net:NET.status};
    out.firstScreen=!document.getElementById('setup').hidden?'setup':!document.getElementById('menu').hidden?'menu':'?';
    if(out.firstScreen==='setup'){document.getElementById('setupName').value='smoke_test';document.getElementById('setupForm').requestSubmit();await wait(300)}
    out.menu=!document.getElementById('menu').hidden;
    out.vendor=await fetch('vendor/firebase-firestore-compat.js').then(r=>r.ok).catch(()=>false);
    openPanel('coll');await wait(100);openPanel('shop');await wait(100);closeTopPanel();closeTopPanel();
    document.getElementById('mPlay').click();await wait(200);
    out.journey=!document.getElementById('journey').hidden&&document.querySelectorAll('#jGrid .wcard').length;
    document.querySelector('#jGrid .wcard .btn').click();await wait(200);
    out.card1=!document.getElementById('card1').hidden;
    document.getElementById('go1').click();await wait(1000);
    out.mode=S.mode;out.music=MUS.track;
    out.stage=[document.getElementById('stage').clientWidth,document.getElementById('stage').clientHeight];
    try{localStorage.setItem('verity-smoke','1');out.storage=localStorage.getItem('verity-smoke')==='1';localStorage.removeItem('verity-smoke')}catch(e){out.storage=false}
    return out;})()`);
  console.log('SMOKE ' + JSON.stringify({ ...report, errors }));
  app.quit();
}

async function renderIcons(win) {
  await new Promise(r => win.webContents.once('did-finish-load', r));
  const sizes = [256, 64, 48, 32, 16];
  const pngs = await win.webContents.executeJavaScript(`(${function (sizes) {
    return sizes.map(n => {
      const c = document.createElement('canvas'); c.width = c.height = n;
      const x = c.getContext('2d'), r = n * 0.44, cx = n / 2, cy = n / 2;
      const b = x.createRadialGradient(cx - r * .35, cy - r * .4, r * .08, cx, cy, r);
      b.addColorStop(0, '#fff8c4'); b.addColorStop(.45, '#ffd726'); b.addColorStop(1, '#d69500');
      x.fillStyle = b; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#8a5f00'; x.lineWidth = Math.max(1, n * .025); x.stroke();
      if (n >= 32) { x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.ellipse(cx - r * .38, cy - r * .42, r * .22, r * .12, -.6, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = '#5a3b00';
      for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * r * .3, cy - r * .04, Math.max(1, r * .09), Math.max(1.2, r * .15), 0, 0, Math.PI * 2); x.fill(); }
      x.strokeStyle = '#5a3b00'; x.lineWidth = Math.max(1, r * .1); x.lineCap = 'round';
      x.beginPath(); x.arc(cx, cy + r * .12, r * .28, .22 * Math.PI, .78 * Math.PI); x.stroke();
      return c.toDataURL('image/png').split(',')[1];
    });
  }})(${JSON.stringify(sizes)})`);
  const bufs = pngs.map(p => Buffer.from(p, 'base64'));
  fs.writeFileSync(path.join(ICON_OUT, 'icon.png'), bufs[0]);
  const head = Buffer.alloc(6 + 16 * bufs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(bufs.length, 4);
  let offset = head.length;
  bufs.forEach((buf, i) => {
    const n = sizes[i], o = 6 + 16 * i;
    head.writeUInt8(n >= 256 ? 0 : n, o); head.writeUInt8(n >= 256 ? 0 : n, o + 1);
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  fs.writeFileSync(path.join(ICON_OUT, 'icon.ico'), Buffer.concat([head, ...bufs]));
  console.log('ICONS ' + bufs.map(b => b.length).join(','));
  app.quit();
}

app.whenReady().then(() => {
  if (UPDTEST) { console.log('VERSION ' + app.getVersion() + ' USERDATA ' + app.getPath('userData')); initUpdater(); return; }
  const win = createWindow();
  initUpdater();
  if (ICON_OUT) renderIcons(win);
  else if (SMOKE) smoke(win);
});
app.on('window-all-closed', () => app.quit());
