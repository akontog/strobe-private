const { WebSocketServer } = require('ws');
const { sanitizeString } = require('../utils/helpers');

function normalizeColor(value, fallback = '#3b82f6') {
  const raw = sanitizeString(value, 16) || '';
  const match = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  return match ? match[0].toLowerCase() : fallback;
}

function initPolynomial({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  sessionManager
}) {
  const polynomialWss = new WebSocketServer({ noServer: true });
  const teachers = new Set();
  const studentsBySocket = new Map();
  let studentSeq = 0;
  let sessionSeq = 0;
  const lessonState = {
    activityId: '1.1',
    datasetKey: 'monomials',
    expressionId: 'm-1'
  };

  function record(event, direction, from, to, payload) {
    if (typeof recordCommunication !== 'function') {
      return;
    }

    recordCommunication({
      app: 'polynomial-lab',
      event,
      direction,
      from,
      to,
      payload
    });
  }

  function ensureSessionId(ws) {
    if (ws && ws.__polySessionId) {
      return ws.__polySessionId;
    }

    sessionSeq += 1;
    const nextId = `poly-${Date.now().toString(36)}-${sessionSeq}`;
    if (ws) {
      ws.__polySessionId = nextId;
    }
    return nextId;
  }

  function resolveSessionId(request, ws) {
    if (typeof getWebSocketSessionInfo === 'function') {
      const sessionInfo = getWebSocketSessionInfo(request);
      const candidate = sessionInfo && sessionInfo.sessionId ? String(sessionInfo.sessionId).trim() : '';
      if (candidate) {
        if (ws) {
          ws.__polySessionId = candidate;
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
      answers: student.answers && typeof student.answers === 'object'
        ? Object.entries(student.answers).reduce((memo, [key, value]) => {
            const safeValue = value === undefined || value === null ? '' : String(value).trim();
            if (safeValue !== '' || value === 0 || value === false) {
              memo[key] = safeValue;
            }
            return memo;
          }, {})
        : {},
      expressionId: student.expressionId || lessonState.expressionId
    }));
  }

  function emitState(target) {
    const participants = buildParticipants();
    const payload = {
      type: 'polynomial_state',
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

  polynomialWss.on('connection', (ws, request) => {
    const connectionInfo = typeof getUpgradeClientInfo === 'function'
      ? getUpgradeClientInfo(request)
      : { ip: 'unknown', userAgent: 'unknown' };
    const sessionId = resolveSessionId(request, ws);

    if (sessionManager && typeof sessionManager.create === 'function') {
      sessionManager.create(sessionId, {
        ip: connectionInfo.ip,
        userAgent: connectionInfo.userAgent,
        username: 'Polynomial participant',
        role: 'client',
        source: 'polynomial-lab'
      });
      sessionManager.joinApp(sessionId, 'polynomial-lab');
    }

    record('polynomial-lab:ws-connect', 'in', connectionInfo.ip || 'unknown', 'server', {
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

      record(`polynomial-lab:${type}`, 'in', connectionInfo.ip || 'polynomial-client', 'server', message);

      if (type === 'register_teacher') {
        teachers.add(ws);

        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, {
            username: sanitizeString(message.name, 40) || 'Polynomial teacher',
            role: 'teacher',
            source: 'polynomial-lab'
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
        const previousAnswers = current?.answers && typeof current.answers === 'object'
          ? { ...current.answers }
          : {};

        studentsBySocket.set(ws, {
          id,
          name,
          color,
          answers: previousAnswers,
          expressionId: current?.expressionId || lessonState.expressionId
        });

        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, {
            username: name,
            role: 'student',
            source: 'polynomial-lab'
          }, {
            polynomial: { id, name, color }
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
        const datasetKey = sanitizeString(next.datasetKey, 32);
        const expressionId = sanitizeString(next.expressionId, 64);

        if (activityId) {
          lessonState.activityId = activityId;
        }
        if (datasetKey) {
          lessonState.datasetKey = datasetKey;
        }
        if (expressionId) {
          lessonState.expressionId = expressionId;
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
          const nextValue = value === undefined || value === null ? '' : String(value).trim();
          const safeKey = sanitizeString(key, 48) || key;
          if (nextValue !== '' || value === 0 || value === false) {
            memo[safeKey] = sanitizeString(nextValue, 64) || '';
          }
          return memo;
        }, {});
        current.expressionId = sanitizeString(message.expressionId, 64) || current.expressionId || lessonState.expressionId;

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

      record('polynomial-lab:ws-close', 'in', connectionInfo.ip || 'unknown', 'server', {
        reason: 'socket-closed'
      });

      if (sessionManager && typeof sessionManager.leaveApp === 'function') {
        sessionManager.leaveApp(sessionId, 'polynomial-lab');
      }
    });
  });

  return { polynomialWss };
}

module.exports = initPolynomial;
