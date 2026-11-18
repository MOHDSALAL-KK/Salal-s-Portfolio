/* =====================================================================
   3D layer — extruded name, scroll-linked depth, tool cube
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

})();
