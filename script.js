// Progressive enhancements only — the page is fully usable without JavaScript.
(function () {
  'use strict';

  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');

  /* ── Header divider once the page scrolls ───────────────── */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile menu ────────────────────────────────────────── */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 721px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ── Active section in the navigation ───────────────────── */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));
  var sections = spyLinks
    .map(function (a) { return a.getAttribute('data-spy'); })
    .filter(function (id) { return id !== 'top'; })
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function setActive(id) {
    spyLinks.forEach(function (a) {
      if (a.getAttribute('data-spy') === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function updateActive() {
    // A section is "current" once its top passes ~35% of the viewport height.
    var line = window.innerHeight * 0.35;
    var current = 'top';
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= line) current = s.id;
    });
    // At the very bottom, highlight the last section even if it is short.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }
    setActive(current);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { updateActive(); ticking = false; });
    }
  }, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();

  // Deep links (e.g. /#research): web fonts can shift layout after the initial jump,
  // so re-align the target once fonts are ready.
  if (location.hash.length > 1 && document.fonts && document.fonts.ready) {
    var loaded = new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });
    Promise.all([document.fonts.ready, loaded]).then(function () {
      window.requestAnimationFrame(function () {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target && window.scrollY > 0) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    });
  }

  /* ── Copy email (display stays obfuscated; no mailto in markup) ── */
  var status = document.querySelector('[data-copy-status]');

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  document.querySelectorAll('[data-copy-email]').forEach(function (btn) {
    btn.hidden = false;
    btn.setAttribute('aria-label', 'Copy email address');
    btn.addEventListener('click', function () {
      var address = btn.getAttribute('data-u') + '@' + btn.getAttribute('data-d');
      var copy = navigator.clipboard && window.isSecureContext
        ? navigator.clipboard.writeText(address).catch(function () { return fallbackCopy(address); })
        : fallbackCopy(address);

      copy.then(function () {
        btn.textContent = 'Copied';
        btn.classList.add('is-copied');
        status.textContent = 'Email address copied to clipboard.';
      }, function () {
        btn.textContent = 'Copy failed';
        status.textContent = 'Could not copy automatically. The address is brucezhang at nyu dot edu.';
      });

      window.clearTimeout(btn._t);
      btn._t = window.setTimeout(function () {
        btn.textContent = 'Copy';
        btn.classList.remove('is-copied');
      }, 2000);
    });
  });
})();
