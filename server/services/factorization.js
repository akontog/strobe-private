const { WebSocketServer } = require('ws');
const { sanitizeString } = require('../utils/helpers');

const QUESTION_IDS = new Set([
  'perfect-square',
  'x2-plus-3xy-plus-2y2',
  '2x2-plus-5xy-plus-2y2',
  '3x2-plus-5xy-plus-2y2'
]);
const TILE_TYPES = new Set(['one', 'x', 'y', 'x2', 'xy', 'y2']);

function cleanTiles(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 300).flatMap((tile, index) => {
    const type = sanitizeString(tile?.type, 16);
    if (!TILE_TYPES.has(type)) return [];
    return [{
      id: sanitizeString(tile.id, 100) || `factor-tile-${index}`,
      type,
      sign: Number(tile.sign) < 0 ? -1 : 1,
      orientation: tile.orientation === 'vertical' ? 'vertical' : 'horizontal',
      x: Math.max(0, Math.min(500, Math.floor(Number(tile.x) || 0))),
      y: Math.max(0, Math.min(500, Math.floor(Number(tile.y) || 0)))
    }];
  });
}

function initFactorization({ recordCommunication, getUpgradeClientInfo, getWebSocketSessionInfo, sessionManager }) {
  const factorizationWss = new WebSocketServer({ noServer: true });
  const teachers = new Set();
  const studentsBySocket = new Map();
  let studentSeq = 0;
  let sessionSeq = 0;
  let questionId = 'perfect-square';
  let tiles = [];

  function record(event, direction, from, to, payload) {
    recordCommunication?.({ app: 'factorization-lab', event, direction, from, to, payload });
  }

  function emitState(target) {
    const participants = [...studentsBySocket.values()].map((student) => ({
      id: student.id, name: student.name, username: student.name,
      isCorrect: student.isCorrect, isConnected: true, connected: true
    }));
    const message = JSON.stringify({ type: 'factorization_state', questionId, tiles, participants, roster: participants });
    (target ? [target] : [...teachers, ...studentsBySocket.keys()]).forEach((socket) => {
      if (socket.readyState === 1) socket.send(message);
    });
  }

  factorizationWss.on('connection', (ws, request) => {
    const clientInfo = getUpgradeClientInfo?.(request) || { ip: 'unknown', userAgent: 'unknown' };
    const existing = String(getWebSocketSessionInfo?.(request)?.sessionId || '').trim();
    const sessionId = existing || `factorization-${Date.now().toString(36)}-${++sessionSeq}`;
    sessionManager?.create?.(sessionId, { ip: clientInfo.ip, userAgent: clientInfo.userAgent, username: 'Factorization participant', role: 'client', source: 'factorization-lab' });
    sessionManager?.joinApp?.(sessionId, 'factorization-lab');
    record('factorization-lab:ws-connect', 'in', clientInfo.ip || 'unknown', 'server', {});

    ws.on('message', (raw) => {
      let message;
      try { message = JSON.parse(raw); } catch { return; }
      const type = sanitizeString(message?.type, 64);
      if (!type) return;
      record(`factorization-lab:${type}`, 'in', clientInfo.ip || 'factorization-client', 'server', message);
      if (type === 'register_teacher') {
        teachers.add(ws);
        sessionManager?.update?.(sessionId, { username: sanitizeString(message.name, 40) || 'Factorization teacher', role: 'teacher', source: 'factorization-lab' });
        emitState(ws);
      } else if (type === 'register_student') {
        const previous = studentsBySocket.get(ws);
        const name = sanitizeString(message.name, 40) || previous?.name || `Student ${studentSeq + 1}`;
        studentsBySocket.set(ws, { id: previous?.id || `student-${++studentSeq}`, name, isCorrect: previous?.isCorrect || false });
        sessionManager?.update?.(sessionId, { username: name, role: 'student', source: 'factorization-lab' });
        emitState();
      } else if (type === 'request_state') {
        emitState(ws);
      } else if (type === 'teacher_lesson' && teachers.has(ws)) {
        const nextQuestionId = sanitizeString(message.questionId, 80);
        if (!QUESTION_IDS.has(nextQuestionId)) return;
        questionId = nextQuestionId;
        tiles = cleanTiles(message.tiles);
        studentsBySocket.forEach((student) => { student.isCorrect = false; });
        emitState();
      } else if (type === 'tiles_update' && (teachers.has(ws) || studentsBySocket.has(ws))) {
        tiles = cleanTiles(message.tiles);
        const student = studentsBySocket.get(ws);
        if (student) student.isCorrect = message.isCorrect === true;
        emitState();
      }
    });

    ws.on('close', () => {
      teachers.delete(ws);
      if (studentsBySocket.delete(ws)) emitState();
      record('factorization-lab:ws-close', 'in', clientInfo.ip || 'unknown', 'server', {});
      sessionManager?.leaveApp?.(sessionId, 'factorization-lab');
    });
  });

  return { factorizationWss };
}

module.exports = initFactorization;
