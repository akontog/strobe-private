import{r as _t,w as Ht,a as Tt,u as Wt,R as qt,j as z,H as Yt,F as Ot,S as Xt,C as zt}from"./index-BqtIiEk8.js";import{S as Kt}from"./StudentTable-D2zNiGTV.js";const Ut=String.raw`<div class="connection-status" id="connection-status" role="status" aria-live="polite"></div>

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
</div>`,Jt=String.raw`<div class="round-panel lab-card">
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
</div>

<div class="accordion chart-wrap" data-accordion-id="teacher-chart">
  <button type="button" class="accordion-btn chart-header" aria-expanded="true">
    <span class="c-lbl">ΣΥΓΚΛΙΣΗ ΟΜΑΔΩΝ ΠΡΟΣ π</span>
    <span class="accordion-icon" id="teacher-chart-arrow">⌄</span>
  </button>
  <div class="accordion-content chart-body open" id="teacher-chart-body">
    <canvas id="teacher-chart-cv"></canvas>
  </div>
</div>`;function Nt(v,i){if(!v)return()=>{};const R=C=>{const k=C.target.closest(".accordion-btn");if(!k||!v.contains(k))return;const h=k.closest(".accordion"),n=h&&h.querySelector(".accordion-content");if(!n)return;const y=k.getAttribute("aria-expanded")!=="true";k.setAttribute("aria-expanded",String(y)),n.classList.toggle("open",y);const E=k.querySelector(".accordion-icon");E&&(E.textContent=y?"−":"+"),typeof i=="function"&&i(h.dataset.accordionId,y)};return v.addEventListener("click",R),()=>v.removeEventListener("click",R)}function Gt(v,i){const R=Nt(v,(t,a)=>{t==="student-chart"&&a&&e()}),C=1.5,k=5,h=document.getElementById("sim"),n=h.getContext("2d"),y=h.width,E=h.height,P=document.getElementById("chart-cv"),r=P.getContext("2d");let x=50,b=60,w=1,D=0,j=0,W=[],O="",A=null,_=!1,H=!1,st=null,G=!1,K=!1,o=0,pt=null,Q=0,tt=null;const bt=new URLSearchParams(window.location.search),at=(bt.get("team")||bt.get("name")||"").trim();function ft(){const t=_t("Student");return O=(at||t||"Student").trim(),at&&Ht(at),O}function et(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){_=!1,L();return}if(A){A.start();return}A=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){_=!0;const t=ft();vt({type:"register_student",team:t}),H=!0,G=!0,q(i("student.connected"),"waiting"),mt(),L()},onMessage(t,a){if(t==="round_start"){kt(a);return}if(t==="round_end"){Lt(a);return}t==="reset_tournament"&&Bt(a)},onClose(){_=!1,H=!1,G=!1,K=!1,Z(),V(),q(i("student.disconnected"),"waiting"),L()},onError(){_=!1,L()}}),A.start()}function vt(t){if(!A||!t||typeof t!="object"||typeof t.type!="string"||!t.type.trim())return!1;const a=t.type,d={...t};return delete d.type,A.send(a,d)}function U(){if(O=ft(),!A||!A.isConnected()){et();return}vt({type:"register_student",team:O}),H=!0,G=!0,q(i("student.connected"),"waiting"),L(),mt()}function mt(){if(!A||!A.isConnected()||!O||!H)return;const t=j>0?2*x*D/(b*j):null;vt({type:"update",drops:D,hits:j,piEst:t?parseFloat(t.toFixed(5)):null})}function L(){const t=document.getElementById("connection-status");if(!t)return;const a=_&&H;t.textContent=i(a?"student.connected":"student.connecting"),t.classList.toggle("connected",a)}function X(t,a,d){return Math.max(a,Math.min(d,t))}function q(t,a){const d=document.getElementById("round-banner");d.textContent=t,d.classList.remove("waiting","active","ended"),a==="active"?d.classList.add("active"):a==="ended"?d.classList.add("ended"):d.classList.add("waiting")}function V(){tt!==null&&(clearInterval(tt),tt=null)}function yt(){const t=Math.max(0,Math.ceil((Q-Date.now())/1e3));q(i("student.roundBanner",{round:o,target:Number.isFinite(pt)?pt.toFixed(3):i("targetError"),seconds:t}),"active")}function Et(){V(),yt(),tt=setInterval(()=>{if(!K){V();return}yt()},250)}function Mt(t){const a=X(Number.parseInt(t.needleL,10)||50,10,120),d=X(Number.parseInt(t.lineD,10)||60,30,150),p=X(Number.parseInt(t.stepN,10)||1,1,1e3);x=a,b=d,document.getElementById("val-l").textContent=x,document.getElementById("range-l").value=x,document.getElementById("val-d").textContent=b,document.getElementById("range-d").value=b,S(p),Z(),document.getElementById("auto-toggle").checked=!1,s()}function kt(t){G=!0,K=!0,o=Number.parseInt(t.round,10)||o+1||1;const a=Number.parseFloat(t.targetError);pt=Number.isFinite(a)?X(a,.001,.01):null;const d=Number.parseInt(t.endAt,10);if(Number.isFinite(d)&&d>Date.now())Q=d;else{const p=Number.parseInt(t.timeSec,10),T=X(Number.isInteger(p)?p:60,20,120);Q=Date.now()+T*1e3}Mt(t.defaults||{}),Et()}function Lt(t){G=!0,K=!1,Q=0,Z(),document.getElementById("auto-toggle").checked=!1,V();const a=t.reason==="target_reached"?"student.targetReached":t.reason==="manual_stop"?"student.manualStop":"student.roundEnd",d=[i(a)];t.winnerTeam&&d.push(i("student.winner",{team:t.winnerTeam}));const p=Array.isArray(t.rankings)?t.rankings.slice(0,3).map(T=>`${T.rank}:${T.team}`).join(" | "):"";p&&d.push(i("student.podium",{ranking:p})),q(d.join(" "),"ended")}function Bt(t){G=!0,K=!1,o=0,pt=null,Q=0,Z(),document.getElementById("auto-toggle").checked=!1,V();const a=t&&t.defaults?t.defaults:{};Mt(a),q(i("student.tournamentReset"),"waiting")}function xt(){return G?K:!0}function rt(){n.clearRect(0,0,y,E),n.strokeStyle="#94a3b8",n.lineWidth=1.5;for(let t=0;t<=y;t+=b)n.beginPath(),n.moveTo(t,0),n.lineTo(t,E),n.stroke()}function it(){const t=x/2,a=8,d=(J,ut,nt)=>Math.max(ut,Math.min(nt,J)),p=t+a,T=y-t-a,F=t+a,dt=E-t-a,ht=Math.round(y*.5/b)*b,ot=d(ht,p,T),gt=d(E*.35,F,dt);let Y=ot+b*.5;Y>T&&(Y=ot-b*.5),Y=d(Y,p,T);const St=d(E*.68,F,dt);function $(J,ut,nt,Rt){const $t=J-t*Math.cos(nt),Dt=J+t*Math.cos(nt),Ft=ut-t*Math.sin(nt),jt=ut+t*Math.sin(nt);n.save(),n.beginPath(),n.setLineDash([8,5]),n.lineCap="round",n.strokeStyle=Rt,n.lineWidth=3.2,n.shadowColor=Rt,n.shadowBlur=5,n.moveTo($t,Ft),n.lineTo(Dt,jt),n.stroke(),n.restore()}$(ot,gt,0,"rgba(239,68,68,0.98)"),$(Y,St,Math.PI/2,"rgba(34,197,94,0.98)")}function wt(t){D===0&&rt();for(let d=0;d<t;d++){const p=Math.random()*y,T=Math.random()*E,F=Math.random()*Math.PI,dt=p-x/2*Math.cos(F),ht=p+x/2*Math.cos(F),ot=T-x/2*Math.sin(F),gt=T+x/2*Math.sin(F),Y=Math.floor(dt/b)!==Math.floor(ht/b);Y&&j++,D++,n.beginPath(),n.strokeStyle=Y?"rgba(220,38,38,0.78)":"rgba(22,163,74,0.72)",n.lineWidth=2,n.moveTo(dt,ot),n.lineTo(ht,gt),n.stroke()}const a=j>0?2*x*D/(b*j):null;if(a&&W.push({n:D,pi:parseFloat(a.toFixed(5))}),W.length>500){const d=Math.ceil(W.length/500);W=W.filter((p,T)=>T%d===0)}ct(a),e(),mt()}function Ct(){xt()&&wt(w)}function Z(){st!==null&&(clearInterval(st),st=null)}function lt(){xt()&&(Z(),st=setInterval(()=>{wt(w)},100))}function It(t){if(t&&!xt()){document.getElementById("auto-toggle").checked=!1;return}t?lt():Z()}function ct(t){document.getElementById("s-drops").textContent=D.toLocaleString(),document.getElementById("s-hits").textContent=j.toLocaleString(),document.getElementById("s-miss").textContent=(D-j).toLocaleString(),document.getElementById("s-pi").textContent=t?t.toFixed(5):"β€”",document.getElementById("s-err").textContent=t?Math.abs(t-Math.PI).toFixed(6):"β€”",document.getElementById("f-l").textContent=x,document.getElementById("f-d").textContent=b,document.getElementById("f-n").textContent=D.toLocaleString(),document.getElementById("f-h").textContent=j.toLocaleString(),document.getElementById("f-result").textContent=t?t.toFixed(4):"β€”";const a=(x/b).toFixed(2),d=x<=b;document.getElementById("ratio-badge").innerHTML=`<span style="color:${d?"#34d399":"#fbbf24"}">l/d=${a} ${d?"β“":"β "}</span>`}function e(){const t=document.getElementById("chart-body");if(!t.classList.contains("open"))return;const a=t.clientWidth-4,d=148;P.width=a,P.height=d;const p={top:8,right:18,bottom:28,left:38},T=a-p.left-p.right,F=d-p.top-p.bottom;r.clearRect(0,0,a,d),r.fillStyle="#141720",r.beginPath(),r.roundRect(0,0,a,d,6),r.fill();const dt=Math.max(10,D),ht=0,ot=dt,gt=$=>p.left+($-ht)/ot*T,Y=$=>p.top+(1-($-C)/(k-C))*F;r.save(),r.beginPath(),r.rect(p.left,p.top,T,F),r.clip(),r.strokeStyle="#2d3348",r.lineWidth=.8,r.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach($=>{r.beginPath(),r.moveTo(p.left,Y($)),r.lineTo(p.left+T,Y($)),r.stroke()});const St=Y(Math.PI);r.strokeStyle="#fbbf24",r.lineWidth=1.2,r.setLineDash([4,4]),r.beginPath(),r.moveTo(p.left,St),r.lineTo(p.left+T,St),r.stroke(),r.setLineDash([]),W.length>=1&&(r.strokeStyle="#34d399",r.lineWidth=1.5,r.beginPath(),W.forEach(($,J)=>{const ut=gt($.n),nt=Y($.pi);J===0?r.moveTo(ut,nt):r.lineTo(ut,nt)}),r.stroke()),r.restore(),r.fillStyle="#fbbf24",r.font="9px Courier New",r.textAlign="left",r.fillText("Ο€",p.left+T+3,St+3),r.strokeStyle="#475569",r.lineWidth=1,r.beginPath(),r.moveTo(p.left,p.top),r.lineTo(p.left,p.top+F),r.lineTo(p.left+T,p.top+F),r.stroke(),r.fillStyle="#475569",r.font="9px Courier New",r.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach($=>r.fillText($.toFixed(1),p.left-4,Y($)+3)),r.textAlign="center";for(let $=0;$<=5;$++){const J=Math.round(ot*$/5);r.fillText(J>=1e3?`${Math.round(J/1e3)}k`:J,gt(J),p.top+F+14)}r.fillText(i("drops"),p.left+T/2,d-4)}function s(){D=0,j=0,W=[],rt(),it(),ct(null),e(),mt()}function l(t){x=Math.min(120,Math.max(10,t)),document.getElementById("val-l").textContent=x,document.getElementById("range-l").value=x,document.getElementById("f-l").textContent=x,s()}function c(t){l(x+t)}function f(t){b=Math.min(150,Math.max(30,t)),document.getElementById("val-d").textContent=b,document.getElementById("range-d").value=b,document.getElementById("f-d").textContent=b,s()}function B(t){f(b+t)}function S(t){w=Math.min(1e3,Math.max(1,t)),document.getElementById("step-val").textContent=w,document.getElementById("range-step").value=w,document.getElementById("step-btn").textContent=i("student.stepButton",{count:w})}function I(t){S(w+t)}function u(){ft(),q(i("student.freeExperiment"),"waiting"),et(),L(),S(w),rt(),it(),ct(null)}const m=t=>{const a=t?.detail?.name?.trim();a&&(O=a,H=!1,G=!1,A&&A.isConnected()?U():L())};window.addEventListener("strobe:identity-change",m);const g=()=>{L(),S(w),K?yt():_&&H?q(i("student.connected"),"waiting"):_||q(i("student.disconnected"),"waiting")};window.StrobeI18n?.on("languageChanged",g);const M=()=>{Z(),V()};window.addEventListener("beforeunload",M),u();const N={registerTeam:U,changeL:c,setL:l,changeD:B,setD:f,changeStep:I,setStep:S,doStep:Ct,toggleAutoDrop:It,resetAll:s};return Object.assign(window,N),()=>{R(),Z(),V(),window.removeEventListener("beforeunload",M),window.removeEventListener("strobe:identity-change",m),window.StrobeI18n?.off("languageChanged",g),A&&typeof A.stop=="function"&&A.stop(),Object.keys(N).forEach(t=>{window[t]===N[t]&&delete window[t]})}}function Qt(v,i,R=()=>{}){const C=Nt(v,(e,s)=>{e==="teacher-chart"&&s&&lt()});let k=null,h=[],n=new Map,y=new Map,E=[],P=new Map,r=new Map,x=new Map,b=0,w=!1,D=0,j=null,W=!1,O="",A="",_=new Map;const H={timeSec:60,targetError:.005},st=1.5,G=5,K=document.getElementById("teacher-chart-cv"),o=K.getContext("2d");function pt(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){U(i("needApi"),"ended");return}if(k){k.start();return}k=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){Q({type:"register_teacher"}),U(i("teacherConnected"),w?"active":"idle")},onMessage(e,s){e==="roster"&&(h=Array.isArray(s&&s.students)?s.students:[],it())},onClose(){U(i("student.disconnected"),"ended")}}),k.start()}function Q(e){if(!(!k||!e||typeof e!="object")&&typeof e.type=="string"&&e.type.trim()){const s=e.type,l={...e};delete l.type,k.send(s,l)}}function tt(){const e=document.getElementById("round-start-btn"),s=document.getElementById("round-stop-btn");e&&(e.disabled=w),s&&(s.disabled=!w)}function bt(e){const s=Number.parseInt(e,10),l=Number.isInteger(s)?s:5;return Math.max(.001,Math.min(.01,l/1e3))}function at(){const e=document.getElementById("round-time-slider"),s=document.getElementById("round-target-slider"),l=Number.parseInt(e.value,10)||60,c=bt(s.value);document.getElementById("round-time-value").textContent=`${l} ${i("seconds")}`,document.getElementById("round-target-value").textContent=c.toFixed(3)}function ft(){const e=document.getElementById("round-timer");if(!w){e.textContent="β€”";return}const s=Math.max(0,Math.ceil((D-Date.now())/1e3));e.textContent=`${s} ${i("seconds")}`}function et(){j!==null&&(clearInterval(j),j=null)}function vt(){et(),ft(),j=setInterval(()=>{if(!w){et();return}if(Date.now()>=D){rt("time_up");return}ft()},200)}function U(e,s){const l=document.getElementById("round-status");l.textContent=e,l.classList.remove("active","ended"),s==="active"&&l.classList.add("active"),s==="ended"&&l.classList.add("ended")}function mt(e){return e===1?12:e===2?10:Math.max(1,11-e)}function L(e){return String(e&&e.team||"")}function X(e){return typeof e.piEst=="number"&&Number.isFinite(e.piEst)}function q(e){return X(e)?Math.abs(e.piEst-Math.PI):null}function V(e){return[...e].sort((s,l)=>{const c=X(s),f=X(l);if(c!==f)return c?-1:1;const B=c?Math.abs(s.piEst-Math.PI):1/0,S=f?Math.abs(l.piEst-Math.PI):1/0;if(B!==S)return B-S;const I=typeof s.drops=="number"?s.drops:0,u=typeof l.drops=="number"?l.drops:0;return I!==u?u-I:String(s.team||"").localeCompare(String(l.team||""),"el")})}function yt(e){return[...e].sort((s,l)=>{const c=L(s),f=L(l),B=r.get(c)||0,S=r.get(f)||0;if(B!==S)return S-B;const I=x.get(c)||0,u=x.get(f)||0;if(I!==u)return u-I;const m=q(s),g=q(l),M=m===null?1/0:m,N=g===null?1/0:g;return M!==N?M-N:String(s.team||"").localeCompare(String(l.team||""),"el")})}function Et(e){if(!O)return e;const s=e.findIndex(l=>L(l)===O);return s<=0?e:[e[s],...e.slice(0,s),...e.slice(s+1)]}function Mt(e){if(!w||W)return;const s=Date.now();if(e.forEach(c=>{const f=L(c);if(!f||_.has(f))return;const B=q(c);B!==null&&B<=H.targetError&&_.set(f,s)}),_.size===0)return;const[l]=[..._.entries()].sort((c,f)=>c[1]-f[1]);l&&(O=l[0],W=!0,setTimeout(()=>rt("target_reached"),0))}function kt(){return Et(V(h))}function Lt(){if(w)return;const e=Number.parseInt(document.getElementById("round-time-slider").value,10)||60,s=bt(document.getElementById("round-target-slider").value);et(),w=!0,W=!1,b+=1,D=Date.now()+e*1e3,H.timeSec=Math.max(20,Math.min(120,e)),H.targetError=Math.max(.001,Math.min(.01,s)),O="",A="",x=new Map,_.clear(),n=new Map,y=new Map,E=[],P=new Map,h=h.map(l=>({...l,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=i("roundStartedInfo",{round:b,target:H.targetError.toFixed(3)}),document.getElementById("round-result").textContent=i("scoresReset"),U(i("roundStarted",{round:b}),"active"),tt(),it(),vt(),Q({type:"start_round",round:b,timeSec:H.timeSec,targetError:H.targetError})}function Bt(){w&&rt("manual_stop",{awardPoints:!0})}function xt(){et(),w=!1,W=!1,D=0,b=0,O="",A="",_.clear(),n=new Map,y=new Map,E=[],P=new Map,r=new Map,x=new Map,h=h.map(e=>({...e,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=`${i("round")}: -`,document.getElementById("round-result").textContent=i("scoresReset"),document.getElementById("round-timer").textContent="β€”",U(i("tournamentReset"),"ended"),tt(),Q({type:"reset_tournament"}),it()}function rt(e,s={}){if(!w)return;const l=s.awardPoints!==!1;w=!1,W=!1,et();const c=kt();x=new Map;const f=c.map((I,u)=>{const m=L(I);if(!m)return null;const g=u+1,M=l?mt(g):0;if(x.set(m,M),l){const N=(r.get(m)||0)+M;r.set(m,N)}return{rank:g,team:m,points:M,error:q(I)}}).filter(Boolean);A=f.length?f[0].team:"";const B=i(e==="target_reached"?"student.targetReached":e==="manual_stop"?"student.manualStop":"student.roundEnd"),S=f.slice(0,3).map(I=>`${I.rank}. ${I.team} (+${I.points})`).join(" | ");document.getElementById("round-info").textContent=i("roundCompletedInfo",{round:b}),document.getElementById("round-result").textContent=S||i("noResults"),U(B,"ended"),document.getElementById("round-timer").textContent=`0 ${i("seconds")}`,tt(),Q({type:"end_round",round:b,reason:e,winnerTeam:A,targetError:H.targetError,rankings:f}),_.clear(),O="",n=new Map,y=new Map,it()}function it(){const e=document.getElementById("live-board-body")||{innerHTML:""},s=document.getElementById("total-board-body")||{innerHTML:""};if(h.length===0){R([]),e.innerHTML=`<div class="empty">${i("noTeams")}</div>`,s.innerHTML=`<div class="empty">${i("noTeams")}</div>`,E=[],n=new Map,y=new Map,P.clear(),lt();return}const l=V(h);w&&Mt(l);const c=w?Et(l):l,f=yt(h),B=new Map(f.map((u,m)=>[L(u),m+1]));R(c.map((u,m)=>{const g=L(u),M=X(u);return{id:g,name:u.team,isConnected:!0,liveRank:m+1,totalRank:B.get(g)||"-",piEstimate:M?u.piEst.toFixed(5):"-",error:M?Math.abs(u.piEst-Math.PI).toFixed(6):"-",drops:(u.drops||0).toLocaleString(),hits:(u.hits||0).toLocaleString(),misses:Math.max(0,(u.drops||0)-(u.hits||0)).toLocaleString(),roundPoints:w?"-":b>0?(x.get(g)||0).toLocaleString():"-",totalPoints:(r.get(g)||0).toLocaleString()}}));const S=new Map;c.forEach((u,m)=>{const g=L(u),M=n.has(g)?n.get(g):null;S.set(g,M===null?null:M-m)});const I=new Map;f.forEach((u,m)=>{const g=L(u),M=y.has(g)?y.get(g):null;I.set(g,M===null?null:M-m)}),e.innerHTML=c.map((u,m)=>{const g=L(u),M=S.get(g),N=X(u),t=N?Math.abs(u.piEst-Math.PI).toFixed(6):"β€”",a=N?u.piEst.toFixed(5):"β€”",d=Math.max(0,(u.drops||0)-(u.hits||0));return`
      <div class="board-row live-board-row${N?M>0?" rank-up":M<0?" rank-down":"":" pending"}">
        <span class="rank" style="color:${N?Ct(m):"#64748b"}">${m+1}</span>
        <span class="team-name">${wt(u.team)}</span>
        <span class="pi-val">${a}</span>
        <span class="err-val">${t}</span>
        <span class="drops-val">${(u.drops||0).toLocaleString()}</span>
        <span class="hits-val">${(u.hits||0).toLocaleString()}</span>
        <span class="miss-val">${d.toLocaleString()}</span>
      </div>`}).join(""),s.innerHTML=f.map((u,m)=>{const g=L(u),M=I.get(g),N=w?"β€”":b>0?(x.get(g)||0).toLocaleString():"β€”",t=(r.get(g)||0).toLocaleString();return`
      <div class="board-row score-board-row${M>0?" rank-up":M<0?" rank-down":""}${!w&&g&&g===A?" round-winner":""}">
        <span class="rank" style="color:#60a5fa">${m+1}</span>
        <span class="team-name">${wt(u.team)}</span>
        <span class="round-points-val">${N}</span>
        <span class="total-points-val">${t}</span>
      </div>`}).join(""),E=c,Z(c),lt(),n=new Map(c.map((u,m)=>[L(u),m])),y=new Map(f.map((u,m)=>[L(u),m]))}function wt(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Ct(e){const s=["#fbbf24","#94a3b8","#cd7c3a","#3b82f6","#a78bfa","#f87171","#34d399","#f97316","#38bdf8","#e879f9"];return s[e%s.length]}function Z(e){const s=new Set(e.map(L));for(const l of Array.from(P.keys()))s.has(l)||P.delete(l);e.forEach(l=>{const c=L(l),f=typeof l.drops=="number"?l.drops:0;if(f<=0){P.set(c,[]);return}if(!X(l))return;const B=l.piEst,S=P.get(c)||[],I=S[S.length-1];if(!I||f>I.n||Math.abs(B-I.pi)>1e-12)if(S.push({n:f,pi:B}),S.length>500){const u=Math.ceil(S.length/500);P.set(c,S.filter((m,g)=>g%u===0))}else P.set(c,S)})}function lt(){const e=document.getElementById("teacher-chart-body");if(!e.classList.contains("open"))return;const s=Math.max(340,e.clientWidth-4),l=172;K.width=s,K.height=l;const c={top:10,right:18,bottom:30,left:40},f=s-c.left-c.right,B=l-c.top-c.bottom;o.clearRect(0,0,s,l),o.fillStyle="#141720",o.beginPath(),o.roundRect(0,0,s,l,6),o.fill();const S=E.filter(X).map((t,a)=>{const d=L(t),p=(P.get(d)||[]).filter(T=>T.n>0);return{rank:a+1,team:String(t.team||""),color:Ct(a),points:p}}).filter(t=>t.points.length>0);if(!S.length){o.fillStyle="#64748b",o.font="12px Courier New",o.textAlign="center",o.fillText(i("noEstimates"),s/2,l/2);return}let I=10;S.forEach(t=>{t.points.forEach(a=>{a.n>I&&(I=a.n)})});const u=t=>c.left+t/I*f,m=t=>c.top+(1-(t-st)/(G-st))*B;o.save(),o.beginPath(),o.rect(c.left,c.top,f,B),o.clip(),o.strokeStyle="#2d3348",o.lineWidth=.8,o.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach(t=>{o.beginPath(),o.moveTo(c.left,m(t)),o.lineTo(c.left+f,m(t)),o.stroke()});const g=m(Math.PI);o.strokeStyle="#fbbf24",o.lineWidth=1.2,o.setLineDash([4,4]),o.beginPath(),o.moveTo(c.left,g),o.lineTo(c.left+f,g),o.stroke(),o.setLineDash([]),S.forEach(t=>{o.strokeStyle=t.color,o.lineWidth=1.6,o.beginPath(),t.points.forEach((d,p)=>{const T=u(d.n),F=m(d.pi);p===0?o.moveTo(T,F):o.lineTo(T,F)}),o.stroke();const a=t.points[t.points.length-1];o.fillStyle=t.color,o.beginPath(),o.arc(u(a.n),m(a.pi),2.8,0,Math.PI*2),o.fill()}),o.restore(),o.fillStyle="#fbbf24",o.font="9px Courier New",o.textAlign="left",o.fillText("Ο€",c.left+f+3,g+3),o.strokeStyle="#475569",o.lineWidth=1,o.beginPath(),o.moveTo(c.left,c.top),o.lineTo(c.left,c.top+B),o.lineTo(c.left+f,c.top+B),o.stroke(),o.fillStyle="#475569",o.font="9px Courier New",o.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach(t=>{o.fillText(t.toFixed(1),c.left-4,m(t)+3)}),o.textAlign="center";for(let t=0;t<=5;t++){const a=Math.round(I*t/5),d=a>=1e3?`${Math.round(a/1e3)}k`:a;o.fillText(d,u(a),c.top+B+14)}o.fillText(i("drops"),c.left+f/2,l-4);let M=c.left,N=c.top+12;o.font="9px Courier New",o.textAlign="left",S.slice(0,8).forEach(t=>{o.fillStyle=t.color,o.fillRect(M,N-7,8,8),o.fillStyle="#94a3b8",o.fillText(`#${t.rank} ${t.team}`,M+12,N),N+=12})}at(),tt(),U(i("initialTeacherStatus"),"idle");const It=()=>{U(w?i("roundStarted",{round:b}):k?.isConnected()?i("teacherConnected"):i("student.disconnected"),w?"active":"idle"),at()};window.StrobeI18n?.on("languageChanged",It),pt(),window.addEventListener("resize",lt);const ct={startRoundFromTeacher:Lt,stopRoundManually:Bt,resetTournamentScores:xt,updateRoundControlLabels:at};return Object.assign(window,ct),()=>{C(),et(),k&&typeof k.stop=="function"&&k.stop(),window.removeEventListener("resize",lt),window.StrobeI18n?.off("languageChanged",It),Object.keys(ct).forEach(e=>{window[e]===ct[e]&&delete window[e]})}}function te({role:v="teacher"}){const i=Tt.useRef(null),R=Tt.useRef(null),{t:C}=Wt("buffon"),[k,h]=qt.useState([]);return Tt.useEffect(()=>{const n=i.current;if(!n)return;if(v==="student"?n.innerHTML=Ut:n.innerHTML=Jt,v==="teacher"){const E=n.querySelector(".round-panel");E&&R.current&&R.current.appendChild(E)}At(n,v,C,!0,R.current);const y=v==="student"?Gt(n,Pt):Qt(n,Pt,h);return window.MathJax&&typeof window.MathJax.typesetPromise=="function"&&window.MathJax.typesetPromise([n]).catch(()=>{}),()=>{typeof y=="function"&&y(),n.innerHTML=""}},[v]),Tt.useEffect(()=>{i.current&&At(i.current,v,C,!1,R.current)},[v,C]),z.jsxs("div",{className:`lab-shell buffon-app ${v}`,children:[z.jsx("header",{className:"lab-header",children:z.jsx(Yt,{title:C(v==="student"?"studentTitle":"teacherTitle")})}),z.jsxs("section",{className:"common-zone lab-zone buffon-zone",children:[z.jsx(Ot,{}),z.jsx("div",{ref:i,className:`buffon-content ${v}`})]}),v==="teacher"?z.jsxs(z.Fragment,{children:[z.jsx(Xt,{children:z.jsx("div",{ref:R,className:"buffon-settings-host buffon-content teacher"})}),z.jsx(Kt,{title:C("standings"),participants:k,columns:[{key:"liveRank",label:C("liveRank"),render:n=>n.liveRank},{key:"totalRank",label:C("totalRank"),render:n=>n.totalRank},{key:"estimate",label:C("estimate"),render:n=>n.piEstimate},{key:"error",label:C("error"),render:n=>n.error},{key:"drops",label:C("drops"),render:n=>n.drops},{key:"hits",label:C("hits"),render:n=>n.hits},{key:"misses",label:C("misses"),render:n=>n.misses},{key:"roundPoints",label:C("roundPoints"),render:n=>n.roundPoints},{key:"totalPoints",label:C("total"),render:n=>n.totalPoints}],emptyMessage:C("noTeams")})]}):null,z.jsx(zt,{})]})}function At(v,i,R,C=!1,k=null){const h=(n,y,E)=>{const P=k?.querySelector(n)||v.querySelector(n);P&&(P.textContent=R(y,E))};if(i==="student"){C&&h(".round-banner","student.waiting"),h(".vspinner:first-child .lbl","student.needleLength"),h(".vspinner:last-child .lbl","student.lineSpacing"),h(".step-col .lbl","student.stepLabel");const n=Number.parseInt(v.querySelector("#step-val")?.textContent,10)||1;h("#step-btn","student.stepButton",{count:n}),h(".auto-lbl","student.automatic"),h(".btn-danger","student.reset");const y=v.querySelectorAll(".vspinner .range-labels");y[0]&&(y[0].textContent="10-120"),y[1]&&(y[1].textContent="30-150"),h('[data-accordion-id="student-formula"] .c-lbl',"student.formula"),h('[data-accordion-id="student-chart"] .c-lbl',"student.chart");const E=v.querySelectorAll(".canvas-footer > span");E[0]&&(E[0].textContent=R("student.hit")),E[1]&&(E[1].textContent=R("student.miss"));const P=v.querySelectorAll(".stat-box .s-lbl");["student.estimateError","hits","misses","drops"].forEach((r,x)=>{P[x+1]&&(P[x+1].textContent=R(r))})}else{const n=(k||v).querySelectorAll(".round-control .lbl");n[0]&&(n[0].textContent=R("roundDuration")),n[1]&&(n[1].textContent=R("targetError"));const y=R("seconds");(k||v).querySelectorAll(".round-control .scale span").forEach(E=>{E.textContent=E.textContent.replace(/\s*sec$/,` ${y}`)}),h("#round-start-btn","startRound"),h("#round-stop-btn","stopRound"),h("#round-reset-btn","resetScores"),C&&(h("#round-status","initialTeacherStatus"),h("#round-info","round")),h('[data-accordion-id="teacher-chart"] .c-lbl',"student.chart")}}function Pt(v,i={}){return window.StrobeI18n.t(v,{ns:"buffon",...i})}export{te as A};
