import{r as qt,w as Yt,a as Lt,u as $t,R as Xt,j as z,H as Ot,F as zt,G as Kt,A as Gt}from"./index-Cnb3Wlwe.js";const Dt=String.raw`<div class="connection-status" id="connection-status" role="status" aria-live="polite"></div>

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
</div>`,Ut=String.raw`<div class="round-panel lab-card">
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
</div>`;function Jt(a,x){if(!a)return()=>{};const g=$=>{const k=$.target.closest(".accordion-btn");if(!k||!a.contains(k))return;const f=k.closest(".accordion"),I=f&&f.querySelector(".accordion-content");if(!I)return;const c=k.getAttribute("aria-expanded")!=="true";k.setAttribute("aria-expanded",String(c)),I.classList.toggle("open",c);const s=k.querySelector(".accordion-icon");s&&(s.textContent=c?"−":"+"),typeof x=="function"&&x(f.dataset.accordionId,c)};return a.addEventListener("click",g),()=>a.removeEventListener("click",g)}function Ft(a,x,{localOnly:g=!1}={}){const $=Jt(a,(t,u)=>{t==="student-chart"&&u&&r()}),k=1.5,f=5,I=document.getElementById("sim"),c=I.getContext("2d"),s=I.width,M=I.height,A=document.getElementById("chart-cv"),n=A.getContext("2d");let L=50,S=60,W=1,D=0,H=0,_=[],q="",F=null,nt=!1,Q=!1,o=null,tt=!1,K=!1,ot=0,ut=null,st=0,ft=null;const at=new URLSearchParams(window.location.search),wt=(at.get("team")||at.get("name")||"").trim();function G(){const t=qt("Student");return q=(wt||t||"Student").trim(),wt&&Yt(wt),q}function Ct(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){nt=!1,V();return}if(F){F.start();return}F=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){nt=!0;const t=G();R({type:"register_student",team:t}),Q=!0,tt=!0,U(x("student.connected"),"waiting"),rt(),V()},onMessage(t,u){if(t==="round_start"){At(u);return}if(t==="round_end"){Mt(u);return}t==="reset_tournament"&&gt(u)},onClose(){nt=!1,Q=!1,tt=!1,K=!1,J(),it(),U(x("student.disconnected"),"waiting"),V()},onError(){nt=!1,V()}}),F.start()}function R(t){if(!F||!t||typeof t!="object"||typeof t.type!="string"||!t.type.trim())return!1;const u=t.type,p={...t};return delete p.type,F.send(u,p)}function et(){if(q=G(),!F||!F.isConnected()){Ct();return}R({type:"register_student",team:q}),Q=!0,tt=!0,U(x("student.connected"),"waiting"),V(),rt()}function rt(){if(!F||!F.isConnected()||!q||!Q)return;const t=H>0?2*L*D/(S*H):null;R({type:"update",drops:D,hits:H,piEst:t?parseFloat(t.toFixed(5)):null})}function V(){const t=document.getElementById("connection-status");if(!t)return;const u=nt&&Q;t.textContent=x(u?"student.connected":"student.connecting"),t.classList.toggle("connected",u)}function pt(t,u,p){return Math.max(u,Math.min(p,t))}function U(t,u){const p=document.getElementById("round-banner");p.textContent=t,p.classList.remove("waiting","active","ended"),u==="active"?p.classList.add("active"):u==="ended"?p.classList.add("ended"):p.classList.add("waiting")}function it(){ft!==null&&(clearInterval(ft),ft=null)}function Et(){const t=Math.max(0,Math.ceil((st-Date.now())/1e3));U(x("student.roundBanner",{round:ot,target:Number.isFinite(ut)?ut.toFixed(3):x("targetError"),seconds:t}),"active")}function Rt(){it(),Et(),ft=setInterval(()=>{if(!K){it();return}Et()},250)}function It(t){const u=pt(Number.parseInt(t.needleL,10)||50,10,120),p=pt(Number.parseInt(t.lineD,10)||60,30,150),b=pt(Number.parseInt(t.stepN,10)||1,1,1e3);L=u,S=p,document.getElementById("val-l").textContent=L,document.getElementById("range-l").value=L,document.getElementById("val-d").textContent=S,document.getElementById("range-d").value=S,m(b),J(),document.getElementById("auto-toggle").checked=!1,h()}function At(t){tt=!0,K=!0,ot=Number.parseInt(t.round,10)||ot+1||1;const u=Number.parseFloat(t.targetError);ut=Number.isFinite(u)?pt(u,.001,.01):null;const p=Number.parseInt(t.endAt,10);if(Number.isFinite(p)&&p>Date.now())st=p;else{const b=Number.parseInt(t.timeSec,10),B=pt(Number.isInteger(b)?b:60,20,120);st=Date.now()+B*1e3}It(t.defaults||{}),Rt()}function Mt(t){tt=!0,K=!1,st=0,J(),document.getElementById("auto-toggle").checked=!1,it();const u=t.reason==="target_reached"?"student.targetReached":t.reason==="manual_stop"?"student.manualStop":"student.roundEnd",p=[x(u)];t.winnerTeam&&p.push(x("student.winner",{team:t.winnerTeam}));const b=Array.isArray(t.rankings)?t.rankings.slice(0,3).map(B=>`${B.rank}:${B.team}`).join(" | "):"";b&&p.push(x("student.podium",{ranking:b})),U(p.join(" "),"ended")}function gt(t){tt=!0,K=!1,ot=0,ut=null,st=0,J(),document.getElementById("auto-toggle").checked=!1,it();const u=t&&t.defaults?t.defaults:{};It(u),U(x("student.tournamentReset"),"waiting")}function vt(){return tt?K:!0}function bt(){c.clearRect(0,0,s,M),c.strokeStyle="#94a3b8",c.lineWidth=1.5;for(let t=0;t<=s;t+=S)c.beginPath(),c.moveTo(t,0),c.lineTo(t,M),c.stroke()}function Tt(){const t=L/2,u=8,p=(Z,ht,lt)=>Math.max(ht,Math.min(lt,Z)),b=t+u,B=s-t-u,O=t+u,mt=M-t-u,yt=Math.round(s*.5/S)*S,dt=p(yt,b,B),xt=p(M*.35,O,mt);let Y=dt+S*.5;Y>B&&(Y=dt-S*.5),Y=p(Y,b,B);const St=p(M*.68,O,mt);function N(Z,ht,lt,Nt){const jt=Z-t*Math.cos(lt),Ht=Z+t*Math.cos(lt),_t=ht-t*Math.sin(lt),Wt=ht+t*Math.sin(lt);c.save(),c.beginPath(),c.setLineDash([8,5]),c.lineCap="round",c.strokeStyle=Nt,c.lineWidth=3.2,c.shadowColor=Nt,c.shadowBlur=5,c.moveTo(jt,_t),c.lineTo(Ht,Wt),c.stroke(),c.restore()}N(dt,xt,0,"rgba(239,68,68,0.98)"),N(Y,St,Math.PI/2,"rgba(34,197,94,0.98)")}function ct(t){D===0&&bt();for(let p=0;p<t;p++){const b=Math.random()*s,B=Math.random()*M,O=Math.random()*Math.PI,mt=b-L/2*Math.cos(O),yt=b+L/2*Math.cos(O),dt=B-L/2*Math.sin(O),xt=B+L/2*Math.sin(O),Y=Math.floor(mt/S)!==Math.floor(yt/S);Y&&H++,D++,c.beginPath(),c.strokeStyle=Y?"rgba(220,38,38,0.78)":"rgba(22,163,74,0.72)",c.lineWidth=2,c.moveTo(mt,dt),c.lineTo(yt,xt),c.stroke()}const u=H>0?2*L*D/(S*H):null;if(u&&_.push({n:D,pi:parseFloat(u.toFixed(5))}),_.length>500){const p=Math.ceil(_.length/500);_=_.filter((b,B)=>B%p===0)}l(u),r(),rt()}function kt(){vt()&&ct(W)}function J(){o!==null&&(clearInterval(o),o=null)}function e(){vt()&&(J(),o=setInterval(()=>{ct(W)},100))}function i(t){if(t&&!vt()){document.getElementById("auto-toggle").checked=!1;return}t?e():J()}function l(t){document.getElementById("s-drops").textContent=D.toLocaleString(),document.getElementById("s-hits").textContent=H.toLocaleString(),document.getElementById("s-miss").textContent=(D-H).toLocaleString(),document.getElementById("s-pi").textContent=t?t.toFixed(5):"β€”",document.getElementById("s-err").textContent=t?Math.abs(t-Math.PI).toFixed(6):"β€”",document.getElementById("f-l").textContent=L,document.getElementById("f-d").textContent=S,document.getElementById("f-n").textContent=D.toLocaleString(),document.getElementById("f-h").textContent=H.toLocaleString(),document.getElementById("f-result").textContent=t?t.toFixed(4):"β€”";const u=(L/S).toFixed(2),p=L<=S;document.getElementById("ratio-badge").innerHTML=`<span style="color:${p?"#34d399":"#fbbf24"}">l/d=${u} ${p?"β“":"β "}</span>`}function r(){const t=document.getElementById("chart-body");if(!t.classList.contains("open"))return;const u=t.clientWidth-4,p=148;A.width=u,A.height=p;const b={top:8,right:18,bottom:28,left:38},B=u-b.left-b.right,O=p-b.top-b.bottom;n.clearRect(0,0,u,p),n.fillStyle="#141720",n.beginPath(),n.roundRect(0,0,u,p,6),n.fill();const mt=Math.max(10,D),yt=0,dt=mt,xt=N=>b.left+(N-yt)/dt*B,Y=N=>b.top+(1-(N-k)/(f-k))*O;n.save(),n.beginPath(),n.rect(b.left,b.top,B,O),n.clip(),n.strokeStyle="#2d3348",n.lineWidth=.8,n.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach(N=>{n.beginPath(),n.moveTo(b.left,Y(N)),n.lineTo(b.left+B,Y(N)),n.stroke()});const St=Y(Math.PI);n.strokeStyle="#fbbf24",n.lineWidth=1.2,n.setLineDash([4,4]),n.beginPath(),n.moveTo(b.left,St),n.lineTo(b.left+B,St),n.stroke(),n.setLineDash([]),_.length>=1&&(n.strokeStyle="#34d399",n.lineWidth=1.5,n.beginPath(),_.forEach((N,Z)=>{const ht=xt(N.n),lt=Y(N.pi);Z===0?n.moveTo(ht,lt):n.lineTo(ht,lt)}),n.stroke()),n.restore(),n.fillStyle="#fbbf24",n.font="9px Courier New",n.textAlign="left",n.fillText("Ο€",b.left+B+3,St+3),n.strokeStyle="#475569",n.lineWidth=1,n.beginPath(),n.moveTo(b.left,b.top),n.lineTo(b.left,b.top+O),n.lineTo(b.left+B,b.top+O),n.stroke(),n.fillStyle="#475569",n.font="9px Courier New",n.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach(N=>n.fillText(N.toFixed(1),b.left-4,Y(N)+3)),n.textAlign="center";for(let N=0;N<=5;N++){const Z=Math.round(dt*N/5);n.fillText(Z>=1e3?`${Math.round(Z/1e3)}k`:Z,xt(Z),b.top+O+14)}n.fillText(x("drops"),b.left+B/2,p-4)}function h(){D=0,H=0,_=[],bt(),Tt(),l(null),r(),rt()}function T(t){L=Math.min(120,Math.max(10,t)),document.getElementById("val-l").textContent=L,document.getElementById("range-l").value=L,document.getElementById("f-l").textContent=L,h()}function C(t){T(L+t)}function w(t){S=Math.min(150,Math.max(30,t)),document.getElementById("val-d").textContent=S,document.getElementById("range-d").value=S,document.getElementById("f-d").textContent=S,h()}function d(t){w(S+t)}function m(t){W=Math.min(1e3,Math.max(1,t)),document.getElementById("step-val").textContent=W,document.getElementById("range-step").value=W,document.getElementById("step-btn").textContent=x("student.stepButton",{count:W})}function y(t){m(W+t)}function E(){g||G(),U(x("student.freeExperiment"),"waiting"),g||Ct(),V(),m(W),bt(),Tt(),l(null)}const j=t=>{const u=t?.detail?.name?.trim();u&&(q=u,Q=!1,tt=!1,!g&&F&&F.isConnected()?et():V())};window.addEventListener("strobe:identity-change",j);const v=()=>{V(),m(W),K?Et():nt&&Q?U(x("student.connected"),"waiting"):nt||U(x("student.disconnected"),"waiting")};window.StrobeI18n?.on("languageChanged",v);const P=()=>{J(),it()};window.addEventListener("beforeunload",P),E();const X={registerTeam:et,changeL:C,setL:T,changeD:d,setD:w,changeStep:y,setStep:m,doStep:kt,toggleAutoDrop:i,resetAll:h};return Object.assign(window,X),()=>{$(),J(),it(),window.removeEventListener("beforeunload",P),window.removeEventListener("strobe:identity-change",j),window.StrobeI18n?.off("languageChanged",v),F&&typeof F.stop=="function"&&F.stop(),Object.keys(X).forEach(t=>{window[t]===X[t]&&delete window[t]})}}function Qt(a,x=()=>{}){let g=null,$=[],k=new Map,f=new Map,I=[],c=new Map,s=new Map,M=new Map,A=0,n=!1,L=0,S=null,W=!1,D="",H="",_=new Map;const q={timeSec:60,targetError:.005},F=1.5,nt=5,Q=document.getElementById("teacher-chart-cv"),o=Q.getContext("2d");function tt(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){G(a("needApi"),"ended");return}if(g){g.start();return}g=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){K({type:"register_teacher"}),G(a("teacherConnected"),n?"active":"idle")},onMessage(e,i){e==="roster"&&($=Array.isArray(i&&i.students)?i.students:[],gt())},onClose(){G(a("student.disconnected"),"ended")}}),g.start()}function K(e){if(!(!g||!e||typeof e!="object")&&typeof e.type=="string"&&e.type.trim()){const i=e.type,l={...e};delete l.type,g.send(i,l)}}function ot(){const e=document.getElementById("round-start-btn"),i=document.getElementById("round-stop-btn");e&&(e.disabled=n),i&&(i.disabled=!n)}function ut(e){const i=Number.parseInt(e,10),l=Number.isInteger(i)?i:5;return Math.max(.001,Math.min(.01,l/1e3))}function st(){const e=document.getElementById("round-time-slider"),i=document.getElementById("round-target-slider"),l=Number.parseInt(e.value,10)||60,r=ut(i.value);document.getElementById("round-time-value").textContent=`${l} ${a("seconds")}`,document.getElementById("round-target-value").textContent=r.toFixed(3)}function ft(){const e=document.getElementById("round-timer");if(!n){e.textContent="β€”";return}const i=Math.max(0,Math.ceil((L-Date.now())/1e3));e.textContent=`${i} ${a("seconds")}`}function at(){S!==null&&(clearInterval(S),S=null)}function wt(){at(),ft(),S=setInterval(()=>{if(!n){at();return}if(Date.now()>=L){Mt("time_up");return}ft()},200)}function G(e,i){const l=document.getElementById("round-status");l.textContent=e,l.classList.remove("active","ended"),i==="active"&&l.classList.add("active"),i==="ended"&&l.classList.add("ended")}function Ct(e){return e===1?12:e===2?10:Math.max(1,11-e)}function R(e){return String(e&&e.team||"")}function et(e){return typeof e.piEst=="number"&&Number.isFinite(e.piEst)}function rt(e){return et(e)?Math.abs(e.piEst-Math.PI):null}function V(e){return[...e].sort((i,l)=>{const r=et(i),h=et(l);if(r!==h)return r?-1:1;const T=r?Math.abs(i.piEst-Math.PI):1/0,C=h?Math.abs(l.piEst-Math.PI):1/0;if(T!==C)return T-C;const w=typeof i.drops=="number"?i.drops:0,d=typeof l.drops=="number"?l.drops:0;return w!==d?d-w:String(i.team||"").localeCompare(String(l.team||""),"el")})}function pt(e){return[...e].sort((i,l)=>{const r=R(i),h=R(l),T=s.get(r)||0,C=s.get(h)||0;if(T!==C)return C-T;const w=M.get(r)||0,d=M.get(h)||0;if(w!==d)return d-w;const m=rt(i),y=rt(l),E=m===null?1/0:m,j=y===null?1/0:y;return E!==j?E-j:String(i.team||"").localeCompare(String(l.team||""),"el")})}function U(e){if(!D)return e;const i=e.findIndex(l=>R(l)===D);return i<=0?e:[e[i],...e.slice(0,i),...e.slice(i+1)]}function it(e){if(!n||W)return;const i=Date.now();if(e.forEach(r=>{const h=R(r);if(!h||_.has(h))return;const T=rt(r);T!==null&&T<=q.targetError&&_.set(h,i)}),_.size===0)return;const[l]=[..._.entries()].sort((r,h)=>r[1]-h[1]);l&&(D=l[0],W=!0,setTimeout(()=>Mt("target_reached"),0))}function Et(){return U(V($))}function Rt(){if(n)return;const e=Number.parseInt(document.getElementById("round-time-slider").value,10)||60,i=ut(document.getElementById("round-target-slider").value);at(),n=!0,W=!1,A+=1,L=Date.now()+e*1e3,q.timeSec=Math.max(20,Math.min(120,e)),q.targetError=Math.max(.001,Math.min(.01,i)),D="",H="",M=new Map,_.clear(),k=new Map,f=new Map,I=[],c=new Map,$=$.map(l=>({...l,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=a("roundStartedInfo",{round:A,target:q.targetError.toFixed(3)}),document.getElementById("round-result").textContent=a("scoresReset"),G(a("roundStarted",{round:A}),"active"),ot(),gt(),wt(),K({type:"start_round",round:A,timeSec:q.timeSec,targetError:q.targetError})}function It(){n&&Mt("manual_stop",{awardPoints:!0})}function At(){at(),n=!1,W=!1,L=0,A=0,D="",H="",_.clear(),k=new Map,f=new Map,I=[],c=new Map,s=new Map,M=new Map,$=$.map(e=>({...e,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=`${a("round")}: -`,document.getElementById("round-result").textContent=a("scoresReset"),document.getElementById("round-timer").textContent="β€”",G(a("tournamentReset"),"ended"),ot(),K({type:"reset_tournament"}),gt()}function Mt(e,i={}){if(!n)return;const l=i.awardPoints!==!1;n=!1,W=!1,at();const r=Et();M=new Map;const h=r.map((w,d)=>{const m=R(w);if(!m)return null;const y=d+1,E=l?Ct(y):0;if(M.set(m,E),l){const j=(s.get(m)||0)+E;s.set(m,j)}return{rank:y,team:m,points:E,error:rt(w)}}).filter(Boolean);H=h.length?h[0].team:"";const T=a(e==="target_reached"?"student.targetReached":e==="manual_stop"?"student.manualStop":"student.roundEnd"),C=h.slice(0,3).map(w=>`${w.rank}. ${w.team} (+${w.points})`).join(" | ");document.getElementById("round-info").textContent=a("roundCompletedInfo",{round:A}),document.getElementById("round-result").textContent=C||a("noResults"),G(T,"ended"),document.getElementById("round-timer").textContent=`0 ${a("seconds")}`,ot(),K({type:"end_round",round:A,reason:e,winnerTeam:H,targetError:q.targetError,rankings:h}),_.clear(),D="",k=new Map,f=new Map,gt()}function gt(){const e=document.getElementById("live-board-body")||{innerHTML:""},i=document.getElementById("total-board-body")||{innerHTML:""};if($.length===0){x([]),e.innerHTML=`<div class="empty">${a("noTeams")}</div>`,i.innerHTML=`<div class="empty">${a("noTeams")}</div>`,I=[],k=new Map,f=new Map,c.clear(),ct();return}const l=V($);n&&it(l);const r=n?U(l):l,h=pt($),T=new Map(h.map((d,m)=>[R(d),m+1]));x(r.map((d,m)=>{const y=R(d),E=et(d);return{id:y,name:d.team,isConnected:!0,liveRank:m+1,totalRank:T.get(y)||"-",piEstimate:E?d.piEst.toFixed(5):"-",error:E?Math.abs(d.piEst-Math.PI).toFixed(6):"-",drops:(d.drops||0).toLocaleString(),hits:(d.hits||0).toLocaleString(),misses:Math.max(0,(d.drops||0)-(d.hits||0)).toLocaleString(),roundPoints:n?"-":A>0?(M.get(y)||0).toLocaleString():"-",totalPoints:(s.get(y)||0).toLocaleString()}}));const C=new Map;r.forEach((d,m)=>{const y=R(d),E=k.has(y)?k.get(y):null;C.set(y,E===null?null:E-m)});const w=new Map;h.forEach((d,m)=>{const y=R(d),E=f.has(y)?f.get(y):null;w.set(y,E===null?null:E-m)}),e.innerHTML=r.map((d,m)=>{const y=R(d),E=C.get(y),j=et(d),v=j?Math.abs(d.piEst-Math.PI).toFixed(6):"β€”",P=j?d.piEst.toFixed(5):"β€”",X=Math.max(0,(d.drops||0)-(d.hits||0));return`
      <div class="board-row live-board-row${j?E>0?" rank-up":E<0?" rank-down":"":" pending"}">
        <span class="rank" style="color:${j?bt(m):"#64748b"}">${m+1}</span>
        <span class="team-name">${vt(d.team)}</span>
        <span class="pi-val">${P}</span>
        <span class="err-val">${v}</span>
        <span class="drops-val">${(d.drops||0).toLocaleString()}</span>
        <span class="hits-val">${(d.hits||0).toLocaleString()}</span>
        <span class="miss-val">${X.toLocaleString()}</span>
      </div>`}).join(""),i.innerHTML=h.map((d,m)=>{const y=R(d),E=w.get(y),j=n?"β€”":A>0?(M.get(y)||0).toLocaleString():"β€”",v=(s.get(y)||0).toLocaleString();return`
      <div class="board-row score-board-row${E>0?" rank-up":E<0?" rank-down":""}${!n&&y&&y===H?" round-winner":""}">
        <span class="rank" style="color:#60a5fa">${m+1}</span>
        <span class="team-name">${vt(d.team)}</span>
        <span class="round-points-val">${j}</span>
        <span class="total-points-val">${v}</span>
      </div>`}).join(""),I=r,Tt(r),ct(),k=new Map(r.map((d,m)=>[R(d),m])),f=new Map(h.map((d,m)=>[R(d),m]))}function vt(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function bt(e){const i=["#fbbf24","#94a3b8","#cd7c3a","#3b82f6","#a78bfa","#f87171","#34d399","#f97316","#38bdf8","#e879f9"];return i[e%i.length]}function Tt(e){const i=new Set(e.map(R));for(const l of Array.from(c.keys()))i.has(l)||c.delete(l);e.forEach(l=>{const r=R(l),h=typeof l.drops=="number"?l.drops:0;if(h<=0){c.set(r,[]);return}if(!et(l))return;const T=l.piEst,C=c.get(r)||[],w=C[C.length-1];if(!w||h>w.n||Math.abs(T-w.pi)>1e-12)if(C.push({n:h,pi:T}),C.length>500){const d=Math.ceil(C.length/500);c.set(r,C.filter((m,y)=>y%d===0))}else c.set(r,C)})}function ct(){const e=document.getElementById("teacher-chart-body");if(!e.classList.contains("open"))return;const i=Math.max(340,e.clientWidth-4),l=172;Q.width=i,Q.height=l;const r={top:10,right:18,bottom:30,left:40},h=i-r.left-r.right,T=l-r.top-r.bottom;o.clearRect(0,0,i,l),o.fillStyle="#141720",o.beginPath(),o.roundRect(0,0,i,l,6),o.fill();const C=I.filter(et).map((v,P)=>{const X=R(v),t=(c.get(X)||[]).filter(u=>u.n>0);return{rank:P+1,team:String(v.team||""),color:bt(P),points:t}}).filter(v=>v.points.length>0);if(!C.length){o.fillStyle="#64748b",o.font="12px Courier New",o.textAlign="center",o.fillText(a("noEstimates"),i/2,l/2);return}let w=10;C.forEach(v=>{v.points.forEach(P=>{P.n>w&&(w=P.n)})});const d=v=>r.left+v/w*h,m=v=>r.top+(1-(v-F)/(nt-F))*T;o.save(),o.beginPath(),o.rect(r.left,r.top,h,T),o.clip(),o.strokeStyle="#2d3348",o.lineWidth=.8,o.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach(v=>{o.beginPath(),o.moveTo(r.left,m(v)),o.lineTo(r.left+h,m(v)),o.stroke()});const y=m(Math.PI);o.strokeStyle="#fbbf24",o.lineWidth=1.2,o.setLineDash([4,4]),o.beginPath(),o.moveTo(r.left,y),o.lineTo(r.left+h,y),o.stroke(),o.setLineDash([]),C.forEach(v=>{o.strokeStyle=v.color,o.lineWidth=1.6,o.beginPath(),v.points.forEach((X,t)=>{const u=d(X.n),p=m(X.pi);t===0?o.moveTo(u,p):o.lineTo(u,p)}),o.stroke();const P=v.points[v.points.length-1];o.fillStyle=v.color,o.beginPath(),o.arc(d(P.n),m(P.pi),2.8,0,Math.PI*2),o.fill()}),o.restore(),o.fillStyle="#fbbf24",o.font="9px Courier New",o.textAlign="left",o.fillText("Ο€",r.left+h+3,y+3),o.strokeStyle="#475569",o.lineWidth=1,o.beginPath(),o.moveTo(r.left,r.top),o.lineTo(r.left,r.top+T),o.lineTo(r.left+h,r.top+T),o.stroke(),o.fillStyle="#475569",o.font="9px Courier New",o.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach(v=>{o.fillText(v.toFixed(1),r.left-4,m(v)+3)}),o.textAlign="center";for(let v=0;v<=5;v++){const P=Math.round(w*v/5),X=P>=1e3?`${Math.round(P/1e3)}k`:P;o.fillText(X,d(P),r.top+T+14)}o.fillText(a("drops"),r.left+h/2,l-4);let E=r.left,j=r.top+12;o.font="9px Courier New",o.textAlign="left",C.slice(0,8).forEach(v=>{o.fillStyle=v.color,o.fillRect(E,j-7,8,8),o.fillStyle="#94a3b8",o.fillText(`#${v.rank} ${v.team}`,E+12,j),j+=12})}st(),ot(),G(a("initialTeacherStatus"),"idle");const kt=()=>{G(n?a("roundStarted",{round:A}):g?.isConnected()?a("teacherConnected"):a("student.disconnected"),n?"active":"idle"),st()};window.StrobeI18n?.on("languageChanged",kt),tt(),window.addEventListener("resize",ct);const J={startRoundFromTeacher:Rt,stopRoundManually:It,resetTournamentScores:At,updateRoundControlLabels:st,drawBuffonTeacherChart:ct};return Object.assign(window,J),()=>{at(),g&&typeof g.stop=="function"&&g.stop(),window.removeEventListener("resize",ct),window.StrobeI18n?.off("languageChanged",kt),Object.keys(J).forEach(e=>{window[e]===J[e]&&delete window[e]})}}function Zt({role:a="teacher"}){const x=Lt.useRef(null),g=Lt.useRef(null),{t:$}=$t("interface"),{t:k}=$t("navigation"),f=(s,M)=>$(`workshops.buffon.${s}`,M),[I,c]=Xt.useState([]);return Lt.useEffect(()=>{const s=x.current;if(!s)return;a==="student"?(s.innerHTML=Dt,g.current&&(g.current.innerHTML="")):(s.innerHTML=Dt,g.current&&(g.current.innerHTML=Ut)),Bt(s,a==="teacher"?"student":a,f,!0,g.current),a==="teacher"&&Bt(s,"teacher",f,!0,g.current);const M=a==="student"?[Ft(s,Pt)]:[Ft(s,Pt,{localOnly:!0}),Qt(Pt,c)];return window.MathJax&&typeof window.MathJax.typesetPromise=="function"&&window.MathJax.typesetPromise([s]).catch(()=>{}),()=>{M.forEach(A=>{typeof A=="function"&&A()}),s.innerHTML="",g.current&&(g.current.innerHTML="")}},[a]),Lt.useEffect(()=>{x.current&&(Bt(x.current,a==="teacher"?"student":a,f,!1,g.current),a==="teacher"&&Bt(x.current,"teacher",f,!1,g.current))},[a,f]),z.jsxs(z.Fragment,{children:[z.jsx(Ot,{title:`${k("items.buffon")} - ${f(a==="student"?"studentTitle":"teacherTitle")}`}),z.jsxs("section",{className:"common-zone lab-zone",children:[z.jsx(zt,{}),z.jsx("div",{ref:x,className:`buffon-content ${a==="teacher"?"student teacher-preview":"student"}`})]}),a==="teacher"?z.jsxs(z.Fragment,{children:[z.jsx("div",{ref:g,className:"buffon-settings-host buffon-content teacher"}),z.jsx(Kt,{participants:I,columns:[{key:"liveRank",label:f("liveRank"),render:s=>s.liveRank},{key:"totalRank",label:f("totalRank"),render:s=>s.totalRank},{key:"estimate",label:f("estimate"),render:s=>s.piEstimate},{key:"error",label:f("error"),render:s=>s.error},{key:"drops",label:f("drops"),render:s=>s.drops},{key:"hits",label:f("hits"),render:s=>s.hits},{key:"misses",label:f("misses"),render:s=>s.misses},{key:"roundPoints",label:f("roundPoints"),render:s=>s.roundPoints},{key:"totalPoints",label:f("total"),render:s=>s.totalPoints}],emptyMessage:f("noTeams")}),z.jsx(Gt,{title:f("student.chart"),className:"chart-wrap",onToggle:s=>{s&&window.requestAnimationFrame(()=>window.drawBuffonTeacherChart?.())},children:z.jsx("div",{id:"teacher-chart-body",className:"chart-body open",children:z.jsx("canvas",{id:"teacher-chart-cv"})})})]}):null]})}function Bt(a,x,g,$=!1,k=null){const f=(I,c,s)=>{const M=k?.querySelector(I)||a.querySelector(I);M&&(M.textContent=g(c,s))};if(x==="student"){$&&f(".round-banner","student.waiting"),f(".vspinner:first-child .lbl","student.needleLength"),f(".vspinner:last-child .lbl","student.lineSpacing"),f(".step-col .lbl","student.stepLabel");const I=Number.parseInt(a.querySelector("#step-val")?.textContent,10)||1;f("#step-btn","student.stepButton",{count:I}),f(".auto-lbl","student.automatic"),f(".btn-danger","student.reset");const c=a.querySelectorAll(".vspinner .range-labels");c[0]&&(c[0].textContent="10-120"),c[1]&&(c[1].textContent="30-150"),f('[data-accordion-id="student-formula"] .c-lbl',"student.formula"),f('[data-accordion-id="student-chart"] .c-lbl',"student.chart");const s=a.querySelectorAll(".canvas-footer > span");s[0]&&(s[0].textContent=g("student.hit")),s[1]&&(s[1].textContent=g("student.miss"));const M=a.querySelectorAll(".stat-box .s-lbl");["student.estimateError","hits","misses","drops"].forEach((A,n)=>{M[n+1]&&(M[n+1].textContent=g(A))})}else{const I=(k||a).querySelectorAll(".round-control .lbl");I[0]&&(I[0].textContent=g("roundDuration")),I[1]&&(I[1].textContent=g("targetError"));const c=g("seconds"),s=(k||a).querySelectorAll(".round-control .scale span");s[0]&&(s[0].textContent=`20 ${c}`),s[1]&&(s[1].textContent=`120 ${c}`),f("#round-start-btn","startRound"),f("#round-stop-btn","stopRound"),f("#round-reset-btn","resetScores"),$&&(f("#round-status","initialTeacherStatus"),f("#round-info","round"))}}function Pt(a,x={}){return window.StrobeI18n.t(`workshops.buffon.${a}`,{ns:"interface",...x})}export{Zt as A};
