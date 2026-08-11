import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CameraSpeedTest.css';

function pushBounded(list, value, max = 40) {
  if (!Number.isFinite(value)) {
    return;
  }
  list.push(value);
  if (list.length > max) {
    list.splice(0, list.length - max);
  }
}

function average(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  return list.reduce((acc, cur) => acc + cur, 0) / list.length;
}

function fpsFromStamps(stamps) {
  const now = performance.now();
  const windowMs = 1500;
  const fresh = stamps.filter((ts) => now - ts <= windowMs);
  stamps.splice(0, stamps.length, ...fresh);
  return fresh.length * (1000 / windowMs);
}

function loadRealtimeSocketScript() {
  if (window.createRealtimeSocket) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tool="realtime-socket"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load realtime socket script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/js/realtime-socket.js';
    script.async = true;
    script.dataset.tool = 'realtime-socket';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load realtime socket script.'));
    document.body.appendChild(script);
  });
}

export default function CameraSpeedTest() {
  const captureCanvasRef = useRef(null);
  const trackedCanvasRef = useRef(null);
  const videoRef = useRef(null);
  const runtimeRef = useRef({
    socket: null,
    stream: null,
    running: false,
    inFlight: false,
    requestSeq: 0,
    sendTimer: null,
    rafId: null,
    pendingAt: new Map(),
    receiveTimestamps: [],
    sendTimestamps: [],
    rttSamples: [],
    serverSamples: [],
    trackedDrawToken: 0
  });

  const [sendFps, setSendFps] = useState(8);
  const [jpegQuality, setJpegQuality] = useState(0.65);
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState('Idle');
  const [trackingBackend, setTrackingBackend] = useState('-');
  const [boxesCount, setBoxesCount] = useState(0);
  const [rttAvg, setRttAvg] = useState('-');
  const [serverAvg, setServerAvg] = useState('-');
  const [sendFpsOut, setSendFpsOut] = useState('0.0');
  const [recvFpsOut, setRecvFpsOut] = useState('0.0');
  const [errorText, setErrorText] = useState('');

  const statusClassName = useMemo(() => (errorText ? 'tool-error' : 'tool-status'), [errorText]);

  function updateStats() {
    const state = runtimeRef.current;
    const avgRtt = average(state.rttSamples);
    const avgServer = average(state.serverSamples);
    setRttAvg(avgRtt == null ? '-' : `${avgRtt.toFixed(1)} ms`);
    setServerAvg(avgServer == null ? '-' : `${avgServer.toFixed(1)} ms`);
    setSendFpsOut(fpsFromStamps(state.sendTimestamps).toFixed(1));
    setRecvFpsOut(fpsFromStamps(state.receiveTimestamps).toFixed(1));
  }

  function getSendIntervalMs() {
    const fps = Math.max(1, Math.min(30, Number(sendFps) || 8));
    return Math.round(1000 / fps);
  }

  function getJpegQuality() {
    const value = Number(jpegQuality);
    if (!Number.isFinite(value)) {
      return 0.65;
    }
    return Math.max(0.2, Math.min(0.95, value));
  }

  function resizeCanvases() {
    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    const trackedCanvas = trackedCanvasRef.current;
    if (!video || !captureCanvas || !trackedCanvas) {
      return;
    }

    const vw = Math.max(320, video.videoWidth || 960);
    const vh = Math.max(180, video.videoHeight || 540);
    captureCanvas.width = vw;
    captureCanvas.height = vh;
    trackedCanvas.width = vw;
    trackedCanvas.height = vh;
  }

  function drawCaptureLoop() {
    const state = runtimeRef.current;
    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    if (!state.running || !video || !captureCanvas) {
      return;
    }

    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    state.rafId = requestAnimationFrame(drawCaptureLoop);
  }

  function drawAnnotatedFrame(imageBase64) {
    const trackedCanvas = trackedCanvasRef.current;
    if (!trackedCanvas || !imageBase64) {
      return;
    }

    const ctx = trackedCanvas.getContext('2d');
    const token = ++runtimeRef.current.trackedDrawToken;
    const image = new Image();
    image.onload = () => {
      if (token !== runtimeRef.current.trackedDrawToken) {
        return;
      }
      ctx.drawImage(image, 0, 0, trackedCanvas.width, trackedCanvas.height);
    };
    image.src = `data:image/jpeg;base64,${imageBase64}`;
  }

  function sendFrame() {
    const state = runtimeRef.current;
    const captureCanvas = captureCanvasRef.current;
    if (!state.running || !state.socket || !state.socket.connected || state.inFlight || !captureCanvas) {
      return;
    }

    if (!captureCanvas.width || !captureCanvas.height) {
      return;
    }

    const quality = getJpegQuality();
    const dataUrl = captureCanvas.toDataURL('image/jpeg', quality);
    const imageBase64 = dataUrl.split(',')[1];
    const requestId = ++state.requestSeq;

    state.inFlight = true;
    const sentPerfNow = performance.now();
    state.pendingAt.set(requestId, sentPerfNow);
    state.sendTimestamps.push(sentPerfNow);

    state.socket.emit('camera-speed-frame', {
      requestId,
      image: imageBase64,
      clientSentAt: Date.now()
    });

    updateStats();
  }

  function startSendLoop() {
    const state = runtimeRef.current;
    clearInterval(state.sendTimer);
    state.sendTimer = setInterval(sendFrame, getSendIntervalMs());
  }

  function stopTracks() {
    const state = runtimeRef.current;
    if (!state.stream) {
      return;
    }
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }

  function stopTest() {
    const state = runtimeRef.current;
    state.running = false;
    state.inFlight = false;
    state.pendingAt.clear();

    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    clearInterval(state.sendTimer);
    state.sendTimer = null;

    stopTracks();

    const captureCanvas = captureCanvasRef.current;
    const trackedCanvas = trackedCanvasRef.current;
    if (captureCanvas) {
      captureCanvas.getContext('2d').clearRect(0, 0, captureCanvas.width, captureCanvas.height);
    }
    if (trackedCanvas) {
      trackedCanvas.getContext('2d').clearRect(0, 0, trackedCanvas.width, trackedCanvas.height);
    }

    setRunning(false);
    setStatusText('Stopped');
  }

  async function ensureSocket() {
    const state = runtimeRef.current;
    if (state.socket) {
      return;
    }

    await loadRealtimeSocketScript();

    if (!window.createRealtimeSocket) {
      throw new Error('createRealtimeSocket is unavailable.');
    }

    state.socket = window.createRealtimeSocket({ autoConnect: true, reconnect: true });

    state.socket.on('connect', () => {
      setStatusText('Realtime connected');
      setErrorText('');
    });

    state.socket.on('disconnect', () => {
      setStatusText('Realtime disconnected');
    });

    state.socket.on('camera-speed-result', (payload) => {
      const requestId = payload && payload.requestId;
      const sentAt = state.pendingAt.get(requestId);
      if (typeof sentAt === 'number') {
        const rtt = performance.now() - sentAt;
        pushBounded(state.rttSamples, rtt);
      }
      state.pendingAt.delete(requestId);

      state.inFlight = false;
      state.receiveTimestamps.push(performance.now());
      pushBounded(state.serverSamples, Number(payload && payload.serverElapsedMs));

      setTrackingBackend((payload && payload.tracking) || '-');
      setBoxesCount(Array.isArray(payload && payload.boxes) ? payload.boxes.length : 0);

      if (payload && typeof payload.annotatedImage === 'string') {
        drawAnnotatedFrame(payload.annotatedImage);
      }

      updateStats();
    });
  }

  async function startTest() {
    if (runtimeRef.current.running) {
      return;
    }

    try {
      await ensureSocket();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      });

      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element is unavailable.');
      }

      const state = runtimeRef.current;
      state.stream = stream;
      video.srcObject = stream;
      await video.play();

      resizeCanvases();
      state.running = true;
      state.inFlight = false;
      state.pendingAt.clear();
      state.receiveTimestamps.length = 0;
      state.sendTimestamps.length = 0;
      state.rttSamples.length = 0;
      state.serverSamples.length = 0;

      setBoxesCount(0);
      setRunning(true);
      setStatusText('Streaming test started');
      setErrorText('');

      drawCaptureLoop();
      startSendLoop();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Camera permission denied or unavailable.');
      setStatusText('Cannot start test');
    }
  }

  useEffect(() => {
    if (runtimeRef.current.running) {
      startSendLoop();
    }
  }, [sendFps]);

  useEffect(() => {
    return () => {
      stopTest();
      const state = runtimeRef.current;
      if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
      }
    };
  }, []);

  return (
    <section className="tool-page camera-speed-test-page">
      <header className="tool-page-header">
        <h1>Camera Speed Test</h1>
        <p>Raw camera frame vs server-tracked frame (DeepSORT).</p>
      </header>

      <div className="tool-controls-row">
        <button type="button" className="tool-btn tool-btn--primary" onClick={startTest} disabled={running}>Start Test</button>
        <button type="button" className="tool-btn tool-btn--danger" onClick={stopTest} disabled={!running}>Stop Test</button>

        <label>
          Send FPS
          <input type="number" min="1" max="30" step="1" value={sendFps} onChange={(event) => setSendFps(Number(event.target.value))} />
        </label>

        <label>
          JPEG quality
          <input type="number" min="0.2" max="0.95" step="0.05" value={jpegQuality} onChange={(event) => setJpegQuality(Number(event.target.value))} />
        </label>

        <div className={statusClassName}>{errorText || statusText}</div>
      </div>

      <div className="tool-stats-grid">
        <div className="tool-stat"><span>Tracking Backend</span><strong>{trackingBackend}</strong></div>
        <div className="tool-stat"><span>Round Trip (avg)</span><strong>{rttAvg}</strong></div>
        <div className="tool-stat"><span>Server Proc (avg)</span><strong>{serverAvg}</strong></div>
        <div className="tool-stat"><span>Send FPS</span><strong>{sendFpsOut}</strong></div>
        <div className="tool-stat"><span>Response FPS</span><strong>{recvFpsOut}</strong></div>
        <div className="tool-stat"><span>Tracked Boxes</span><strong>{boxesCount}</strong></div>
      </div>

      <div className="camera-canvas-grid">
        <article className="tool-card">
          <h2>Camera Capture (client)</h2>
          <canvas ref={captureCanvasRef} width={960} height={540} />
        </article>
        <article className="tool-card">
          <h2>Tracked Frame (server response)</h2>
          <canvas ref={trackedCanvasRef} width={960} height={540} />
        </article>
      </div>

      <video ref={videoRef} autoPlay playsInline muted hidden />
    </section>
  );
}