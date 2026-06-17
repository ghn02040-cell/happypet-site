/* 행복펫 — palette switcher (shared across all pages) */
(function () {
  var THEMES = [
    { key: 'green',    name: '세이지',   c1: '#3C9079', c2: '#F2876B' },
    { key: 'sunset',   name: '피치',     c1: '#CE7551', c2: '#3FA08D' },
    { key: 'ocean',    name: '스카이',     c1: '#4E81C6', c2: '#EC8AA6' },
    { key: 'lavender', name: '라일락',   c1: '#9B86D6', c2: '#EE9BB9' },
    { key: 'mango',    name: '민트',     c1: '#3AA199', c2: '#F0A05D' },
    { key: 'cherry',   name: '로즈', c1: '#DB81A8', c2: '#F0997D' }
  ];
  var KEY = 'happypet-theme';
  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') || 'green';
  }
  function apply(key) {
    root.setAttribute('data-theme', key);
    try { localStorage.setItem(KEY, key); } catch (e) {}
    render();
  }

  var sw = document.querySelector('.theme-switch');
  if (!sw) return;

  // build markup
  var btn = document.createElement('button');
  btn.className = 'theme-btn';
  btn.setAttribute('aria-label', '컬러 테마 선택');
  btn.innerHTML = '<span class="sw"></span>';

  var pop = document.createElement('div');
  pop.className = 'theme-pop';
  var grid = '<h5>컬러 팔레트</h5><div class="theme-grid">';
  THEMES.forEach(function (t) {
    grid += '<button class="theme-opt" data-key="' + t.key + '" style="--c1:' + t.c1 + ';--c2:' + t.c2 + '">' +
            '<span class="pair"></span><span class="nm">' + t.name + '</span></button>';
  });
  grid += '</div>';
  pop.innerHTML = grid;

  sw.appendChild(btn);
  sw.appendChild(pop);

  function render() {
    var c = current();
    pop.querySelectorAll('.theme-opt').forEach(function (o) {
      o.classList.toggle('active', o.dataset.key === c);
    });
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    pop.classList.toggle('open');
  });
  pop.addEventListener('click', function (e) {
    var opt = e.target.closest('.theme-opt');
    if (!opt) return;
    apply(opt.dataset.key);
    setTimeout(function () { pop.classList.remove('open'); }, 120);
  });
  document.addEventListener('click', function (e) {
    if (!sw.contains(e.target)) pop.classList.remove('open');
  });

  render();
})();

/* ---- dark / light mode toggle ---- */
(function () {
  var KEY = 'happypet-mode';
  var root = document.documentElement;
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A8.5 8.5 0 1111.2 3a6.8 6.8 0 109.8 9.8z"/></svg>';

  var shell = document.querySelector('.mode-switch');
  if (!shell) return;
  var btn = document.createElement('button');
  btn.className = 'mode-btn';
  shell.appendChild(btn);

  function isDark() { return root.getAttribute('data-mode') === 'dark'; }
  function render() {
    btn.innerHTML = isDark() ? SUN : MOON;
    btn.setAttribute('aria-label', isDark() ? '라이트모드 전환' : '다크모드 전환');
  }
  btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-mode', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    render();
  });
  render();
})();
