/* 행복펫 상담봇 — floating AI chat widget (injected on every page).
   Uses window.claude.complete for answers, falls back gracefully offline.
   Persists conversation in localStorage. Styled with site design tokens. */
(function () {
  if (window.__hpcLoaded) return;
  window.__hpcLoaded = true;

  var HOME = '행복펫 동물 메디컬센터.html';
  var STORE = 'happypet-chat-v1';
  var OPEN_KEY = 'happypet-chat-open';

  var KNOWLEDGE = [
    '병원명: 행복펫 동물 메디컬센터',
    '대표원장: 이수현 수의사 (내과)',
    '의료진: 이수현(대표원장·내과), 이서연(외과), 박하늘(특수동물), 정민재(영상의학)',
    '진료시간: 월–금 09:00–21:00 / 토·일·공휴일 10:00–18:00 / 점심시간 13:00–14:00 / 응급진료는 연중무휴 24시간',
    '위치: 서울 강남구 행복로 24, 행복역 3번 출구 도보 3분, 주차 가능',
    '전화: 02-1234-5678, 이메일: care@happypet.kr',
    '진료과목 및 시작 비용(상담 포함, 항목별 상이): 내과 3만원~, 외과 수술 15만원~, 치과(스케일링·발치) 8만원~(마취 별도), 영상의학·정밀검사(X-ray·초음파·CT) 5만원~, 예방접종·건강검진 2만원~, 특수동물 진료 3만원~',
    '특수동물: 햄스터·토끼·기니피그·고슴도치 등 전용 진료실에서 전문 수의사가 진료',
    '예약 방법: 홈페이지 예약 페이지에서 온라인 예약 또는 전화(02-1234-5678) 예약. 응급은 예약 없이 바로 전화.',
    '진료 절차: 1)예약·접수 2)진단·검사 3)치료·처치 4)사후관리'
  ].join('\n');

  var SYSTEM = [
    '너는 "행복펫 동물 메디컬센터"의 친근하면서도 전문적인 안내 도우미 "행복펫 상담봇"이야.',
    '아래 병원 정보를 바탕으로 보호자의 질문에 한국어로 답해.',
    '',
    '[병원 정보]',
    KNOWLEDGE,
    '',
    '[답변 규칙]',
    '- 따뜻하고 다정하지만 전문적인 말투. 보호자를 안심시키되 과장하지 마.',
    '- 답변은 보통 2~4문장으로 간결하게. 필요하면 짧은 목록을 써도 좋아.',
    '- 병원 정보(시간·위치·비용·예약 등)는 위 자료를 정확히 사용해. 모르면 모른다고 하고 02-1234-5678로 문의를 안내해.',
    '- 반려동물 건강/증상 질문에는 일반적인 관리 팁과 가능한 원인을 알려주되, 답변 끝에 "정확한 진단은 수의사의 직접 진료가 필요해요"라는 취지의 한 문장을 자연스럽게 덧붙여.',
    '- 응급 의심 증상(호흡곤란, 경련, 중독, 심한 출혈, 의식 저하 등)이면 즉시 24시간 응급 진료(02-1234-5678)로 전화하라고 우선 안내해.',
    '- 예약을 원하거나 예약 방법을 물으면 온라인 예약 페이지와 전화 예약을 함께 알려줘.',
    '- 이모지는 거의 쓰지 마(꼭 필요할 때 하나 정도만). 마크다운 기호(**, # 등)는 쓰지 마.'
  ].join('\n');

  var GREETING = '안녕하세요! 행복펫 상담봇이에요 🐾\n진료 시간, 예약, 반려동물 건강까지 무엇이든 편하게 물어보세요.';

  var SUGGESTIONS = [
    '진료 시간이 어떻게 되나요?',
    '예약은 어떻게 하나요?',
    '주차할 수 있나요?',
    '강아지가 자꾸 토해요',
    '햄스터도 진료하나요?'
  ];

  var PAW = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="9" r="2.1"/><circle cx="12" cy="6.4" r="2.3"/><circle cx="18" cy="9" r="2.1"/><path d="M12 11.2c-3 0-5.2 2.1-5.2 4.5 0 1.9 1.6 2.8 3.2 2.8.9 0 1.4-.4 2-.4s1.1.4 2 .4c1.6 0 3.2-.9 3.2-2.8 0-2.4-2.2-4.5-5.2-4.5Z"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4"/></svg>';

  var CHARACTER_IMG = '<img src="업로드/chatbot-character.jpg" alt="상담봇" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
  var CHARACTER_SMALL = '<img src="chatbot-character.png" alt="상담봇" style="width:100%;height:100%;object-fit:cover;border-radius:9px;">';

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
        '<span class="av">' + CHARACTER_SMALL + '</span>' +
        '<div class="t"><b>행복펫 상담봇</b><span>보통 1분 이내 응답 · AI 안내</span></div>' +
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
      '<img class="char-img" src="chatbot-character.png" alt="상담봇">' +
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
  var busy = false;

  function save() { try { localStorage.setItem(STORE, JSON.stringify(history.slice(-40))); } catch (e) {} }
  function seen() { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(OPEN_KEY, '1'); } catch (e) {} root.classList.add('seen'); }
  if (seen()) root.classList.add('seen');

  function scrollDown() { bodyEl.scrollTop = bodyEl.scrollHeight; }

  function addMsg(role, text) {
    var wrap = document.createElement('div');
    wrap.className = 'hpc-msg ' + (role === 'user' ? 'me' : 'bot');
    var inner = '';
    if (role !== 'user') inner += '<span class="ava"><img src="chatbot-character.png" alt="상담봇" style="width:100%;height:100%;object-fit:cover;border-radius:9px;"></span>';
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
        if (busy) return;
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
    wrap.id = 'hpc-typing-row';
    wrap.innerHTML = '<span class="ava"><img src="chatbot-character.png" alt="상담봇" style="width:100%;height:100%;object-fit:cover;border-radius:9px;"></span><div class="bub" style="padding:0"><div class="hpc-typing"><i></i><i></i><i></i></div></div>';
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

  function buildMessages() {
    var msgs = [
      { role: 'user', content: SYSTEM + '\n\n이 안내에 따라 보호자를 도와줘. 준비되면 "네"라고만 답해.' },
      { role: 'assistant', content: '네, 행복펫 상담봇으로서 따뜻하고 정확하게 안내해 드릴게요.' }
    ];
    history.slice(-12).forEach(function (m) { msgs.push({ role: m.role, content: m.content }); });
    return msgs;
  }

  function fallback() {
    return '죄송해요, 지금 답변을 불러오지 못했어요. 잠시 후 다시 시도하시거나, 급하시면 02-1234-5678로 전화 주세요. 진료시간은 평일 09–21시, 주말·공휴일 10–18시예요.';
  }

  async function send(raw) {
    var msg = (raw != null ? raw : textEl.value).trim();
    if (!msg || busy) return;
    busy = true;
    sendBtn.disabled = true;
    textEl.value = '';
    autosize();
    var chips = bodyEl.querySelector('.hpc-chips');
    if (chips) chips.remove();

    addMsg('user', msg);
    history.push({ role: 'user', content: msg });
    save();

    var typing = showTyping();
    var reply;
    try {
      if (window.claude && typeof window.claude.complete === 'function') {
        reply = await window.claude.complete({ messages: buildMessages() });
      }
    } catch (e) { reply = null; }
    if (!reply || !String(reply).trim()) reply = fallback();
    reply = String(reply).trim();

    typing.remove();
    addMsg('assistant', reply);
    history.push({ role: 'assistant', content: reply });
    save();
    busy = false;
    sendBtn.disabled = false;
    textEl.focus();
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
