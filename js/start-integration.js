/* Anbindung der Startseite an Plattform und Checkout.
   Gleiche Dateien auf Staging und Live: nur die Live-Domain spricht mit der Produktiv-App. */
(function () {
  'use strict';
  var LIVE = location.hostname === 'www.trustworkx.de';
  var API_BASE = LIVE ? 'https://app.trustworkx.de' : 'https://staging.trustworkx.de';

  if (!LIVE) {
    document.querySelectorAll('a[href^="https://app.trustworkx.de"]').forEach(function (a) {
      a.href = a.href.replace('https://app.trustworkx.de', 'https://staging.trustworkx.de');
    });
  }

  /* Paketkarten: weitere Leistungen auf- und zuklappen */
  document.querySelectorAll('.features-toggle').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var label = btn.querySelector('.features-toggle-label');
    if (!panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      label.textContent = open ? 'Weniger anzeigen' : 'Alle Leistungen anzeigen';
    });
  });

  /* Header-Glaswellen (nur Desktop): Kreuzungspunkt (50 % / 61 % der Grafik) hinter das Signet legen */
  var waves = document.querySelector('.hero-waves img');
  var signet = document.querySelector('.connection img');
  function placeWaves() {
    if (!waves || !signet || !waves.offsetParent) return;
    var layer = waves.closest('.hero-waves');
    var box = layer.getBoundingClientRect();
    var s = signet.getBoundingClientRect();
    var h = waves.getBoundingClientRect().height;
    var cross = 0.61;
    layer.style.setProperty('--waves-top', (s.top + s.height / 2 - box.top - h * cross) + 'px');
    waves.closest('.hero-waves').classList.add('is-placed');
  }
  window.addEventListener('resize', placeWaves);
  window.addEventListener('load', placeWaves);
  if (waves) waves.addEventListener('load', placeWaves);
  placeWaves();

  /* Wellen-Loop (nur Desktop): Standbild bleibt, bis das Video sicher läuft.
     Kein Video bei „Bewegung reduzieren“, Datensparmodus, Safari (kein VP9-Alpha) oder Mobil. */
  var video = document.querySelector('.hero-waves-video');
  if (video && waves && window.matchMedia) {
    var wrap = video.parentNode;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mobile = window.matchMedia('(max-width: 680px)');
    var ua = navigator.userAgent;
    var safari = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(ua) || /iPad|iPhone|iPod/.test(ua);
    var saveData = navigator.connection && navigator.connection.saveData;
    var inView = true;
    var showStatic = function () { video.pause(); wrap.classList.remove('video-ready'); };
    var allowed = function () { return !reduce.matches && !mobile.matches && !safari && !saveData; };
    var start = function () {
      if (!allowed()) { showStatic(); return; }
      if (!video.getAttribute('src')) {
        var need = waves.getBoundingClientRect().width * (window.devicePixelRatio || 1);
        video.src = video.getAttribute(need <= 2560 ? 'data-src-2560' : 'data-src-4096');
      }
      if (!inView || document.hidden) return;
      var p = video.play();
      if (p && p.catch) p.catch(showStatic);
    };
    var ready = function () {
      if (!allowed() || video.paused) return;
      wrap.classList.add('video-ready');
    };
    video.addEventListener('playing', function () {
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(ready);
      else ready();
    });
    video.addEventListener('error', showStatic);
    document.addEventListener('visibilitychange', function () { if (document.hidden) video.pause(); else start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start(); else video.pause();
      }).observe(wrap);
    }
    var onPref = function () { if (allowed()) start(); else showStatic(); };
    if (reduce.addEventListener) { reduce.addEventListener('change', onPref); mobile.addEventListener('change', onPref); }
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  }

  var billing = document.getElementById('billing-toggle');
  function isAnnual() { return !!billing && billing.getAttribute('aria-checked') === 'true'; }

  function updateCtaLinks() {
    document.querySelectorAll('.plan-cta').forEach(function (a) {
      a.href = 'checkout.html?plan=' + encodeURIComponent(a.dataset.plan) +
        '&interval=' + (isAnnual() ? 'year' : 'month');
    });
  }
  if (billing) {
    new MutationObserver(updateCtaLinks).observe(billing, { attributes: true, attributeFilter: ['aria-checked'] });
  }
  window.addEventListener('pageshow', updateCtaLinks);
  updateCtaLinks();

  function renderPrices() {
    var annual = isAnnual();
    document.querySelectorAll('.price-card').forEach(function (card) {
      var strong = card.querySelector('.amount strong');
      var note = card.querySelector('.annual');
      if (!strong || !note) return;
      strong.textContent = (annual ? strong.dataset.year : strong.dataset.month) + ' €';
      note.replaceChildren(
        document.createTextNode(annual ? 'Bei monatlicher Buchung' : 'Bei jährlicher Buchung'),
        document.createElement('br'));
      var b = document.createElement('b');
      b.textContent = annual ? note.dataset.month + ' € / Monat' : note.dataset.year + ' € / Jahr';
      note.append(b);
    });
  }

  function fmt(cents) {
    return (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fetch(API_BASE + '/api/products')
    .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function (data) {
      var byName = {};
      (data.products || []).forEach(function (p) { byName[String(p.name).toUpperCase()] = p; });
      document.querySelectorAll('.price-card').forEach(function (card) {
        var h3 = card.querySelector('h3');
        var product = h3 && byName[h3.textContent.trim().toUpperCase()];
        if (!product) return;
        var strong = card.querySelector('.amount strong');
        var note = card.querySelector('.annual');
        (product.prices || []).forEach(function (price) {
          var key = price.interval === 'month' ? 'month' : price.interval === 'year' ? 'year' : null;
          if (!key || typeof price.amountCents !== 'number') return;
          strong.dataset[key] = fmt(price.amountCents);
          note.dataset[key] = fmt(price.amountCents);
        });
      });
      renderPrices();
    })
    .catch(function () { /* API nicht erreichbar: feste Ersatzpreise bleiben stehen */ });
})();
