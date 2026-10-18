const { WebSocketServer } = require('ws');
const { sanitizeString } = require('../utils/helpers');

function initIdentities({ recordCommunication, getUpgradeClientInfo, getWebSocketSessionInfo, sessionManager }) {
  const identitiesWss = new WebSocketServer({ noServer: true });
  const teachers = new Set();
  const studentsBySocket = new Map();
  let studentSeq = 0;
  let sessionSeq = 0;
  let lesson = null;

  function resolveSessionId(request, ws) {
    const sessionInfo = typeof getWebSocketSessionInfo === 'function'
      ? getWebSocketSessionInfo(request)
      : null;
    const existingId = String(sessionInfo?.sessionId || '').trim();
    if (existingId) return existingId;
    sessionSeq += 1;
    const sessionId = `identities-${Date.now().toString(36)}-${sessionSeq}`;
    ws.__identitiesSessionId = sessionId;
    return sessionId;
  }

  function record(event, direction, from, to, payload) {
    if (typeof recordCommunication !== 'function') return;
    recordCommunication({ app: 'identities-lab', event, direction, from, to, payload });
  }

  function emitState(target) {
    const participants = [...studentsBySocket.values()].map((student) => ({
      id: student.id,
      name: student.name,
      username: student.name,
      isConnected: true,
      connected: true
    }));
    const serialized = JSON.stringify({ type: 'identities_state', participants, roster: participants, lesson });
    const recipients = target ? [target] : [...teachers, ...studentsBySocket.keys()];
    recipients.forEach((socket) => {
      if (socket.readyState === 1) socket.send(serialized);
    });
  }

  identitiesWss.on('connection', (ws, request) => {
    const connectionInfo = typeof getUpgradeClientInfo === 'function'
      ? getUpgradeClientInfo(request)
      : { ip: 'unknown', userAgent: 'unknown' };
    const sessionId = resolveSessionId(request, ws);

    if (sessionManager && typeof sessionManager.create === 'function') {
      sessionManager.create(sessionId, {
        ip: connectionInfo.ip,
        userAgent: connectionInfo.userAgent,
        username: 'Identities participant',
        role: 'client',
        source: 'identities-lab'
      });
      sessionManager.joinApp(sessionId, 'identities-lab');
    }

    record('identities-lab:ws-connect', 'in', connectionInfo.ip || 'unknown', 'server', {});

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        return;
      }

      const type = sanitizeString(message?.type, 64);
      if (!type) return;
      record(`identities-lab:${type}`, 'in', connectionInfo.ip || 'identities-client', 'server', message);

      if (type === 'register_teacher') {
        teachers.add(ws);
        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, {
            username: sanitizeString(message.name, 40) || 'Identities teacher',
            role: 'teacher',
            source: 'identities-lab'
          });
        }
        emitState(ws);
        return;
      }

      if (type === 'register_student') {
        const current = studentsBySocket.get(ws);
        const id = current?.id || `student-${++studentSeq}`;
        const name = sanitizeString(message.name, 40) || current?.name || `Student ${studentSeq}`;
        studentsBySocket.set(ws, { id, name });
        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, { username: name, role: 'student', source: 'identities-lab' }, { identities: { id, name } });
        }
        emitState();
        return;
      }

      if (type === 'request_state') emitState(ws);

      if (type === 'teacher_lesson' && teachers.has(ws)) {
        const activityId = sanitizeString(message.lesson?.activityId, 64);
        const variantId = sanitizeString(message.lesson?.variantId, 64);
        if (!activityId) return;
        lesson = { activityId, variantId };
        emitState();
      }
    });

    ws.on('close', () => {
      teachers.delete(ws);
      if (studentsBySocket.delete(ws)) emitState();
      record('identities-lab:ws-close', 'in', connectionInfo.ip || 'unknown', 'server', {});
      if (sessionManager && typeof sessionManager.leaveApp === 'function') {
        sessionManager.leaveApp(sessionId, 'identities-lab');
      }
    });
  });

  return { identitiesWss };
}

module.exports = initIdentities;
