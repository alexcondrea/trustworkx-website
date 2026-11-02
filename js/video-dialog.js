/* Video im Header: Button unter dem X öffnet das Video in einem Fenster.
   Die Videodatei wird erst beim Öffnen geladen. */
(function () {
  'use strict';
  var btn = document.querySelector('.video-pill');
  var dlg = document.getElementById('video-dialog');
  if (!btn || !dlg || typeof dlg.showModal !== 'function') { if (btn) btn.hidden = true; return; }
  var video = dlg.querySelector('video');
  var closeBtn = dlg.querySelector('.video-dialog-close');

  btn.addEventListener('click', function () {
    if (!video.getAttribute('src')) {
      video.poster = video.getAttribute('data-poster');
      video.src = video.getAttribute('data-src');
    }
    dlg.showModal();
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* Start blockiert: Nutzer startet über die Steuerleiste */ });
  });
  closeBtn.addEventListener('click', function () { dlg.close(); });
  /* Klick neben das Video (auf den abgedunkelten Hintergrund) schließt */
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  /* Escape schließt nativ; beim Schließen anhalten und Fokus zurück auf den Button */
  dlg.addEventListener('close', function () { video.pause(); btn.focus(); });
})();
