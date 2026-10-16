import{r as jt,w as Ht,a as Lt,u as Wt,j as ct,H as qt,F as Yt,C as Ot}from"./index-6R8kP5xB.js";const Xt=String.raw`<div class="connection-status" id="connection-status" role="status" aria-live="polite"></div>

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
<div class="panel lab-card">
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
<div class="stats-row lab-card">
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
<div class="accordion chart-wrap" data-accordion-id="student-formula">
  <button type="button" class="accordion-btn chart-header" aria-expanded="false">
    <span class="c-lbl">ΤΥΠΟΣ</span>
    <span class="accordion-icon" id="formula-arrow">+</span>
  </button>
  <div class="accordion-content chart-body" id="formula-body">
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
<div class="accordion chart-wrap" data-accordion-id="student-chart">
  <button type="button" class="accordion-btn chart-header" aria-expanded="false">
    <span class="c-lbl">ΣΥΓΚΛΙΣΗ ΠΡΟΣ π</span>
    <span class="accordion-icon" id="chart-arrow">+</span>
  </button>
  <div class="accordion-content chart-body" id="chart-body">
    <canvas id="chart-cv"></canvas>
  </div>
</div>`,zt=String.raw`<div class="round-panel lab-card">
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

<div class="accordion chart-wrap" data-accordion-id="teacher-live-board">
  <button type="button" class="accordion-btn chart-header" aria-expanded="true">
    <span class="c-lbl">ΤΡΕΧΟΥΣΑ ΒΑΘΜΟΛΟΓΙΑ (LIVE)</span>
    <span class="accordion-icon" id="live-board-arrow">−</span>
  </button>
  <div class="accordion-content chart-body open" id="live-board-wrap">
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

<div class="accordion chart-wrap" data-accordion-id="teacher-total-board">
  <button type="button" class="accordion-btn chart-header" aria-expanded="true">
    <span class="c-lbl">ΣΥΝΟΛΙΚΗ ΒΑΘΜΟΛΟΓΙΑ</span>
    <span class="accordion-icon" id="total-board-arrow">−</span>
  </button>
  <div class="accordion-content chart-body open" id="total-board-wrap">
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

<div class="accordion chart-wrap" data-accordion-id="teacher-chart">
  <button type="button" class="accordion-btn chart-header" aria-expanded="true">
    <span class="c-lbl">ΣΥΓΚΛΙΣΗ ΟΜΑΔΩΝ ΠΡΟΣ \(\pi\)</span>
    <span class="accordion-icon" id="teacher-chart-arrow">−</span>
  </button>
  <div class="accordion-content chart-body open" id="teacher-chart-body">
    <canvas id="teacher-chart-cv"></canvas>
  </div>
</div>`;function Nt(y,r){if(!y)return()=>{};const L=S=>{const f=S.target.closest(".accordion-btn");if(!f||!y.contains(f))return;const T=f.closest(".accordion"),d=T&&T.querySelector(".accordion-content");if(!d)return;const w=f.getAttribute("aria-expanded")!=="true";f.setAttribute("aria-expanded",String(w)),d.classList.toggle("open",w);const x=f.querySelector(".accordion-icon");x&&(x.textContent=w?"−":"+"),typeof r=="function"&&r(T.dataset.accordionId,w)};return y.addEventListener("click",L),()=>y.removeEventListener("click",L)}function Kt(y,r){const L=Nt(y,(t,l)=>{t==="student-chart"&&l&&a()}),S=1.5,f=5,T=document.getElementById("sim"),d=T.getContext("2d"),w=T.width,x=T.height,D=document.getElementById("chart-cv"),o=D.getContext("2d");let g=50,m=60,W=1,N=0,$=0,F=[],X="",k=null,_=!1,G=!1,dt=null,z=!1,n=!1,ut=0,tt=null,Q=0,st=null;const pt=new URLSearchParams(window.location.search),ft=(pt.get("team")||pt.get("name")||"").trim();function V(){const t=jt("Student");return X=(ft||t||"Student").trim(),ft&&Ht(ft),X}function wt(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){_=!1,j();return}if(k){k.start();return}k=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){_=!0;const t=V();K({type:"register_student",team:t}),G=!0,z=!0,U(r("student.connected"),"waiting"),A(),j()},onMessage(t,l){if(t==="round_start"){It(l);return}if(t==="round_end"){Tt(l);return}t==="reset_tournament"&&Bt(l)},onClose(){_=!1,G=!1,z=!1,n=!1,q(),et(),U(r("student.disconnected"),"waiting"),j()},onError(){_=!1,j()}}),k.start()}function K(t){if(!k||!t||typeof t!="object"||typeof t.type!="string"||!t.type.trim())return!1;const l=t.type,u={...t};return delete u.type,k.send(l,u)}function Et(){if(X=V(),!k||!k.isConnected()){wt();return}K({type:"register_student",team:X}),G=!0,z=!0,U(r("student.connected"),"waiting"),j(),A()}function A(){if(!k||!k.isConnected()||!X||!G)return;const t=$>0?2*g*N/(m*$):null;K({type:"update",drops:N,hits:$,piEst:t?parseFloat(t.toFixed(5)):null})}function j(){const t=document.getElementById("connection-status");if(!t)return;const l=_&&G;t.textContent=r(l?"student.connected":"student.connecting"),t.classList.toggle("connected",l)}function Z(t,l,u){return Math.max(l,Math.min(u,t))}function U(t,l){const u=document.getElementById("round-banner");u.textContent=t,u.classList.remove("waiting","active","ended"),l==="active"?u.classList.add("active"):l==="ended"?u.classList.add("ended"):u.classList.add("waiting")}function et(){st!==null&&(clearInterval(st),st=null)}function mt(){const t=Math.max(0,Math.ceil((Q-Date.now())/1e3));U(r("student.roundBanner",{round:ut,target:Number.isFinite(tt)?tt.toFixed(3):r("targetError"),seconds:t}),"active")}function Mt(){et(),mt(),st=setInterval(()=>{if(!n){et();return}mt()},250)}function St(t){const l=Z(Number.parseInt(t.needleL,10)||50,10,120),u=Z(Number.parseInt(t.lineD,10)||60,30,150),p=Z(Number.parseInt(t.stepN,10)||1,1,1e3);g=l,m=u,document.getElementById("val-l").textContent=g,document.getElementById("range-l").value=g,document.getElementById("val-d").textContent=m,document.getElementById("range-d").value=m,c(p),q(),document.getElementById("auto-toggle").checked=!1,s()}function It(t){z=!0,n=!0,ut=Number.parseInt(t.round,10)||ut+1||1;const l=Number.parseFloat(t.targetError);tt=Number.isFinite(l)?Z(l,.001,.01):null;const u=Number.parseInt(t.endAt,10);if(Number.isFinite(u)&&u>Date.now())Q=u;else{const p=Number.parseInt(t.timeSec,10),B=Z(Number.isInteger(p)?p:60,20,120);Q=Date.now()+B*1e3}St(t.defaults||{}),Mt()}function Tt(t){z=!0,n=!1,Q=0,q(),document.getElementById("auto-toggle").checked=!1,et();const l=t.reason==="target_reached"?"student.targetReached":t.reason==="manual_stop"?"student.manualStop":"student.roundEnd",u=[r(l)];t.winnerTeam&&u.push(r("student.winner",{team:t.winnerTeam}));const p=Array.isArray(t.rankings)?t.rankings.slice(0,3).map(B=>`${B.rank}:${B.team}`).join(" | "):"";p&&u.push(r("student.podium",{ranking:p})),U(u.join(" "),"ended")}function Bt(t){z=!0,n=!1,ut=0,tt=null,Q=0,q(),document.getElementById("auto-toggle").checked=!1,et();const l=t&&t.defaults?t.defaults:{};St(l),U(r("student.tournamentReset"),"waiting")}function rt(){return z?n:!0}function ot(){d.clearRect(0,0,w,x),d.strokeStyle="#94a3b8",d.lineWidth=1.5;for(let t=0;t<=w;t+=m)d.beginPath(),d.moveTo(t,0),d.lineTo(t,x),d.stroke()}function vt(){const t=g/2,l=8,u=(J,lt,nt)=>Math.max(lt,Math.min(nt,J)),p=t+l,B=w-t-l,O=t+l,it=x-t-l,ht=Math.round(w*.5/m)*m,at=u(ht,p,B),bt=u(x*.35,O,it);let Y=at+m*.5;Y>B&&(Y=at-m*.5),Y=u(Y,p,B);const xt=u(x*.68,O,it);function P(J,lt,nt,At){const $t=J-t*Math.cos(nt),Dt=J+t*Math.cos(nt),Ft=lt-t*Math.sin(nt),_t=lt+t*Math.sin(nt);d.save(),d.beginPath(),d.setLineDash([8,5]),d.lineCap="round",d.strokeStyle=At,d.lineWidth=3.2,d.shadowColor=At,d.shadowBlur=5,d.moveTo($t,Ft),d.lineTo(Dt,_t),d.stroke(),d.restore()}P(at,bt,0,"rgba(239,68,68,0.98)"),P(Y,xt,Math.PI/2,"rgba(34,197,94,0.98)")}function gt(t){N===0&&ot();for(let u=0;u<t;u++){const p=Math.random()*w,B=Math.random()*x,O=Math.random()*Math.PI,it=p-g/2*Math.cos(O),ht=p+g/2*Math.cos(O),at=B-g/2*Math.sin(O),bt=B+g/2*Math.sin(O),Y=Math.floor(it/m)!==Math.floor(ht/m);Y&&$++,N++,d.beginPath(),d.strokeStyle=Y?"rgba(220,38,38,0.78)":"rgba(22,163,74,0.72)",d.lineWidth=2,d.moveTo(it,at),d.lineTo(ht,bt),d.stroke()}const l=$>0?2*g*N/(m*$):null;if(l&&F.push({n:N,pi:parseFloat(l.toFixed(5))}),F.length>500){const u=Math.ceil(F.length/500);F=F.filter((p,B)=>B%u===0)}e(l),a(),A()}function kt(){rt()&&gt(W)}function q(){dt!==null&&(clearInterval(dt),dt=null)}function Ct(){rt()&&(q(),dt=setInterval(()=>{gt(W)},100))}function yt(t){if(t&&!rt()){document.getElementById("auto-toggle").checked=!1;return}t?Ct():q()}function e(t){document.getElementById("s-drops").textContent=N.toLocaleString(),document.getElementById("s-hits").textContent=$.toLocaleString(),document.getElementById("s-miss").textContent=(N-$).toLocaleString(),document.getElementById("s-pi").textContent=t?t.toFixed(5):"β€”",document.getElementById("s-err").textContent=t?Math.abs(t-Math.PI).toFixed(6):"β€”",document.getElementById("f-l").textContent=g,document.getElementById("f-d").textContent=m,document.getElementById("f-n").textContent=N.toLocaleString(),document.getElementById("f-h").textContent=$.toLocaleString(),document.getElementById("f-result").textContent=t?t.toFixed(4):"β€”";const l=(g/m).toFixed(2),u=g<=m;document.getElementById("ratio-badge").innerHTML=`<span style="color:${u?"#34d399":"#fbbf24"}">l/d=${l} ${u?"β“":"β "}</span>`}function a(){const t=document.getElementById("chart-body");if(!t.classList.contains("open"))return;const l=t.clientWidth-4,u=148;D.width=l,D.height=u;const p={top:8,right:18,bottom:28,left:38},B=l-p.left-p.right,O=u-p.top-p.bottom;o.clearRect(0,0,l,u),o.fillStyle="#141720",o.beginPath(),o.roundRect(0,0,l,u,6),o.fill();const it=Math.max(10,N),ht=0,at=it,bt=P=>p.left+(P-ht)/at*B,Y=P=>p.top+(1-(P-S)/(f-S))*O;o.save(),o.beginPath(),o.rect(p.left,p.top,B,O),o.clip(),o.strokeStyle="#2d3348",o.lineWidth=.8,o.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach(P=>{o.beginPath(),o.moveTo(p.left,Y(P)),o.lineTo(p.left+B,Y(P)),o.stroke()});const xt=Y(Math.PI);o.strokeStyle="#fbbf24",o.lineWidth=1.2,o.setLineDash([4,4]),o.beginPath(),o.moveTo(p.left,xt),o.lineTo(p.left+B,xt),o.stroke(),o.setLineDash([]),F.length>=1&&(o.strokeStyle="#34d399",o.lineWidth=1.5,o.beginPath(),F.forEach((P,J)=>{const lt=bt(P.n),nt=Y(P.pi);J===0?o.moveTo(lt,nt):o.lineTo(lt,nt)}),o.stroke()),o.restore(),o.fillStyle="#fbbf24",o.font="9px Courier New",o.textAlign="left",o.fillText("Ο€",p.left+B+3,xt+3),o.strokeStyle="#475569",o.lineWidth=1,o.beginPath(),o.moveTo(p.left,p.top),o.lineTo(p.left,p.top+O),o.lineTo(p.left+B,p.top+O),o.stroke(),o.fillStyle="#475569",o.font="9px Courier New",o.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach(P=>o.fillText(P.toFixed(1),p.left-4,Y(P)+3)),o.textAlign="center";for(let P=0;P<=5;P++){const J=Math.round(at*P/5);o.fillText(J>=1e3?`${Math.round(J/1e3)}k`:J,bt(J),p.top+O+14)}o.fillText(r("drops"),p.left+B/2,u-4)}function s(){N=0,$=0,F=[],ot(),vt(),e(null),a(),A()}function i(t){g=Math.min(120,Math.max(10,t)),document.getElementById("val-l").textContent=g,document.getElementById("range-l").value=g,document.getElementById("f-l").textContent=g,s()}function b(t){i(g+t)}function M(t){m=Math.min(150,Math.max(30,t)),document.getElementById("val-d").textContent=m,document.getElementById("range-d").value=m,document.getElementById("f-d").textContent=m,s()}function I(t){M(m+t)}function c(t){W=Math.min(1e3,Math.max(1,t)),document.getElementById("step-val").textContent=W,document.getElementById("range-step").value=W,document.getElementById("step-btn").textContent=r("student.stepButton",{count:W})}function E(t){c(W+t)}function v(){V(),U(r("student.freeExperiment"),"waiting"),wt(),j(),c(W),ot(),vt(),e(null)}const C=t=>{const l=t?.detail?.name?.trim();l&&(X=l,G=!1,z=!1,k&&k.isConnected()?Et():j())};window.addEventListener("strobe:identity-change",C);const R=()=>{j(),c(W),n?mt():_&&G?U(r("student.connected"),"waiting"):_||U(r("student.disconnected"),"waiting")};window.StrobeI18n?.on("languageChanged",R);const H=()=>{q(),et()};window.addEventListener("beforeunload",H),v();const h={registerTeam:Et,changeL:b,setL:i,changeD:I,setD:M,changeStep:E,setStep:c,doStep:kt,toggleAutoDrop:yt,resetAll:s};return Object.assign(window,h),()=>{L(),q(),et(),window.removeEventListener("beforeunload",H),window.removeEventListener("strobe:identity-change",C),window.StrobeI18n?.off("languageChanged",R),k&&typeof k.stop=="function"&&k.stop(),Object.keys(h).forEach(t=>{window[t]===h[t]&&delete window[t]})}}function Ut(y,r){const L=Nt(y,(e,a)=>{e==="teacher-chart"&&a&&q()});let S=null,f=[],T=new Map,d=new Map,w=[],x=new Map,D=new Map,o=new Map,g=0,m=!1,W=0,N=null,$=!1,F="",X="",k=new Map;const _={timeSec:60,targetError:.005},G=1.5,dt=5,z=document.getElementById("teacher-chart-cv"),n=z.getContext("2d");function ut(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){K(r("needApi"),"ended");return}if(S){S.start();return}S=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){tt({type:"register_teacher"}),K(r("teacherConnected"),m?"active":"idle")},onMessage(e,a){e==="roster"&&(f=Array.isArray(a&&a.students)?a.students:[],ot())},onClose(){K(r("student.disconnected"),"ended")}}),S.start()}function tt(e){if(!(!S||!e||typeof e!="object")&&typeof e.type=="string"&&e.type.trim()){const a=e.type,s={...e};delete s.type,S.send(a,s)}}function Q(){const e=document.getElementById("round-start-btn"),a=document.getElementById("round-stop-btn");e&&(e.disabled=m),a&&(a.disabled=!m)}function st(e){const a=Number.parseInt(e,10),s=Number.isInteger(a)?a:5;return Math.max(.001,Math.min(.01,s/1e3))}function pt(){const e=document.getElementById("round-time-slider"),a=document.getElementById("round-target-slider"),s=Number.parseInt(e.value,10)||60,i=st(a.value);document.getElementById("round-time-value").textContent=`${s} ${r("seconds")}`,document.getElementById("round-target-value").textContent=i.toFixed(3)}function ft(){const e=document.getElementById("round-timer");if(!m){e.textContent="β€”";return}const a=Math.max(0,Math.ceil((W-Date.now())/1e3));e.textContent=`${a} ${r("seconds")}`}function V(){N!==null&&(clearInterval(N),N=null)}function wt(){V(),ft(),N=setInterval(()=>{if(!m){V();return}if(Date.now()>=W){rt("time_up");return}ft()},200)}function K(e,a){const s=document.getElementById("round-status");s.textContent=e,s.classList.remove("active","ended"),a==="active"&&s.classList.add("active"),a==="ended"&&s.classList.add("ended")}function Et(e){return e===1?12:e===2?10:Math.max(1,11-e)}function A(e){return String(e&&e.team||"")}function j(e){return typeof e.piEst=="number"&&Number.isFinite(e.piEst)}function Z(e){return j(e)?Math.abs(e.piEst-Math.PI):null}function U(e){return[...e].sort((a,s)=>{const i=j(a),b=j(s);if(i!==b)return i?-1:1;const M=i?Math.abs(a.piEst-Math.PI):1/0,I=b?Math.abs(s.piEst-Math.PI):1/0;if(M!==I)return M-I;const c=typeof a.drops=="number"?a.drops:0,E=typeof s.drops=="number"?s.drops:0;return c!==E?E-c:String(a.team||"").localeCompare(String(s.team||""),"el")})}function et(e){return[...e].sort((a,s)=>{const i=A(a),b=A(s),M=D.get(i)||0,I=D.get(b)||0;if(M!==I)return I-M;const c=o.get(i)||0,E=o.get(b)||0;if(c!==E)return E-c;const v=Z(a),C=Z(s),R=v===null?1/0:v,H=C===null?1/0:C;return R!==H?R-H:String(a.team||"").localeCompare(String(s.team||""),"el")})}function mt(e){if(!F)return e;const a=e.findIndex(s=>A(s)===F);return a<=0?e:[e[a],...e.slice(0,a),...e.slice(a+1)]}function Mt(e){if(!m||$)return;const a=Date.now();if(e.forEach(i=>{const b=A(i);if(!b||k.has(b))return;const M=Z(i);M!==null&&M<=_.targetError&&k.set(b,a)}),k.size===0)return;const[s]=[...k.entries()].sort((i,b)=>i[1]-b[1]);s&&(F=s[0],$=!0,setTimeout(()=>rt("target_reached"),0))}function St(){return mt(U(f))}function It(){if(m)return;const e=Number.parseInt(document.getElementById("round-time-slider").value,10)||60,a=st(document.getElementById("round-target-slider").value);V(),m=!0,$=!1,g+=1,W=Date.now()+e*1e3,_.timeSec=Math.max(20,Math.min(120,e)),_.targetError=Math.max(.001,Math.min(.01,a)),F="",X="",o=new Map,k.clear(),T=new Map,d=new Map,w=[],x=new Map,f=f.map(s=>({...s,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=r("roundStartedInfo",{round:g,target:_.targetError.toFixed(3)}),document.getElementById("round-result").textContent=r("scoresReset"),K(r("roundStarted",{round:g}),"active"),Q(),ot(),wt(),tt({type:"start_round",round:g,timeSec:_.timeSec,targetError:_.targetError})}function Tt(){m&&rt("manual_stop",{awardPoints:!0})}function Bt(){V(),m=!1,$=!1,W=0,g=0,F="",X="",k.clear(),T=new Map,d=new Map,w=[],x=new Map,D=new Map,o=new Map,f=f.map(e=>({...e,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=`${r("round")}: -`,document.getElementById("round-result").textContent=r("scoresReset"),document.getElementById("round-timer").textContent="β€”",K(r("tournamentReset"),"ended"),Q(),tt({type:"reset_tournament"}),ot()}function rt(e,a={}){if(!m)return;const s=a.awardPoints!==!1;m=!1,$=!1,V();const i=St();o=new Map;const b=i.map((c,E)=>{const v=A(c);if(!v)return null;const C=E+1,R=s?Et(C):0;if(o.set(v,R),s){const H=(D.get(v)||0)+R;D.set(v,H)}return{rank:C,team:v,points:R,error:Z(c)}}).filter(Boolean);X=b.length?b[0].team:"";const M=r(e==="target_reached"?"student.targetReached":e==="manual_stop"?"student.manualStop":"student.roundEnd"),I=b.slice(0,3).map(c=>`${c.rank}. ${c.team} (+${c.points})`).join(" | ");document.getElementById("round-info").textContent=r("roundCompletedInfo",{round:g}),document.getElementById("round-result").textContent=I||r("noResults"),K(M,"ended"),document.getElementById("round-timer").textContent=`0 ${r("seconds")}`,Q(),tt({type:"end_round",round:g,reason:e,winnerTeam:X,targetError:_.targetError,rankings:b}),k.clear(),F="",T=new Map,d=new Map,ot()}function ot(){const e=document.getElementById("live-board-body"),a=document.getElementById("total-board-body");if(f.length===0){e.innerHTML=`<div class="empty">${r("noTeams")}</div>`,a.innerHTML=`<div class="empty">${r("noTeams")}</div>`,w=[],T=new Map,d=new Map,x.clear(),q();return}const s=U(f);m&&Mt(s);const i=m?mt(s):s,b=et(f),M=new Map;i.forEach((c,E)=>{const v=A(c),C=T.has(v)?T.get(v):null;M.set(v,C===null?null:C-E)});const I=new Map;b.forEach((c,E)=>{const v=A(c),C=d.has(v)?d.get(v):null;I.set(v,C===null?null:C-E)}),e.innerHTML=i.map((c,E)=>{const v=A(c),C=M.get(v),R=j(c),H=R?Math.abs(c.piEst-Math.PI).toFixed(6):"β€”",h=R?c.piEst.toFixed(5):"β€”",t=Math.max(0,(c.drops||0)-(c.hits||0));return`
      <div class="board-row live-board-row${R?C>0?" rank-up":C<0?" rank-down":"":" pending"}">
        <span class="rank" style="color:${R?gt(E):"#64748b"}">${E+1}</span>
        <span class="team-name">${vt(c.team)}</span>
        <span class="pi-val">${h}</span>
        <span class="err-val">${H}</span>
        <span class="drops-val">${(c.drops||0).toLocaleString()}</span>
        <span class="hits-val">${(c.hits||0).toLocaleString()}</span>
        <span class="miss-val">${t.toLocaleString()}</span>
      </div>`}).join(""),a.innerHTML=b.map((c,E)=>{const v=A(c),C=I.get(v),R=m?"β€”":g>0?(o.get(v)||0).toLocaleString():"β€”",H=(D.get(v)||0).toLocaleString();return`
      <div class="board-row score-board-row${C>0?" rank-up":C<0?" rank-down":""}${!m&&v&&v===X?" round-winner":""}">
        <span class="rank" style="color:#60a5fa">${E+1}</span>
        <span class="team-name">${vt(c.team)}</span>
        <span class="round-points-val">${R}</span>
        <span class="total-points-val">${H}</span>
      </div>`}).join(""),w=i,kt(i),q(),T=new Map(i.map((c,E)=>[A(c),E])),d=new Map(b.map((c,E)=>[A(c),E]))}function vt(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function gt(e){const a=["#fbbf24","#94a3b8","#cd7c3a","#3b82f6","#a78bfa","#f87171","#34d399","#f97316","#38bdf8","#e879f9"];return a[e%a.length]}function kt(e){const a=new Set(e.map(A));for(const s of Array.from(x.keys()))a.has(s)||x.delete(s);e.forEach(s=>{const i=A(s),b=typeof s.drops=="number"?s.drops:0;if(b<=0){x.set(i,[]);return}if(!j(s))return;const M=s.piEst,I=x.get(i)||[],c=I[I.length-1];if(!c||b>c.n||Math.abs(M-c.pi)>1e-12)if(I.push({n:b,pi:M}),I.length>500){const E=Math.ceil(I.length/500);x.set(i,I.filter((v,C)=>C%E===0))}else x.set(i,I)})}function q(){const e=document.getElementById("teacher-chart-body");if(!e.classList.contains("open"))return;const a=Math.max(340,e.clientWidth-4),s=172;z.width=a,z.height=s;const i={top:10,right:18,bottom:30,left:40},b=a-i.left-i.right,M=s-i.top-i.bottom;n.clearRect(0,0,a,s),n.fillStyle="#141720",n.beginPath(),n.roundRect(0,0,a,s,6),n.fill();const I=w.filter(j).map((h,t)=>{const l=A(h),u=(x.get(l)||[]).filter(p=>p.n>0);return{rank:t+1,team:String(h.team||""),color:gt(t),points:u}}).filter(h=>h.points.length>0);if(!I.length){n.fillStyle="#64748b",n.font="12px Courier New",n.textAlign="center",n.fillText(r("noEstimates"),a/2,s/2);return}let c=10;I.forEach(h=>{h.points.forEach(t=>{t.n>c&&(c=t.n)})});const E=h=>i.left+h/c*b,v=h=>i.top+(1-(h-G)/(dt-G))*M;n.save(),n.beginPath(),n.rect(i.left,i.top,b,M),n.clip(),n.strokeStyle="#2d3348",n.lineWidth=.8,n.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach(h=>{n.beginPath(),n.moveTo(i.left,v(h)),n.lineTo(i.left+b,v(h)),n.stroke()});const C=v(Math.PI);n.strokeStyle="#fbbf24",n.lineWidth=1.2,n.setLineDash([4,4]),n.beginPath(),n.moveTo(i.left,C),n.lineTo(i.left+b,C),n.stroke(),n.setLineDash([]),I.forEach(h=>{n.strokeStyle=h.color,n.lineWidth=1.6,n.beginPath(),h.points.forEach((l,u)=>{const p=E(l.n),B=v(l.pi);u===0?n.moveTo(p,B):n.lineTo(p,B)}),n.stroke();const t=h.points[h.points.length-1];n.fillStyle=h.color,n.beginPath(),n.arc(E(t.n),v(t.pi),2.8,0,Math.PI*2),n.fill()}),n.restore(),n.fillStyle="#fbbf24",n.font="9px Courier New",n.textAlign="left",n.fillText("Ο€",i.left+b+3,C+3),n.strokeStyle="#475569",n.lineWidth=1,n.beginPath(),n.moveTo(i.left,i.top),n.lineTo(i.left,i.top+M),n.lineTo(i.left+b,i.top+M),n.stroke(),n.fillStyle="#475569",n.font="9px Courier New",n.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach(h=>{n.fillText(h.toFixed(1),i.left-4,v(h)+3)}),n.textAlign="center";for(let h=0;h<=5;h++){const t=Math.round(c*h/5),l=t>=1e3?`${Math.round(t/1e3)}k`:t;n.fillText(l,E(t),i.top+M+14)}n.fillText(r("drops"),i.left+b/2,s-4);let R=i.left,H=i.top+12;n.font="9px Courier New",n.textAlign="left",I.slice(0,8).forEach(h=>{n.fillStyle=h.color,n.fillRect(R,H-7,8,8),n.fillStyle="#94a3b8",n.fillText(`#${h.rank} ${h.team}`,R+12,H),H+=12})}pt(),Q(),K(r("initialTeacherStatus"),"idle");const Ct=()=>{K(m?r("roundStarted",{round:g}):S?.isConnected()?r("teacherConnected"):r("student.disconnected"),m?"active":"idle"),pt()};window.StrobeI18n?.on("languageChanged",Ct),ut(),window.addEventListener("resize",q);const yt={startRoundFromTeacher:It,stopRoundManually:Tt,resetTournamentScores:Bt,updateRoundControlLabels:pt};return Object.assign(window,yt),()=>{L(),V(),S&&typeof S.stop=="function"&&S.stop(),window.removeEventListener("resize",q),window.StrobeI18n?.off("languageChanged",Ct),Object.keys(yt).forEach(e=>{window[e]===yt[e]&&delete window[e]})}}function Gt({role:y="teacher"}){const r=Lt.useRef(null),{t:L}=Wt("buffon");return Lt.useEffect(()=>{const S=r.current;if(!S)return;y==="student"?S.innerHTML=Xt:S.innerHTML=zt,Rt(S,y,L,!0);const f=y==="student"?Kt(S,Pt):Ut(S,Pt);return window.MathJax&&typeof window.MathJax.typesetPromise=="function"&&window.MathJax.typesetPromise([S]).catch(()=>{}),()=>{typeof f=="function"&&f(),S.innerHTML=""}},[y]),Lt.useEffect(()=>{r.current&&Rt(r.current,y,L)},[y,L]),ct.jsxs("div",{className:`lab-shell buffon-app ${y}`,children:[ct.jsx("header",{className:"lab-header",children:ct.jsx(qt,{title:L(y==="student"?"studentTitle":"teacherTitle")})}),ct.jsxs("section",{className:"common-zone lab-zone buffon-zone",children:[ct.jsx(Yt,{}),ct.jsx("div",{ref:r,className:`buffon-content ${y}`})]}),ct.jsx(Ot,{})]})}function Rt(y,r,L,S=!1){const f=(T,d,w)=>{const x=y.querySelector(T);x&&(x.textContent=L(d,w))};if(r==="student"){S&&f(".round-banner","student.waiting"),f(".vspinner:first-child .lbl","student.needleLength"),f(".vspinner:last-child .lbl","student.lineSpacing"),f(".step-col .lbl","student.stepLabel");const T=Number.parseInt(y.querySelector("#step-val")?.textContent,10)||1;f("#step-btn","student.stepButton",{count:T}),f(".auto-lbl","student.automatic"),f(".btn-danger","student.reset");const d=y.querySelectorAll(".vspinner .range-labels");d[0]&&(d[0].textContent="10-120"),d[1]&&(d[1].textContent="30-150"),f('[data-accordion-id="student-formula"] .c-lbl',"student.formula"),f('[data-accordion-id="student-chart"] .c-lbl',"student.chart");const w=y.querySelectorAll(".canvas-footer > span");w[0]&&(w[0].textContent=L("student.hit")),w[1]&&(w[1].textContent=L("student.miss"));const x=y.querySelectorAll(".stat-box .s-lbl");["student.estimateError","hits","misses","drops"].forEach((D,o)=>{x[o+1]&&(x[o+1].textContent=L(D))})}else{const T=y.querySelectorAll(".round-control .lbl");T[0]&&(T[0].textContent=L("roundDuration")),T[1]&&(T[1].textContent=L("targetError"));const d=L("seconds");y.querySelectorAll(".round-control .scale span").forEach(w=>{w.textContent=w.textContent.replace(/\s*sec$/,` ${d}`)}),f("#round-start-btn","startRound"),f("#round-stop-btn","stopRound"),f("#round-reset-btn","resetScores"),S&&(f("#round-status","initialTeacherStatus"),f("#round-info","round")),f('[data-accordion-id="teacher-live-board"] .c-lbl',"liveBoard"),f('[data-accordion-id="teacher-total-board"] .c-lbl',"totalBoard"),f('[data-accordion-id="teacher-chart"] .c-lbl',"student.chart"),y.querySelectorAll(".board-header").forEach((w,x)=>{const D=x===0?["","team","estimate","error","drops","hits","misses"]:x===1?["","team","round","total"]:[];w.querySelectorAll("span").forEach((o,g)=>{D[g]&&(o.textContent=L(D[g]))})})}}function Pt(y,r={}){return window.StrobeI18n.t(y,{ns:"buffon",...r})}export{Gt as A};
