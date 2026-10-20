const express = require('express');
const compression = require('compression');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const dir = (p) => path.join(__dirname, p);

app.disable('x-powered-by');
app.use(compression());
app.use('/lib/pdf-lib', express.static(dir('node_modules/pdf-lib/dist'), { maxAge: '7d' }));
app.use('/lib/cropperjs', express.static(dir('node_modules/cropperjs/dist'), { maxAge: '7d' }));
const indexFile = [dir('public/index.html'), dir('index.html')].find((f) => fs.existsSync(f));
if (!indexFile) {
  console.error('index.html not found. Put it in a "public" folder next to server.js.');
  process.exit(1);
}
app.use(express.static(dir('public'), { maxAge: '1h' }));
app.get('/', (_req, res) => res.sendFile(indexFile));
app.get('/healthz', (_req, res) => res.send('ok'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Local:   http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const n of list || [])
      if (n.family === 'IPv4' && !n.internal) console.log(`Phone:   http://${n.address}:${PORT}  (same Wi-Fi)`);
});
