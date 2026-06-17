/* 행복펫 — 커서 실타래. 움직일 때 나타나고 멈추면 서서히 사라짐. */
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

  var N = 28;
  var nodes = new Array(N);
  var inited = false;
  var mouse = { x: 0, y: 0 };
  var headEase = 0.34, bodyEase = 0.34;

  var paws = [], travel = 0, lastHX = 0, lastHY = 0;
  var PAW_LIFE = 1000, PAW_GAP = 52;

  // 실타래 전체 투명도 (움직이면 1, 멈추면 0으로 페이드)
  var globalAlpha = 0;
  var lastMoveTime = 0;
  var FADE_DELAY = 300;   // 멈추고 나서 이 시간(ms) 후 사라지기 시작
  var FADE_SPEED = 0.03;  // 사라지는 속도 (낮을수록 천천히)
  var APPEAR_SPEED = 0.12; // 나타나는 속도

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
      for (var i = 0; i < N; i++) nodes[i] = { x: mouse.x, y: mouse.y };
      lastHX = mouse.x; lastHY = mouse.y;
      inited = true;
    }
  }, { passive: true });

  function drawPaw(x, y, ang, alpha) {
    if (globalAlpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2);
    var c = col.a;
    ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * globalAlpha) + ')';
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

    // 투명도 조절: 최근에 움직였으면 나타나고, 멈추면 사라짐
    if (now - lastMoveTime < FADE_DELAY) {
      globalAlpha = Math.min(1, globalAlpha + APPEAR_SPEED);
    } else {
      globalAlpha = Math.max(0, globalAlpha - FADE_SPEED);
    }

    // 완전히 투명하면 그리지 않음
    if (globalAlpha <= 0) return;

    nodes[0].x += (mouse.x - nodes[0].x) * headEase;
    nodes[0].y += (mouse.y - nodes[0].y) * headEase;
    for (var i = 1; i < N; i++) {
      nodes[i].x += (nodes[i - 1].x - nodes[i].x) * bodyEase;
      nodes[i].y += (nodes[i - 1].y - nodes[i].y) * bodyEase;
    }

    var hvx = nodes[0].x - lastHX, hvy = nodes[0].y - lastHY;
    var speed = Math.hypot(hvx, hvy);
    travel += speed;
    var heading = (speed > 0.5) ? Math.atan2(hvy, hvx) : 0;
    if (travel >= PAW_GAP && speed > 1) {
      travel = 0;
      paws.push({ x: nodes[0].x, y: nodes[0].y, ang: heading, t: now });
    }
    lastHX = nodes[0].x; lastHY = nodes[0].y;

    for (var f = paws.length - 1; f >= 0; f--) {
      var pa = 1 - (now - paws[f].t) / PAW_LIFE;
      if (pa <= 0) { paws.splice(f, 1); continue; }
      drawPaw(paws[f].x, paws[f].y, paws[f].ang, pa * 0.45);
    }

    var c = col.a, s = col.s;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var j = 1; j < N; j++) {
      var p0 = nodes[j - 1], p1 = nodes[j];
      var taper = 1 - j / N;
      var w = Math.max(0.4, 7.5 * taper);
      var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + ((0.9 * taper + 0.08) * globalAlpha) + ')';
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(p0.x, p0.y, mx, my); ctx.stroke();
      if (w > 3) {
        ctx.strokeStyle = 'rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ',' + (0.4 * taper * globalAlpha) + ')';
        ctx.lineWidth = Math.max(0.7, w * 0.3);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(mx, my); ctx.stroke();
      }
    }

    if (speed > 1.2) {
      var hold = Math.min(1, speed / 6);
      drawPaw(nodes[0].x, nodes[0].y, heading, 0.85 * hold);
    } else {
      var c2 = col.a;
      ctx.fillStyle = 'rgba(' + c2[0] + ',' + c2[1] + ',' + c2[2] + ',' + (0.5 * globalAlpha) + ')';
      ctx.beginPath(); ctx.arc(nodes[0].x, nodes[0].y, 3.4, 0, 7); ctx.fill();
    }
  }
  requestAnimationFrame(frame);
})();
