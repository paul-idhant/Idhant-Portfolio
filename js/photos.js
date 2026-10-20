/* Full-size, accessible photo viewer. Original colours; no negative-image inversion. */
(() => {
  const dialog = document.getElementById('photoViewer');
  const image = document.getElementById('photoViewerImage');
  const caption = document.getElementById('photoViewerCaption');
  const photos = Array.from(document.querySelectorAll('[data-photo]'));
  let current = 0;
  let returnFocus;
  function show(index) {
    current = (index + photos.length) % photos.length;
    const source = photos[current].querySelector('img');
    image.src = source.getAttribute('src');
    image.alt = source.alt;
    const label = photos[current].closest('figure').querySelector('figcaption span').textContent;
    caption.textContent = `${String(current + 1).padStart(2, '0')} / 03 — ${label.replace(/^\d+\s*\/\s*/, '')}`;
  }
  photos.forEach((button, index) => button.addEventListener('click', () => {
    returnFocus = button;
    show(index);
    dialog.showModal();
    document.body.classList.add('photo-is-open');
    document.getElementById('photoClose').focus();
  }));
  document.getElementById('photoClose').addEventListener('click', () => dialog.close());
  document.getElementById('photoPrev').addEventListener('click', () => show(current - 1));
  document.getElementById('photoNext').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('photo-is-open');
    returnFocus?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', (e) => {
    // Prevent the PSP's global shortcuts from acting while the viewer is open.
    e.stopPropagation();
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });
})();
