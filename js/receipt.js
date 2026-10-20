/* Receipt printer — personal keepsake edition.
   Vanilla stage machine: processing -> printing -> complete.
   Colours live in CSS (theme vars), so invert just works. */
(() => {
  const root = document.getElementById('rpRoot');
  if (!root) return;
  const paper = document.getElementById('rpPaper');
  const statusEl = document.getElementById('rpStatus');
  const dotEl = document.getElementById('rpStatusDot');
  const replayBtn = document.getElementById('rpReplay');
  const printBtn = document.getElementById('rpPrintBtn');
  const dateEl = document.getElementById('rpDate');
  const orderEl = document.getElementById('rpOrder');
  const barcodeLabel = document.getElementById('rpBarcodeLabel');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- zig-zag tear edge: 40 teeth, 4px deep ---- */
  (function clip() {
    if (!paper) return;
    const teeth = 40, step = 100 / teeth, pts = ['0 0', '100% 0'];
    for (let i = teeth; i >= 0; i--) {
      pts.push((i * step).toFixed(3) + '% ' + (i % 2 === 0 ? '100%' : 'calc(100% - 4px)'));
    }
    paper.style.clipPath = 'polygon(' + pts.join(',') + ')';
  })();

  /* ---- live date + a fresh order number per print ---- */
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function stamp() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (dateEl) dateEl.textContent = dd + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' • ' + hh + ':' + mm;
    const ord = 'ORD-' + (1000 + Math.floor(Math.random() * 9000));
    if (orderEl) orderEl.textContent = ord + ' / IDHNT-2026';
    if (barcodeLabel) barcodeLabel.textContent = ord;
  }

  /* ---- stage machine ---- */
  let t1 = 0, t2 = 0;
  function setStage(stage) {
    root.setAttribute('data-stage', stage);
    if (!statusEl || !dotEl) return;
    if (stage === 'complete') {
      dotEl.innerHTML = '<span class="check">✓</span>';
      statusEl.textContent = 'Order complete';
    } else {
      dotEl.innerHTML = '<span class="spin"></span>';
      statusEl.textContent = stage === 'printing' ? 'Printing your receipt' : 'Processing your order';
    }
  }
  function run() {
    clearTimeout(t1); clearTimeout(t2);
    stamp();
    if (reduce.matches) { setStage('complete'); return; }
    setStage('processing');
    t1 = setTimeout(() => setStage('printing'), 900);
    t2 = setTimeout(() => setStage('complete'), 900 + 1750);
  }
  function replay() {
    const wrap = paper && paper.parentElement;
    if (wrap && !reduce.matches) {           // force reflow so the feed animation restarts
      wrap.style.animation = 'none';
      void wrap.offsetWidth;
      wrap.style.animation = '';
    }
    run();
  }

  setStage('processing');
  stamp();

  /* ---- auto-play once when scrolled into view ---- */
  let played = false;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !played) { played = true; run(); io.disconnect(); }
      });
    }, { threshold: 0.35 });
    io.observe(root);
  } else {
    run();
  }

  replayBtn && replayBtn.addEventListener('click', replay);
  printBtn && printBtn.addEventListener('click', replay);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); replay(); }
  });
  reduce.addEventListener && reduce.addEventListener('change', () => { if (reduce.matches) setStage('complete'); });
})();
