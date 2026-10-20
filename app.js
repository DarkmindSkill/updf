#!/usr/bin/env node
// JPG to PDF maker. Single file, no dependencies.   Run:  node app.js
// Optional (offline use):  npm install pdf-lib cropperjs   (same folder)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;

// The web page is stored at the bottom of this file, inside a comment.
const SRC = fs.readFileSync(__filename, 'utf8');
const from = SRC.lastIndexOf('<!doctype html>');
const to = SRC.lastIndexOf('</html>') + 7;
if (from < 0 || to < 7) {
  console.error('Embedded page not found. Download app.js again, complete and unedited.');
  process.exit(1);
}
const PAGE = Buffer.from(SRC.slice(from, to));
const PAGE_GZ = zlib.gzipSync(PAGE);

// Libraries: served from ./node_modules if installed, otherwise from the CDN.
const LIBS = {
  '/lib/pdf-lib/pdf-lib.min.js': ['pdf-lib/dist/pdf-lib.min.js', 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js', 'text/javascript'],
  '/lib/cropperjs/cropper.min.js': ['cropperjs/dist/cropper.min.js', 'https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.js', 'text/javascript'],
  '/lib/cropperjs/cropper.min.css': ['cropperjs/dist/cropper.min.css', 'https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.css', 'text/css']
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/' || url === '/index.html') {
    const gz = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', Vary: 'Accept-Encoding' };
    if (gz) headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    return res.end(gz ? PAGE_GZ : PAGE);
  }

  const lib = LIBS[url];
  if (lib) {
    const file = path.join(__dirname, 'node_modules', lib[0]);
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': lib[2], 'Cache-Control': 'public, max-age=604800' });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(302, { Location: lib[1] });
    return res.end();
  }

  if (url === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is busy. Try:  PORT=3001 node app.js` : e.message);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Local:  http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const n of list || [])
      if (n.family === 'IPv4' && !n.internal) console.log(`Phone:  http://${n.address}:${PORT}   (same Wi-Fi)`);
});

