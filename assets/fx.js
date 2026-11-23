/* Prashi Group — scroll & motion engine.
   "live" = a real browser window (not a tall canvas frame): airy spacing applies.
   "fx-on" = live + scrollable + motion allowed: animations apply. */
(function () {
  if (window.__prashiFx) return;
  window.__prashiFx = true;

  var enabled = false, io = null, ticking = false, timer = null;
  var par = [], clips = [], tracks = [], sliders = [];
  var root = document.documentElement;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function vh() { return window.innerHeight || root.clientHeight; }
  function isLive() { return vh() <= 1800; }
  function scrollable() {
    if (!isLive()) return false;
    var se = document.scrollingElement || root;
    return se.scrollHeight > vh() * 1.4;
  }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function all(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }

  function count(el) {
    var final = el.getAttribute('data-final') || el.textContent;
    el.setAttribute('data-final', final);
    var m = final.match(/[\d,]+/);
    if (!m) return;
    var target = parseInt(m[0].replace(/,/g, ''), 10);
    var pre = final.slice(0, m.index), suf = final.slice(m.index + m[0].length);
    var comma = m[0].indexOf(',') > -1, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var k = clamp((ts - start) / 1700, 0, 1), e = 1 - Math.pow(1 - k, 3), v = Math.round(target * e);
      el.textContent = pre + (comma ? v.toLocaleString('en-IN') : String(v)) + suf;
      if (k < 1) requestAnimationFrame(step); else el.textContent = final;
    }
    requestAnimationFrame(step);
  }

  // Statement: stagger by visual line, italics and photo chips slightly later
  function words(el) {
    var ws = all('[data-w],[data-chip]', el);
    var fs = parseFloat(getComputedStyle(el).fontSize) || 48;
    var line = -1, last = null;
    ws.forEach(function (w) {
      var t = w.offsetTop;
      if (last === null || Math.abs(t - last) > fs * 0.6) { line++; last = t; }
      var d = line * 0.16;
      if (w.hasAttribute('data-chip')) d += 0.45; else if (w.tagName === 'EM') d += 0.25;
      w.style.transitionDelay = d.toFixed(2) + 's';
      w.classList.add('lit');
    });
  }

  function bindTrack(t) {
    if (t._bound) return;
    t._bound = true;
    var down = false, sx = 0, sl = 0, moved = false;
    t.addEventListener('mousedown', function (e) { down = true; moved = false; sx = e.pageX; sl = t.scrollLeft; });
    window.addEventListener('mousemove', function (e) {
      if (!down || !enabled) return;
      var dx = e.pageX - sx;
      if (Math.abs(dx) > 5) { moved = true; t.classList.add('dragging'); }
      if (moved) t.scrollLeft = sl - dx;
    });
    window.addEventListener('mouseup', function () {
      down = false;
      setTimeout(function () { t.classList.remove('dragging'); }, 0);
    });
    t.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  function scan() {
    var sel = '[data-reveal]:not([data-obs]),[data-draw]:not([data-obs]),[data-letters]:not([data-obs]),[data-count]:not([data-obs]),[data-words]:not([data-obs])';
    all(sel).forEach(function (el) { el.setAttribute('data-obs', '1'); io.observe(el); });
    par = all('[data-parallax]');
    clips = all('[data-clip]');
    tracks = all('[data-track]');
    sliders = all('[data-slider]');
    tracks.forEach(bindTrack);
  }

  function layout() {
    sliders.forEach(function (sec) {
      var n = all('[data-slide-bg]', sec).length || 1;
      sec.style.height = Math.round(vh() * (1 + 0.8 * (n - 1))) + 'px';
    });
  }

  function frame() {
    ticking = false;
    var h = vh();
    par.forEach(function (el) {
      var host = el.parentElement || el;
      var r = host.getBoundingClientRect();
      if (r.bottom < -300 || r.top > h + 300) return;
      var s = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      var sc = parseFloat(el.getAttribute('data-scale') || '1');
      var off = (r.top + r.height / 2 - h / 2) * s;
      var room = Math.max(0, (sc - 1) * (el.offsetHeight || r.height) / 2 - 2);
      off = clamp(off, -room, room);
      el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0) scale(' + sc + ')';
    });
    clips.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = clamp((h - r.top) / (h * 0.85), 0, 1);
      var m = parseFloat(el.getAttribute('data-clip')) || 10;
      var x = (1 - p) * m;
      el.style.clipPath = 'inset(' + (x * 0.7).toFixed(2) + '% ' + x.toFixed(2) + '% ' + (x * 0.7).toFixed(2) + '% ' + x.toFixed(2) + '%)';
    });
    all('[data-bgshift]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      el.classList.toggle('lit', r.top < h * 0.55 && r.bottom > 0);
    });
    tracks.forEach(function (t) {
      var host = t.closest('section') || t.parentElement;
      var bar = host ? host.querySelector('[data-hbar]') : null;
      if (!bar) return;
      var max = t.scrollWidth - t.clientWidth;
      var p = max > 0 ? clamp(t.scrollLeft / max, 0, 1) : 0;
      bar.style.width = (18 + p * 82).toFixed(1) + '%';
    });
    sliders.forEach(function (sec) {
      var bgs = all('[data-slide-bg]', sec), imgs = all('[data-slide-img]', sec), txts = all('[data-slide-text]', sec);
      var n = bgs.length;
      if (n < 2) return;
      var total = sec.offsetHeight - h;
      var r = sec.getBoundingClientRect();
      var p = (total > 0 ? clamp(-r.top / total, 0, 1) : 0) * (n - 1);
      for (var i = 1; i < n; i++) {
        var q = clamp(p - (i - 1), 0, 1);
        q = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
        var c = 'inset(' + ((1 - q) * 100).toFixed(2) + '% 0 0 0)';
        bgs[i].style.clipPath = c;
        if (imgs[i]) imgs[i].style.clipPath = c;
      }
      var active = Math.round(p);
      txts.forEach(function (t, i) { t.style.opacity = i === active ? '1' : '0'; });
      var cnt = sec.querySelector('[data-slide-count]');
      if (cnt) cnt.textContent = '0' + (active + 1);
    });
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  function disable() {
    if (!enabled) return;
    enabled = false;
    root.classList.remove('fx-on');
    window.removeEventListener('scroll', onScroll, true);
    if (timer) { clearInterval(timer); timer = null; }
    if (io) { io.disconnect(); io = null; }
    all('[data-obs]').forEach(function (el) { el.removeAttribute('data-obs'); el.classList.add('in'); });
    all('[data-parallax]').forEach(function (el) { el.style.transform = ''; });
    all('[data-clip]').forEach(function (el) { el.style.clipPath = ''; });
    all('[data-final]').forEach(function (el) { el.textContent = el.getAttribute('data-final'); });
    all('[data-slider]').forEach(function (sec) {
      sec.style.height = '';
      all('[data-slide-bg]', sec).concat(all('[data-slide-img]', sec)).forEach(function (el) {
        el.style.clipPath = el.getAttribute('data-first') ? '' : 'inset(100% 0 0 0)';
      });
      all('[data-slide-text]', sec).forEach(function (t, i) { t.style.opacity = i === 0 ? '1' : '0'; });
      var cnt = sec.querySelector('[data-slide-count]');
      if (cnt) cnt.textContent = '01';
    });
  }

  function enable() {
    root.classList.toggle('live', isLive());
    if (enabled || reduced() || !scrollable() || !document.querySelector('[data-fx-root]')) return;
    enabled = true;
    root.classList.add('fx-on');
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-count')) count(e.target);
        if (e.target.hasAttribute('data-words')) words(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    scan(); layout(); frame();
    window.addEventListener('scroll', onScroll, true);
    timer = setInterval(function () { if (enabled) { scan(); layout(); onScroll(); } }, 900);
  }

  function onResize() {
    root.classList.toggle('live', isLive());
    if (enabled && !scrollable()) { disable(); return; }
    if (!enabled) { enable(); return; }
    layout(); onScroll();
  }

  var tries = 0;
  function boot() {
    enable();
    if (!enabled && tries++ < 40) setTimeout(boot, 300);
  }
  window.addEventListener('resize', onResize);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
