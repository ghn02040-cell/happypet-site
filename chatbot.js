/* 행복펫 상담봇 — 키워드 기반 자동 응답 */
(function () {
  if (window.__hpcLoaded) return;
  window.__hpcLoaded = true;

  var STORE = 'happypet-chat-v1';
  var OPEN_KEY = 'happypet-chat-open';

  var GREETING = '안녕하세요! 행복펫 상담봇이에요 🐾\n진료 시간, 예약, 반려동물 건강까지 무엇이든 편하게 물어보세요.';

  var SUGGESTIONS = [
    '진료 시간이 어떻게 되나요?',
    '예약은 어떻게 하나요?',
    '주차할 수 있나요?',
    '강아지가 자꾸 토해요',
    '햄스터도 진료하나요?'
  ];

  // 키워드 → 답변 매핑
  var QA = [
    {
      keys: ['진료 시간', '영업 시간', '몇 시', '운영 시간', '언제'],
      answer: '진료 시간은 평일 09:00~21:00, 토·일·공휴일 10:00~18:00이에요. 점심시간은 13:00~14:00이고, 응급 진료는 연중무휴 24시간 운영합니다.'
    },
    {
      keys: ['예약', '어떻게 해', '신청'],
      answer: '예약은 홈페이지 예약 페이지에서 온라인으로 하시거나, 전화(02-1234-5678)로도 가능해요. 응급 상황은 예약 없이 바로 전화 주세요!'
    },
    {
      keys: ['위치', '주소', '어디', '오시는', '찾아'],
      answer: '서울특별시 강남구 행복로 24에 위치해 있어요. 2호선 행복역 3번 출구에서 도보 3분 거리입니다.'
    },
    {
      keys: ['주차', '차'],
      answer: '네, 주차 가능합니다! 병원 내 주차장을 이용하실 수 있어요.'
    },
    {
      keys: ['햄스터', '토끼', '기니피그', '고슴도치', '특수동물'],
      answer: '네, 햄스터·토끼·기니피그·고슴도치 등 특수동물 전문 진료를 합니다! 전용 진료실에서 특수동물 전문 수의사가 진료해 드려요.'
    },
    {
      keys: ['응급', '긴급', '위급', '위험', '24시간'],
      answer: '응급 진료는 연중무휴 24시간 운영합니다. 응급 상황 시 02-1234-5678로 바로 전화 주세요!'
    },
    {
      keys: ['비용', '가격', '얼마', '요금'],
      answer: '진료 비용은 내과 3만원~, 외과 수술 15만원~, 치과(스케일링·발치) 8만원~, 영상의학 5만원~, 예방접종·건강검진 2만원~, 특수동물 진료 3만원~이에요. 정확한 비용은 진료 후 안내해 드려요.'
    },
    {
      keys: ['의료진', '수의사', '선생님', '원장'],
      answer: '이수현 대표원장(내과), 이서연 진료원장(외과), 박하늘 진료원장(특수동물) 등 전문 수의사들이 진료하고 있어요.'
    },
    {
      keys: ['전화', '번호', '연락'],
      answer: '전화번호는 02-1234-5678이에요. 이메일은 care@happypet.kr로 문의하실 수도 있어요.'
    },
    {
      keys: ['토해', '구토', '설사', '기침', '안먹', '식욕'],
      answer: '반려동물이 구토나 설사를 자주 한다면 소화기 문제나 다른 질환의 신호일 수 있어요. 증상이 지속된다면 빠른 진료를 권장드려요. 정확한 진단은 수의사의 직접 진료가 필요해요.'
    },
    {
      keys: ['예방접종', '백신', '접종'],
      answer: '생애주기별 예방접종 및 정기 건강검진을 진행하고 있어요. 예방접종 비용은 2만원~이며, 자세한 내용은 전화(02-1234-5678)로 문의해 주세요.'
    },
    {
      keys: ['스케일링', '치과', '이빨', '치아'],
      answer: '치과 진료(스케일링, 발치, 구강 검진)도 진행하고 있어요. 비용은 8만원~(마취 별도)이에요.'
    },
    {
      keys: ['엑스레이', 'x-ray', '초음파', 'ct', '검사'],
      answer: 'X-ray, 초음파, CT 등 영상의학 검사를 통해 정밀 진단이 가능해요. 비용은 5만원~이에요.'
    }
  ];

  function getAnswer(msg) {
    msg = msg.toLowerCase();
    for (var i = 0; i < QA.length; i++) {
      for (var j = 0; j < QA[i].keys.length; j++) {
        if (msg.indexOf(QA[i].keys[j]) !== -1) {
          return QA[i].answer;
        }
      }
    }
    return '죄송해요, 잘 모르겠어요. 자세한 문의는 02-1234-5678로 전화 주시거나 care@happypet.kr로 이메일 주세요. 평일 09~21시, 주말 10~18시에 친절하게 안내해 드릴게요!';
  }

  var PAW = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="9" r="2.1"/><circle cx="12" cy="6.4" r="2.3"/><circle cx="18" cy="9" r="2.1"/><path d="M12 11.2c-3 0-5.2 2.1-5.2 4.5 0 1.9 1.6 2.8 3.2 2.8.9 0 1.4-.4 2-.4s1.1.4 2 .4c1.6 0 3.2-.9 3.2-2.8 0-2.4-2.2-4.5-5.2-4.5Z"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4"/></svg>';

  var css = `
  #hpc-root{ position:fixed; z-index:2147483000; right:max(20px, env(safe-area-inset-right)); bottom:max(20px, env(safe-area-inset-bottom)); font-family:var(--sans, system-ui, sans-serif); }
  #hpc-launch{ position:relative; width:68px; height:68px; border-radius:50%; display:grid; place-items:center;
    background:transparent; border:3px solid var(--surface,#fff);
    box-shadow:0 0 0 1.5px rgba(60,144,121,.35), 0 14px 34px -10px rgba(60,144,121,.5), 0 4px 12px rgba(0,0,0,.16);
    overflow:hidden; padding:0;
    animation: hpc-boing 2s ease-in-out infinite;
    transition:transform .25s cubic-bezier(.2,.7,.3,1); }
  #hpc-launch:hover{ animation: none; transform:translateY(-4px) scale(1.08); }
  #hpc-launch:active{ transform:scale(.94); }
  @keyframes hpc-boing{
    0%   { transform: translateY(0) scale(1,1); }
    10%  { transform: translateY(0) scale(1.08, 0.92); }
    25%  { transform: translateY(-18px) scale(0.94, 1.06); }
    50%  { transform: translateY(0) scale(1.06, 0.94); }
    60%  { transform: translateY(-8px) scale(0.97, 1.03); }
    75%  { transform: translateY(0) scale(1.02, 0.98); }
    85%  { transform: translateY(-3px) scale(1,1); }
    100% { transform: translateY(0) scale(1,1); }
  }
  #hpc-launch .char-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  #hpc-launch .ic-close{ position:absolute; inset:0; display:grid; place-items:center; background:rgba(15,110,92,.88); color:#fff; opacity:0; transition:opacity .2s; border-radius:50%; }
  #hpc-launch .ic-close svg{ width:26px; height:26px; }
  #hpc-root.open #hpc-launch .ic-close{ opacity:1; }
  #hpc-root.open #hpc-launch{ animation:none; }
  #hpc-launch::after{ content:""; position:absolute; right:-3px; bottom:-3px; width:18px; height:18px; border-radius:50%;
    background:var(--amber,#F4B33D); box-shadow:0 0 0 3px var(--bg,#F8F6F0); z-index:2; }
  #hpc-root.open #hpc-launch::after, #hpc-root.seen #hpc-launch::after{ display:none; }
  #hpc-launch .ring{ position:absolute; inset:0; border-radius:50%; box-shadow:0 0 0 0 rgba(60,144,121,.45); animation:hpc-pulse 2.4s ease-out infinite; z-index:-1; }
  #hpc-root.open #hpc-launch .ring, #hpc-root.seen #hpc-launch .ring{ animation:none; }
  @keyframes hpc-pulse{ 0%{box-shadow:0 0 0 0 rgba(60,144,121,.4);} 70%{box-shadow:0 0 0 16px rgba(60,144,121,0);} 100%{box-shadow:0 0 0 0 rgba(60,144,121,0);} }
  #hpc-panel{ position:absolute; right:0; bottom:84px; width:380px; max-width:calc(100vw - 32px); height:560px; max-height:calc(100vh - 120px);
    background:var(--surface,#fff); border-radius:24px; overflow:hidden; display:flex; flex-direction:column;
    box-shadow:0 40px 80px -28px rgba(10,74,62,.4), 0 12px 30px -12px rgba(0,0,0,.2), inset 0 0 0 1px var(--line,rgba(22,35,31,.1));
    transform-origin:bottom right; opacity:0; transform:translateY(14px) scale(.96); pointer-events:none; visibility:hidden;
    transition:transform .26s cubic-bezier(.2,.7,.3,1), visibility 0s linear .26s; }
  #hpc-root.open #hpc-panel{ opacity:1; transform:none; pointer-events:auto; visibility:visible; transition:transform .26s cubic-bezier(.2,.7,.3,1); }
  .hpc-head{ display:flex; align-items:center; gap:12px; padding:16px 16px 14px; background:var(--primary,#0F6E5C); color:#fff; position:relative; }
  .hpc-head .av{ width:42px; height:42px; border-radius:13px; flex:none; overflow:hidden; position:relative; }
  .hpc-head .av::after{ content:""; position:absolute; right:-2px; bottom:-2px; width:13px; height:13px; border-radius:50%; background:#43D6A0; box-shadow:0 0 0 2.5px var(--primary,#0F6E5C); z-index:1; }
  .hpc-head .t b{ display:block; font-size:16px; font-weight:800; letter-spacing:-.02em; }
  .hpc-head .t span{ font-size:12.5px; color:rgba(255,255,255,.82); }
  .hpc-head .acts{ margin-left:auto; display:flex; gap:4px; }
  .hpc-head button{ width:34px; height:34px; border-radius:10px; display:grid; place-items:center; color:#fff; background:transparent; transition:background .2s; }
  .hpc-head button:hover{ background:rgba(255,255,255,.16); }
  .hpc-head button svg{ width:18px; height:18px; }
  .hpc-body{ flex:1; overflow-y:auto; padding:18px 16px 8px; background:var(--paper,#FCFBF7); display:flex; flex-direction:column; gap:12px; scroll-behavior:smooth; }
  .hpc-body::-webkit-scrollbar{ width:8px; } .hpc-body::-webkit-scrollbar-thumb{ background:var(--line-strong,rgba(22,35,31,.18)); border-radius:8px; }
  .hpc-msg{ display:flex; gap:9px; align-items:flex-end; max-width:88%; animation:hpc-in .3s cubic-bezier(.2,.7,.3,1); }
  @keyframes hpc-in{ from{opacity:0; transform:translateY(8px);} }
  .hpc-msg .ava{ width:30px; height:30px; border-radius:9px; flex:none; overflow:hidden; }
  .hpc-msg .bub{ padding:11px 14px; border-radius:16px; font-size:14.5px; line-height:1.55; white-space:pre-wrap; word-break:break-word; }
  .hpc-msg.bot .bub{ background:var(--surface,#fff); color:var(--ink,#16231F); border-bottom-left-radius:5px; box-shadow:var(--shadow-s,0 2px 8px rgba(22,35,31,.06)); }
  .hpc-msg.me{ margin-left:auto; flex-direction:row-reverse; }
  .hpc-msg.me .bub{ background:var(--primary,#0F6E5C); color:#fff; border-bottom-right-radius:5px; }
  .hpc-typing{ display:flex; gap:4px; padding:13px 15px; }
  .hpc-typing i{ width:7px; height:7px; border-radius:50%; background:var(--ink-faint,#8A968F); animation:hpc-bounce 1.2s infinite; }
  .hpc-typing i:nth-child(2){ animation-delay:.15s; } .hpc-typing i:nth-child(3){ animation-delay:.3s; }
  @keyframes hpc-bounce{ 0%,60%,100%{transform:translateY(0); opacity:.5;} 30%{transform:translateY(-5px); opacity:1;} }
  .hpc-chips{ display:flex; flex-wrap:wrap; gap:7px; padding:2px 2px 10px; }
  .hpc-chip{ font-size:13px; font-weight:600; color:var(--primary-deep,#0A4A3E); background:var(--primary-tint,#E5F1EC);
    padding:8px 13px; border-radius:999px; transition:background .18s, transform .18s; box-shadow:inset 0 0 0 1px rgba(15,110,92,.12); }
  .hpc-chip:hover{ background:var(--primary-tint-2,#D2E8E0); transform:translateY(-1px); }
  .hpc-foot{ padding:10px 12px 12px; background:var(--surface,#fff); border-top:1px solid var(--line,rgba(22,35,31,.1)); }
  .hpc-quick{ display:flex; gap:7px; margin-bottom:9px; }
  .hpc-quick a{ flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:13px; font-weight:700;
    padding:9px 10px; border-radius:11px; transition:transform .18s, background .2s; }
  .hpc-quick .q-book{ background:var(--accent,#FF7A4D); color:#fff; }
  .hpc-quick .q-book:hover{ background:var(--accent-deep,#E85B2C); transform:translateY(-1px); }
  .hpc-quick .q-call{ background:var(--primary-tint,#E5F1EC); color:var(--primary-deep,#0A4A3E); }
  .hpc-quick .q-call:hover{ transform:translateY(-1px); }
  .hpc-quick svg{ width:15px; height:15px; }
  .hpc-input{ display:flex; align-items:flex-end; gap:8px; background:var(--bg,#F8F6F0); border-radius:16px; padding:6px 6px 6px 14px; box-shadow:inset 0 0 0 1px var(--line,rgba(22,35,31,.1)); transition:box-shadow .2s; }
  .hpc-input:focus-within{ box-shadow:inset 0 0 0 1.5px var(--primary,#0F6E5C); }
  .hpc-input textarea{ flex:1; border:none; background:transparent; resize:none; font-family:inherit; font-size:14.5px; color:var(--ink,#16231F); line-height:1.5; max-height:96px; padding:8px 0; outline:none; }
  .hpc-input textarea::placeholder{ color:var(--ink-faint,#8A968F); }
  .hpc-send{ width:40px; height:40px; flex:none; border-radius:12px; display:grid; place-items:center; background:var(--primary,#0F6E5C); color:#fff; transition:background .2s, transform .15s, opacity .2s; }
  .hpc-send:hover{ background:var(--primary-deep,#0A4A3E); } .hpc-send:active{ transform:scale(.92); }
  .hpc-send:disabled{ opacity:.4; cursor:default; }
  .hpc-disc{ text-align:center; font-size:11px; color:var(--ink-faint,#8A968F); margin-top:8px; line-height:1.4; }
  @media (max-width:520px){
    #hpc-panel{ width:calc(100vw - 24px); height:calc(100vh - 100px); bottom:76px; }
    #hpc-root{ right:14px; bottom:14px; }
  }`;

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var root = document.createElement('div');
  root.id = 'hpc-root';
  root.innerHTML =
    '<div id="hpc-panel" role="dialog" aria-label="행복펫 상담봇">' +
      '<div class="hpc-head">' +
        '<span class="av"><img src="chatbot-character.jpg" alt="상담봇" style="width:100%;height:100%;object-fit:cover;border-radius:9px;"></span>' +
        '<div class="t"><b>행복펫 상담봇</b><span>무엇이든 편하게 물어보세요</span></div>' +
        '<div class="acts">' +
          '<button class="hpc-reset" aria-label="대화 초기화" title="대화 초기화">' + RESET + '</button>' +
          '<button class="hpc-close" aria-label="닫기" title="닫기">' + CLOSE + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="hpc-body" id="hpc-body"></div>' +
      '<div class="hpc-foot">' +
        '<div class="hpc-quick">' +
          '<a class="q-book" href="예약.html">' + PAW + ' 예약하기</a>' +
          '<a class="q-call" href="tel:0212345678">📞 02-1234-5678</a>' +
        '</div>' +
        '<div class="hpc-input">' +
          '<textarea id="hpc-text" rows="1" placeholder="메시지를 입력하세요…" aria-label="메시지 입력"></textarea>' +
          '<button class="hpc-send" id="hpc-send" aria-label="보내기">' + SEND + '</button>' +
        '</div>' +
        '<div class="hpc-disc">건강 상담은 참고용이며 실제 진료를 대신하지 않아요.</div>' +
      '</div>' +
    '</div>' +
    '<button id="hpc-launch" aria-label="상담봇 열기">' +
      '<span class="ring"></span>' +
      '<img class="char-img" src="chatbot-character.jpg" alt="상담봇">' +
      '<span class="ic-close">' + CLOSE + '</span>' +
    '</button>';
  document.body.appendChild(root);

  var bodyEl = root.querySelector('#hpc-body');
  var textEl = root.querySelector('#hpc-text');
  var sendBtn = root.querySelector('#hpc-send');
  var launch = root.querySelector('#hpc-launch');

  var history = [];
  try { history = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { history = []; }
  if (!Array.isArray(history)) history = [];

  function save() { try { localStorage.setItem(STORE, JSON.stringify(history.slice(-40))); } catch (e) {} }
  function seen() { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(OPEN_KEY, '1'); } catch (e) {} root.classList.add('seen'); }
  if (seen()) root.classList.add('seen');

  function scrollDown() { bodyEl.scrollTop = bodyEl.scrollHeight; }

  function addMsg(role, text) {
    var wrap = document.createElement('div');
    wrap.className = 'hpc-msg ' + (role === 'user' ? 'me' : 'bot');
    var inner = '';
    if (role !== 'user') inner += '<span class="ava"><img src="chatbot-character.jpg" alt="상담봇" style="width:100%;height:100%;object-fit:cover;border-radius:9px;"></span>';
    inner += '<div class="bub"></div>';
    wrap.innerHTML = inner;
    wrap.querySelector('.bub').textContent = text;
    bodyEl.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  function addChips(list) {
    var box = document.createElement('div');
    box.className = 'hpc-chips';
    list.forEach(function (q) {
      var c = document.createElement('button');
      c.className = 'hpc-chip';
      c.textContent = q;
      c.addEventListener('click', function () {
        box.remove();
        send(q);
      });
      box.appendChild(c);
    });
    bodyEl.appendChild(box);
    scrollDown();
  }

  function showTyping() {
    var wrap = document.createElement('div');
    wrap.className = 'hpc-msg bot';
    wrap.innerHTML = '<span class="ava"><img src="chatbot-character.jpg" alt="상담봇" style="width:100%;height:100%;object-fit:cover;border-radius:9px;"></span><div class="bub" style="padding:0"><div class="hpc-typing"><i></i><i></i><i></i></div></div>';
    bodyEl.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  function renderHistory() {
    bodyEl.innerHTML = '';
    if (!history.length) {
      addMsg('assistant', GREETING);
      addChips(SUGGESTIONS);
    } else {
      history.forEach(function (m) { addMsg(m.role, m.content); });
    }
  }

  function send(raw) {
    var msg = (raw != null ? raw : textEl.value).trim();
    if (!msg) return;
    textEl.value = '';
    autosize();
    var chips = bodyEl.querySelector('.hpc-chips');
    if (chips) chips.remove();

    addMsg('user', msg);
    history.push({ role: 'user', content: msg });
    save();

    var typing = showTyping();
    setTimeout(function() {
      typing.remove();
      var reply = getAnswer(msg);
      addMsg('assistant', reply);
      history.push({ role: 'assistant', content: reply });
      save();
      textEl.focus();
    }, 600);
  }

  function openPanel() {
    root.classList.add('open');
    markSeen();
    setTimeout(function () { textEl.focus(); }, 280);
    scrollDown();
  }
  function closePanel() { root.classList.remove('open'); }
  function toggle() { root.classList.contains('open') ? closePanel() : openPanel(); }

  launch.addEventListener('click', toggle);
  root.querySelector('.hpc-close').addEventListener('click', closePanel);
  root.querySelector('.hpc-reset').addEventListener('click', function () {
    history = []; save(); renderHistory();
  });
  sendBtn.addEventListener('click', function () { send(); });
  textEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  function autosize() { textEl.style.height = 'auto'; textEl.style.height = Math.min(textEl.scrollHeight, 96) + 'px'; }
  textEl.addEventListener('input', autosize);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) closePanel(); });

  renderHistory();
})();
