(() => {
  const termEl = document.getElementById("terminal");
  const logEl = document.getElementById("log");
  const screenEl = logEl.parentElement;
  const cmdInputEl = document.getElementById("cmdinput");
  const soundGateEl = document.getElementById("soundgate");
  const soundGateBtnEl = document.getElementById("soundgateBtn");

  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const chance = (p) => Math.random() < p;
  const statusTitleEl = document.getElementById("statusTitle");
  const BASE_STATUS_TITLE = statusTitleEl?.textContent || "PulseTrace — streaming… (1 line/sec)";

  const hex = (len) => {
    let s = "";
    for (let i = 0; i < len; i++) s += "0123456789abcdef"[rand(16)];
    return s;
  };

  const ts = () => {
    const d = new Date();
    const pad = (x, w = 2) => String(x).padStart(w, "0");
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  };

  // ---- Tiny typing sound (WebAudio) ----
  let audioCtx = null;
  let lastBeepAt = 0;
  let soundMuted = false;
  let soundGateDismissed = false;

  function isAudioRunning() {
    return !!audioCtx && audioCtx.state === "running";
  }

  function setSoundGateVisible(visible) {
    if (!soundGateEl) return;
    if (soundGateDismissed) {
      soundGateEl.hidden = true;
      return;
    }
    soundGateEl.hidden = !visible;
  }

  function ensureAudio() {
    if (soundMuted) return false;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    if (!audioCtx) {
      audioCtx = new Ctx();
      audioCtx.onstatechange = () => {
        setSoundGateVisible(!soundMuted && audioCtx.state !== "running");
      };
    }
    if (audioCtx.state !== "running") {
      const p = audioCtx.resume?.();
      // resume() is async and may reject if not user-initiated.
      if (p && typeof p.then === "function") p.catch(() => {});
    }
    setSoundGateVisible(!soundMuted && audioCtx.state !== "running");
    return audioCtx.state === "running";
  }

  function unlockAudioOnce() {
    ensureAudio();
    queueMicrotask(() => ensureAudio());
    removeEventListener("pointerdown", unlockAudioOnce);
    removeEventListener("keydown", unlockAudioOnce);
  }
  addEventListener("pointerdown", unlockAudioOnce, { once: true });
  addEventListener("keydown", unlockAudioOnce, { once: true });

  // Show a one-shot "click to enable sound" overlay until AudioContext runs.
  // (Some browsers require a user gesture before audio can start.)
  if (soundGateEl) {
    // Prevent the click from switching to manual input mode.
    soundGateEl.addEventListener("pointerdown", (e) => e.stopPropagation());
    soundGateEl.addEventListener("click", (e) => {
      e.stopPropagation();
      // User explicitly dismissed the overlay: keep it closed.
      soundGateDismissed = true;
      setSoundGateVisible(false);
    });
  }
  if (soundGateBtnEl) {
    soundGateBtnEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Always close on click, regardless of AudioContext state.
      soundGateDismissed = true;
      setSoundGateVisible(false);
      ensureAudio();
      if (isAudioRunning()) return;

      // If resume completes asynchronously, close immediately on success.
      if (audioCtx && audioCtx.state !== "running" && typeof audioCtx.resume === "function") {
        const p = audioCtx.resume();
        if (p && typeof p.then === "function") {
          p.then(() => {
            setSoundGateVisible(!soundMuted && audioCtx.state !== "running");
          }).catch(() => {});
        }
      }
      // Also re-check shortly after (covers browsers that update state a tick later)
      setTimeout(() => ensureAudio(), 0);
      setTimeout(() => ensureAudio(), 80);
    });
  }
  // Initial state (no gesture yet => likely suspended)
  queueMicrotask(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return; // no WebAudio => don't show
    setSoundGateVisible(!soundMuted && !isAudioRunning());
  });

  function beep(freq, ms, gain) {
    if (!audioCtx || audioCtx.state !== "running") return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + ms / 1000 + 0.02);
  }

  function typeSound() {
    if (soundMuted) return;
    const t = performance.now();
    if (t - lastBeepAt < 18) return;
    lastBeepAt = t;
    if (!ensureAudio()) return;
    beep(820 + rand(140), 18 + rand(10), 0.018);
  }

  function backspaceSound() {
    if (soundMuted) return;
    if (!ensureAudio()) return;
    beep(620 + rand(80), 14 + rand(8), 0.014);
  }

  function enterSound() {
    if (soundMuted) return;
    if (!ensureAudio()) return;
    beep(440, 36, 0.02);
  }

  // ---- Real-ish system log generator (sessions + global state) ----
  const REGIONS = ["ap-northeast-1", "us-east-1", "eu-west-1", "eu-central-1"];
  const HOSTS = [
    "gw-1",
    "gw-2",
    "api-1",
    "api-2",
    "db-1",
    "db-2",
    "worker-1",
    "worker-2",
    "worker-3",
    "edge-1",
    "edge-2",
  ];
  const QUEUES = ["jobs", "events", "emails", "index", "billing", "cdn_purge"];
  const SERVICES = ["gateway", "api", "auth", "db", "worker", "scheduler", "cdn"];
  const PATHS = [
    "/v1/login",
    "/v1/logout",
    "/v1/items",
    "/v1/items/42",
    "/v1/search?q=term",
    "/v1/upload",
    "/v1/metrics",
    "/healthz",
  ];
  const USERS = ["guest", "natsu", "admin", "svc-worker", "svc-cron", "svc-api", "bot-12"];

  class SystemState {
    constructor() {
      this.load = 0.35; // 0..1
      this.errorRate = 0.02; // 0..1
      this.latency = 90; // ms baseline
      this.queueDepth = 220;
      this.cacheHit = 0.78; // 0..1
      this._trend = 0;
      this._lastUpdateAt = performance.now();
      this._meltdown = 0; // 0..1
    }

    bumpLoad(delta) {
      this.load = clamp(this.load + delta, 0, 1);
    }

    nudgeMeltdown(delta) {
      this._meltdown = clamp(this._meltdown + delta, 0, 1);
    }

    update() {
      const now = performance.now();
      const dt = Math.min(5, (now - this._lastUpdateAt) / 1000);
      this._lastUpdateAt = now;

      if (rand(100) < 8) this._trend += (rand(200) - 100) / 1000;
      this._trend = clamp(this._trend, -0.08, 0.12);
      this.load = clamp(this.load + this._trend * dt + (rand(200) - 100) / 8000, 0.05, 0.98);

      const pressure = clamp(this.load * 0.85 + this._meltdown * 0.9, 0, 1);
      this.queueDepth = Math.round(
        clamp(this.queueDepth + (pressure - 0.45) * 180 + (rand(200) - 100) * 0.6, 0, 16000),
      );
      this.cacheHit = clamp(
        this.cacheHit + (0.45 - pressure) * 0.02 + (rand(200) - 100) / 40000,
        0.18,
        0.98,
      );

      const base = 70 + pressure * 260;
      this.latency = Math.round(clamp(base + (rand(200) - 100) * 1.2, 35, 1400));
      this.errorRate = clamp(0.012 + pressure * 0.09 + (rand(200) - 100) / 20000, 0.003, 0.22);
      this._meltdown = clamp(this._meltdown - 0.01 * dt, 0, 1);
    }
  }

  const STATE = new SystemState();

  function fmtEntry({ level, component, message, duration, id, detail }) {
    const lvl = String(level || "INFO").toUpperCase();
    const comp = component || "sys";
    const dur = typeof duration === "number" ? duration : 0;
    const sid = id || hex(8);
    const d = detail
      ? " " +
        Object.entries(detail)
          .map(([k, v]) => `${k}=${v}`)
          .join(" ")
      : "";
    return `${ts()}  ${lvl.padEnd(5)} [${comp}] ${message} (${dur}ms) id=${sid}${d}`;
  }

  function rareLogMaybe() {
    if (rand(1000) !== 0) return null; // ~0.1%
    const component = pick(["kernel", "allocator", "watchdog", "entropy", "unknown"]);
    const messages = [
      "clock skew detected; ntp step in progress",
      "unexpected token stream in config parser",
      "silent drop suspected; retransmits rising",
      "heap fragmentation warning; compaction scheduled",
      "checksum mismatch; attempting recovery",
    ];
    const duration = 5 + rand(40);
    const level = pick(["WARN", "ERROR", "DEBUG"]);
    const id = "rare-" + hex(6);
    return {
      level,
      text: fmtEntry({
        level,
        component,
        message: pick(messages),
        duration,
        id,
        detail: { host: pick(HOSTS), region: pick(REGIONS) },
      }),
    };
  }

  const SESSION_TYPES = ["api", "db", "auth", "cdn", "worker", "scheduler"];
  const sessionId = (prefix) => `${prefix}-${hex(8)}`;

  function typeProfile(type) {
    switch (type) {
      case "db":
        return { baseMs: 180, jitter: 260, errMult: 0.45, warnMult: 0.7, retryP: 0.03 };
      case "api":
        return { baseMs: 85, jitter: 180, errMult: 1.25, warnMult: 1.0, retryP: 0.06 };
      case "cdn":
        return { baseMs: 55, jitter: 120, errMult: 0.9, warnMult: 1.25, retryP: 0.08, rateLimitP: 0.12 };
      case "auth":
        return { baseMs: 75, jitter: 150, errMult: 1.5, warnMult: 1.1, retryP: 0.05 };
      case "worker":
        return { baseMs: 110, jitter: 220, errMult: 0.95, warnMult: 0.9, retryP: 0.05 };
      case "scheduler":
        return { baseMs: 40, jitter: 120, errMult: 0.7, warnMult: 0.8, retryP: 0.02 };
      default:
        return { baseMs: 80, jitter: 200, errMult: 1.0, warnMult: 1.0, retryP: 0.05 };
    }
  }

  function stepsFor(type) {
    switch (type) {
      case "api":
        return ["start", "processing", "db_query", "external_call", "finalize"];
      case "db":
        return ["start", "acquire_lock", "query", "commit", "finalize"];
      case "auth":
        return ["start", "validate_token", "fetch_keys", "policy_check", "finalize"];
      case "cdn":
        return ["start", "cache_lookup", "origin_fetch", "store", "finalize"];
      case "worker":
        return ["start", "dequeue", "process_job", "ack", "finalize"];
      case "scheduler":
        return ["start", "scan", "enqueue", "finalize"];
      default:
        return ["start", "processing", "finalize"];
    }
  }

  class Session {
    constructor(type) {
      this.type = type;
      this.id = sessionId(type);
      this.step = 0;
      this.steps = stepsFor(type);
      this.retries = 0;
      this.warns = 0;
      this.region = pick(REGIONS);
      this.host = pick(HOSTS);
      this.queue = pick(QUEUES);
      this.path = pick(PATHS);
      this.cache = chance(0.5) ? "hot" : "cdn";
      this._danger = 0;
      this._completed = false;
    }

    get done() {
      return this._completed;
    }

    component() {
      return this.type;
    }

    next(state) {
      const prof = typeProfile(this.type);
      const stepName = this.steps[Math.min(this.step, this.steps.length - 1)];

      const pressure = clamp(state.load * 0.8 + (state.queueDepth / 9000) * 0.35, 0, 1);
      const baseErr = clamp(state.errorRate * prof.errMult, 0, 0.45);
      const baseWarn = clamp((0.03 + pressure * 0.12) * prof.warnMult, 0, 0.65);

      this._danger = clamp(
        this._danger + pressure * 0.08 + this.retries * 0.06 + (rand(200) - 100) / 3000,
        0,
        1,
      );

      const duration = Math.round(
        clamp(
          prof.baseMs + prof.jitter * (0.25 + pressure) + (rand(200) - 100) * 1.6 + state.latency * 0.35,
          5,
          5000,
        ),
      );

      const nearEnd = this.step >= this.steps.length - 2;
      const precursorP = clamp(0.02 + this._danger * 0.18 + (nearEnd ? 0.06 : 0), 0, 0.4);
      const willWarn = chance(baseWarn) || chance(precursorP);

      if (this.type === "cdn" && chance((prof.rateLimitP || 0) * (0.6 + pressure))) {
        this.warns++;
        if (chance(0.35) && this.retries < 3) this.retries++;
        return this._entry("WARN", "rate_limited", duration, {
          region: this.region,
          host: this.host,
          retry: this.retries,
          cache: this.cache,
        });
      }

      if (chance(prof.retryP * (0.5 + this._danger * 1.4)) && this.retries < 3 && stepName !== "finalize") {
        this.retries++;
        if (chance(0.4)) this.warns++;
        state.bumpLoad(0.02);
        return this._entry("WARN", "retrying", Math.round(duration * 0.7), {
          region: this.region,
          host: this.host,
          retry: this.retries,
        });
      }

      const failNow =
        (stepName === "finalize" && chance(baseErr + this._danger * 0.12)) ||
        (nearEnd && chance(baseErr * 0.35 + this._danger * 0.08));
      if (failNow) {
        state.nudgeMeltdown(0.06);
        state.bumpLoad(0.05);
        this._completed = true;
        return this._entry("ERROR", "error", duration, {
          region: this.region,
          host: this.host,
          retry: this.retries,
          code: "E" + (10 + rand(90)),
          trace: hex(12),
        });
      }

      let level = "INFO";
      let msg = stepName;
      if (willWarn) {
        level = "WARN";
        this.warns++;
        msg = stepName === "processing" ? "slow_path" : stepName + "_slow";
      } else if (chance(0.25)) {
        level = "DEBUG";
      }

      const entry = this._stepEntry(level, stepName, msg, duration, state);
      this.step++;
      if (this.step >= this.steps.length) this._completed = true;
      return entry;
    }

    _stepEntry(level, stepName, msg, duration, state) {
      const detail = { region: this.region, host: this.host, retry: this.retries };

      if (this.type === "api") {
        detail.path = this.path;
        detail.status = level === "ERROR" ? 500 : 200 + rand(30);
      }
      if (this.type === "db") {
        detail.tx = hex(6);
        detail.rows = rand(1800);
        detail.lock = Math.round(clamp(state.load * 35 + rand(30), 0, 120));
      }
      if (this.type === "auth") {
        detail.user = pick(USERS);
        detail.policy = pick(["rbac", "jwt", "mfa"]);
      }
      if (this.type === "cdn") {
        detail.cache = this.cache;
        detail.hit = chance(state.cacheHit) ? 1 : 0;
        detail.origin = pick(["origin-1", "origin-2"]);
      }
      if (this.type === "worker") {
        detail.queue = this.queue;
        detail.depth = state.queueDepth;
        detail.job = hex(6);
      }
      if (this.type === "scheduler") {
        detail.queue = this.queue;
        detail.scheduled = 1 + rand(40);
      }

      const message = `${stepName} ${msg}`.trim();
      return this._entry(level, message, duration, detail);
    }

    _entry(level, message, duration, detail) {
      const component = this.component();
      return {
        level,
        text: fmtEntry({ level, component, message, duration, id: this.id, detail }),
      };
    }
  }

  class SessionManager {
    constructor(state) {
      this.state = state;
      this.active = [];
      this.maxActive = 10;
    }

    _pickType() {
      const pressure = clamp(this.state.load * 0.7 + (this.state.queueDepth / 12000) * 0.35, 0, 1);
      const bag = [];
      const pushN = (t, n) => {
        for (let i = 0; i < n; i++) bag.push(t);
      };
      pushN("api", 4);
      pushN("db", 2);
      pushN("auth", 2);
      pushN("cdn", 2 + (pressure > 0.55 ? 1 : 0));
      pushN("worker", 3 + (pressure > 0.6 ? 2 : 0));
      pushN("scheduler", 2);
      return pick(bag);
    }

    start(type = this._pickType()) {
      const s = new Session(type);
      this.active.push(s);
      if (this.active.length > this.maxActive) this.active.shift();
      return s;
    }

    nextEntry() {
      const odd = rareLogMaybe();
      if (odd) return odd;

      if (this.active.length === 0) this.start();
      const idx = rand(this.active.length);
      const s = this.active[idx];
      const entry = s.next(this.state);
      if (s.done) this.active.splice(idx, 1);

      const pressure = clamp(this.state.load * 0.75 + (this.state.queueDepth / 12000) * 0.3, 0, 1);
      if (chance(0.15 + pressure * 0.18) && this.active.length < this.maxActive) this.start();
      return entry;
    }
  }

  const SESSIONS = new SessionManager(STATE);

  function commandSession(commandText) {
    const id = sessionId("cmd");
    const svc = pick(SERVICES);
    const host = pick(HOSTS);
    const region = pick(REGIONS);

    const lower = commandText.toLowerCase();
    const isRestart = lower.includes("restart") || lower.includes("reconnect") || lower.includes("reload");
    const isFlush = lower.includes("flush") || lower.includes("purge");
    const isScale = lower.includes("scale");

    if (isRestart) {
      STATE.nudgeMeltdown(-0.12);
      STATE.bumpLoad(0.06);
    } else if (isFlush) {
      STATE.bumpLoad(0.04);
    } else if (isScale) {
      STATE.bumpLoad(0.08);
    }

    const base = (message, duration, level = "INFO", detail = {}) => ({
      level,
      text: fmtEntry({
        level,
        component: "sys",
        message,
        duration,
        id,
        detail: { host, region, svc, ...detail },
      }),
    });

    const seq = [];
    // ここではCMD行を出さない（Enter時の `CMD [shell] ...` だけに統一）
    seq.push(base(`command received: ${commandText}`, 4 + rand(20), "DEBUG"));
    if (isRestart) {
      seq.push(base("stopping service", 90 + rand(160), "WARN", { state: "stopping" }));
      seq.push(base("draining connections", 120 + rand(220), "INFO", { inflight: 10 + rand(200) }));
      seq.push(base("starting service", 140 + rand(260), "INFO", { state: "starting" }));
      seq.push(base("healthcheck ok", 40 + rand(120), chance(0.08) ? "WARN" : "INFO", { healthy: 1 }));
    } else if (isFlush) {
      seq.push(base("purge queued", 25 + rand(80), "INFO", { queue: pick(QUEUES) }));
      seq.push(base("purge running", 60 + rand(140), "DEBUG", { batch: 1 + rand(40) }));
      seq.push(base("purge complete", 80 + rand(200), "INFO", { purged: 50 + rand(9000) }));
    } else if (isScale) {
      seq.push(base("scaling requested", 30 + rand(80), "INFO", { to: 2 + rand(7) }));
      seq.push(base("rebalancing", 80 + rand(220), "DEBUG", { shards: 1 + rand(16) }));
      seq.push(base("scale applied", 50 + rand(120), "INFO", { ok: 1 }));
    } else {
      seq.push(base("executing", 40 + rand(120), "INFO"));
      seq.push(base("ok", 20 + rand(80), "INFO"));
    }

    if (chance(0.45)) SESSIONS.start(pick(SESSION_TYPES));
    if (chance(0.25)) SESSIONS.start(pick(SESSION_TYPES));

    return seq;
  }

  // ---- Log rendering & reflow ----
  function flashError() {
    termEl.classList.remove("flash");
    void termEl.offsetWidth; // reflow
    termEl.classList.add("flash");
    setTimeout(() => termEl.classList.remove("flash"), 180);
  }

  function trimToFit() {
    // hard cap so DOM never grows unbounded
    const hardCap = 260;
    while (logEl.childNodes.length > hardCap) logEl.removeChild(logEl.firstChild);
    while (logEl.scrollHeight > screenEl.clientHeight && logEl.firstChild) {
      logEl.removeChild(logEl.firstChild);
    }
  }

  // ---- Hard wrap (insert real newlines) ----
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  let cachedCols = 80;
  let cachedFontKey = "";

  const LOG_BUFFER = [];
  const LOG_BUFFER_CAP = 420;

  function getLogFontKey() {
    const cs = getComputedStyle(logEl);
    const size = cs.fontSize || "13px";
    const fam = cs.fontFamily || "monospace";
    const weight = cs.fontWeight && cs.fontWeight !== "normal" ? cs.fontWeight : "";
    const style = cs.fontStyle && cs.fontStyle !== "normal" ? cs.fontStyle : "";
    return `${style} ${weight} ${size} ${fam}`.trim().replace(/\s+/g, " ");
  }

  function computeCols() {
    const fontKey = getLogFontKey();
    if (fontKey && fontKey !== cachedFontKey) {
      cachedFontKey = fontKey;
      if (measureCtx) measureCtx.font = fontKey;
    }

    const availablePx = logEl.clientWidth;
    if (!measureCtx || availablePx <= 0) return cachedCols;

    // monospace-ish; measure a representative glyph
    // NOTE: user tuned factor (0.9) for best fit.
    const glyphW = measureCtx.measureText("M").width * 0.9 || 8;
    const cols = Math.floor(availablePx / glyphW);
    cachedCols = clamp(cols, 20, 240);
    return cachedCols;
  }

  function hardWrapText(text, cols) {
    if (!text || cols <= 0) return text;
    const lines = String(text).split("\n");
    const out = [];

    for (const line of lines) {
      if (line.length <= cols) {
        out.push(line);
        continue;
      }
      let i = 0;
      while (i < line.length) {
        out.push(line.slice(i, i + cols));
        i += cols;
      }
    }
    return out.join("\n");
  }

  function pushToBuffer(entry) {
    LOG_BUFFER.push({
      level: entry.level || "INFO",
      textRaw: String(entry.text ?? ""),
    });
    while (LOG_BUFFER.length > LOG_BUFFER_CAP) LOG_BUFFER.shift();
  }

  function renderEntry(entry) {
    const span = document.createElement("span");
    const cls = ["line"];
    if (entry.level === "DEBUG") cls.push("debug");
    else if (entry.level === "WARN") cls.push("warn");
    else if (entry.level === "ERROR") cls.push("error");
    else cls.push("info");
    if (entry.level === "CMD") cls.push("cmd");
    span.className = cls.join(" ");
    span.textContent = hardWrapText(entry.textRaw, cachedCols);
    return span;
  }

  function rerenderFromBuffer() {
    cachedCols = computeCols();
    logEl.textContent = "";
    for (const e of LOG_BUFFER) logEl.appendChild(renderEntry(e));
    trimToFit();
  }

  function addLine(entryLike) {
    const entry = typeof entryLike === "string" ? { level: "INFO", text: entryLike } : entryLike;
    pushToBuffer(entry);

    computeCols();
    const span = document.createElement("span");
    span.className = "line new";
    if (entry.level === "DEBUG") span.classList.add("debug");
    else if (entry.level === "WARN") span.classList.add("warn");
    else if (entry.level === "ERROR") span.classList.add("error");
    else span.classList.add("info");
    if (entry.level === "CMD") span.classList.add("cmd");
    span.textContent = hardWrapText(String(entry.text ?? ""), cachedCols);
    logEl.appendChild(span);

    requestAnimationFrame(trimToFit);

    if (entry.level === "ERROR") flashError();
    requestAnimationFrame(() => span.classList.remove("new"));
  }

  // ---- Flow controller: normal -> burst -> quiet ----
  let mode = "normal"; // normal | burst | quiet
  let burstLeft = 0;
  let quietUntil = 0;
  let nextBurstAt = performance.now() + (6000 + rand(9000));

  function scheduleNextTick(delayMs) {
    tickTimer = setTimeout(tick, delayMs);
  }

  let streaming = true;
  let tickTimer = 0;

  function tick() {
    if (!streaming) return;
    const now = performance.now();
    STATE.update();

    if (mode === "quiet" && now < quietUntil) {
      scheduleNextTick(900 + rand(1400));
      return;
    }

    if (mode === "quiet") {
      mode = "normal";
      nextBurstAt = now + (6000 + rand(9000));
    }

    if (mode === "normal" && now >= nextBurstAt) {
      mode = "burst";
      burstLeft = 5 + rand(6); // 5〜10
    }

    if (mode === "burst") {
      addLine(SESSIONS.nextEntry());
      burstLeft--;
      if (burstLeft <= 0) {
        mode = "quiet";
        quietUntil = now + (3500 + rand(3500));
        scheduleNextTick(900 + rand(800));
        return;
      }
      scheduleNextTick(40 + rand(90));
      return;
    }

    addLine(SESSIONS.nextEntry());
    scheduleNextTick(1000);
  }

  for (let i = 0; i < 12; i++) addLine(SESSIONS.nextEntry());
  scheduleNextTick(600);

  // ---- Command input (real) ----
  const history = [];
  let historyPos = -1;

  function sysLine(text, level = "INFO") {
    addLine({ level, text: `${ts()}  ${String(level).padEnd(5)} [sys] ${text} (0ms) id=${hex(8)}` });
  }

  function plainLine(text, level = "INFO") {
    addLine({ level, text: String(text ?? "") });
  }

  function printHelp() {
    const lines = [
      "available commands:",
      "  help                show this help",
      "  mute                toggle sound effects",
      "  clear               clear the screen",
      "  pause               pause log streaming",
      "  resume              resume log streaming",
    ];
    for (const l of lines) plainLine(l, "INFO");
  }

  function clearScreen() {
    LOG_BUFFER.length = 0;
    logEl.textContent = "";
  }

  function setStreaming(next) {
    streaming = !!next;
    clearTimeout(tickTimer);
    if (streaming) scheduleNextTick(200);
  }

  function runUserCommand(raw, { source = "manual" } = {}) {
    const text = String(raw ?? "").trim();
    if (!text) return;

    enterSound();
    addLine({ level: "CMD", text: `${ts()}  CMD   [shell] > ${text}` });

    const [cmd, ...rest] = text.split(/\s+/);
    const argStr = rest.join(" ");
    const c = (cmd || "").toLowerCase();

    if (c === "help" || c === "?" || c === "h") {
      printHelp();
      return;
    }

    if (c === "mute") {
      soundMuted = !soundMuted;
      sysLine(`sound ${soundMuted ? "muted" : "unmuted"}`, soundMuted ? "WARN" : "INFO");
      setSoundGateVisible(!soundMuted && !isAudioRunning());
      return;
    }

    if (c === "clear" || c === "cls") {
      clearScreen();
      return;
    }

    if (c === "pause") {
      setStreaming(false);
      sysLine("streaming paused", "WARN");
      return;
    }

    if (c === "resume") {
      setStreaming(true);
      sysLine("streaming resumed", "INFO");
      return;
    }

    // fallback: generate related system logs for "unknown" commands too
    if (source === "manual") {
      sysLine(`unknown command: ${cmd}`, "WARN");
      if (argStr) sysLine(`args: ${argStr}`, "DEBUG");
    }
    const related = commandSession(text);
    let k = 0;
    const emitRelated = () => {
      if (k >= related.length) return;
      addLine(related[k++]);
      setTimeout(emitRelated, 50 + rand(110));
    };
    emitRelated();
  }

  function focusCmd() {
    cmdInputEl?.focus?.();
  }

  // ---- Auto demo typing (default) + manual override on interaction ----
  const commandTexts = [
    "help",
    "status --full",
    "reconnect --force",
    "restart service api",
    "reload config",
    "flush cache",
    "cdn purge --tag assets",
    "queue drain --name jobs",
    "worker scale --to " + (2 + rand(7)),
    "db vacuum --table events",
    "search reindex --collection items",
    "auth check --token " + hex(6),
    "rbac audit --user " + pick(USERS),
    "billing reconcile --dry-run",
  ];

  let autoTimer = 0;
  let autoTypingTimer = 0;
  let manualUntil = 0;
  const MANUAL_GRACE_MS = 10000;
  let manualCountdownTimer = 0;

  function isManualMode() {
    return performance.now() < manualUntil;
  }

  function setStatusTitle(s) {
    if (!statusTitleEl) return;
    statusTitleEl.textContent = s;
  }

  function stopManualCountdown() {
    clearInterval(manualCountdownTimer);
    manualCountdownTimer = 0;
  }

  function startManualCountdown() {
    stopManualCountdown();
    if (!statusTitleEl) return;
    const tickOnce = () => {
      const leftMs = Math.max(0, manualUntil - performance.now());
      const leftS = Math.ceil(leftMs / 1000);
      if (leftS <= 0) {
        setStatusTitle(BASE_STATUS_TITLE);
        stopManualCountdown();
        return;
      }
      setStatusTitle(`${BASE_STATUS_TITLE}  —  manual input (auto resumes in ${leftS}s)`);
    };
    tickOnce();
    manualCountdownTimer = setInterval(tickOnce, 250);
  }

  function setManualModeFor(ms = MANUAL_GRACE_MS) {
    manualUntil = performance.now() + ms;
    stopAutoDemo();
    if (cmdInputEl) cmdInputEl.readOnly = false;
    startManualCountdown();
  }

  function setAutoMode() {
    manualUntil = 0;
    if (cmdInputEl) {
      cmdInputEl.value = "";
      cmdInputEl.readOnly = true;
      cmdInputEl.blur?.();
    }
    setStatusTitle(BASE_STATUS_TITLE);
    stopManualCountdown();
    startAutoDemo();
  }

  function stopAutoDemo() {
    clearTimeout(autoTimer);
    clearTimeout(autoTypingTimer);
  }

  function startAutoDemo() {
    stopAutoDemo();
    if (!cmdInputEl) return;
    if (isManualMode()) return;
    cmdInputEl.readOnly = true;

    const s = pick(commandTexts);
    let i = 0;
    cmdInputEl.value = "";

    const typoChars = "abcdefghijklmnopqrstuvwxyz0123456789-_/".split("");
    const shouldTypo = () => rand(100) < 6;

    function nextKeyDelay(ch, prevCh) {
      let d = 22 + rand(85);
      if (ch === " " || ch === "-" || ch === "/") d += 30 + rand(90);
      if (prevCh === "-" || prevCh === "/") d += rand(50);
      if (rand(100) < 7) d += 90 + rand(260);
      return d;
    }

    function scheduleEnter() {
      const think = 220 + rand(780);
      autoTypingTimer = setTimeout(() => {
        if (isManualMode()) return;
        const v = cmdInputEl.value;
        cmdInputEl.value = "";
        runUserCommand(v, { source: "auto" });
        autoTimer = setTimeout(startAutoDemo, 3500 + rand(4500));
      }, think);
    }

    function typeStep(prevCh = "") {
      if (isManualMode()) return;
      if (i >= s.length) {
        scheduleEnter();
        return;
      }

      const ch = s[i];
      const current = cmdInputEl.value || "";

      if (ch !== " " && shouldTypo() && current.length > 0 && /[a-z0-9]/i.test(ch)) {
        const wrong = typoChars[rand(typoChars.length)];
        cmdInputEl.value = current + wrong;
        typeSound();

        autoTypingTimer = setTimeout(() => {
          if (isManualMode()) return;
          cmdInputEl.value = (cmdInputEl.value || "").slice(0, -1);
          backspaceSound();
          autoTypingTimer = setTimeout(() => {
            if (isManualMode()) return;
            cmdInputEl.value = (cmdInputEl.value || "") + ch;
            typeSound();
            i++;
            autoTypingTimer = setTimeout(() => typeStep(ch), nextKeyDelay(ch, prevCh));
          }, 40 + rand(90));
        }, 60 + rand(140));
        return;
      }

      cmdInputEl.value = current + ch;
      typeSound();
      i++;
      autoTypingTimer = setTimeout(() => typeStep(ch), nextKeyDelay(ch, prevCh));
    }

    typeStep();
  }

  function scheduleAutoResumeCheck() {
    if (!cmdInputEl) return;
    if (!isManualMode()) {
      setAutoMode();
      return;
    }
    setTimeout(scheduleAutoResumeCheck, 400);
  }

  function onUserInteract() {
    if (!cmdInputEl) return;
    setManualModeFor(MANUAL_GRACE_MS);
    focusCmd();
    scheduleAutoResumeCheck();
  }

  termEl?.addEventListener("pointerdown", () => onUserInteract());
  addEventListener("keydown", () => onUserInteract(), { capture: true });

  if (cmdInputEl) {
    // start in auto mode
    cmdInputEl.readOnly = true;

    cmdInputEl.addEventListener("keydown", (e) => {
      // Any key in the input means manual mode.
      if (e.key !== "Tab" && e.key !== "Shift") setManualModeFor(MANUAL_GRACE_MS);

      if (e.key === "Enter") {
        e.preventDefault();
        const v = cmdInputEl.value;
        cmdInputEl.value = "";
        if (v.trim()) {
          history.unshift(v);
          if (history.length > 50) history.pop();
        }
        historyPos = -1;
        runUserCommand(v, { source: "manual" });
        return;
      }

      if (e.key === "ArrowUp") {
        if (history.length === 0) return;
        e.preventDefault();
        historyPos = clamp(historyPos + 1, 0, history.length - 1);
        cmdInputEl.value = history[historyPos] ?? "";
        cmdInputEl.setSelectionRange(cmdInputEl.value.length, cmdInputEl.value.length);
        return;
      }

      if (e.key === "ArrowDown") {
        if (history.length === 0) return;
        e.preventDefault();
        historyPos = clamp(historyPos - 1, -1, history.length - 1);
        cmdInputEl.value = historyPos === -1 ? "" : history[historyPos] ?? "";
        cmdInputEl.setSelectionRange(cmdInputEl.value.length, cmdInputEl.value.length);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        cmdInputEl.value = "";
        historyPos = -1;
      }
    });

    // show affordance once
    plainLine("Type `help` to list commands.", "INFO");
    setTimeout(() => setAutoMode(), 2500 + rand(2500));
  }

  // Reflow on resize (re-wrap old logs like a real terminal)
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      computeCols();
      rerenderFromBuffer();
    }, 120);
  });
})();

