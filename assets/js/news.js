/* =====================================================================
   Analytics Pulse — live news & blog feed for data analytics
   Sources (all public, CORS-enabled, no API key):
   - Power BI Updates Blog, KDnuggets, Towards Data Science (RSS via rss2json)
   - DEV Community articles (dev.to API)
   - Hacker News stories (Algolia HN Search API)
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const root = $("#pulse");
  if (!root) return;

  const REFRESH_MS = 5 * 60 * 1000; // auto-refresh every 5 minutes
  const CACHE_KEY = "pulse-cache-v1";
  const rss = (url) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;

  const SOURCES = [
    { id: "powerbi", name: "Power BI Blog", color: "#f2c811", tag: "BI", url: rss("https://powerbi.microsoft.com/en-us/blog/feed/"), type: "rss" },
    { id: "kdn", name: "KDnuggets", color: "#2dd4bf", tag: "KD", url: rss("https://www.kdnuggets.com/feed"), type: "rss" },
    { id: "tds", name: "Towards Data Science", color: "#5b9cff", tag: "TDS", url: rss("https://towardsdatascience.com/feed"), type: "rss" },
    { id: "dev", name: "DEV Community", color: "#c792ea", tag: "DEV", type: "dev",
      url: ["dataanalytics", "powerbi", "sql", "dataengineering"].map((t) => `https://dev.to/api/articles?tag=${t}&per_page=8&top=7`) },
    { id: "hn", name: "Hacker News", color: "#fb923c", tag: "HN", type: "hn",
      url: () => `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent("data analytics")}&tags=story&hitsPerPage=20&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 60 * 86400}` },
  ];

  // ---------- helpers ----------
  const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
  // DOMParser builds an inert document: no scripts run and no resources load
  const parser = new DOMParser();
  const strip = (html = "") => (parser.parseFromString(String(html), "text/html").body.textContent || "").replace(/\s+/g, " ").trim();
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const parseDate = (s) => {
    if (typeof s === "number") return s * 1000;
    // rss2json returns "YYYY-MM-DD HH:MM:SS" in UTC
    const t = Date.parse(/^\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(" ", "T") + "Z" : s);
    return isNaN(t) ? Date.now() : t;
  };
  const ago = (t) => {
    const s = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60); if (h < 48) return `${h}h ago`;
    const d = Math.round(h / 24); return `${d}d ago`;
  };
  const imgFrom = (html = "") => { const m = html.match(/<img[^>]+src=["']([^"']+)/i); return m ? m[1] : null; };
  const fetchJson = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  };

  // ---------- normalisers ----------
  const load = {
    async rss(src) {
      const j = await fetchJson(src.url);
      if (j.status !== "ok") throw new Error("rss");
      return j.items.map((it) => ({
        title: strip(it.title), link: safeUrl(it.link), time: parseDate(it.pubDate),
        desc: strip(it.description).slice(0, 260), author: strip(it.author || ""),
        img: safeUrl(it.thumbnail || it.enclosure?.link || imgFrom(it.content || it.description) || ""),
      }));
    },
    async dev(src) {
      const lists = await Promise.allSettled(src.url.map(fetchJson));
      const seen = new Set();
      return lists.flatMap((l) => (l.status === "fulfilled" ? l.value : [])).filter((a) => !seen.has(a.id) && seen.add(a.id)).map((a) => ({
        title: a.title, link: safeUrl(a.url), time: parseDate(a.published_at), desc: a.description || "",
        author: a.user?.name || "", img: safeUrl(a.cover_image || a.social_image || ""),
        extra: a.reading_time_minutes ? `${a.reading_time_minutes} min read` : "",
      }));
    },
    async hn(src) {
      const j = await fetchJson(src.url());
      return j.hits.filter((h) => h.title).map((h) => ({
        title: h.title, link: safeUrl(h.url) || `https://news.ycombinator.com/item?id=${h.objectID}`,
        time: parseDate(h.created_at_i), desc: strip(h.story_text || "").slice(0, 220), author: h.author || "",
        img: null, extra: `${h.points || 0} points · ${h.num_comments || 0} comments`,
      }));
    },
  };

  // ---------- state ----------
  let items = [];
  let filter = "all";
  let lastUpdated = 0;
  let previousLinks = new Set();

  const els = {
    ticker: $("#tickerTrack", root), sources: $("#pulseSources", root), feature: $("#newsFeature", root),
    list: $("#newsList", root), meta: $("#pulseMeta", root), refresh: $("#pulseRefresh", root),
  };

  const readCache = () => {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (c && Date.now() - c.at < REFRESH_MS) return c;
    } catch {}
    return null;
  };
  const writeCache = () => { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: lastUpdated, items })); } catch {} };

  async function refresh(force = false) {
    els.refresh.classList.add("spinning");
    const cached = !force && readCache();
    if (cached) {
      items = cached.items; lastUpdated = cached.at;
    } else {
      const results = await Promise.allSettled(SOURCES.map((s) => load[s.type](s).then((arr) => arr.map((x) => ({ ...x, src: s.id })))));
      const fresh = results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])).filter((x) => x.link && x.title);
      if (fresh.length) {
        const seen = new Set();
        items = fresh.filter((x) => !seen.has(x.link) && seen.add(x.link)).sort((a, b) => b.time - a.time).slice(0, 80);
        lastUpdated = Date.now();
        writeCache();
      }
    }
    els.refresh.classList.remove("spinning");
    render();
  }

  // ---------- render ----------
  const srcOf = (id) => SOURCES.find((s) => s.id === id);
  const fallbackArt = `<div class="nf-fallback"><svg viewBox="0 0 200 120" fill="none" stroke="#e2b659" stroke-width="2"><path d="M10 110h180"/><rect x="25" y="70" width="18" height="40"/><rect x="55" y="50" width="18" height="60"/><rect x="85" y="30" width="18" height="80"/><rect x="115" y="58" width="18" height="52"/><rect x="145" y="20" width="18" height="90"/><path d="M20 80 L64 52 L94 36 L124 60 L170 18" stroke="#2dd4bf"/></svg></div>`;

  function render() {
    const now = Date.now();
    const visible = filter === "all" ? items : items.filter((x) => x.src === filter);

    // source buttons with counts
    const counts = items.reduce((m, x) => ((m[x.src] = (m[x.src] || 0) + 1), m), {});
    els.sources.innerHTML = [`<button class="source-btn${filter === "all" ? " on" : ""}" data-src="all">All sources <span class="n">${items.length}</span></button>`]
      .concat(SOURCES.filter((s) => counts[s.id]).map((s) =>
        `<button class="source-btn${filter === s.id ? " on" : ""}" data-src="${s.id}"><span class="sdot" style="background:${s.color}"></span>${esc(s.name)} <span class="n">${counts[s.id]}</span></button>`)).join("");

    if (!visible.length) {
      els.feature.innerHTML = "";
      els.list.innerHTML = `<div class="news-empty">Live feeds are unavailable right now. Please try refreshing in a moment.</div>`;
      els.ticker.innerHTML = "";
      return;
    }

    // ticker: latest 14 across all sources (duplicated for seamless loop)
    const tick = items.slice(0, 14).map((x) => `<a href="${esc(x.link)}" target="_blank" rel="noopener"><b>${esc(srcOf(x.src).tag)}</b>${esc(x.title)}</a>`).join("");
    els.ticker.innerHTML = tick + tick;

    // feature = newest item with an image (fallback: newest)
    const feat = visible.find((x) => x.img) || visible[0];
    const fs = srcOf(feat.src);
    els.feature.innerHTML = `
      <a class="news-feature" href="${esc(feat.link)}" target="_blank" rel="noopener">
        <div class="nf-media">${feat.img ? `<img src="${esc(feat.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}${fallbackArt.replace('class="nf-fallback"', `class="nf-fallback" style="z-index:${feat.img ? -1 : 0}"`)}<span class="nf-badge">LATEST</span></div>
        <div class="nf-body">
          <div class="news-meta"><span class="news-src"><i style="background:${fs.color}"></i>${esc(fs.name)}</span><span>${ago(feat.time)}</span>${feat.extra ? `<span>${esc(feat.extra)}</span>` : ""}</div>
          <h3>${esc(feat.title)}</h3>
          ${feat.desc ? `<p>${esc(feat.desc)}</p>` : ""}
          <span class="link-arrow">Read article <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M8 7h9v9"/></svg></span>
        </div>
      </a>`;

    els.list.innerHTML = visible.filter((x) => x !== feat).slice(0, 24).map((x, i) => {
      const s = srcOf(x.src);
      const isNew = previousLinks.size && !previousLinks.has(x.link);
      const thumb = x.img
        ? `<img src="${esc(x.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.style.background='${s.color}';this.parentNode.textContent='${s.tag}'">`
        : s.tag;
      return `<a class="news-item" style="--i:${i}" href="${esc(x.link)}" target="_blank" rel="noopener">
        <div class="ni-thumb" style="${x.img ? "" : `background:${s.color}`}">${thumb}</div>
        <div>
          <h4>${esc(x.title)}</h4>
          <div class="news-meta"><span class="news-src"><i style="background:${s.color}"></i>${esc(s.name)}</span><span>${ago(x.time)}</span>${isNew ? '<span class="news-new">NEW</span>' : ""}${now - x.time < 6 * 3600e3 ? '<span class="news-new">FRESH</span>' : ""}</div>
        </div>
      </a>`;
    }).join("");

    previousLinks = new Set(items.map((x) => x.link));
    updateMeta();
  }

  function updateMeta() {
    if (!lastUpdated) { els.meta.textContent = "Connecting to live feeds…"; return; }
    const next = Math.max(0, Math.round((lastUpdated + REFRESH_MS - Date.now()) / 1000));
    els.meta.textContent = `Updated ${ago(lastUpdated)} · next refresh in ${Math.floor(next / 60)}:${String(next % 60).padStart(2, "0")}`;
  }

  // ---------- events ----------
  els.sources.addEventListener("click", (e) => {
    const b = e.target.closest("[data-src]");
    if (!b) return;
    filter = b.dataset.src;
    render();
  });
  els.refresh.addEventListener("click", () => refresh(true));

  // Lazy start when the section approaches the viewport
  let started = false;
  const start = () => {
    if (started) return;
    const r = root.getBoundingClientRect();
    if (r.top < window.innerHeight + 600) {
      started = true;
      window.removeEventListener("scroll", start);
      refresh();
      setInterval(() => { if (!document.hidden) refresh(true); }, REFRESH_MS);
      setInterval(updateMeta, 1000);
    }
  };
  window.addEventListener("scroll", start, { passive: true });
  start();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && started && Date.now() - lastUpdated > REFRESH_MS) refresh(true);
  });
})();
