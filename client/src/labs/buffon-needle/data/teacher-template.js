export const teacherTemplate = String.raw`<div style="text-align:center">
  <h1>Η βελόνα του Buffon</h1>
  <div class="subtitle"></div>
</div>

<div class="chart-wrap">
  <div class="chart-header" onclick="toggleJoinQr()">
    <span class="c-lbl">ΣΥΝΔΕΣΗ ΜΑΘΗΤΩΝ</span>
    <span class="chart-toggle open" id="join-qr-arrow">▼</span>
  </div>
  <div class="chart-body open" id="join-qr-body">
    <div class="join-box">
      <div class="join-copy">
        <div class="join-help">Σαρώστε το QR για να ανοίξετε την εφαρμογή.</div>
        <div class="join-help"><a href="/labs/buffon-needle/student" target="_blank" rel="noopener noreferrer">Άνοιγμα student σε νέα καρτέλα</a></div>
      </div>
      <img class="join-qr" src="qrcode.png" alt="QR code για student.html">
    </div>
  </div>
</div>

<div class="round-panel">
  <div class="round-grid">
    <div class="round-control">
      <div class="lbl">ΧΡΟΝΟΣ ΓΥΡΟΥ</div>
      <div class="val" id="round-time-value">60 sec</div>
      <input type="range" id="round-time-slider" min="20" max="120" step="1" value="60" oninput="updateRoundControlLabels()">
      <div class="scale"><span>20 sec</span><span>120 sec</span></div>
    </div>
    <div class="round-control">
      <div class="lbl">ΣΤΟΧΟΣ ΣΦΑΛΜΑΤΟΣ</div>
      <div class="val" id="round-target-value">0.005</div>
      <input type="range" class="target-slider" id="round-target-slider" min="1" max="10" step="1" value="5" oninput="updateRoundControlLabels()">
      <div class="scale"><span>0.010</span><span>0.001</span></div>
    </div>
  </div>

  <div class="round-actions">
    <button class="round-start" id="round-start-btn" onclick="startRoundFromTeacher()">ΕΝΑΡΞΗ ΓΥΡΟΥ</button>
    <button class="round-stop" id="round-stop-btn" onclick="stopRoundManually()" disabled>ΧΕΙΡΟΚΙΝΗΤΟ STOP</button>
    <button class="round-reset" id="round-reset-btn" onclick="resetTournamentScores()">ΣΥΝΟΛΙΚΟ RESET</button>
    <div class="round-meta">
      <span id="round-info">Γύρος: —</span>
      <span class="round-timer" id="round-timer">—</span>
    </div>
  </div>

  <div class="round-status" id="round-status">Πάτησε «ΕΝΑΡΞΗ ΓΥΡΟΥ» για νέο παιχνίδι.</div>
  <div class="round-status round-result" id="round-result">—</div>
</div>

<div class="chart-wrap">
  <div class="chart-header" onclick="toggleLiveBoard()">
    <span class="c-lbl">ΤΡΕΧΟΥΣΑ ΒΑΘΜΟΛΟΓΙΑ (LIVE)</span>
    <span class="chart-toggle open" id="live-board-arrow">▼</span>
  </div>
  <div class="chart-body open" id="live-board-wrap">
    <div class="board">
      <div class="board-header live-board-header">
        <span>#</span>
        <span>ΟΜΑΔΑ</span>
        <span>\(\hat{\pi}\)</span>
        <span>ΣΦΑΛΜΑ</span>
        <span>ΒΕΛΟΝΕΣ</span>
        <span>HITS</span>
        <span>MISS</span>
      </div>
      <div class="board-body" id="live-board-body">
        <div class="empty">Καμία ομάδα δεν είναι συνδεδεμένη ακόμα...</div>
      </div>
    </div>
  </div>
</div>

<div class="chart-wrap">
  <div class="chart-header" onclick="toggleTotalBoard()">
    <span class="c-lbl">ΣΥΝΟΛΙΚΗ ΒΑΘΜΟΛΟΓΙΑ</span>
    <span class="chart-toggle open" id="total-board-arrow">▼</span>
  </div>
  <div class="chart-body open" id="total-board-wrap">
    <div class="board">
      <div class="board-header score-board-header">
        <span>#</span>
        <span>ΟΜΑΔΑ</span>
        <span>ΓΥΡΟΣ</span>
        <span>ΣΥΝΟΛΟ</span>
      </div>
      <div class="board-body" id="total-board-body">
        <div class="empty">Καμία ομάδα δεν είναι συνδεδεμένη ακόμα...</div>
      </div>
    </div>
  </div>
</div>

<div class="chart-wrap">
  <div class="chart-header" onclick="toggleTeacherChart()">
    <span class="c-lbl">ΣΥΓΚΛΙΣΗ ΟΜΑΔΩΝ ΠΡΟΣ \(\pi\)</span>
    <span class="chart-toggle open" id="teacher-chart-arrow">▼</span>
  </div>
  <div class="chart-body open" id="teacher-chart-body">
    <canvas id="teacher-chart-cv"></canvas>
  </div>
</div>`;
