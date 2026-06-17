/* 행복펫 — 스크롤 실타래. 스크롤할 때 화면에 실타래가 나타나고 멈추면 사라짐. */
(function () {
  if (window.__cursorThread) return;
  window.__cursorThread = true;

  var canvas = document.createElement('canvas');
  canvas.id = 'cursor-thread';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:90';
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function attach() { if (document.body) { document.body.appendChild(canvas); resize(); } }
  if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);
  window.addEventListener('resize', resize);

  var lastScrollTime = 0;
  var FADE_DELAY = 600;
  var globalAlpha = 0;

  // 실타래 선들 — 화면 왼쪽에서 오른쪽으로 흘러가는 여러 가닥
  var STRANDS = 7;
  var strands = [];
  for (var s = 0; s < STRANDS; s++) {
    strands.push({
      y: 0.1 + s * (0.85 / STRANDS), // 화면 세로 위치 비율
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4,
      amp: 18 + Math.random() * 24,
      width: 1.2 + Math.random() * 1.8,
      offset: Math.random() * 200
    });
  }

  var scrollY = window.scrollY || 0;
  var time = 0;

  window.addEventListener('scroll', function () {
    lastScrollTime = performance.now();
    scrollY = window.scrollY || 0;
  }, { passive: true });

  var col = [182, 120, 220];
  function hex2rgb(h) {
    h = (h || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(function(c){ return c+c; }).join('');
    if (h.length < 6) return null;
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    var a = hex2rgb(cs.getPropertyValue('--primary')); if (a) col = a;
  }
  readColors();
  var cframe = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (++cframe % 30 === 0) readColors();

    var now = performance.now();
    var scrolling = now - lastScrollTime < FADE_DELAY;

    if (scrolling) {
      globalAlpha = Math.min(1, globalAlpha + 0.07);
    } else {
      globalAlpha = Math.max(0, globalAlpha - 0.025);
    }
    if (globalAlpha <= 0) return;

    time += 0.016;
    var W = innerWidth, H = innerHeight;
    var c = col;

    strands.forEach(function(st, si) {
      var baseY = st.y * H;
      var strandAlpha = globalAlpha * (0.4 + (si % 3) * 0.15);

      ctx.beginPath();
      ctx.moveTo(0, baseY);

      for (var x = 0; x <= W; x += 4) {
        var wave = Math.sin((x + st.offset + time * st.speed * 80) * 0.012 + st.phase) * st.amp;
        var wave2 = Math.sin((x * 0.007 + time * st.speed * 40) + st.phase * 1.3) * (st.amp * 0.4);
        ctx.lineTo(x, baseY + wave + wave2);
      }

      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + strandAlpha + ')';
      ctx.lineWidth = st.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  }
  requestAnimationFrame(frame);
})();
