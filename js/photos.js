/* Full-size, accessible photo viewer. Original colours; no negative-image inversion.
   Production-hardened: focus trap, escape handling, scroll-lock compensation. */
(() => {
  const dialog = document.getElementById('photoViewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('photoViewerImage');
  const caption = document.getElementById('photoViewerCaption');
  const closeBtn = document.getElementById('photoClose');
  const prevBtn = document.getElementById('photoPrev');
  const nextBtn = document.getElementById('photoNext');
  const photos = Array.from(document.querySelectorAll('[data-photo]'));
  if (!photos.length) return;

  let current = 0;
  let returnFocus = null;
  let prevOverflow = '';
  let prevPaddingRight = '';

  function lockScroll() {
    prevOverflow = document.body.style.overflow;
    prevPaddingRight = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + 'px';
    document.body.classList.add('photo-is-open');
  }
  function unlockScroll() {
    document.body.classList.remove('photo-is-open');
    document.body.style.overflow = prevOverflow;
    document.body.style.paddingRight = prevPaddingRight;
  }

  function show(index) {
    current = (index + photos.length) % photos.length;
    const source = photos[current].querySelector('img');
    if (!source) return;
    // Use the full-res src (not small) for viewer; keep alt faithful
    const full = source.getAttribute('src') || source.src;
    image.src = full;
    image.alt = source.alt || '';
    const fig = photos[current].closest('figure');
    const labelEl = fig && fig.querySelector('figcaption span');
    const label = labelEl ? labelEl.textContent : '';
    caption.textContent = `${String(current + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')} — ${label.replace(/^\d+\s*\/\s*/, '')}`;
    // Preload neighbours for instant nav
    [1, -1].forEach((d) => {
      const n = photos[(current + d + photos.length) % photos.length];
      const img = n && n.querySelector('img');
      if (img && img.src) { const p = new Image(); p.src = img.src; }
    });
  }

  function open(index, trigger) {
    returnFocus = trigger || document.activeElement;
    show(index);
    try {
      dialog.showModal();
    } catch (e) {
      // Fallback if already open
      if (!dialog.open) return;
    }
    lockScroll();
    // Defer focus so dialog transition settles
    requestAnimationFrame(() => closeBtn && closeBtn.focus());
  }

  photos.forEach((button, index) => {
    button.addEventListener('click', () => open(index, button));
    // Keyboard activation is native for <button>, but ensure Enter/Space also opens
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(index, button);
      }
    });
  });

  function close() {
    if (dialog.open) dialog.close();
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (prevBtn) prevBtn.addEventListener('click', () => show(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => show(current + 1));

  dialog.addEventListener('close', () => {
    unlockScroll();
    // Restore focus to trigger, prevent scroll jump
    if (returnFocus && typeof returnFocus.focus === 'function') {
      try { returnFocus.focus({ preventScroll: true }); } catch (e) { returnFocus.focus(); }
    }
    returnFocus = null;
  });

  // Backdrop click closes (only when clicking outside the dialog's content box)
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });

  dialog.addEventListener('keydown', (e) => {
    // Keep PSP global shortcuts from firing; but allow Escape to close natively
    if (e.key !== 'Escape') e.stopPropagation();
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    else if (e.key === 'Escape') {
      // Native dialog will close; ensure scroll unlock happens via 'close' event
      // Stop PSP from reacting to Escape as well
      e.stopPropagation();
    }
  });

  // Handle browsers where dialog is not yet supported (polyfill-less fallback):
  // already early-returned above; remaining code only runs with native dialog.
})();
