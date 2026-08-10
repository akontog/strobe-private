export function mountBuffonTeacher(rootElement) {
let classroomApi = null;
let students = [];
let previousLiveRanks = new Map();
let previousTotalRanks = new Map();
let latestLiveSorted = [];
let teamHistories = new Map();
let teamPoints = new Map();
let lastRoundPoints = new Map();

let currentRound = 0;
let roundActive = false;
let roundEndAt = 0;
let roundTimerId = null;
let roundEndScheduled = false;
let lockedWinnerTeam = '';
let lastRoundWinnerTeam = '';
let targetReachedAt = new Map();

const roundConfig = {
  timeSec: 60,
  targetError: 0.005,
};

const TEACHER_Y_MIN = 1.5;
const TEACHER_Y_MAX = 5.0;
const teacherChartCv = document.getElementById('teacher-chart-cv');
const teacherChartCtx = teacherChartCv.getContext('2d');

function connectWS() {
  if (!window.SharedClassroomApi || typeof window.SharedClassroomApi.createClient !== 'function') {
    setRoundStatus('Λείπει το shared API script.', 'ended');
    return;
  }

  if (classroomApi) {
    classroomApi.start();
    return;
  }

  classroomApi = window.SharedClassroomApi.createClient({
    wsPath: '/ws/buffon',
    reconnectDelayMs: 2000,
    onOpen() {
      sendWs({ type: 'register_teacher' });
      setRoundStatus('Συνδεδεμένος.', roundActive ? 'active' : 'idle');
    },
    onMessage(type, payload) {
      if (type === 'roster') {
        students = Array.isArray(payload && payload.students) ? payload.students : [];
        render();
      }
    },
    onClose() {
      setRoundStatus('Αποσύνδεση από τον server — επανασύνδεση...', 'ended');
    }
  });

  classroomApi.start();
}

function sendWs(payload) {
  if (!classroomApi || !payload || typeof payload !== 'object') return;
  if (typeof payload.type === 'string' && payload.type.trim()) {
    const type = payload.type;
    const data = { ...payload };
    delete data.type;
    classroomApi.send(type, data);
  }
}

function updateRoundActionButtons() {
  const startBtn = document.getElementById('round-start-btn');
  const stopBtn = document.getElementById('round-stop-btn');
  if (startBtn) startBtn.disabled = roundActive;
  if (stopBtn) stopBtn.disabled = !roundActive;
}

function sliderToTarget(sliderValue) {
  const raw = Number.parseInt(sliderValue, 10);
  const safe = Number.isInteger(raw) ? raw : 5;
  return Math.max(0.001, Math.min(0.01, safe / 1000));
}

function updateRoundControlLabels() {
  const timeSlider = document.getElementById('round-time-slider');
  const targetSlider = document.getElementById('round-target-slider');
  const timeSec = Number.parseInt(timeSlider.value, 10) || 60;
  const target = sliderToTarget(targetSlider.value);
  document.getElementById('round-time-value').textContent = `${timeSec} sec`;
  document.getElementById('round-target-value').textContent = target.toFixed(3);
}

function updateTimerLabel() {
  const timerEl = document.getElementById('round-timer');
  if (!roundActive) {
    timerEl.textContent = '—';
    return;
  }

  const secondsLeft = Math.max(0, Math.ceil((roundEndAt - Date.now()) / 1000));
  timerEl.textContent = `${secondsLeft} sec`;
}

function stopRoundTimer() {
  if (roundTimerId !== null) {
    clearInterval(roundTimerId);
    roundTimerId = null;
  }
}

function startRoundTimer() {
  stopRoundTimer();
  updateTimerLabel();

  roundTimerId = setInterval(() => {
    if (!roundActive) {
      stopRoundTimer();
      return;
    }

    if (Date.now() >= roundEndAt) {
      endRound('time_up');
      return;
    }

    updateTimerLabel();
  }, 200);
}

function setRoundStatus(text, mode) {
  const statusEl = document.getElementById('round-status');
  statusEl.textContent = text;
  statusEl.classList.remove('active', 'ended');
  if (mode === 'active') statusEl.classList.add('active');
  if (mode === 'ended') statusEl.classList.add('ended');
}

function pointsForRank(rank) {
  if (rank === 1) return 12;
  if (rank === 2) return 10;
  return Math.max(1, 11 - rank);
}

function studentKey(student) {
  return String((student && student.team) || '');
}

function hasPiEstimate(student) {
  return typeof student.piEst === 'number' && Number.isFinite(student.piEst);
}

function getStudentError(student) {
  return hasPiEstimate(student) ? Math.abs(student.piEst - Math.PI) : null;
}

function sortStudentsByPerformance(list) {
  return [...list].sort((a, b) => {
    const aHasPi = hasPiEstimate(a);
    const bHasPi = hasPiEstimate(b);

    if (aHasPi !== bHasPi) return aHasPi ? -1 : 1;

    const ea = aHasPi ? Math.abs(a.piEst - Math.PI) : Infinity;
    const eb = bHasPi ? Math.abs(b.piEst - Math.PI) : Infinity;
    if (ea !== eb) return ea - eb;

    const ad = typeof a.drops === 'number' ? a.drops : 0;
    const bd = typeof b.drops === 'number' ? b.drops : 0;
    if (ad !== bd) return bd - ad;

    return String(a.team || '').localeCompare(String(b.team || ''), 'el');
  });
}

function sortStudentsByTotalPoints(list) {
  return [...list].sort((a, b) => {
    const aKey = studentKey(a);
    const bKey = studentKey(b);

    const at = teamPoints.get(aKey) || 0;
    const bt = teamPoints.get(bKey) || 0;
    if (at !== bt) return bt - at;

    const ar = lastRoundPoints.get(aKey) || 0;
    const br = lastRoundPoints.get(bKey) || 0;
    if (ar !== br) return br - ar;

    const ea = getStudentError(a);
    const eb = getStudentError(b);
    const safeEa = ea === null ? Infinity : ea;
    const safeEb = eb === null ? Infinity : eb;
    if (safeEa !== safeEb) return safeEa - safeEb;

    return String(a.team || '').localeCompare(String(b.team || ''), 'el');
  });
}

function applyLockedWinner(sorted) {
  if (!lockedWinnerTeam) return sorted;
  const idx = sorted.findIndex((s) => studentKey(s) === lockedWinnerTeam);
  if (idx <= 0) return sorted;
  return [sorted[idx], ...sorted.slice(0, idx), ...sorted.slice(idx + 1)];
}

function detectTargetReached(sorted) {
  if (!roundActive || roundEndScheduled) return;

  const now = Date.now();
  sorted.forEach((student) => {
    const key = studentKey(student);
    if (!key || targetReachedAt.has(key)) return;

    const err = getStudentError(student);
    if (err !== null && err <= roundConfig.targetError) {
      targetReachedAt.set(key, now);
    }
  });

  if (targetReachedAt.size === 0) return;

  const [winnerEntry] = [...targetReachedAt.entries()].sort((a, b) => a[1] - b[1]);
  if (!winnerEntry) return;

  lockedWinnerTeam = winnerEntry[0];
  roundEndScheduled = true;
  setTimeout(() => endRound('target_reached'), 0);
}

function getRoundRanking() {
  return applyLockedWinner(sortStudentsByPerformance(students));
}

function startRoundFromTeacher() {
  if (roundActive) return;

  const timeSec = Number.parseInt(document.getElementById('round-time-slider').value, 10) || 60;
  const targetError = sliderToTarget(document.getElementById('round-target-slider').value);

  stopRoundTimer();
  roundActive = true;
  roundEndScheduled = false;
  currentRound += 1;
  roundEndAt = Date.now() + timeSec * 1000;

  roundConfig.timeSec = Math.max(20, Math.min(120, timeSec));
  roundConfig.targetError = Math.max(0.001, Math.min(0.01, targetError));

  lockedWinnerTeam = '';
  lastRoundWinnerTeam = '';
  lastRoundPoints = new Map();
  targetReachedAt.clear();

  previousLiveRanks = new Map();
  previousTotalRanks = new Map();
  latestLiveSorted = [];
  teamHistories = new Map();

  students = students.map((student) => ({
    ...student,
    drops: 0,
    hits: 0,
    piEst: null,
  }));

  document.getElementById('round-info').textContent = `Γύρος: ${currentRound} | στόχος ≤ ${roundConfig.targetError.toFixed(3)}`;
  document.getElementById('round-result').textContent = '—';
  setRoundStatus(`Ξεκίνησε ο γύρος ${currentRound}.`, 'active');
  updateRoundActionButtons();

  render();
  startRoundTimer();

  sendWs({
    type: 'start_round',
    round: currentRound,
    timeSec: roundConfig.timeSec,
    targetError: roundConfig.targetError,
  });
}

function stopRoundManually() {
  if (!roundActive) return;
  endRound('manual_stop', { awardPoints: true });
}

function resetTournamentScores() {
  stopRoundTimer();
  roundActive = false;
  roundEndScheduled = false;
  roundEndAt = 0;
  currentRound = 0;
  lockedWinnerTeam = '';
  lastRoundWinnerTeam = '';
  targetReachedAt.clear();

  previousLiveRanks = new Map();
  previousTotalRanks = new Map();
  latestLiveSorted = [];
  teamHistories = new Map();
  teamPoints = new Map();
  lastRoundPoints = new Map();

  students = students.map((student) => ({
    ...student,
    drops: 0,
    hits: 0,
    piEst: null,
  }));

  document.getElementById('round-info').textContent = 'Γύρος: —';
  document.getElementById('round-result').textContent = 'Όλοι οι πόντοι μηδενίστηκαν.';
  document.getElementById('round-timer').textContent = '—';
  setRoundStatus('Έγινε συνολικό reset. Ξεκινήστε νέο γύρο.', 'ended');
  updateRoundActionButtons();

  sendWs({ type: 'reset_tournament' });
  render();
}

function endRound(reason, options = {}) {
  if (!roundActive) return;

  const awardPoints = options.awardPoints !== false;

  roundActive = false;
  roundEndScheduled = false;
  stopRoundTimer();

  const ranking = getRoundRanking();
  lastRoundPoints = new Map();

  const awards = ranking
    .map((student, index) => {
      const team = studentKey(student);
      if (!team) return null;

      const rank = index + 1;
      const points = awardPoints ? pointsForRank(rank) : 0;
      lastRoundPoints.set(team, points);

      if (awardPoints) {
        const total = (teamPoints.get(team) || 0) + points;
        teamPoints.set(team, total);
      }

      return {
        rank,
        team,
        points,
        error: getStudentError(student),
      };
    })
    .filter(Boolean);

  lastRoundWinnerTeam = awards.length ? awards[0].team : '';

  let reasonText = 'Ο χρόνος του γύρου ολοκληρώθηκε.';
  if (reason === 'target_reached') {
    reasonText = `Στόχος σφάλματος επιτεύχθηκε από την ομάδα ${lastRoundWinnerTeam || '—'}.`;
  } else if (reason === 'manual_stop') {
    reasonText = 'Ο γύρος σταμάτησε χειροκίνητα από τον καθηγητή.';
  }

  const podium = awards.slice(0, 3).map((entry) => `${entry.rank}. ${entry.team} (+${entry.points})`).join(' | ');
  document.getElementById('round-info').textContent = `Γύρος: ${currentRound} ολοκληρώθηκε`;
  document.getElementById('round-result').textContent = podium || 'Δεν υπάρχουν αποτελέσματα για αυτόν τον γύρο.';
  setRoundStatus(`${reasonText} Η διαδικασία τελείωσε.`, 'ended');
  document.getElementById('round-timer').textContent = '0 sec';
  updateRoundActionButtons();

  sendWs({
    type: 'end_round',
    round: currentRound,
    reason,
    winnerTeam: lastRoundWinnerTeam,
    targetError: roundConfig.targetError,
    rankings: awards,
  });

  targetReachedAt.clear();
  lockedWinnerTeam = '';
  previousLiveRanks = new Map();
  previousTotalRanks = new Map();
  render();
}

function render() {
  const liveBody = document.getElementById('live-board-body');
  const totalBody = document.getElementById('total-board-body');

  if (students.length === 0) {
    liveBody.innerHTML = '<div class="empty">Καμία ομάδα δεν είναι συνδεδεμένη ακόμα...</div>';
    totalBody.innerHTML = '<div class="empty">Καμία ομάδα δεν είναι συνδεδεμένη ακόμα...</div>';
    latestLiveSorted = [];
    previousLiveRanks = new Map();
    previousTotalRanks = new Map();
    teamHistories.clear();
    drawTeacherChart();
    return;
  }

  const baseLiveSorted = sortStudentsByPerformance(students);
  if (roundActive) detectTargetReached(baseLiveSorted);
  const liveSorted = roundActive ? applyLockedWinner(baseLiveSorted) : baseLiveSorted;
  const totalSorted = sortStudentsByTotalPoints(students);

  const liveMovement = new Map();
  liveSorted.forEach((student, idx) => {
    const key = studentKey(student);
    const prevIndex = previousLiveRanks.has(key) ? previousLiveRanks.get(key) : null;
    liveMovement.set(key, prevIndex === null ? null : prevIndex - idx);
  });

  const totalMovement = new Map();
  totalSorted.forEach((student, idx) => {
    const key = studentKey(student);
    const prevIndex = previousTotalRanks.has(key) ? previousTotalRanks.get(key) : null;
    totalMovement.set(key, prevIndex === null ? null : prevIndex - idx);
  });

  liveBody.innerHTML = liveSorted.map((student, idx) => {
    const key = studentKey(student);
    const delta = liveMovement.get(key);
    const hasPi = hasPiEstimate(student);
    const err = hasPi ? Math.abs(student.piEst - Math.PI).toFixed(6) : '—';
    const piStr = hasPi ? student.piEst.toFixed(5) : '—';
    const miss = Math.max(0, (student.drops || 0) - (student.hits || 0));

    const movementClass =
      !hasPi ? ' pending' :
      delta > 0 ? ' rank-up' :
      delta < 0 ? ' rank-down' :
      '';

    return `
      <div class="board-row live-board-row${movementClass}">
        <span class="rank" style="color:${hasPi ? getSeriesColor(idx) : '#64748b'}">${idx + 1}</span>
        <span class="team-name">${esc(student.team)}</span>
        <span class="pi-val">${piStr}</span>
        <span class="err-val">${err}</span>
        <span class="drops-val">${(student.drops || 0).toLocaleString()}</span>
        <span class="hits-val">${(student.hits || 0).toLocaleString()}</span>
        <span class="miss-val">${miss.toLocaleString()}</span>
      </div>`;
  }).join('');

  totalBody.innerHTML = totalSorted.map((student, idx) => {
    const key = studentKey(student);
    const delta = totalMovement.get(key);
    const roundPoints = roundActive
      ? '—'
      : (currentRound > 0 ? (lastRoundPoints.get(key) || 0).toLocaleString() : '—');
    const totalPoints = (teamPoints.get(key) || 0).toLocaleString();

    const movementClass =
      delta > 0 ? ' rank-up' :
      delta < 0 ? ' rank-down' :
      '';
    const winnerClass = !roundActive && key && key === lastRoundWinnerTeam ? ' round-winner' : '';

    return `
      <div class="board-row score-board-row${movementClass}${winnerClass}">
        <span class="rank" style="color:#60a5fa">${idx + 1}</span>
        <span class="team-name">${esc(student.team)}</span>
        <span class="round-points-val">${roundPoints}</span>
        <span class="total-points-val">${totalPoints}</span>
      </div>`;
  }).join('');

  latestLiveSorted = liveSorted;
  updateTeamHistories(liveSorted);
  drawTeacherChart();
  previousLiveRanks = new Map(liveSorted.map((student, idx) => [studentKey(student), idx]));
  previousTotalRanks = new Map(totalSorted.map((student, idx) => [studentKey(student), idx]));
}

function esc(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toggleTeacherChart() {
  const body = document.getElementById('teacher-chart-body');
  const arrow = document.getElementById('teacher-chart-arrow');
  const open = body.classList.toggle('open');
  arrow.classList.toggle('open', open);
  if (open) drawTeacherChart();
}

function toggleJoinQr() {
  const body = document.getElementById('join-qr-body');
  const arrow = document.getElementById('join-qr-arrow');
  const open = body.classList.toggle('open');
  arrow.classList.toggle('open', open);
}

function toggleLiveBoard() {
  const body = document.getElementById('live-board-wrap');
  const arrow = document.getElementById('live-board-arrow');
  const open = body.classList.toggle('open');
  arrow.classList.toggle('open', open);
}

function toggleTotalBoard() {
  const body = document.getElementById('total-board-wrap');
  const arrow = document.getElementById('total-board-arrow');
  const open = body.classList.toggle('open');
  arrow.classList.toggle('open', open);
}

function getSeriesColor(index) {
  const palette = ['#fbbf24', '#94a3b8', '#cd7c3a', '#3b82f6', '#a78bfa', '#f87171', '#34d399', '#f97316', '#38bdf8', '#e879f9'];
  return palette[index % palette.length];
}

function updateTeamHistories(sorted) {
  const activeKeys = new Set(sorted.map(studentKey));
  for (const key of Array.from(teamHistories.keys())) {
    if (!activeKeys.has(key)) teamHistories.delete(key);
  }

  sorted.forEach((student) => {
    const key = studentKey(student);
    const drops = typeof student.drops === 'number' ? student.drops : 0;

    if (drops <= 0) {
      teamHistories.set(key, []);
      return;
    }

    if (!hasPiEstimate(student)) return;

    const pi = student.piEst;
    const points = teamHistories.get(key) || [];
    const last = points[points.length - 1];

    if (!last || drops > last.n || Math.abs(pi - last.pi) > 1e-12) {
      points.push({ n: drops, pi });
      if (points.length > 500) {
        const skip = Math.ceil(points.length / 500);
        teamHistories.set(key, points.filter((_, idx) => idx % skip === 0));
      } else {
        teamHistories.set(key, points);
      }
    }
  });
}

function drawTeacherChart() {
  const body = document.getElementById('teacher-chart-body');
  if (!body.classList.contains('open')) return;

  const cw = Math.max(340, body.clientWidth - 4);
  const ch = 172;
  teacherChartCv.width = cw;
  teacherChartCv.height = ch;

  const PAD = { top: 10, right: 18, bottom: 30, left: 40 };
  const pw = cw - PAD.left - PAD.right;
  const ph = ch - PAD.top - PAD.bottom;

  teacherChartCtx.clearRect(0, 0, cw, ch);
  teacherChartCtx.fillStyle = '#141720';
  teacherChartCtx.beginPath();
  teacherChartCtx.roundRect(0, 0, cw, ch, 6);
  teacherChartCtx.fill();

  const activeSeries = latestLiveSorted
    .filter(hasPiEstimate)
    .map((student, idx) => {
      const key = studentKey(student);
      const points = (teamHistories.get(key) || []).filter((pt) => pt.n > 0);
      return {
        rank: idx + 1,
        team: String(student.team || ''),
        color: getSeriesColor(idx),
        points,
      };
    })
    .filter((series) => series.points.length > 0);

  if (!activeSeries.length) {
    teacherChartCtx.fillStyle = '#64748b';
    teacherChartCtx.font = '12px Courier New';
    teacherChartCtx.textAlign = 'center';
    teacherChartCtx.fillText('Χωρίς εκτιμήσεις π ακόμα', cw / 2, ch / 2);
    return;
  }

  let xMax = 10;
  activeSeries.forEach((series) => {
    series.points.forEach((pt) => {
      if (pt.n > xMax) xMax = pt.n;
    });
  });

  const toX = (n) => PAD.left + (n / xMax) * pw;
  const toY = (pi) => PAD.top + (1 - (pi - TEACHER_Y_MIN) / (TEACHER_Y_MAX - TEACHER_Y_MIN)) * ph;

  teacherChartCtx.save();
  teacherChartCtx.beginPath();
  teacherChartCtx.rect(PAD.left, PAD.top, pw, ph);
  teacherChartCtx.clip();

  teacherChartCtx.strokeStyle = '#2d3348';
  teacherChartCtx.lineWidth = 0.8;
  teacherChartCtx.setLineDash([]);
  [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].forEach((y) => {
    teacherChartCtx.beginPath();
    teacherChartCtx.moveTo(PAD.left, toY(y));
    teacherChartCtx.lineTo(PAD.left + pw, toY(y));
    teacherChartCtx.stroke();
  });

  const piY = toY(Math.PI);
  teacherChartCtx.strokeStyle = '#fbbf24';
  teacherChartCtx.lineWidth = 1.2;
  teacherChartCtx.setLineDash([4, 4]);
  teacherChartCtx.beginPath();
  teacherChartCtx.moveTo(PAD.left, piY);
  teacherChartCtx.lineTo(PAD.left + pw, piY);
  teacherChartCtx.stroke();
  teacherChartCtx.setLineDash([]);

  activeSeries.forEach((series) => {
    teacherChartCtx.strokeStyle = series.color;
    teacherChartCtx.lineWidth = 1.6;
    teacherChartCtx.beginPath();
    series.points.forEach((pt, idx) => {
      const x = toX(pt.n);
      const y = toY(pt.pi);
      if (idx === 0) teacherChartCtx.moveTo(x, y);
      else teacherChartCtx.lineTo(x, y);
    });
    teacherChartCtx.stroke();

    const last = series.points[series.points.length - 1];
    teacherChartCtx.fillStyle = series.color;
    teacherChartCtx.beginPath();
    teacherChartCtx.arc(toX(last.n), toY(last.pi), 2.8, 0, Math.PI * 2);
    teacherChartCtx.fill();
  });

  teacherChartCtx.restore();

  teacherChartCtx.fillStyle = '#fbbf24';
  teacherChartCtx.font = '9px Courier New';
  teacherChartCtx.textAlign = 'left';
  teacherChartCtx.fillText('π', PAD.left + pw + 3, piY + 3);

  teacherChartCtx.strokeStyle = '#475569';
  teacherChartCtx.lineWidth = 1;
  teacherChartCtx.beginPath();
  teacherChartCtx.moveTo(PAD.left, PAD.top);
  teacherChartCtx.lineTo(PAD.left, PAD.top + ph);
  teacherChartCtx.lineTo(PAD.left + pw, PAD.top + ph);
  teacherChartCtx.stroke();

  teacherChartCtx.fillStyle = '#475569';
  teacherChartCtx.font = '9px Courier New';
  teacherChartCtx.textAlign = 'right';
  [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].forEach((y) => {
    teacherChartCtx.fillText(y.toFixed(1), PAD.left - 4, toY(y) + 3);
  });

  teacherChartCtx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const n = Math.round((xMax * i) / 5);
    const label = n >= 1000 ? `${Math.round(n / 1000)}k` : n;
    teacherChartCtx.fillText(label, toX(n), PAD.top + ph + 14);
  }
  teacherChartCtx.fillText('# βελόνες', PAD.left + pw / 2, ch - 4);

  let lx = PAD.left;
  let ly = PAD.top + 12;
  teacherChartCtx.font = '9px Courier New';
  teacherChartCtx.textAlign = 'left';
  activeSeries.slice(0, 8).forEach((series) => {
    teacherChartCtx.fillStyle = series.color;
    teacherChartCtx.fillRect(lx, ly - 7, 8, 8);
    teacherChartCtx.fillStyle = '#94a3b8';
    teacherChartCtx.fillText(`#${series.rank} ${series.team}`, lx + 12, ly);
    ly += 12;
  });
}

updateRoundControlLabels();
updateRoundActionButtons();
setRoundStatus('Πάτησε «ΕΝΑΡΞΗ ΓΥΡΟΥ» για νέο παιχνίδι.', 'idle');
connectWS();
window.addEventListener('resize', drawTeacherChart);

  const globalFns = {
    toggleJoinQr,
    startRoundFromTeacher,
    stopRoundManually,
    resetTournamentScores,
    toggleLiveBoard,
    toggleTotalBoard,
    toggleTeacherChart,
    updateRoundControlLabels,
  };

  Object.assign(window, globalFns);

  return () => {
    stopRoundTimer();

    if (classroomApi && typeof classroomApi.stop === 'function') {
      classroomApi.stop();
    }

    window.removeEventListener('resize', drawTeacherChart);

    Object.keys(globalFns).forEach((key) => {
      if (window[key] === globalFns[key]) {
        delete window[key];
      }
    });
  };
}
