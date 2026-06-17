/* 행복펫 — 실타래. 스크롤 내리면 실이 풀리고 올리면 감긴다. */
(function () {
  if (window.__threadLoaded) return;
  window.__threadLoaded = true;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var css = '#thread-layer{position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:40;overflow:visible}' +
    '#thread-layer svg{position:absolute;left:0;top:0;overflow:visible}' +
    '@media(max-width:760px){#thread-layer{display:none!important}}';
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

  var path = document.createElementNS(SVGNS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  var L = 0;

  function build() {
    var W = document.documentElement.clientWidth;
    var H = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    layer.style.height = H + 'px';

    path.setAttribute('stroke', 'var(--primary)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('opacity', '0.7');

    var secs = ['.hero','#about','#services','#doctors','#tips','#location'];
    var ys = [];
    secs.forEach(function(sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var r = el.getBoundingClientRect();
      ys.push(r.top + window.scrollY + r.height * 0.5);
    });
    if (ys.length < 2) return;

    var mL = W * 0.1, mR = W * 0.9;
    var d = 'M ' + mR + ' ' + (ys[0] - 80);
    var side = 1;

    for (var i = 0; i < ys.length - 1; i++) {
      var ya = ys[i], yb = ys[i+1];
      var dy = yb - ya;
      var ax = side > 0 ? mR : mL;
      var bx = side > 0 ? mL : mR;
      var ldir = side > 0 ? -1 : 1;
      var ly = ya + dy * 0.35;
      var lr = Math.min(60, dy * 0.12);

      d += ' C ' + ax + ' ' + (ya + dy*0.1) + ' ' + ax + ' ' + (ly - lr*2) + ' ' + ax + ' ' + ly;
      d += ' C ' + (ax + ldir*lr*2.5) + ' ' + (ly + lr*0.8) + ' ' + (ax + ldir*lr*2.5) + ' ' + (ly - lr*1.8) + ' ' + ax + ' ' + (ly - lr*0.3);
      d += ' C ' + (ax + ldir*lr*0.3) + ' ' + (ly + lr) + ' ' + bx + ' ' + (yb - dy*0.1) + ' ' + bx + ' ' + yb;
      side *= -1;
    }

    path.setAttribute('d', d);
    L = path.getTotalLength();
    path.setAttribute('stroke-dasharray', L);
    path.setAttribute('stroke-dashoffset', L);
    draw();
  }

  function draw() {
    if (!L) return;
    var H = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    var vh = window.innerHeight;
    var maxScroll = H - vh;
    if (maxScroll <= 0) return;
    var progress = window.scrollY / maxScroll;
    progress = Math.max(0, Math.min(1, progress));
    path.setAttribute('stroke-dashoffset', L - (L * progress));
  }

  var ticking = false;
  window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() { draw(); ticking = false; });
  }, { passive: true });

  window.addEventListener('resize', function() { setTimeout(build, 200); }, { passive: true });

  build();
  window.addEventListener('load', build);
  [500, 1500, 3000].forEach(function(t) { setTimeout(build, t); });
  document.addEventListener('image-slot:filled', build);
})();
