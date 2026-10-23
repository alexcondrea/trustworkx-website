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

  /* Nur Staging-Vorschau: sehr langsame Wellen im Hero mit ?wellen=1 */
  if (!LIVE && /[?&]wellen=1(&|$)/.test(location.search)) {
    document.documentElement.classList.add('hero-waves-preview');
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
