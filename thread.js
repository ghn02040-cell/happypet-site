/* 행복펫 — 실타래 scroll animation. 메리츠화재 스타일.
   스크롤 내리면 실이 루프를 만들며 풀려나오고 올리면 다시 감긴다. */
(function () {
  if (window.__threadLoaded) return;
  window.__threadLoaded = true;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = `
  #thread-layer{ position:absolute; left:0; top:0; width:100%; pointer-events:none; z-index:40; overflow:visible; }
  #thread-layer svg{ position:absolute; left:0; top:0; overflow:visible; }
  .thread-base{ fill:none; stroke-linecap:round; stroke-linejoin:round; }
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

  var L = 0, samples = [], W = 0, H = 0;

  function docHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  }

  // 메리츠화재 스타일 경로 생성
  // 오른쪽에서 시작해서 왼쪽으로 구불구불 내려가며 루프를 만드는 경로
  function buildPath(W, H) {
    var pts = [];
    var sections = [
      ['.hero', 0.7],
      ['#about', 0.5],
      ['#services', 0.5],
      ['#doctors', 0.5],
      ['#tips', 0.5],
      ['#location', 0.4]
    ];

    var validSections = [];
    sections.forEach(function(s) {
      var el = document.querySelector(s[0]);
      if (!el) return;
      var r = el.getBoundingClientRect();
      validSections.push({
        y: r.top + window.scrollY + r.height * s[1]
      });
    });

    if (validSections.length < 2) return null;

    // 시작점: 오른쪽 상단
    var startX = W * 0.85;
    var startY = validSections[0].y - 100;

    var d = 'M ' + startX.toFixed(1) + ' ' + startY.toFixed(1);

    var side = 1; // 1 = 오른쪽, -1 = 왼쪽
    var marginL = W * 0.08;
    var marginR = W * 0.92;

    for (var i = 0; i < validSections.length - 1; i++) {
      var ya = validSections[i].y;
      var yb = validSections[i + 1].y;
      var dy = yb - ya;

      var ax = side > 0 ? marginR : marginL;
      var bx = side > 0 ? marginL : marginR;

      // 루프 위치
      var loopY = ya + dy * 0.3;
      var loopSize = Math.min(70, dy * 0.15);

      // 루프를 향한 커브
      d += ' C ' +
        ax.toFixed(1) + ' ' + (ya + dy * 0.1).toFixed(1) + ' ' +
        ax.toFixed(1) + ' ' + (loopY - loopSize * 1.5).toFixed(1) + ' ' +
        ax.toFixed(1) + ' ' + loopY.toFixed(1);

      // 루프 (작은 원형 고리)
      var loopDir = side > 0 ? -1 : 1;
      d += ' C ' +
        (ax + loopDir * loopSize * 2).toFixed(1) + ' ' + (loopY + loopSize * 0.5).toFixed(1) + ' ' +
        (ax + loopDir * loopSize * 2).toFixed(1) + ' ' + (loopY - loopSize * 1.5).toFixed(1) + ' ' +
        ax.toFixed(1) + ' ' + (loopY - loopSize * 0.5).toFixed(1);

      // 루프에서 다음 섹션으로 S커브
      d += ' C ' +
        (ax + loopDir * loopSize).toFixed(1) + ' ' + (loopY + loopSize).toFixed(1) + ' ' +
        bx.toFixed(1) + ' ' + (yb - dy * 0.2).toFixed(1) + ' ' +
        bx.toFixed(1) + ' ' + yb.toFixed(1);

      side *= -1;
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

    var lineW = Math.max(1.5, Math.min(W * 0.003, 3));
    basePath.style.stroke = 'var(--primary)';
    basePath.style.strokeWidth = lineW;
    basePath.style.opacity = '0.65';

    var d = buildPath(W, H);
    if (!d) return;

    basePath.setAttribute('d', d);
    L = basePath.getTotalLength();
    basePath.style.strokeDasharray = L;

    // y → length 샘플링
    samples = [];
    for (var k = 0; k <= 500; k++) {
      var len = (k / 500) * L;
      var p = basePath.getPointAtLength(len);
      samples.push({ y: p.y, len: len });
    }

    draw();
  }

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

  function draw() {
    if (!L) return;
    var drawn = reduce ? L : Math.max(0, Math.min(L, lenForY(window.scrollY + window.innerHeight * 0.65)));
    basePath.style.strokeDashoffset = (L - drawn);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { draw(); ticking = false; });
  }, { passive: true });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); }, { passive: true });

  build();
  window.addEventListener('load', build);
  [350, 1200, 2600].forEach(function (t) { setTimeout(build, t); });
  document.addEventListener('image-slot:filled', build);
})();
