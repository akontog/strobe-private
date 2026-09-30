const { WebSocketServer } = require('ws');
const { sanitizeString } = require('../utils/helpers');

function normalizeColor(value, fallback = '#3b82f6') {
  const raw = sanitizeString(value, 16) || '';
  const match = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  return match ? match[0].toLowerCase() : fallback;
}

function initLinearSystems({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  sessionManager
}) {
  const linearSystemsWss = new WebSocketServer({ noServer: true });
  const teachers = new Set();
  const studentsBySocket = new Map();
  let studentSeq = 0;
  let sessionSeq = 0;

  const lessonState = {
    activityId: '1',
    itemId: 'ls-1',
    geogebraRoomId: 'linear-systems-lab-3-2-1',
    showEquationGraph: true
  };

  function record(event, direction, from, to, payload) {
    if (typeof recordCommunication !== 'function') {
      return;
    }

    recordCommunication({
      app: 'linear-systems-lab',
      event,
      direction,
      from,
      to,
      payload
    });
  }

  function ensureSessionId(ws) {
    if (ws && ws.__linearSessionId) {
      return ws.__linearSessionId;
    }

    sessionSeq += 1;
    const nextId = `linear-${Date.now().toString(36)}-${sessionSeq}`;
    if (ws) {
      ws.__linearSessionId = nextId;
    }
    return nextId;
  }

  function resolveSessionId(request, ws) {
    if (typeof getWebSocketSessionInfo === 'function') {
      const sessionInfo = getWebSocketSessionInfo(request);
      const candidate = sessionInfo && sessionInfo.sessionId ? String(sessionInfo.sessionId).trim() : '';
      if (candidate) {
        if (ws) {
          ws.__linearSessionId = candidate;
        }
        return candidate;
      }
    }

    return ensureSessionId(ws);
  }

  function buildParticipants() {
    return [...studentsBySocket.values()].map((student) => ({
      id: student.id,
      name: student.name,
      username: student.name,
      color: student.color,
      isConnected: true,
      connected: true,
      answers: student.answers && typeof student.answers === 'object' ? { ...student.answers } : {},
      activityId: student.activityId || lessonState.activityId,
      itemId: student.itemId || lessonState.itemId
    }));
  }

  function emitState(target) {
    const participants = buildParticipants();
    const payload = {
      type: 'linear_systems_state',
      roster: participants,
      participants,
      lesson: lessonState
    };
    const serialized = JSON.stringify(payload);

    if (target) {
      if (target.readyState === 1) {
        target.send(serialized);
      }
      return;
    }

    const recipients = new Set([...teachers, ...studentsBySocket.keys()]);
    recipients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(serialized);
      }
    });
  }

  linearSystemsWss.on('connection', (ws, request) => {
    const connectionInfo = typeof getUpgradeClientInfo === 'function'
      ? getUpgradeClientInfo(request)
      : { ip: 'unknown', userAgent: 'unknown' };
    const sessionId = resolveSessionId(request, ws);

    if (sessionManager && typeof sessionManager.create === 'function') {
      sessionManager.create(sessionId, {
        ip: connectionInfo.ip,
        userAgent: connectionInfo.userAgent,
        username: 'Linear systems participant',
        role: 'client',
        source: 'linear-systems-lab'
      });
      sessionManager.joinApp(sessionId, 'linear-systems-lab');
    }

    record('linear-systems-lab:ws-connect', 'in', connectionInfo.ip || 'unknown', 'server', {
      userAgent: connectionInfo.userAgent || 'unknown'
    });

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        return;
      }

      const type = sanitizeString(message && message.type, 64);
      if (!type) {
        return;
      }

      record(`linear-systems-lab:${type}`, 'in', connectionInfo.ip || 'linear-client', 'server', message);

      if (type === 'register_teacher') {
        teachers.add(ws);

        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, {
            username: sanitizeString(message.name, 40) || 'Linear systems teacher',
            role: 'teacher',
            source: 'linear-systems-lab'
          });
        }

        emitState(ws);
        return;
      }

      if (type === 'register_student') {
        const current = studentsBySocket.get(ws);
        const id = current?.id || `student-${++studentSeq}`;
        const fallbackName = `Student ${studentSeq}`;
        const name = sanitizeString(message.name, 40) || current?.name || fallbackName;
        const color = normalizeColor(message.color, current?.color || '#3b82f6');
        const previousAnswers = current?.answers && typeof current.answers === 'object' ? { ...current.answers } : {};

        studentsBySocket.set(ws, {
          id,
          name,
          color,
          answers: previousAnswers,
          activityId: current?.activityId || lessonState.activityId,
          itemId: current?.itemId || lessonState.itemId
        });

        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, {
            username: name,
            role: 'student',
            source: 'linear-systems-lab'
          }, {
            linearSystems: { id, name, color }
          });
        }

        emitState();
        return;
      }

      if (type === 'request_state') {
        emitState(ws);
        return;
      }

      if (type === 'teacher_lesson') {
        if (!teachers.has(ws)) {
          return;
        }

        const next = message.lesson && typeof message.lesson === 'object' ? message.lesson : {};
        const activityId = sanitizeString(next.activityId, 64);
        const itemId = sanitizeString(next.itemId, 64);
        const geogebraRoomId = sanitizeString(next.geogebraRoomId, 80);
        const showEquationGraph = Boolean(next.showEquationGraph);

        if (activityId) {
          lessonState.activityId = activityId;
        }
        if (itemId) {
          lessonState.itemId = itemId;
        }
        if (Object.prototype.hasOwnProperty.call(next, 'geogebraRoomId')) {
          lessonState.geogebraRoomId = geogebraRoomId || '';
        }
        if (Object.prototype.hasOwnProperty.call(next, 'showEquationGraph')) {
          lessonState.showEquationGraph = showEquationGraph;
        }

        emitState();
        return;
      }

      if (type === 'student_answers') {
        const current = studentsBySocket.get(ws);
        if (!current) {
          return;
        }

        const rawAnswers = message.answers && typeof message.answers === 'object' ? message.answers : {};
        current.answers = Object.entries(rawAnswers).reduce((memo, [key, value]) => {
          const safeKey = sanitizeString(key, 48) || key;
          const safeValue = value === undefined || value === null ? '' : String(value).trim();
          if (safeValue !== '' || value === 0 || value === false) {
            memo[safeKey] = sanitizeString(safeValue, 64) || '';
          }
          return memo;
        }, {});
        current.activityId = sanitizeString(message.activityId, 64) || current.activityId || lessonState.activityId;
        current.itemId = sanitizeString(message.itemId, 64) || current.itemId || lessonState.itemId;

        studentsBySocket.set(ws, current);
        emitState();
      }
    });

    ws.on('close', () => {
      teachers.delete(ws);
      const removedStudent = studentsBySocket.delete(ws);
      if (removedStudent) {
        emitState();
      }

      record('linear-systems-lab:ws-close', 'in', connectionInfo.ip || 'unknown', 'server', {
        reason: 'socket-closed'
      });

      if (sessionManager && typeof sessionManager.leaveApp === 'function') {
        sessionManager.leaveApp(sessionId, 'linear-systems-lab');
      }
    });
  });

  return { linearSystemsWss };
}

module.exports = initLinearSystems;
