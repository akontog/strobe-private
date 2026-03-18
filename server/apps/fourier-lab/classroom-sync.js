(function initFourierClassroom() {
  const deck = window.fourierSlideDeck;
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode") === "teacher" ? "teacher" : "client";
  const requestedName = String(searchParams.get("name") || "").trim();
  const wantsAutoConnect = searchParams.get("autoconnect") === "1";
  const NAME_STORAGE_KEY = "strobeStudentConnectName";

  const roleLabelNode = document.getElementById("classRoleLabel");
  const connectionNode = document.getElementById("classConnectionState");
  const summaryMiniNode = document.getElementById("classSummaryMini");
  const studentNameInput = document.getElementById("classStudentNameInput");
  const studentJoinBtn = document.getElementById("classStudentJoinBtn");
  const studentNameRow = document.getElementById("studentNameRow");
  const copyStudentLinkBtn = document.getElementById("classCopyStudentLinkBtn");
  const copyHintNode = document.getElementById("classCopyHint");

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
    summary: null,
    participants: null,
    activeSlideId: deck && typeof deck.getCurrentSlideId === "function" ? deck.getCurrentSlideId() : "",
    activeSlideIndex: deck && typeof deck.getCurrentSlideIndex === "function" ? deck.getCurrentSlideIndex() : 0,
    lastTeacherSlideKey: "",
  };

  const interactionThrottle = new Map();

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

  function normalizeName(name, fallback = "") {
    const cleaned = String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);

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
      roleLabelNode.textContent = `Student: ${state.userName || "Connected"}`;
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

  function updateMiniSummary() {
    const participantPayload = getParticipantPayload();
    const teachers = toFiniteNumber(participantPayload.teachers);
    const students = toFiniteNumber(participantPayload.students);
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
      setMiniMessage(`Students: ${students} | Teachers: ${teachers} | Active slide: ${slideLabel}`);
    } else {
      setMiniMessage(`Following: ${slideLabel} | Online students: ${students}`);
    }
  }

  function refreshUi() {
    updateRoleLabel();
    updateMetrics();
    updateFeeds();
    updateMiniSummary();
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
    const url = new URL(window.location.href);
    url.searchParams.set("mode", "client");
    url.searchParams.delete("name");
    url.searchParams.delete("autoconnect");
    url.hash = "";
    return `${url.origin}${url.pathname}${url.search}`;
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
    const chosenName = normalizeName(requestedName, storedName);

    if (requestedName) {
      localStorage.setItem(NAME_STORAGE_KEY, chosenName);
    }

    if (studentNameInput) {
      studentNameInput.value = chosenName;
    }

    state.userName = chosenName;
  } else {
    state.userName = normalizeName(requestedName, "Teacher");
  }

  updateRoleLabel();
  setConnectionState(false);
  setStudentJoined(false);
  refreshUi();

  if (copyStudentLinkBtn) {
    copyStudentLinkBtn.addEventListener("click", async () => {
      const link = buildStudentLink();
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

  if (typeof window.io !== "function") {
    setMiniMessage("Socket.IO client is unavailable.");
    return;
  }

  const socket = window.io();

  function requestJoin(role, name) {
    const normalizedName = normalizeName(name, role === "teacher" ? "Teacher" : "");
    if (!normalizedName) {
      setMiniMessage("Name is required before joining.");
      return;
    }

    state.joinPayload = { role, name: normalizedName };
    state.userName = normalizedName;
    updateRoleLabel();

    if (role === "client") {
      localStorage.setItem(NAME_STORAGE_KEY, normalizedName);
    }

    if (socket.connected) {
      socket.emit("fourier:join", state.joinPayload);
    }
  }

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
      requestJoin("client", name);
    });
  }

  if (studentNameInput) {
    studentNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const name = normalizeName(studentNameInput.value);
        requestJoin("client", name);
      }
    });
  }

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
    state.connected = true;
    state.joined = false;
    setConnectionState(true);

    if (state.mode === "teacher" && !state.joinPayload) {
      requestJoin("teacher", state.userName || "Teacher");
    }

    if (state.joinPayload) {
      socket.emit("fourier:join", state.joinPayload);
    }

    updateMiniSummary();
  });

  socket.on("disconnect", () => {
    state.connected = false;
    state.joined = false;
    setConnectionState(false);
    setStudentJoined(false);
    updateMiniSummary();
  });

  socket.on("fourier:state", (payload) => {
    state.joined = true;
    state.userName = normalizeName(payload && payload.name, state.userName);
    state.participants = payload && payload.participants ? payload.participants : state.participants;
    state.summary = payload && payload.summary ? payload.summary : state.summary;

    if (payload && (payload.activeSlideId || Number.isInteger(payload.activeSlideIndex))) {
      applyRemoteSlide(payload);
    }

    if (state.mode === "client") {
      setStudentJoined(true);
    }

    refreshUi();
  });

  socket.on("fourier:participants", (payload) => {
    state.participants = payload;
    if (state.summary) {
      state.summary.participants = payload;
    }
    refreshUi();
  });

  socket.on("fourier:summary", (payload) => {
    state.summary = payload;

    if (payload && (payload.activeSlideId || Number.isInteger(payload.activeSlideIndex))) {
      state.activeSlideId = payload.activeSlideId || state.activeSlideId;
      state.activeSlideIndex = Number.isInteger(payload.activeSlideIndex) ? payload.activeSlideIndex : state.activeSlideIndex;
    }

    refreshUi();
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
    updateFeeds();
    updateMiniSummary();
  });

  if (mode === "client" && wantsAutoConnect) {
    requestJoin("client", state.userName);
  }
})();
