// ── Landing Page — Voice Agent + WebGL Orb (Saffron Edition) ─────────
import { navigate } from '../router.js';
import { Renderer, Program, Mesh, Triangle, Vec3 } from 'ogl';

// ── Backend API URL ──
const API_URL = 'http://localhost:8000';

// ── Voice session state ──
let room = null;
let pendingAudio = null;
let isConnected = false;

// ── WebGL Orb Shaders ──
const VERT = `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  uniform float iTime;
  uniform vec3 iResolution;
  uniform float hue;
  uniform float hover;
  uniform float rot;
  uniform float hoverIntensity;
  varying vec2 vUv;

  vec3 rgb2yiq(vec3 c) {
    float y = dot(c, vec3(0.299, 0.587, 0.114));
    float i = dot(c, vec3(0.596, -0.274, -0.322));
    float q = dot(c, vec3(0.211, -0.523, 0.312));
    return vec3(y, i, q);
  }
  vec3 yiq2rgb(vec3 c) {
    float r = c.x + 0.956 * c.y + 0.621 * c.z;
    float g = c.x - 0.272 * c.y - 0.647 * c.z;
    float b = c.x - 1.106 * c.y + 1.703 * c.z;
    return vec3(r, g, b);
  }
  vec3 adjustHue(vec3 color, float hueDeg) {
    float hueRad = hueDeg * 3.14159265 / 180.0;
    vec3 yiq = rgb2yiq(color);
    float cosA = cos(hueRad);
    float sinA = sin(hueRad);
    float i2 = yiq.y * cosA - yiq.z * sinA;
    float q2 = yiq.y * sinA + yiq.z * cosA;
    yiq.y = i2; yiq.z = q2;
    return yiq2rgb(yiq);
  }
  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(p3.x+p3.y, p3.x+p3.z, p3.y+p3.z) * p3.zyx);
  }
  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x+p.y+p.z)*K1);
    vec3 d0 = p - (i - (i.x+i.y+i.z)*K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e*(1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy*(1.0-e);
    vec3 d1 = d0 - (i1-K2);
    vec3 d2 = d0 - (i2-K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)), 0.0);
    vec4 n = h*h*h*h * vec4(dot(d0,hash33(i)),dot(d1,hash33(i+i1)),dot(d2,hash33(i+i2)),dot(d3,hash33(i+1.0)));
    return dot(vec4(31.316), n);
  }
  vec4 extractAlpha(vec3 colorIn) {
    float a = max(max(colorIn.r, colorIn.g), colorIn.b);
    return vec4(colorIn.rgb / (a+1e-5), a);
  }
  const vec3 baseColor1 = vec3(1.0, 0.65, 0.15);
  const vec3 baseColor2 = vec3(0.95, 0.45, 0.05);
  const vec3 baseColor3 = vec3(0.55, 0.18, 0.02);
  const float innerRadius = 0.6;
  const float noiseScale = 0.65;

  float light1(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * attenuation);
  }
  float light2(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * dist * attenuation);
  }
  vec4 draw(vec2 uv) {
    vec3 color1 = adjustHue(baseColor1, hue);
    vec3 color2 = adjustHue(baseColor2, hue);
    vec3 color3 = adjustHue(baseColor3, hue);
    float ang = atan(uv.y, uv.x);
    float len = length(uv);
    float invLen = len > 0.0 ? 1.0/len : 0.0;
    float n0 = snoise3(vec3(uv*noiseScale, iTime*0.5))*0.5+0.5;
    float r0 = mix(mix(innerRadius,1.0,0.4), mix(innerRadius,1.0,0.6), n0);
    float d0 = distance(uv, (r0*invLen)*uv);
    float v0 = light1(1.0, 10.0, d0);
    v0 *= smoothstep(r0*1.05, r0, len);
    float cl = cos(ang + iTime*2.0)*0.5+0.5;
    float a = iTime * -1.0;
    vec2 pos = vec2(cos(a), sin(a)) * r0;
    float d = distance(uv, pos);
    float v1 = light2(1.5, 5.0, d);
    v1 *= light1(1.0, 50.0, d0);
    float v2 = smoothstep(1.0, mix(innerRadius,1.0,n0*0.5), len);
    float v3 = smoothstep(innerRadius, mix(innerRadius,1.0,0.5), len);
    vec3 col = mix(color1, color2, cl);
    col = mix(color3, col, v0);
    col = (col + v1) * v2 * v3;
    col = clamp(col, 0.0, 1.0);
    return extractAlpha(col);
  }
  vec4 mainImage(vec2 fragCoord) {
    vec2 center = iResolution.xy * 0.5;
    float size = min(iResolution.x, iResolution.y);
    vec2 uv = (fragCoord - center) / size * 2.0;
    float angle = rot;
    float s = sin(angle); float c = cos(angle);
    uv = vec2(c*uv.x - s*uv.y, s*uv.x + c*uv.y);
    uv.x += hover * hoverIntensity * 0.1 * sin(uv.y*10.0 + iTime);
    uv.y += hover * hoverIntensity * 0.1 * sin(uv.x*10.0 + iTime);
    return draw(uv);
  }
  void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec4 col = mainImage(fragCoord);
    gl_FragColor = vec4(col.rgb * col.a, col.a);
  }
`;

