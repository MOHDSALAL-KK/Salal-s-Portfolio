/* =====================================================================
   Data Runner — an original endless-runner mini game
   A pixel sports car drives through a night city, jumping bugs and NULL
   boxes, dropping low under 404 drones and collecting KPI coins.
   Keys are only captured while the game canvas has focus, so Space never
   hijacks normal page scrolling.
   ===================================================================== */
(() => {
  "use strict";
  const canvas = document.getElementById("runner");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const wrap = canvas.parentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS = {
    skyTop: "#060a13", skyBot: "#0f1a2e", gold: "#e2b659", gold2: "#f6d98f", teal: "#2dd4bf",
    rose: "#fb7185", dune1: "#1a2236", dune2: "#141b2c", ground: "#24304a", text: "#e9edf5", muted: "#8e99ad",
  };
  const H = 260;
  let W = 800, DPR = 1, groundY = H - 46;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ---------------- State ---------------- */
  let state = "idle"; // idle | running | over
  let speed, distance, coinsScore, hi = store.get("dataRunnerHi", 0);
  let player, obstacles, coins, particles, spawnIn, coinIn, flash, t = 0, lastTs = 0, inView = true;
  const keys = { down: false };

  const reset = () => {
    speed = 380; distance = 0; coinsScore = 0; flash = 0;
    player = { x: 60, y: groundY, vy: 0, w: 58, h: 34, onGround: true, duck: false, frame: 0 };
    obstacles = []; coins = []; particles = [];
    spawnIn = 0.9; coinIn = 1.6;
  };
  reset();

  const score = () => Math.floor(distance / 12) + coinsScore;

  /* ---------------- Sizing ---------------- */
  const resize = () => {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, Math.floor(wrap.clientWidth));
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    groundY = H - 46;
    if (state !== "running") draw();
  };
  window.addEventListener("resize", resize);

  /* ---------------- Background: stars, moon, skyline, dunes ---------------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * 0.6, r: Math.random() * 1.3 + 0.3, tw: Math.random() * 6 }));
  // skyline silhouette blueprint (x offsets in a 900px repeating strip)
  const SKY = [
    { x: 40, w: 26, h: 50 }, { x: 74, w: 18, h: 72 }, { x: 100, w: 30, h: 44 }, { x: 140, w: 24, h: 88 },
    { x: 172, w: 32, h: 58 }, { x: 210, w: 22, h: 60 }, { x: 240, w: 34, h: 38 }, { x: 284, w: 20, h: 96 },
    { x: 312, w: 28, h: 64 }, { x: 360, w: 20, h: 54 }, { x: 390, w: 28, h: 66 }, { x: 430, w: 36, h: 46 },
    { x: 476, w: 18, h: 84 }, { x: 520, w: 24, h: 48 }, { x: 552, w: 16, h: 80 }, { x: 580, w: 30, h: 56 },
    { x: 622, w: 22, h: 92 }, { x: 660, w: 30, h: 52 }, { x: 700, w: 20, h: 70 }, { x: 730, w: 26, h: 40 },
    { x: 768, w: 36, h: 62 }, { x: 820, w: 22, h: 58 }, { x: 852, w: 28, h: 76 },
  ];
  const STRIP = 900;

  function drawSkyline(offset) {
    const base = groundY - 18;
    ctx.save();
    ctx.globalAlpha = 0.9;
    for (let rep = -1; rep < Math.ceil(W / STRIP) + 1; rep++) {
      const ox = rep * STRIP - (offset % STRIP);
      for (const b of SKY) {
        const x = ox + b.x;
        if (x > W + 60 || x < -80) continue;
        // generic city block with lit windows
        ctx.fillStyle = "#121a2b";
        ctx.fillRect(x, base - b.h, b.w, b.h);
        ctx.strokeStyle = "rgba(226,182,89,0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, base - b.h + 0.5, b.w - 1, b.h - 1);
        ctx.fillStyle = "rgba(246,217,143,0.35)";
        for (let wy = base - b.h + 6; wy < base - 4; wy += 9) for (let wx = x + 4; wx < x + b.w - 3; wx += 7) if ((wx * 7 + wy * 3) % 5 < 2) ctx.fillRect(wx, wy, 2, 3);
      }
    }
    ctx.restore();
  }

  function drawDunes(offset, color, amp, freq, yOff) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = groundY - yOff + Math.sin((x + offset) * freq) * amp + Math.sin((x + offset) * freq * 2.3) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  /* ---------------- Player: pixel sports car ---------------- */
  function drawWheel(cx, cy, r, spin) {
    ctx.fillStyle = "#0b0f18"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5d677a"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1a2236"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI * 2) / 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55); ctx.stroke();
    }
  }

  function drawCar(p) {
    const x = Math.round(p.x), y = Math.round(p.y);
    const low = p.duck;
    const lift = low ? 0 : 4;                   // ride height
    const bodyTop = y - (low ? 18 : 24) - lift; // top of the lower body
    ctx.save();
    // headlight beam
    const beam = ctx.createLinearGradient(x + 56, 0, x + 150, 0);
    beam.addColorStop(0, "rgba(246,217,143,0.35)"); beam.addColorStop(1, "rgba(246,217,143,0)");
    ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(x + 56, bodyTop + 6); ctx.lineTo(x + 150, bodyTop - 6); ctx.lineTo(x + 150, bodyTop + 22); ctx.lineTo(x + 56, bodyTop + 11); ctx.closePath(); ctx.fill();
    // body
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x, bodyTop, 58, low ? 10 : 12);                       // lower body
    ctx.fillRect(x + 50, bodyTop + 2, 8, 6);                            // nose
    // cabin (shorter when lowered)
    const cabH = low ? 6 : 10;
    ctx.beginPath();
    ctx.moveTo(x + 12, bodyTop); ctx.lineTo(x + 20, bodyTop - cabH); ctx.lineTo(x + 38, bodyTop - cabH); ctx.lineTo(x + 46, bodyTop); ctx.closePath();
    ctx.fill();
    // windows
    ctx.fillStyle = "#1b2740";
    ctx.beginPath();
    ctx.moveTo(x + 16, bodyTop - 1); ctx.lineTo(x + 21, bodyTop - cabH + 2); ctx.lineTo(x + 29, bodyTop - cabH + 2); ctx.lineTo(x + 29, bodyTop - 1); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 31, bodyTop - 1); ctx.lineTo(x + 31, bodyTop - cabH + 2); ctx.lineTo(x + 37, bodyTop - cabH + 2); ctx.lineTo(x + 43, bodyTop - 1); ctx.closePath(); ctx.fill();
    // racing stripe, spoiler, lights
    ctx.fillStyle = COLORS.teal; ctx.fillRect(x + 2, bodyTop + 4, 50, 2);
    ctx.fillStyle = "#a8823a"; ctx.fillRect(x - 2, bodyTop - (low ? 2 : 5), 8, 3); ctx.fillRect(x + 1, bodyTop - (low ? 1 : 3), 2, low ? 2 : 4);
    ctx.fillStyle = "#fff6d5"; ctx.fillRect(x + 54, bodyTop + 3, 4, 3);    // headlight
    ctx.fillStyle = COLORS.rose; ctx.fillRect(x, bodyTop + 2, 3, 3);        // tail light
    // wheels
    const spin = distance / 9;
    const wy = y - 6;
    drawWheel(x + 13, wy, 6, spin);
    drawWheel(x + 45, wy, 6, spin);
    ctx.restore();
  }

  /* ---------------- Obstacles & coins ---------------- */
  function spawnObstacle() {
    const s = score();
    const roll = Math.random();
    if (s > 250 && roll < 0.28) {
      const low = Math.random() < 0.55;
      obstacles.push({ type: "drone", x: W + 30, y: low ? groundY - 26 : groundY - 74, w: 38, h: 18, phase: Math.random() * 6 });
    } else if (roll < 0.55) {
      obstacles.push({ type: "bug", x: W + 30, y: groundY, w: 28, h: 20 });
    } else if (roll < 0.85 || s < 150) {
      obstacles.push({ type: "null", x: W + 30, y: groundY, w: 30, h: 34 });
    } else {
      obstacles.push({ type: "stack", x: W + 30, y: groundY, w: 54, h: 30 });
    }
    const minGap = 0.55 + 220 / speed;
    spawnIn = rnd(minGap, minGap + 0.9);
  }

  function drawObstacle(o) {
    const x = Math.round(o.x);
    if (o.type === "bug") {
      const y = o.y;
      ctx.fillStyle = COLORS.rose;
      ctx.fillRect(x + 4, y - 16, 20, 12); ctx.fillRect(x + 8, y - 20, 12, 4);
      ctx.fillStyle = "#7f1d1d"; ctx.fillRect(x + 13, y - 16, 2, 12);
      ctx.fillStyle = COLORS.rose;
      const k = Math.floor(t * 12) % 2;
      for (let i = 0; i < 3; i++) { ctx.fillRect(x + 2 - k, y - 13 + i * 4, 3, 2); ctx.fillRect(x + 23 + k, y - 13 + i * 4, 3, 2); }
      ctx.fillRect(x + 8, y - 24, 2, 4); ctx.fillRect(x + 18, y - 24, 2, 4);
      ctx.fillRect(x + 6, y - 4, 4, 4); ctx.fillRect(x + 18, y - 4, 4, 4);
    } else if (o.type === "null" || o.type === "stack") {
      const boxes = o.type === "stack" ? [[0, 30], [26, 30]] : [[0, 34]];
      boxes.forEach(([dx, h]) => {
        const bx = x + dx, by = o.y - h, bw = o.type === "stack" ? 28 : 30;
        ctx.fillStyle = "#1b2740"; ctx.fillRect(bx, by, bw, h);
        ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, bw - 2, h - 2);
        ctx.fillStyle = COLORS.gold2; ctx.font = "700 8px 'JetBrains Mono', monospace"; ctx.textAlign = "center";
        ctx.fillText("NULL", bx + bw / 2, by + h / 2 + 3); ctx.textAlign = "left";
      });
    } else if (o.type === "drone") {
      const y = o.y + Math.sin(t * 6 + o.phase) * 3;
      ctx.fillStyle = "#2a3550"; ctx.fillRect(x + 4, y - 10, 30, 12);
      ctx.strokeStyle = COLORS.rose; ctx.lineWidth = 1.5; ctx.strokeRect(x + 4, y - 10, 30, 12);
      ctx.fillStyle = COLORS.rose; ctx.font = "700 9px 'JetBrains Mono', monospace"; ctx.fillText("404", x + 10, y - 1);
      const k = Math.floor(t * 20) % 2;
      ctx.fillStyle = COLORS.muted; ctx.fillRect(x + (k ? 0 : 4), y - 14, 12, 2); ctx.fillRect(x + (k ? 26 : 22), y - 14, 12, 2);
      ctx.fillRect(x + 8, y - 13, 2, 3); ctx.fillRect(x + 28, y - 13, 2, 3);
    }
  }

  function drawCoin(c) {
    const s = Math.abs(Math.sin(t * 5 + c.phase));
    const w = 4 + s * 10;
    ctx.fillStyle = COLORS.gold2;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, w / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a8823a";
    if (s > 0.5) { ctx.font = "700 7px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText("K", c.x, c.y + 2.5); ctx.textAlign = "left"; }
  }

  /* ---------------- Loop ---------------- */
  const hitbox = (p) => p.duck
    ? { x: p.x + 2, y: p.y - 22, w: 54, h: 20 }
    : { x: p.x + 2, y: p.y - 38, w: 54, h: 36 };
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const obBox = (o) => o.type === "drone"
    ? { x: o.x + 5, y: o.y - 13, w: 30, h: 14 }
    : { x: o.x + 3, y: o.y - o.h + 2, w: o.w - 6, h: o.h - 2 };

  function update(dt) {
    t += dt;
    speed = Math.min(950, speed + dt * 9);
    distance += speed * dt;

    // physics
    const p = player;
    p.duck = keys.down && p.onGround;
    p.vy += (keys.down && !p.onGround ? 4200 : 2300) * dt; // fast-fall when holding down mid-air
    p.y += p.vy * dt;
    if (p.y >= groundY) { if (!p.onGround) dust(p.x + 20, groundY); p.y = groundY; p.vy = 0; p.onGround = true; }
    p.frame = Math.floor(distance / 26);

    // spawn
    spawnIn -= dt; if (spawnIn <= 0) spawnObstacle();
    coinIn -= dt;
    if (coinIn <= 0) {
      const high = Math.random() < 0.5;
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) coins.push({ x: W + 20 + i * 26, y: high ? groundY - 92 : groundY - 50, phase: i, taken: false });
      coinIn = rnd(1.8, 3.4);
    }

    const dx = speed * dt;
    obstacles.forEach((o) => (o.x -= dx * (o.type === "drone" ? 1.12 : 1)));
    coins.forEach((c) => (c.x -= dx));
    obstacles = obstacles.filter((o) => o.x > -80);
    coins = coins.filter((c) => c.x > -20 && !c.taken);

    const hb = hitbox(p);
    for (const c of coins) {
      if (overlap(hb, { x: c.x - 7, y: c.y - 7, w: 14, h: 14 })) {
        c.taken = true; coinsScore += 25;
        for (let i = 0; i < 8; i++) particles.push({ x: c.x, y: c.y, vx: rnd(-120, 120), vy: rnd(-160, 40), life: 0.5, c: COLORS.gold2 });
      }
    }
    for (const o of obstacles) if (overlap(hb, obBox(o))) return gameOver();

    // milestone flash every 500 points
    const s = score();
    if (Math.floor(s / 500) > Math.floor((s - 3) / 500) && s > 10) flash = 0.6;
    flash = Math.max(0, flash - dt);

    particles.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; q.life -= dt; });
    particles = particles.filter((q) => q.life > 0);
  }

  const dust = (x, y) => { for (let i = 0; i < 6; i++) particles.push({ x, y: y - 2, vx: rnd(-90, 30), vy: rnd(-80, -20), life: 0.35, c: "#5d677a" }); };

  function draw() {
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, COLORS.skyTop); g.addColorStop(1, COLORS.skyBot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // stars
    stars.forEach((s) => {
      ctx.globalAlpha = 0.4 + Math.sin(t * 2 + s.tw) * 0.3;
      ctx.fillStyle = "#cfd8ea"; ctx.fillRect(((s.x * W - distance * 0.01) % W + W) % W, s.y * H, s.r, s.r);
    });
    ctx.globalAlpha = 1;
    // crescent moon
    ctx.fillStyle = COLORS.gold2; ctx.beginPath(); ctx.arc(W - 70, 46, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.skyTop; ctx.beginPath(); ctx.arc(W - 63, 41, 14, 0, Math.PI * 2); ctx.fill();

    drawSkyline(distance * 0.12);
    drawDunes(distance * 0.3, COLORS.dune1, 6, 0.012, 8);

    // ground
    ctx.fillStyle = "#0b1120"; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = COLORS.gold; ctx.fillRect(0, groundY, W, 2);
    ctx.fillStyle = "#3b4560";
    for (let x = -(distance % 60); x < W; x += 60) ctx.fillRect(x, groundY + 20, 30, 3); // lane dashes
    ctx.fillStyle = "#1b2436"; ctx.fillRect(0, H - 6, W, 6);                          // kerb

    coins.forEach(drawCoin);
    obstacles.forEach(drawObstacle);
    drawCar(player);
    particles.forEach((q) => { ctx.globalAlpha = Math.max(0, q.life * 2); ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, 3, 3); });
    ctx.globalAlpha = 1;

    // HUD
    ctx.font = "600 14px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    const s = String(score()).padStart(5, "0");
    ctx.fillStyle = flash > 0 && Math.floor(flash * 10) % 2 ? COLORS.gold2 : COLORS.text;
    ctx.fillText(s, W - 16, 26);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText("HI " + String(hi).padStart(5, "0"), W - 90, 26);
    ctx.textAlign = "left";

    if (state === "idle") overlay("DATA RUNNER", "Press Space / ↑ or tap to start", "Jump bugs & NULLs · drop low under 404 drones · grab KPI coins");
    if (state === "over") overlay("PIPELINE CRASHED", `Score ${score()}${score() >= hi && score() > 0 ? " · New high score!" : ""}`, "Press Space or tap to run again");
  }

  function overlay(title, line1, line2) {
    ctx.fillStyle = "rgba(6,10,19,0.62)"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.gold2; ctx.font = "700 26px 'Space Grotesk', Inter, sans-serif";
    ctx.fillText(title, W / 2, H / 2 - 22);
    ctx.fillStyle = COLORS.text; ctx.font = "500 14px Inter, sans-serif";
    ctx.fillText(line1, W / 2, H / 2 + 6);
    ctx.fillStyle = COLORS.muted; ctx.font = "500 12px 'JetBrains Mono', monospace";
    ctx.fillText(line2, W / 2, H / 2 + 30);
    ctx.textAlign = "left";
  }

  function gameOver() {
    state = "over";
    const s = score();
    if (s > hi) { hi = s; store.set("dataRunnerHi", hi); }
    for (let i = 0; i < 18; i++) particles.push({ x: player.x + 24, y: player.y - 20, vx: rnd(-220, 220), vy: rnd(-300, 0), life: 0.8, c: i % 2 ? COLORS.gold : COLORS.rose });
    updateStats();
    draw();
  }

  function loop(ts) {
    const dt = Math.max(0, Math.min(0.033, (ts - lastTs) / 1000 || 0));
    lastTs = ts;
    if (state === "running" && inView && !document.hidden) { update(dt); draw(); updateStats(); }
    requestAnimationFrame(loop);
  }

  /* ---------------- Controls ---------------- */
  const jump = () => {
    if (state !== "running") { start(); return; }
    if (player.onGround) { player.vy = -760; player.onGround = false; dust(player.x + 10, groundY); }
  };
  const releaseJump = () => { if (state === "running" && player.vy < -300) player.vy = -300; }; // short hop on quick tap
  const start = () => {
    reset(); state = "running"; lastTs = performance.now();
    canvas.focus({ preventScroll: true });
  };

  canvas.addEventListener("keydown", (e) => {
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); if (!e.repeat) jump(); }
    if (["ArrowDown", "KeyS"].includes(e.code)) { e.preventDefault(); keys.down = true; }
  });
  canvas.addEventListener("keyup", (e) => {
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) releaseJump();
    if (["ArrowDown", "KeyS"].includes(e.code)) keys.down = false;
  });
  canvas.addEventListener("blur", () => (keys.down = false));
  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); canvas.focus({ preventScroll: true }); jump(); });
  canvas.addEventListener("pointerup", releaseJump);

  const jumpBtn = document.getElementById("runnerJump");
  const duckBtn = document.getElementById("runnerDuck");
  jumpBtn?.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });
  jumpBtn?.addEventListener("pointerup", releaseJump);
  duckBtn?.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state !== "running") start(); keys.down = true; });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => duckBtn?.addEventListener(ev, () => (keys.down = false)));

  // pause when scrolled away (direct viewport check, robust across browsers)
  const checkView = () => {
    const r = canvas.getBoundingClientRect();
    const was = inView;
    inView = r.bottom > 0 && r.top < window.innerHeight;
    if (inView && !was) lastTs = performance.now();
  };
  window.addEventListener("scroll", checkView, { passive: true });
  window.addEventListener("resize", checkView);
  checkView();

  /* ---------------- Stats strip ---------------- */
  const statScore = document.getElementById("runnerScore");
  const statHi = document.getElementById("runnerHi");
  const statSpeed = document.getElementById("runnerSpeed");
  function updateStats() {
    if (statScore) statScore.textContent = score();
    if (statHi) statHi.textContent = hi;
    if (statSpeed) statSpeed.textContent = (speed / 380).toFixed(1) + "×";
  }

  /* ---------------- Offline nudge ---------------- */
  const banner = document.getElementById("offlineBanner");
  const setOffline = (off) => { if (banner) banner.hidden = !off; };
  window.addEventListener("offline", () => setOffline(true));
  window.addEventListener("online", () => setOffline(false));

  resize();
  updateStats();
  draw();
  requestAnimationFrame(loop); // the game only advances after the player starts it
})();
