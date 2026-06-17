/* 행복펫 동물 메디컬센터 — shared interactions */
(function () {
  // ---- header scrolled state ----
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- mobile drawer ----
  var menuBtn = document.querySelector('.menu-btn');
  var drawer = document.querySelector('.drawer');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', function () {
      drawer.classList.toggle('open');
      document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- count up ----
  function animateCount(el) {
    if (el._counted) return; el._counted = true;
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var dec = (el.dataset.count.split('.')[1] || '').length;
    var dur = 1400, start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (dec ? val.toFixed(dec) : Math.round(val).toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---- reveal on scroll ----
  var reveals = [].slice.call(document.querySelectorAll('[data-reveal]'));
  var counts = [].slice.call(document.querySelectorAll('[data-count]'));
  var anyRevealed = false;

  function reveal(el) {
    anyRevealed = true;
    el.classList.add('is-in');
    // safety net: guarantee final visible state even if a renderer glitches the transition
    setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; }, 1200);
  }

  // Primary mechanism for real browsers: IntersectionObserver.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  // Secondary: manual viewport check on scroll (covers browsers where IO is flaky).
  function manualCheck() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
    });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.85 && r.bottom > 0) animateCount(el);
    });
  }
  window.addEventListener('scroll', manualCheck, { passive: true });
  window.addEventListener('resize', manualCheck, { passive: true });
  requestAnimationFrame(function () { requestAnimationFrame(manualCheck); });

  function revealAllRemaining() {
    document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(reveal);
    counts.forEach(animateCount);
  }

  // Failsafe for non-scrolling contexts (some embeds/previews can't scroll the
  // document, so IO/scroll reveals never fire for below-fold content). Probe
  // whether scrolling actually moves the page; if it's blocked, reveal all so
  // content is never stuck hidden. Real browsers scroll fine -> IO handles it.
  setTimeout(function () {
    if (window.scrollY > 0) return;               // user already scrolling; IO works
    var tall = (document.documentElement.scrollHeight - window.innerHeight) > 40;
    if (!tall) { revealAllRemaining(); return; }   // nothing to scroll
    var y0 = window.scrollY;
    window.scrollTo(0, 40);
    var moved = window.scrollY > y0;
    window.scrollTo(0, y0);
    if (!moved) revealAllRemaining();              // scrolling is blocked here
  }, 1500);
})();
