/* Dynamic Button + Share — vanilla port of dqnamo/dynamic-button
   Resizes to fit label + crossfades text/icon. No React, no motion. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const icons = {
    share: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4"/><path d="M15.4 6.5l-6.8 4"/></svg>`,
    link: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 1.2-6.9l-1-1A4 4 0 0 0 3 7.8a4 4 0 0 0 5.7 5.7l1.3-1.3"/><path d="M14 10a4 4 0 0 0-1.2 6.9l1 1A4 4 0 0 0 21 16.2a4 4 0 0 0-5.7-5.7l-1.3 1.3"/></svg>`,
    copy: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="1.5"/><path d="M5 15V7a2.5 2.5 0 0 1 2.5-2.5H15"/></svg>`,
    check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12l4 4 8-8"/></svg>`,
  };

  function createDynamicButton(root) {
    if (!root) return null;
    const inner = root.querySelector('.dyn-btn__inner');
    const iconEl = root.querySelector('.dyn-btn__icon');
    const labelEl = root.querySelector('.dyn-btn__label');
    const measure = root.querySelector('.dyn-measure');
    if (!inner || !labelEl || !measure) return null;

    let state = { label: labelEl.textContent.trim(), icon: iconEl.innerHTML };

    function measureWidth(label, iconHTML) {
      // put content into hidden measure span and read its width + paddings
      measure.innerHTML = '';
      const w = document.createElement('span');
      w.className = 'dyn-measure__inner';
      if (iconHTML) {
        const i = document.createElement('span');
        i.innerHTML = iconHTML;
        i.style.display = 'inline-flex';
        w.appendChild(i);
      }
      const t = document.createElement('span');
      t.textContent = label;
      w.appendChild(t);
      measure.appendChild(w);
      const styles = getComputedStyle(root);
      const pad = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight) + parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
      // w is an inline-flex with the same 6px gap as the visible button inner,
      // so its scrollWidth already includes icon+gap+label
      return Math.ceil(w.scrollWidth + pad);
    }

    function syncWidth(label, iconHTML, animate = !reduce) {
      const w = measureWidth(label, iconHTML);
      if (animate && !reduce) {
        root.style.width = w + 'px';
      } else {
        root.style.transition = 'none';
        root.style.width = w + 'px';
        // force reflow then restore
        void root.offsetWidth;
        root.style.transition = '';
      }
    }

    // initial sync
    requestAnimationFrame(() => syncWidth(state.label, state.icon, false));

    let busy = false;
    function setContent(nextLabel, nextIconHTML, opts = {}) {
      const { immediate = reduce } = opts;
      if (nextLabel === state.label && nextIconHTML === state.icon) return;
      if (busy && !immediate) {
        // queue aftercurrent transition
        setTimeout(() => setContent(nextLabel, nextIconHTML), 260);
        return;
      }
      busy = true;
      const newW = measureWidth(nextLabel, nextIconHTML);
      if (!immediate) root.style.width = newW + 'px';

      // animate out old content
      if (!immediate) {
        labelEl.style.transition = 'opacity 0.18s cubic-bezier(.23,1,.32,1), transform 0.18s cubic-bezier(.23,1,.32,1)';
        iconEl.style.transition = 'opacity 0.18s cubic-bezier(.23,1,.32,1), transform 0.18s cubic-bezier(.23,1,.32,1)';
        labelEl.style.opacity = '0';
        labelEl.style.transform = 'translateY(-8px)';
        iconEl.style.opacity = '0';
        iconEl.style.transform = 'translateY(-8px)';
      }

      const doSwap = () => {
        labelEl.textContent = nextLabel;
        iconEl.innerHTML = nextIconHTML || '';
        state = { label: nextLabel, icon: nextIconHTML };
        // reset to entering state
        if (!immediate) {
          labelEl.style.transition = 'none';
          iconEl.style.transition = 'none';
          labelEl.style.opacity = '0';
          labelEl.style.transform = 'translateY(8px)';
          iconEl.style.opacity = '0';
          iconEl.style.transform = 'translateY(8px)';
          void labelEl.offsetWidth;
          labelEl.style.transition = 'opacity 0.18s cubic-bezier(.23,1,.32,1), transform 0.18s cubic-bezier(.23,1,.32,1)';
          iconEl.style.transition = 'opacity 0.18s cubic-bezier(.23,1,.32,1), transform 0.18s cubic-bezier(.23,1,.32,1)';
          requestAnimationFrame(() => {
            labelEl.style.opacity = '1';
            labelEl.style.transform = 'translateY(0)';
            iconEl.style.opacity = '1';
            iconEl.style.transform = 'translateY(0)';
            setTimeout(() => { busy = false; }, 190);
          });
        } else {
          labelEl.style.opacity = '1';
          labelEl.style.transform = 'none';
          iconEl.style.opacity = '1';
          iconEl.style.transform = 'none';
          busy = false;
        }
      };

      if (immediate) doSwap();
      else setTimeout(doSwap, 110);
    }

    // observe resize to stay correct if font loads late
    let ro;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => syncWidth(state.label, state.icon, false));
      ro.observe(measure);
    }
    window.addEventListener('resize', () => syncWidth(state.label, state.icon, false));

    return { setContent, syncWidth, getState: () => state, root };
  }

  // Setup all dynamic buttons found
  document.querySelectorAll('.dyn-btn').forEach((el) => {
    const api = createDynamicButton(el);
    if (api) el._dyn = api;
  });

  // Share logic for #shareBtn
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    const dyn = shareBtn._dyn || createDynamicButton(shareBtn);
    const shareIcon = icons.share;
    const copyIcon = icons.copy;
    const checkIcon = icons.check;

    // Ensure initial content is Share
    // dyn may already be set to Copy link in markup — normalize to Share + share icon
    // Only if label is not already set correctly
    // We'll keep markup's label as source of truth if present

    let restoreTimer = null;
    function restore() {
      if (!dyn) return;
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => dyn.setContent('Share', shareIcon), 1600);
      // Also measure after font load
    }

    async function doShare() {
      const url = document.querySelector('link[rel="canonical"]')?.href || location.href;
      const title = document.title;
      const text = document.querySelector('meta[name="description"]')?.content || 'Check out Idhant — student, developer & creator';

      // Try Web Share API first on mobile
      if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        try {
          await navigator.share({ title, text, url });
          dyn.setContent('Shared!', checkIcon);
          restore();
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return;
          // fall through to clipboard
        }
      }

      // Clipboard
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          const ta = document.createElement('textarea');
          ta.value = url;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        dyn.setContent('Copied!', checkIcon);
        restore();
      } catch (e) {
        // fallback: open share dialog or prompt
        window.prompt('Copy this link:', url);
      }
    }

    shareBtn.addEventListener('click', doShare);

    // Expose for receipt's secondary buttons if needed
    window.__sharePortfolio = doShare;
  }

  // Also wire generic dyn buttons via data attribute if any
  document.querySelectorAll('[data-copy]').forEach((b) => {
    const target = b.getAttribute('data-copy');
    b.addEventListener('click', async () => {
      const dyn = b._dyn;
      try {
        await navigator.clipboard.writeText(target || location.href);
        if (dyn) {
          dyn.setContent('Copied!', icons.check);
          setTimeout(() => dyn.setContent(b.dataset.label || 'Copy', icons.copy), 1500);
        }
      } catch (e) {}
    });
  });

  // Expose icons
  window.__dynIcons = icons;
})();