// ── Orb state ──
let orbProgram = null;
let orbRenderer = null;
let orbRafId = null;
let orbVoiceLevel = 0;

function initOrb(container) {
  if (!container) return null;
  try {
    orbRenderer = new Renderer({ alpha: true, premultipliedAlpha: false, antialias: true, dpr: window.devicePixelRatio || 1 });
    var gl = orbRenderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(gl.canvas);

    var geometry = new Triangle(gl);
    orbProgram = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        hue: { value: 8 },   // 🔶 Saffron: warm orange (25–30° on colour wheel)
        hover: { value: 0.3 },  // 🔶 Slight base activation for richer colour at idle
        rot: { value: 0 },
        hoverIntensity: { value: 0.15 }, // 🔶 Subtle base glow so saffron reads even when quiet
      },
    });
    var mesh = new Mesh(gl, { geometry: geometry, program: orbProgram });

    function resize() {
      if (!container || !orbRenderer) return;
      var dpr = window.devicePixelRatio || 1;
      var w = container.clientWidth;
      var h = container.clientHeight;
      if (w === 0 || h === 0) return;
      orbRenderer.setSize(w * dpr, h * dpr);
      gl.canvas.style.width = w + 'px';
      gl.canvas.style.height = h + 'px';
      if (orbProgram) {
        orbProgram.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
      }
    }
    window.addEventListener('resize', resize);
    resize();

    var lastTime = 0;
    var currentRot = 0;
    var baseRotSpeed = 0.3;

    function update(t) {
      orbRafId = requestAnimationFrame(update);
      if (!orbProgram) return;
      var dt = (t - lastTime) * 0.001;
      lastTime = t;
      orbProgram.uniforms.iTime.value = t * 0.001;

      // Voice level drives rotation + distortion
      var speed = baseRotSpeed + (orbVoiceLevel * 2.4);
      if (orbVoiceLevel > 0.05) {
        currentRot += dt * speed;
      } else {
        currentRot += dt * baseRotSpeed * 0.5; // Idle gentle rotation
      }
      orbProgram.uniforms.rot.value = currentRot;

      // 🔶 Floor at 0.3/0.15 so the saffron colour is always visible even at silence
      orbProgram.uniforms.hover.value = Math.min(0.3 + orbVoiceLevel * 2.0, 1.0);
      orbProgram.uniforms.hoverIntensity.value = Math.min(0.15 + orbVoiceLevel * 0.64, 0.8);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      orbRenderer.render({ scene: mesh });
    }
    orbRafId = requestAnimationFrame(update);

    return function cleanup() {
      cancelAnimationFrame(orbRafId);
      window.removeEventListener('resize', resize);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      orbRenderer = null;
      orbProgram = null;
    };
  } catch (e) {
    console.error('Orb init error:', e);
    return null;
  }
}

