/* ═══ TWX Popover — wiederverwendbare Erklärungs-Karte (Hover/Tap) ═══
   Desktop: Hover über das Element zeigt die Karte, Verlassen schließt.
   Touch:   Tap auf das Element öffnet, Tap außerhalb schließt.
   Verwendung:
     <li data-popover="pop-beispiel">…</li>
     <div hidden><div id="pop-beispiel"><h5>Titel</h5><p>Text</p></div></div>
   Styles: css/twx-popover.css */
(function () {
  'use strict';

  var pop = document.createElement('div');
  pop.className = 'twx-popover';
  pop.setAttribute('role', 'tooltip');
  document.body.appendChild(pop);

  var current = null;
  var touchMode = false;

  window.addEventListener('touchstart', function () { touchMode = true; }, { passive: true });

  function position(el) {
    var r = el.getBoundingClientRect();
    var pw = pop.offsetWidth;
    var ph = pop.offsetHeight;
    var x = Math.min(Math.max(16, r.left), window.innerWidth - pw - 16);
    var y = r.top - ph - 10;
    if (y < 16) y = Math.min(r.bottom + 10, window.innerHeight - ph - 16);
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
  }

  function show(el) {
    var src = document.getElementById(el.getAttribute('data-popover'));
    if (!src) return;
    pop.innerHTML = src.innerHTML;
    pop.classList.add('open');
    current = el;
    position(el);
  }

  function hide() {
    pop.classList.remove('open');
    current = null;
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-popover]'), function (el) {
    el.addEventListener('mouseenter', function () { if (!touchMode) show(el); });
    el.addEventListener('mouseleave', function () { if (!touchMode) hide(); });
    el.addEventListener('click', function (e) {
      if (!touchMode) return;
      e.stopPropagation();
      if (current === el) { hide(); } else { show(el); }
    });
  });

  document.addEventListener('click', function (e) {
    if (current && !(e.target.closest && e.target.closest('[data-popover]'))) hide();
  });
  window.addEventListener('scroll', function () { if (current) position(current); }, { passive: true });
  window.addEventListener('resize', function () { if (current) position(current); });
})();
