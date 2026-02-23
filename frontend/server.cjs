const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
// Try multiple locations - Railpack/Docker may use different cwd
const distPath = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(process.cwd(), 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

// Log on crash
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

const server = http.createServer((req, res) => {
  try {
    // Health check - no filesystem access
    if (req.url === '/health' || req.url === '/health/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return;
    }

    let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          filePath = path.join(distPath, 'index.html');
          fs.readFile(filePath, (err2, content2) => {
            if (err2) {
              res.writeHead(500);
              res.end('Error loading index.html');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2);
          });
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  } catch (err) {
    console.error('Request error:', err);
    res.writeHead(500);
    res.end('Server Error');
  }
});

// Validate dist exists before starting
if (!fs.existsSync(distPath)) {
  console.error('ERROR: dist folder not found at', distPath);
  console.error('__dirname:', __dirname, 'cwd:', process.cwd());
  process.exit(1);
}
if (!fs.existsSync(path.join(distPath, 'index.html'))) {
  console.error('ERROR: index.html not found in dist at', distPath);
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CodeFlow frontend serving on 0.0.0.0:${PORT}`);
  console.log('Serving from dist:', distPath);
});
