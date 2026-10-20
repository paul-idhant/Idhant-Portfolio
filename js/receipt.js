/* Receipt Printer — vanilla port of the dqnamo experiment, personal archive edition.
   No frameworks. One IntersectionObserver, one stage machine. */
(() => {
  const root = document.getElementById('rpRoot');
  const paper = document.getElementById('rpPaper');
  const statusEl = document.getElementById('rpStatus');
  const statusDot = document.getElementById('rpStatusDot');
  const replayBtn = document.getElementById('rpReplay');
  const printBtn = document.getElementById('rpPrintBtn');
  const receiptSection = document.getElementById('receipt');
  if (!root || !paper || !statusEl) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build the zig-zag clip-path (40 teeth, 4px depth) — matches the React version
  const toothCount = 40;
  const toothDepth = 4;
  const points = Array.from({ length: toothCount * 2 }, (_, i) => {
    const x = 100 - ((i + 1) * 100) / (toothCount * 2);
    const y = i % 2 === 0 ? '100%' : `calc(100% - ${toothDepth}px)`;
    return `${x}% ${y}`;
  }).join(', ');
  const clip = `polygon(0 0, 100% 0, 100% calc(100% - ${toothDepth}px), ${points})`;
  paper.style.clipPath = clip;

  // Set dynamic date on receipt (like the image: 11 AUG 2024 • 14:32)
  const dateEl = document.getElementById('rpDate');
  const orderEl = document.getElementById('rpOrder');
  const totalEl = document.getElementById('rpTotalVal');
  if (dateEl) {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false });
      // Format like "11 AUG 2026 • 14:32"
      const parts = fmt.formatToParts(now);
      const get = (t) => parts.find(p=>p.type===t)?.value || '';
      const day = get('day');
      const month = get('month').toUpperCase();
      const year = get('year');
      const hour = get('hour');
      const min = get('minute');
      dateEl.textContent = `${day} ${month} ${year} • ${hour}:${min}`;
      if (orderEl) {
        // Keep ORD-2848 easter egg from the reference image, but add personal suffix
        const rid = `ORD-${String(Math.floor(1000+Math.random()*9000))}`;
        orderEl.textContent = `${rid} / IDHNT-${year}`;
        const bl = document.getElementById('rpBarcodeLabel');
        if (bl) bl.textContent = rid;
      }
    } catch(e) {}
  }

  let timer = null;
  let stage = 'idle'; // idle | processing | printing | complete

  function setStage(s) {
    stage = s;
    root.setAttribute('data-stage', s);
    if (s === 'processing') {
      statusEl.textContent = 'Processing your order';
      statusDot.innerHTML = '<span class="spin" aria-hidden="true"></span>';
    } else if (s === 'printing') {
      statusEl.textContent = 'Printing your receipt';
      statusDot.innerHTML = '<span class="spin" aria-hidden="true"></span>';
    } else if (s === 'complete') {
      statusEl.textContent = 'Order complete';
      statusDot.innerHTML = '<span class="check" aria-hidden="true">✓</span>';
    } else {
      statusEl.textContent = 'Tap Print to get your copy';
      statusDot.innerHTML = '<span aria-hidden="true">○</span>';
    }
  }

  function run() {
    clearTimeout(timer);
    if (reduce) {
      setStage('complete');
      return;
    }
    setStage('processing');
    timer = setTimeout(() => {
      setStage('printing');
      timer = setTimeout(() => {
        setStage('complete');
      }, 1750);
    }, 900);
  }

  function resetAndRun() {
    // Force reflow to restart the CSS animation
    root.setAttribute('data-stage', 'processing');
    // Trigger reflow
    void root.offsetWidth;
    run();
  }

  if (replayBtn) replayBtn.addEventListener('click', resetAndRun);
  if (printBtn) printBtn.addEventListener('click', () => {
    // Also acts as replay when done; scroll into view first
    receiptSection && receiptSection.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(resetAndRun, 180);
  });

  // Auto-play when section enters view (once)
  let played = false;
  if ('IntersectionObserver' in window && receiptSection) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !played) {
          played = true;
          // Small delay so the machine is fully visible
          setTimeout(run, 420);
          // Keep observing for replay manual, but we won't auto-run again
          // io.unobserve(receiptSection); // keep for replay visibility?
        }
      });
    }, { threshold: 0.35 });
    io.observe(receiptSection);
  } else {
    // Fallback: run shortly after load
    setTimeout(run, 1200);
  }

  // Allow keyboard: Enter on the root triggers replay
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      resetAndRun();
    }
  });

  // Initial state
  setStage('processing');
})();
