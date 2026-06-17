/* 행복펫 — shared header / drawer / footer (injected on every page).
   Set <body data-page="..."> to highlight the active nav item.
   Keys: about · services · team · booking · health · reviews · location */
(function () {
  var HOME = '행복펫 동물 메디컬센터.html';
  var NAV = [
    { k: 'about',    label: '병원소개',  href: '병원소개.html' },
    { k: 'services', label: '진료안내',  href: '진료안내.html' },
    { k: 'team',     label: '의료진',    href: '의료진.html' },
    { k: 'booking',  label: '예약',      href: '예약.html' },
    { k: 'health',   label: '건강정보',  href: '건강정보.html' },
    { k: 'reviews',  label: '후기',      href: '후기.html' },
    { k: 'location', label: '오시는길',  href: '오시는길.html' }
  ];
  var active = document.body.getAttribute('data-page') || '';
  var PAW = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="9" r="2.1"/><circle cx="12" cy="6.4" r="2.3"/><circle cx="18" cy="9" r="2.1"/><path d="M12 11.2c-3 0-5.2 2.1-5.2 4.5 0 1.9 1.6 2.8 3.2 2.8.9 0 1.4-.4 2-.4s1.1.4 2 .4c1.6 0 3.2-.9 3.2-2.8 0-2.4-2.2-4.5-5.2-4.5Z"/></svg>';
  var ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var brand = '<a href="' + HOME + '" class="brand" aria-label="행복펫 동물 메디컬센터">' +
    '<span class="mark">' + PAW + '</span>' +
    '<span class="txt"><b>행복펫</b><span>Animal Medical</span></span></a>';

  var navLinks = NAV.map(function (n) {
    return '<a href="' + n.href + '"' + (n.k === active ? ' class="active"' : '') + '>' + n.label + '</a>';
  }).join('');

  var header = '<header class="site-header"><div class="bar">' + brand +
    '<nav class="nav">' + navLinks + '</nav>' +
    '<div class="header-cta">' +
      '<div class="mode-switch"></div><div class="theme-switch"></div>' +
      '<a href="예약.html" class="btn btn--primary btn--sm">예약하기 ' + ARR + '</a>' +
      '<button class="menu-btn" aria-label="메뉴"><span></span></button>' +
    '</div></div></header>';

  var drawerLinks = NAV.map(function (n) {
    return '<a href="' + n.href + '">' + n.label + '</a>';
  }).join('');
  var drawer = '<div class="drawer">' + drawerLinks +
    '<a href="예약.html" class="btn btn--primary">예약하기</a></div>';

  var footer = '<footer class="site-footer"><div class="wrap">' +
    '<div class="footer-grid">' +
      '<div class="footer-brand">' + brand.replace('class="brand"', 'class="brand"') +
        '<p>강아지부터 햄스터까지, 작은 가족의 평생 건강을 함께 돌보는 동물 메디컬센터입니다.</p></div>' +
      '<div class="footer-col"><h4>병원</h4><ul>' +
        '<li><a href="병원소개.html">병원소개</a></li><li><a href="의료진.html">의료진</a></li>' +
        '<li><a href="후기.html">고객 후기</a></li><li><a href="오시는길.html">오시는 길</a></li></ul></div>' +
      '<div class="footer-col"><h4>진료</h4><ul>' +
        '<li><a href="진료안내.html">진료 안내</a></li><li><a href="건강정보.html">건강 정보</a></li>' +
        '<li><a href="예약.html">진료 예약</a></li><li><a href="진료안내.html">24시간 응급</a></li></ul></div>' +
      '<div class="footer-col"><h4>연락처</h4><ul>' +
        '<li>02-1234-5678</li><li>care@happypet.kr</li><li>서울 강남구 행복로 24</li><li>평일 09–21시 / 응급 24h</li></ul></div>' +
    '</div>' +
    '<div class="footer-bottom"><span>© 2026 행복펫 동물 메디컬센터. All rights reserved.</span>' +
    '<span>사업자등록번호 123-45-67890 · 대표 이수현</span></div>' +
  '</div></footer>';

  document.body.insertAdjacentHTML('afterbegin', header + drawer);
  document.body.insertAdjacentHTML('beforeend', footer);
})();
