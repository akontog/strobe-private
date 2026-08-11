export function mountBuffonStudent(rootElement) {
const Y_MIN = 1.5, Y_MAX = 5.0;
const simCv  = document.getElementById('sim');
const simCtx = simCv.getContext('2d');
const SW = simCv.width, SH = simCv.height;
const chartCv  = document.getElementById('chart-cv');
const chartCtx = chartCv.getContext('2d');

let needleL = 50, lineD = 60, stepN = 1;
let drops = 0, hits = 0, history = [];
let teamName = '';
let classroomApi = null;
let socketConnected = false;
let teamRegistered = false;
let autoDropTimer = null;
let roundControlEnabled = false;
let roundActive = false;
let roundNumber = 0;
let roundTargetError = null;
let roundEndAt = 0;
let roundBannerTimer = null;
const CONNECT_NAME_KEY = 'strobeStudentConnectName';
const pageQuery = new URLSearchParams(window.location.search);
const PREFILL_TEAM = (pageQuery.get('team') || pageQuery.get('name') || '').trim();
const AUTO_CONNECT_FLAG = (pageQuery.get('autoconnect') || '').toLowerCase();
const SHOULD_AUTOCONNECT = ['1', 'true', 'yes'].includes(AUTO_CONNECT_FLAG);

// ── WebSocket ─────────────────────────────────────
function connectWS() {
  if (!window.SharedClassroomApi || typeof window.SharedClassroomApi.createClient !== 'function') {
    socketConnected = false;
    updateConnDot();
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
      socketConnected = true;
      if (teamName) {
        sendPayload({ type: 'register_student', team: teamName });
        teamRegistered = true;
        roundControlEnabled = true;
        setRoundBanner('Συνδεθήκατε. Περιμένετε την έναρξη.', 'waiting');
        sendUpdate();
      }
      updateConnDot();
    },
    onMessage(type, msg) {
      if (type === 'round_start') {
        handleRoundStart(msg);
        return;
      }

      if (type === 'round_end') {
        handleRoundEnd(msg);
        return;
      }

      if (type === 'reset_tournament') {
        handleTournamentReset(msg);
      }
    },
    onClose() {
      socketConnected = false;
      teamRegistered = false;
      roundControlEnabled = false;
      roundActive = false;
      stopAutoDrop();
      stopRoundBannerTimer();
      setRoundBanner('Αποσύνδεση από server... μπορείτε να συνεχίσετε ελεύθερο πειραματισμό.', 'waiting');
      updateConnDot();
    },
    onError() {
      socketConnected = false;
      updateConnDot();
    }
  });

  classroomApi.start();
}

function sendPayload(payload) {
  if (!classroomApi || !payload || typeof payload !== 'object') return false;
  if (typeof payload.type !== 'string' || !payload.type.trim()) return false;
  const type = payload.type;
  const data = { ...payload };
  delete data.type;
  return classroomApi.send(type, data);
}

function registerTeam() {
  teamName = document.getElementById('team-input').value.trim();
  if (!teamName) {
    localStorage.removeItem(CONNECT_NAME_KEY);
    teamRegistered = false;
    roundControlEnabled = false;
    setRoundBanner('Χωρίς σύνδεση ομάδας: ελεύθερος πειραματισμός.', 'waiting');
    updateConnDot();
    return;
  }

  localStorage.setItem(CONNECT_NAME_KEY, teamName);

  if (!classroomApi || !classroomApi.isConnected()) {
    connectWS();
    setTimeout(registerTeam, 500);
    return;
  }
  sendPayload({ type: 'register_student', team: teamName });
  teamRegistered = true;
  roundControlEnabled = true;
  setRoundBanner('Συνδεθήκατε. Περιμένετε την έναρξη από τον καθηγητή.', 'waiting');
  updateConnDot();
  sendUpdate();
}

function sendUpdate() {
  if (!classroomApi || !classroomApi.isConnected() || !teamName || !teamRegistered) return;
  const piEst = hits > 0 ? (2 * needleL * drops) / (lineD * hits) : null;
  sendPayload({ type: 'update', drops, hits, piEst: piEst ? parseFloat(piEst.toFixed(5)) : null });
}

