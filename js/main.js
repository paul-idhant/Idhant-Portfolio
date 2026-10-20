/* ============================================================
   IDHANT OS — boot sequence, HUD, audio, navigation.
   Plain script; psp.js is the module and talks to us via
   window.SK (a tiny shared bus).
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* shared bus ------------------------------------------------ */
  var SK = window.SK = {
    ready: false,
    _onReady: [],
    onReady: function (fn) { this.ready ? fn() : this._onReady.push(fn); },
    fireReady: function () {
      this.ready = true;
      this._onReady.splice(0).forEach(function (f) { f(); });
    }
  };

  /* ---------------------------------------------------------- */
  /* BOOT SEQUENCE                                              */
  /* ---------------------------------------------------------- */
  var boot = document.getElementById('boot');
  var fillEl = document.getElementById('bootFill');
  var pctEl = document.getElementById('bootPct');

  var pct = 0, targetPct = 0;
  var bootDone = false;

  function setPct(v) {
    pct = v;
    if (fillEl) fillEl.style.right = (100 - v) + '%';
    if (pctEl) pctEl.textContent = String(Math.round(v)).padStart(3, '0');
  }

  /* creep toward 96 while the model streams in; finishBoot waits on the scene */
  function crawl() {
    targetPct = Math.min(96, targetPct + 6);
    if (targetPct < 96) setTimeout(crawl, reduce ? 30 : 90);
    else finishBoot();
  }

  function tickPct() {
    if (bootDone) return;
    setPct(pct + (targetPct - pct) * 0.14);
    requestAnimationFrame(tickPct);
  }

  function finishBoot() {
    // wait for the 3D scene (or bail after 9s so a slow CDN never traps anyone)
    var released = false;
    function release() {
      if (released) return; released = true;
      targetPct = 100; setPct(100);
      setTimeout(function () {
        bootDone = true;
        if (boot) boot.classList.add('is-done');
        document.body.classList.remove('is-booting');
        document.body.classList.add('is-lit');
      }, reduce ? 60 : 420);
    }
    SK.onReady(release);
    setTimeout(release, 9000);
  }

  requestAnimationFrame(tickPct);
  setTimeout(crawl, reduce ? 0 : 200);

  /* Original background track, enabled after browser-approved interaction.
     A generation counter prevents an old play promise/fade overriding a toggle. */
  var audio = document.getElementById('bgAudio');
  var btn = document.getElementById('soundToggle');
  var wanted = true, audible = false, audioRequest = 0, fadeTimer = null;
  var VOL = 0.42;
  try { wanted = sessionStorage.getItem('idhant_sound') !== '0'; } catch (e) {}

  function reflectSound() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', wanted ? 'true' : 'false');
    btn.setAttribute('aria-label', wanted ? 'Turn background music off' : 'Turn background music on');
  }
  function fadeIn(request) {
    clearInterval(fadeTimer);
    fadeTimer = setInterval(function () {
      if (!wanted || request !== audioRequest) { clearInterval(fadeTimer); return; }
      audio.volume = Math.min(VOL, audio.volume + VOL / 18);
      if (audio.volume >= VOL) clearInterval(fadeTimer);
    }, 40);
  }
  function startMusic() {
    if (!audio || !wanted || document.hidden) return;
    if (audible && !audio.paused && !audio.muted) return;
    var request = ++audioRequest;
    audio.muted = false;
    audio.volume = 0;
    var result = audio.play();
    if (!result || !result.then) return;
    result.then(function () {
      if (request !== audioRequest || !wanted) return;
      audible = true;
      fadeIn(request);
    }).catch(function () {
      if (request !== audioRequest || !wanted) return;
      audible = false;
      // Browser autoplay restriction: wait for a genuine tap/click/key event.
    });
  }
  function setSound(on) {
    wanted = on;
    reflectSound();
    try { sessionStorage.setItem('idhant_sound', on ? '1' : '0'); } catch (e) {}
    if (on) startMusic();
    else {
      ++audioRequest;
      clearInterval(fadeTimer);
      audible = false;
      if (audio) { audio.pause(); audio.volume = 0; }
    }
  }
  if (btn) btn.addEventListener('click', function () { setSound(!wanted); });
  function gestureMusic(e) {
    if (btn && (e.target === btn || btn.contains(e.target))) return;
    if (wanted) startMusic();
  }
  ['pointerdown', 'click', 'keydown', 'touchend'].forEach(function (event) {
    window.addEventListener(event, gestureMusic, { passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (!audio) return;
    if (document.hidden) {
      ++audioRequest;
      clearInterval(fadeTimer);
      audio.pause(); audible = false;
    } else if (wanted) startMusic();
  });
  reflectSound();
  if (wanted) startMusic();

  /* ---------------------------------------------------------- */
  /* INVERT — swaps the ink and the paper, keeps pink/cyan        */
  /* ---------------------------------------------------------- */
  var invBtn = document.getElementById('invertToggle');
  function setInvert(on) {
    document.body.classList.toggle('is-invert', on);
    if (invBtn) invBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', on ? '#ffffff' : '#000000');
    if (SK.setShellInvert) SK.setShellInvert(on);   // the PSP casing goes white
    if (typeof onScroll === 'function') onScroll();  // repaint the backdrop tone
    try { localStorage.setItem('idhant_invert', on ? '1' : '0'); } catch (e) {}
  }
  if (invBtn) {
    invBtn.addEventListener('click', function () {
      setInvert(!document.body.classList.contains('is-invert'));
    });
  }
  try { if (localStorage.getItem('idhant_invert') === '1') setInvert(true); } catch (e) {}

  /* ---------------------------------------------------------- */
  /* SCROLL ENGINE                                               */
  /* Three jobs: bleed the backdrop tone across section seams,   */
  /* drift each element at its own rate, and reveal type as it   */
  /* enters. Everything runs off one rAF loop.                   */
  /* ---------------------------------------------------------- */
  var backdrop = document.querySelector('.backdrop');
  var secs = [].slice.call(document.querySelectorAll('.sec'));
  var movers = [].slice.call(document.querySelectorAll('.el, .lay'));

  /* how far each piece drifts, as a fraction of the viewport */
  var DEPTH = {
    'el--star-a': 0.16, 'el--star-b': -0.13, 'el--dice': 0.07,
    'el--cd-a': 0.15, 'el--cd-b': -0.12, 'el--cards': 0.08,
    'lay--name': -0.05, 'lay--tagline': 0.05,
    'lay--abouth': -0.04, 'lay--bio': 0.035,
    'lay--contact': -0.05, 'lay--me': 0.05, 'lay--icons': 0.03
  };
  movers.forEach(function (m) {
    var d = 0;
    for (var k in DEPTH) if (m.classList.contains(k)) d = DEPTH[k];
    m.__d = d;
  });

  function toneOf(sec) { return sec.classList.contains('sec--dark') ? 1 : 0; }

  var ticking = false;
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    var mid = window.scrollY + vh * 0.5;

    /* --- backdrop tone, blended across a band at each seam --- */
    if (backdrop && secs.length) {
      var band = vh * 0.6;
      var tone = toneOf(secs[secs.length - 1]);
      for (var i = 0; i < secs.length; i++) {
        var top = secs[i].offsetTop, bot = top + secs[i].offsetHeight;
        if (mid >= top && mid < bot) {
          tone = toneOf(secs[i]);
          if (i < secs.length - 1 && mid > bot - band) {
            tone += (toneOf(secs[i + 1]) - tone) * ((mid - (bot - band)) / band);
          } else if (i > 0 && mid < top + band) {
            tone += (toneOf(secs[i - 1]) - tone) * (1 - (mid - top) / band);
          }
          break;
        }
      }
      var inv = document.body.classList.contains('is-invert');
      var v = Math.round((inv ? tone : 1 - tone) * 255);
      backdrop.style.backgroundColor = 'rgb(' + v + ',' + v + ',' + v + ')';
    }

    /* --- per-element drift --- */
    for (var j = 0; j < movers.length; j++) {
      var m = movers[j];
      if (!m.__d) continue;
      var r = m.parentNode.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;      // far off-screen, skip
      var p = (r.top + r.height / 2 - vh / 2) / vh;        // -1 .. 1 through the viewport
      m.style.setProperty('--ty', (p * m.__d * vh).toFixed(1) + 'px');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();

  /* reveal the type and the cut-outs as each section arrives */
  if ('IntersectionObserver' in window && !reduce) {
    var lays = [].slice.call(document.querySelectorAll('.lay, .el'));
    lays.forEach(function (n) { n.classList.add('rev'); });
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-shown'); ro.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    lays.forEach(function (n) { ro.observe(n); });

    /* Failsafe — nothing may be left hidden because an observer misfired.
       PER ELEMENT, not blanket: it only shows what is actually on screen, so a
       section further down still gets its animation when you reach it. An
       earlier build force-showed everything 2.5s after load and killed every
       reveal past the fold; the one before that left all body text invisible.
       Do not remove this, and do not turn it back into a blanket timeout. */
    var showIfNear = function () {
      var vh = window.innerHeight, live = 0;
      for (var z = 0; z < lays.length; z++) {
        var el = lays[z];
        if (el.classList.contains('is-shown')) continue;
        live++;
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) { el.classList.add('is-shown'); ro.unobserve(el); }
      }
      if (!live && guard) { clearInterval(guard); guard = null; }
    };
    var guard = setInterval(showIfNear, 900);
    showIfNear();
    window.addEventListener('scroll', showIfNear, { passive: true });
    window.addEventListener('resize', showIfNear, { passive: true });
  }

  /* ---------------------------------------------------------- */
  /* SMOOTH IN-PAGE NAV                                          */
  /* ---------------------------------------------------------- */
  document.querySelectorAll('[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------------------------------------------------------- */
  /* SECTION REVEALS                                             */
  /* ---------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.18 });
    document.querySelectorAll('.about, .contact').forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------- */
  /* FOOTER YEAR & MISC POLISH                                   */
  /* ---------------------------------------------------------- */
  try {
    var yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  } catch (e) {}

  // Ensure boot releases even if SK.fireReady races with reduced-motion bail
  window.addEventListener('error', function (e) {
    if (e && e.message && e.message.indexOf('psp') > -1) {
      SK.fireReady();
    }
  });

  // Respect data-saving / slow-connection hints: silence autoplay on 2G
  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType))) {
      wanted = false;
      reflectSound();
    }
  } catch (e) {}
})();
