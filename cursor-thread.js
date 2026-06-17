/* 행복펫 — 커서 실타래. 여러 가닥이 마우스 따라 나타났다 사라짐. */
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

  var mouse = { x: 0, y: 0 };
  var lastMoveTime = 0;
  var FADE_DELAY = 200;
  var inited = false;

  // 여러 가닥 설정
  var STRANDS = 6;
  var N = 22; // 각 가닥의 노드 수

  var strands = [];
  for (var s = 0; s < STRANDS; s++) {
    var nodes = [];
    for (var n = 0; n < N; n++) nodes.push({ x: 0, y: 0 });
    strands.push({
      nodes: nodes,
      ease: 0.18 + Math.random() * 0.18,
      offset: Math.random() * Math.PI * 2,
      width: 1.5 + Math.random() * 3,
      alpha: 0,
      delay: s * 30
    });
  }

  var col = { a: [242, 135, 107], s: [255, 255, 255] };
  function hex2rgb(h) {
    h = (h || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length < 6) return null;
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    var a = hex2rgb(cs.getPropertyValue('--accent')); if (a) col.a = a;
    var s = hex2rgb(cs.getPropertyValue('--surface')); if (s) col.s = s;
  }
  readColors();
  var cframe = 0;

  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    lastMoveTime = performance.now();
    if (!inited) {
      strands.forEach(function (st) {
        st.nodes.forEach(function (nd) { nd.x = mouse.x; nd.y = mouse.y; });
      });
      inited = true;
    }
  }, { passive: true });

  function frame() {
    requestAnimationFrame(frame);
    if (!ctx || !inited) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (++cframe % 30 === 0) readColors();

    var now = performance.now();
    var moving = now - lastMoveTime < FADE_DELAY;
    var c = col.a, s = col.s;

    strands.forEach(function (st, si) {
      // 투명도: 움직이면 나타나고 멈추면 사라짐 (가닥마다 살짝 다르게)
      if (moving) {
        st.alpha = Math.min(1, st.alpha + 0.08 + si * 0.01);
      } else {
        st.alpha = Math.max(0, st.alpha - (0.02 + si * 0.003));
      }
      if (st.alpha <= 0) return;

      // 마우스 주변에 살짝 퍼지는 오프셋
      var wobble = Math.sin(now * 0.002 + st.offset) * 8;
      var wobble2 = Math.cos(now * 0.0015 + st.offset) * 8;
      var tx = mouse.x + wobble;
      var ty = mouse.y + wobble2;

      // 노드 업데이트
      st.nodes[0].x += (tx - st.nodes[0].x) * (st.ease + 0.1);
      st.nodes[0].y += (ty - st.nodes[0].y) * (st.ease + 0.1);
      for (var i = 1; i < N; i++) {
        st.nodes[i].x += (st.nodes[i-1].x - st.nodes[i].x) * st.ease;
        st.nodes[i].y += (st.nodes[i-1].y - st.nodes[i].y) * st.ease;
      }

      // 가닥 그리기
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (var j = 1; j < N; j++) {
        var p0 = st.nodes[j-1], p1 = st.nodes[j];
        var taper = 1 - j / N;
        var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
        ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.85 * taper * st.alpha) + ')';
        ctx.lineWidth = Math.max(0.3, st.width * taper);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
        ctx.stroke();
      }
    });
  }
  requestAnimationFrame(frame);
})();
