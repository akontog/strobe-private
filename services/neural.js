// services/neural.js
const { WebSocketServer } = require('ws');
const { sanitizeString } = require('../utils/helpers'); // Εισαγωγή του helper

module.exports = function initNeural({
  recordCommunication,
  getUpgradeClientInfo,
  touchCanvasNodeConnection,
  canvasNodeConnectionMeta,
  httpServer,
  sessionManager
}) {
  console.log('[neural-lab] ⚙️ Initializing Neural service...');

  const canvasNodeWss = new WebSocketServer({ noServer: true });
  const canvasNodeTeachers = new Set();
  const canvasNodeStudents = new Map();
  let canvasSessionSeq = 0;
  const CANVAS_NODE_THRESHOLD = 5;
  const canvasNodeLesson = {
    dataset: 'vehicles',
    exampleIndex: 0,
    exampleName: 'Αυτοκίνητο',
    icon: '🚗',
    inputs: { i1: 2, i2: 3 },
    useQuestionMarks: false,
    threshold: CANVAS_NODE_THRESHOLD
  };
  const CANVAS_NODE_INPUTS = {
    wheels: { key: 'wheels', type: 'number', min: 0, max: 6, fallback: 4 },
    hasEngine: { key: 'hasEngine', type: 'boolean', fallback: true },
    seats: { key: 'seats', type: 'number', min: 1, max: 8, fallback: 4 },
    hasPedals: { key: 'hasPedals', type: 'boolean', fallback: false }
  };
  const CANVAS_NODE_INPUT_KEYS = Object.keys(CANVAS_NODE_INPUTS);
  const CANVAS_NODE_OUTPUT_KEYS = ['car', 'bicycle', 'motorcycle', 'scooter'];

  function ensureCanvasSessionId(ws) {
    if (ws && ws.__canvasSessionId) {
      return ws.__canvasSessionId;
    }

    canvasSessionSeq += 1;
    const nextId = `neural-${Date.now().toString(36)}-${canvasSessionSeq}`;
    if (ws) {
      ws.__canvasSessionId = nextId;
    }
    return nextId;
  }

  const canvasNodeModel = {
    inputs: {
      wheels: { enabled: true, value: 4 },
      hasEngine: { enabled: true, value: true },
      seats: { enabled: true, value: 4 },
      hasPedals: { enabled: true, value: false }
    },
    weights: {
      wheels: 1,
      hasEngine: 1,
      seats: 1,
      hasPedals: 1
    },
    outputsEnabled: {
      car: true,
      bicycle: false,
      motorcycle: false,
      scooter: false
    }
  };

  // Όλες οι συναρτήσεις που χρησιμοποιούν τις εξαρτήσεις
  function clampCanvasNodeNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }
// 
  function normalizeCanvasNodeStudentWeights(weights, fallback = {}) {
    const source = weights && typeof weights === 'object' ? weights : {};
    const fallbackW1 = Number.isFinite(Number(fallback.w1)) ? Number(fallback.w1) : 1;
    const fallbackW2 = Number.isFinite(Number(fallback.w2)) ? Number(fallback.w2) : 1;
    return {
      w1: Number(clampCanvasNodeNumber(source.w1, -4, 4, fallbackW1).toFixed(1)),
      w2: Number(clampCanvasNodeNumber(source.w2, -4, 4, fallbackW2).toFixed(1))
    };
  }

  function computeCanvasNodeStudentResult(weights) {
    const safeWeights = normalizeCanvasNodeStudentWeights(weights, weights);
    const result = (safeWeights.w1 * canvasNodeLesson.inputs.i1) + (safeWeights.w2 * canvasNodeLesson.inputs.i2);
    return Number(result.toFixed(2));
  }

  function buildCanvasNodeStudentSnapshot(student) {
    const weights = normalizeCanvasNodeStudentWeights(student && student.weights, student && student.weights);
    const result = computeCanvasNodeStudentResult(weights);
    return {
      id: student.id,
      role: 'client',
      name: student.name,
      weights,
      i1: canvasNodeLesson.inputs.i1,
      i2: canvasNodeLesson.inputs.i2,
      result,
      threshold: CANVAS_NODE_THRESHOLD,
      aboveThreshold: result >= CANVAS_NODE_THRESHOLD
    };
  }

  function buildCanvasNodeParticipants() {
    return [...canvasNodeStudents.values()]
      .sort((a, b) => (a.connectedAt - b.connectedAt) || a.name.localeCompare(b.name))
      .map((student) => buildCanvasNodeStudentSnapshot(student));
  }
