/**
 * Mohammed Salal KK - Portfolio Scripts
 * Modern Motion Design, Typewriter Rotator, Scroll Animations, Interactive Accordion & Terminal
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initTypewriter();
  initScrollAnimations();
  initCounters();
  initCompetencyFilters();
  initExperienceAccordion();
  initTerminal();
  initProjects();
  initModal();
  initClipboardAndToasts();
});

/* ==========================================================================
   1. NAVBAR & SCROLL SPY
   ========================================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const navLinks = document.querySelectorAll('.desktop-nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('bg-[#070b16]/90', 'backdrop-blur-md', 'border-b', 'border-slate-800/80', 'shadow-2xl');
      navbar.classList.remove('bg-transparent');
    } else {
      navbar.classList.remove('bg-[#070b16]/90', 'backdrop-blur-md', 'border-b', 'border-slate-800/80', 'shadow-2xl');
      navbar.classList.add('bg-transparent');
    }

    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 130;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('text-sky-400', 'font-semibold');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('text-sky-400', 'font-semibold');
      }
    });
  });

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ==========================================================================
   2. DYNAMIC HERO TYPEWRITER / ROTATING TITLES
   ========================================================================== */
function initTypewriter() {
  const el = document.getElementById('hero-typewriter');
  if (!el) return;

  const titles = [
    'MIS & Data Analyst',
    'Retail Analytics Expert',
    'BI & SQL Specialist',
    'Big Data Graduate'
  ];

  let titleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 90;

  function type() {
    const currentTitle = titles[titleIndex];

    if (isDeleting) {
      el.textContent = currentTitle.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 45;
    } else {
      el.textContent = currentTitle.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 95;
    }

    if (!isDeleting && charIndex === currentTitle.length) {
      // Pause at end of title
      typingSpeed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      titleIndex = (titleIndex + 1) % titles.length;
      typingSpeed = 400;
    }

    setTimeout(type, typingSpeed);
  }

  type();
}

/* ==========================================================================
   3. SCROLL-DRIVEN ENTRANCE ANIMATIONS (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-init');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        // If element has proficiency bars, trigger their animation
        const bars = entry.target.querySelectorAll('.progress-bar-fill');
        bars.forEach(bar => {
          const targetWidth = bar.getAttribute('data-width') || '0%';
          bar.style.width = targetWidth;
        });
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   4. STATS COUNTER ANIMATION
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('.counter-val');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counters.forEach(counter => {
          const target = parseFloat(counter.getAttribute('data-target'));
          const suffix = counter.getAttribute('data-suffix') || '';
          const duration = 1600;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeOut * target);

            counter.textContent = currentVal + suffix;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              counter.textContent = target + suffix;
            }
          }

          requestAnimationFrame(updateCounter);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats-strip');
  if (statsSection) {
    observer.observe(statsSection);
  }
}

/* ==========================================================================
   5. INTERACTIVE COMPETENCY FILTERS & PROGRESS BARS
   ========================================================================== */
function initCompetencyFilters() {
  const tabs = document.querySelectorAll('.competency-tab');
  const cards = document.querySelectorAll('.competency-card');

  function animateBarsInCard(card) {
    const bars = card.querySelectorAll('.progress-bar-fill');
    bars.forEach(bar => {
      const w = bar.getAttribute('data-width') || '0%';
      bar.style.width = w;
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-filter');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      cards.forEach(card => {
        const cat = card.getAttribute('data-domain');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'block';
          setTimeout(() => {
            card.classList.remove('opacity-0', 'scale-95');
            card.classList.add('opacity-100', 'scale-100');
            animateBarsInCard(card);
          }, 40);
        } else {
          card.classList.add('opacity-0', 'scale-95');
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   6. INTERACTIVE EXPERIENCE ACCORDION
   ========================================================================== */
function initExperienceAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  const toggleAllBtn = document.getElementById('accordion-toggle-all');

  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      item.classList.toggle('active');
      const expandedLabel = item.querySelector('.accordion-status-label');
      if (expandedLabel) {
        expandedLabel.textContent = !isActive ? 'Collapse Details ▲' : 'Explore Details ▼';
      }
    });
  });

  if (toggleAllBtn) {
    let allExpanded = false;
    toggleAllBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      items.forEach(item => {
        if (allExpanded) {
          item.classList.add('active');
        } else {
          // Keep current role active, collapse others
          if (item.getAttribute('data-current') !== 'true') {
            item.classList.remove('active');
          }
        }
        const label = item.querySelector('.accordion-status-label');
        if (label) {
          label.textContent = item.classList.contains('active') ? 'Collapse Details ▲' : 'Explore Details ▼';
        }
      });
      toggleAllBtn.textContent = allExpanded ? 'Collapse All Roles' : 'Expand All Roles';
    });
  }
}

