export const teacherSettingsTemplate = String.raw`<div class="round-panel lab-card">
  <div class="round-grid">
    <div class="round-control">
      <div class="lbl">ΔΙΑΡΚΕΙΑ ΓΥΡΟΥ</div>
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
    <button class="round-stop" id="round-stop-btn" onclick="stopRoundManually()" disabled>ΔΙΑΚΟΠΗ</button>
    <button class="round-reset" id="round-reset-btn" onclick="resetTournamentScores()">ΜΗΔΕΝΙΣΜΟΣ</button>
    <div class="round-meta">
      <span id="round-info">Γύρος: -</span>
      <span class="round-timer" id="round-timer">-</span>
    </div>
  </div>

  <div class="round-status" id="round-status">Πάτησε «Έναρξη γύρου» για νέο παιχνίδι.</div>
  <div class="round-status round-result" id="round-result">-</div>
</div>`;