function updateConnDot() {
  const dot = document.getElementById('conn-dot');
  dot.classList.toggle('connected', socketConnected && teamRegistered);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setRoundBanner(text, mode) {
  const banner = document.getElementById('round-banner');
  banner.textContent = text;
  banner.classList.remove('waiting', 'active', 'ended');
  if (mode === 'active') banner.classList.add('active');
  else if (mode === 'ended') banner.classList.add('ended');
  else banner.classList.add('waiting');
}

function stopRoundBannerTimer() {
  if (roundBannerTimer !== null) {
    clearInterval(roundBannerTimer);
    roundBannerTimer = null;
  }
}

function updateActiveRoundBanner() {
  const secs = Math.max(0, Math.ceil((roundEndAt - Date.now()) / 1000));
  const targetText = Number.isFinite(roundTargetError)
    ? `στόχος ≤ ${roundTargetError.toFixed(3)}`
    : 'στόχος σφάλματος';
  setRoundBanner(`Γύρος ${roundNumber}: ${targetText} | απομένουν ${secs} sec`, 'active');
}

function startRoundBannerTimer() {
  stopRoundBannerTimer();
  updateActiveRoundBanner();

  roundBannerTimer = setInterval(() => {
    if (!roundActive) {
      stopRoundBannerTimer();
      return;
    }
    updateActiveRoundBanner();
  }, 250);
}

function applyRoundDefaults(defaults) {
  const defaultL = clamp(Number.parseInt(defaults.needleL, 10) || 50, 10, 120);
  const defaultD = clamp(Number.parseInt(defaults.lineD, 10) || 60, 30, 150);
  const defaultStep = clamp(Number.parseInt(defaults.stepN, 10) || 1, 1, 1000);

  needleL = defaultL;
  lineD = defaultD;

  document.getElementById('val-l').textContent = needleL;
  document.getElementById('range-l').value = needleL;
  document.getElementById('val-d').textContent = lineD;
  document.getElementById('range-d').value = lineD;

  setStep(defaultStep);

  stopAutoDrop();
  document.getElementById('auto-toggle').checked = false;
  resetAll();
}

function handleRoundStart(msg) {
  roundControlEnabled = true;
  roundActive = true;
  roundNumber = Number.parseInt(msg.round, 10) || roundNumber + 1 || 1;

  const parsedTarget = Number.parseFloat(msg.targetError);
  roundTargetError = Number.isFinite(parsedTarget)
    ? clamp(parsedTarget, 0.001, 0.01)
    : null;

  const parsedEndAt = Number.parseInt(msg.endAt, 10);
  if (Number.isFinite(parsedEndAt) && parsedEndAt > Date.now()) {
    roundEndAt = parsedEndAt;
  } else {
    const parsedTime = Number.parseInt(msg.timeSec, 10);
    const safeTime = clamp(Number.isInteger(parsedTime) ? parsedTime : 60, 20, 120);
    roundEndAt = Date.now() + safeTime * 1000;
  }

  applyRoundDefaults(msg.defaults || {});
  startRoundBannerTimer();
}

function handleRoundEnd(msg) {
  roundControlEnabled = true;
  roundActive = false;
  roundEndAt = 0;
  stopAutoDrop();
  document.getElementById('auto-toggle').checked = false;
  stopRoundBannerTimer();

  let reason = 'Ο χρόνος της διαδικασίας έληξε.';
  if (msg.reason === 'target_reached') {
    reason = 'Ο στόχος σφάλματος επιτεύχθηκε.';
  } else if (msg.reason === 'manual_stop') {
    reason = 'Ο γύρος σταμάτησε χειροκίνητα από τον καθηγητή.';
  }

  const winnerText = msg.winnerTeam
    ? ` Νικήτρια ομάδα: ${msg.winnerTeam}.`
    : '';

  let podium = '';
  if (Array.isArray(msg.rankings) && msg.rankings.length > 0) {
    podium = msg.rankings
      .slice(0, 3)
      .map((entry) => {
        const rank = Number.parseInt(entry && entry.rank, 10);
        const team = String((entry && entry.team) || '').trim();
        if (!team) return null;
        return `${Number.isInteger(rank) ? rank : '?'}:${team}`;
      })
      .filter(Boolean)
      .join(' | ');
  }

  const podiumText = podium ? ` Κατάταξη: ${podium}.` : '';
  setRoundBanner(`${reason}${winnerText}${podiumText}`, 'ended');
}

function handleTournamentReset(msg) {
  roundControlEnabled = true;
  roundActive = false;
  roundNumber = 0;
  roundTargetError = null;
  roundEndAt = 0;
  stopAutoDrop();
  document.getElementById('auto-toggle').checked = false;
  stopRoundBannerTimer();

  const defaults = msg && msg.defaults ? msg.defaults : {};
  applyRoundDefaults(defaults);
  setRoundBanner('Έγινε συνολικό reset από τον καθηγητή. Περιμένετε νέο γύρο.', 'waiting');
}

function canPlayCurrentRound() {
  if (!roundControlEnabled) return true;
  return roundActive;
}

// ── Grid ──────────────────────────────────────────
function drawGrid() {
  simCtx.clearRect(0, 0, SW, SH);
  simCtx.strokeStyle = '#94a3b8'; simCtx.lineWidth = 1.5;
  for (let x = 0; x <= SW; x += lineD) {
    simCtx.beginPath(); simCtx.moveTo(x, 0); simCtx.lineTo(x, SH); simCtx.stroke();
  }
}

function drawPreviewNeedle() {
  const halfL = needleL / 2;
  const safePad = 8;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const safeXMin = halfL + safePad;
  const safeXMax = SW - halfL - safePad;
  const safeYMin = halfL + safePad;
  const safeYMax = SH - halfL - safePad;

  const centerGridLine = Math.round((SW * 0.5) / lineD) * lineD;
  const redX = clamp(centerGridLine, safeXMin, safeXMax);
  const redY = clamp(SH * 0.35, safeYMin, safeYMax);

  let greenX = redX + lineD * 0.5;
  if (greenX > safeXMax) greenX = redX - lineD * 0.5;
  greenX = clamp(greenX, safeXMin, safeXMax);
  const greenY = clamp(SH * 0.68, safeYMin, safeYMax);

  function drawDashedNeedle(cx, cy, angle, color) {
    const x1 = cx - halfL * Math.cos(angle);
    const x2 = cx + halfL * Math.cos(angle);
    const y1 = cy - halfL * Math.sin(angle);
    const y2 = cy + halfL * Math.sin(angle);

    simCtx.save();
    simCtx.beginPath();
    simCtx.setLineDash([8, 5]);
    simCtx.lineCap = 'round';
    simCtx.strokeStyle = color;
    simCtx.lineWidth = 3.2;
    simCtx.shadowColor = color;
    simCtx.shadowBlur = 5;
    simCtx.moveTo(x1, y1);
    simCtx.lineTo(x2, y2);
    simCtx.stroke();
    simCtx.restore();
  }

  // Red preview crosses a grid line (hit), green preview stays in one strip (miss).
  drawDashedNeedle(redX, redY, 0, 'rgba(239,68,68,0.98)');
  drawDashedNeedle(greenX, greenY, Math.PI / 2, 'rgba(34,197,94,0.98)');
}

// ── Needles ───────────────────────────────────────
function dropNeedles(count) {
  if (drops === 0) {
    // Remove preview needle before first real drop so counts match visuals.
    drawGrid();
  }

  for (let i = 0; i < count; i++) {
    const x = Math.random() * SW, y = Math.random() * SH;
    const a = Math.random() * Math.PI;
    const x1 = x - (needleL/2)*Math.cos(a), x2 = x + (needleL/2)*Math.cos(a);
    const y1 = y - (needleL/2)*Math.sin(a), y2 = y + (needleL/2)*Math.sin(a);
    const hit = Math.floor(x1/lineD) !== Math.floor(x2/lineD);
    if (hit) hits++;
    drops++;
    simCtx.beginPath();
    simCtx.strokeStyle = hit ? 'rgba(220,38,38,0.78)' : 'rgba(22,163,74,0.72)';
    simCtx.lineWidth = 2;
    simCtx.moveTo(x1,y1); simCtx.lineTo(x2,y2); simCtx.stroke();
  }
  const piEst = hits > 0 ? (2*needleL*drops)/(lineD*hits) : null;
  if (piEst) history.push({ n: drops, pi: parseFloat(piEst.toFixed(5)) });
  if (history.length > 500) {
    const s = Math.ceil(history.length/500);
    history = history.filter((_,i) => i%s===0);
  }
  updateStats(piEst);
  drawChart();
  sendUpdate();
}

function doStep() {
  if (!canPlayCurrentRound()) return;
  dropNeedles(stepN);
}

function stopAutoDrop() {
  if (autoDropTimer !== null) {
    clearInterval(autoDropTimer);
    autoDropTimer = null;
  }
}

function startAutoDrop() {
  if (!canPlayCurrentRound()) return;
  stopAutoDrop();
  autoDropTimer = setInterval(() => {
    dropNeedles(stepN);
  }, 100);
}

function toggleAutoDrop(enabled) {
  if (enabled && !canPlayCurrentRound()) {
    document.getElementById('auto-toggle').checked = false;
    return;
  }

  if (enabled) {
    startAutoDrop();
  } else {
    stopAutoDrop();
  }
}

// ── Stats ─────────────────────────────────────────
function updateStats(piEst) {
  document.getElementById('s-drops').textContent = drops.toLocaleString();
  document.getElementById('s-hits').textContent  = hits.toLocaleString();
  document.getElementById('s-miss').textContent  = (drops-hits).toLocaleString();
  document.getElementById('s-pi').textContent    = piEst ? piEst.toFixed(5) : '—';
  document.getElementById('s-err').textContent   = piEst ? Math.abs(piEst-Math.PI).toFixed(6) : '—';
  document.getElementById('f-l').textContent     = needleL;
  document.getElementById('f-d').textContent     = lineD;
  document.getElementById('f-n').textContent     = drops.toLocaleString();
  document.getElementById('f-h').textContent     = hits.toLocaleString();
  document.getElementById('f-result').textContent = piEst ? piEst.toFixed(4) : '—';
  const r = (needleL/lineD).toFixed(2), ok = needleL<=lineD;
  document.getElementById('ratio-badge').innerHTML =
    `<span style="color:${ok?'#34d399':'#fbbf24'}">l/d=${r} ${ok?'✓':'⚠'}</span>`;
}

// ── Chart ─────────────────────────────────────────
function drawChart() {
  const body = document.getElementById('chart-body');
  if (!body.classList.contains('open')) return;
  const cw = body.clientWidth - 4, ch = 148;
  chartCv.width = cw; chartCv.height = ch;
  const PAD = { top:8, right:18, bottom:28, left:38 };
  const pw = cw-PAD.left-PAD.right, ph = ch-PAD.top-PAD.bottom;
  chartCtx.clearRect(0,0,cw,ch);
  chartCtx.fillStyle='#141720';
  chartCtx.beginPath(); chartCtx.roundRect(0,0,cw,ch,6); chartCtx.fill();
  const xMax=Math.max(10,drops), xMin=0, xRange=xMax;
  const toX = n  => PAD.left + ((n-xMin)/xRange)*pw;
  const toY = pi => PAD.top  + (1-(pi-Y_MIN)/(Y_MAX-Y_MIN))*ph;
  chartCtx.save();
  chartCtx.beginPath(); chartCtx.rect(PAD.left,PAD.top,pw,ph); chartCtx.clip();
  chartCtx.strokeStyle='#2d3348'; chartCtx.lineWidth=0.8; chartCtx.setLineDash([]);
  [1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0].forEach(y=>{
    chartCtx.beginPath(); chartCtx.moveTo(PAD.left,toY(y)); chartCtx.lineTo(PAD.left+pw,toY(y)); chartCtx.stroke();
  });
  const pyp=toY(Math.PI);
  chartCtx.strokeStyle='#fbbf24'; chartCtx.lineWidth=1.2; chartCtx.setLineDash([4,4]);
  chartCtx.beginPath(); chartCtx.moveTo(PAD.left,pyp); chartCtx.lineTo(PAD.left+pw,pyp); chartCtx.stroke();
  chartCtx.setLineDash([]);
  if (history.length>=1) {
    chartCtx.strokeStyle='#34d399'; chartCtx.lineWidth=1.5; chartCtx.beginPath();
    history.forEach((pt,i)=>{ const x=toX(pt.n),y=toY(pt.pi); i===0?chartCtx.moveTo(x,y):chartCtx.lineTo(x,y); });
    chartCtx.stroke();
  }
  chartCtx.restore();
  chartCtx.fillStyle='#fbbf24'; chartCtx.font='9px Courier New'; chartCtx.textAlign='left';
  chartCtx.fillText('π',PAD.left+pw+3,pyp+3);
  chartCtx.strokeStyle='#475569'; chartCtx.lineWidth=1;
  chartCtx.beginPath(); chartCtx.moveTo(PAD.left,PAD.top); chartCtx.lineTo(PAD.left,PAD.top+ph); chartCtx.lineTo(PAD.left+pw,PAD.top+ph); chartCtx.stroke();
  chartCtx.fillStyle='#475569'; chartCtx.font='9px Courier New'; chartCtx.textAlign='right';
  [1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0].forEach(y=>chartCtx.fillText(y.toFixed(1),PAD.left-4,toY(y)+3));
  chartCtx.textAlign='center';
  for(let i=0;i<=5;i++){const n=Math.round(xRange*i/5);chartCtx.fillText(n>=1000?`${Math.round(n/1000)}k`:n,toX(n),PAD.top+ph+14);}
  chartCtx.fillText('# βελόνες',PAD.left+pw/2,ch-4);
}

function toggleChart() {
  const body=document.getElementById('chart-body'), arrow=document.getElementById('chart-arrow');
  const open=body.classList.toggle('open'); arrow.classList.toggle('open',open);
  if(open) drawChart();
}
function toggleFormula() {
  document.getElementById('formula-body').classList.toggle('open');
  document.getElementById('formula-arrow').classList.toggle('open');
}

// ── Reset ─────────────────────────────────────────
function resetAll() {
  drops=0; hits=0; history=[];
  drawGrid(); drawPreviewNeedle(); updateStats(null); drawChart(); sendUpdate();
}

// ── Spinners ──────────────────────────────────────
function setL(v){ needleL=Math.min(120,Math.max(10,v)); document.getElementById('val-l').textContent=needleL; document.getElementById('range-l').value=needleL; document.getElementById('f-l').textContent=needleL; resetAll(); }
function changeL(d){ setL(needleL+d); }
function setD(v){ lineD=Math.min(150,Math.max(30,v)); document.getElementById('val-d').textContent=lineD; document.getElementById('range-d').value=lineD; document.getElementById('f-d').textContent=lineD; resetAll(); }
function changeD(d){ setD(lineD+d); }
function setStep(v){ stepN=Math.min(1000,Math.max(1,v)); document.getElementById('step-val').textContent=stepN; document.getElementById('range-step').value=stepN; document.getElementById('step-btn').textContent=`▶ +${stepN} βελόν${stepN===1?'α':'ες'}`; }
function changeStep(d){ setStep(stepN+d); }

// ── Init ──────────────────────────────────────────
function initStudentApp() {
  const teamInput = document.getElementById('team-input');
  if (!teamInput) return;
  const storedConnectName = localStorage.getItem(CONNECT_NAME_KEY);

  if (PREFILL_TEAM) {
    teamInput.value = PREFILL_TEAM;
  } else if (storedConnectName && storedConnectName.trim()) {
    teamInput.value = storedConnectName.trim();
  }

  teamInput.addEventListener('input', () => {
    const currentName = teamInput.value.trim();
    if (currentName) {
      localStorage.setItem(CONNECT_NAME_KEY, currentName);
    }

    if (!currentName || currentName !== teamName) {
      teamRegistered = false;
      roundControlEnabled = false;
      setRoundBanner('Χωρίς σύνδεση ομάδας: ελεύθερος πειραματισμός.', 'waiting');
      updateConnDot();
    }
  });

  teamInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      registerTeam();
    }
  });

  setRoundBanner('Ελεύθερος πειραματισμός. Συνδεθείτε ως ομάδα για αγώνα!', 'waiting');
  connectWS();

  if (SHOULD_AUTOCONNECT && teamInput.value.trim()) {
    setTimeout(registerTeam, 180);
  }

  updateConnDot();
  drawGrid();
  drawPreviewNeedle();
  updateStats(null);
}

const handleBeforeUnload = () => {
  stopAutoDrop();
  stopRoundBannerTimer();
};

window.addEventListener('beforeunload', handleBeforeUnload);
initStudentApp();

  const globalFns = {
    registerTeam,
    changeL,
    setL,
    changeD,
    setD,
    changeStep,
    setStep,
    doStep,
    toggleAutoDrop,
    resetAll,
    toggleFormula,
    toggleChart,
  };

  Object.assign(window, globalFns);

  return () => {
    stopAutoDrop();
    stopRoundBannerTimer();
    window.removeEventListener('beforeunload', handleBeforeUnload);

    if (classroomApi && typeof classroomApi.stop === 'function') {
      classroomApi.stop();
    }

    Object.keys(globalFns).forEach((key) => {
      if (window[key] === globalFns[key]) {
        delete window[key];
      }
    });
  };
}
