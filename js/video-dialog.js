/* Video im Header: Button unter dem X öffnet das Video in einem Fenster.
   Die Videodatei wird erst bei Interesse (Hover/Fokus) bzw. beim Öffnen geladen. */
(function () {
  'use strict';
  var btn = document.querySelector('.video-pill');
  var dlg = document.getElementById('video-dialog');
  if (!btn || !dlg || typeof dlg.showModal !== 'function') { if (btn) btn.hidden = true; return; }
  var video = dlg.querySelector('video');
  var closeBtn = dlg.querySelector('.video-dialog-close');

  /* Quelle setzen und nur die Eckdaten vorladen (wenige KB), damit der Start nach dem Klick schneller geht */
  function prepare() {
    if (video.getAttribute('src')) return;
    video.poster = video.getAttribute('data-poster');
    video.preload = 'metadata';
    video.src = video.getAttribute('data-src');
  }

  /* Header-Wellen während des Videos anhalten: sie konkurrieren sonst (v. a. in Safari)
     um Leitung und Video-Decoder. Beim Schließen setzt der Wellen-Controller selbst fort. */
  function wavesVideo() { return document.querySelector('.hero-waves-box video'); }
  function pauseWaves() { var w = wavesVideo(); if (w) w.pause(); }
  function resumeWaves() { document.dispatchEvent(new Event('visibilitychange')); }

  btn.addEventListener('pointerenter', prepare);
  btn.addEventListener('focus', prepare);
  btn.addEventListener('touchstart', prepare, { passive: true });

  btn.addEventListener('click', function () {
    prepare();
    pauseWaves();
    dlg.showModal();
    video.preload = 'auto';
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* Start blockiert: Nutzer startet über die Steuerleiste */ });
  });
  closeBtn.addEventListener('click', function () { dlg.close(); });
  /* Klick neben das Video (auf den abgedunkelten Hintergrund) schließt */
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  /* Escape schließt nativ; beim Schließen anhalten, Wellen fortsetzen, Fokus zurück auf den Button */
  dlg.addEventListener('close', function () { video.pause(); resumeWaves(); btn.focus(); });
})();
