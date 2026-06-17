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
  var FADE_DELAY = 300;
  var inited = false;

  var STRANDS = 5;
  var N = 20;

  var colors = [
    [242, 135, 107],
    [255, 180, 150],
    [200, 100, 180],
    [150, 180, 255],
    [100, 220, 180]
  ];

  var strands = [];
  for (var s = 0; s < STRANDS; s++) {
    var nodes = [];
    for (var n = 0; n < N; n++) nodes.push({ x: 0, y: 0 });
    strands.push({
      nodes: nodes,
      ease: 0.15 + s * 0.04,
      width: 2.5 + s * 0.5,
      alpha: 0,
      color: colors[s % colors.length]
    });
  }

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

    var now = performance.now();
    var moving = now - lastMoveTime < FADE_DELAY;

    strands.forEach(function (st, si) {
      if (moving) {
        st.alpha = Math.min(1, st.alpha + 0.1);
      } else {
        st.alpha = Math.max(0, st.alpha - 0.025);
      }
      if (st.alpha <= 0) return;

      var tx = mouse.x;
      var ty = mouse.y;

      st.nodes[0].x += (tx - st.nodes[0].x) * (st.ease + 0.15);
      st.nodes[0].y += (ty - st.nodes[0].y) * (st.ease + 0.15);
      for (var i = 1; i < N; i++) {
        st.nodes[i].x += (st.nodes[i-1].x - st.nodes[i].x) * st.ease;
        st.nodes[i].y += (st.nodes[i-1].y - st.nodes[i].y) * st.ease;
      }

      var c = st.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(st.nodes[0].x, st.nodes[0].y);
      for (var j = 1; j < N; j++) {
        var mx = (st.nodes[j-1].x + st.nodes[j].x) / 2;
        var my = (st.nodes[j-1].y + st.nodes[j].y) / 2;
        ctx.quadraticCurveTo(st.nodes[j-1].x, st.nodes[j-1].y, mx, my);
      }

      var taper = 1;
      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.8 * st.alpha) + ')';
      ctx.lineWidth = st.width;
      ctx.stroke();
    });
  }
  requestAnimationFrame(frame);
})();
