(function initFourierClassroom() {
  const deck = window.fourierSlideDeck;
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode") === "teacher" ? "teacher" : "client";
  const requestedName = String(searchParams.get("name") || "").trim();
  const requestedTeam = String(searchParams.get("team") || "").trim();
  const wantsAutoConnect = searchParams.get("autoconnect") === "1";
  const NAME_STORAGE_KEY = "strobeStudentConnectName";
  const TEAM_STORAGE_KEY = "strobeStudentConnectTeam";

  const roleLabelNode = document.getElementById("classRoleLabel");
  const connectionNode = document.getElementById("classConnectionState");
  const summaryMiniNode = document.getElementById("classSummaryMini");
  const studentNameInput = document.getElementById("classStudentNameInput");
  const studentTeamInput = document.getElementById("classStudentTeamInput");
  const studentJoinBtn = document.getElementById("classStudentJoinBtn");
  const studentNameRow = document.getElementById("studentNameRow");
  const copyStudentLinkBtn = document.getElementById("classCopyStudentLinkBtn");
  const copyHintNode = document.getElementById("classCopyHint");
  const classJoinQrImageNode = document.getElementById("classJoinQrImage");
  const classJoinLinkTextNode = document.getElementById("classJoinLinkText");
  const classUsersCountNode = document.getElementById("classUsersCount");
  const classUsersListNode = document.getElementById("classUsersList");
  const classScoresCountNode = document.getElementById("classScoresCount");
  const classScoresListNode = document.getElementById("classScoresList");
  const classChatFeedNode = document.getElementById("classChatFeed");
  const classChatInputNode = document.getElementById("classChatInput");
  const classChatSendBtn = document.getElementById("classChatSendBtn");
  const classChatHintNode = document.getElementById("classChatHint");
  const classroomDockNode = document.getElementById("classroomDock");
  const classDockUnreadBadgeNode = document.getElementById("classDockUnreadBadge");
  const studentSoundFrequencyInput = document.getElementById("studentSoundFrequency");
  const studentSoundAmplitudeInput = document.getElementById("studentSoundAmplitude");
  const heatTimeSliderInput = document.getElementById("heatTimeSlider");
  const heatStudentPositionInput = document.getElementById("heatStudentPosition");
  const heatStudentTemperatureInput = document.getElementById("heatStudentTemperature");
  const fftDuelProbeInput = document.getElementById("fftDuelProbeFreq");
  const fftDuelSubmitBtn = document.getElementById("fftDuelSubmitBtn");
  const fftDuelStartBtn = document.getElementById("fftDuelStartBtn");
  const fftDuelRevealBtn = document.getElementById("fftDuelRevealBtn");
  const classFftDuelStartBtn = document.getElementById("classFftDuelStartBtn");
  const classFftDuelRevealBtn = document.getElementById("classFftDuelRevealBtn");
  const randomFreqGenerateBtn = document.getElementById("randomFreqGenerateBtn");
  const randomFreqClearBtn = document.getElementById("randomFreqClearBtn");
  const waveSumStudentFreqInput = document.getElementById("waveSumStudentFreq");
  const waveSumStudentAmpInput = document.getElementById("waveSumStudentAmp");
  const waveSumStudentPhiInput = document.getElementById("waveSumStudentPhi");
  const COMM_DEBUG = searchParams.get("debugWs") === "1";

  const metricNodes = {
    participants: Array.from(document.querySelectorAll('[data-activity-metric="participants"]')),
    events: Array.from(document.querySelectorAll('[data-activity-metric="events"]')),
    topActivity: Array.from(document.querySelectorAll('[data-activity-metric="topActivity"]')),
  };

  const feedNodes = Array.from(document.querySelectorAll("[data-activity-feed]"));
  const activityControls = Array.from(document.querySelectorAll("[data-activity-control]"));

  const state = {
    mode,
    connected: false,
    joined: false,
    joinPayload: null,
    userName: "",
    userTeam: "",
    summary: null,
    participants: null,
    activeSlideId: deck && typeof deck.getCurrentSlideId === "function" ? deck.getCurrentSlideId() : "",
    activeSlideIndex: deck && typeof deck.getCurrentSlideIndex === "function" ? deck.getCurrentSlideIndex() : 0,
    lastTeacherSlideKey: "",
    soundStates: [],
    heatStates: [],
    heatTime: 0,
    fftDuel: null,
      taylorGuess: null,
    oceanRandom: null,
    waveSum: null,
    chatMessages: [],
    unreadChatCount: 0,
  };

  const interactionThrottle = new Map();
  let chatToneContext = null;
  let lastChatToneAt = 0;
  let lastOutgoingChatSignature = "";
  let lastOutgoingChatAt = 0;

  // Debug helper for websocket troubleshooting.
  // Enable with: ?debugWs=1 in the URL.
  function logComm(eventName, payload) {
    if (!COMM_DEBUG) {
      return;
    }

    try {
      console.debug("[fourier-sync]", eventName, payload || "");
    } catch {
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toFiniteNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clampValue(value, min, max, fallback) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, numeric));
  }

  function normalizeName(name, fallback = "") {
    const cleaned = String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);

    return cleaned || fallback;
  }

  function normalizeTeam(team, fallback = "") {
    const cleaned = String(team || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 30);

    return cleaned || fallback;
  }

  function formatValue(value) {
    if (typeof value === "number") {
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }

    if (typeof value === "boolean") {
      return value ? "yes" : "no";
    }

    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  function getSlideLabel(slideId) {
    if (!slideId) {
      return "-";
    }

    const section = document.getElementById(slideId);
    if (!section) {
      return slideId;
    }

    const heading = section.querySelector("h2");
    return heading ? heading.textContent.trim() : slideId;
  }

  function setConnectionState(connected) {
    if (!connectionNode) {
      return;
    }

    connectionNode.textContent = connected ? "online" : "offline";
    connectionNode.classList.toggle("online", connected);
  }

  function setMiniMessage(message) {
    if (summaryMiniNode) {
      summaryMiniNode.textContent = message;
    }
  }

  function updateRoleLabel() {
    if (!roleLabelNode) {
      return;
    }

    if (state.mode === "teacher") {
      roleLabelNode.textContent = `Teacher: ${state.userName || "Teacher"}`;
      return;
    }

    if (state.joined) {
      const team = normalizeTeam(state.userTeam, "-");
      roleLabelNode.textContent = `Student: ${state.userName || "Connected"} (${team})`;
    } else {
      roleLabelNode.textContent = "Student: disconnected";
    }
  }

  function getParticipantPayload() {
    if (state.summary && state.summary.participants) {
      return state.summary.participants;
    }

    return state.participants || { teachers: 0, students: 0, roster: [] };
  }

  function computeTotalInteractions(roster) {
    if (!Array.isArray(roster)) {
      return 0;
    }

    return roster.reduce((sum, item) => sum + toFiniteNumber(item && item.interactions), 0);
  }

  function updateMetrics() {
    const participantPayload = getParticipantPayload();
    const students = toFiniteNumber(participantPayload.students);
    const events = computeTotalInteractions(participantPayload.roster);
    const topActivity =
      state.summary && Array.isArray(state.summary.activityBreakdown) && state.summary.activityBreakdown[0]
        ? state.summary.activityBreakdown[0].activityId
        : "-";

    metricNodes.participants.forEach((node) => {
      node.textContent = String(students);
    });

    metricNodes.events.forEach((node) => {
      node.textContent = String(events);
    });

    metricNodes.topActivity.forEach((node) => {
      node.textContent = String(topActivity || "-");
    });
  }

  function renderFeedForActivity(node, entries) {
    if (!entries.length) {
      node.innerHTML = '<div class="empty">No activity yet.</div>';
      return;
    }

    node.innerHTML = entries
      .map((entry) => {
        const name = escapeHtml(entry.name || "Student");
        const control = escapeHtml(entry.controlId || entry.kind || "input");
        const value = escapeHtml(formatValue(entry.value));
        return `<div class="line"><strong>${name}</strong> • ${control}: ${value}</div>`;
      })
      .join("");
  }

  function updateFeeds() {
    const recent = state.summary && Array.isArray(state.summary.recent) ? state.summary.recent : [];

    feedNodes.forEach((node) => {
      const activityId = String(node.dataset.activityFeed || "").trim();
      const entries = recent
        .filter((entry) => String((entry && entry.activityId) || "") === activityId)
        .slice(0, 8);

      renderFeedForActivity(node, entries);
    });
  }

  function normalizeChatMessage(rawEntry, fallbackId = "") {
    const text = String((rawEntry && (rawEntry.text || rawEntry.message)) || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 280);

    if (!text) {
      return null;
    }

    const role = rawEntry && rawEntry.role === "teacher" ? "teacher" : "client";
    const name = normalizeName(rawEntry && rawEntry.name, role === "teacher" ? "Teacher" : "Student");
    const team = normalizeTeam(rawEntry && rawEntry.team, role === "teacher" ? "Teacher" : "-");
    const id = String((rawEntry && rawEntry.id) || fallbackId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      .trim()
      .slice(0, 80);
    const ts = toFiniteNumber(rawEntry && rawEntry.ts) || Date.now();

    return {
      id,
      role,
      name,
      team,
      text,
      ts,
    };
  }

  function setChatHint(message) {
    if (classChatHintNode) {
      classChatHintNode.textContent = message;
    }
  }

  function isClassroomDockOpen() {
    return Boolean(classroomDockNode && classroomDockNode.classList.contains("open"));
  }

  function renderUnreadBadge() {
    if (!classDockUnreadBadgeNode) {
      return;
    }

    const unread = Math.max(0, Number(state.unreadChatCount) || 0);
    const label = unread > 99 ? "99+" : String(unread);
    classDockUnreadBadgeNode.textContent = label;
    classDockUnreadBadgeNode.classList.toggle("show", unread > 0);
  }

  function clearUnreadChatCount() {
    state.unreadChatCount = 0;
    renderUnreadBadge();
  }

  function bumpUnreadChatCount() {
    state.unreadChatCount = Math.max(0, Number(state.unreadChatCount) || 0) + 1;
    renderUnreadBadge();
  }

  function buildChatSignature(entry) {
    const role = entry && entry.role === "teacher" ? "teacher" : "client";
    const name = normalizeName(entry && entry.name, role === "teacher" ? "Teacher" : "Student");
    const team = normalizeTeam(entry && entry.team, role === "teacher" ? "Teacher" : "-");
    const text = String((entry && entry.text) || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 280);

    return `${role}|${name}|${team}|${text}`;
  }

  function isLikelyOwnChatMessage(entry) {
    const ageMs = Date.now() - lastOutgoingChatAt;
    if (!lastOutgoingChatSignature || ageMs < 0 || ageMs > 12000) {
      return false;
    }

    const incomingSignature = buildChatSignature(entry);
    if (incomingSignature !== lastOutgoingChatSignature) {
      return false;
    }

    lastOutgoingChatSignature = "";
    return true;
  }

  function playIncomingChatTone() {
    const now = Date.now();
    if (now - lastChatToneAt < 140) {
      return;
    }
    lastChatToneAt = now;

    const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioContextImpl !== "function") {
      return;
    }

    try {
      if (!chatToneContext) {
        chatToneContext = new AudioContextImpl();
      }

      const context = chatToneContext;
      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      const start = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(860, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.06, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.145);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.15);
    } catch {
    }
  }

  function renderChatMessages() {
    if (!classChatFeedNode) {
      return;
    }

    if (!state.chatMessages.length) {
      classChatFeedNode.innerHTML = '<div class="class-empty">Δεν υπάρχουν ακόμα μηνύματα.</div>';
      return;
    }

    classChatFeedNode.innerHTML = state.chatMessages
      .slice(-140)
      .map((entry) => {
        const roleLabel = entry.role === "teacher" ? "Teacher" : "Student";
        const timestamp = new Date(entry.ts).toLocaleTimeString("el-GR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return `
          <div class="class-chat-item">
            <div class="class-chat-meta"><strong>${escapeHtml(entry.name)}</strong> • ${escapeHtml(roleLabel)} • ${escapeHtml(entry.team)} • ${escapeHtml(timestamp)}</div>
            <div class="class-chat-text">${escapeHtml(entry.text)}</div>
          </div>
        `;
      })
      .join("");

    classChatFeedNode.scrollTop = classChatFeedNode.scrollHeight;
  }

  function applyChatHistory(rawMessages) {
    const normalized = Array.isArray(rawMessages)
      ? rawMessages
        .map((entry, index) => normalizeChatMessage(entry, `chat-${index}`))
        .filter(Boolean)
      : [];

    normalized.sort((a, b) => a.ts - b.ts);
    state.chatMessages = normalized.slice(-140);
    renderChatMessages();

    if (isClassroomDockOpen()) {
      clearUnreadChatCount();
    }
  }

  function updateMiniSummary() {
    const participantPayload = getParticipantPayload();
    const teachers = toFiniteNumber(participantPayload.teachers);
    const students = toFiniteNumber(participantPayload.students);
    const activeSoundStudents = state.soundStates.filter((item) => toFiniteNumber(item.amplitude) > 0.01).length;
    const heatSelections = state.heatStates.length;
    const heatTime = Number(clampValue(state.heatTime, 0, 8, 0).toFixed(2));
    const fftDuelState = state.fftDuel || null;
    const fftDuelLabel = fftDuelState && fftDuelState.status === "running"
      ? `${Math.max(0, Number(fftDuelState.solvedCount) || 0)}/${Math.max(0, Number(fftDuelState.totalPlayers) || 0)}`
      : "-";
    const slideId = state.activeSlideId || (state.summary && state.summary.activeSlideId) || "";
    const slideLabel = getSlideLabel(slideId);

    if (!state.connected) {
      setMiniMessage("Connecting to classroom...");
      return;
    }

    if (!state.joined) {
      if (state.mode === "client") {
        setMiniMessage("Add your name and join to follow the teacher live.");
      } else {
        setMiniMessage("Teacher connected. Waiting for classroom state...");
      }
      return;
    }

    if (state.mode === "teacher") {
      setMiniMessage(`Students: ${students} | Sound active: ${activeSoundStudents} | Heat picks: ${heatSelections} | Heat t: ${heatTime.toFixed(2)} | FFT duel: ${fftDuelLabel} | Active slide: ${slideLabel}`);
    } else {
      setMiniMessage(`Following: ${slideLabel} | Online students: ${students} | Active sound: ${activeSoundStudents} | Heat picks: ${heatSelections} | Heat t: ${heatTime.toFixed(2)} | FFT duel: ${fftDuelLabel}`);
    }
  }

  function normalizeSoundStates(rawStates) {
    if (!Array.isArray(rawStates)) {
      return [];
    }

    return rawStates
      .map((item, index) => {
        const socketId = String((item && item.socketId) || `source-${index}`).trim();
        const rawSourceKey = String((item && item.sourceKey) || 'main').trim().toLowerCase();
        const sourceKey = /^[a-z0-9_-]{1,32}$/.test(rawSourceKey) ? rawSourceKey : 'main';
        const sourceLabel = String((item && item.sourceLabel) || sourceKey).trim().slice(0, 24) || sourceKey;
        if (!socketId) {
          return null;
        }

        const name = normalizeName(item && item.name, "Student");
        const role = item && item.role === "teacher" ? "teacher" : "client";
        const frequency = Number(clampValue(item && item.frequency, 80, 1400, 440).toFixed(2));
        const amplitude = Number(clampValue(item && item.amplitude, 0, 1, 0).toFixed(3));
        const key = String((item && item.key) || `${socketId}::${sourceKey}`).trim() || `${socketId}::${sourceKey}`;

        return {
          key,
          socketId,
          sourceKey,
          sourceLabel,
          name,
          role,
          frequency,
          amplitude,
          updatedAt: toFiniteNumber(item && item.updatedAt),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const roleA = a && a.role === "teacher" ? 0 : 1;
        const roleB = b && b.role === "teacher" ? 0 : 1;
        if (roleA !== roleB) {
          return roleA - roleB;
        }
        const nameCompare = String(a.name).localeCompare(String(b.name));
        if (nameCompare !== 0) {
          return nameCompare;
        }
        return String(a.sourceKey).localeCompare(String(b.sourceKey));
      });
  }

  function applySoundStates(rawStates) {
    state.soundStates = normalizeSoundStates(rawStates);

    document.dispatchEvent(
      new CustomEvent("fourier:classroom-sound-state", {
        detail: {
          soundStates: state.soundStates,
        },
      })
    );
  }

  function normalizeHeatStates(rawStates) {
    if (!Array.isArray(rawStates)) {
      return [];
    }

    return rawStates
      .map((item, index) => {
        const socketId = String((item && item.socketId) || `heat-${index}`).trim();
        if (!socketId) {
          return null;
        }

        const name = normalizeName(item && item.name, "Student");
        const role = item && item.role === "teacher" ? "teacher" : "client";

        const rawPosition = Number(item && item.position);
        const inferredPosition = Number.isFinite(rawPosition)
          ? rawPosition
          : Number.isFinite(Number(item && item.positionMeter))
            ? Number(item.positionMeter) + 0.5
            : 0.5;
        const position = Number(clampValue(inferredPosition, 0, 1, 0.5).toFixed(4));
        const positionMeter = Number((position - 0.5).toFixed(3));

        const rawTemperature = Number(item && item.temperature);
        const inferredTemperature = Number.isFinite(rawTemperature)
          ? rawTemperature
          : Number.isFinite(Number(item && item.temperatureNorm))
            ? Number(item.temperatureNorm) * 100
            : 53;
        const temperature = Number(clampValue(inferredTemperature, 0, 100, 53).toFixed(2));

        return {
          socketId,
          name,
          role,
          position,
          positionMeter,
          temperature,
          temperatureNorm: Number((temperature / 100).toFixed(4)),
          updatedAt: toFiniteNumber(item && item.updatedAt),
        };
      })
      .filter(Boolean)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  function applyHeatStates(rawStates) {
    state.heatStates = normalizeHeatStates(rawStates);

    document.dispatchEvent(
      new CustomEvent("fourier:classroom-heat-state", {
        detail: {
          heatStates: state.heatStates,
        },
      })
    );
  }

  function normalizeHeatTimeState(rawHeatTime) {
    const candidate = rawHeatTime && typeof rawHeatTime === "object"
      ? rawHeatTime.value
      : rawHeatTime;

    const value = Number(clampValue(candidate, 0, 8, 0).toFixed(2));
    const updatedAt = toFiniteNumber(rawHeatTime && rawHeatTime.updatedAt);

    return {
      value,
      updatedAt,
    };
  }

  function applyHeatTimeState(rawHeatTime) {
    const normalized = normalizeHeatTimeState(rawHeatTime);
    state.heatTime = normalized.value;

    document.dispatchEvent(
      new CustomEvent("fourier:classroom-heat-time", {
        detail: {
          value: normalized.value,
          updatedAt: normalized.updatedAt,
        },
      })
    );
  }

  function normalizeFftDuelPlayer(rawPlayer, index, allowTarget = false) {
    const socketId = String((rawPlayer && rawPlayer.socketId) || `fft-duel-${index}`).trim();
    const name = normalizeName(rawPlayer && rawPlayer.name, "Student");
    const team = normalizeTeam(rawPlayer && rawPlayer.team, "-");
    const signalKind = String((rawPlayer && rawPlayer.signalKind) || "sine").trim() || "sine";
    const probeFreq = Number(clampValue(rawPlayer && rawPlayer.probeFreq, 0, 8, 2).toFixed(1));
    const targetFreqRaw = allowTarget ? rawPlayer && rawPlayer.targetFreq : null;
    const targetFreq = Number.isFinite(Number(targetFreqRaw))
      ? Number(clampValue(targetFreqRaw, 0, 8, 2).toFixed(1))
      : null;
    const submitted = Boolean(rawPlayer && rawPlayer.submitted);
    const locked = Boolean(rawPlayer && rawPlayer.locked);
    const guessFreq = submitted && Number.isFinite(Number(rawPlayer && rawPlayer.guessFreq))
      ? Number(clampValue(rawPlayer.guessFreq, 0, 8, 2).toFixed(1))
      : null;
    const error = submitted && Number.isFinite(Number(rawPlayer && rawPlayer.error))
      ? Number(Math.max(0, Number(rawPlayer.error)).toFixed(2))
      : null;

    return {
      socketId,
      name,
      team,
      signalKind,
      probeFreq,
      targetFreq,
      submitted,
      locked,
      guessFreq,
      error,
      submittedAt: toFiniteNumber(rawPlayer && rawPlayer.submittedAt),
      updatedAt: toFiniteNumber(rawPlayer && rawPlayer.updatedAt),
    };
  }

  function normalizeFftDuelState(rawState) {
    if (!rawState || typeof rawState !== "object") {
      return {
        roundId: "",
        status: "idle",
        solvedCount: 0,
        totalPlayers: 0,
        revealResults: false,
        players: [],
        own: null,
        updatedAt: 0,
      };
    }

    const players = Array.isArray(rawState.players)
      ? rawState.players.map((item, index) => normalizeFftDuelPlayer(item, index, state.mode === "teacher")).filter(Boolean)
      : [];

    const own = rawState.own && typeof rawState.own === "object"
      ? normalizeFftDuelPlayer(rawState.own, 0, true)
      : null;

    const solvedCount = Math.max(0, Number(rawState.solvedCount) || 0);
    const totalPlayers = Math.max(0, Number(rawState.totalPlayers) || players.length);

    return {
      roundId: String(rawState.roundId || "").trim(),
      status: String(rawState.status || "idle").trim() || "idle",
      solvedCount,
      totalPlayers,
      revealResults: Boolean(rawState.revealResults),
      players,
      own,
      updatedAt: toFiniteNumber(rawState.updatedAt),
    };
  }

  function applyFftDuelState(rawState) {
    state.fftDuel = normalizeFftDuelState(rawState);

    document.dispatchEvent(
      new CustomEvent("fourier:fft-duel-state", {
        detail: state.fftDuel,
      })
    );
  }

  function normalizeOceanRandomItems(rawItems) {
    if (!Array.isArray(rawItems)) {
      return [];
    }

    return rawItems
      .slice(0, 8)
      .map((item) => ({
        freq: Number(clampValue(item && item.freq, 0, 8, 1).toFixed(2)),
        amp: Number(clampValue(item && item.amp, 0.01, 1, 0.1).toFixed(3)),
        phase: Number(clampValue(item && item.phase, 0, Math.PI * 2, 0).toFixed(3)),
        angle: Number(clampValue(item && item.angle, 0, Math.PI * 2, 0).toFixed(3)),
      }))
      .filter((item) => Number.isFinite(item.freq) && Number.isFinite(item.amp));
  }

  function normalizeOceanRandomState(rawState) {
    if (!rawState || typeof rawState !== "object") {
      return {
        packs: [],
        totalTerms: 0,
        usedTerms: [],
        updatedAt: 0,
      };
    }

    const packs = Array.isArray(rawState.packs)
      ? rawState.packs
        .slice(0, 120)
        .map((pack, index) => ({
          socketId: String((pack && pack.socketId) || `pack-${index}`).trim(),
          name: normalizeName(pack && pack.name, "Student"),
          team: normalizeTeam(pack && pack.team, "-"),
          items: normalizeOceanRandomItems(pack && pack.items),
          updatedAt: toFiniteNumber(pack && pack.updatedAt),
        }))
      : [];

    return {
      packs,
      totalTerms: Math.max(0, Number(rawState.totalTerms) || 0),
      usedTerms: normalizeOceanRandomItems(rawState.usedTerms),
      updatedAt: toFiniteNumber(rawState.updatedAt),
    };
  }

  function applyOceanRandomState(rawState) {
    state.oceanRandom = normalizeOceanRandomState(rawState);
    document.dispatchEvent(
      new CustomEvent("fourier:classroom-ocean-random-state", {
        detail: state.oceanRandom,
      })
    );
  }

  function normalizeWaveSumEntries(rawEntries) {
    if (!Array.isArray(rawEntries)) {
      return [];
    }
    return rawEntries
      .slice(0, 60)
      .map((entry) => ({
        name: normalizeName(entry && entry.name, "Student"),
        amp: Number(clampValue(entry && entry.amp, 0, 1.8, 0.9).toFixed(2)),
        freq: Number(clampValue(entry && entry.freq, 0.4, 6, 1.2).toFixed(2)),
        phi: Number(clampValue(entry && entry.phi, -3.14, 3.14, 0).toFixed(2)),
        updatedAt: toFiniteNumber(entry && entry.updatedAt),
      }))
      .filter((entry) => Number.isFinite(entry.freq));
  }

  function normalizeWaveSumState(rawState) {
    if (!rawState || typeof rawState !== "object") {
      return { entries: [], updatedAt: 0 };
    }
    return {
      entries: normalizeWaveSumEntries(rawState.entries),
      updatedAt: toFiniteNumber(rawState.updatedAt),
    };
  }

  function applyWaveSumState(rawState) {
    state.waveSum = normalizeWaveSumState(rawState);
    document.dispatchEvent(
      new CustomEvent("fourier:wave-sum-state", {
        detail: state.waveSum,
      })
    );
  }

  function renderConnectedUsersPanel() {
    if (!classUsersListNode || !classUsersCountNode) {
      return;
    }

    const participantPayload = getParticipantPayload();
    const roster = Array.isArray(participantPayload.roster) ? participantPayload.roster.slice() : [];
    const soundBySocket = new Map(state.soundStates.map((item) => [String(item.socketId), item]));

    classUsersCountNode.textContent = String(roster.length);

    if (!roster.length) {
      classUsersListNode.innerHTML = '<div class="class-empty">Δεν υπάρχουν ακόμα συνδεδεμένοι χρήστες.</div>';
      if (classScoresCountNode) {
        classScoresCountNode.textContent = "0";
      }
      if (classScoresListNode) {
        classScoresListNode.innerHTML = '<div class="class-empty">Δεν υπάρχουν ακόμα ομαδικά δεδομένα.</div>';
      }
      return;
    }

    roster.sort((a, b) => {
      const roleA = a && a.role === "teacher" ? 0 : 1;
      const roleB = b && b.role === "teacher" ? 0 : 1;

      if (roleA !== roleB) {
        return roleA - roleB;
      }

      const teamA = normalizeTeam(a && a.team, roleA === 0 ? "Teacher" : "-");
      const teamB = normalizeTeam(b && b.team, roleB === 0 ? "Teacher" : "-");
      const byTeam = teamA.localeCompare(teamB, "el");
      if (byTeam !== 0) {
        return byTeam;
      }

      return String((a && a.name) || "").localeCompare(String((b && b.name) || ""));
    });

    classUsersListNode.innerHTML = roster
      .slice(0, 120)
      .map((participant, index) => {
        const socketId = String((participant && participant.socketId) || `participant-${index}`);
        const name = escapeHtml(normalizeName(participant && participant.name, "Participant"));
        const role = participant && participant.role === "teacher" ? "teacher" : "student";
        const roleLabel = role === "teacher" ? "Teacher" : "Student";
        const teamLabel = escapeHtml(normalizeTeam(participant && participant.team, role === "teacher" ? "Teacher" : "-"));
        const interactions = toFiniteNumber(participant && participant.interactions);
        const fallbackSound = participant && participant.sound ? participant.sound : null;
        const soundState = soundBySocket.get(socketId) || (fallbackSound
          ? {
            frequency: toFiniteNumber(fallbackSound.frequency),
            amplitude: clampValue(fallbackSound.amplitude, 0, 1, 0),
          }
          : null);
        const soundActive = soundState && toFiniteNumber(soundState.amplitude) > 0.01;
        const soundMeta = role === "teacher"
          ? "—"
          : soundState
            ? `${Math.round(toFiniteNumber(soundState.frequency))} Hz • ${Math.round(clampValue(soundState.amplitude, 0, 1, 0) * 100)}%`
            : "χωρίς ήχο";
        const scoreText = interactions.toLocaleString("el-GR");

        return `
          <div class="class-table-row">
            <span>${index + 1}</span>
            <span class="class-row-name">${name}</span>
            <span class="class-row-team">${teamLabel}</span>
            <span class="class-row-role">${escapeHtml(roleLabel)}</span>
            <span class="class-row-sound">${soundActive ? "● " : ""}${escapeHtml(soundMeta)}</span>
            <span class="class-row-score">${scoreText}</span>
          </div>
        `;
      })
      .join("");

    const teamScores = new Map();
    roster
      .filter((participant) => String((participant && participant.role) || "") !== "teacher")
      .forEach((participant) => {
        const team = normalizeTeam(participant && participant.team, "-");
        const current = teamScores.get(team) || { team, members: 0, score: 0 };
        current.members += 1;
        current.score += toFiniteNumber(participant && participant.interactions);
        teamScores.set(team, current);
      });

    const sortedTeams = [...teamScores.values()].sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      if (a.members !== b.members) {
        return b.members - a.members;
      }
      return String(a.team).localeCompare(String(b.team), "el");
    });

    if (classScoresCountNode) {
      classScoresCountNode.textContent = String(sortedTeams.length);
    }

    if (!classScoresListNode) {
      return;
    }

    if (!sortedTeams.length) {
      classScoresListNode.innerHTML = '<div class="class-empty">Δεν υπάρχουν ακόμα ομαδικά δεδομένα.</div>';
      return;
    }

    classScoresListNode.innerHTML = sortedTeams
      .map((entry, index) => `
        <div class="class-table-row">
          <span>${index + 1}</span>
          <span class="class-row-team">${escapeHtml(entry.team)}</span>
          <span>${entry.members.toLocaleString("el-GR")}</span>
          <span class="class-row-score">${entry.score.toLocaleString("el-GR")}</span>
        </div>
      `)
      .join("");
  }

  function refreshUi() {
    updateRoleLabel();
    updateMetrics();
    updateFeeds();
    renderConnectedUsersPanel();
    renderChatMessages();
    updateMiniSummary();
    renderUnreadBadge();
  }

  function dispatchClassroomSummary(summary) {
    document.dispatchEvent(
      new CustomEvent("fourier:classroom-summary", {
        detail: {
          summary: summary || null,
        },
      })
    );
  }

  function dispatchClassroomActivityEvent(entry) {
    if (!entry || typeof entry !== "object") {
      return;
    }

    document.dispatchEvent(
      new CustomEvent("fourier:classroom-activity-event", {
        detail: {
          entry,
        },
      })
    );
  }

  function extractControlValue(control) {
    if (!control) {
      return "";
    }

    if (control.type === "checkbox") {
      return Boolean(control.checked);
    }

    if (control.type === "range" || control.type === "number") {
      return toFiniteNumber(control.value);
    }

    return String(control.value || "");
  }

  function applyRemoteSlide(slideData) {
    if (!deck) {
      return;
    }

    const hasIndex = Number.isInteger(slideData && slideData.activeSlideIndex);
    const hasId = typeof (slideData && slideData.activeSlideId) === "string";

    if (hasIndex) {
      state.activeSlideIndex = slideData.activeSlideIndex;
    }

    if (hasId) {
      state.activeSlideId = slideData.activeSlideId;
    }

    let moved = false;

    if (hasIndex && typeof deck.goToSlide === "function") {
      moved = deck.goToSlide(slideData.activeSlideIndex, {
        source: "remote",
        force: true,
        smooth: true,
      });
    }

    if (!moved && hasId && typeof deck.goToSlideById === "function") {
      moved = deck.goToSlideById(slideData.activeSlideId, {
        source: "remote",
        force: true,
        smooth: true,
      });
    }

    if (moved && typeof deck.getCurrentSlideId === "function" && typeof deck.getCurrentSlideIndex === "function") {
      state.activeSlideId = deck.getCurrentSlideId();
      state.activeSlideIndex = deck.getCurrentSlideIndex();
    }
  }

  function setStudentJoined(joined) {
    if (!studentNameRow) {
      return;
    }

    studentNameRow.style.display = joined ? "none" : "";
  }

  function buildStudentLink() {
    return "http://dmlt.math.aegean.gr:3000/apps/fourier-lab/index.html?mode=client";
  }

  function updateJoinQrAssets() {
    const link = buildStudentLink();

    if (classJoinLinkTextNode) {
      classJoinLinkTextNode.textContent = link;
    }

    if (classJoinQrImageNode) {
      classJoinQrImageNode.src = "media/QRCode.png";
      classJoinQrImageNode.alt = "QR code για σύνδεση μαθητών";
    }
  }

  if (!deck) {
    document.body.classList.add(mode === "teacher" ? "teacher-mode" : "client-mode");
    setConnectionState(false);
    setMiniMessage("Slide deck API is unavailable.");
    return;
  }

  document.body.classList.add(mode === "teacher" ? "teacher-mode" : "client-mode");
  if (mode === "client") {
    document.body.classList.add("follow-teacher");
    deck.setNavigationLocked(true);
  } else {
    deck.setNavigationLocked(false);
  }

  if (mode === "client") {
    const storedName = normalizeName(localStorage.getItem(NAME_STORAGE_KEY) || "");
    const storedTeam = normalizeTeam(localStorage.getItem(TEAM_STORAGE_KEY) || "");
    const chosenName = normalizeName(requestedName, storedName);
    const chosenTeam = normalizeTeam(requestedTeam, storedTeam);

    if (requestedName) {
      localStorage.setItem(NAME_STORAGE_KEY, chosenName);
    }

    if (requestedTeam) {
      localStorage.setItem(TEAM_STORAGE_KEY, chosenTeam);
    }

    if (studentNameInput) {
      studentNameInput.value = chosenName;
    }

    if (studentTeamInput) {
      studentTeamInput.value = chosenTeam;
    }

    state.userName = chosenName;
    state.userTeam = chosenTeam;
  } else {
    state.userName = normalizeName(requestedName, "Teacher");
    state.userTeam = "Teacher";
  }

  updateJoinQrAssets();

  if (classJoinQrImageNode) {
    classJoinQrImageNode.title = "Click για μεγέθυνση QR";
    classJoinQrImageNode.addEventListener("click", () => {
      const isExpanded = classJoinQrImageNode.classList.toggle("is-expanded");
      classJoinQrImageNode.title = isExpanded
        ? "Click για επαναφορά"
        : "Click για μεγέθυνση QR";
    });
  }

  updateRoleLabel();
  setConnectionState(false);
  setStudentJoined(false);
  refreshUi();

  if (copyStudentLinkBtn) {
    copyStudentLinkBtn.addEventListener("click", async () => {
      const link = buildStudentLink();
      updateJoinQrAssets();
      try {
        await navigator.clipboard.writeText(link);
        if (copyHintNode) {
          copyHintNode.textContent = "Copied";
        }
      } catch {
        if (copyHintNode) {
          copyHintNode.textContent = link;
        }
      }
    });
  }

  if (typeof window.createRealtimeSocket !== "function") {
    setMiniMessage("Realtime WebSocket client is unavailable.");
    return;
  }

  // Main realtime WebSocket channel used by student/teacher for all Fourier classroom events.
  const socket = window.createRealtimeSocket();
  let lastSoundControlSentAt = 0;
  let lastSoundControlKey = "";
  let pendingSoundControl = null;
  let lastHeatControlSentAt = 0;
  let lastHeatControlKey = "";
  let pendingHeatControl = null;
  let lastHeatTimeControlSentAt = 0;
  let lastHeatTimeControlValue = null;
  let pendingHeatTimeControl = null;
  let lastTaylorGuessLiveSentAt = 0;
  let lastTaylorGuessLiveKey = "";
  let pendingTaylorGuessLive = null;
  let pendingTaylorGuessSubmit = null;
  let pendingChatMessage = "";

  function resolveClientName(name) {
    const fromInput = normalizeName(name, "");
    if (fromInput) {
      return fromInput;
    }

    const fromState = normalizeName(state.userName, "");
    if (fromState) {
      return fromState;
    }

    const fromStorage = normalizeName(localStorage.getItem(NAME_STORAGE_KEY) || "", "");
    if (fromStorage) {
      return fromStorage;
    }

    const generated = `Student-${Math.random().toString(36).slice(2, 6)}`;
    if (studentNameInput && !String(studentNameInput.value || "").trim()) {
      studentNameInput.value = generated;
    }
    return generated;
  }

  function resolveClientTeam(team, fallbackName = "") {
    const fromInput = normalizeTeam(team, "");
    if (fromInput) {
      return fromInput;
    }

    const fromState = normalizeTeam(state.userTeam, "");
    if (fromState) {
      return fromState;
    }

    const fromStorage = normalizeTeam(localStorage.getItem(TEAM_STORAGE_KEY) || "", "");
    if (fromStorage) {
      return fromStorage;
    }

    return normalizeTeam(fallbackName, "-");
  }

  function requestJoin(role, name, team = "") {
    // Join handshake:
    // client -> server: fourier:join
    // server -> client: fourier:state (snapshot) + fourier:slide
    const normalizedName = role === "teacher"
      ? normalizeName(name, "Teacher")
      : resolveClientName(name);
    const normalizedTeam = role === "teacher"
      ? "Teacher"
      : resolveClientTeam(team, normalizedName);

    if (!normalizedName) {
      setMiniMessage("Name is required before joining.");
      return;
    }

    state.joinPayload = { role, name: normalizedName, team: normalizedTeam };
    state.userName = normalizedName;
    state.userTeam = normalizedTeam;
    updateRoleLabel();

    if (role === "client") {
      localStorage.setItem(NAME_STORAGE_KEY, normalizedName);
      localStorage.setItem(TEAM_STORAGE_KEY, normalizedTeam);
    }

    if (socket.connected) {
      logComm("emit fourier:join", state.joinPayload);
      socket.emit("fourier:join", state.joinPayload);
    }
  }

  function emitChatMessageText(messageText) {
    const text = String(messageText || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 280);

    if (!text || !socket.connected || !state.joined) {
      return false;
    }

    const payload = { text };

    if (state.mode === "client") {
      const currentName = resolveClientName(studentNameInput ? studentNameInput.value : state.userName);
      const currentTeam = resolveClientTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, currentName);
      payload.role = "client";
      payload.name = currentName;
      payload.team = currentTeam;
    } else {
      payload.role = "teacher";
      payload.name = normalizeName(state.userName, "Teacher");
      payload.team = "Teacher";
    }

    lastOutgoingChatSignature = buildChatSignature({
      role: payload.role,
      name: payload.name,
      team: payload.team,
      text,
    });
    lastOutgoingChatAt = Date.now();

    logComm("emit fourier:chat-send", payload);
    socket.emit("fourier:chat-send", payload);
    return true;
  }

  function sendChatMessage() {
    if (!classChatInputNode) {
      return;
    }

    const text = String(classChatInputNode.value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 280);

    if (!text) {
      return;
    }

    if (!socket.connected) {
      pendingChatMessage = text;
      setChatHint("Offline τώρα. Το μήνυμα θα σταλεί μόλις επανασυνδεθείς.");
      return;
    }

    if (!state.joined) {
      pendingChatMessage = text;

      if (state.mode === "client") {
        const currentName = resolveClientName(studentNameInput ? studentNameInput.value : state.userName);
        const currentTeam = resolveClientTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, currentName);
        requestJoin("client", currentName, currentTeam);
      } else {
        requestJoin("teacher", state.userName || "Teacher", "Teacher");
      }

      setChatHint("Σύνδεση στο classroom... Το μήνυμα θα σταλεί αυτόματα.");
      return;
    }

    pendingChatMessage = "";
    if (emitChatMessageText(text)) {
      classChatInputNode.value = "";
      setChatHint("Το μήνυμα στάλθηκε.");
    }
  }

  function getLocalSoundControlFromDom() {
    const frequencyInput = document.getElementById("studentSoundFrequency");
    const amplitudeInput = document.getElementById("studentSoundAmplitude");

    return {
      frequency: clampValue(frequencyInput && frequencyInput.value, 80, 1400, 440),
      amplitude: clampValue(amplitudeInput && amplitudeInput.value, 0, 1, 0),
    };
  }

  function getLocalHeatControlFromDom() {
    const positionInput = document.getElementById("heatStudentPosition");
    const temperatureInput = document.getElementById("heatStudentTemperature");

    const positionMeter = Number(clampValue(positionInput && positionInput.value, -0.5, 0.5, 0).toFixed(3));
    const position = Number((positionMeter + 0.5).toFixed(4));
    const temperature = Number(clampValue(temperatureInput && temperatureInput.value, 0, 100, 53).toFixed(2));

    return {
      position,
      positionMeter,
      temperature,
      temperatureNorm: Number((temperature / 100).toFixed(4)),
    };
  }

  function getLocalHeatTimeControlFromDom() {
    return {
      value: Number(clampValue(heatTimeSliderInput && heatTimeSliderInput.value, 0, 8, 0).toFixed(2)),
    };
  }

  function emitSoundControl(detail, force = false) {
    // Live sound-control path:
    // student/teacher source -> fourier:sound-control -> server updates sound state
    // -> server broadcasts fourier:sound-state -> all clients render combined sources.
    if (state.mode !== "client" && state.mode !== "teacher") {
      return;
    }

    const senderRole = state.mode === "teacher" ? "teacher" : "client";

    const frequency = Number(clampValue(detail && detail.frequency, 80, 1400, 440).toFixed(2));
    const amplitude = Number(clampValue(detail && detail.amplitude, 0, 1, 0).toFixed(3));
    const rawSourceKey = String((detail && detail.sourceKey) || "").trim().toLowerCase();
    const sourceKey = /^[a-z0-9_-]{1,32}$/.test(rawSourceKey)
      ? rawSourceKey
      : senderRole === "teacher"
        ? "teacher-main"
        : "main";
    const sourceLabel = String((detail && detail.sourceLabel) || "").trim().slice(0, 24);
    const currentName = senderRole === "teacher"
      ? normalizeName(state.userName, "Teacher")
      : resolveClientName(studentNameInput ? studentNameInput.value : state.userName);
    const currentTeam = senderRole === "teacher"
      ? "Teacher"
      : resolveClientTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, currentName);

    if (!socket.connected) {
      pendingSoundControl = { frequency, amplitude, sourceKey, sourceLabel };
      logComm("queue sound-control (socket disconnected)", pendingSoundControl);
      return;
    }

    if (!state.joined) {
      pendingSoundControl = { frequency, amplitude, sourceKey, sourceLabel };
      logComm("queue sound-control (not joined yet)", pendingSoundControl);

      if (!state.joinPayload || state.joinPayload.role !== senderRole) {
        requestJoin(senderRole, currentName, currentTeam);
      } else {
        logComm("re-emit fourier:join before sound-control", state.joinPayload);
        socket.emit("fourier:join", state.joinPayload);
      }

      // Do not return here: we still emit one sound-control packet right away.
      // The server can now auto-recover with implicit join if needed.
    }

    const now = Date.now();
    const controlKey = `${senderRole}:${sourceKey}:${frequency}:${amplitude}`;

    if (!force && controlKey === lastSoundControlKey && now - lastSoundControlSentAt < 120) {
      return;
    }

    lastSoundControlKey = controlKey;
    lastSoundControlSentAt = now;
    const payload = {
      // Name/team are included so the server can recover with an implicit join
      // if a sound-control arrives before/without a successful explicit join.
      role: senderRole,
      name: currentName,
      team: currentTeam,
      sourceKey,
      sourceLabel,
      frequency,
      amplitude,
    };

    logComm("emit fourier:sound-control", payload);
    socket.emit("fourier:sound-control", payload);
  }

  function emitHeatControl(detail, force = false) {
    // Live heat-control path:
    // point/temperature slider -> fourier:heat-control -> server updates per-user heat choice
    // -> server broadcasts fourier:heat-state -> teacher reconstructs classroom heat profile.
    if (state.mode !== "client" && state.mode !== "teacher") {
      return;
    }

    const senderRole = state.mode === "teacher" ? "teacher" : "client";

    const inferredPosition = Number.isFinite(Number(detail && detail.position))
      ? Number(detail.position)
      : Number.isFinite(Number(detail && detail.positionMeter))
        ? Number(detail.positionMeter) + 0.5
        : 0.5;
    const position = Number(clampValue(inferredPosition, 0, 1, 0.5).toFixed(4));
    const positionMeter = Number((position - 0.5).toFixed(3));

    const inferredTemperature = Number.isFinite(Number(detail && detail.temperature))
      ? Number(detail.temperature)
      : Number.isFinite(Number(detail && detail.temperatureNorm))
        ? Number(detail.temperatureNorm) * 100
        : 53;
    const temperature = Number(clampValue(inferredTemperature, 0, 100, 53).toFixed(2));
    const temperatureNorm = Number((temperature / 100).toFixed(4));

    const currentName = senderRole === "teacher"
      ? normalizeName(state.userName, "Teacher")
      : resolveClientName(studentNameInput ? studentNameInput.value : state.userName);
    const currentTeam = senderRole === "teacher"
      ? "Teacher"
      : resolveClientTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, currentName);

    if (!socket.connected) {
      pendingHeatControl = { position, positionMeter, temperature, temperatureNorm };
      logComm("queue heat-control (socket disconnected)", pendingHeatControl);
      return;
    }

    if (!state.joined) {
      pendingHeatControl = { position, positionMeter, temperature, temperatureNorm };
      logComm("queue heat-control (not joined yet)", pendingHeatControl);

      if (!state.joinPayload || state.joinPayload.role !== senderRole) {
        requestJoin(senderRole, currentName, currentTeam);
      } else {
        logComm("re-emit fourier:join before heat-control", state.joinPayload);
        socket.emit("fourier:join", state.joinPayload);
      }

      // Do not return here: we still emit one heat-control packet right away.
      // The server can recover with implicit join if needed.
    }

    const now = Date.now();
    const controlKey = `${position}:${temperature}`;

    if (!force && controlKey === lastHeatControlKey && now - lastHeatControlSentAt < 120) {
      return;
    }

    lastHeatControlKey = controlKey;
    lastHeatControlSentAt = now;

    const payload = {
      role: senderRole,
      name: currentName,
      team: currentTeam,
      position,
      positionMeter,
      temperature,
      temperatureNorm,
    };

    logComm("emit fourier:heat-control", payload);
    socket.emit("fourier:heat-control", payload);
  }

  function emitHeatTimeControl(detail, force = false) {
    // Teacher-only authority for section 3.5 time evolution slider.
    if (state.mode !== "teacher") {
      return;
    }

    const value = Number(clampValue(detail && detail.value, 0, 8, 0).toFixed(2));

    if (!socket.connected) {
      pendingHeatTimeControl = { value };
      logComm("queue heat-time-control (socket disconnected)", pendingHeatTimeControl);
      return;
    }

    if (!state.joined) {
      pendingHeatTimeControl = { value };
      logComm("queue heat-time-control (not joined yet)", pendingHeatTimeControl);

      if (!state.joinPayload || state.joinPayload.role !== "teacher") {
        requestJoin("teacher", state.userName || "Teacher", "Teacher");
      } else {
        logComm("re-emit fourier:join before heat-time-control", state.joinPayload);
        socket.emit("fourier:join", state.joinPayload);
      }
    }

    const now = Date.now();
    if (!force && lastHeatTimeControlValue === value && now - lastHeatTimeControlSentAt < 80) {
      return;
    }

    lastHeatTimeControlValue = value;
    lastHeatTimeControlSentAt = now;

    const payload = { value };
    logComm("emit fourier:heat-time-control", payload);
    socket.emit("fourier:heat-time-control", payload);
  }

  function emitFftDuelStart() {
    if (state.mode !== "teacher" || !socket.connected || !state.joined) {
      return;
    }

    const payload = {
      slideId: state.activeSlideId || "",
    };

    logComm("emit fourier:fft-duel-start", payload);
    socket.emit("fourier:fft-duel-start", payload);
  }

  function emitFftDuelReveal() {
    if (state.mode !== "teacher" || !socket.connected || !state.joined) {
      return;
    }

    const payload = {
      slideId: state.activeSlideId || "",
    };

    logComm("emit fourier:fft-duel-reveal", payload);
    socket.emit("fourier:fft-duel-reveal", payload);
  }

  function emitFftDuelProbe(detail, force = false) {
    if (state.mode !== "client") {
      return;
    }

    const probeFreq = Number(clampValue(detail && detail.probeFreq, 0, 8, 2).toFixed(1));

    if (!socket.connected || !state.joined) {
      return;
    }

    const payload = {
      probeFreq,
      force: Boolean(force),
    };

    logComm("emit fourier:fft-duel-probe", payload);
    socket.emit("fourier:fft-duel-probe", payload);
  }

  function emitFftDuelSubmit(detail) {
    if (state.mode !== "client" || !socket.connected || !state.joined) {
      return;
    }

    const guessFreq = Number(clampValue(detail && detail.guessFreq, 0, 8, 2).toFixed(1));
    const payload = {
      guessFreq,
    };

    logComm("emit fourier:fft-duel-submit", payload);
    socket.emit("fourier:fft-duel-submit", payload);
  }

    function normalizeTaylorGuessState(rawState) {
      if (!rawState || typeof rawState !== 'object') {
        return { status: 'idle', revealResults: false, players: [], submittedCount: 0, totalPlayers: 0, ownSubmitted: false, ownCoeffs: null };
      }
      const players = Array.isArray(rawState.players) ? rawState.players.map((p, i) => ({
        socketId: String((p && p.socketId) || `p-${i}`),
        name: normalizeName(p && p.name, 'Student'),
        submitted: Boolean(p && p.submitted),
        coeffs: Array.isArray(p && p.coeffs) ? p.coeffs.slice(0, 4).map(Number) : null,
        error: (p && p.error != null) ? Number(p.error) : null,
      })) : [];
      return {
        status: String(rawState.status || 'idle'),
        revealResults: Boolean(rawState.revealResults),
        players,
        submittedCount: Number(rawState.submittedCount) || 0,
        totalPlayers: Number(rawState.totalPlayers) || 0,
        ownSubmitted: Boolean(rawState.ownSubmitted),
        ownCoeffs: Array.isArray(rawState.ownCoeffs) ? rawState.ownCoeffs.slice(0, 4).map(Number) : null,
      };
    }

    function applyTaylorGuessState(rawState) {
      state.taylorGuess = normalizeTaylorGuessState(rawState);
      document.dispatchEvent(new CustomEvent('fourier:taylor-guess-state', { detail: state.taylorGuess }));
    }

    function emitTaylorGuessReveal() {
      if (state.mode !== 'teacher' || !socket.connected || !state.joined) return;
      const payload = { slideId: state.activeSlideId || '' };
      logComm('emit fourier:taylor-guess-reveal', payload);
      socket.emit('fourier:taylor-guess-reveal', payload);
    }

    function emitTaylorGuessLive(detail, force = false) {
      if (state.mode !== 'client') return;
      const c0 = Number(clampValue(detail && detail.c0, -4, 4, 0).toFixed(2));
      const c1 = Number(clampValue(detail && detail.c1, -4, 4, 0).toFixed(2));
      const c2 = Number(clampValue(detail && detail.c2, -4, 4, 0).toFixed(2));
      const c3 = Number(clampValue(detail && detail.c3, -4, 4, 0).toFixed(2));

      const currentName = resolveClientName(studentNameInput ? studentNameInput.value : state.userName);
      const currentTeam = resolveClientTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, currentName);

      if (!socket.connected) {
        pendingTaylorGuessLive = { c0, c1, c2, c3 };
        logComm('queue fourier:taylor-guess-live (socket disconnected)', pendingTaylorGuessLive);
        return;
      }

      if (!state.joined) {
        pendingTaylorGuessLive = { c0, c1, c2, c3 };
        logComm('queue fourier:taylor-guess-live (not joined yet)', pendingTaylorGuessLive);

        if (!state.joinPayload || state.joinPayload.role !== 'client') {
          requestJoin('client', currentName, currentTeam);
        } else {
          logComm('re-emit fourier:join before taylor-guess-live', state.joinPayload);
          socket.emit('fourier:join', state.joinPayload);
        }
      }

      const now = Date.now();
      const liveKey = `${c0}:${c1}:${c2}:${c3}`;
      if (!force && liveKey === lastTaylorGuessLiveKey && now - lastTaylorGuessLiveSentAt < 70) {
        return;
      }

      lastTaylorGuessLiveKey = liveKey;
      lastTaylorGuessLiveSentAt = now;

      const payload = { role: 'client', name: currentName, team: currentTeam, c0, c1, c2, c3 };
      logComm('emit fourier:taylor-guess-live', payload);
      socket.emit('fourier:taylor-guess-live', payload);
    }

    function emitTaylorGuessSubmit(detail) {
      if (state.mode !== 'client') return;
      const c0 = Number(clampValue(detail && detail.c0, -4, 4, 0).toFixed(2));
      const c1 = Number(clampValue(detail && detail.c1, -4, 4, 0).toFixed(2));
      const c2 = Number(clampValue(detail && detail.c2, -4, 4, 0).toFixed(2));
      const c3 = Number(clampValue(detail && detail.c3, -4, 4, 0).toFixed(2));

      const currentName = resolveClientName(studentNameInput ? studentNameInput.value : state.userName);
      const currentTeam = resolveClientTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, currentName);

      if (!socket.connected) {
        pendingTaylorGuessSubmit = { c0, c1, c2, c3 };
        logComm('queue fourier:taylor-guess-submit (socket disconnected)', pendingTaylorGuessSubmit);
        return;
      }

      if (!state.joined) {
        pendingTaylorGuessSubmit = { c0, c1, c2, c3 };
        logComm('queue fourier:taylor-guess-submit (not joined yet)', pendingTaylorGuessSubmit);

        if (!state.joinPayload || state.joinPayload.role !== 'client') {
          requestJoin('client', currentName, currentTeam);
        } else {
          logComm('re-emit fourier:join before taylor-guess-submit', state.joinPayload);
          socket.emit('fourier:join', state.joinPayload);
        }
        return;
      }

      const payload = { c0, c1, c2, c3, role: 'client', name: currentName, team: currentTeam };
      logComm('emit fourier:taylor-guess-submit', payload);
      socket.emit('fourier:taylor-guess-submit', payload);
    }

  function emitWaveSumUpdate(detail) {
    if (state.mode !== "client" || !socket.connected || !state.joined) {
      return;
    }

    const freq = Number(clampValue(detail && detail.freq, 0.4, 6, 1.2).toFixed(2));
    const amp = Number(clampValue(detail && detail.amp, 0, 1.8, 0.9).toFixed(2));
    const phi = Number(clampValue(detail && detail.phi, -3.14, 3.14, 0).toFixed(2));
    const payload = { freq, amp, phi };

    logComm("emit fourier:wave-sum-update", payload);
    socket.emit("fourier:wave-sum-update", payload);
  }

  function emitOceanRandomPack(detail) {
    if (state.mode !== "client" || !socket.connected || !state.joined) {
      return;
    }

    const items = normalizeOceanRandomItems(detail && detail.items);
    if (!items.length) {
      return;
    }

    const payload = { items };
    logComm("emit fourier:ocean-random-pack", payload);
    socket.emit("fourier:ocean-random-pack", payload);
  }

  function emitOceanRandomClear() {
    if (state.mode !== "teacher" || !socket.connected || !state.joined) {
      return;
    }

    logComm("emit fourier:ocean-random-clear", {});
    socket.emit("fourier:ocean-random-clear", {});
  }

  // Primary bridge from the presentation script (index.html):
  // index dispatches `fourier:sound-control-local-change` whenever sliders move.
  document.addEventListener("fourier:sound-control-local-change", (event) => {
    const detail = (event && event.detail) || {};
    emitSoundControl(detail, Boolean(detail.force));
  });

  // Primary bridge from the presentation script (index.html):
  // index dispatches `fourier:heat-control-local-change` whenever sliders move.
  document.addEventListener("fourier:heat-control-local-change", (event) => {
    emitHeatControl((event && event.detail) || {}, false);
  });

  // Teacher-only bridge for section 3.5 time slider.
  document.addEventListener("fourier:heat-time-local-change", (event) => {
    emitHeatTimeControl((event && event.detail) || {}, false);
  });

  document.addEventListener("fourier:fft-duel-start-local", () => {
    emitFftDuelStart();
  });

  document.addEventListener("fourier:fft-duel-reveal-local", () => {
    emitFftDuelReveal();
  });

  document.addEventListener("fourier:fft-duel-probe-local-change", (event) => {
    const detail = (event && event.detail) || {};
    emitFftDuelProbe(detail, Boolean(detail.force));
  });

  document.addEventListener("fourier:fft-duel-submit-local", (event) => {
    emitFftDuelSubmit((event && event.detail) || {});
  });

  document.addEventListener("fourier:ocean-random-pack-local", (event) => {
    emitOceanRandomPack((event && event.detail) || {});
  });

  document.addEventListener("fourier:ocean-random-pack-clear-local", () => {
    emitOceanRandomClear();
  });

  document.addEventListener("fourier:wave-sum-freq-local-change", (event) => {
    emitWaveSumUpdate((event && event.detail) || {});
  });

  // Fallback bridge: directly listen to slider DOM events in this sync file too.
  // This protects communication if the custom event dispatch is broken or removed.
  [studentSoundFrequencyInput, studentSoundAmplitudeInput].forEach((control) => {
    control?.addEventListener("input", () => {
      emitSoundControl(getLocalSoundControlFromDom(), false);
    });

    control?.addEventListener("change", () => {
      emitSoundControl(getLocalSoundControlFromDom(), true);
    });
  });

  // Fallback bridge for heat sliders.
  [heatStudentPositionInput, heatStudentTemperatureInput].forEach((control) => {
    control?.addEventListener("input", () => {
      emitHeatControl(getLocalHeatControlFromDom(), false);
    });

    control?.addEventListener("change", () => {
      emitHeatControl(getLocalHeatControlFromDom(), true);
    });
  });

  heatTimeSliderInput?.addEventListener("input", () => {
    emitHeatTimeControl(getLocalHeatTimeControlFromDom(), false);
  });

  heatTimeSliderInput?.addEventListener("change", () => {
    emitHeatTimeControl(getLocalHeatTimeControlFromDom(), true);
  });

  [fftDuelStartBtn, classFftDuelStartBtn].forEach((button) => {
    button?.addEventListener("click", () => {
      emitFftDuelStart();
    });
  });

  [fftDuelRevealBtn, classFftDuelRevealBtn].forEach((button) => {
    button?.addEventListener("click", () => {
      emitFftDuelReveal();
    });
  });

  fftDuelProbeInput?.addEventListener("change", () => {
    emitFftDuelProbe({ probeFreq: Number(fftDuelProbeInput.value) }, true);
  });

  fftDuelSubmitBtn?.addEventListener("click", () => {
    emitFftDuelSubmit({ guessFreq: Number(fftDuelProbeInput ? fftDuelProbeInput.value : 2) });
  });

  randomFreqGenerateBtn?.addEventListener("click", () => {
    // UI dispatches custom payload; here we keep fallback click wiring no-op.

  });

  randomFreqClearBtn?.addEventListener("click", () => {
    emitOceanRandomClear();
  });

  // Fallback bridge for wave-sum student slider.
  [waveSumStudentFreqInput, waveSumStudentAmpInput, waveSumStudentPhiInput].forEach((control) => {
    control?.addEventListener("input", () => {
      emitWaveSumUpdate({
        freq: Number(waveSumStudentFreqInput ? waveSumStudentFreqInput.value : 1.2),
        amp: Number(waveSumStudentAmpInput ? waveSumStudentAmpInput.value : 0.9),
        phi: Number(waveSumStudentPhiInput ? waveSumStudentPhiInput.value : 0),
      });
    });

    control?.addEventListener("change", () => {
      emitWaveSumUpdate({
        freq: Number(waveSumStudentFreqInput ? waveSumStudentFreqInput.value : 1.2),
        amp: Number(waveSumStudentAmpInput ? waveSumStudentAmpInput.value : 0.9),
        phi: Number(waveSumStudentPhiInput ? waveSumStudentPhiInput.value : 0),
      });
    });
  });

  function emitInteraction(control, eventType) {
    if (state.mode !== "client" || !state.joined || !socket.connected) {
      return;
    }

    const activityId = String(control.dataset.activityControl || "").trim();
    const controlId = String(control.dataset.controlKey || control.name || control.id || "control").trim();
    const section = control.closest(".section");
    const slideId = section && section.id ? section.id : state.activeSlideId;

    if (!activityId || !slideId) {
      return;
    }

    const throttleKey = `${activityId}:${controlId}`;
    const throttleMs = control.type === "range" && eventType === "input" ? 120 : 0;
    const now = Date.now();
    const lastSend = interactionThrottle.get(throttleKey) || 0;

    if (throttleMs > 0 && now - lastSend < throttleMs) {
      return;
    }

    interactionThrottle.set(throttleKey, now);
    socket.emit("fourier:interaction", {
      slideId,
      activityId,
      controlId,
      kind: eventType,
      value: extractControlValue(control),
    });
  }

  activityControls.forEach((control) => {
    control.addEventListener("input", (event) => {
      emitInteraction(event.currentTarget, "input");
    });

    control.addEventListener("change", (event) => {
      emitInteraction(event.currentTarget, "change");
    });
  });

  if (studentJoinBtn) {
    studentJoinBtn.addEventListener("click", () => {
      const name = normalizeName(studentNameInput ? studentNameInput.value : state.userName);
      const team = normalizeTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, name);
      requestJoin("client", name, team);
    });
  }

  if (studentNameInput) {
    studentNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const name = normalizeName(studentNameInput.value);
        const team = normalizeTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, name);
        requestJoin("client", name, team);
      }
    });
  }

  if (studentTeamInput) {
    studentTeamInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const name = normalizeName(studentNameInput ? studentNameInput.value : state.userName);
        const team = normalizeTeam(studentTeamInput.value, name);
        requestJoin("client", name, team);
      }
    });
  }

  if (classChatSendBtn) {
    classChatSendBtn.addEventListener("click", () => {
      sendChatMessage();
    });
  }

  if (classChatInputNode) {
    classChatInputNode.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
      }
    });
  }

  document.addEventListener("fourier:classroom-dock-toggle", (event) => {
    const isOpen = Boolean(event && event.detail && event.detail.open);
    if (isOpen) {
      clearUnreadChatCount();
    }
  });

  document.addEventListener("fourier:slide-changed", (event) => {
    const detail = (event && event.detail) || {};
    state.activeSlideIndex = Number.isInteger(detail.index) ? detail.index : state.activeSlideIndex;
    state.activeSlideId = String(detail.slideId || state.activeSlideId || "");

    if (state.mode !== "teacher" || !state.joined || !socket.connected) {
      updateMiniSummary();
      return;
    }

    if (detail.source === "remote") {
      updateMiniSummary();
      return;
    }

    const key = `${state.activeSlideIndex}:${state.activeSlideId}`;
    if (key === state.lastTeacherSlideKey) {
      updateMiniSummary();
      return;
    }

    state.lastTeacherSlideKey = key;
    socket.emit("fourier:set-slide", {
      slideIndex: state.activeSlideIndex,
      slideId: state.activeSlideId,
    });

    updateMiniSummary();
  });

  socket.on("connect", () => {
    // Transport connected. Next step is always to ensure classroom join.
    state.connected = true;
    state.joined = false;
    setConnectionState(true);
    logComm("socket connected", { id: socket.id, mode: state.mode });

    if (state.mode === "teacher" && !state.joinPayload) {
      requestJoin("teacher", state.userName || "Teacher", "Teacher");
    }

    if (state.joinPayload) {
      logComm("emit fourier:join on connect", state.joinPayload);
      socket.emit("fourier:join", state.joinPayload);
    } else if (state.mode === "client" && (pendingSoundControl || pendingHeatControl || pendingTaylorGuessLive || pendingTaylorGuessSubmit)) {
      const currentName = resolveClientName(studentNameInput ? studentNameInput.value : state.userName);
      const currentTeam = resolveClientTeam(studentTeamInput ? studentTeamInput.value : state.userTeam, currentName);
      requestJoin("client", currentName, currentTeam);
    }

    setChatHint("Συνδέθηκες. Μπορείς να στείλεις μήνυμα στην τάξη.");

    updateMiniSummary();
  });

  socket.on("disconnect", () => {
    logComm("socket disconnected", { mode: state.mode });
    state.connected = false;
    state.joined = false;
    state.participants = null;
    state.summary = null;
    applySoundStates([]);
    applyHeatStates([]);
    applyHeatTimeState(0);
    applyFftDuelState(null);
    applyOceanRandomState(null);
      applyTaylorGuessState(null);
    dispatchClassroomSummary(null);
    setConnectionState(false);
    setStudentJoined(false);
    setChatHint("Offline. Περιμένω επανασύνδεση...");
    refreshUi();
  });

  socket.on("fourier:state", (payload) => {
    // Snapshot received after join/reconnect.
    // This is where we confirm "joined" and flush any pending sound-control.
    logComm("recv fourier:state", payload);
    state.joined = true;
    state.userName = normalizeName(payload && payload.name, state.userName);
    state.userTeam = normalizeTeam(payload && payload.team, state.userTeam || state.userName);
    state.participants = payload && payload.participants ? payload.participants : state.participants;
    state.summary = payload && payload.summary ? payload.summary : state.summary;
    dispatchClassroomSummary(state.summary);

    if (state.mode === "client" && studentTeamInput) {
      studentTeamInput.value = state.userTeam;
    }

    if (state.mode === "client" && state.userName) {
      document.dispatchEvent(new CustomEvent("fourier:student-name-ready", { detail: { name: state.userName } }));
    }

    if (payload && Array.isArray(payload.soundStates)) {
      applySoundStates(payload.soundStates);
    } else if (payload && payload.summary && Array.isArray(payload.summary.soundStates)) {
      applySoundStates(payload.summary.soundStates);
    }

    if (payload && Array.isArray(payload.heatStates)) {
      applyHeatStates(payload.heatStates);
    } else if (payload && payload.summary && Array.isArray(payload.summary.heatStates)) {
      applyHeatStates(payload.summary.heatStates);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "heatTime")) {
      applyHeatTimeState(payload.heatTime);
    } else if (payload && payload.summary && Object.prototype.hasOwnProperty.call(payload.summary, "heatTime")) {
      applyHeatTimeState(payload.summary.heatTime);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "fftDuel")) {
      applyFftDuelState(payload.fftDuel);
    } else if (payload && payload.summary && Object.prototype.hasOwnProperty.call(payload.summary, "fftDuel")) {
      applyFftDuelState(payload.summary.fftDuel);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "oceanRandom")) {
      applyOceanRandomState(payload.oceanRandom);
    } else if (payload && payload.summary && Object.prototype.hasOwnProperty.call(payload.summary, "oceanRandom")) {
      applyOceanRandomState(payload.summary.oceanRandom);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "waveSum")) {
      applyWaveSumState(payload.waveSum);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "taylorGuess")) {
      applyTaylorGuessState(payload.taylorGuess);
    }

    if (payload && (payload.activeSlideId || Number.isInteger(payload.activeSlideIndex))) {
      applyRemoteSlide(payload);
    }

    if (payload && Array.isArray(payload.chatHistory)) {
      applyChatHistory(payload.chatHistory);
    }

    if (state.mode === "client") {
      setStudentJoined(true);
      emitSoundControl(pendingSoundControl || getLocalSoundControlFromDom(), true);
      pendingSoundControl = null;

      if (pendingHeatControl) {
        emitHeatControl(pendingHeatControl, true);
        pendingHeatControl = null;
      }

      if (pendingTaylorGuessLive) {
        emitTaylorGuessLive(pendingTaylorGuessLive, true);
        pendingTaylorGuessLive = null;
      }

      if (pendingTaylorGuessSubmit) {
        emitTaylorGuessSubmit(pendingTaylorGuessSubmit);
        pendingTaylorGuessSubmit = null;
      }
    } else if (state.mode === "teacher") {
      emitHeatControl(pendingHeatControl || getLocalHeatControlFromDom(), true);
      pendingHeatControl = null;
      emitHeatTimeControl(pendingHeatTimeControl || getLocalHeatTimeControlFromDom(), true);
      pendingHeatTimeControl = null;
    }

    if (pendingChatMessage) {
      if (emitChatMessageText(pendingChatMessage)) {
        pendingChatMessage = "";
        if (classChatInputNode) {
          classChatInputNode.value = "";
        }
        setChatHint("Το εκκρεμές μήνυμα στάλθηκε.");
      }
    }

    refreshUi();
  });

  socket.on("fourier:participants", (payload) => {
    logComm("recv fourier:participants", payload);
    state.participants = payload;
    if (state.summary) {
      state.summary.participants = payload;
    }
    refreshUi();
  });

  socket.on("fourier:summary", (payload) => {
    logComm("recv fourier:summary", payload);
    state.summary = payload;
    dispatchClassroomSummary(state.summary);

    if (payload && Array.isArray(payload.soundStates)) {
      applySoundStates(payload.soundStates);
    }

    if (payload && Array.isArray(payload.heatStates)) {
      applyHeatStates(payload.heatStates);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "heatTime")) {
      applyHeatTimeState(payload.heatTime);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "fftDuel")) {
      applyFftDuelState(payload.fftDuel);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "oceanRandom")) {
      applyOceanRandomState(payload.oceanRandom);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "taylorGuess")) {
      applyTaylorGuessState(payload.taylorGuess);
    }

    if (payload && (payload.activeSlideId || Number.isInteger(payload.activeSlideIndex))) {
      state.activeSlideId = payload.activeSlideId || state.activeSlideId;
      state.activeSlideIndex = Number.isInteger(payload.activeSlideIndex) ? payload.activeSlideIndex : state.activeSlideIndex;
    }

    refreshUi();
  });

  socket.on("fourier:sound-state", (payload) => {
    logComm("recv fourier:sound-state", payload);
    applySoundStates(payload && payload.soundStates);
    updateMiniSummary();
    renderConnectedUsersPanel();
  });

  socket.on("fourier:heat-state", (payload) => {
    logComm("recv fourier:heat-state", payload);
    applyHeatStates(payload && payload.heatStates);
    updateMiniSummary();
  });

  socket.on("fourier:heat-time-state", (payload) => {
    logComm("recv fourier:heat-time-state", payload);
    applyHeatTimeState(payload && payload.heatTime);
    updateMiniSummary();
  });

  socket.on("fourier:fft-duel-state", (payload) => {
    logComm("recv fourier:fft-duel-state", payload);
    applyFftDuelState(payload);
    updateMiniSummary();
  });

  socket.on("fourier:ocean-random-state", (payload) => {
    logComm("recv fourier:ocean-random-state", payload);
    applyOceanRandomState(payload);
    updateMiniSummary();
  });

  socket.on("fourier:wave-sum-state", (payload) => {
    logComm("recv fourier:wave-sum-state", payload);
    applyWaveSumState(payload);
    updateMiniSummary();
  });

  socket.on("fourier:taylor-guess-state", (payload) => {
    logComm("recv fourier:taylor-guess-state", payload);
    applyTaylorGuessState(payload);
    updateMiniSummary();
  });

  document.addEventListener("fourier:taylor-guess-reveal-local", () => {
    emitTaylorGuessReveal();
  });

  document.addEventListener("fourier:taylor-guess-submit-local", (event) => {
    emitTaylorGuessSubmit((event && event.detail) || {});
  });

  document.addEventListener("fourier:taylor-guess-live-local", (event) => {
    emitTaylorGuessLive((event && event.detail) || {});
  });

  socket.on("fourier:chat-history", (payload) => {
    logComm("recv fourier:chat-history", payload);
    applyChatHistory(payload && payload.messages);
  });

  socket.on("fourier:chat-message", (entry) => {
    logComm("recv fourier:chat-message", entry);
    const normalized = normalizeChatMessage(entry, `chat-live-${Date.now()}`);

    if (!normalized) {
      return;
    }

    if (!state.chatMessages.some((item) => item.id === normalized.id)) {
      state.chatMessages.push(normalized);
      if (state.chatMessages.length > 140) {
        state.chatMessages.splice(0, state.chatMessages.length - 140);
      }

      const ownMessage = isLikelyOwnChatMessage(normalized);
      const dockOpen = isClassroomDockOpen();
      if (!ownMessage && !dockOpen) {
        playIncomingChatTone();
        bumpUnreadChatCount();
      }
    }

    renderChatMessages();

    if (isClassroomDockOpen()) {
      clearUnreadChatCount();
    }
  });

  socket.on("connect_error", (error) => {
    const message = error && error.message ? error.message : String(error || "unknown");
    logComm("socket connect_error", {
      message,
    });

    setMiniMessage(`Realtime connect error: ${message}`);
    setChatHint(`Σφάλμα σύνδεσης realtime: ${message}`);
  });

  socket.on("fourier:slide", (payload) => {
    if (payload && (payload.activeSlideId || Number.isInteger(payload.activeSlideIndex))) {
      applyRemoteSlide(payload);
    }

    refreshUi();
  });

  socket.on("fourier:activity-event", (entry) => {
    if (!state.summary) {
      state.summary = {
        participants: state.participants || { teachers: 0, students: 0, roster: [] },
        activityBreakdown: [],
        recent: [],
      };
    }

    const recent = Array.isArray(state.summary.recent) ? state.summary.recent.slice() : [];
    recent.unshift(entry);
    state.summary.recent = recent.slice(0, 26);
    dispatchClassroomActivityEvent(entry);
    dispatchClassroomSummary(state.summary);
    updateFeeds();
    updateMiniSummary();
  });

  if (mode === "client" && wantsAutoConnect) {
    requestJoin("client", state.userName, state.userTeam);
  }
})();
