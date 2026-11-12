/* Video im Header: Button unter dem X öffnet das Video in einem Fenster.
   Die Videodatei wird erst bei Interesse (Hover/Fokus) bzw. beim Öffnen geladen.
   Optional: data-src-small (kleinere Fassung für kleine Bildschirme, Datensparmodus, langsame Netze). */
(function () {
  'use strict';
  var btn = document.querySelector('.video-pill');
  var dlg = document.getElementById('video-dialog');
  if (!btn || !dlg || typeof dlg.showModal !== 'function') { if (btn) btn.hidden = true; return; }
  var video = dlg.querySelector('video');
  var closeBtn = dlg.querySelector('.video-dialog-close');

  function source() {
    var conn = navigator.connection || {};
    var small = matchMedia('(max-width: 900px)').matches || conn.saveData ||
      /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '');
    return (small && video.getAttribute('data-src-small')) || video.getAttribute('data-src');
  }

  /* Quelle setzen und nur die Eckdaten vorladen (wenige KB), damit der Start nach dem Klick schneller geht */
  function prepare() {
    if (video.getAttribute('src')) return;
    video.poster = video.getAttribute('data-poster');
    video.preload = 'metadata';
    video.src = source();
  }

  /* Ladeanzeige über dem Vorschaubild, bis Bilder kommen; bei Nachladen erneut.
     Nur Safari/iOS: Chrome, Edge und Firefox zeigen bereits einen eigenen Ladekreis. */
  var ownLoader = !/(Chrome|Chromium|Edg|OPR|Firefox)\//.test(navigator.userAgent);
  function loading(on) { dlg.classList.toggle('is-loading', on && ownLoader); }
  video.addEventListener('playing', function () { loading(false); });
  video.addEventListener('waiting', function () { if (!video.paused) loading(true); });
  video.addEventListener('pause', function () { loading(false); });
  video.addEventListener('error', function () { loading(false); });

  /* Header-Wellen während des Videos anhalten und ihren Download abbrechen */
  function holdWaves(on) {
    if (typeof window.trustworkxWavesHold === 'function') window.trustworkxWavesHold(on);
  }

  btn.addEventListener('pointerenter', prepare);
  btn.addEventListener('focus', prepare);
  btn.addEventListener('touchstart', prepare, { passive: true });

  btn.addEventListener('click', function () {
    prepare();
    holdWaves(true);
    dlg.showModal();
    video.preload = 'auto';
    loading(true);
    var p = video.play();
    if (p && p.catch) p.catch(function () { loading(false); /* Start blockiert: Nutzer startet über die Steuerleiste */ });
  });
  closeBtn.addEventListener('click', function () { dlg.close(); });
  /* Klick neben das Video (auf den abgedunkelten Hintergrund) schließt */
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  /* Escape schließt nativ; beim Schließen anhalten, Wellen fortsetzen, Fokus zurück auf den Button */
  dlg.addEventListener('close', function () { video.pause(); loading(false); holdWaves(false); btn.focus(); });
})();
