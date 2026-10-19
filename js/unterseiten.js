/* Unterseiten: Menü (wie Startseite) und Staging-Umleitung der Plattform-Links. */
(function () {
  'use strict';
  var menu = document.querySelector('.menu-toggle');
  var nav = document.getElementById('nav-links');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      nav.classList.toggle('open', open);
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      });
    });
  }

  /* Auf Staging zeigen Plattform-Links auf die Staging-Plattform */
  if (location.hostname !== 'www.trustworkx.de') {
    document.querySelectorAll('a[href^="https://app.trustworkx.de"]').forEach(function (a) {
      a.href = a.href.replace('https://app.trustworkx.de', 'https://staging.trustworkx.de');
    });
  }
})();