// Δημιουργεί μια λίστα με όλους τους δασκάλους και τους μαθητές, ταξινομημένη κατά όνομα
  function buildCanvasNodeRoster() {
    const teachers = [...canvasNodeTeachers].map((teacherWs) => {
      const meta = canvasNodeConnectionMeta.get(teacherWs) || {};
      return {
        id: meta.id || `teacher-${Math.floor(Math.random() * 100000)}`,
        role: 'teacher',
        name: meta.name || 'Teacher'
      };
    }).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    const students = [...canvasNodeStudents.values()]
      .sort((a, b) => (a.connectedAt - b.connectedAt) || a.name.localeCompare(b.name))
      .map((student) => ({
        id: student.id,
        role: 'client',
        name: student.name
      }));

    return [...teachers, ...students];
  }
// Στέλνει την κατάσταση του μαθήματος σε όλους τους δασκάλους
  function canvasNodeBroadcastTeachers(data) {
    const message = JSON.stringify(data);
    const teacherCount = canvasNodeTeachers.size;
    console.log(`[neural-lab] 📡 Broadcasting to ${teacherCount} teacher(s):`, {
      type: data.type,
      participants: data.participants?.length || 0,
      roster: data.roster?.length || 0
    });

    recordCommunication({
      app: 'neural-lab',
      direction: 'out',
      event: 'neural-lab:canvas_state',
      from: 'server',
      to: 'neural-lab:teachers',
      payload: { participants: Array.isArray(data?.participants) ? data.participants.length : 0 }
    });
    canvasNodeTeachers.forEach((teacherWs) => {
      if (teacherWs.readyState === 1) teacherWs.send(message);
    });
  }
// Στέλνει την κατάσταση του μαθήματος σε έναν συγκεκριμένο μαθητή
  function canvasNodeSendStudentState(studentWs) {
    const student = canvasNodeStudents.get(studentWs);
    if (!student || studentWs.readyState !== 1) return;
    const payload = {
      type: 'canvas_state',
      lesson: {
        ...canvasNodeLesson,
        inputs: { ...canvasNodeLesson.inputs }
      },
      roster: buildCanvasNodeRoster(),
      me: buildCanvasNodeStudentSnapshot(student)
    };
    console.log(`[neural-lab] 📤 Sending state to student "${student.name}" (${student.id})`);
    studentWs.send(JSON.stringify(payload));
  }
