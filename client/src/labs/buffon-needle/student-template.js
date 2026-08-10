export const studentTemplate = String.raw`<div style="text-align:center">
  <h1>Προσέγγιση του π</h1>
  <div class="subtitle">Η βελόνα του Buffon</div>
</div>

<!-- Team name -->
<div class="team-bar">
  <div class="conn-dot" id="conn-dot"></div>
  <label>ΟΜΑΔΑ</label>
  <input type="text" id="team-input" placeholder="Δώστε το όνομα της ομάδας σας" maxlength="30">
  <button onclick="registerTeam()">Σύνδεση</button>
</div>

<div class="round-banner waiting" id="round-banner">Περιμένετε την έναρξη.</div>

<!-- Canvas row -->
<div class="canvas-row">
  <div class="vspinner">
    <div class="lbl">l<br>Μήκος<br>βελόνας</div>
    <button class="spin-btn" onclick="changeL(5)">+</button>
    <div class="val" id="val-l" style="color:#a78bfa">50</div>
    <button class="spin-btn" onclick="changeL(-5)">−</button>
    <input type="range" id="range-l" min="10" max="120" value="50"
      style="accent-color:#a78bfa" oninput="setL(+this.value)">
    <div class="range-labels">10–120</div>
  </div>

  <div class="canvas-stage">
    <canvas id="sim" width="480" height="280"></canvas>
    <div class="canvas-footer">
      <span><span style="color:#ef4444">━</span> hit</span>
      <span><span style="color:#22c55e">━</span> miss</span>
      <span id="ratio-badge"></span>
    </div>
  </div>

  <div class="vspinner">
    <div class="lbl">d<br>Απόσταση<br>γραμμών</div>
    <button class="spin-btn" onclick="changeD(5)">+</button>
    <div class="val" id="val-d" style="color:#38bdf8">60</div>
    <button class="spin-btn" onclick="changeD(-5)">−</button>
    <input type="range" id="range-d" min="30" max="150" value="60"
      style="accent-color:#38bdf8" oninput="setD(+this.value)">
    <div class="range-labels">30–150</div>
  </div>
</div>

<!-- Controls -->
<div class="panel">
  <div class="run-controls">
    <div class="step-inline">
      <div class="step-col">
        <div class="lbl">Βελόνες ανά βήμα</div>
        <div class="step-row">
          <button class="spin-btn" onclick="changeStep(-1)">−</button>
          <div class="step-val" id="step-val">1</div>
          <button class="spin-btn" onclick="changeStep(1)">+</button>
        </div>
        <input type="range" class="hrange" id="range-step" min="1" max="100" value="1"
          oninput="setStep(+this.value)">
      </div>
    </div>
    <button class="btn btn-primary" id="step-btn" onclick="doStep()">▶ +1 βελόνα</button>
    <div class="auto-switch-wrap">
      <span class="auto-lbl">AUTO</span>
      <label class="switch">
        <input type="checkbox" id="auto-toggle" onchange="toggleAutoDrop(this.checked)">
        <span class="slider"></span>
      </label>
      <span class="auto-rate">0.1s</span>
    </div>
    <button class="btn btn-danger" onclick="resetAll()">↺ Reset</button>
  </div>
</div>

<!-- Stats -->
<div class="stats-row">
  <div class="stat-box">
    <div class="s-lbl">\(\hat{\pi}\)</div>
    <div class="s-val" id="s-pi" style="color:#34d399">—</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">ΣΦΑΛΜΑ</div>
    <div class="s-val" id="s-err" style="color:#fbbf24">—</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">HITS</div>
    <div class="s-val" id="s-hits" style="color:#f87171">0</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">MISS</div>
    <div class="s-val" id="s-miss" style="color:#22c55e">0</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">ΒΕΛΟΝΕΣ</div>
    <div class="s-val" id="s-drops">0</div>
  </div>
</div>

<!-- Formula collapsible -->
<div class="chart-wrap">
  <div class="chart-header" onclick="toggleFormula()">
    <span class="c-lbl">ΤΥΠΟΣ</span>
    <span class="chart-toggle" id="formula-arrow">▼</span>
  </div>
  <div class="chart-body" id="formula-body">
    <div style="text-align:center;font-size:13px;line-height:2;padding:4px 0 8px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
        <span style="color:#a78bfa">\(\hat{\pi}\)</span>
        <span style="color:#64748b">\(\approx\)</span>
        <span>
          <div style="border-bottom:1px solid #94a3b8;padding-bottom:2px;text-align:center;">
            <span style="color:#38bdf8">2</span><span style="color:#64748b"> · </span>
            <span style="color:#a78bfa">l</span><span style="color:#64748b"> · </span>
            <span style="color:#e2e8f0">N</span>
          </div>
          <div style="padding-top:2px;text-align:center;">
            <span style="color:#38bdf8">d</span><span style="color:#64748b"> · </span>
            <span style="color:#f87171">H</span>
          </div>
        </span>
        <span style="color:#64748b">=</span>
        <span>
          <div style="border-bottom:1px solid #94a3b8;padding-bottom:2px;text-align:center;">
            <span style="color:#38bdf8">2</span><span style="color:#64748b"> · </span>
            <span style="color:#a78bfa" id="f-l">50</span><span style="color:#64748b"> · </span>
            <span style="color:#e2e8f0" id="f-n">0</span>
          </div>
          <div style="padding-top:2px;text-align:center;">
            <span style="color:#38bdf8" id="f-d">60</span><span style="color:#64748b"> · </span>
            <span style="color:#f87171" id="f-h">0</span>
          </div>
        </span>
        <span style="color:#64748b">=</span>
        <span style="color:#34d399;font-weight:700;font-size:16px;" id="f-result">—</span>
      </div>
    </div>
  </div>
</div>

<!-- Chart collapsible -->
<div class="chart-wrap">
  <div class="chart-header" onclick="toggleChart()">
    <span class="c-lbl">ΣΥΓΚΛΙΣΗ ΠΡΟΣ π</span>
    <span class="chart-toggle" id="chart-arrow">▼</span>
  </div>
  <div class="chart-body" id="chart-body">
    <canvas id="chart-cv"></canvas>
  </div>
</div>`;
