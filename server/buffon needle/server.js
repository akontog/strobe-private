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

function broadcastTeachers(data) {
  const msg = JSON.stringify(data);
  teachers.forEach((teacherWs) => {
    if (teacherWs.readyState === 1) teacherWs.send(msg);
  });
}

function broadcastStudents(data) {
  const msg = JSON.stringify(data);
  students.forEach((_, studentWs) => {
    if (studentWs.readyState === 1) studentWs.send(msg);
  });
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
      return;
    }

    if (msg.type === 'start_round') {
      if (!teachers.has(ws)) return;

      const parsedTime = Number.parseInt(msg.timeSec, 10);
      const timeSec = Number.isInteger(parsedTime)
        ? Math.max(20, Math.min(120, parsedTime))
        : 60;

      const parsedTarget = Number.parseFloat(msg.targetError);
      const targetError = Number.isFinite(parsedTarget)
        ? Math.max(0.001, Math.min(0.01, parsedTarget))
        : 0.005;

      const round = Number.parseInt(msg.round, 10) || 1;
      const endAt = Date.now() + timeSec * 1000;

      students.forEach((state, studentWs) => {
        students.set(studentWs, {
          team: state.team,
          drops: 0,
          hits: 0,
          piEst: null,
        });
      });
      sendRoster();

      broadcastStudents({
        type: 'round_start',
        round,
        timeSec,
        targetError,
        endAt,
        defaults: {
          needleL: 50,
          lineD: 60,
          stepN: 1,
          auto: false,
        },
      });
      return;
    }

    if (msg.type === 'end_round') {
      if (!teachers.has(ws)) return;

      const round = Number.parseInt(msg.round, 10) || 1;
      const rawReason = typeof msg.reason === 'string' ? msg.reason : '';
      const reason = rawReason === 'target_reached' || rawReason === 'manual_stop' || rawReason === 'time_up'
        ? rawReason
        : 'time_up';
      const winnerTeam = typeof msg.winnerTeam === 'string' ? msg.winnerTeam : '';

      const rankings = Array.isArray(msg.rankings)
        ? msg.rankings.slice(0, 100).map((entry, idx) => {
            const rank = Number.parseInt(entry && entry.rank, 10);
            const points = Number.parseInt(entry && entry.points, 10);
            const parsedError = Number.parseFloat(entry && entry.error);
            return {
              rank: Number.isInteger(rank) && rank > 0 ? rank : idx + 1,
              team: typeof (entry && entry.team) === 'string' ? entry.team : '',
              points: Number.isInteger(points) ? points : 0,
              error: Number.isFinite(parsedError) ? parsedError : null,
            };
          })
        : [];

      const parsedTarget = Number.parseFloat(msg.targetError);
      const targetError = Number.isFinite(parsedTarget)
        ? Math.max(0.001, Math.min(0.01, parsedTarget))
        : null;

      broadcastStudents({
        type: 'round_end',
        round,
        reason,
        winnerTeam,
        targetError,
        rankings,
      });
      return;
    }

    if (msg.type === 'reset_tournament') {
      if (!teachers.has(ws)) return;

      students.forEach((state, studentWs) => {
        students.set(studentWs, {
          team: state.team,
          drops: 0,
          hits: 0,
          piEst: null,
        });
      });
      sendRoster();

      broadcastStudents({
        type: 'reset_tournament',
        defaults: {
          needleL: 50,
          lineD: 60,
          stepN: 1,
          auto: false,
        },
      });
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