// Στέλνει την πλήρη κατάσταση του μαθήματος σε όλους τους δασκάλους και τους μαθητές
  function canvasNodeBroadcastState() {
    console.log('[neural-lab] 🔄 Broadcasting full state (teachers + students)');
    const model = {
      inputs: { ...canvasNodeModel.inputs },
      weights: { ...canvasNodeModel.weights },
      outputsEnabled: { ...canvasNodeModel.outputsEnabled }
    };
    const participants = buildCanvasNodeParticipants();
    const roster = buildCanvasNodeRoster();
    canvasNodeBroadcastTeachers({
      type: 'canvas_state',
      lesson: {
        ...canvasNodeLesson,
        inputs: { ...canvasNodeLesson.inputs }
      },
      roster,
      model,
      participants
    });
    canvasNodeStudents.forEach((_, studentWs) => canvasNodeSendStudentState(studentWs));
  }

  // WebSocket connection handler
  canvasNodeWss.on('connection', (ws, request) => {
    const connectionInfo = getUpgradeClientInfo(request);
    const sessionId = ensureCanvasSessionId(ws);
    console.log(`[neural-lab] 🔌 New WebSocket connection from ${connectionInfo.ip} (${connectionInfo.userAgent || 'unknown UA'})`);

    if (sessionManager && typeof sessionManager.create === 'function') {
      sessionManager.create(sessionId, {
        ip: connectionInfo.ip,
        userAgent: connectionInfo.userAgent,
        username: 'Canvas participant',
        role: 'client',
        source: 'neural-lab'
      });
      sessionManager.joinApp(sessionId, 'neural-lab');
    }

    recordCommunication({
      app: 'neural-lab',
      direction: 'in',
      event: 'neural-lab:ws-connect',
      from: connectionInfo.ip || 'unknown',
      to: 'server',
      payload: { userAgent: connectionInfo.userAgent || 'unknown' }
    });

    canvasNodeConnectionMeta.set(ws, {
      connectedAt: Date.now(),
      lastSeenAt: Date.now(),
      ip: connectionInfo.ip,
      userAgent: connectionInfo.userAgent,
      role: 'unknown',
      name: 'Canvas participant'
    });

    ws.on('message', (raw) => {
      touchCanvasNodeConnection(ws);
      let message;
      try { message = JSON.parse(String(raw)); } catch {
        console.log('[neural-lab] ⚠️ Received invalid JSON');
        return;
      }

      const meta = canvasNodeConnectionMeta.get(ws) || {};
      const messageType = message?.type ? String(message.type) : 'message';
      console.log(`[neural-lab] 📨 Received message type "${messageType}" from ${meta.name || meta.ip || 'unknown'}`);

      recordCommunication({
        app: 'neural-lab',
        direction: 'in',
        event: `neural-lab:${messageType}`,
        from: meta.name || meta.ip || 'canvas-client',
        to: 'server',
        payload: message
      });

      if (message.type === 'register_teacher') {
        const teacherName = sanitizeString(message.name, 40) || 'Teacher';
        console.log(`[neural-lab] 👨‍🏫 Registering teacher: "${teacherName}"`);
        canvasNodeTeachers.add(ws);
        touchCanvasNodeConnection(ws, { role: 'teacher', name: teacherName });
        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.joinApp(sessionId, 'neural-lab');
          sessionManager.update(sessionId, {
            username: teacherName,
            role: 'teacher',
            source: 'neural-lab'
          }, {
            neural: {
              role: 'teacher',
              lesson: {
                dataset: canvasNodeLesson.dataset,
                exampleName: canvasNodeLesson.exampleName,
                useQuestionMarks: canvasNodeLesson.useQuestionMarks
              }
            }
          });
        }
        canvasNodeBroadcastState();
        return;
      }

      if (message.type === 'register_student') {
        const studentName = sanitizeString(message.name, 40) || `Student-${Math.floor(Math.random() * 900 + 100)}`;
        console.log(`[neural-lab] 🧑‍🎓 Registering student: "${studentName}"`);
        const existing = canvasNodeStudents.get(ws);
        if (existing) {
          existing.name = studentName;
          existing.weights = normalizeCanvasNodeStudentWeights(existing.weights, existing.weights);
        } else {
          canvasNodeStudents.set(ws, {
            id: `canvas-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000).toString(16)}`,
            name: studentName,
            connectedAt: Date.now(),
            weights: { w1: 1, w2: 1 }
          });
        }
        touchCanvasNodeConnection(ws, { role: 'client', name: studentName });
        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.joinApp(sessionId, 'neural-lab');
          sessionManager.update(sessionId, {
            username: studentName,
            role: 'client',
            source: 'neural-lab'
          }, {
            neural: {
              role: 'client',
              weights: {
                w1: canvasNodeStudents.get(ws).weights.w1,
                w2: canvasNodeStudents.get(ws).weights.w2
              }
            }
          });
        }
        canvasNodeBroadcastState();
        return;
      }

      if (message.type === 'student_weights' || message.type === 'student_weight') {
        const student = canvasNodeStudents.get(ws);
        if (!student) {
          console.log('[neural-lab] ⚠️ Received weight update but student not registered');
          return;
        }
        const incomingWeights = message.type === 'student_weights'
          ? (message?.weights && typeof message.weights === 'object' ? message.weights : {})
          : { [String(message.key || '').trim()]: message.value };
        console.log(`[neural-lab] ⚖️ Updating weights for student "${student.name}":`, incomingWeights);
        const prevWeights = normalizeCanvasNodeStudentWeights(student.weights, student.weights);
        const nextWeights = normalizeCanvasNodeStudentWeights({
          w1: Object.prototype.hasOwnProperty.call(incomingWeights, 'w1') ? incomingWeights.w1 : student.weights?.w1,
          w2: Object.prototype.hasOwnProperty.call(incomingWeights, 'w2') ? incomingWeights.w2 : student.weights?.w2
        }, student.weights);

        if (prevWeights.w1 === nextWeights.w1 && prevWeights.w2 === nextWeights.w2) {
          return;
        }

        student.weights = nextWeights;
        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.joinApp(sessionId, 'neural-lab');
          sessionManager.update(sessionId, {
            username: student.name,
            role: 'client',
            source: 'neural-lab'
          }, {
            neural: {
              role: 'client',
              weights: {
                w1: nextWeights.w1,
                w2: nextWeights.w2
              },
              result: computeCanvasNodeStudentResult(nextWeights)
            }
          });
        }
        canvasNodeBroadcastState();
        return;
      }

      if (message.type === 'teacher_config') {
        if (!canvasNodeTeachers.has(ws)) {
          console.log('[neural-lab] ⚠️ Non-teacher attempted teacher_config');
          return;
        }
        const patch = message?.patch && typeof message.patch === 'object' ? message.patch : {};
        console.log('[neural-lab] 🛠️ Teacher config update:', patch);
        if (patch.inputs && typeof patch.inputs === 'object') {
          CANVAS_NODE_INPUT_KEYS.forEach((key) => {
            if (!(key in patch.inputs)) return;
            const next = patch.inputs[key];
            if (!next || typeof next !== 'object') return;
            const inputDef = CANVAS_NODE_INPUTS[key];
            const current = canvasNodeModel.inputs[key];
            const nextEnabled = typeof next.enabled === 'boolean' ? next.enabled : current.enabled;
            let nextValue = current.value;
            if (inputDef.type === 'boolean') {
              if (typeof next.value === 'boolean') nextValue = next.value;
            } else {
              const fallback = Number.isFinite(Number(current.value)) ? Number(current.value) : inputDef.fallback;
              nextValue = clampCanvasNodeNumber(next.value, inputDef.min, inputDef.max, fallback);
              nextValue = Math.round(nextValue);
            }
            canvasNodeModel.inputs[key] = { enabled: nextEnabled, value: nextValue };
          });
        }
        if (patch.outputsEnabled && typeof patch.outputsEnabled === 'object') {
          CANVAS_NODE_OUTPUT_KEYS.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(patch.outputsEnabled, key)) {
              canvasNodeModel.outputsEnabled[key] = Boolean(patch.outputsEnabled[key]);
            }
          });
        }
        canvasNodeBroadcastState();
        return;
      }

      if (message.type === 'teacher_lesson') {
        if (!canvasNodeTeachers.has(ws)) {
          console.log('[neural-lab] ⚠️ Non-teacher attempted teacher_lesson');
          return;
        }

        const lesson = message?.lesson && typeof message.lesson === 'object' ? message.lesson : {};
        const maybeDataset = sanitizeString(lesson.dataset, 40);
        const maybeExampleName = sanitizeString(lesson.exampleName, 80);
        const maybeIcon = sanitizeString(lesson.icon, 8);
        const maybeExampleIndex = Number(lesson.exampleIndex);
        const maybeI1 = Number(lesson?.inputs?.i1);
        const maybeI2 = Number(lesson?.inputs?.i2);

        if (maybeDataset) canvasNodeLesson.dataset = maybeDataset;
        if (Number.isInteger(maybeExampleIndex)) canvasNodeLesson.exampleIndex = Math.max(0, maybeExampleIndex);
        if (maybeExampleName) canvasNodeLesson.exampleName = maybeExampleName;
        if (maybeIcon) canvasNodeLesson.icon = maybeIcon;
        if (Number.isFinite(maybeI1)) canvasNodeLesson.inputs.i1 = clampCanvasNodeNumber(maybeI1, -100, 100, canvasNodeLesson.inputs.i1);
        if (Number.isFinite(maybeI2)) canvasNodeLesson.inputs.i2 = clampCanvasNodeNumber(maybeI2, -100, 100, canvasNodeLesson.inputs.i2);
        if (typeof lesson.useQuestionMarks === 'boolean') canvasNodeLesson.useQuestionMarks = lesson.useQuestionMarks;

        if (sessionManager && typeof sessionManager.update === 'function') {
          sessionManager.joinApp(sessionId, 'neural-lab');
          sessionManager.update(sessionId, {
            role: 'teacher',
            source: 'neural-lab'
          }, {
            neural: {
              role: 'teacher',
              lesson: {
                dataset: canvasNodeLesson.dataset,
                exampleIndex: canvasNodeLesson.exampleIndex,
                exampleName: canvasNodeLesson.exampleName,
                icon: canvasNodeLesson.icon,
                inputs: {
                  i1: canvasNodeLesson.inputs.i1,
                  i2: canvasNodeLesson.inputs.i2
                },
                useQuestionMarks: canvasNodeLesson.useQuestionMarks
              }
            }
          });
        }

        console.log('[neural-lab] 📘 Teacher lesson update:', {
          dataset: canvasNodeLesson.dataset,
          exampleIndex: canvasNodeLesson.exampleIndex,
          exampleName: canvasNodeLesson.exampleName,
          icon: canvasNodeLesson.icon,
          inputs: canvasNodeLesson.inputs,
          useQuestionMarks: canvasNodeLesson.useQuestionMarks
        });
        canvasNodeBroadcastState();
        return;
      }

      if (message.type === 'request_state') {
        console.log('[neural-lab] 📨 Client requested state');
        if (canvasNodeTeachers.has(ws)) canvasNodeBroadcastState();
        else canvasNodeSendStudentState(ws);
      }
    });

    ws.on('close', () => {
      const meta = canvasNodeConnectionMeta.get(ws) || {};
      console.log(`[neural-lab] ❌ Connection closed for ${meta.name || meta.ip || 'unknown'}`);
      recordCommunication({
        app: 'neural-lab',
        direction: 'in',
        event: 'neural-lab:ws-close',
        from: meta.name || meta.ip || 'canvas-client',
        to: 'server'
      });
      canvasNodeTeachers.delete(ws);
      canvasNodeStudents.delete(ws);
      canvasNodeConnectionMeta.delete(ws);
      if (sessionManager && typeof sessionManager.remove === 'function') {
        sessionManager.remove(sessionId);
      }
      canvasNodeBroadcastState();
    });
  });

  // Register upgrade handler for this WebSocket path
  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url && request.url.startsWith('/ws/neural-lab')) {
      console.log(`[neural-lab] ⬆️ Upgrade request for /ws/neural-lab from ${request.socket.remoteAddress}`);
      canvasNodeWss.handleUpgrade(request, socket, head, (ws) => {
        canvasNodeWss.emit('connection', ws, request);
      });
    }
  });

  console.log('[neural-lab] ✅ Neural service initialized, listening on /ws/neural-lab');
  return { canvasNodeWss };
};