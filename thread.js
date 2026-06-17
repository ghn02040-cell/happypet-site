/* 행복펫 — 실타래 scroll animation. 스크롤 내리면 실이 루프를 만들며 풀려나오고
   올리면 다시 감긴다. */
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

  // 움직이는 발바닥
  function makePaw() {
    var g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'thread-paw');
    var toes = [[-7,-4,3],[-2.6,-7,3.1],[2.6,-7,3.1],[7,-4,3]];
    var pad = document.createElementNS(SVGNS, 'ellipse');
    pad.setAttribute('class','pad'); pad.setAttribute('cx',0); pad.setAttribute('cy',5);
    pad.setAttribute('rx',7); pad.setAttribute('ry',6);
    g.appendChild(pad);
    toes.forEach(function(t){
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

  // 루프를 포함한 경로 생성
  function buildLoopyPath(W, H, sections) {
    var pts = [];
    var leftX = Math.max(40, Math.min(W * 0.12, 150));
    var rightX = W - leftX;

    sections.forEach(function(sec, idx) {
      var el = document.querySelector(sec[0]);
      if (!el) return;
      var r = el.getBoundingClientRect();
      var y = r.top + window.scrollY + r.height * sec[1];
      var x = (idx % 2 === 0) ? leftX : rightX;

      // 루프 포인트 추가 (각 섹션 앞에 작은 루프)
      if (idx > 0) {
        var prevX = (idx % 2 === 0) ? rightX : leftX;
        var loopSize = 60 + Math.random() * 40;
        var loopY = y - 80;
        // 루프 포인트들
        pts.push({ x: prevX, y: loopY - loopSize });
        pts.push({ x: prevX + (x > prevX ? loopSize : -loopSize), y: loopY - loopSize * 1.5 });
        pts.push({ x: prevX + (x > prevX ? loopSize * 0.5 : -loopSize * 0.5), y: loopY });
        pts.push({ x: prevX - (x > prevX ? loopSize * 0.3 : -loopSize * 0.3), y: loopY - loopSize * 0.8 });
        pts.push({ x: prevX, y: loopY });
      }
      pts.push({ x: x, y: y });
    });
    return pts;
  }

  function catmull(points) {
    if (points.length < 2) return '';
    var d = 'M' + points[0].x.toFixed(1) + ' ' + points[0].y.toFixed(1);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i-1] || points[i];
      var p1 = points[i];
      var p2 = points[i+1];
      var p3 = points[i+2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 5, c1y = p1.y + (p2.y - p0.y) / 5;
      var c2x = p2.x - (p3.x - p1.x) / 5, c2y = p2.y - (p3.y - p1.y) / 5;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }

  function getColor() {
    var cs = getComputedStyle(document.documentElement);
    var c = cs.getPropertyValue('--primary').trim();
    return c || '#0F6E5C';
  }

  function build() {
    W = document.documentElement.clientWidth;
    H = docHeight();
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    layer.style.height = H + 'px';

    var lineW = Math.max(2, Math.min(W * 0.004, 5));
    basePath.style.stroke = getColor();
    basePath.style.strokeWidth = lineW;
    basePath.style.opacity = '0.7';

    var sections = [
      ['.hero', 0.5], ['#about', 0.4], ['#services', 0.5],
      ['#doctors', 0.5], ['#tips', 0.5], ['#location', 0.4]
    ];

    var pts = buildLoopyPath(W, H, sections);
    if (pts.length < 2) return;

    var d = catmull(pts);
    basePath.setAttribute('d', d);

    L = basePath.getTotalLength();
    basePath.style.strokeDasharray = L;

    // 샘플링
    samples = [];
    var N = 300;
    for (var k = 0; k <= N; k++) {
      var len = (k / N) * L;
      var p = basePath.getPointAtLength(len);
      samples.push({ y: p.y, len: len });
    }

    draw(true);
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
    var drawn;
    if (reduce) {
      drawn = L;
    } else {
      var targetY = window.scrollY + window.innerHeight * 0.65;
      drawn = Math.max(0, Math.min(L, lenForY(targetY)));
    }
    basePath.style.strokeDashoffset = (L - drawn);

    var p = basePath.getPointAtLength(drawn);
    var pa = basePath.getPointAtLength(Math.max(0, drawn - 4));
    var pb = basePath.getPointAtLength(Math.min(L, drawn + 4));
    var ang = Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI + 90;
    paw.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    paw.style.opacity = (reduce || drawn >= L - 1 || drawn <= 1) ? '0' : '0.8';
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() { draw(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var rt;
  window.addEventListener('resize', function() { clearTimeout(rt); rt = setTimeout(build, 180); }, { passive: true });

  build();
  window.addEventListener('load', build);
  [350, 1200, 2600].forEach(function(t) { setTimeout(build, t); });
  document.addEventListener('image-slot:filled', build);
})();
