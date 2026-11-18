/* =====================================================================
   Mohammed Salal KK — Portfolio interactions
   ===================================================================== */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isSmall = window.innerWidth < 760;

  // Deterministic pseudo-random so demo data is stable between reloads
  const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------------- Loader ---------------- */
  const finishLoad = () => {
    $("#loader")?.classList.add("done");
    document.body.classList.add("loaded");
  };
  window.addEventListener("load", () => setTimeout(finishLoad, 350));
  setTimeout(finishLoad, 2500); // safety net

  /* ---------------- Toast ---------------- */
  let toastTimer;
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  };

  /* ---------------- Nav, progress, mobile menu ---------------- */
  const nav = $("#nav");
  const progress = $("#progress");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 30);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    updateTimeline();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");
  const setMenu = (open) => {
    mobileMenu.classList.toggle("open", open);
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  menuBtn.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
  $$("a", mobileMenu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // Active section highlighting
  const navLinks = $$(".nav-links a");
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("section[id]").forEach((s) => sectionObs.observe(s));

  /* ---------------- Cursor glow & magnetic buttons ---------------- */
  if (finePointer && !reduceMotion) {
    const glow = $("#cursorGlow");
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });
  } else {
    $("#cursorGlow").style.display = "none";
  }

  /* ---------------- 3D tilt ---------------- */
  const tilt = (el, strength = 10) => {
    if (!finePointer || reduceMotion) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform = `rotateY(${(px - 0.5) * strength}deg) rotateX(${(0.5 - py) * strength}deg)`;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  };
  tilt($("#portrait"), 14);

  /* ---------------- Reveal on scroll ---------------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        revealObs.unobserve(e.target);
        // counters inside
        $$("[data-count]", e.target).forEach(countUp);
        // skill bars inside open pillars
        if (e.target.classList.contains("pillar")) fillBars(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  function countUp(el) {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1600;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------- Typewriter roles ---------------- */
  const roles = ["MIS & Data Analyst", "Power BI Developer", "Retail & Inventory Analyst", "SQL & Excel Specialist", "E-Commerce Data Analyst"];
  const roleEl = $("#roleText");
  if (!reduceMotion) {
    let ri = 0, ci = roles[0].length, deleting = true;
    const tick = () => {
      const word = roles[ri];
      ci += deleting ? -1 : 1;
      roleEl.textContent = word.slice(0, ci);
      let delay = deleting ? 35 : 70;
      if (!deleting && ci === word.length) { deleting = true; delay = 2200; }
      else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2600);
  }

  /* ---------------- Dubai clock + sparkline ---------------- */
  const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "2-digit", month: "short" });
  const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "numeric", hour12: false, weekday: "short" });
  const updateClock = () => {
    const now = new Date();
    $("#dubaiTime").textContent = timeFmt.format(now);
    $("#dubaiDate").textContent = dateFmt.format(now);
    const parts = hourFmt.formatToParts(now);
    const hour = +parts.find((p) => p.type === "hour").value;
    const wd = parts.find((p) => p.type === "weekday").value;
    const working = !["Sat", "Sun"].includes(wd) && hour >= 9 && hour < 19;
    $("#availability").textContent = working ? "● Online now" : "Replies within hours";
    $("#availability").style.color = working ? "var(--teal)" : "var(--muted)";
  };
  updateClock();
  setInterval(updateClock, 1000);

  const spark = Array.from({ length: 24 }, (_, i) => 20 + Math.sin(i / 3) * 6 + Math.random() * 6);
  const drawSpark = () => {
    const w = 230, h = 40, max = Math.max(...spark), min = Math.min(...spark);
    const pts = spark.map((v, i) => [(i / (spark.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)]);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    $("#sparkLine").setAttribute("d", d);
    $("#sparkArea").setAttribute("d", `${d} L${w} ${h} L0 ${h} Z`);
  };
  drawSpark();
  if (!reduceMotion) setInterval(() => {
    spark.shift();
    const last = spark[spark.length - 1];
    spark.push(Math.max(8, Math.min(40, last + (Math.random() - 0.45) * 6)));
    drawSpark();
  }, 1600);

  /* =====================================================================
     3D Skyline — Dubai at night, every tower is a bar in a chart
     ===================================================================== */
  function initSkyline() {
    const canvas = $("#skyline");
    if (!window.THREE || !canvas) return;
    const T = window.THREE;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
    renderer.setClearColor(0x060a13, 1);

    const scene = new T.Scene();
    scene.fog = new T.FogExp2(0x060a13, 0.018);
    const camera = new T.PerspectiveCamera(42, 1, 0.1, 400);

    scene.add(new T.AmbientLight(0x6c7a99, 0.55));
    const moon = new T.DirectionalLight(0xf6d98f, 0.9);
    moon.position.set(-30, 50, 30);
    scene.add(moon);
    const rim = new T.DirectionalLight(0x2dd4bf, 0.5);
    rim.position.set(40, 20, -30);
    scene.add(rim);

    // Ground grid — desert gold
    const grid = new T.GridHelper(220, 88, 0xe2b659, 0xe2b659);
    grid.material.transparent = true;
    grid.material.opacity = 0.09;
    scene.add(grid);

    // Water-like reflective plane
    const ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshBasicMaterial({ color: 0x070c17 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    const rand = seeded(42);
    const unitBox = new T.BoxGeometry(1, 1, 1);
    unitBox.translate(0, 0.5, 0);
    const unitEdges = new T.EdgesGeometry(unitBox);
    const bodyMat = new T.MeshStandardMaterial({ color: 0x0c1528, roughness: 0.6, metalness: 0.4, emissive: 0x050a14 });
    const edgeGold = new T.LineBasicMaterial({ color: 0xe2b659, transparent: true, opacity: 0.7 });
    const edgeTeal = new T.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.45 });
    const winMat = new T.PointsMaterial({ color: 0xf6d98f, size: isSmall ? 1.6 : 2, sizeAttenuation: false, transparent: true, opacity: 0.85 });

    const towers = []; // {obj, target, delay}
    const cityW = isSmall ? 20 : 34;
    const step = isSmall ? 3 : 2.6;
    for (let x = -cityW; x <= cityW; x += step) {
      for (let z = -26; z <= 4; z += step) {
        if (rand() < 0.28) continue;
        const dCenter = Math.hypot(x, z + 8);
        if (dCenter < 4.5) continue; // leave room for the hero tower
        const heightBoost = Math.max(0, 1 - dCenter / 34);
        const h = 2 + rand() * 6 + heightBoost * heightBoost * 18 * (0.5 + rand());
        const w = 1.1 + rand() * 1.1, d = 1.1 + rand() * 1.1;

        const g = new T.Group();
        g.position.set(x + (rand() - 0.5), 0, z + (rand() - 0.5));
        const holder = new T.Group(); // scaled for height animation
        holder.scale.set(w, 0.001, d);
        const mesh = new T.Mesh(unitBox, bodyMat);
        const edges = new T.LineSegments(unitEdges, rand() < 0.75 ? edgeGold : edgeTeal);
        holder.add(mesh, edges);

        // windows: random lit points on the 4 faces (unit space)
        const nWin = Math.floor(6 + h * 2.2);
        const pos = new Float32Array(nWin * 3);
        for (let i = 0; i < nWin; i++) {
          const face = Math.floor(rand() * 4);
          const u = rand() - 0.5;
          const v = 0.05 + rand() * 0.9;
          const o = 0.505;
          const [px, pz] = face === 0 ? [u, o] : face === 1 ? [u, -o] : face === 2 ? [o, u] : [-o, u];
          pos.set([px, v, pz], i * 3);
        }
        const wg = new T.BufferGeometry();
        wg.setAttribute("position", new T.BufferAttribute(pos, 3));
        holder.add(new T.Points(wg, winMat));

        g.add(holder);
        scene.add(g);
        towers.push({ obj: holder, target: h, delay: 0.25 + (dCenter / 40) * 1.2 + rand() * 0.3 });
      }
    }

    // Hero tower — tiered, tapering spire inspired by Dubai's tallest skyline
    const hero = new T.Group();
    hero.position.set(0, 0, -8);
    const tiers = [
      [2.6, 7], [2.15, 6], [1.75, 5.5], [1.4, 5], [1.05, 4.5], [0.75, 4], [0.45, 3.5], [0.22, 3],
    ];
    let yAcc = 0;
    const heroMat = new T.MeshStandardMaterial({ color: 0x111d33, roughness: 0.35, metalness: 0.8, emissive: 0x0a1222 });
    const heroEdge = new T.LineBasicMaterial({ color: 0xf6d98f, transparent: true, opacity: 0.9 });
    tiers.forEach(([r, h]) => {
      const geo = new T.CylinderGeometry(r * 0.82, r, h, 6, 1);
      geo.translate(0, h / 2, 0);
      const m = new T.Mesh(geo, heroMat);
      m.position.y = yAcc;
      const e = new T.LineSegments(new T.EdgesGeometry(geo), heroEdge);
      e.position.y = yAcc;
      hero.add(m, e);
      yAcc += h;
    });
    const spireGeo = new T.ConeGeometry(0.12, 9, 6);
    spireGeo.translate(0, 4.5, 0);
    const spire = new T.Mesh(spireGeo, new T.MeshBasicMaterial({ color: 0xf6d98f }));
    spire.position.y = yAcc;
    hero.add(spire);
    const beacon = new T.PointLight(0xf6d98f, 2.2, 30);
    beacon.position.y = yAcc + 9;
    hero.add(beacon);
    const heroHeight = yAcc + 9;
    hero.scale.y = 0.001;
    scene.add(hero);

    // Glowing line chart arcing over the skyline
    const pts = [];
    const lr = seeded(7);
    for (let i = 0; i <= 12; i++) {
      const x = -cityW - 4 + (i / 12) * (cityW * 2 + 8);
      const y = 20 + i * 1.6 + (lr() - 0.5) * 7;
      pts.push(new T.Vector3(x, y, -2 - Math.sin(i / 2) * 3));
    }
    const curve = new T.CatmullRomCurve3(pts);
    const tubeSegs = 300;
    const tube = new T.TubeGeometry(curve, tubeSegs, 0.09, 6, false);
    const tubeMesh = new T.Mesh(tube, new T.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.9 }));
    tube.setDrawRange(0, 0);
    scene.add(tubeMesh);
    const tubeIndexCount = tube.index.count;
    // data points on the line
    const dotMat = new T.MeshBasicMaterial({ color: 0xf6d98f });
    const dots = pts.slice(1, -1).map((p, i) => {
      const s = new T.Mesh(new T.SphereGeometry(0.32, 12, 12), dotMat);
      s.position.copy(p);
      s.scale.setScalar(0.001);
      s.userData.t = (i + 1) / 12;
      scene.add(s);
      return s;
    });
    const runner = new T.Mesh(new T.SphereGeometry(0.5, 16, 16), new T.MeshBasicMaterial({ color: 0xffffff }));
    const runnerLight = new T.PointLight(0x2dd4bf, 2, 16);
    runner.add(runnerLight);
    runner.visible = false;
    scene.add(runner);

    // Stars / desert dust
    const starCount = isSmall ? 500 : 1100;
    const sp = new Float32Array(starCount * 3);
    const sr = seeded(99);
    for (let i = 0; i < starCount; i++) {
      sp.set([(sr() - 0.5) * 260, 12 + sr() * 90, -120 + sr() * 150], i * 3);
    }
    const starGeo = new T.BufferGeometry();
    starGeo.setAttribute("position", new T.BufferAttribute(sp, 3));
    const stars = new T.Points(starGeo, new T.PointsMaterial({ color: 0xcfd8ea, size: 1.2, sizeAttenuation: false, transparent: true, opacity: 0.7 }));
    scene.add(stars);

    // Sizing
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // Interaction
    let mx = 0, my = 0, cmx = 0, cmy = 0;
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

    const easeOut = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
    const t0 = performance.now();
    const offsetX = isSmall ? 0 : 12; // shift city right on desktop so text sits left

    const render = (now) => {
      const t = reduceMotion ? 10 : (now - t0) / 1000;
      const growT = t - 0.6;

      towers.forEach((tw) => (tw.obj.scale.y = Math.max(0.001, tw.target * easeOut((growT - tw.delay) / 1.4))));
      hero.scale.y = Math.max(0.001, easeOut((growT - 0.1) / 2));

      const lineP = easeOut((growT - 1.8) / 2.2);
      tube.setDrawRange(0, Math.floor(tubeIndexCount * lineP / 6) * 6);
      dots.forEach((d) => d.scale.setScalar(lineP >= d.userData.t ? Math.min(1, (lineP - d.userData.t) * 12 + 0.001) : 0.001));
      if (lineP >= 1) {
        runner.visible = true;
        const u = ((t * 0.06) % 1);
        runner.position.copy(curve.getPointAt(u));
      }

      beacon.intensity = 1.6 + Math.sin(t * 3) * 0.8;
      stars.rotation.y = t * 0.004;

      cmx += (mx - cmx) * 0.04;
      cmy += (my - cmy) * 0.04;
      const orbit = reduceMotion ? 0 : Math.sin(t * 0.08) * 0.18 + cmx * 0.35;
      const radius = isSmall ? 95 : 84;
      camera.position.set(Math.sin(orbit) * radius - offsetX * 0.5, 20 + cmy * -6 + Math.max(0, 3 - t) * 4, Math.cos(orbit) * radius - 8);
      camera.lookAt(-offsetX * 0.5 - (isSmall ? 0 : 12), heroHeight * 0.48, -8);

      renderer.render(scene, camera);
    };

    const loop = (now) => {
      if (visible) render(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* =====================================================================
     Charts (Chart.js)
     ===================================================================== */
  const C = {
    gold: "#e2b659", gold2: "#f6d98f", teal: "#2dd4bf", sql: "#5b9cff", rose: "#fb7185",
    muted: "#8e99ad", grid: "rgba(255,255,255,0.06)", pbi: "#f2c811", orange: "#fb923c",
  };
  const charts = {};

  function chartDefaults() {
    const Ch = window.Chart;
    Ch.defaults.color = C.muted;
    Ch.defaults.font.family = "Inter, system-ui, sans-serif";
    Ch.defaults.font.size = 11;
    Ch.defaults.borderColor = C.grid;
    Ch.defaults.plugins.legend.labels.boxWidth = 10;
    Ch.defaults.plugins.legend.labels.boxHeight = 10;
    Ch.defaults.plugins.tooltip.backgroundColor = "rgba(10,17,32,.95)";
    Ch.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,.12)";
    Ch.defaults.plugins.tooltip.borderWidth = 1;
    Ch.defaults.plugins.tooltip.padding = 10;
    Ch.defaults.maintainAspectRatio = false;
    if (reduceMotion) Ch.defaults.animation = false;
  }

  /* ---------- Power BI demo ---------- */
  const BRANCHES = {
    dxb: ["Al Barsha", "Deira", "JLT", "Karama", "Al Quoz"],
    auh: ["Khalidiya", "Mussafah", "Al Reem", "Hamdan", "Shamkha"],
  };
  const SEASON = {
    regular: { mult: 1, mix: [38, 22, 16, 14, 10], ly: 0.93 },
    ramadan: { mult: 1.42, mix: [46, 24, 10, 12, 8], ly: 0.88 },
    eid: { mult: 1.28, mix: [34, 18, 14, 22, 12], ly: 0.9 },
    school: { mult: 1.12, mix: [30, 18, 26, 14, 12], ly: 0.95 },
  };
  const MIX_LABELS = ["Grocery & Fresh", "Beverages", "Stationery & Kids", "Household", "Personal Care"];
  const pbiState = { season: "regular", region: "all" };

  function pbiData() {
    const s = SEASON[pbiState.season];
    const names = pbiState.region === "all" ? [...BRANCHES.dxb.slice(0, 3), ...BRANCHES.auh.slice(0, 3)] : BRANCHES[pbiState.region];
    const r = seeded(names.join("").length * 31 + Object.keys(SEASON).indexOf(pbiState.season) * 7 + 3);
    const sales = names.map(() => Math.round((280 + r() * 260) * s.mult));
    const target = sales.map((v) => Math.round(v * (0.9 + r() * 0.22)));
    const days = 30;
    const trendTY = [], trendLY = [];
    let accTY = 0, accLY = 0;
    for (let d = 1; d <= days; d++) {
      const weekend = d % 7 === 5 || d % 7 === 6 ? 1.3 : 1;
      const seasonal = pbiState.season === "ramadan" ? 1 + Math.sin((d / days) * Math.PI) * 0.4 : pbiState.season === "eid" && d > 22 ? 1.6 : 1;
      accTY += (90 + r() * 40) * weekend * seasonal * s.mult;
      accLY += (90 + r() * 40) * weekend * seasonal * s.mult * s.ly;
      trendTY.push(Math.round(accTY));
      trendLY.push(Math.round(accLY));
    }
    const totalSales = sales.reduce((a, b) => a + b, 0);
    return {
      names, sales, target, trendTY, trendLY,
      mix: s.mix,
      aging: [Math.round(14200 * (s.mult > 1.2 ? 1.08 : 1)), Math.round(6800 / s.mult), Math.round(2600 / s.mult), Math.round(1400 / (s.mult * 0.9))],
      kpi: {
        sales: totalSales,
        salesD: ((1 / s.ly - 1) * 100),
        margin: 24.6 + (r() - 0.5) * 2 - (pbiState.season === "ramadan" ? 1.4 : 0),
        atv: 86 * (pbiState.season === "school" ? 1.18 : s.mult > 1.3 ? 1.12 : 1) + r() * 6,
        dio: Math.round(30 / (s.mult * 0.95)),
      },
    };
  }

  function renderKpis(k) {
    $("#kSales").textContent = `AED ${(k.sales / 1000).toFixed(2)}M`;
    $("#kSalesD").textContent = `▲ ${k.salesD.toFixed(1)}% vs LY`;
    $("#kMargin").textContent = `${k.margin.toFixed(1)}%`;
    $("#kMarginD").textContent = `▲ ${(k.margin - 23.1).toFixed(1)} pts`;
    $("#kAtv").textContent = `AED ${k.atv.toFixed(0)}`;
    $("#kAtvD").textContent = `▲ ${((k.atv / 82 - 1) * 100).toFixed(1)}%`;
    $("#kDio").textContent = `${k.dio} days`;
    const good = k.dio <= 32;
    $("#kDioD").textContent = good ? `▼ ${36 - k.dio} days` : `▲ ${k.dio - 32} days`;
    $("#kDioD").className = `delta ${good ? "up" : "down"}`;
  }

  function initPbi() {
    const d = pbiData();
    renderKpis(d.kpi);
    const Ch = window.Chart;
    charts.branch = new Ch($("#chBranch"), {
      type: "bar",
      data: {
        labels: d.names,
        datasets: [
          { label: "Sales", data: d.sales, backgroundColor: C.pbi, borderRadius: 4, barPercentage: 0.7 },
          { label: "Target", data: d.target, type: "line", borderColor: C.teal, backgroundColor: C.teal, pointRadius: 3, borderWidth: 2, tension: 0.3 },
        ],
      },
      options: { plugins: { legend: { position: "top", align: "end" } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } },
    });
    charts.trend = new Ch($("#chTrend"), {
      type: "line",
      data: {
        labels: d.trendTY.map((_, i) => i + 1),
        datasets: [
          { label: "This year", data: d.trendTY, borderColor: C.gold, backgroundColor: "rgba(226,182,89,.12)", fill: true, pointRadius: 0, tension: 0.35, borderWidth: 2 },
          { label: "Last year", data: d.trendLY, borderColor: "rgba(142,153,173,.7)", borderDash: [5, 4], pointRadius: 0, tension: 0.35, borderWidth: 1.5 },
        ],
      },
      options: { interaction: { mode: "index", intersect: false }, plugins: { legend: { position: "top", align: "end" } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } } } },
    });
    charts.mix = new Ch($("#chMix"), {
      type: "doughnut",
      data: { labels: MIX_LABELS, datasets: [{ data: d.mix, backgroundColor: [C.pbi, C.teal, C.sql, C.gold, C.rose], borderColor: "#0b1222", borderWidth: 3, hoverOffset: 8 }] },
      options: { cutout: "64%", plugins: { legend: { position: "right" } } },
    });
    charts.aging = new Ch($("#chAging"), {
      type: "bar",
      data: { labels: ["0–30d", "31–90d", "91–180d", "180d+"], datasets: [{ label: "SKUs", data: d.aging, backgroundColor: [C.teal, C.gold, C.orange, C.rose], borderRadius: 4 }] },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { y: { grid: { display: false } } } },
    });
  }

  function updatePbi() {
    if (!charts.branch) return;
    const d = pbiData();
    renderKpis(d.kpi);
    charts.branch.data.labels = d.names;
    charts.branch.data.datasets[0].data = d.sales;
    charts.branch.data.datasets[1].data = d.target;
    charts.trend.data.datasets[0].data = d.trendTY;
    charts.trend.data.datasets[1].data = d.trendLY;
    charts.mix.data.datasets[0].data = d.mix;
    charts.aging.data.datasets[0].data = d.aging;
    Object.values(charts).forEach((c) => c !== charts.radar && c !== charts.forecast && c.update());
  }

  const bindSlicer = (id, key) => {
    $$(`#${id} button`).forEach((b) =>
      b.addEventListener("click", () => {
        $$(`#${id} button`).forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        pbiState[key] = b.dataset[key];
        updatePbi();
      })
    );
  };
  bindSlicer("seasonSlicer", "season");
  bindSlicer("regionSlicer", "region");

  /* ---------- Python forecast ---------- */
  function initForecast() {
    const r = seeded(2024);
    const actual = [];
    for (let i = 0; i < 26; i++) actual.push(Math.round(420 + i * 6 + Math.sin(i / 1.9) * 60 + (r() - 0.5) * 50));
    const fc = [];
    for (let i = 26; i < 34; i++) fc.push(Math.round(420 + i * 6 + Math.sin(i / 1.9) * 60));
    const labels = Array.from({ length: 34 }, (_, i) => `W${i + 1}`);
    const pad = (arr, before) => [...Array(before).fill(null), ...arr];
    const fcLine = pad([actual[25], ...fc], 25);
    const upper = pad([actual[25], ...fc.map((v, i) => v + 30 + i * 9)], 25);
    const lower = pad([actual[25], ...fc.map((v, i) => v - 30 - i * 9)], 25);
    const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const std = Math.sqrt(actual.reduce((a, b) => a + (b - mean) ** 2, 0) / (actual.length - 1));
    $("#safetyStock").textContent = Math.round(1.65 * std * Math.SQRT2);

    charts.forecast = new window.Chart($("#chForecast"), {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Actual", data: actual, borderColor: C.sql, pointRadius: 0, borderWidth: 2, tension: 0.3 },
          { label: "Forecast", data: fcLine, borderColor: C.py || "#ffd43b", borderDash: [6, 4], pointRadius: 2, borderWidth: 2, tension: 0.3 },
          { label: "95% band", data: upper, borderColor: "transparent", backgroundColor: "rgba(255,212,59,.12)", fill: "+1", pointRadius: 0 },
          { label: "_lower", data: lower, borderColor: "transparent", pointRadius: 0, fill: false },
        ],
      },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { position: "top", align: "end", labels: { filter: (i) => !i.text.startsWith("_") } } },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 9 } } },
      },
    });
  }
  C.py = "#ffd43b";

  /* ---------- Skills radar ---------- */
  function initRadar() {
    charts.radar = new window.Chart($("#chRadar"), {
      type: "radar",
      data: {
        labels: ["Retail domain", "Power BI / DAX", "SQL", "Excel / PQ", "Python", "Statistics"],
        datasets: [{
          label: "Proficiency",
          data: [95, 94, 92, 95, 85, 86],
          backgroundColor: "rgba(226,182,89,.18)",
          borderColor: C.gold,
          pointBackgroundColor: C.gold2,
          pointBorderColor: "#0b1222",
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 2,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 50, max: 100,
            ticks: { display: false, stepSize: 10 },
            grid: { color: "rgba(255,255,255,.08)" },
            angleLines: { color: "rgba(255,255,255,.08)" },
            pointLabels: { color: "#c9d1de", font: { size: 12, family: "Space Grotesk, Inter, sans-serif" } },
          },
        },
      },
    });
  }

  // Lazy-init charts when their section is near the viewport
  const lazyQueue = [];
  const checkLazy = () => {
    for (let i = lazyQueue.length - 1; i >= 0; i--) {
      const { el, fn } = lazyQueue[i];
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 300 && r.bottom > -300) {
        lazyQueue.splice(i, 1);
        try { fn(); } catch (err) { console.error(err); }
      }
    }
  };
  const lazy = (el, fn) => {
    if (!el) return;
    lazyQueue.push({ el, fn });
    checkLazy();
  };
  window.addEventListener("scroll", checkLazy, { passive: true });
  window.addEventListener("resize", checkLazy);

  /* ---------------- Studio tabs ---------------- */
  const titles = {
    pbi: "Retail_Performance.pbix — Executive Overview",
    excel: "Stock_Aging_Model.xlsx — Stock_Aging",
    sql: "branch_growth.sql — SQL Server · RetailDW",
    py: "demand_forecast.ipynb — Python 3.11",
  };
  $$(".studio-tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      $$(".studio-tab").forEach((t) => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      $$(".pane").forEach((p) => p.classList.remove("active"));
      $(`#pane-${tab.dataset.tool}`).classList.add("active");
      $("#windowTitle").textContent = titles[tab.dataset.tool];
      if (tab.dataset.tool === "py" && !charts.forecast && window.Chart) initForecast();
      if (tab.dataset.tool === "pbi") Object.values(charts).forEach((c) => c.resize());
    })
  );

  /* ---------------- Excel demo ---------------- */
  const xlRows = [
    ["SKU-10421", "Basmati Rice 5kg", "Grocery", 22, 18450],
    ["SKU-20877", "Dates Premium 1kg", "Grocery", 196, 9620],
    ["SKU-31109", "Laban 1L", "Dairy", 6, 4380],
    ["SKU-44520", "School Bag Junior", "Stationery", 134, 12740],
    ["SKU-51236", "Detergent 3L", "Household", 58, 7210],
    ["SKU-62981", "Olive Oil 750ml", "Grocery", 211, 15330],
    ["SKU-70044", "Shampoo 400ml", "Personal Care", 41, 5890],
    ["SKU-88315", "Water 12x1.5L", "Beverages", 9, 11260],
  ];
  const tierOf = (d) => (d > 180 ? [">180d", "t4"] : d > 90 ? ["91–180d", "t3"] : d > 30 ? ["31–90d", "t2"] : ["0–30d", "t1"]);
  const actionOf = (d) => (d > 180 ? "Clearance" : d > 90 ? "Markdown 20%" : d > 30 ? "Monitor" : "Hold");
  const headers = ["SKU", "Item", "Category", "Days on Hand", "Aging Tier", "Stock Value (AED)", "Action"];
  let xlSort = { col: -1, dir: 1 };
  let xlSel = { r: 0, c: 4 };

  const xlFormula = (r, c, row) => {
    const n = r + 2;
    switch (c) {
      case 0: return row[0];
      case 1: return `=XLOOKUP(A${n},Items[SKU],Items[Description])`;
      case 2: return `=XLOOKUP(A${n},Items[SKU],Items[Category],"Unmapped")`;
      case 3: return `=TODAY()-MAXIFS(GRN[Receipt_Date],GRN[SKU],A${n})`;
      case 4: return `=IFS(D${n}>180,">180d",D${n}>90,"91–180d",D${n}>30,"31–90d",TRUE,"0–30d")`;
      case 5: return `=SUMIFS(Stock[Value_AED],Stock[SKU],A${n},Stock[Branch],"<>Closed")`;
      case 6: return `=IF(D${n}>180,"Clearance",IF(D${n}>90,"Markdown 20%",IF(D${n}>30,"Monitor","Hold")))`;
    }
  };

  function renderXl() {
    const tbody = $("#xlGrid tbody");
    const rows = [...xlRows];
    if (xlSort.col >= 0) {
      const k = xlSort.col === 4 || xlSort.col === 6 ? 3 : xlSort.col;
      rows.sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * xlSort.dir);
    }
    const maxVal = Math.max(...rows.map((r) => r[4]));
    let html = `<tr class="hdr"><th>1</th>${headers.map((h, i) => `<td data-sort="${i}">${h}${xlSort.col === i ? (xlSort.dir > 0 ? " ▲" : " ▼") : ""}</td>`).join("")}</tr>`;
    rows.forEach((row, r) => {
      const [tier, cls] = tierOf(row[3]);
      const cells = [
        row[0], row[1], row[2],
        `<span>${row[3]}</span>`,
        `<span class="tier ${cls}">${tier}</span>`,
        `<span>${row[4].toLocaleString("en-US")}</span>`,
        actionOf(row[3]),
      ];
      html += `<tr><th>${r + 2}</th>${cells.map((v, c) => {
        const classes = ["cell"];
        if (c === 3 || c === 5) classes.push("num");
        if (c === 5) classes.push("databar");
        if (xlSel.r === r && xlSel.c === c) classes.push("sel");
        const style = c === 5 ? ` style="--w:${(row[4] / maxVal) * 100}%"` : "";
        return `<td class="${classes.join(" ")}" data-r="${r}" data-c="${c}"${style}>${v}</td>`;
      }).join("")}</tr>`;
    });
    tbody.innerHTML = html;
    tbody._rows = rows;
    selectXl(xlSel.r, xlSel.c, rows);
  }

  function selectXl(r, c, rows) {
    xlSel = { r, c };
    const row = rows[r];
    const colLetter = String.fromCharCode(65 + c);
    $("#xlRef").textContent = `${colLetter}${r + 2}`;
    $("#xlInput").textContent = xlFormula(r, c, row);
    $$("#xlGrid td.sel").forEach((td) => td.classList.remove("sel"));
    $(`#xlGrid td[data-r="${r}"][data-c="${c}"]`)?.classList.add("sel");
    if (c === 3 || c === 5) {
      const k = c === 3 ? 3 : 4;
      const vals = rows.map((x) => x[k]);
      const sum = vals.reduce((a, b) => a + b, 0);
      $("#xlStatus").textContent = `Average: ${(sum / vals.length).toLocaleString("en-US", { maximumFractionDigits: 1 })}   Count: ${vals.length}   Sum: ${sum.toLocaleString("en-US")}`;
    } else {
      $("#xlStatus").textContent = "Click a cell to see its formula · click a header to sort";
    }
  }

  $("#xlGrid").addEventListener("click", (e) => {
    const td = e.target.closest("td");
    if (!td) return;
    if (td.dataset.sort !== undefined) {
      const col = +td.dataset.sort;
      xlSort = { col, dir: xlSort.col === col ? -xlSort.dir : 1 };
      renderXl();
      return;
    }
    if (td.dataset.r !== undefined) selectXl(+td.dataset.r, +td.dataset.c, $("#xlGrid tbody")._rows);
  });
  renderXl();

  /* ---------------- SQL demo ---------------- */
  const sqlRows = [
    [1, "Al Barsha", 612480, 18.4],
    [2, "Khalidiya", 574310, 15.9],
    [3, "JLT", 498760, 12.2],
    [4, "Mussafah", 455120, 9.7],
    [5, "Deira", 431900, 6.3],
    [6, "Al Reem", 389240, 3.1],
  ];
  $("#runSql").addEventListener("click", () => {
    const btn = $("#runSql");
    const status = $("#sqlStatus");
    const table = $("#sqlTable");
    btn.disabled = true;
    status.textContent = "Executing…";
    $("#sqlEmpty").hidden = true;
    table.hidden = false;
    const tbody = $("tbody", table);
    tbody.innerHTML = "";
    const t0 = performance.now();
    setTimeout(() => {
      sqlRows.forEach((r, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><span class="rank">${r[0]}</span></td><td>${r[1]}</td><td>${r[2].toLocaleString("en-US")}</td><td class="up">+${r[3].toFixed(1)}%</td>`;
        tbody.appendChild(tr);
        setTimeout(() => tr.classList.add("show"), 80 * i + 20);
      });
      const ms = (performance.now() - t0) / 1000 * 0.12;
      status.innerHTML = `<span class="up">✓</span> ${sqlRows.length} rows · ${ms.toFixed(3)}s`;
      btn.disabled = false;
    }, 650);
  });

  /* ---------------- Skills pillars ---------------- */
  function fillBars(pillar) {
    if (!pillar.classList.contains("open")) return;
    $$(".bar-fill", pillar).forEach((b) => (b.style.width = `${b.dataset.w}%`));
  }
  $$(".pillar").forEach((p) => {
    $(".pillar-head", p).addEventListener("click", () => {
      const open = !p.classList.contains("open");
      p.classList.toggle("open", open);
      $(".pillar-head", p).setAttribute("aria-expanded", String(open));
      if (open) setTimeout(() => fillBars(p), 150);
      else $$(".bar-fill", p).forEach((b) => (b.style.width = "0"));
    });
  });

  /* ---------------- Experience accordion & timeline ---------------- */
  $$(".job").forEach((job) => {
    $(".job-head", job).addEventListener("click", () => {
      const open = !job.classList.contains("open");
      job.classList.toggle("open", open);
      $(".job-head", job).setAttribute("aria-expanded", String(open));
    });
  });
  const timeline = $("#timeline");
  const timelineFill = $("#timelineFill");
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const p = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
    timelineFill.style.height = `${p * (r.height - 16)}px`;
  }

  /* ---------------- Projects ---------------- */
  const PROJECTS = [
    {
      title: "Retail Performance Dashboard — Advanced Power BI Solution",
      tag: "Power BI · DAX", tool: ["BI", "i-pbi"], cats: ["powerbi", "retail"],
      img: "assets/retail_bi.png",
      blurb: "Executive dashboard giving branch-level visibility into revenue, gross margin, SKU movement and growth (MTD, YTD, YoY).",
      chips: ["Star schema", "DAX time intelligence", "Branch ranking", "Margin velocity"],
      problem: "Leadership could not compare branch revenue and margin quickly. Reports were built by hand and were often days old.",
      approach: "Built a star-schema model with DAX time-intelligence measures (MTD, YTD, YoY), dynamic branch ranking and drill-through from category to SKU.",
      outcome: "One place to see revenue, margin and SKU performance, ready for the morning trading meeting.",
      links: [["Case study (PDF)", "assets/Retail Performance Dashboard - Advanced Power BI Solution.pdf"], ["GitHub", "https://github.com/MOHDSALAL-KK/RETAIL-DASHBOARD"]],
    },
    {
      title: "E-Commerce Product & Order Insights Dashboard (Amazon)",
      tag: "E-commerce · Power BI", tool: ["BI", "i-pbi"], cats: ["powerbi", "retail"],
      img: "assets/project-2.png",
      blurb: "Analysis of fulfillment speed, order status, return rates, regional demand and seller margins for an Amazon catalogue.",
      chips: ["Fulfillment speed", "Returns analysis", "Geo heatmap", "Seller margins"],
      problem: "Order, return and fulfillment data sat in separate exports, so it was hard to see where margin was being lost.",
      approach: "Cleaned and modelled the order data, then built visuals for fulfillment time, return reasons, demand by region and margin by seller.",
      outcome: "Showed which categories and regions had the most returns and the slowest fulfillment, so action could focus there.",
      links: [["Case study (PDF)", "assets/E-commerce Product and Order Insights Dashboard(Amazon).pdf"], ["GitHub", "https://github.com/MOHDSALAL-KK/E-commerce-Product-and-Order-Insights-Dashboard-Amazon"]],
    },
    {
      title: "Retail Sales KPI Dashboard — Google Sheets",
      tag: "Google Sheets · Cloud", tool: ["GS", "i-gs"], cats: ["sheets", "retail"],
      img: "assets/retail_gsheet.png",
      blurb: "Lightweight cloud dashboard tracking shift performance, daily target achievement, cashier efficiency and basket size.",
      chips: ["QUERY()", "IMPORTRANGE", "Automated sync", "Conditional formatting"],
      problem: "Branch teams needed same-day KPIs but did not have Power BI licences or heavy desktop software.",
      approach: "Built a Google Sheets dashboard using QUERY and IMPORTRANGE that pulls from shared data sheets, with target-versus-actual formatting.",
      outcome: "Shift and branch KPIs that any team can open in a browser, with no extra software or licence cost.",
      links: [["Case study (PDF)", "assets/Retail Sales KPI Dashboard.pdf"], ["Live sheet", "https://docs.google.com/spreadsheets/d/1iasL8M_5HJU3oCQYPTZA9xEzoM5mtYS1j_X3eGhvoMs/edit?gid=1153479738#gid=1153479738"]],
    },
    {
      title: "Employee Attrition — HR Analysis Dashboard",
      tag: "HR analytics · Power BI", tool: ["BI", "i-pbi"], cats: ["powerbi"],
      img: "assets/hr.png",
      blurb: "Diagnostic HR dashboard showing what drives attrition: job satisfaction, tenure groups and role-level risk.",
      chips: ["Turnover risk", "Satisfaction index", "Tenure cohorts", "Diagnostic analysis"],
      problem: "HR could see that turnover was high but not which roles, tenure groups or satisfaction factors were behind it.",
      approach: "Broke attrition down by department, role, tenure and satisfaction scores, with interactive filters to compare groups.",
      outcome: "Identified the highest-risk groups so HR could target retention efforts.",
      links: [["Case study (PDF)", "assets/Employee_Attrition_HR_Analysis_Dashboard.pdf"], ["GitHub", "https://github.com/MOHDSALAL-KK/Employee_Attrition_HR_Analysis_Dashboard"]],
    },
  ];
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M8 7h9v9"/></svg>';

  $("#projectGrid").innerHTML = PROJECTS.map((p, i) => `
    <article class="project reveal" data-delay="${i % 2}" data-cats="${p.cats.join(" ")}">
      <div class="project-card">
        <div class="shine"></div>
        <div class="project-media">
          <img src="${encodeURI(p.img)}" alt="${esc(p.title)} preview" loading="lazy" />
          <span class="project-tool"><i class="${p.tool[1]}">${p.tool[0]}</i>${esc(p.tag)}</span>
        </div>
        <div class="project-body">
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.blurb)}</p>
          <div class="chips" style="margin-bottom:18px">${p.chips.slice(0, 3).map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
          <div class="project-foot">
            <button class="link-arrow" data-open="${i}">View case study ${arrow}</button>
            <a class="link-arrow" style="color:var(--muted)" href="${encodeURI(p.links[1][1])}" target="_blank" rel="noopener">${esc(p.links[1][0])} ${arrow}</a>
          </div>
        </div>
      </div>
    </article>`).join("");
  $$("#projectGrid .reveal").forEach((el) => revealObs.observe(el));
  $$("#projectGrid .project-card").forEach((c) => tilt(c, 7));

  $$("#filters .filter").forEach((f) =>
    f.addEventListener("click", () => {
      $$("#filters .filter").forEach((x) => x.classList.remove("on"));
      f.classList.add("on");
      const cat = f.dataset.filter;
      $$("#projectGrid .project").forEach((p) => {
        const show = cat === "all" || p.dataset.cats.split(" ").includes(cat);
        p.classList.toggle("hide", !show);
        if (show) p.classList.add("in");
      });
    })
  );

  const modal = $("#modal");
  let lastFocus;
  const openModal = (i) => {
    const p = PROJECTS[i];
    $("#modalImg").src = encodeURI(p.img);
    $("#modalImg").alt = p.title;
    $("#modalTag").textContent = p.tag;
    $("#modalTitle").textContent = p.title;
    $("#modalProblem").textContent = p.problem;
    $("#modalApproach").textContent = p.approach;
    $("#modalOutcome").textContent = p.outcome;
    $("#modalChips").innerHTML = p.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("");
    $("#modalActions").innerHTML = p.links.map(([label, href], j) =>
      `<a class="btn ${j === 0 ? "btn-gold" : "btn-ghost"}" href="${encodeURI(href)}" target="_blank" rel="noopener">${esc(label)} ${arrow}</a>`).join("");
    lastFocus = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $(".modal-close", modal).focus();
  };
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus();
  };
  $("#projectGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (b) openModal(+b.dataset.open);
  });
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

  /* ---------------- Copy & contact form ---------------- */
  $$("[data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        toast("Copied to clipboard ✓");
      } catch {
        toast(b.dataset.copy);
      }
    })
  );

  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim(), email = f.email.value.trim(), msg = f.message.value.trim(), type = f.type.value;
    if (!name || !email || !msg || !/^\S+@\S+\.\S+$/.test(email)) {
      toast("Please fill in your name, a valid email and a message.");
      return;
    }
    const subject = `${type} — ${name}`;
    const body = `${msg}\n\n— ${name} (${email})`;
    window.location.href = `mailto:kkmohdsalal@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast("Opening your email app…");
  });

  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Boot heavy libs once deferred scripts are ready ---------------- */
  const boot = () => {
    initSkyline();
    if (window.Chart) {
      chartDefaults();
      lazy($("#studio"), initPbi);
      lazy($("#skills"), initRadar);
    }
    onScroll();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
