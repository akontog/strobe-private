const { WebSocketServer } = require('ws');
const { sanitizeString } = require('../utils/helpers');

const INITIAL_PRIME = 2;

function normalizeColor(value, fallback = '#3b82f6') {
  const raw = sanitizeString(value, 16) || '';
  const match = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  return match ? match[0].toLowerCase() : fallback;
}

function initPrimes({
  recordCommunication,
  getUpgradeClientInfo,
  sessionManager
}) {
  const primesWss = new WebSocketServer({ noServer: true });
  const primesTeachers = new Set();
  const primesStudents = new Map();
  const studentBySocket = new Map();
  let studentSeq = 0;
  let sessionSeq = 0;

  const lesson = {
    currentPrime: INITIAL_PRIME,
    activeStudentId: null
  };

  function ensureSessionId(ws) {
    if (ws && ws.__primesSessionId) {
      return ws.__primesSessionId;
    }

    sessionSeq += 1;
    const nextId = `primes-${Date.now().toString(36)}-${sessionSeq}`;
    if (ws) {
      ws.__primesSessionId = nextId;
    }
    return nextId;
  }

  function nextStudentId() {
    studentSeq += 1;
    return `student-${studentSeq}`;
  }

  function listStudents() {
    return [...primesStudents.values()].map((student) => ({
      id: student.id,
      name: student.name,
      color: student.color,
      selectedCorrect: [...student.selectedCorrect],
      selectedWrong: [...student.selectedWrong]
    }));
  }

  function findCorrectOwnerId(number) {
    for (const student of primesStudents.values()) {
      if (student.selectedCorrect.includes(number)) {
        return student.id;
      }
    }
    return null;
  }

  function emitState(target, extra = {}) {
    const payload = {
      type: 'primes_state',
      currentPrime: lesson.currentPrime,
      activeStudentId: lesson.activeStudentId,
      students: listStudents(),
      ...extra
    };
    const message = JSON.stringify(payload);

    if (target) {
      if (target.readyState === 1) {
        target.send(message);
      }
      return;
    }

    const allSockets = new Set([...primesTeachers, ...studentBySocket.keys()]);
    allSockets.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(message);
      }
    });
  }

  function record(event, direction, from, to, payload) {
    if (typeof recordCommunication !== 'function') {
      return;
    }
    recordCommunication({
      app: 'primes-lab',
      event,
      direction,
      from,
      to,
      payload
    });
  }

  function ensureActiveStudent() {
    if (lesson.activeStudentId && primesStudents.has(lesson.activeStudentId)) {
      return;
    }
    lesson.activeStudentId = primesStudents.size ? [...primesStudents.keys()][0] : null;
  }

  primesWss.on('connection', (ws, request) => {
    const connectionInfo = typeof getUpgradeClientInfo === 'function'
      ? getUpgradeClientInfo(request)
      : { ip: 'unknown', userAgent: 'unknown' };
    const sessionId = ensureSessionId(ws);

    if (sessionManager && typeof sessionManager.create === 'function') {
      sessionManager.create(sessionId, {
        ip: connectionInfo.ip,
        userAgent: connectionInfo.userAgent,
        username: 'Primes participant',
        role: 'client',
        source: 'primes-lab'
      });
      sessionManager.joinApp(sessionId, 'primes-lab');
    }

    record('primes-lab:ws-connect', 'in', connectionInfo.ip || 'unknown', 'server', {
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

      record(`primes-lab:${type}`, 'in', connectionInfo.ip || 'primes-client', 'server', message);

      if (type === 'register_teacher') {
        primesTeachers.add(ws);
        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, {
            username: sanitizeString(message.name, 40) || 'Primes teacher',
            role: 'teacher',
            source: 'primes-lab'
          });
        }
        emitState(ws);
        return;
      }

      if (type === 'register_student') {
        const requestedStudentId = sanitizeString(message.studentId, 32);
        const knownStudentId = studentBySocket.get(ws);
        const studentId = knownStudentId || requestedStudentId || nextStudentId();
        const previous = primesStudents.get(studentId);
        const name = sanitizeString(message.name, 40) || previous?.name || `Student ${studentSeq}`;
        const color = normalizeColor(message.color, previous?.color || '#3b82f6');

        primesStudents.set(studentId, {
          id: studentId,
          name,
          color,
          selectedCorrect: previous?.selectedCorrect || [],
          selectedWrong: previous?.selectedWrong || []
        });

        studentBySocket.set(ws, studentId);
        ensureActiveStudent();

        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.update(sessionId, {
            username: name,
            role: 'student',
            source: 'primes-lab'
          }, {
            primes: {
              studentId,
              name,
              color
            }
          });
        }

        emitState(null, { viewerStudentId: studentId });
        return;
      }

      if (type === 'request_state') {
        const studentId = studentBySocket.get(ws);
        emitState(ws, studentId ? { viewerStudentId: studentId } : {});
        return;
      }

      if (type === 'select_prime') {
        if (!primesTeachers.has(ws)) {
          return;
        }

        const prime = Number(message.prime);
        if (!Number.isInteger(prime) || prime < 2 || prime > 100) {
          return;
        }
        lesson.currentPrime = prime;
        emitState();
        return;
      }

      if (type === 'select_active_student') {
        if (!primesTeachers.has(ws)) {
          return;
        }

        const studentId = sanitizeString(message.studentId, 32);
        if (!studentId || !primesStudents.has(studentId)) {
          return;
        }

        lesson.activeStudentId = studentId;
        emitState();
        return;
      }

      if (type === 'student_toggle_number') {
        const studentId = studentBySocket.get(ws);
        if (!studentId) {
          return;
        }

        const student = primesStudents.get(studentId);
        if (!student) {
          return;
        }

        const number = Number(message.number);
        if (!Number.isInteger(number) || number < 2 || number > 100) {
          return;
        }

        if (number === lesson.currentPrime) {
          return;
        }

        const isTarget = number > lesson.currentPrime && number % lesson.currentPrime === 0;
        if (isTarget) {
          const ownerId = findCorrectOwnerId(number);
          if (ownerId && ownerId !== studentId) {
            return;
          }
          if (!student.selectedCorrect.includes(number)) {
            student.selectedCorrect.push(number);
          }
          student.selectedWrong = student.selectedWrong.filter((item) => item !== number);
          emitState();
          return;
        }

        const ownerId = findCorrectOwnerId(number);
        if (ownerId) {
          return;
        }

        if (student.selectedWrong.includes(number)) {
          student.selectedWrong = student.selectedWrong.filter((item) => item !== number);
        } else {
          student.selectedWrong.push(number);
        }
        emitState();
      }
    });

    ws.on('close', () => {
      primesTeachers.delete(ws);

      const studentId = studentBySocket.get(ws);
      if (studentId) {
        studentBySocket.delete(ws);
        primesStudents.delete(studentId);
        ensureActiveStudent();
        emitState();
      }

      record('primes-lab:ws-close', 'in', connectionInfo.ip || 'unknown', 'server', {
        reason: 'socket-closed'
      });

      if (sessionManager && typeof sessionManager.remove === 'function') {
        sessionManager.remove(sessionId);
      }
    });
  });

  return { primesWss };
}

module.exports = initPrimes;