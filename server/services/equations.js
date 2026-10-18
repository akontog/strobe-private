const { WebSocketServer } = require('ws');
const { sanitizeString } = require('../utils/helpers');

const QUESTION_IDS = new Set([
  'x-plus-2-equals-5',
  '2x-plus-3-equals-x-plus-7',
  '3x-plus-2-equals-2x-plus-6'
]);
const TILE_TYPES = new Set(['one', 'x', 'y', 'x2', 'xy', 'y2']);

function cleanTiles(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 250).flatMap((tile, index) => {
    const type = sanitizeString(tile?.type, 16);
    const side = tile?.side === 'right' ? 'right' : tile?.side === 'left' ? 'left' : '';
    if (!TILE_TYPES.has(type) || !side) return [];
    return [{
      id: sanitizeString(tile.id, 100) || `equation-tile-${index}`,
      type,
      sign: Number(tile.sign) < 0 ? -1 : 1,
      orientation: tile.orientation === 'vertical' ? 'vertical' : 'horizontal',
      side,
      x: Math.max(0, Math.min(500, Math.floor(Number(tile.x) || 0))),
      y: Math.max(0, Math.min(500, Math.floor(Number(tile.y) || 0)))
    }];
  });
}

function initEquations({ recordCommunication, getUpgradeClientInfo, getWebSocketSessionInfo, sessionManager }) {
  const equationsWss = new WebSocketServer({ noServer: true });
  const teachers = new Set();
  const studentsBySocket = new Map();
  let studentSeq = 0;
  let sessionSeq = 0;
  let lesson = { activityId: '1', questionId: 'x-plus-2-equals-5' };
  let tiles = [];

  function record(event, direction, from, to, payload) {
    if (typeof recordCommunication === 'function') {
      recordCommunication({ app: 'equations-lab', event, direction, from, to, payload });
    }
  }

  function resolveSessionId(request, ws) {
    const sessionInfo = typeof getWebSocketSessionInfo === 'function' ? getWebSocketSessionInfo(request) : null;
    const existingId = String(sessionInfo?.sessionId || '').trim();
    if (existingId) return existingId;
    sessionSeq += 1;
    const sessionId = `equations-${Date.now().toString(36)}-${sessionSeq}`;
    ws.__equationsSessionId = sessionId;
    return sessionId;
  }

  function emitState(target) {
    const participants = [...studentsBySocket.values()].map((student) => ({
      id: student.id,
      name: student.name,
      username: student.name,
      answer: student.answers[lesson.questionId] || '',
      isConnected: true,
      connected: true
    }));
    const message = JSON.stringify({ type: 'equations_state', lesson, tiles, participants, roster: participants });
    const recipients = target ? [target] : [...teachers, ...studentsBySocket.keys()];
    recipients.forEach((socket) => {
      if (socket.readyState === 1) socket.send(message);
    });
  }

  equationsWss.on('connection', (ws, request) => {
    const clientInfo = typeof getUpgradeClientInfo === 'function'
      ? getUpgradeClientInfo(request)
      : { ip: 'unknown', userAgent: 'unknown' };
    const sessionId = resolveSessionId(request, ws);
    sessionManager?.create?.(sessionId, {
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      username: 'Equations participant',
      role: 'client',
      source: 'equations-lab'
    });
    sessionManager?.joinApp?.(sessionId, 'equations-lab');
    record('equations-lab:ws-connect', 'in', clientInfo.ip || 'unknown', 'server', {});

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        return;
      }
      const type = sanitizeString(message?.type, 64);
      if (!type) return;
      record(`equations-lab:${type}`, 'in', clientInfo.ip || 'equations-client', 'server', message);

      if (type === 'register_teacher') {
        teachers.add(ws);
        sessionManager?.update?.(sessionId, {
          username: sanitizeString(message.name, 40) || 'Equations teacher',
          role: 'teacher',
          source: 'equations-lab'
        });
        emitState(ws);
        return;
      }

      if (type === 'register_student') {
        const previous = studentsBySocket.get(ws);
        const id = previous?.id || `student-${++studentSeq}`;
        const name = sanitizeString(message.name, 40) || previous?.name || `Student ${studentSeq}`;
        studentsBySocket.set(ws, { id, name, answers: previous?.answers || {} });
        sessionManager?.update?.(sessionId, { username: name, role: 'student', source: 'equations-lab' });
        emitState();
        return;
      }

      if (type === 'request_state') {
        emitState(ws);
        return;
      }

      if (type === 'teacher_lesson' && teachers.has(ws)) {
        const questionId = sanitizeString(message.lesson?.questionId, 80);
        if (!QUESTION_IDS.has(questionId)) return;
        lesson = { activityId: '1', questionId };
        tiles = cleanTiles(message.tiles);
        emitState();
        return;
      }

      if (type === 'tiles_update' && (teachers.has(ws) || studentsBySocket.has(ws))) {
        tiles = cleanTiles(message.tiles);
        emitState();
        return;
      }

      if (type === 'answer_update' && studentsBySocket.has(ws)) {
        const questionId = sanitizeString(message.questionId, 80);
        if (!QUESTION_IDS.has(questionId)) return;
        const student = studentsBySocket.get(ws);
        student.answers[questionId] = sanitizeString(message.answer, 40);
        emitState();
      }
    });

    ws.on('close', () => {
      teachers.delete(ws);
      if (studentsBySocket.delete(ws)) emitState();
      record('equations-lab:ws-close', 'in', clientInfo.ip || 'unknown', 'server', {});
      sessionManager?.leaveApp?.(sessionId, 'equations-lab');
    });
  });

  return { equationsWss };
}

module.exports = initEquations;
