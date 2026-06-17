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

  var L = 0, W = 0, H = 0;
  // 스크롤 진행도(0~1) → 경로 길이 비율 직접 매핑
  var scrollStart = 0, scrollEnd = 0;

  function docHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  }

  function buildPath(W, H) {
    var sections = [
      ['.hero', 0.7],
      ['#about', 0.5],
      ['#services', 0.5],
      ['#doctors', 0.5],
      ['#tips', 0.5],
      ['#location', 0.4]
    ];

    var anchors = [];
    sections.forEach(function(s) {
      var el = document.querySelector(s[0]);
      if (!el) return;
      var r = el.getBoundingClientRect();
      anchors.push({ y: r.top + window.scrollY + r.height * s[1] });
    });

    if (anchors.length < 2) return null;

    // 스크롤 범위 저장
    scrollStart = anchors[0].y - window.innerHeight * 0.5;
    scrollEnd = anchors[anchors.length - 1].y - window.innerHeight * 0.4;

    var marginL = W * 0.08;
    var marginR = W * 0.88;
    var side = 1;

    var startX = marginR;
    var startY = anchors[0].y - 60;
    var d = 'M ' + startX.toFixed(1) + ' ' + startY.toFixed(1);

    for (var i = 0; i < anchors.length - 1; i++) {
      var ya = anchors[i].y;
      var yb = anchors[i + 1].y;
      var dy = yb - ya;
      var ax = side > 0 ? marginR : marginL;
      var bx = side > 0 ? marginL : marginR;
      var loopY = ya + dy * 0.3;
      var loopSize = Math.min(65, dy * 0.13);
      var loopDir = side > 0 ? -1 : 1;

      d += ' C ' + ax.toFixed(1) + ' ' + (ya + dy * 0.05).toFixed(1) + ' ' +
           ax.toFixed(1) + ' ' + (loopY - loopSize * 1.8).toFixed(1) + ' ' +
           ax.toFixed(1) + ' ' + loopY.toFixed(1);

      d += ' C ' +
           (ax + loopDir * loopSize * 2.2).toFixed(1) + ' ' + (loopY + loopSize * 0.6).toFixed(1) + ' ' +
           (ax + loopDir * loopSize * 2.2).toFixed(1) + ' ' + (loopY - loopSize * 1.6).toFixed(1) + ' ' +
           ax.toFixed(1) + ' ' + (loopY - loopSize * 0.4).toFixed(1);

      d += ' C ' +
           (ax + loopDir * loopSize * 0.5).toFixed(1) + ' ' + (loopY + loopSize).toFixed(1) + ' ' +
           bx.toFixed(1) + ' ' + (yb - dy * 0.15).toFixed(1) + ' ' +
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

    basePath.style.stroke = 'var(--primary)';
    basePath.style.strokeWidth = '2';
    basePath.style.opacity = '0.7';

    var d = buildPath(W, H);
    if (!d) return;

    basePath.setAttribute('d', d);
    L = basePath.getTotalLength();
    basePath.style.strokeDasharray = L;
    basePath.style.strokeDashoffset = L; // 처음엔 완전히 숨김

    draw();
  }

  function draw() {
    if (!L) return;
    var drawn;
    if (reduce) {
      drawn = L;
    } else {
      var scrollY = window.scrollY;
      var range = scrollEnd - scrollStart;
      if (range <= 0) { drawn = 0; }
      else {
        var progress = (scrollY - scrollStart) / range;
        progress = Math.max(0, Math.min(1, progress));
        drawn = L * progress;
      }
    }
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