/* ==========================================================================
   7. INTERACTIVE SQL & ANALYTICS TERMINAL
   ========================================================================== */
function initTerminal() {
  const terminalBody = document.getElementById('terminal-output');
  const terminalInput = document.getElementById('terminal-input');
  const chipButtons = document.querySelectorAll('.terminal-chip');
  if (!terminalBody || !terminalInput) return;

  const history = [];
  let historyIndex = -1;

  const commands = {
    help: () => `
<div class="text-slate-300 space-y-1">
  <p class="text-sky-400 font-semibold">Available Terminal Commands:</p>
  <p><span class="text-emerald-400 font-mono">query</span> - Execute live SQL sample query on multi-branch dataset</p>
  <p><span class="text-emerald-400 font-mono">branches</span> - Inspect 19 Al Madina branch operations & scope</p>
  <p><span class="text-emerald-400 font-mono">skills</span> - Overview of core analytical competencies</p>
  <p><span class="text-emerald-400 font-mono">experience</span> - Chronological career history summary</p>
  <p><span class="text-emerald-400 font-mono">contact</span> - Dubai contact & direct communication channels</p>
  <p><span class="text-emerald-400 font-mono">cv</span> - Direct link to download updated CV</p>
  <p><span class="text-emerald-400 font-mono">clear</span> - Clear the terminal output</p>
</div>`,

    skills: () => `
<div class="text-slate-300 space-y-2">
  <p class="text-sky-400 font-bold">Mohammed Salal KK | Core Competencies:</p>
  <p><span class="text-sky-300 font-semibold">• Retail & Inventory:</span> Stock Aging (RSP), SKU Rationalization, Margin Control, Purchase Audits</p>
  <p><span class="text-emerald-300 font-semibold">• SQL & ETL:</span> Advanced SQL (Window Functions, CTEs, Joins), Data Modeling, Data Cleaning</p>
  <p><span class="text-amber-300 font-semibold">• BI & Reporting:</span> Power BI (DAX, Star Schema), Tableau, Executive KPI Dashboards</p>
  <p><span class="text-blue-300 font-semibold">• Spreadsheets:</span> Advanced Excel, Power Query, Google Sheets (QUERY/IMPORTRANGE)</p>
  <p><span class="text-purple-300 font-semibold">• Python & ML:</span> Pandas, NumPy, Scikit-learn, EDA, Predictive Modeling, Forecasting</p>
</div>`,

    branches: () => `
<div class="text-slate-300 space-y-2">
  <div class="flex items-center gap-2 text-emerald-400 font-bold">
    <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
    Al Madina Group - 19 Branches Operational Analytics (UAE):
  </div>
  <p class="text-slate-300">
    <span class="text-sky-400 font-semibold">Scope:</span> Managing end-to-end MIS and operational analytics across 19 major retail hypermarkets and supermarkets in Abu Dhabi and across UAE.
  </p>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-slate-400 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
    <span>• Khalidiya Branch</span>
    <span>• Workers Village</span>
    <span>• TCA Branch</span>
    <span>• Mussafah Central</span>
    <span>• Madinat Zayed</span>
    <span>• ME10 / ME11 Hubs</span>
    <span>• Electra Outlet</span>
    <span>• Najda Market</span>
    <span>• + 11 Regional Units</span>
  </div>
  <p class="text-xs text-sky-300">Monitored: Daily sales, SKU movement, stock aging (RSP), campaign ROI, and monthly target budgeting.</p>
</div>`,

    query: () => `
<div class="text-xs font-mono space-y-2">
  <p class="text-slate-400">Executing SQL Statement on Retail Cluster...</p>
  <div class="p-2 bg-slate-950/80 rounded border border-slate-800 text-sky-300">
    <span class="text-purple-400">SELECT</span> branch_name, <span class="text-blue-400">COUNT</span>(DISTINCT sku_code) <span class="text-purple-400">AS</span> active_skus,<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-400">ROUND</span>(<span class="text-blue-400">AVG</span>(margin_pct), <span class="text-amber-400">2</span>) <span class="text-purple-400">AS</span> avg_margin_pct,<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-400">SUM</span>(stock_aging_under_90d) <span class="text-purple-400">AS</span> healthy_stock_val<br/>
    <span class="text-purple-400">FROM</span> uae_retail_operations<br/>
    <span class="text-purple-400">WHERE</span> region = <span class="text-emerald-400">'Abu Dhabi'</span> <span class="text-purple-400">AND</span> status = <span class="text-emerald-400">'Active'</span><br/>
    <span class="text-purple-400">GROUP BY</span> branch_name <span class="text-purple-400">ORDER BY</span> healthy_stock_val <span class="text-purple-400">DESC LIMIT 3</span>;
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-left border border-slate-800">
      <thead class="bg-slate-900 text-sky-400">
        <tr>
          <th class="p-1 border-b border-slate-800">BRANCH_NAME</th>
          <th class="p-1 border-b border-slate-800">ACTIVE_SKUS</th>
          <th class="p-1 border-b border-slate-800">AVG_MARGIN_%</th>
          <th class="p-1 border-b border-slate-800">HEALTHY_STOCK</th>
        </tr>
      </thead>
      <tbody class="text-slate-300 divide-y divide-slate-800/50">
        <tr>
          <td class="p-1 text-emerald-400">Khalidiya Superstore</td>
          <td class="p-1">14,820</td>
          <td class="p-1 text-sky-300">21.84%</td>
          <td class="p-1 text-slate-200">AED 1,842,500</td>
        </tr>
        <tr>
          <td class="p-1 text-emerald-400">TCA Premium Outlet</td>
          <td class="p-1">11,250</td>
          <td class="p-1 text-sky-300">23.10%</td>
          <td class="p-1 text-slate-200">AED 1,320,800</td>
        </tr>
        <tr>
          <td class="p-1 text-emerald-400">Workers Village Hub</td>
          <td class="p-1">8,960</td>
          <td class="p-1 text-sky-300">18.45%</td>
          <td class="p-1 text-slate-200">AED 940,200</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="text-emerald-400">Query processed in 14ms across 1.2M transactional records.</p>
</div>`,

    experience: () => `
<div class="text-slate-300 space-y-2">
  <p class="text-sky-400 font-bold">Mohammed Salal KK | Career Track Record:</p>
  <p><span class="text-emerald-400 font-semibold">1. Al Madina Group (Abu Dhabi, UAE)</span> | Jun 2025 – Present<br/>
     <span class="text-xs text-slate-400">MIS & Data Analyst - 19 Branches, SKU rationalization, target budgeting, stock aging.</span></p>
  <p><span class="text-sky-400 font-semibold">2. Al Anees Electronics (Doha, Qatar)</span> | Aug 2024 – Apr 2025<br/>
     <span class="text-xs text-slate-400">Data Analyst - Omnichannel electronics retail, purchase team optimization, competitor analytics.</span></p>
  <p><span class="text-amber-400 font-semibold">3. CodeRythm Technology (Kerala, India)</span> | Feb 2024 – Jul 2024<br/>
     <span class="text-xs text-slate-400">Data Analyst - Scalable ETL pipelines, data modeling, predictive modeling & Power BI dashboards.</span></p>
  <p><span class="text-purple-400 font-semibold">4. Homeland Traders (Kerala, India)</span> | Mar 2021 – Nov 2022<br/>
     <span class="text-xs text-slate-400">Data Analyst - Cleansing automation, trend & pattern forecasting, visual reporting.</span></p>
</div>`,

    contact: () => `
<div class="text-slate-300 space-y-1">
  <p class="text-sky-400 font-bold">Direct Contact Channels (Dubai, UAE):</p>
  <p>📱 <span class="text-slate-400">Mobile:</span> <a href="tel:+971586582599" class="text-emerald-400 hover:underline">+971 58 658 2599</a></p>
  <p>📧 <span class="text-slate-400">Email:</span> <a href="mailto:kkmohdsalal@gmail.com" class="text-sky-400 hover:underline">kkmohdsalal@gmail.com</a></p>
  <p>📍 <span class="text-slate-400">Location:</span> Dubai, UAE (Employment Visa)</p>
  <p>🔗 <span class="text-slate-400">LinkedIn:</span> <a href="https://linkedin.com/in/mohammed-salal-kk" target="_blank" class="text-sky-400 hover:underline">linkedin.com/in/mohammed-salal-kk</a></p>
  <p>💻 <span class="text-slate-400">GitHub:</span> <a href="https://github.com/MOHDSALAL-KK" target="_blank" class="text-sky-400 hover:underline">github.com/MOHDSALAL-KK</a></p>
</div>`,

    cv: () => {
      window.open('assets/Mohammed_Salal_Resume.pdf', '_blank');
      return `<p class="text-emerald-400">Opening Mohammed Salal's updated CV in a new tab...</p>`;
    },

    clear: () => {
      terminalBody.innerHTML = '';
      return '';
    }
  };

  function executeCommand(rawInput) {
    const input = rawInput.trim().toLowerCase();
    if (!input) return;

    history.push(rawInput);
    historyIndex = history.length;

    const cmdLine = document.createElement('div');
    cmdLine.className = 'flex items-center gap-2 text-slate-400 font-mono text-xs';
    cmdLine.innerHTML = `<span class="text-emerald-400 font-semibold">salal@dubai-analytics:~$</span> <span class="text-white">${escapeHtml(rawInput)}</span>`;
    terminalBody.appendChild(cmdLine);

    const outputDiv = document.createElement('div');
    outputDiv.className = 'mt-1 mb-3 text-xs leading-relaxed';

    if (commands[input]) {
      outputDiv.innerHTML = commands[input]();
    } else {
      outputDiv.innerHTML = `<span class="text-red-400 font-mono">Command not recognized: '${escapeHtml(rawInput)}'. Type <span class="text-sky-400 font-bold underline cursor-pointer" onclick="document.getElementById('terminal-input').value='help'; document.getElementById('terminal-input').focus();">help</span> to view all commands.</span>`;
    }

    if (input !== 'clear') {
      terminalBody.appendChild(outputDiv);
    }

    const terminalScrollContainer = document.getElementById('terminal-scroll-area');
    if (terminalScrollContainer) {
      terminalScrollContainer.scrollTop = terminalScrollContainer.scrollHeight;
    }
  }

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      executeCommand(val);
    } else if (e.key === 'ArrowUp') {
      if (history.length > 0 && historyIndex > 0) {
        historyIndex--;
        terminalInput.value = history[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        terminalInput.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        terminalInput.value = '';
      }
    }
  });

  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) {
        terminalInput.value = cmd;
        executeCommand(cmd);
      }
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ==========================================================================
   8. PROJECT FILTERING
   ========================================================================== */
