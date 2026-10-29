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
  const teacherAssignments = new Map();
  const studentsBySocket = new Map();
  let studentSeq = 0;
  let assignmentCursor = 0;
  let teacherAssignmentIndex = null;
  let equationsDistributed = false;
  let sessionSeq = 0;

  const lessonState = {
    activityId: '1',
    itemId: 'eq-1',
    expressionId: 'expr-1',
    lineSystemIndex: 0,
    geogebraRoomId: 'linear-systems-lab-3-2-1',
    showEquationGraph: true
  };

  function isGeometrySystemsActivity() {
    return String(lessonState.activityId || '') === '6';
  }

  function normalizeAssignmentIndex(value) {
    const numeric = Number(value);
    if (!Number.isInteger(numeric)) {
      return 0;
    }
    const normalized = numeric % 8;
    return normalized < 0 ? normalized + 8 : normalized;
  }

  function getSharedGroupAssignmentIndex() {
    return normalizeAssignmentIndex(lessonState.lineSystemIndex);
  }

  function getTeacherPreviewAssignmentIndex() {
    if (isGeometrySystemsActivity()) {
      return (getSharedGroupAssignmentIndex() + 1) % 8;
    }
    if (!Number.isInteger(teacherAssignmentIndex)) {
      teacherAssignmentIndex = assignmentCursor++ % 8;
    }
    return teacherAssignmentIndex;
  }

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
      assignmentIndex: student.assignmentIndex,
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

  function allocateEquationIndex(reservedIndexes = new Set()) {
    for (let offset = 0; offset < 8; offset += 1) {
      const candidate = (assignmentCursor + offset) % 8;
      if (!reservedIndexes.has(candidate)) {
        assignmentCursor = candidate + 1;
        return candidate;
      }
    }
    const candidate = assignmentCursor++ % 8;
    return candidate;
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
        const teacherIndex = getTeacherPreviewAssignmentIndex();
        teacherAssignments.set(ws, teacherIndex);
        const assignmentIndex = teacherAssignments.get(ws);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'linear_systems_assignment', studentId: `teacher-${sessionSeq}`, assignmentIndex }));
        }

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
        const assignedIndexes = new Set([
          ...teacherAssignments.values(),
          ...[...studentsBySocket.values()].map((student) => student.assignmentIndex)
        ].filter(Number.isInteger));
        const assignmentIndex = equationsDistributed
          ? (isGeometrySystemsActivity()
            ? getSharedGroupAssignmentIndex()
            : (Number.isInteger(current?.assignmentIndex) ? current.assignmentIndex : allocateEquationIndex(assignedIndexes)))
          : null;
        const fallbackName = `Student ${studentSeq}`;
        const name = sanitizeString(message.name, 40) || current?.name || fallbackName;
        const color = normalizeColor(message.color, current?.color || '#3b82f6');
        const previousAnswers = current?.answers && typeof current.answers === 'object' ? { ...current.answers } : {};

        studentsBySocket.set(ws, {
          id,
          name,
          color,
          assignmentIndex,
          answers: previousAnswers,
          activityId: current?.activityId || lessonState.activityId,
          itemId: current?.itemId || lessonState.itemId
        });

        if (equationsDistributed && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'linear_systems_assignment', studentId: id, assignmentIndex }));
        }

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

      if (type === 'assign_equations') {
        if (!teachers.has(ws)) return;
        equationsDistributed = true;
        const reservedIndexes = new Set([...teacherAssignments.values()]);
        const sharedAssignmentIndex = getSharedGroupAssignmentIndex();
        for (const [studentSocket, current] of studentsBySocket.entries()) {
          const assignmentIndex = isGeometrySystemsActivity()
            ? sharedAssignmentIndex
            : allocateEquationIndex(reservedIndexes);
          reservedIndexes.add(assignmentIndex);
          studentsBySocket.set(studentSocket, { ...current, assignmentIndex, answers: {} });
          if (studentSocket.readyState === 1) {
            studentSocket.send(JSON.stringify({ type: 'linear_systems_assignment', studentId: current.id, assignmentIndex }));
          }
        }
        emitState();
        return;
      }

      if (type === 'end_equation_session') {
        if (!teachers.has(ws)) return;
        equationsDistributed = false;
        for (const [studentSocket, current] of studentsBySocket.entries()) {
          studentsBySocket.set(studentSocket, { ...current, assignmentIndex: null, answers: {} });
          if (studentSocket.readyState === 1) {
            studentSocket.send(JSON.stringify({ type: 'linear_systems_assignment', studentId: current.id, assignmentIndex: null }));
          }
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
        const expressionId = sanitizeString(next.expressionId, 64);
        const lineSystemIndex = Number(next.lineSystemIndex);
        const geogebraRoomId = sanitizeString(next.geogebraRoomId, 80);
        const showEquationGraph = Boolean(next.showEquationGraph);

        if (activityId) {
          lessonState.activityId = activityId;
        }
        if (itemId) {
          lessonState.itemId = itemId;
        }
        if (Object.prototype.hasOwnProperty.call(next, 'expressionId')) {
          lessonState.expressionId = expressionId;
        }
        if (Object.prototype.hasOwnProperty.call(next, 'lineSystemIndex') && Number.isInteger(lineSystemIndex)) {
          lessonState.lineSystemIndex = normalizeAssignmentIndex(lineSystemIndex);
        }
        if (Object.prototype.hasOwnProperty.call(next, 'geogebraRoomId')) {
          lessonState.geogebraRoomId = geogebraRoomId || '';
        }
        if (Object.prototype.hasOwnProperty.call(next, 'showEquationGraph')) {
          lessonState.showEquationGraph = showEquationGraph;
        }

        if (isGeometrySystemsActivity()) {
          const teacherIndex = getTeacherPreviewAssignmentIndex();
          for (const teacherSocket of teachers.values()) {
            teacherAssignments.set(teacherSocket, teacherIndex);
            if (teacherSocket.readyState === 1) {
              teacherSocket.send(JSON.stringify({ type: 'linear_systems_assignment', studentId: `teacher-${sessionSeq}`, assignmentIndex: teacherIndex }));
            }
          }

          if (equationsDistributed) {
            const sharedAssignmentIndex = getSharedGroupAssignmentIndex();
            for (const [studentSocket, current] of studentsBySocket.entries()) {
              studentsBySocket.set(studentSocket, { ...current, assignmentIndex: sharedAssignmentIndex, answers: {} });
              if (studentSocket.readyState === 1) {
                studentSocket.send(JSON.stringify({ type: 'linear_systems_assignment', studentId: current.id, assignmentIndex: sharedAssignmentIndex }));
              }
            }
          }
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
            const maxValueLength = (safeKey === 'selectedPoints' || safeKey === 'selectedLines') ? 4096 : 64;
            memo[safeKey] = sanitizeString(safeValue, maxValueLength) || '';
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
      teacherAssignments.delete(ws);
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
