import{r as qt,w as Yt,a as Lt,u as $t,R as Xt,j as q,H as Ot,F as zt,S as Kt,b as Ut,A as Jt,C as Gt}from"./index-Cm8A91MW.js";const Dt=String.raw`<div class="connection-status" id="connection-status" role="status" aria-live="polite"></div>

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
</div>`,Qt=String.raw`<div class="round-panel lab-card">
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
</div>`;function Vt(a,y){if(!a)return()=>{};const m=b=>{const L=b.target.closest(".accordion-btn");if(!L||!a.contains(L))return;const x=L.closest(".accordion"),I=x&&x.querySelector(".accordion-content");if(!I)return;const e=L.getAttribute("aria-expanded")!=="true";L.setAttribute("aria-expanded",String(e)),I.classList.toggle("open",e);const w=L.querySelector(".accordion-icon");w&&(w.textContent=e?"−":"+"),typeof y=="function"&&y(x.dataset.accordionId,e)};return a.addEventListener("click",m),()=>a.removeEventListener("click",m)}function Ft(a,y,{localOnly:m=!1}={}){const b=Vt(a,(t,d)=>{t==="student-chart"&&d&&r()}),L=1.5,x=5,I=document.getElementById("sim"),e=I.getContext("2d"),w=I.width,T=I.height,j=document.getElementById("chart-cv"),o=j.getContext("2d");let B=50,M=60,W=1,$=0,H=0,_=[],Y="",D=null,nt=!1,Q=!1,s=null,tt=!1,K=!1,ot=0,ut=null,st=0,ft=null;const at=new URLSearchParams(window.location.search),wt=(at.get("team")||at.get("name")||"").trim();function U(){const t=qt("Student");return Y=(wt||t||"Student").trim(),wt&&Yt(wt),Y}function Ct(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){nt=!1,V();return}if(D){D.start();return}D=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){nt=!0;const t=U();A({type:"register_student",team:t}),Q=!0,tt=!0,J(y("student.connected"),"waiting"),rt(),V()},onMessage(t,d){if(t==="round_start"){At(d);return}if(t==="round_end"){Et(d);return}t==="reset_tournament"&&gt(d)},onClose(){nt=!1,Q=!1,tt=!1,K=!1,G(),it(),J(y("student.disconnected"),"waiting"),V()},onError(){nt=!1,V()}}),D.start()}function A(t){if(!D||!t||typeof t!="object"||typeof t.type!="string"||!t.type.trim())return!1;const d=t.type,u={...t};return delete u.type,D.send(d,u)}function et(){if(Y=U(),!D||!D.isConnected()){Ct();return}A({type:"register_student",team:Y}),Q=!0,tt=!0,J(y("student.connected"),"waiting"),V(),rt()}function rt(){if(!D||!D.isConnected()||!Y||!Q)return;const t=H>0?2*B*$/(M*H):null;A({type:"update",drops:$,hits:H,piEst:t?parseFloat(t.toFixed(5)):null})}function V(){const t=document.getElementById("connection-status");if(!t)return;const d=nt&&Q;t.textContent=y(d?"student.connected":"student.connecting"),t.classList.toggle("connected",d)}function pt(t,d,u){return Math.max(d,Math.min(u,t))}function J(t,d){const u=document.getElementById("round-banner");u.textContent=t,u.classList.remove("waiting","active","ended"),d==="active"?u.classList.add("active"):d==="ended"?u.classList.add("ended"):u.classList.add("waiting")}function it(){ft!==null&&(clearInterval(ft),ft=null)}function St(){const t=Math.max(0,Math.ceil((st-Date.now())/1e3));J(y("student.roundBanner",{round:ot,target:Number.isFinite(ut)?ut.toFixed(3):y("targetError"),seconds:t}),"active")}function Rt(){it(),St(),ft=setInterval(()=>{if(!K){it();return}St()},250)}function It(t){const d=pt(Number.parseInt(t.needleL,10)||50,10,120),u=pt(Number.parseInt(t.lineD,10)||60,30,150),g=pt(Number.parseInt(t.stepN,10)||1,1,1e3);B=d,M=u,document.getElementById("val-l").textContent=B,document.getElementById("range-l").value=B,document.getElementById("val-d").textContent=M,document.getElementById("range-d").value=M,f(g),G(),document.getElementById("auto-toggle").checked=!1,p()}function At(t){tt=!0,K=!0,ot=Number.parseInt(t.round,10)||ot+1||1;const d=Number.parseFloat(t.targetError);ut=Number.isFinite(d)?pt(d,.001,.01):null;const u=Number.parseInt(t.endAt,10);if(Number.isFinite(u)&&u>Date.now())st=u;else{const g=Number.parseInt(t.timeSec,10),R=pt(Number.isInteger(g)?g:60,20,120);st=Date.now()+R*1e3}It(t.defaults||{}),Rt()}function Et(t){tt=!0,K=!1,st=0,G(),document.getElementById("auto-toggle").checked=!1,it();const d=t.reason==="target_reached"?"student.targetReached":t.reason==="manual_stop"?"student.manualStop":"student.roundEnd",u=[y(d)];t.winnerTeam&&u.push(y("student.winner",{team:t.winnerTeam}));const g=Array.isArray(t.rankings)?t.rankings.slice(0,3).map(R=>`${R.rank}:${R.team}`).join(" | "):"";g&&u.push(y("student.podium",{ranking:g})),J(u.join(" "),"ended")}function gt(t){tt=!0,K=!1,ot=0,ut=null,st=0,G(),document.getElementById("auto-toggle").checked=!1,it();const d=t&&t.defaults?t.defaults:{};It(d),J(y("student.tournamentReset"),"waiting")}function bt(){return tt?K:!0}function vt(){e.clearRect(0,0,w,T),e.strokeStyle="#94a3b8",e.lineWidth=1.5;for(let t=0;t<=w;t+=M)e.beginPath(),e.moveTo(t,0),e.lineTo(t,T),e.stroke()}function Tt(){const t=B/2,d=8,u=(Z,ht,lt)=>Math.max(ht,Math.min(lt,Z)),g=t+d,R=w-t-d,z=t+d,mt=T-t-d,yt=Math.round(w*.5/M)*M,dt=u(yt,g,R),xt=u(T*.35,z,mt);let X=dt+M*.5;X>R&&(X=dt-M*.5),X=u(X,g,R);const Mt=u(T*.68,z,mt);function N(Z,ht,lt,Nt){const jt=Z-t*Math.cos(lt),Ht=Z+t*Math.cos(lt),_t=ht-t*Math.sin(lt),Wt=ht+t*Math.sin(lt);e.save(),e.beginPath(),e.setLineDash([8,5]),e.lineCap="round",e.strokeStyle=Nt,e.lineWidth=3.2,e.shadowColor=Nt,e.shadowBlur=5,e.moveTo(jt,_t),e.lineTo(Ht,Wt),e.stroke(),e.restore()}N(dt,xt,0,"rgba(239,68,68,0.98)"),N(X,Mt,Math.PI/2,"rgba(34,197,94,0.98)")}function ct(t){$===0&&vt();for(let u=0;u<t;u++){const g=Math.random()*w,R=Math.random()*T,z=Math.random()*Math.PI,mt=g-B/2*Math.cos(z),yt=g+B/2*Math.cos(z),dt=R-B/2*Math.sin(z),xt=R+B/2*Math.sin(z),X=Math.floor(mt/M)!==Math.floor(yt/M);X&&H++,$++,e.beginPath(),e.strokeStyle=X?"rgba(220,38,38,0.78)":"rgba(22,163,74,0.72)",e.lineWidth=2,e.moveTo(mt,dt),e.lineTo(yt,xt),e.stroke()}const d=H>0?2*B*$/(M*H):null;if(d&&_.push({n:$,pi:parseFloat(d.toFixed(5))}),_.length>500){const u=Math.ceil(_.length/500);_=_.filter((g,R)=>R%u===0)}l(d),r(),rt()}function kt(){bt()&&ct(W)}function G(){s!==null&&(clearInterval(s),s=null)}function n(){bt()&&(G(),s=setInterval(()=>{ct(W)},100))}function i(t){if(t&&!bt()){document.getElementById("auto-toggle").checked=!1;return}t?n():G()}function l(t){document.getElementById("s-drops").textContent=$.toLocaleString(),document.getElementById("s-hits").textContent=H.toLocaleString(),document.getElementById("s-miss").textContent=($-H).toLocaleString(),document.getElementById("s-pi").textContent=t?t.toFixed(5):"β€”",document.getElementById("s-err").textContent=t?Math.abs(t-Math.PI).toFixed(6):"β€”",document.getElementById("f-l").textContent=B,document.getElementById("f-d").textContent=M,document.getElementById("f-n").textContent=$.toLocaleString(),document.getElementById("f-h").textContent=H.toLocaleString(),document.getElementById("f-result").textContent=t?t.toFixed(4):"β€”";const d=(B/M).toFixed(2),u=B<=M;document.getElementById("ratio-badge").innerHTML=`<span style="color:${u?"#34d399":"#fbbf24"}">l/d=${d} ${u?"β“":"β "}</span>`}function r(){const t=document.getElementById("chart-body");if(!t.classList.contains("open"))return;const d=t.clientWidth-4,u=148;j.width=d,j.height=u;const g={top:8,right:18,bottom:28,left:38},R=d-g.left-g.right,z=u-g.top-g.bottom;o.clearRect(0,0,d,u),o.fillStyle="#141720",o.beginPath(),o.roundRect(0,0,d,u,6),o.fill();const mt=Math.max(10,$),yt=0,dt=mt,xt=N=>g.left+(N-yt)/dt*R,X=N=>g.top+(1-(N-L)/(x-L))*z;o.save(),o.beginPath(),o.rect(g.left,g.top,R,z),o.clip(),o.strokeStyle="#2d3348",o.lineWidth=.8,o.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach(N=>{o.beginPath(),o.moveTo(g.left,X(N)),o.lineTo(g.left+R,X(N)),o.stroke()});const Mt=X(Math.PI);o.strokeStyle="#fbbf24",o.lineWidth=1.2,o.setLineDash([4,4]),o.beginPath(),o.moveTo(g.left,Mt),o.lineTo(g.left+R,Mt),o.stroke(),o.setLineDash([]),_.length>=1&&(o.strokeStyle="#34d399",o.lineWidth=1.5,o.beginPath(),_.forEach((N,Z)=>{const ht=xt(N.n),lt=X(N.pi);Z===0?o.moveTo(ht,lt):o.lineTo(ht,lt)}),o.stroke()),o.restore(),o.fillStyle="#fbbf24",o.font="9px Courier New",o.textAlign="left",o.fillText("Ο€",g.left+R+3,Mt+3),o.strokeStyle="#475569",o.lineWidth=1,o.beginPath(),o.moveTo(g.left,g.top),o.lineTo(g.left,g.top+z),o.lineTo(g.left+R,g.top+z),o.stroke(),o.fillStyle="#475569",o.font="9px Courier New",o.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach(N=>o.fillText(N.toFixed(1),g.left-4,X(N)+3)),o.textAlign="center";for(let N=0;N<=5;N++){const Z=Math.round(dt*N/5);o.fillText(Z>=1e3?`${Math.round(Z/1e3)}k`:Z,xt(Z),g.top+z+14)}o.fillText(y("drops"),g.left+R/2,u-4)}function p(){$=0,H=0,_=[],vt(),Tt(),l(null),r(),rt()}function k(t){B=Math.min(120,Math.max(10,t)),document.getElementById("val-l").textContent=B,document.getElementById("range-l").value=B,document.getElementById("f-l").textContent=B,p()}function C(t){k(B+t)}function S(t){M=Math.min(150,Math.max(30,t)),document.getElementById("val-d").textContent=M,document.getElementById("range-d").value=M,document.getElementById("f-d").textContent=M,p()}function c(t){S(M+t)}function f(t){W=Math.min(1e3,Math.max(1,t)),document.getElementById("step-val").textContent=W,document.getElementById("range-step").value=W,document.getElementById("step-btn").textContent=y("student.stepButton",{count:W})}function v(t){f(W+t)}function E(){m||U(),J(y("student.freeExperiment"),"waiting"),m||Ct(),V(),f(W),vt(),Tt(),l(null)}const F=t=>{const d=t?.detail?.name?.trim();d&&(Y=d,Q=!1,tt=!1,!m&&D&&D.isConnected()?et():V())};window.addEventListener("strobe:identity-change",F);const h=()=>{V(),f(W),K?St():nt&&Q?J(y("student.connected"),"waiting"):nt||J(y("student.disconnected"),"waiting")};window.StrobeI18n?.on("languageChanged",h);const P=()=>{G(),it()};window.addEventListener("beforeunload",P),E();const O={registerTeam:et,changeL:C,setL:k,changeD:c,setD:S,changeStep:v,setStep:f,doStep:kt,toggleAutoDrop:i,resetAll:p};return Object.assign(window,O),()=>{b(),G(),it(),window.removeEventListener("beforeunload",P),window.removeEventListener("strobe:identity-change",F),window.StrobeI18n?.off("languageChanged",h),D&&typeof D.stop=="function"&&D.stop(),Object.keys(O).forEach(t=>{window[t]===O[t]&&delete window[t]})}}function Zt(a,y=()=>{}){let m=null,b=[],L=new Map,x=new Map,I=[],e=new Map,w=new Map,T=new Map,j=0,o=!1,B=0,M=null,W=!1,$="",H="",_=new Map;const Y={timeSec:60,targetError:.005},D=1.5,nt=5,Q=document.getElementById("teacher-chart-cv"),s=Q.getContext("2d");function tt(){if(!window.SharedClassroomApi||typeof window.SharedClassroomApi.createClient!="function"){U(a("needApi"),"ended");return}if(m){m.start();return}m=window.SharedClassroomApi.createClient({wsPath:"/ws/buffon",reconnectDelayMs:2e3,onOpen(){K({type:"register_teacher"}),U(a("teacherConnected"),o?"active":"idle")},onMessage(n,i){n==="roster"&&(b=Array.isArray(i&&i.students)?i.students:[],gt())},onClose(){U(a("student.disconnected"),"ended")}}),m.start()}function K(n){if(!(!m||!n||typeof n!="object")&&typeof n.type=="string"&&n.type.trim()){const i=n.type,l={...n};delete l.type,m.send(i,l)}}function ot(){const n=document.getElementById("round-start-btn"),i=document.getElementById("round-stop-btn");n&&(n.disabled=o),i&&(i.disabled=!o)}function ut(n){const i=Number.parseInt(n,10),l=Number.isInteger(i)?i:5;return Math.max(.001,Math.min(.01,l/1e3))}function st(){const n=document.getElementById("round-time-slider"),i=document.getElementById("round-target-slider"),l=Number.parseInt(n.value,10)||60,r=ut(i.value);document.getElementById("round-time-value").textContent=`${l} ${a("seconds")}`,document.getElementById("round-target-value").textContent=r.toFixed(3)}function ft(){const n=document.getElementById("round-timer");if(!o){n.textContent="β€”";return}const i=Math.max(0,Math.ceil((B-Date.now())/1e3));n.textContent=`${i} ${a("seconds")}`}function at(){M!==null&&(clearInterval(M),M=null)}function wt(){at(),ft(),M=setInterval(()=>{if(!o){at();return}if(Date.now()>=B){Et("time_up");return}ft()},200)}function U(n,i){const l=document.getElementById("round-status");l.textContent=n,l.classList.remove("active","ended"),i==="active"&&l.classList.add("active"),i==="ended"&&l.classList.add("ended")}function Ct(n){return n===1?12:n===2?10:Math.max(1,11-n)}function A(n){return String(n&&n.team||"")}function et(n){return typeof n.piEst=="number"&&Number.isFinite(n.piEst)}function rt(n){return et(n)?Math.abs(n.piEst-Math.PI):null}function V(n){return[...n].sort((i,l)=>{const r=et(i),p=et(l);if(r!==p)return r?-1:1;const k=r?Math.abs(i.piEst-Math.PI):1/0,C=p?Math.abs(l.piEst-Math.PI):1/0;if(k!==C)return k-C;const S=typeof i.drops=="number"?i.drops:0,c=typeof l.drops=="number"?l.drops:0;return S!==c?c-S:String(i.team||"").localeCompare(String(l.team||""),"el")})}function pt(n){return[...n].sort((i,l)=>{const r=A(i),p=A(l),k=w.get(r)||0,C=w.get(p)||0;if(k!==C)return C-k;const S=T.get(r)||0,c=T.get(p)||0;if(S!==c)return c-S;const f=rt(i),v=rt(l),E=f===null?1/0:f,F=v===null?1/0:v;return E!==F?E-F:String(i.team||"").localeCompare(String(l.team||""),"el")})}function J(n){if(!$)return n;const i=n.findIndex(l=>A(l)===$);return i<=0?n:[n[i],...n.slice(0,i),...n.slice(i+1)]}function it(n){if(!o||W)return;const i=Date.now();if(n.forEach(r=>{const p=A(r);if(!p||_.has(p))return;const k=rt(r);k!==null&&k<=Y.targetError&&_.set(p,i)}),_.size===0)return;const[l]=[..._.entries()].sort((r,p)=>r[1]-p[1]);l&&($=l[0],W=!0,setTimeout(()=>Et("target_reached"),0))}function St(){return J(V(b))}function Rt(){if(o)return;const n=Number.parseInt(document.getElementById("round-time-slider").value,10)||60,i=ut(document.getElementById("round-target-slider").value);at(),o=!0,W=!1,j+=1,B=Date.now()+n*1e3,Y.timeSec=Math.max(20,Math.min(120,n)),Y.targetError=Math.max(.001,Math.min(.01,i)),$="",H="",T=new Map,_.clear(),L=new Map,x=new Map,I=[],e=new Map,b=b.map(l=>({...l,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=a("roundStartedInfo",{round:j,target:Y.targetError.toFixed(3)}),document.getElementById("round-result").textContent=a("scoresReset"),U(a("roundStarted",{round:j}),"active"),ot(),gt(),wt(),K({type:"start_round",round:j,timeSec:Y.timeSec,targetError:Y.targetError})}function It(){o&&Et("manual_stop",{awardPoints:!0})}function At(){at(),o=!1,W=!1,B=0,j=0,$="",H="",_.clear(),L=new Map,x=new Map,I=[],e=new Map,w=new Map,T=new Map,b=b.map(n=>({...n,drops:0,hits:0,piEst:null})),document.getElementById("round-info").textContent=`${a("round")}: -`,document.getElementById("round-result").textContent=a("scoresReset"),document.getElementById("round-timer").textContent="β€”",U(a("tournamentReset"),"ended"),ot(),K({type:"reset_tournament"}),gt()}function Et(n,i={}){if(!o)return;const l=i.awardPoints!==!1;o=!1,W=!1,at();const r=St();T=new Map;const p=r.map((S,c)=>{const f=A(S);if(!f)return null;const v=c+1,E=l?Ct(v):0;if(T.set(f,E),l){const F=(w.get(f)||0)+E;w.set(f,F)}return{rank:v,team:f,points:E,error:rt(S)}}).filter(Boolean);H=p.length?p[0].team:"";const k=a(n==="target_reached"?"student.targetReached":n==="manual_stop"?"student.manualStop":"student.roundEnd"),C=p.slice(0,3).map(S=>`${S.rank}. ${S.team} (+${S.points})`).join(" | ");document.getElementById("round-info").textContent=a("roundCompletedInfo",{round:j}),document.getElementById("round-result").textContent=C||a("noResults"),U(k,"ended"),document.getElementById("round-timer").textContent=`0 ${a("seconds")}`,ot(),K({type:"end_round",round:j,reason:n,winnerTeam:H,targetError:Y.targetError,rankings:p}),_.clear(),$="",L=new Map,x=new Map,gt()}function gt(){const n=document.getElementById("live-board-body")||{innerHTML:""},i=document.getElementById("total-board-body")||{innerHTML:""};if(b.length===0){y([]),n.innerHTML=`<div class="empty">${a("noTeams")}</div>`,i.innerHTML=`<div class="empty">${a("noTeams")}</div>`,I=[],L=new Map,x=new Map,e.clear(),ct();return}const l=V(b);o&&it(l);const r=o?J(l):l,p=pt(b),k=new Map(p.map((c,f)=>[A(c),f+1]));y(r.map((c,f)=>{const v=A(c),E=et(c);return{id:v,name:c.team,isConnected:!0,liveRank:f+1,totalRank:k.get(v)||"-",piEstimate:E?c.piEst.toFixed(5):"-",error:E?Math.abs(c.piEst-Math.PI).toFixed(6):"-",drops:(c.drops||0).toLocaleString(),hits:(c.hits||0).toLocaleString(),misses:Math.max(0,(c.drops||0)-(c.hits||0)).toLocaleString(),roundPoints:o?"-":j>0?(T.get(v)||0).toLocaleString():"-",totalPoints:(w.get(v)||0).toLocaleString()}}));const C=new Map;r.forEach((c,f)=>{const v=A(c),E=L.has(v)?L.get(v):null;C.set(v,E===null?null:E-f)});const S=new Map;p.forEach((c,f)=>{const v=A(c),E=x.has(v)?x.get(v):null;S.set(v,E===null?null:E-f)}),n.innerHTML=r.map((c,f)=>{const v=A(c),E=C.get(v),F=et(c),h=F?Math.abs(c.piEst-Math.PI).toFixed(6):"β€”",P=F?c.piEst.toFixed(5):"β€”",O=Math.max(0,(c.drops||0)-(c.hits||0));return`
      <div class="board-row live-board-row${F?E>0?" rank-up":E<0?" rank-down":"":" pending"}">
        <span class="rank" style="color:${F?vt(f):"#64748b"}">${f+1}</span>
        <span class="team-name">${bt(c.team)}</span>
        <span class="pi-val">${P}</span>
        <span class="err-val">${h}</span>
        <span class="drops-val">${(c.drops||0).toLocaleString()}</span>
        <span class="hits-val">${(c.hits||0).toLocaleString()}</span>
        <span class="miss-val">${O.toLocaleString()}</span>
      </div>`}).join(""),i.innerHTML=p.map((c,f)=>{const v=A(c),E=S.get(v),F=o?"β€”":j>0?(T.get(v)||0).toLocaleString():"β€”",h=(w.get(v)||0).toLocaleString();return`
      <div class="board-row score-board-row${E>0?" rank-up":E<0?" rank-down":""}${!o&&v&&v===H?" round-winner":""}">
        <span class="rank" style="color:#60a5fa">${f+1}</span>
        <span class="team-name">${bt(c.team)}</span>
        <span class="round-points-val">${F}</span>
        <span class="total-points-val">${h}</span>
      </div>`}).join(""),I=r,Tt(r),ct(),L=new Map(r.map((c,f)=>[A(c),f])),x=new Map(p.map((c,f)=>[A(c),f]))}function bt(n){return String(n||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function vt(n){const i=["#fbbf24","#94a3b8","#cd7c3a","#3b82f6","#a78bfa","#f87171","#34d399","#f97316","#38bdf8","#e879f9"];return i[n%i.length]}function Tt(n){const i=new Set(n.map(A));for(const l of Array.from(e.keys()))i.has(l)||e.delete(l);n.forEach(l=>{const r=A(l),p=typeof l.drops=="number"?l.drops:0;if(p<=0){e.set(r,[]);return}if(!et(l))return;const k=l.piEst,C=e.get(r)||[],S=C[C.length-1];if(!S||p>S.n||Math.abs(k-S.pi)>1e-12)if(C.push({n:p,pi:k}),C.length>500){const c=Math.ceil(C.length/500);e.set(r,C.filter((f,v)=>v%c===0))}else e.set(r,C)})}function ct(){const n=document.getElementById("teacher-chart-body");if(!n.classList.contains("open"))return;const i=Math.max(340,n.clientWidth-4),l=172;Q.width=i,Q.height=l;const r={top:10,right:18,bottom:30,left:40},p=i-r.left-r.right,k=l-r.top-r.bottom;s.clearRect(0,0,i,l),s.fillStyle="#141720",s.beginPath(),s.roundRect(0,0,i,l,6),s.fill();const C=I.filter(et).map((h,P)=>{const O=A(h),t=(e.get(O)||[]).filter(d=>d.n>0);return{rank:P+1,team:String(h.team||""),color:vt(P),points:t}}).filter(h=>h.points.length>0);if(!C.length){s.fillStyle="#64748b",s.font="12px Courier New",s.textAlign="center",s.fillText(a("noEstimates"),i/2,l/2);return}let S=10;C.forEach(h=>{h.points.forEach(P=>{P.n>S&&(S=P.n)})});const c=h=>r.left+h/S*p,f=h=>r.top+(1-(h-D)/(nt-D))*k;s.save(),s.beginPath(),s.rect(r.left,r.top,p,k),s.clip(),s.strokeStyle="#2d3348",s.lineWidth=.8,s.setLineDash([]),[1.5,2,2.5,3,3.5,4,4.5,5].forEach(h=>{s.beginPath(),s.moveTo(r.left,f(h)),s.lineTo(r.left+p,f(h)),s.stroke()});const v=f(Math.PI);s.strokeStyle="#fbbf24",s.lineWidth=1.2,s.setLineDash([4,4]),s.beginPath(),s.moveTo(r.left,v),s.lineTo(r.left+p,v),s.stroke(),s.setLineDash([]),C.forEach(h=>{s.strokeStyle=h.color,s.lineWidth=1.6,s.beginPath(),h.points.forEach((O,t)=>{const d=c(O.n),u=f(O.pi);t===0?s.moveTo(d,u):s.lineTo(d,u)}),s.stroke();const P=h.points[h.points.length-1];s.fillStyle=h.color,s.beginPath(),s.arc(c(P.n),f(P.pi),2.8,0,Math.PI*2),s.fill()}),s.restore(),s.fillStyle="#fbbf24",s.font="9px Courier New",s.textAlign="left",s.fillText("Ο€",r.left+p+3,v+3),s.strokeStyle="#475569",s.lineWidth=1,s.beginPath(),s.moveTo(r.left,r.top),s.lineTo(r.left,r.top+k),s.lineTo(r.left+p,r.top+k),s.stroke(),s.fillStyle="#475569",s.font="9px Courier New",s.textAlign="right",[1.5,2,2.5,3,3.5,4,4.5,5].forEach(h=>{s.fillText(h.toFixed(1),r.left-4,f(h)+3)}),s.textAlign="center";for(let h=0;h<=5;h++){const P=Math.round(S*h/5),O=P>=1e3?`${Math.round(P/1e3)}k`:P;s.fillText(O,c(P),r.top+k+14)}s.fillText(a("drops"),r.left+p/2,l-4);let E=r.left,F=r.top+12;s.font="9px Courier New",s.textAlign="left",C.slice(0,8).forEach(h=>{s.fillStyle=h.color,s.fillRect(E,F-7,8,8),s.fillStyle="#94a3b8",s.fillText(`#${h.rank} ${h.team}`,E+12,F),F+=12})}st(),ot(),U(a("initialTeacherStatus"),"idle");const kt=()=>{U(o?a("roundStarted",{round:j}):m?.isConnected()?a("teacherConnected"):a("student.disconnected"),o?"active":"idle"),st()};window.StrobeI18n?.on("languageChanged",kt),tt(),window.addEventListener("resize",ct);const G={startRoundFromTeacher:Rt,stopRoundManually:It,resetTournamentScores:At,updateRoundControlLabels:st,drawBuffonTeacherChart:ct};return Object.assign(window,G),()=>{at(),m&&typeof m.stop=="function"&&m.stop(),window.removeEventListener("resize",ct),window.StrobeI18n?.off("languageChanged",kt),Object.keys(G).forEach(n=>{window[n]===G[n]&&delete window[n]})}}function ee({role:a="teacher"}){const y=Lt.useRef(null),m=Lt.useRef(null),{t:b}=$t("buffon"),{t:L}=$t("navigation"),[x,I]=Xt.useState([]);return Lt.useEffect(()=>{const e=y.current;if(!e)return;a==="student"?(e.innerHTML=Dt,m.current&&(m.current.innerHTML="")):(e.innerHTML=Dt,m.current&&(m.current.innerHTML=Qt)),Bt(e,a==="teacher"?"student":a,b,!0,m.current),a==="teacher"&&Bt(e,"teacher",b,!0,m.current);const w=a==="student"?[Ft(e,Pt)]:[Ft(e,Pt,{localOnly:!0}),Zt(Pt,I)];return window.MathJax&&typeof window.MathJax.typesetPromise=="function"&&window.MathJax.typesetPromise([e]).catch(()=>{}),()=>{w.forEach(T=>{typeof T=="function"&&T()}),e.innerHTML="",m.current&&(m.current.innerHTML="")}},[a]),Lt.useEffect(()=>{y.current&&(Bt(y.current,a==="teacher"?"student":a,b,!1,m.current),a==="teacher"&&Bt(y.current,"teacher",b,!1,m.current))},[a,b]),q.jsxs(q.Fragment,{children:[q.jsx(Ot,{title:`${L("items.buffon")} - ${b(a==="student"?"studentTitle":"teacherTitle")}`}),q.jsxs("section",{className:"common-zone lab-zone",children:[q.jsx(zt,{}),q.jsx("div",{ref:y,className:`buffon-content ${a==="teacher"?"student teacher-preview":"student"}`})]}),a==="teacher"?q.jsxs(q.Fragment,{children:[q.jsx(Kt,{children:q.jsx("div",{ref:m,className:"buffon-settings-host buffon-content teacher"})}),q.jsx(Ut,{title:b("standings"),participants:x,columns:[{key:"liveRank",label:b("liveRank"),render:e=>e.liveRank},{key:"totalRank",label:b("totalRank"),render:e=>e.totalRank},{key:"estimate",label:b("estimate"),render:e=>e.piEstimate},{key:"error",label:b("error"),render:e=>e.error},{key:"drops",label:b("drops"),render:e=>e.drops},{key:"hits",label:b("hits"),render:e=>e.hits},{key:"misses",label:b("misses"),render:e=>e.misses},{key:"roundPoints",label:b("roundPoints"),render:e=>e.roundPoints},{key:"totalPoints",label:b("total"),render:e=>e.totalPoints}],emptyMessage:b("noTeams")}),q.jsx(Jt,{title:b("student.chart"),className:"chart-wrap",onToggle:e=>{e&&window.requestAnimationFrame(()=>window.drawBuffonTeacherChart?.())},children:q.jsx("div",{id:"teacher-chart-body",className:"chart-body open",children:q.jsx("canvas",{id:"teacher-chart-cv"})})})]}):null,q.jsx(Gt,{})]})}function Bt(a,y,m,b=!1,L=null){const x=(I,e,w)=>{const T=L?.querySelector(I)||a.querySelector(I);T&&(T.textContent=m(e,w))};if(y==="student"){b&&x(".round-banner","student.waiting"),x(".vspinner:first-child .lbl","student.needleLength"),x(".vspinner:last-child .lbl","student.lineSpacing"),x(".step-col .lbl","student.stepLabel");const I=Number.parseInt(a.querySelector("#step-val")?.textContent,10)||1;x("#step-btn","student.stepButton",{count:I}),x(".auto-lbl","student.automatic"),x(".btn-danger","student.reset");const e=a.querySelectorAll(".vspinner .range-labels");e[0]&&(e[0].textContent="10-120"),e[1]&&(e[1].textContent="30-150"),x('[data-accordion-id="student-formula"] .c-lbl',"student.formula"),x('[data-accordion-id="student-chart"] .c-lbl',"student.chart");const w=a.querySelectorAll(".canvas-footer > span");w[0]&&(w[0].textContent=m("student.hit")),w[1]&&(w[1].textContent=m("student.miss"));const T=a.querySelectorAll(".stat-box .s-lbl");["student.estimateError","hits","misses","drops"].forEach((j,o)=>{T[o+1]&&(T[o+1].textContent=m(j))})}else{const I=(L||a).querySelectorAll(".round-control .lbl");I[0]&&(I[0].textContent=m("roundDuration")),I[1]&&(I[1].textContent=m("targetError"));const e=m("seconds"),w=(L||a).querySelectorAll(".round-control .scale span");w[0]&&(w[0].textContent=`20 ${e}`),w[1]&&(w[1].textContent=`120 ${e}`),x("#round-start-btn","startRound"),x("#round-stop-btn","stopRound"),x("#round-reset-btn","resetScores"),b&&(x("#round-status","initialTeacherStatus"),x("#round-info","round"))}}function Pt(a,y={}){return window.StrobeI18n.t(a,{ns:"buffon",...y})}export{ee as A};
