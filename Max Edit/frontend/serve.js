const http = require('http');
const fs   = require('fs');
const path = require('path');
const net  = require('net');
const { exec } = require('child_process');

const PORT  = 3001;
const INDEX = path.join(__dirname, 'index.html');

function openBrowser() {
  exec('start http://localhost:' + PORT);
}

// If port already in use → server is running, just open the browser
const probe = net.createConnection({ port: PORT, host: '127.0.0.1' });
probe.on('connect', () => {
  probe.destroy();
  openBrowser();
});
probe.on('error', () => {
  const server = http.createServer((req, res) => {
    fs.readFile(INDEX, (err, data) => {
      if (err) { res.writeHead(500); res.end('Could not load index.html'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  });
  server.listen(PORT, '127.0.0.1', () => {
    console.log('[Max Edit] Frontend running at http://localhost:' + PORT);
    openBrowser();
  });
});
