/* =====================================================================
   3D layer — extruded name, scroll-linked depth, career globe, tool cube
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* ---------------- Word-by-word 3D flip headings ---------------- */
  const splitWords = (root) => {
    let i = 0;
    const walk = (node, extraClass) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            if (extraClass) inner.className = extraClass;
            inner.style.setProperty("--i", i++);
            inner.textContent = p;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          if (child.classList.contains("grad")) {
            // move the gradient onto every word so each word keeps it
            child.classList.remove("grad");
            walk(child, "grad");
          } else walk(child, extraClass);
        }
      });
    };
    walk(root, "");
  };
  $$(".split").forEach(splitWords);

  // Headings that are not .reveal elements get their own trigger
  const splitObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); splitObs.unobserve(e.target); } });
  }, { threshold: 0.3 });
  $$(".split:not(.reveal)").forEach((el) => splitObs.observe(el));

  /* ---------------- Generic 3D tilt with depth ---------------- */
  const tilt3d = (el, strength = 8) => {
    if (!finePointer || reduceMotion) return;
    el.addEventListener("pointerenter", () => el.classList.add("tilting"));
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * strength}deg) rotateX(${(0.5 - py) * strength}deg) translateZ(10px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
      setTimeout(() => el.classList.remove("tilting"), 200);
    });
  };
  $$(".stat, .focus, .edu-card, .kpi, .channel, .lang").forEach((el) => tilt3d(el, 10));

  /* ---------------- Extruded 3D name that follows the cursor ---------------- */
  const h1 = $(".hero h1");
  const gold = ["#7a5d27", "#6b5223", "#5a441c", "#4a3816", "#3b2c11", "#2d210c", "#201708", "#150f05"];
  const silver = ["#9aa3b5", "#8b94a6", "#6f7889", "#575f6e", "#424955", "#31363f", "#22262d", "#16191e"];
  const buildShadow = (dx, dy, pal) =>
    pal.map((c, i) => `${(dx * (i + 1)).toFixed(2)}px ${(dy * (i + 1)).toFixed(2)}px 0 ${c}`).join(", ") +
    `, ${(dx * 12).toFixed(1)}px ${(dy * 16).toFixed(1)}px 28px rgba(0,0,0,.75)`;

  if (h1 && finePointer && !reduceMotion) {
    let tx = 0.3, ty = 0.3, cx = 0.3, cy = 0.3, rx = 0, ry = 0, crx = 0, cry = 0;
    window.addEventListener("pointermove", (e) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      tx = -px * 2.2; ty = 0.4 - py * 1.6; // extrusion points away from the cursor
      ry = px * 14; rx = -py * 10;
    }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      crx += (rx - crx) * 0.08; cry += (ry - cry) * 0.08;
      if (window.scrollY < window.innerHeight) {
        h1.style.setProperty("--ext", buildShadow(cx, cy, gold));
        h1.style.setProperty("--ext2", buildShadow(cx, cy, silver));
        h1.style.transform = `perspective(1000px) rotateX(${crx.toFixed(2)}deg) rotateY(${cry.toFixed(2)}deg)`;
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------------- Scroll-linked 3D: hero exit + studio window ---------------- */
  const heroContent = $("#heroContent");
  const studioWin = $("#studioWindow");
  const onScroll = () => {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    const p = clamp(window.scrollY / vh, 0, 1);
    if (heroContent) {
      heroContent.style.transform = `perspective(1200px) translate3d(0, ${p * 120}px, ${-p * 260}px) rotateX(${p * 18}deg)`;
      heroContent.style.opacity = String(1 - p * 1.1);
    }
    if (studioWin) {
      const r = studioWin.getBoundingClientRect();
      const q = clamp((vh - r.top) / (vh * 0.75), 0, 1);
      const e = 1 - Math.pow(1 - q, 3);
      studioWin.style.transform = `rotateX(${(1 - e) * 32}deg) scale(${0.86 + e * 0.14}) translateY(${(1 - e) * 40}px)`;
      studioWin.style.opacity = String(0.25 + e * 0.75);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------------- 3D tool cube ---------------- */
  const cube = $("#toolCube");
  if (cube) {
    const faceAngle = { pbi: 0, excel: -90, sql: -180, py: 90 };
    let ang = 35, target = null, holdUntil = 0, hovering = false, tiltX = -22;
    const scene = cube.closest(".cube-scene");
    scene.addEventListener("pointerenter", () => (hovering = true));
    scene.addEventListener("pointerleave", () => (hovering = false));
    scene.addEventListener("pointermove", (e) => {
      const r = scene.getBoundingClientRect();
      tiltX = -22 + ((e.clientY - r.top) / r.height - 0.5) * -30;
    });
    const focusFace = (tool) => {
      if (!(tool in faceAngle)) return;
      // pick the equivalent angle nearest to the current one
      const base = faceAngle[tool];
      target = base + Math.round((ang - base) / 360) * 360;
      holdUntil = performance.now() + 4500;
    };
    $$(".face[data-tool]", cube).forEach((f) =>
      f.addEventListener("click", () => {
        $(`.studio-tab[data-tool="${f.dataset.tool}"]`)?.click();
      })
    );
    $$(".studio-tab").forEach((t) => t.addEventListener("click", () => focusFace(t.dataset.tool)));
    const spin = (now) => {
      if (target !== null) {
        ang += (target - ang) * 0.08;
        if (now > holdUntil) target = null;
      } else if (!hovering && !reduceMotion) {
        ang += 0.25;
      }
      cube.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${ang.toFixed(2)}deg)`;
      requestAnimationFrame(spin);
    };
    cube.style.transition = "none";
    requestAnimationFrame(spin);
  }

  /* =====================================================================
     Career globe (Three.js)
     ===================================================================== */
  function initGlobe() {
    const canvas = $("#globe");
    const T = window.THREE;
    if (!canvas || !T) return;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 3.6);

    const toVec = (lat, lon, r = 1) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      return new T.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    };

    const STOPS = [
      { name: "Kerala", lat: 10.0, lon: 76.3 },
      { name: "Rajasthan", lat: 26.45, lon: 74.64 },
      { name: "Doha", lat: 25.29, lon: 51.53 },
      { name: "Dubai", lat: 25.2, lon: 55.27 },
    ];
    const EXTRA = [{ name: "Abu Dhabi", lat: 24.45, lon: 54.38 }];
    const center = { lat: 19, lon: 64 };

    const pivot = new T.Group(); // tilt (X)
    const globe = new T.Group(); // spin (Y)
    pivot.add(globe);
    scene.add(pivot);

    // Occluding core + atmosphere
    globe.add(new T.Mesh(new T.SphereGeometry(0.985, 48, 48), new T.MeshBasicMaterial({ color: 0x07101f })));
    const atmo = new T.Mesh(new T.SphereGeometry(1.14, 48, 48), new T.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.07, side: T.BackSide }));
    scene.add(atmo);
    const atmo2 = new T.Mesh(new T.SphereGeometry(1.05, 48, 48), new T.MeshBasicMaterial({ color: 0xe2b659, transparent: true, opacity: 0.05, side: T.BackSide }));
    scene.add(atmo2);

    // Fibonacci dot sphere, gold near the GCC / India region
    const N = window.innerWidth < 760 ? 1800 : 3200;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const cVec = toVec(center.lat, center.lon).normalize();
    const cBase = new T.Color(0x44587c), cGold = new T.Color(0xe2b659), tmp = new T.Color();
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      const v = new T.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
      pos.set([v.x, v.y, v.z], i * 3);
      const near = clamp(1 - v.angleTo(cVec) / 0.6, 0, 1);
      tmp.copy(cBase).lerp(cGold, near * near * 0.85);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    const dg = new T.BufferGeometry();
    dg.setAttribute("position", new T.BufferAttribute(pos, 3));
    dg.setAttribute("color", new T.BufferAttribute(col, 3));
    globe.add(new T.Points(dg, new T.PointsMaterial({ size: 0.017, vertexColors: true, transparent: true, opacity: 0.95 })));

    // Latitude / longitude wire rings
    const ringMat = new T.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.08 });
    [-60, -30, 0, 30, 60].forEach((lat) => {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 5) pts.push(toVec(lat, lon, 1.002));
      globe.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), ringMat));
    });
    for (let lon = -180; lon < 180; lon += 30) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 5) pts.push(toVec(lat, lon, 1.002));
      globe.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), ringMat));
    }

    // Markers
    const markers = [];
    const mkMarker = (s, major) => {
      const p = toVec(s.lat, s.lon, 1.005);
      const dot = new T.Mesh(new T.SphereGeometry(major ? 0.022 : 0.014, 16, 16), new T.MeshBasicMaterial({ color: major ? 0xf6d98f : 0x2dd4bf }));
      dot.position.copy(p);
      globe.add(dot);
      const ring = new T.Mesh(new T.RingGeometry(0.03, 0.04, 32), new T.MeshBasicMaterial({ color: 0xe2b659, transparent: true, opacity: 0.8, side: T.DoubleSide }));
      ring.position.copy(p);
      ring.lookAt(p.clone().multiplyScalar(2));
      globe.add(ring);
      // vertical beam
      const beamH = major ? 0.22 : 0.12;
      const beamGeo = new T.CylinderGeometry(0.004, 0.004, beamH, 6);
      beamGeo.translate(0, beamH / 2, 0);
      const beam = new T.Mesh(beamGeo, new T.MeshBasicMaterial({ color: 0xf6d98f, transparent: true, opacity: 0.7 }));
      beam.position.copy(p);
      beam.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), p.clone().normalize());
      globe.add(beam);
      markers.push({ s, dot, ring, beamTop: p.clone().normalize().multiplyScalar(1.005 + beamH), major });
    };
    STOPS.forEach((s) => mkMarker(s, true));
    EXTRA.forEach((s) => mkMarker(s, false));

    // Arcs between consecutive stops
    const arcs = [];
    for (let i = 0; i < STOPS.length - 1; i++) {
      const a = toVec(STOPS[i].lat, STOPS[i].lon).normalize();
      const b = toVec(STOPS[i + 1].lat, STOPS[i + 1].lon).normalize();
      const dist = a.angleTo(b);
      const h = 0.06 + dist * 0.55;
      const pts = [];
      for (let k = 0; k <= 48; k++) {
        const t = k / 48;
        const v = a.clone().lerp(b, t).normalize().multiplyScalar(1.005 + Math.sin(Math.PI * t) * h);
        pts.push(v);
      }
      const curve = new T.CatmullRomCurve3(pts);
      const geo = new T.TubeGeometry(curve, 96, 0.006, 6, false);
      geo.setDrawRange(0, 0);
      const mesh = new T.Mesh(geo, new T.MeshBasicMaterial({ color: i % 2 ? 0x2dd4bf : 0xf6d98f, transparent: true, opacity: 0.95 }));
      globe.add(mesh);
      const comet = new T.Mesh(new T.SphereGeometry(0.018, 12, 12), new T.MeshBasicMaterial({ color: 0xffffff }));
      comet.visible = false;
      globe.add(comet);
      arcs.push({ geo, curve, total: geo.index.count, comet });
    }

    // HTML labels
    const labelsEl = $("#globeLabels");
    markers.forEach((m) => {
      const el = document.createElement("span");
      el.className = "globe-label";
      el.textContent = m.s.name;
      el.style.opacity = "0";
      if (!m.major) el.style.fontSize = "9.5px";
      labelsEl.appendChild(el);
      m.label = el;
    });

    // Orientation helpers
    const yawFor = (lat, lon) => { const v = toVec(lat, lon); return -Math.atan2(v.x, v.z); };
    let baseYaw = yawFor(center.lat, center.lon), baseTilt = center.lat * Math.PI / 180;
    let targetYaw = baseYaw, targetTilt = baseTilt;
    let yaw = reduceMotion ? baseYaw : baseYaw + 1.6, tilt = baseTilt; // starts rotated, spins into place
    let dragYaw = 0, dragVel = 0, dragging = false, lastX = 0;
    let focusIdx = -1, focusUntil = 0;

    const stage = canvas.parentElement;
    stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      dragVel = dx * 0.006; dragYaw += dragVel;
    });
    const endDrag = () => (dragging = false);
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    const stopItems = $$(".stops li");
    const focusStop = (i) => {
      focusIdx = i;
      const s = STOPS[i];
      targetYaw = yawFor(s.lat, s.lon) - dragYaw;
      targetTilt = s.lat * Math.PI / 180;
      focusUntil = performance.now() + 5000;
      stopItems.forEach((li, j) => li.classList.toggle("on", j === i));
    };
    stopItems.forEach((li, i) => {
      li.addEventListener("click", () => focusStop(i));
      li.addEventListener("pointerenter", () => focusStop(i));
    });

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let startT = 0;
    const inView = () => {
      const r = stage.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
    };

    const v3 = new T.Vector3(), camDir = new T.Vector3();
    const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

    const render = (now) => {
      const t = reduceMotion ? 20 : (now - startT) / 1000;
      if (!dragging) { dragVel *= 0.94; dragYaw += dragVel; }
      if (focusIdx >= 0 && now > focusUntil) {
        focusIdx = -1; targetYaw = baseYaw; targetTilt = baseTilt;
        stopItems.forEach((li) => li.classList.remove("on"));
      }
      const idle = focusIdx < 0 && !reduceMotion ? Math.sin(t * 0.35) * 0.35 : 0;
      yaw += (targetYaw + idle - yaw) * 0.05;
      tilt += (targetTilt - tilt) * 0.05;
      globe.rotation.y = yaw + dragYaw;
      pivot.rotation.x = tilt;

      // arcs draw in sequence, then comets travel along them
      arcs.forEach((a, i) => {
        const p = easeOut((t - 0.8 - i * 0.9) / 1.1);
        a.geo.setDrawRange(0, Math.floor((a.total * p) / 3) * 3);
        if (p >= 1) {
          a.comet.visible = true;
          a.comet.position.copy(a.curve.getPointAt((t * 0.35 + i * 0.33) % 1));
        }
      });
      // pulsing rings
      markers.forEach((m, i) => {
        const s = 1 + ((t * 0.8 + i * 0.25) % 1) * 1.8;
        m.ring.scale.setScalar(s);
        m.ring.material.opacity = 0.9 * (1 - ((t * 0.8 + i * 0.25) % 1));
      });

      renderer.render(scene, camera);

      // project labels
      const w = canvas.clientWidth, h = canvas.clientHeight;
      camera.getWorldDirection(camDir);
      markers.forEach((m, i) => {
        v3.copy(m.beamTop);
        globe.localToWorld(v3);
        const facing = v3.clone().normalize().dot(camDir.clone().negate());
        const sp = v3.clone().project(camera);
        const x = (sp.x * 0.5 + 0.5) * w, y = (-sp.y * 0.5 + 0.5) * h;
        // nudge labels of the two close UAE/Qatar points apart
        const offX = m.s.name === "Doha" ? -34 : m.s.name === "Abu Dhabi" ? 30 : m.s.name === "Dubai" ? 22 : 0;
        const offY = m.s.name === "Abu Dhabi" ? 26 : 0;
        m.label.style.transform = `translate(${x + offX}px, ${y + offY}px) translate(-50%, -120%)`;
        m.label.style.opacity = facing > 0.15 ? "1" : "0";
        m.label.classList.toggle("hot", focusIdx === i);
      });
    };

    const loop = (now) => {
      if (inView()) {
        if (!startT) startT = now;
        render(now);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGlobe);
  else initGlobe();
})();
