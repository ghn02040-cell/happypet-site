/* 행복펫 — 실타래 scroll animation.
   스크롤 내리면 실이 구불구불 루프를 만들며 풀려나오고 올리면 다시 감긴다. */
(function () {
  if (window.__threadLoaded) return;
  window.__threadLoaded = true;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = `
  #thread-layer{ position:absolute; left:0; top:0; width:100%; pointer-events:none; z-index:40; overflow:visible; }
  #thread-layer svg{ position:absolute; left:0; top:0; overflow:visible; }
  .thread-base{ fill:none; stroke-linecap:round; stroke-linejoin:round; }
  .thread-paw .pad{ fill:var(--primary); }
  @media (max-width:760px){ #thread-layer{ display:none !important; } }
  `;
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var layer = document.createElement('div');
  layer.id = 'thread-layer';
  layer.setAttribute('aria-hidden', 'true');
  var svg = document.createElementNS(SVGNS, 'svg');
  layer.appendChild(svg);
  document.body.insertBefore(layer, document.body.firstChild);
  if (getComputedStyle(document.body).position === 'static') document.body.style.position = 'relative';

  var basePath = document.createElementNS(SVGNS, 'path');
  basePath.setAttribute('class', 'thread-base');
  svg.appendChild(basePath);

  function makePaw() {
    var g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'thread-paw');
    var pad = document.createElementNS(SVGNS, 'ellipse');
    pad.setAttribute('class','pad'); pad.setAttribute('cx',0); pad.setAttribute('cy',5);
    pad.setAttribute('rx',7); pad.setAttribute('ry',6);
    g.appendChild(pad);
    [[-7,-4,3],[-2.6,-7,3.1],[2.6,-7,3.1],[7,-4,3]].forEach(function(t){
      var c = document.createElementNS(SVGNS,'circle');
      c.setAttribute('class','pad'); c.setAttribute('cx',t[0]); c.setAttribute('cy',t[1]); c.setAttribute('r',t[2]);
      g.appendChild(c);
    });
    return g;
  }
  var paw = makePaw();
  svg.appendChild(paw);

  var L = 0, samples = [], W = 0, H = 0;

  function docHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  }

  function build() {
    W = document.documentElement.clientWidth;
    H = docHeight();
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    layer.style.height = H + 'px';

    var lineW = Math.max(2, Math.min(W * 0.004, 4));
    basePath.style.stroke = 'var(--primary)';
    basePath.style.strokeWidth = lineW;
    basePath.style.opacity = '0.7';

    // 섹션 앵커
    var secs = [
      ['.hero', 0.6], ['#about', 0.4], ['#services', 0.5],
      ['#doctors', 0.5], ['#tips', 0.5], ['#location', 0.4]
    ];
    var anchors = [];
    var leftX  = Math.max(60, W * 0.12);
    var rightX = W - Math.max(60, W * 0.12);

    secs.forEach(function(s, i) {
      var el = document.querySelector(s[0]);
      if (!el) return;
      var r = el.getBoundingClientRect();
      var y = r.top + window.scrollY + r.height * s[1];
      anchors.push({ x: (i % 2 === 0) ? leftX : rightX, y: y });
    });
    if (anchors.length < 2) return;

    // 경로 생성: 앵커 사이마다 자연스러운 S커브 + 작은 루프
    var d = 'M ' + anchors[0].x.toFixed(1) + ' ' + anchors[0].y.toFixed(1);

    for (var i = 0; i < anchors.length - 1; i++) {
      var a = anchors[i];
      var b = anchors[i + 1];
      var dy = b.y - a.y;
      var dx = b.x - a.x;
      var goRight = dx > 0;

      // 루프 위치 (앵커 a 아래쪽)
      var loopY = a.y + dy * 0.35;
      var loopX = a.x;
      var lr = Math.min(55, dy * 0.12); // 루프 반지름

      // S커브로 루프까지
      d += ' C ' +
        (a.x + dx * 0.2).toFixed(1) + ' ' + (a.y + dy * 0.1).toFixed(1) + ' ' +
        (loopX + (goRight ? -lr * 2 : lr * 2)).toFixed(1) + ' ' + (loopY - lr).toFixed(1) + ' ' +
        (loopX + (goRight ? -lr * 0.5 : lr * 0.5)).toFixed(1) + ' ' + loopY.toFixed(1);

      // 작은 루프 (원형에 가까운 베지어)
      var lx = loopX + (goRight ? -lr * 0.5 : lr * 0.5);
      var ly = loopY;
      d += ' C ' +
        (lx + (goRight ? -lr * 1.8 : lr * 1.8)).toFixed(1) + ' ' + (ly + lr * 0.5).toFixed(1) + ' ' +
        (lx + (goRight ? -lr * 1.8 : lr * 1.8)).toFixed(1) + ' ' + (ly - lr * 1.2).toFixed(1) + ' ' +
        lx.toFixed(1) + ' ' + (ly - lr * 0.3).toFixed(1);

      // 루프 → b 로 S커브
      d += ' C ' +
        (loopX + (goRight ? lr : -lr)).toFixed(1) + ' ' + (loopY + lr * 0.8).toFixed(1) + ' ' +
        (b.x - dx * 0.2).toFixed(1) + ' ' + (b.y - dy * 0.1).toFixed(1) + ' ' +
        b.x.toFixed(1) + ' ' + b.y.toFixed(1);
    }

    basePath.setAttribute('d', d);
    L = basePath.getTotalLength();
    basePath.style.strokeDasharray = L;

    // y → length 샘플링
    samples = [];
    for (var k = 0; k <= 400; k++) {
      var len = (k / 400) * L;
      var p = basePath.getPointAtLength(len);
      samples.push({ y: p.y, len: len });
    }

    draw();
  }

  function lenForY(targetY) {
    if (!samples.length) return 0;
    if (targetY <= samples[0].y) return 0;
    if (targetY >= samples[samples.length-1].y) return L;
    for (var i = 1; i < samples.length; i++) {
      if (samples[i].y >= targetY) {
        var a = samples[i-1], b = samples[i];
        var t = (targetY - a.y) / (b.y - a.y || 1);
        return a.len + (b.len - a.len) * t;
      }
    }
    return L;
  }

  function draw() {
    if (!L) return;
    var drawn = reduce ? L : Math.max(0, Math.min(L, lenForY(window.scrollY + window.innerHeight * 0.65)));
    basePath.style.strokeDashoffset = (L - drawn);

    var p  = basePath.getPointAtLength(drawn);
    var pa = basePath.getPointAtLength(Math.max(0, drawn - 4));
    var pb = basePath.getPointAtLength(Math.min(L, drawn + 4));
    var ang = Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI + 90;
    paw.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    paw.style.opacity = (reduce || drawn >= L - 1 || drawn <= 1) ? '0' : '0.85';
  }

  var ticking = false;
  window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() { draw(); ticking = false; });
  }, { passive: true });

  var rt;
  window.addEventListener('resize', function() { clearTimeout(rt); rt = setTimeout(build, 180); }, { passive: true });

  build();
  window.addEventListener('load', build);
  [350, 1200, 2600].forEach(function(t) { setTimeout(build, t); });
  document.addEventListener('image-slot:filled', build);
})();