function initProjects() {
  const filterBtns = document.querySelectorAll('.filter-tab');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter');

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      projectCards.forEach(card => {
        const cardCategories = card.getAttribute('data-category').split(' ');
        if (category === 'all' || cardCategories.includes(category)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.classList.remove('opacity-0', 'scale-95');
            card.classList.add('opacity-100', 'scale-100');
          }, 30);
        } else {
          card.classList.add('opacity-0', 'scale-95');
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   9. PROJECT DETAILS MODAL
   ========================================================================== */
const projectData = {
  'retail-bi': {
    title: 'Retail Performance Dashboard – Advanced Power BI Solution',
    subtitle: 'Multi-Branch Sales, Margin & Inventory Intelligence',
    image: 'assets/retail_bi.png',
    tags: ['Power BI', 'DAX', 'Data Modeling', 'Star Schema', 'Retail KPI'],
    overview: 'Developed an enterprise-grade interactive Power BI dashboard to give executive leadership and branch managers a single pane of glass into store operations, gross margin velocity, and SKU movement across branches.',
    problem: 'Branch managers previously operated on siloed spreadsheets with inconsistent gross margin reporting and a 7-day reporting lag, leading to unnoticed stock-outs on high-demand categories.',
    solution: 'Engineered a unified Star Schema data model incorporating daily POS transactions, category hierarchies, and cost tables. Designed interactive DAX measures for dynamic time-intelligence (YTD, MTD, YoY growth) and automated branch ranking.',
    impact: [
      'Empowered branch leadership across 19+ retail locations with real-time sales visibility.',
      'Reduced reporting cycle time from 7 days down to automated daily refreshes.',
      'Identified low-margin outlier categories, directly supporting target margin stabilization.'
    ],
    github: 'https://github.com/MOHDSALAL-KK/RETAIL-DASHBOARD',
    pdf: 'assets/Retail Performance Dashboard - Advanced Power BI Solution.pdf'
  },
  'private-label': {
    title: 'Private Label & Inventory Optimization Suite',
    subtitle: 'SKU Rationalization, Stock Aging & Margin Control',
    image: 'assets/PrivateLabel_Advanced_Dashboard.png',
    tags: ['SQL', 'Power BI', 'SKU Rationalization', 'RSP Match', 'Inventory Audits'],
    overview: 'Comprehensive analytical system constructed to analyze private label penetration, evaluate price-range elasticity (RSP match), audit purchase stock setups, and eliminate slow-moving or dead stock.',
    problem: 'Excessive capital was tied up in slow-moving non-core SKUs, while high-margin private label products faced inconsistent stock availability and uncoordinated purchase order triggers.',
    solution: 'Authored complex SQL queries and Python automated workflows to categorize inventory by aging tiers (0-30d, 31-90d, 90-180d, >180d). Built automated purchase setup verification audits to flag MOQ discrepancies before PO sign-off.',
    impact: [
      'Audited purchase setups across 15,000+ active SKUs, significantly reducing over-purchase risk.',
      'Streamlined branch target setting and margin control for private label FMCG goods.',
      'Identified critical dead stock for promotional liquidation, freeing working capital.'
    ],
    github: 'https://github.com/MOHDSALAL-KK',
    pdf: 'assets/Mohammed_Salal_Resume.pdf'
  },
  'ecommerce-amazon': {
    title: 'E-Commerce Product and Order Insights Dashboard (Amazon)',
    subtitle: 'Omnichannel Order Fulfillment & Customer Experience Analytics',
    image: 'assets/project-2.png',
    tags: ['Power BI', 'E-Commerce', 'Order Insights', 'Customer Churn', 'Amazon Analytics'],
    overview: 'A deep-dive visualization system analyzing e-commerce orders, customer purchase cycles, geographic distribution, fulfillment speeds, and category profitability on marketplace ecosystems.',
    problem: 'Fragmented view of customer delivery satisfaction, order cancellation rates, and fulfillment bottleneck bottlenecks across logistics providers.',
    solution: 'Designed an interactive analytics suite categorizing order lifecycle stages from cart checkout to delivery, evaluating cancellation factors, seasonal spikes, and customer return patterns.',
    impact: [
      'Uncovered root causes behind order cancellations and fulfillment lag.',
      'Visualized regional delivery performance heatmaps to prioritize regional inventory staging.',
      'Identified top 20% high-frequency customer cohorts driving recurring monthly GMV.'
    ],
    github: 'https://github.com/MOHDSALAL-KK/E-commerce-Product-and-Order-Insights-Dashboard-Amazon',
    pdf: 'assets/E-commerce Product and Order Insights Dashboard(Amazon).pdf'
  },
  'retail-gsheet': {
    title: 'Retail Sales KPI Dashboard (Google Sheets & BigQuery)',
    subtitle: 'Cloud-Automated Operational Reporting & Real-time Branch Sync',
    image: 'assets/retail_gsheet.png',
    tags: ['Google Sheets', 'Power Query', 'QUERY Function', 'IMPORTRANGE', 'Automation'],
    overview: 'A lightweight, high-speed automated cloud dashboard for store supervisors, monitoring shift-by-shift sales, cashier productivity, average transaction value (ATV), and promotional compliance.',
    problem: 'Store supervisors needed immediate, low-latency mobile access to intraday sales figures without needing enterprise BI desktop licenses.',
    solution: 'Structured a resilient Google Sheets analytics model leveraging QUERY, IMPORTRANGE, conditional heatmaps, and automated data ingestion scripts to feed live operational metrics.',
    impact: [
      'Adopted by store teams for daily morning operational briefings.',
      'Tracks daily target achievement vs projected run-rate in real-time.',
      'Eliminated manual copy-paste compiling by 100% through automated formulas.'
    ],
    live: 'https://docs.google.com/spreadsheets/d/1iasL8M_5HJU3oCQYPTZA9xEzoM5mtYS1j_X3eGhvoMs/edit?gid=1153479738#gid=1153479738',
    pdf: 'assets/Retail Sales KPI Dashboard.pdf'
  },
  'hr-attrition': {
    title: 'Employee Attrition HR Analysis Dashboard',
    subtitle: 'Workforce Retention, Sentiment & Predictive Turnover Modeling',
    image: 'assets/hr.png',
    tags: ['Power BI', 'Predictive Analytics', 'HR Analytics', 'Data Storytelling'],
    overview: 'Diagnostic and predictive workforce dashboard evaluating organizational turnover risk, employee satisfaction indicators, compensation parity, and tenure trends.',
    problem: 'HR leadership struggled to isolate leading indicators of turnover in critical operational roles, relying solely on retrospective exit interviews.',
    solution: 'Engineered correlation matrices and visual attrition breakdown by department, job role, age cohort, years with manager, and distance from office to model flight risk.',
    impact: [
      'Identified key attrition triggers among early-tenure operational personnel.',
      'Provided data-backed recommendations for retention incentives and manager coaching.',
      'Helped design targeted employee engagement strategies reducing predicted turnover.'
    ],
    github: 'https://github.com/MOHDSALAL-KK/Employee_Attrition_HR_Analysis_Dashboard',
    pdf: 'assets/Employee_Attrition_HR_Analysis_Dashboard.pdf'
  }
};

function initModal() {
  const modal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTriggerBtns = document.querySelectorAll('.project-modal-trigger');
  if (!modal) return;

  function openModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-subtitle').textContent = data.subtitle;
    document.getElementById('modal-image').src = data.image;
    document.getElementById('modal-image').alt = data.title;
    document.getElementById('modal-overview').textContent = data.overview;
    document.getElementById('modal-problem').textContent = data.problem;
    document.getElementById('modal-solution').textContent = data.solution;

    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = '';
    data.tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'px-2.5 py-1 text-xs font-mono rounded-full bg-sky-950/80 text-sky-400 border border-sky-800/60';
      span.textContent = t;
      tagsContainer.appendChild(span);
    });

    const impactList = document.getElementById('modal-impact');
    impactList.innerHTML = '';
    data.impact.forEach(item => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2 text-slate-300 text-sm';
      li.innerHTML = `<span class="text-emerald-400 mt-1">✓</span><span>${item}</span>`;
      impactList.appendChild(li);
    });

    const linksContainer = document.getElementById('modal-links');
    linksContainer.innerHTML = '';

    if (data.github) {
      const a = document.createElement('a');
      a.href = data.github;
      a.target = '_blank';
      a.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition border border-slate-700';
      a.innerHTML = `
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        GitHub Repository
      `;
      linksContainer.appendChild(a);
    }

    if (data.live) {
      const a = document.createElement('a');
      a.href = data.live;
      a.target = '_blank';
      a.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-lg shadow-emerald-900/30';
      a.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        Live G-Sheet Dashboard
      `;
      linksContainer.appendChild(a);
    }

    if (data.pdf) {
      const a = document.createElement('a');
      a.href = data.pdf;
      a.target = '_blank';
      a.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition shadow-lg shadow-sky-900/30';
      a.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Project Documentation (PDF)
      `;
      linksContainer.appendChild(a);
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  modalTriggerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-project');
      if (id) openModal(id);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   10. CLIPBOARD & TOAST SYSTEM
   ========================================================================== */
function initClipboardAndToasts() {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');

  function showToast(message) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  const copyEmailBtns = document.querySelectorAll('.copy-email-btn');
  copyEmailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText('kkmohdsalal@gmail.com').then(() => {
        showToast('✓ Email copied to clipboard: kkmohdsalal@gmail.com');
      }).catch(() => {
        showToast('kkmohdsalal@gmail.com');
      });
    });
  });

  const copyPhoneBtns = document.querySelectorAll('.copy-phone-btn');
  copyPhoneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText('+971586582599').then(() => {
        showToast('✓ Phone copied: +971 58 658 2599');
      }).catch(() => {
        showToast('+971 58 658 2599');
      });
    });
  });

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const subject = document.getElementById('form-subject').value.trim() || 'Analytics Inquiry';
      const message = document.getElementById('form-message').value.trim();

      const mailtoUrl = `mailto:kkmohdsalal@gmail.com?subject=${encodeURIComponent(subject + ' - ' + name)}&body=${encodeURIComponent("From: " + name + " (" + email + ")\n\n" + message)}`;
      window.location.href = mailtoUrl;

      showToast('Opening email client to send message to Mohammed Salal...');
      contactForm.reset();
    });
  }
}