export function landingPage(app) {
  app.innerHTML = `
  <div class="flex flex-col min-h-screen">
    <!-- TopNavBar -->
    <header class="bg-[#000e25] shadow-[0_32px_0_0_rgba(0,14,37,0.06)] flex justify-between items-center w-full px-8 py-4 fixed top-0 z-50">
      <div class="flex items-center gap-8">
        <span class="text-2xl font-black tracking-tighter text-[#ff9933] uppercase">NARAD AI</span>
        <nav class="hidden md:flex gap-6 items-center">
          <a class="tracking-tight text-[#ff9933] border-b-2 border-[#ff9933] pb-1 transition-colors duration-200 cursor-pointer">Voice Agent</a>
          <a href="#/notices" class="tracking-tight text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Notices</a>
          <a href="#/complaints" class="tracking-tight text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Complaints</a>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <button id="admin-btn" class="bg-primary-container text-on-primary-container px-5 py-2 rounded-lg font-bold text-sm tracking-tight hover:bg-primary transition-all active:scale-95 duration-150">
          ADMIN ACCESS
        </button>
        <span class="material-symbols-outlined text-[#d6e3ff] cursor-pointer hover:text-[#ff9933]">notifications</span>
        <span class="material-symbols-outlined text-[#d6e3ff] cursor-pointer hover:text-[#ff9933]">account_circle</span>
      </div>
    </header>

    <!-- Main Split Layout -->
    <main class="flex-grow pt-20 flex flex-col lg:flex-row w-full min-h-[calc(100vh-80px)]">

      <!-- ═══════ LEFT PANEL — WebGL Orb + Controls ═══════ -->
      <div class="lg:w-[45%] w-full flex flex-col items-center justify-center px-8 py-10 relative">
        <!-- Ambient glow behind orb -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-[500px] h-[500px] bg-[#ff9933]/10 blur-[120px] rounded-full"></div>
        </div>

        <!-- ═══ USER INFO FORM (shown first) ═══ -->
        <div id="user-form-panel" class="relative z-10 w-full max-w-sm">
          <div class="text-center mb-8">
            <span class="bg-tertiary-container/10 text-tertiary px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-tertiary/20">
              Sovereign Voice Channel
            </span>
            <h1 class="text-4xl md:text-5xl font-black tracking-tighter mt-4 text-on-surface uppercase leading-tight">
              Direct <span class="text-primary-container">Governance</span>
            </h1>
            <p class="text-sm text-on-surface-variant max-w-sm mt-2 leading-relaxed">
              Enter your details to start a session with Narad AI.
            </p>
          </div>

          <div class="glass-panel border border-outline-variant/10 rounded-xl p-8">
            <div class="space-y-5">
              <div class="space-y-1.5">
                <label class="block text-[10px] font-bold text-primary/80 uppercase tracking-widest" for="user-name">Name</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-sm text-on-surface-variant group-focus-within:text-primary transition-colors">person</span>
                  </div>
                  <input class="block w-full pl-11 pr-4 py-3 bg-surface-container-highest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 focus:bg-surface-bright transition-all" id="user-name" placeholder="Your full name" type="text" required>
                  <div class="absolute bottom-0 left-0 h-0.5 bg-primary-container w-0 group-focus-within:w-full transition-all duration-300"></div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[10px] font-bold text-primary/80 uppercase tracking-widest" for="user-phone">Phone Number</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-sm text-on-surface-variant group-focus-within:text-primary transition-colors">phone</span>
                  </div>
                  <input class="block w-full pl-11 pr-4 py-3 bg-surface-container-highest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 focus:bg-surface-bright transition-all" id="user-phone" placeholder="10-digit mobile number" type="tel" required>
                  <div class="absolute bottom-0 left-0 h-0.5 bg-primary-container w-0 group-focus-within:w-full transition-all duration-300"></div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[10px] font-bold text-primary/80 uppercase tracking-widest" for="user-village">Village / Area</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-sm text-on-surface-variant group-focus-within:text-primary transition-colors">location_on</span>
                  </div>
                  <input class="block w-full pl-11 pr-4 py-3 bg-surface-container-highest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 focus:bg-surface-bright transition-all" id="user-village" placeholder="Village or area name" type="text" required>
                  <div class="absolute bottom-0 left-0 h-0.5 bg-primary-container w-0 group-focus-within:w-full transition-all duration-300"></div>
                </div>
              </div>

              <button id="start-session-btn" class="saffron-gradient w-full py-4 rounded-lg font-black text-sm tracking-widest uppercase text-on-primary-container shadow-xl shadow-primary-container/10 hover:shadow-primary-container/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2">
                <span class="material-symbols-outlined text-lg">mic</span>
                Start Session
                <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ VOICE PANEL (hidden until form submitted) ═══ -->
        <div id="voice-panel" class="hidden relative z-10 flex flex-col items-center">
          <!-- Title -->
          <div class="text-center mb-8">
            <span class="bg-tertiary-container/10 text-tertiary px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-tertiary/20">
              Sovereign Voice Channel
            </span>
            <h1 class="text-4xl md:text-5xl font-black tracking-tighter mt-4 text-on-surface uppercase leading-tight">
              Direct <span class="text-primary-container">Governance</span>
            </h1>
            <p class="text-sm text-on-surface-variant max-w-sm mt-2 leading-relaxed">
              Real-time vocal interaction with Narad AI.
            </p>
          </div>

          <!-- WebGL Orb Container -->
          <div>
            <div id="orb-container" class="w-64 h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-2xl shadow-[#ff9933]/20 border border-[#ff993330]" style="background: radial-gradient(circle, #1a0800 0%, transparent 70%);">
            </div>
          </div>

          <!-- Voice Controls -->
          <div class="flex flex-col items-center gap-4 mt-8">
            <button id="voice-btn" class="group flex items-center gap-3 bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ff9933]/30 active:scale-95">
              <span id="voice-icon" class="material-symbols-outlined !text-2xl">mic</span>
              <span id="voice-label">Speak to Narad</span>
            </button>

            <button id="end-btn" class="hidden items-center gap-2 bg-transparent border-2 border-error/40 text-error px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-error/10 hover:border-error transition-all duration-200 cursor-pointer z-50" style="pointer-events: auto;">
              <span class="material-symbols-outlined !text-lg">call_end</span>
              <span>End Session</span>
            </button>

            <button id="unmute-btn" class="hidden items-center gap-2 bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-bold text-sm animate-pulse">
              <span class="material-symbols-outlined">volume_up</span>
              Tap to hear Narad
            </button>

            <!-- Status -->
            <div class="flex items-center gap-3 mt-2">
              <div id="waveform" class="flex gap-[3px] opacity-30">
                <div class="w-[3px] h-4 bg-primary-container rounded-full animate-pulse"></div>
                <div class="w-[3px] h-7 bg-primary-container rounded-full animate-pulse" style="animation-delay:75ms"></div>
                <div class="w-[3px] h-10 bg-primary-container rounded-full animate-pulse" style="animation-delay:150ms"></div>
                <div class="w-[3px] h-6 bg-primary-container rounded-full animate-pulse" style="animation-delay:100ms"></div>
                <div class="w-[3px] h-8 bg-primary-container rounded-full animate-pulse" style="animation-delay:200ms"></div>
              </div>
              <span id="voice-status" class="text-xs font-bold tracking-tight text-primary uppercase">Connecting...</span>
            </div>

            <!-- Session Meta (compact) -->
            <div class="mt-4 flex items-center gap-6 text-[10px] text-on-surface-variant/50">
              <div class="flex items-center gap-1.5">
                <span id="backend-dot" class="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
                <span id="backend-status">Checking...</span>
              </div>
              <div>Room: <span id="session-room" class="text-on-surface font-bold">—</span></div>
              <div>ID: <span id="session-user" class="text-on-surface font-bold">—</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════ RIGHT PANEL — Conversation + Info ═══════ -->
      <div class="lg:w-[55%] w-full flex flex-col border-l border-[#554336]/10 bg-surface-container-low/50">

        <!-- Session Live Feed -->
        <div class="flex-grow flex flex-col p-6 lg:p-8">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary-container text-lg">history_edu</span>
              <h2 class="text-xs font-black tracking-[0.2em] uppercase text-on-surface">Session Live Feed</h2>
            </div>
            <span id="channel-status" class="text-[10px] text-on-surface-variant/40 flex items-center gap-1.5 font-bold">
              <span id="channel-dot" class="w-2 h-2 bg-on-surface-variant/30 rounded-full"></span> AWAITING CONNECTION
            </span>
          </div>

          <div id="transcript-area" class="flex-grow space-y-5 overflow-y-auto pr-2 max-h-[calc(100vh-320px)]" style="scrollbar-width: thin; scrollbar-color: #ff993330 transparent;">
            <!-- Empty state -->
            <div id="empty-transcript" class="flex flex-col items-center justify-center h-full opacity-20">
              <span class="material-symbols-outlined text-5xl text-on-surface-variant mb-4">mic_none</span>
              <p class="text-sm text-on-surface-variant text-center max-w-xs leading-relaxed">
                Click the voice button to start a live conversation with Narad AI
              </p>
            </div>
          </div>
        </div>

        <!-- Bottom Info Bar -->
        <div class="border-t border-[#554336]/10 p-6 lg:px-8">
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-surface-bright/50 rounded-xl p-4 border-l-2 border-primary-container">
              <p class="text-[9px] text-outline-variant font-black uppercase tracking-widest mb-1">Status</p>
              <p id="session-status-badge" class="text-sm font-bold text-on-surface">Idle</p>
            </div>
            <div class="bg-surface-bright/50 rounded-xl p-4">
              <p class="text-[9px] text-outline-variant font-black uppercase tracking-widest mb-1">Active Queries</p>
              <p class="text-sm font-bold text-on-surface">1,402 <span class="text-tertiary text-[10px]">+12%</span></p>
            </div>
            <div class="bg-surface-bright/50 rounded-xl p-4">
              <p class="text-[9px] text-outline-variant font-black uppercase tracking-widest mb-1">Region</p>
              <p class="text-sm font-bold text-on-surface">India South</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  </div>
  `;

  // ── DOM References ──
  var userFormPanel = document.getElementById('user-form-panel');
  var voicePanel = document.getElementById('voice-panel');
  var startSessionBtn = document.getElementById('start-session-btn');
  var voiceBtn = document.getElementById('voice-btn');
  var voiceIcon = document.getElementById('voice-icon');
  var voiceLabel = document.getElementById('voice-label');
  var voiceStatus = document.getElementById('voice-status');
  var waveform = document.getElementById('waveform');
  var endBtn = document.getElementById('end-btn');
  var unmuteBtn = document.getElementById('unmute-btn');
  var channelStat = document.getElementById('channel-status');
  var transcArea = document.getElementById('transcript-area');
  var emptyTransc = document.getElementById('empty-transcript');
  var sessionBadge = document.getElementById('session-status-badge');
  var sessionRoom = document.getElementById('session-room');
  var sessionUser = document.getElementById('session-user');
  var backendDot = document.getElementById('backend-dot');
  var backendBadge = document.getElementById('backend-status');
  var orbContainer = document.getElementById('orb-container');

  // ── User info storage ──
  var userInfo = { name: '', phone: '', village: '' };
  var sessionComplaintId = null;
  var cleanupOrb = null;

  // ── Start Session (form submit) ──
  startSessionBtn.addEventListener('click', function () {
    var name = document.getElementById('user-name').value.trim();
    var phone = document.getElementById('user-phone').value.trim();
    var village = document.getElementById('user-village').value.trim();
    if (!name || !phone || !village) {
      alert('Please fill in all fields.');
      return;
    }
    userInfo = { name: name, phone: phone, village: village };
    // Switch panels
    userFormPanel.classList.add('hidden');
    voicePanel.classList.remove('hidden');
    // Init orb now that container is visible
    cleanupOrb = initOrb(orbContainer);
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 100);
    // Auto-connect voice
    connectVoice();
  });

  // ── Admin Access ──
  document.getElementById('admin-btn').addEventListener('click', function () {
    if (room) disconnectVoice();
    navigate('/login');
  });

  // ── Health check ──
  checkBackendHealth();

  async function checkBackendHealth() {
    try {
      var res = await fetch(API_URL + '/health');
      var data = await res.json();
      if (data.status === 'ok') {
        backendBadge.textContent = 'Online';
        backendDot.className = 'w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse';
      } else {
        backendBadge.textContent = 'Error';
        backendDot.className = 'w-1.5 h-1.5 rounded-full bg-error';
      }
    } catch (e) {
      backendBadge.textContent = 'Offline';
      backendDot.className = 'w-1.5 h-1.5 rounded-full bg-error';
    }
  }

  // ── Visual state helpers ──
  function setOrbState(state) {
    switch (state) {
      case 'idle':
        voiceIcon.textContent = 'mic';
        voiceLabel.textContent = 'Speak to Narad';
        voiceStatus.textContent = 'Click to start';
        voiceBtn.className = 'group flex items-center gap-3 bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ff9933]/30 active:scale-95';
        voiceBtn.disabled = false;
        waveform.style.opacity = '0.3';
        endBtn.classList.add('hidden');
        endBtn.classList.remove('flex');
        channelStat.innerHTML = '<span class="w-2 h-2 bg-on-surface-variant/30 rounded-full"></span> AWAITING CONNECTION';
        sessionBadge.textContent = 'Idle';
        sessionBadge.className = 'text-sm font-bold text-on-surface';
        orbVoiceLevel = 0;
        break;

      case 'connecting':
        voiceIcon.textContent = 'progress_activity';
        voiceIcon.classList.add('animate-spin');
        voiceLabel.textContent = 'Connecting...';
        voiceStatus.textContent = 'Requesting channel...';
        voiceBtn.disabled = true;
        voiceBtn.className = 'group flex items-center gap-3 bg-gradient-to-r from-primary/50 to-primary-container/50 text-on-primary-container/70 px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase cursor-wait';
        sessionBadge.textContent = 'Connecting';
        sessionBadge.className = 'text-sm font-bold text-primary-container';
        break;

      case 'listening':
        voiceIcon.classList.remove('animate-spin');
        voiceIcon.textContent = 'mic';
        voiceLabel.textContent = 'Listening...';
        voiceStatus.textContent = '🎙️ Speak now';
        voiceBtn.disabled = true;
        voiceBtn.className = 'group flex items-center gap-3 bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase';
        waveform.style.opacity = '1';
        endBtn.classList.remove('hidden');
        endBtn.classList.add('flex');
        channelStat.innerHTML = '<span class="w-2 h-2 bg-tertiary rounded-full animate-pulse"></span> ENCRYPTED CHANNEL';
        sessionBadge.textContent = 'Live';
        sessionBadge.className = 'text-sm font-bold text-tertiary';
        orbVoiceLevel = 0.05;
        break;

      case 'speaking':
        voiceIcon.classList.remove('animate-spin');
        voiceIcon.textContent = 'graphic_eq';
        voiceLabel.textContent = 'Narad Speaking';
        voiceStatus.textContent = 'Responding...';
        voiceBtn.className = 'group flex items-center gap-3 bg-gradient-to-r from-[#ffc08d] to-[#ff9933] text-[#1a0800] px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase scale-105 shadow-lg shadow-[#ff9933]/40';
        waveform.style.opacity = '1';
        orbVoiceLevel = 0.7;
        break;

      case 'error':
        voiceIcon.classList.remove('animate-spin');
        voiceIcon.textContent = 'error_outline';
        voiceLabel.textContent = 'Error';
        voiceBtn.disabled = false;
        sessionBadge.textContent = 'Error';
        sessionBadge.className = 'text-sm font-bold text-error';
        orbVoiceLevel = 0;
        break;
    }
  }

  // ── Add a transcript message ──
  var messageCounter = 0;
  function addTranscript(text, sender) {
    if (!text || !text.trim()) return;
    if (emptyTransc && emptyTransc.parentNode) emptyTransc.remove();

    messageCounter++;
    var div = document.createElement('div');
    div.id = 'msg-' + messageCounter;

    if (sender === 'user') {
      div.className = 'flex gap-4 items-start';
      div.innerHTML =
        '<div class="flex-shrink-0 w-8 h-8 bg-surface-bright rounded-lg flex items-center justify-center mt-1">' +
        '<span class="material-symbols-outlined text-on-surface text-base">person</span>' +
        '</div>' +
        '<div>' +
        '<span class="text-[9px] font-bold text-outline-variant tracking-widest uppercase block mb-1">Citizen</span>' +
        '<p class="text-on-surface text-sm font-light leading-relaxed">"' + text + '"</p>' +
        '</div>';
    } else if (sender === 'system') {
      div.className = 'flex items-center gap-2 py-2';
      div.innerHTML =
        '<span class="material-symbols-outlined text-on-surface-variant/30 text-sm">info</span>' +
        '<span class="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">' + text + '</span>';
    } else {
      div.className = 'flex gap-4 items-start flex-row-reverse text-right';
      div.innerHTML =
        '<div class="flex-shrink-0 w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center mt-1">' +
        '<span class="material-symbols-outlined text-on-primary-container text-base">token</span>' +
        '</div>' +
        '<div>' +
        '<span class="text-[9px] font-bold text-primary-container tracking-widest uppercase block mb-1">Narad AI</span>' +
        '<p class="text-[#ffc08d] text-sm font-semibold leading-relaxed">"' + text + '"</p>' +
        '</div>';
    }

    transcArea.appendChild(div);
    transcArea.scrollTop = transcArea.scrollHeight;
    return div;
  }

  // ── Connect to LiveKit voice agent ──
  async function connectVoice() {
    if (isConnected) return;
    setOrbState('connecting');

    var token, wsUrl, userId, roomName;
    try {
      var res = await fetch(API_URL + '/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: 'narad-room', user_name: userInfo.name, user_phone: userInfo.phone, user_village: userInfo.village }),
      });
      var data = await res.json();
      token = data.token;
      wsUrl = data.livekit_url;
      userId = data.user_id;
      roomName = data.room_name;
      sessionRoom.textContent = roomName || '—';
      sessionUser.textContent = userId || '—';
    } catch (e) {
      voiceStatus.textContent = 'Backend unreachable';
      setOrbState('error');
      setTimeout(function () { setOrbState('idle'); }, 3000);
      return;
    }

    try {
      room = new LivekitClient.Room({
        adaptiveStream: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      room.on(LivekitClient.RoomEvent.Connected, async function () {
        console.log('[NARAD] Room connected');
        isConnected = true;
        setOrbState('listening');
        addTranscript('Voice session connected.', 'system');
        await room.localParticipant.setMicrophoneEnabled(true);

        // Attach pre-existing tracks
        room.remoteParticipants.forEach(function (p) {
          p.trackPublications.forEach(function (pub) {
            if (pub.track && pub.kind === 'audio') {
              attachAgentAudio(pub.track);
            }
          });
        });
      });

      room.on(LivekitClient.RoomEvent.Disconnected, function () {
        isConnected = false;
        room = null;
        setOrbState('idle');
        addTranscript('Session ended.', 'system');
      });

      room.on(LivekitClient.RoomEvent.ParticipantConnected, function (p) {
        if (!p.isLocal) {
          console.log('[NARAD] Agent joined:', p.identity);
          addTranscript('Narad has joined.', 'system');
        }
      });

      room.on(LivekitClient.RoomEvent.TrackSubscribed, function (track, pub, participant) {
        console.log('[NARAD] TrackSubscribed:', track.kind, 'from:', participant.identity);
        if (track.kind === 'audio' && !participant.isLocal) {
          attachAgentAudio(track);
        }
      });

      room.on(LivekitClient.RoomEvent.TrackUnsubscribed, function (track) {
        if (track.kind === 'audio') {
          track.detach();
          setOrbState('listening');
        }
      });

      // Transcription
      var lastSender = null;
      var lastEl = null;
      room.on(LivekitClient.RoomEvent.TranscriptionReceived, function (segments, participant) {
        var text = segments.map(function (s) { return s.text; }).join(' ').trim();
        if (!text) return;
        var sender = (participant && !participant.isLocal) ? 'agent' : 'user';
        if (sender === lastSender && lastEl) {
          var pEl = lastEl.querySelector('p');
          if (pEl) pEl.textContent = '"' + text + '"';
        } else {
          lastEl = addTranscript(text, sender);
          lastSender = sender;
        }
      });

      // Active speakers
      room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, function (speakers) {
        var agentSpeaking = speakers.some(function (s) { return !s.isLocal; });
        var userSpeaking = speakers.some(function (s) { return s.isLocal; });
        if (agentSpeaking) { setOrbState('speaking'); }
        else if (userSpeaking) { voiceStatus.textContent = '🎙️ Hearing you...'; orbVoiceLevel = 0.3; }
        else { if (isConnected) setOrbState('listening'); }
      });

      // Data messages (complaint_id from agent)
      room.on(LivekitClient.RoomEvent.DataReceived, function (payload, participant, kind, topic) {
        try {
          var text = new TextDecoder().decode(payload);
          var msg = JSON.parse(text);
          if (msg.type === 'COMPLAINT_ID' && msg.complaint_id) {
            sessionComplaintId = msg.complaint_id;
            console.log('[NARAD] Received complaint ID:', sessionComplaintId);
          }
        } catch (e) { /* ignore non-JSON data */ }
      });

      await room.connect(wsUrl, token);

    } catch (e) {
      voiceStatus.textContent = e.message;
      setOrbState('error');
      setTimeout(function () { setOrbState('idle'); }, 3000);
    }
  }

  function attachAgentAudio(track) {
    console.log('[NARAD] Attaching audio track');
    var audio = track.attach();
    audio.autoplay = true;
    document.body.appendChild(audio);
    audio.play().then(function () {
      console.log('[NARAD] Audio playing');
      setOrbState('speaking');
    }).catch(function () {
      pendingAudio = audio;
      unmuteBtn.classList.remove('hidden');
      unmuteBtn.classList.add('flex');
    });
    audio.addEventListener('play', function () { setOrbState('speaking'); });
    audio.addEventListener('ended', function () { if (isConnected) setOrbState('listening'); });
    audio.addEventListener('pause', function () { if (isConnected) setOrbState('listening'); });
  }

  // ── Disconnect ──
  async function disconnectVoice() {
    if (room) {
      await room.disconnect();
      room = null;
    }
    isConnected = false;
    setOrbState('idle');
    addTranscript('Session ended.', 'system');

    // Always show token dialog if we have a complaint ID
    if (sessionComplaintId) {
      showTokenDialog(sessionComplaintId);
    }
  }

  function showTokenDialog(id) {
    // Create modal overlay
    var overlay = document.createElement('div');
    overlay.id = 'token-dialog-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);animation:fadeIn 0.3s ease';

    var dialog = document.createElement('div');
    dialog.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(255,153,51,0.3);border-radius:20px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 40px rgba(255,153,51,0.1);animation:slideUp 0.3s ease';

    dialog.innerHTML =
      '<div style="margin-bottom:20px">' +
        '<span class="material-symbols-outlined" style="font-size:48px;color:#ff9933">verified</span>' +
      '</div>' +
      '<h2 style="color:#fff;font-size:18px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">Complaint Registered</h2>' +
      '<p style="color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:24px">Your token ID for tracking</p>' +
      '<div style="background:rgba(255,153,51,0.1);border:2px dashed rgba(255,153,51,0.4);border-radius:12px;padding:16px 24px;margin-bottom:24px;display:flex;align-items:center;justify-content:center;gap:12px">' +
        '<span style="font-size:28px;font-family:monospace;font-weight:900;color:#ff9933;letter-spacing:4px">' + id + '</span>' +
        '<button id="dialog-copy-btn" style="background:rgba(255,153,51,0.2);border:1px solid rgba(255,153,51,0.4);border-radius:8px;padding:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s">' +
          '<span class="material-symbols-outlined" style="color:#ff9933;font-size:20px">content_copy</span>' +
        '</button>' +
      '</div>' +
      '<div style="display:flex;gap:12px;justify-content:center">' +
        '<a href="#/complaints" id="dialog-track-btn" style="display:flex;align-items:center;gap:8px;padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#ff9933,#ff6600);color:#fff;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s;box-shadow:0 4px 15px rgba(255,153,51,0.3)">' +
          '<span class="material-symbols-outlined" style="font-size:16px">search</span> Track Status' +
        '</a>' +
        '<button id="dialog-close-btn" style="padding:12px 24px;border-radius:10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all 0.2s">' +
          'Close' +
        '</button>' +
      '</div>';

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Add animations
    var style = document.createElement('style');
    style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

    // Copy button
    document.getElementById('dialog-copy-btn').addEventListener('click', function () {
      navigator.clipboard.writeText(id);
      this.innerHTML = '<span class="material-symbols-outlined" style="color:#4caf50;font-size:20px">done</span>';
      var self = this;
      setTimeout(function () {
        self.innerHTML = '<span class="material-symbols-outlined" style="color:#ff9933;font-size:20px">content_copy</span>';
      }, 2000);
    });

    // Close button
    document.getElementById('dialog-close-btn').addEventListener('click', function () {
      overlay.remove();
    });

    // Track button also closes
    document.getElementById('dialog-track-btn').addEventListener('click', function () {
      overlay.remove();
    });

    // Click overlay to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  // ── Event listeners ──
  voiceBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isConnected) connectVoice();
  });

  endBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    disconnectVoice();
  });

  unmuteBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (pendingAudio) { pendingAudio.play(); pendingAudio = null; }
    unmuteBtn.classList.add('hidden');
    unmuteBtn.classList.remove('flex');
    setOrbState('speaking');
  });


  // ── Cleanup on navigation ──
  return function cleanup() {
    if (room) { room.disconnect(); room = null; isConnected = false; }
    if (cleanupOrb) cleanupOrb();
  };
}