/*
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2f5bff">
<title>JPG to PDF</title>
<link rel="stylesheet" href="/lib/cropperjs/cropper.min.css">
<style>
:root{--bg:#eef1f6;--card:#fff;--ink:#101828;--mut:#5b6678;--line:#d9dfe9;--acc:#2f5bff;--on:#fff;--thumb:#e3e8f1;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#0f1420;--card:#171e2e;--ink:#eef1f8;--mut:#98a3b8;--line:#2a3347;--acc:#7c9cff;--on:#0f1420;--thumb:#0f1420}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
 padding:env(safe-area-inset-top) env(safe-area-inset-right) calc(96px + env(safe-area-inset-bottom)) env(safe-area-inset-left)}
main{max-width:980px;margin:0 auto;padding:16px}
h1{font-size:1.6rem;line-height:1.1;margin:8px 0 4px;letter-spacing:-.02em}
.sub{margin:0 0 16px;color:var(--mut)}
button,select,input{font:inherit;color:inherit}
button{cursor:pointer;border:1px solid var(--line);background:var(--card);border-radius:10px;min-height:44px;padding:0 16px;touch-action:manipulation}
button:focus-visible,select:focus-visible,.drop:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
button:disabled{opacity:.45;cursor:not-allowed}
.pri{background:var(--acc);border-color:var(--acc);color:var(--on);font-weight:600}
.drop{display:block;border:2px dashed var(--line);border-radius:16px;padding:40px 16px;text-align:center;cursor:pointer;background:var(--card)}
.drop.over{border-color:var(--acc)}
.drop strong{display:block;font-size:1.1rem}
.drop span{color:var(--mut)}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;list-style:none;margin:0 0 16px;padding:0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;position:relative}
.card.drag{opacity:.4}
.card img{display:block;width:100%;height:160px;object-fit:contain;background:var(--thumb)}
.card b{position:absolute;top:0;left:0;background:var(--acc);color:var(--on);min-width:28px;text-align:center;padding:2px 8px;border-radius:0 0 10px 0;font-size:.85rem}
.act{display:flex;border-top:1px solid var(--line)}
.act button{flex:1;border:0;border-radius:0;padding:0;min-width:0;font-size:1.1rem;background:none}
.act button+button{border-left:1px solid var(--line)}
.set{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.set label{display:grid;gap:4px;font-size:.9rem;color:var(--mut)}
.set select,.set input[type=range]{width:100%;min-height:44px;color:var(--ink)}
.set select{border:1px solid var(--line);border-radius:10px;padding:0 10px;background:var(--bg)}
.hide{display:none!important}
.bar{position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;align-items:center;background:var(--card);border-top:1px solid var(--line);
 padding:10px calc(12px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))}
.bar .pri{flex:1;max-width:420px}
#st{position:absolute;left:0;right:0;top:-28px;text-align:center;font-size:.85rem;color:var(--mut);pointer-events:none}
dialog{border:0;padding:0;width:100%;height:100dvh;max-width:none;max-height:none;background:#000;color:var(--ink)}
dialog[open]{display:flex;flex-direction:column}
.cbox{flex:1;min-height:0}
.cbox img{display:block;max-width:100%}
.cbar{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--card)}
.cbar select{flex:1;min-width:90px;min-height:44px;border:1px solid var(--line);border-radius:10px;background:var(--bg);padding:0 8px}
@media(prefers-reduced-motion:no-preference){.card{transition:opacity .15s}}
</style>
</head>
<body>
<main>
  <h1>JPG to PDF</h1>
  <p class="sub">Photos stay on your device. Crop, reorder, then download.</p>

  <input id="fi" type="file" accept="image/jpeg,image/png" multiple hidden>
  <label id="drop" class="drop" tabindex="0" for="fi">
    <strong>Choose photos</strong><span>Tap to browse, or drop JPG and PNG files here</span>
  </label>

  <ul id="grid" aria-label="Pages"></ul>

  <section class="set" id="set" aria-label="PDF options">
    <label>Page size
      <select id="size"><option value="orig">Original image size</option><option value="a4">A4</option><option value="letter">Letter</option></select>
    </label>
    <label id="mgW" class="hide">Margin
      <select id="mg"><option value="0">None</option><option value="18" selected>Small</option><option value="36">Medium</option></select>
    </label>
    <label>File size
      <select id="mode"><option value="orig">Original quality</option><option value="small">Compressed</option></select>
    </label>
    <label id="qW" class="hide">Quality <output id="qo">70%</output>
      <input id="q" type="range" min="30" max="95" value="70">
    </label>
    <label id="mxW" class="hide">Resize longest side
      <select id="mx"><option value="99999">Keep pixels</option><option value="2400">2400 px</option><option value="1600" selected>1600 px</option><option value="1200">1200 px</option><option value="800">800 px</option></select>
    </label>
  </section>
</main>

<div class="bar">
  <div id="st" role="status" aria-live="polite"></div>
  <button id="add" type="button">Add photos</button>
  <button id="dl" type="button" class="pri" disabled>Download PDF</button>
</div>

<dialog id="cm" aria-label="Crop photo">
  <div class="cbox"><img id="ci" alt="Photo to crop"></div>
  <div class="cbar">
    <select id="ar" aria-label="Crop shape"><option value="free">Free</option><option value="1">Square</option><option value="1.3333">4:3</option><option value="0.75">3:4</option><option value="0.7071">A4</option></select>
    <button id="cr" type="button">Undo edits</button>
    <button id="cc" type="button">Cancel</button>
    <button id="ca" type="button" class="pri">Apply crop</button>
  </div>
</dialog>

<script src="/lib/pdf-lib/pdf-lib.min.js"></script>
<script src="/lib/cropperjs/cropper.min.js"></script>
<script>
const $ = (s) => document.querySelector(s);
const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
const PX2PT = 0.75;
let pages = [], uid = 0, cropper = null, cropUrl = '', cropId = 0, dragFrom = -1;

const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const toBlob = (c, q) => new Promise((r) => c.toBlob(r, 'image/jpeg', q));
const loadImg = (b) => new Promise((res, rej) => {
  const u = URL.createObjectURL(b), i = new Image();
  i.onload = () => { URL.revokeObjectURL(u); res(i); };
  i.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Could not read image')); };
  i.src = u;
});
const fmt = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
const say = (t) => { $('#st').textContent = t || ''; };

// Read EXIF orientation so phone photos are not embedded sideways
async function orientation(file) {
  try {
    const v = new DataView(await file.slice(0, 65536).arrayBuffer());
    if (v.getUint16(0) !== 0xFFD8) return 1;
    let o = 2;
    while (o < v.byteLength) {
      const m = v.getUint16(o); o += 2;
      if (m === 0xFFE1) {
        if (v.getUint32(o + 2) !== 0x45786966) return 1;
        const b = o + 8, le = v.getUint16(b) === 0x4949;
        let p = b + v.getUint32(b + 4, le);
        const n = v.getUint16(p, le); p += 2;
        for (let i = 0; i < n; i++, p += 12) if (v.getUint16(p, le) === 0x0112) return v.getUint16(p + 8, le);
        return 1;
      }
      if ((m & 0xFF00) !== 0xFF00) break;
      o += v.getUint16(o);
    }
  } catch (e) {}
  return 1;
}

async function thumb(img) {
  const s = Math.min(1, 360 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = cv(Math.round(img.naturalWidth * s), Math.round(img.naturalHeight * s));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return URL.createObjectURL(await toBlob(c, .7));
}
async function refresh(p) {
  const img = await loadImg(p.blob);
  p.w = img.naturalWidth; p.h = img.naturalHeight;
  if (p.t) URL.revokeObjectURL(p.t);
  p.t = await thumb(img);
}

async function addFiles(files) {
  files = [...files].filter((f) => /^image\/(jpeg|png)$/.test(f.type));
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    say(`Loading ${i + 1} of ${files.length}…`);
    try {
      let blob = files[i];
      if (blob.type === 'image/jpeg' && (await orientation(blob)) > 1) {
        const img = await loadImg(blob), c = cv(img.naturalWidth, img.naturalHeight);
        c.getContext('2d').drawImage(img, 0, 0);
        blob = await toBlob(c, .95);
      }
      const p = { id: ++uid, blob, orig: blob };
      await refresh(p);
      pages.push(p);
    } catch (e) { failed++; }
  }
  say(failed ? `${failed} file(s) could not be read.` : '');
  render();
}

function render() {
  $('#grid').innerHTML = pages.map((p, i) => `
    <li class="card" draggable="true" data-i="${i}">
      <img src="${p.t}" alt="Page ${i + 1}"><b>${i + 1}</b>
      <div class="act">
        <button data-a="l" aria-label="Move page ${i + 1} earlier" ${i === 0 ? 'disabled' : ''}>&#8249;</button>
        <button data-a="r" aria-label="Move page ${i + 1} later" ${i === pages.length - 1 ? 'disabled' : ''}>&#8250;</button>
        <button data-a="rot" aria-label="Rotate page ${i + 1}">&#8635;</button>
        <button data-a="crop" aria-label="Crop page ${i + 1}">&#9986;</button>
        <button data-a="del" aria-label="Remove page ${i + 1}">&#10005;</button>
      </div>
    </li>`).join('');
  $('#drop').classList.toggle('hide', pages.length > 0);
  $('#set').classList.toggle('hide', pages.length === 0);
  $('#dl').disabled = !pages.length;
}

const move = (a, b) => { if (b < 0 || b >= pages.length || a === b) return; pages.splice(b, 0, pages.splice(a, 1)[0]); render(); };

async function rotate(p) {
  const img = await loadImg(p.blob), c = cv(img.naturalHeight, img.naturalWidth), x = c.getContext('2d');
  x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(img, 0, 0);
  p.blob = await toBlob(c, .95);
  await refresh(p);
}

$('#grid').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-a]'); if (!btn) return;
  const i = +btn.closest('li').dataset.i, p = pages[i], a = btn.dataset.a;
  if (a === 'l') move(i, i - 1);
  else if (a === 'r') move(i, i + 1);
  else if (a === 'del') { URL.revokeObjectURL(p.t); pages.splice(i, 1); render(); }
  else if (a === 'rot') { btn.disabled = true; await rotate(p); render(); }
  else if (a === 'crop') openCrop(p);
});

// Desktop drag to reorder / drop files
const grid = $('#grid');
grid.addEventListener('dragstart', (e) => { const li = e.target.closest('li'); if (li) { dragFrom = +li.dataset.i; li.classList.add('drag'); } });
grid.addEventListener('dragend', () => { dragFrom = -1; render(); });
grid.addEventListener('dragover', (e) => e.preventDefault());
grid.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) return addFiles(e.dataTransfer.files);
  const li = e.target.closest('li'); if (li && dragFrom > -1) move(dragFrom, +li.dataset.i);
});
['dragover', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => {
  if (e.target.closest('#grid')) return;
  e.preventDefault();
  if (ev === 'drop' && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
}));

// Crop
function openCrop(p) {
  cropId = p.id;
  $('#ar').value = 'free';
  $('#ci').onload = () => {
    cropper && cropper.destroy();
    cropper = new Cropper($('#ci'), { viewMode: 1, autoCropArea: 1, background: false, checkOrientation: false });
  };
  $('#cm').showModal();
  $('#ci').src = cropUrl = URL.createObjectURL(p.blob);
}
$('#cm').addEventListener('close', () => {
  cropper && cropper.destroy(); cropper = null;
  URL.revokeObjectURL(cropUrl); $('#ci').removeAttribute('src');
});
$('#ar').onchange = (e) => cropper && cropper.setAspectRatio(parseFloat(e.target.value));
$('#cc').onclick = () => $('#cm').close();
$('#cr').onclick = async () => {
  const p = pages.find((x) => x.id === cropId); p.blob = p.orig; await refresh(p);
  $('#cm').close(); render();
};
$('#ca').onclick = async () => {
  const p = pages.find((x) => x.id === cropId);
  const c = cropper.getCroppedCanvas({ maxWidth: 10000, maxHeight: 10000, fillColor: '#fff' });
  p.blob = await toBlob(c, .95); await refresh(p);
  $('#cm').close(); render();
};

// Options UI
const syncUi = () => {
  $('#mgW').classList.toggle('hide', $('#size').value === 'orig');
  const small = $('#mode').value === 'small';
  $('#qW').classList.toggle('hide', !small); $('#mxW').classList.toggle('hide', !small);
  $('#qo').textContent = $('#q').value + '%';
};
['size', 'mode', 'q'].forEach((id) => $('#' + id).addEventListener('input', syncUi));

// Build + download PDF
$('#dl').onclick = async () => {
  const btn = $('#dl'); btn.disabled = true;
  try {
    const { PDFDocument } = PDFLib, doc = await PDFDocument.create();
    const small = $('#mode').value === 'small', q = $('#q').value / 100, mx = +$('#mx').value;
    const sz = SIZES[$('#size').value], mg = sz ? +$('#mg').value : 0;
    for (let i = 0; i < pages.length; i++) {
      say(`Building page ${i + 1} of ${pages.length}…`);
      await new Promise((r) => setTimeout(r)); // keep UI responsive on phones
      const p = pages[i]; let blob = p.blob;
      if (small) {
        const img = await loadImg(blob), s = Math.min(1, mx / Math.max(p.w, p.h));
        const w = Math.round(p.w * s), h = Math.round(p.h * s), c = cv(w, h), x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
        blob = await toBlob(c, q);
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const im = blob.type === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const [pw, ph] = sz ? (p.w > p.h ? [sz[1], sz[0]] : sz) : [p.w * PX2PT, p.h * PX2PT];
      const s = Math.min((pw - 2 * mg) / im.width, (ph - 2 * mg) / im.height), iw = im.width * s, ih = im.height * s;
      doc.addPage([pw, ph]).drawImage(im, { x: (pw - iw) / 2, y: (ph - ih) / 2, width: iw, height: ih });
    }
    const out = new Blob([await doc.save()], { type: 'application/pdf' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(out), download: `photos-${Date.now()}.pdf` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    say(`Downloaded ${pages.length} page${pages.length > 1 ? 's' : ''} · ${fmt(out.size)}`);
  } catch (e) { say('Could not build the PDF. Try Compressed mode or fewer photos.'); console.error(e); }
  btn.disabled = !pages.length;
};

// Add photos
const fi = $('#fi');
$('#add').onclick = () => fi.click();
fi.onchange = async () => { await addFiles(fi.files); fi.value = ''; };
$('#drop').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });

render(); syncUi();
</script>
</body>
</html>

*/
