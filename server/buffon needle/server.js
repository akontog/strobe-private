const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

try {
  require('dotenv').config();
} catch (err) {
  if (!(err && err.code === 'MODULE_NOT_FOUND' && /'dotenv'/.test(String(err.message)))) {
    throw err;
  }
  console.warn('dotenv not found, continuing with existing environment variables.');
}

// ── HTTP server (serves HTML files) ──────────────
const httpServer = http.createServer((req, res) => {
  const routes = {
    '/':              'student.html',
    '/student.html':  'student.html',
    '/teacher.html':  'teacher.html',
    '/qrcode.png':    'qrcode.png',
  };
  const file = routes[req.url] || null;
  if (!file) { res.writeHead(404); res.end('Not found'); return; }

  fs.readFile(path.join(__dirname, file), (err, data) => {
    if (err) { res.writeHead(500); res.end('Error'); return; }
    const ext = path.extname(file).toLowerCase();
    const contentType = ext === '.html'
      ? 'text/html; charset=utf-8'
      : ext === '.png'
        ? 'image/png'
        : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// ── WebSocket server ──────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

// students: Map<ws, { team, drops, hits, piEst }>
const students = new Map();
const teachers  = new Set();

function broadcast(data) {
  const msg = JSON.stringify(data);
  teachers.forEach(t => { if (t.readyState === 1) t.send(msg); });
}

function sendRoster(target) {
  const list = [...students.values()];
  const msg  = JSON.stringify({ type: 'roster', students: list });
  if (target) { if (target.readyState === 1) target.send(msg); }
  else teachers.forEach(t => { if (t.readyState === 1) t.send(msg); });
}

wss.on('connection', ws => {
  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'register_teacher') {
      teachers.add(ws);
      sendRoster(ws);
      return;
    }

    if (msg.type === 'register_student') {
      students.set(ws, { team: msg.team, drops: 0, hits: 0, piEst: null });
      sendRoster();
      return;
    }

    if (msg.type === 'update') {
      if (students.has(ws)) {
        students.set(ws, {
          team:  students.get(ws).team,
          drops: msg.drops,
          hits:  msg.hits,
          piEst: msg.piEst,
        });
        sendRoster();
      }
    }
  });

  ws.on('close', () => {
    students.delete(ws);
    teachers.delete(ws);
    sendRoster();
  });
});

const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536
  ? parsedPort
  : 3000;
const HOST = process.env.HOST || '0.0.0.0';
const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;

httpServer.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${displayHost}:${PORT}`);
  console.log(`   Μαθητές  → http://${displayHost}:${PORT}/student.html`);
  console.log(`   Καθηγητής → http://${displayHost}:${PORT}/teacher.html`);
  console.log(`   Bind: ${HOST}:${PORT}`);
});
