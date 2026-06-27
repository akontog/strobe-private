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
  // Αρχική κατάσταση μαθήματος
  const canvasNodeLesson = {
    activityId: '1a', // δραστηριότητα που εκτελείται
    dataset: 'vehicles', // σύνολο δεδομένων που χρησιμοποιείται
    // δείκτης, όνομα, εικονίδιο παραδείγματος, 
    exampleIndex: 0, exampleName: 'Αυτοκίνητο', icon: '🚗',
    // κοινές είσοδοι, βάρη, 
    inputs: { i1: 2, i2: 3 },  weights: { w1: 2, w2: 3 },
    // αν οι μαθητές βλέπουν ερωτηματικά
    useQuestionMarks: false,
    // κατώφλι απόφασης (default: 5)
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
  // εκτεταμένο μοντέλο για δραστηριότητες 1α, 2α, 3α (εποπτικό μέσο)
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

  // Περιορίζει αριθμό σε εύρος, με fallback αν είναι NaN
  function clampCanvasNodeNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }
  // Επικυρώνει w1/w2 στο [-4, 4] με 1 δεκαδικό
  function normalizeCanvasNodeStudentWeights(weights, fallback = {}) {
    const source = weights && typeof weights === 'object' ? weights : {};
    const fallbackW1 = Number.isFinite(Number(fallback.w1)) ? Number(fallback.w1) : 1;
    const fallbackW2 = Number.isFinite(Number(fallback.w2)) ? Number(fallback.w2) : 1;
    return {
      w1: Number(clampCanvasNodeNumber(source.w1, -4, 4, fallbackW1).toFixed(1)),
      w2: Number(clampCanvasNodeNumber(source.w2, -4, 4, fallbackW2).toFixed(1))
    };
  }
  // Υπολογίζει w1·i1 + w2·i2 με τα τρέχοντα  inputs
  function computeCanvasNodeStudentResult(weights) {
    const safeWeights = normalizeCanvasNodeStudentWeights(weights, weights);
    const result = (safeWeights.w1 * canvasNodeLesson.inputs.i1) + (safeWeights.w2 * canvasNodeLesson.inputs.i2);
    return Number(result.toFixed(2));
  }
  // Επικυρώνει i1/i2 στο [-100, 100], επιτρέπει κενό string
  function normalizeCanvasNodeStudentInputs(inputs, fallback = {}) {
    const source = inputs && typeof inputs === 'object' ? inputs : {};
    const fallbackI1 = Object.prototype.hasOwnProperty.call(fallback, 'i1') ? fallback.i1 : canvasNodeLesson.inputs.i1;
    const fallbackI2 = Object.prototype.hasOwnProperty.call(fallback, 'i2') ? fallback.i2 : canvasNodeLesson.inputs.i2;

    const parsedI1 = source.i1 === '' || source.i1 === null || typeof source.i1 === 'undefined'
      ? ''
      : clampCanvasNodeNumber(source.i1, -100, 100, Number(fallbackI1) || 0);
    const parsedI2 = source.i2 === '' || source.i2 === null || typeof source.i2 === 'undefined'
      ? ''
      : clampCanvasNodeNumber(source.i2, -100, 100, Number(fallbackI2) || 0);

    return {
      i1: parsedI1,
      i2: parsedI2
    };
  }
  //  Επικυρώνει p1/p2 στο [-100000, 100000], επιτρέπει κενό string
  function normalizeCanvasNodeStudentProducts(products, fallback = {}) {
    const source = products && typeof products === 'object' ? products : {};
    const parseValue = (value, fallbackValue) => {
      if (value === '' || value === null || typeof value === 'undefined') {
        return '';
      }
      return Number(clampCanvasNodeNumber(value, -100000, 100000, Number(fallbackValue) || 0).toFixed(2));
    };

    return {
      p1: parseValue(source.p1, fallback.p1),
      p2: parseValue(source.p2, fallback.p2)
    };
  }

  // Επικυρώνει το συνολικό αποτέλεσμα στο [-100000, 100000], επιτρέπει κενό string
  function normalizeCanvasNodeStudentTotal(total, fallback) {
    if (total === '' || total === null || typeof total === 'undefined') {
      return '';
    }
    return Number(clampCanvasNodeNumber(total, -100000, 100000, Number(fallback) || 0).toFixed(2));
  }
  // Δημιουργεί ένα στιγμιότυπο της κατάστασης ενός μαθητή για αποστολή στους δασκάλους
  function buildCanvasNodeStudentSnapshot(student) {
    const weights = normalizeCanvasNodeStudentWeights(student && student.weights, student && student.weights);
    const inputs = normalizeCanvasNodeStudentInputs(student && student.inputs, canvasNodeLesson.inputs);
    const products = normalizeCanvasNodeStudentProducts(student && student.products, student && student.products);
    const computedP1 = Number((Number(weights.w1 || 0) * Number(inputs.i1 || 0)).toFixed(2));
    const computedP2 = Number((Number(weights.w2 || 0) * Number(inputs.i2 || 0)).toFixed(2));
    const displayP1 = products.p1 === '' ? computedP1 : products.p1;
    const displayP2 = products.p2 === '' ? computedP2 : products.p2;
    const total = normalizeCanvasNodeStudentTotal(student && student.total, Number(displayP1) + Number(displayP2));
    const result = total === '' ? Number((Number(displayP1) + Number(displayP2)).toFixed(2)) : total;
    return {
      id: student.id,
      role: 'client',
      name: student.name,
      weights,
      inputs,
      products: {
        p1: displayP1,
        p2: displayP2
      },
      total,
      i1: inputs.i1,
      i2: inputs.i2,
      result,
      threshold: canvasNodeLesson.threshold,
      aboveThreshold: result >= canvasNodeLesson.threshold
    };
  }

  // Δημιουργεί μια λίστα με όλους τους συμμετέχοντες, ταξινομημένη κατά σύνδεση και όνομα
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
        weights: { ...canvasNodeLesson.weights },
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
        weights: { ...canvasNodeLesson.weights },
        inputs: { ...canvasNodeLesson.inputs }
      },
      roster,
      model,
      participants
    });
    canvasNodeStudents.forEach((_, studentWs) => canvasNodeSendStudentState(studentWs));
  }

  // χειριστής WebSocket σύνδεσης
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
            weights: { w1: 1, w2: 1 },
            inputs: normalizeCanvasNodeStudentInputs(canvasNodeLesson.inputs, canvasNodeLesson.inputs),
            products: { p1: '', p2: '' },
            total: ''
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

      if (message.type === 'student_state') {
        const student = canvasNodeStudents.get(ws);
        if (!student) {
          return;
        }

        const state = message && message.state && typeof message.state === 'object' ? message.state : {};
        if (state.inputs && typeof state.inputs === 'object') {
          student.inputs = normalizeCanvasNodeStudentInputs(state.inputs, student.inputs || canvasNodeLesson.inputs);
        }
        if (state.weights && typeof state.weights === 'object') {
          student.weights = normalizeCanvasNodeStudentWeights(state.weights, student.weights || canvasNodeLesson.weights);
        }
        if (state.products && typeof state.products === 'object') {
          student.products = normalizeCanvasNodeStudentProducts(state.products, student.products || {});
        }
        if (Object.prototype.hasOwnProperty.call(state, 'total')) {
          student.total = normalizeCanvasNodeStudentTotal(state.total, student.total);
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
      // Αλλαγή δραστηριότητας από τον δάσκαλο
      if (message.type === 'teacher_lesson') {
        // Ελέγχει αν ο αποστολέας είναι δάσκαλος
        if (!canvasNodeTeachers.has(ws)) {
          console.log('[neural-lab] ⚠️ Non-teacher attempted teacher_lesson');
          return;
        }
        // Εξάγει τα δεδομένα του μαθήματος από το μήνυμα
        const lesson = message?.lesson && typeof message.lesson === 'object' ? message.lesson : {};
        
        const maybeDataset = sanitizeString(lesson.dataset, 40);
        const maybeExampleName = sanitizeString(lesson.exampleName, 80);
        const maybeIcon = sanitizeString(lesson.icon, 8);
        const maybeExampleIndex = Number(lesson.exampleIndex);
        const maybeI1 = Number(lesson?.inputs?.i1);
        const maybeI2 = Number(lesson?.inputs?.i2);
        const maybeW1 = Number(lesson?.weights?.w1);
        const maybeW2 = Number(lesson?.weights?.w2);

        if (typeof lesson.activityId === 'string' && lesson.activityId.trim()) {
          canvasNodeLesson.activityId = lesson.activityId.trim();
        }
        if (maybeDataset) canvasNodeLesson.dataset = maybeDataset;
        if (Number.isInteger(maybeExampleIndex)) canvasNodeLesson.exampleIndex = Math.max(0, maybeExampleIndex);
        if (maybeExampleName) canvasNodeLesson.exampleName = maybeExampleName;
        if (maybeIcon) canvasNodeLesson.icon = maybeIcon;
        if (Object.prototype.hasOwnProperty.call(lesson.inputs || {}, 'i1')) {
          canvasNodeLesson.inputs.i1 = Number.isFinite(maybeI1)
            ? clampCanvasNodeNumber(maybeI1, -100, 100, canvasNodeLesson.inputs.i1)
            : '';
        }
        if (Object.prototype.hasOwnProperty.call(lesson.inputs || {}, 'i2')) {
          canvasNodeLesson.inputs.i2 = Number.isFinite(maybeI2)
            ? clampCanvasNodeNumber(maybeI2, -100, 100, canvasNodeLesson.inputs.i2)
            : '';
        }
        if (Number.isFinite(maybeW1)) canvasNodeLesson.weights.w1 = clampCanvasNodeNumber(maybeW1, -10, 10, canvasNodeLesson.weights.w1);
        if (Number.isFinite(maybeW2)) canvasNodeLesson.weights.w2 = clampCanvasNodeNumber(maybeW2, -10, 10, canvasNodeLesson.weights.w2);
        if (typeof lesson.useQuestionMarks === 'boolean') canvasNodeLesson.useQuestionMarks = lesson.useQuestionMarks;
        if (Number.isFinite(Number(lesson.threshold))) {
          canvasNodeLesson.threshold = clampCanvasNodeNumber(Number(lesson.threshold), -1000, 1000, canvasNodeLesson.threshold);
        }

        if (canvasNodeLesson.activityId === '1b') {
          canvasNodeStudents.forEach((student) => {
            if (!student) return;
            student.inputs = { i1: '', i2: '' };
          });
        }

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
                weights: {
                  w1: canvasNodeLesson.weights.w1,
                  w2: canvasNodeLesson.weights.w2
                },
                activityId: canvasNodeLesson.activityId,
                threshold: canvasNodeLesson.threshold,
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
          weights: canvasNodeLesson.weights,
          activityId: canvasNodeLesson.activityId,
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