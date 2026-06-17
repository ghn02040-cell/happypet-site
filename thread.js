/* 행복펫 — 실타래 (thread) scroll animation for the home page.
   A soft pastel "thread" is drawn as you scroll, weaving through the
   sections, with a paw padding along its leading edge and a trail of
   faint paw-prints left behind. Decorative & progressive: disabled on
   small screens and under prefers-reduced-motion (shown static). */
(function () {
  if (window.__threadLoaded) return;
  window.__threadLoaded = true;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- styles ---------- */
  var css = `
  #thread-layer{ position:absolute; left:0; top:0; width:100%; pointer-events:none; z-index:40; overflow:visible; }
  #thread-layer svg{ position:absolute; left:0; top:0; overflow:visible; }
  .thread-base{ fill:none; stroke:var(--primary); stroke-linecap:round; stroke-linejoin:round; opacity:.92;
    filter:drop-shadow(0 3px 7px rgba(0,0,0,.10)); }
  .thread-stitch{ fill:none; stroke:var(--surface); stroke-linecap:round; opacity:.5; }
  .thread-stamp{ fill:var(--primary); opacity:0; transition:opacity .55s ease; }
  .thread-stamp.on{ opacity:.15; }
  .thread-paw{ transition:opacity .3s ease; }
  .thread-paw .pad{ fill:var(--accent); }
  .thread-paw .ring{ fill:none; stroke:#fff; stroke-width:2.4; opacity:.95; }
  .thread-paw .halo{ fill:var(--accent); opacity:.16; }
  @media (max-width:760px){ #thread-layer{ display:none !important; } }
  `;
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- layer + svg ---------- */
  var layer = document.createElement('div');
  layer.id = 'thread-layer';
  layer.setAttribute('aria-hidden', 'true');
  var svg = document.createElementNS(SVGNS, 'svg');
  layer.appendChild(svg);
  document.body.insertBefore(layer, document.body.firstChild);
  if (getComputedStyle(document.body).position === 'static') document.body.style.position = 'relative';

  var stitchPath = document.createElementNS(SVGNS, 'path'); // top dashed "twist"
  var basePath = document.createElementNS(SVGNS, 'path');   // the thread
  basePath.setAttribute('class', 'thread-base');
  stitchPath.setAttribute('class', 'thread-stitch');
  var stampGroup = document.createElementNS(SVGNS, 'g');

  // moving paw
  function pawGroup(cls) {
    var g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', cls);
    var toes = [[-7, -4, 3], [-2.6, -7, 3.1], [2.6, -7, 3.1], [7, -4, 3]];
    var pad = document.createElementNS(SVGNS, 'ellipse');
    pad.setAttribute('class', 'pad'); pad.setAttribute('cx', 0); pad.setAttribute('cy', 5);
    pad.setAttribute('rx', 7); pad.setAttribute('ry', 6);
    g.appendChild(pad);
    toes.forEach(function (t) {
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('class', 'pad'); c.setAttribute('cx', t[0]); c.setAttribute('cy', t[1]); c.setAttribute('r', t[2]);
      g.appendChild(c);
    });
    return g;
  }
  var paw = document.createElementNS(SVGNS, 'g');
  paw.setAttribute('class', 'thread-paw');
  var halo = document.createElementNS(SVGNS, 'circle');
  halo.setAttribute('class', 'halo'); halo.setAttribute('r', 22); halo.setAttribute('cx', 0); halo.setAttribute('cy', 0);
  var pawBody = pawGroup('pawbody');
  // white ring behind paw for contrast
  var ring = document.createElementNS(SVGNS, 'circle');
  ring.setAttribute('class', 'ring'); ring.setAttribute('r', 17); ring.setAttribute('cx', 0); ring.setAttribute('cy', 0);
  paw.appendChild(halo); paw.appendChild(ring); paw.appendChild(pawBody);

  svg.appendChild(basePath);
  svg.appendChild(stitchPath);
  svg.appendChild(stampGroup);
  svg.appendChild(paw);

  /* ---------- geometry ---------- */
  var L = 0, samples = [], stamps = [], W = 0, H = 0;

  function docHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight);
  }

  function anchorY(sel) {
    var el = document.querySelector(sel);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2;
  }

  function catmull(points) {
    if (points.length < 2) return '';
    var d = 'M' + points[0].x.toFixed(1) + ' ' + points[0].y.toFixed(1);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }

  function build() {
    W = document.documentElement.clientWidth;
    H = docHeight();
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    layer.style.height = H + 'px';

    var lineW = Math.max(3.5, Math.min(W * 0.0045, 6));
    basePath.style.strokeWidth = lineW;
    stitchPath.style.strokeWidth = Math.max(1.4, lineW * 0.34);
    stitchPath.style.strokeDasharray = (lineW * 0.5) + ' ' + (lineW * 2.1);

    var leftX = Math.max(40, Math.min(W * 0.12, 150));
    var rightX = W - leftX;

    // anchor through real sections, top -> bottom, alternating gutters
    var defs = [
      ['.hero', 0.62], ['#about', 0.5], ['#services', 0.5],
      ['#doctors', 0.5], ['#tips', 0.5], ['#location', 0.5]
    ];
    var pts = [], idx = 0;
    for (var i = 0; i < defs.length; i++) {
      var el = document.querySelector(defs[i][0]);
      if (!el) continue;
      var r = el.getBoundingClientRect();
      var y = r.top + window.scrollY + r.height * defs[i][1];
      var x = (idx % 2 === 0) ? leftX : rightX;
      pts.push({ x: x, y: y });
      idx++;
    }
    if (pts.length < 2) return;
    // ensure strictly increasing y
    for (var j = 1; j < pts.length; j++) if (pts[j].y <= pts[j - 1].y) pts[j].y = pts[j - 1].y + 20;

    var d = catmull(pts);
    basePath.setAttribute('d', d);
    stitchPath.setAttribute('d', d);

    L = basePath.getTotalLength();
    basePath.style.strokeDasharray = L;
    stitchPath.style.strokeDasharray = stitchPath.style.strokeDasharray; // keep dash pattern (twist)

    // y -> length lookup
    samples = [];
    var N = 240;
    for (var k = 0; k <= N; k++) {
      var len = (k / N) * L;
      var p = basePath.getPointAtLength(len);
      samples.push({ y: p.y, len: len });
    }

    // paw-print stamps along the path
    while (stampGroup.firstChild) stampGroup.removeChild(stampGroup.firstChild);
    stamps = [];
    var step = 150, side = 1;
    for (var sl = step * 0.6; sl < L - 10; sl += step) {
      var pp = basePath.getPointAtLength(sl);
      var pa = basePath.getPointAtLength(Math.max(0, sl - 3));
      var pb = basePath.getPointAtLength(Math.min(L, sl + 3));
      var ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      var perp = ang + Math.PI / 2;
      var off = 7 * side;
      var sx = pp.x + Math.cos(perp) * off, sy = pp.y + Math.sin(perp) * off;
      var g = pawGroup('thread-stamp');
      g.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ') rotate(' + (ang * 180 / Math.PI + 90).toFixed(1) + ') scale(0.7)');
      stampGroup.appendChild(g);
      stamps.push({ len: sl, el: g });
      side *= -1;
    }

    draw(true);
  }

  /* ---------- draw on scroll ---------- */
  function lenForY(targetY) {
    if (!samples.length) return 0;
    if (targetY <= samples[0].y) return 0;
    if (targetY >= samples[samples.length - 1].y) return L;
    for (var i = 1; i < samples.length; i++) {
      if (samples[i].y >= targetY) {
        var a = samples[i - 1], b = samples[i];
        var t = (targetY - a.y) / (b.y - a.y || 1);
        return a.len + (b.len - a.len) * t;
      }
    }
    return L;
  }

  function draw(initial) {
    if (!L) return;
    var vh = window.innerHeight;
    var drawn;
    if (reduce) {
      drawn = L;
    } else {
      var targetY = window.scrollY + vh * 0.62;
      drawn = Math.max(0, Math.min(L, lenForY(targetY)));
    }
    basePath.style.strokeDashoffset = (L - drawn);

    // paw position + heading
    var p = basePath.getPointAtLength(drawn);
    var pa = basePath.getPointAtLength(Math.max(0, drawn - 4));
    var pb = basePath.getPointAtLength(Math.min(L, drawn + 4));
    var ang = Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI + 90;
    paw.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    // hide the paw when finished or under reduced motion
    paw.style.opacity = (reduce || drawn >= L - 1 || drawn <= 1) ? '0' : '1';

    for (var i = 0; i < stamps.length; i++) {
      if (drawn >= stamps[i].len) stamps[i].el.classList.add('on');
      else stamps[i].el.classList.remove('on');
    }
  }

  /* ---------- wiring ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { draw(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(build, 180); }
  window.addEventListener('resize', onResize, { passive: true });

  // build now + after late layout shifts (image-slots, fonts)
  build();
  window.addEventListener('load', build);
  [350, 1200, 2600].forEach(function (t) { setTimeout(build, t); });
  // image-slot fills change height
  document.addEventListener('image-slot:filled', build);
})();
