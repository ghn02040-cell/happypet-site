/* 행복펫 — 커서 실타래. 스크롤/마우스 움직일 때 나타나고 멈추면 사라짐. */
(function () {
  if (window.__cursorThread) return;
  window.__cursorThread = true;
  if (window.matchMedia && !window.matchMedia('(pointer:fine)').matches) return;

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

  var mouse = { x: -999, y: -999 };
  var lastActivityTime = 0;
  var FADE_DELAY = 400;
  var inited = false;
  var globalAlpha = 0;

  var STRANDS = 6;
  var N = 24;

  var strands = [];
  for (var s = 0; s < STRANDS; s++) {
    var nodes = [];
    for (var n = 0; n < N; n++) nodes.push({ x: 0, y: 0 });
    strands.push({
      nodes: nodes,
      ease: 0.08 + s * 0.03,
      width: 1.5 + s * 0.4,
      offsetX: (s - STRANDS/2) * 3,
      offsetY: s * 2
    });
  }

  function onActivity() {
    lastActivityTime = performance.now();
    if (!inited && mouse.x > 0) {
      strands.forEach(function(st) {
        st.nodes.forEach(function(nd) { nd.x = mouse.x; nd.y = mouse.y; });
      });
      inited = true;
    }
  }

  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!inited) {
      strands.forEach(function(st) {
        st.nodes.forEach(function(nd) { nd.x = e.clientX; nd.y = e.clientY; });
      });
      inited = true;
    }
    onActivity();
  }, { passive: true });

  window.addEventListener('scroll', function () {
    onActivity();
  }, { passive: true });

  var col = { a: [182, 120, 220] };
  function hex2rgb(h) {
    h = (h || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(function(c){ return c+c; }).join('');
    if (h.length < 6) return null;
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    var a = hex2rgb(cs.getPropertyValue('--primary')); if (a) col.a = a;
  }
  readColors();
  var cframe = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (++cframe % 30 === 0) readColors();
    if (!inited) return;

    var now = performance.now();
    var active = now - lastActivityTime < FADE_DELAY;

    if (active) {
      globalAlpha = Math.min(1, globalAlpha + 0.08);
    } else {
      globalAlpha = Math.max(0, globalAlpha - 0.03);
    }
    if (globalAlpha <= 0) return;

    var c = col.a;

    strands.forEach(function(st, si) {
      var tx = mouse.x + st.offsetX;
      var ty = mouse.y + st.offsetY;

      st.nodes[0].x += (tx - st.nodes[0].x) * (st.ease + 0.12);
      st.nodes[0].y += (ty - st.nodes[0].y) * (st.ease + 0.12);
      for (var i = 1; i < N; i++) {
        st.nodes[i].x += (st.nodes[i-1].x - st.nodes[i].x) * st.ease;
        st.nodes[i].y += (st.nodes[i-1].y - st.nodes[i].y) * st.ease;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      var strandAlpha = globalAlpha * (0.5 + (STRANDS - si) / STRANDS * 0.5);

      ctx.beginPath();
      ctx.moveTo(st.nodes[0].x, st.nodes[0].y);
      for (var j = 1; j < N; j++) {
        var taper = 1 - j / N;
        var mx = (st.nodes[j-1].x + st.nodes[j].x) / 2;
        var my = (st.nodes[j-1].y + st.nodes[j].y) / 2;
        ctx.quadraticCurveTo(st.nodes[j-1].x, st.nodes[j-1].y, mx, my);
      }
      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + strandAlpha + ')';
      ctx.lineWidth = st.width;
      ctx.stroke();
    });
  }
  requestAnimationFrame(frame);
})();
