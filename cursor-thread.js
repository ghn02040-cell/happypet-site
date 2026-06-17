/* 행복펫 — 커서 실타래. A soft yarn that trails the cursor: it flows out
   long while you move and gathers back in when you stop, dropping the odd
   paw-print as it goes. Pointer-fine only; off under prefers-reduced-motion. */
(function () {
  if (window.__cursorThread) return;
  window.__cursorThread = true;
  // pointer-fine only (skip touch); intentionally NOT gated on reduced-motion,
  // since this is a gentle, user-requested cursor flourish.
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

  // trailing rope of nodes (head chases the cursor, each node chases the one before)
  var N = 28;
  var nodes = new Array(N);
  var inited = false;
  var mouse = { x: 0, y: 0 };
  var headEase = 0.34, bodyEase = 0.34;

  // paw-prints dropped along travel
  var paws = [], travel = 0, lastHX = 0, lastHY = 0;
  var PAW_LIFE = 1000, PAW_GAP = 52;

  // theme colors (refreshed so palette switching is reflected)
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
    if (!inited) {
      for (var i = 0; i < N; i++) nodes[i] = { x: mouse.x, y: mouse.y };
      lastHX = mouse.x; lastHY = mouse.y;
      inited = true;
    }
  }, { passive: true });

  function drawPaw(x, y, ang, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2);
    var c = col.a;
    ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
    ctx.beginPath(); ctx.ellipse(0, 4, 5, 4.4, 0, 0, 7); ctx.fill();
    var toes = [[-5, -3, 2.1], [-1.8, -5.2, 2.2], [1.8, -5.2, 2.2], [5, -3, 2.1]];
    for (var i = 0; i < toes.length; i++) { ctx.beginPath(); ctx.arc(toes[i][0], toes[i][1], toes[i][2], 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (++cframe % 30 === 0) readColors();
    if (!inited) return;
    var now = performance.now();

    // advance the rope: head eases toward cursor, body follows
    nodes[0].x += (mouse.x - nodes[0].x) * headEase;
    nodes[0].y += (mouse.y - nodes[0].y) * headEase;
    for (var i = 1; i < N; i++) {
      nodes[i].x += (nodes[i - 1].x - nodes[i].x) * bodyEase;
      nodes[i].y += (nodes[i - 1].y - nodes[i].y) * bodyEase;
    }

    // head velocity (for paw heading + drop cadence)
    var hvx = nodes[0].x - lastHX, hvy = nodes[0].y - lastHY;
    var speed = Math.hypot(hvx, hvy);
    travel += speed;
    var heading = (speed > 0.5) ? Math.atan2(hvy, hvx) : 0;
    if (travel >= PAW_GAP && speed > 1) {
      travel = 0;
      paws.push({ x: nodes[0].x, y: nodes[0].y, ang: heading, t: now });
    }
    lastHX = nodes[0].x; lastHY = nodes[0].y;

    // paw-prints under the yarn
    for (var f = paws.length - 1; f >= 0; f--) {
      var pa = 1 - (now - paws[f].t) / PAW_LIFE;
      if (pa <= 0) { paws.splice(f, 1); continue; }
      drawPaw(paws[f].x, paws[f].y, paws[f].ang, pa * 0.45);
    }

    // the yarn — tapered head->tail, smoothed
    var c = col.a, s = col.s;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var j = 1; j < N; j++) {
      var p0 = nodes[j - 1], p1 = nodes[j];
      var taper = 1 - j / N;
      var w = Math.max(0.4, 7.5 * taper);
      var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.9 * taper + 0.08) + ')';
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(p0.x, p0.y, mx, my); ctx.stroke();
      if (w > 3) {
        ctx.strokeStyle = 'rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ',' + (0.4 * taper) + ')';
        ctx.lineWidth = Math.max(0.7, w * 0.3);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(mx, my); ctx.stroke();
      }
    }

    // a paw padding at the very head while moving
    if (speed > 1.2) {
      var hold = Math.min(1, speed / 6);
      drawPaw(nodes[0].x, nodes[0].y, heading, 0.85 * hold);
    } else {
      // soft glow dot when resting
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.5)';
      ctx.beginPath(); ctx.arc(nodes[0].x, nodes[0].y, 3.4, 0, 7); ctx.fill();
    }
  }
  requestAnimationFrame(frame);
})();
