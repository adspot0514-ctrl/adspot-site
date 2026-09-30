/* ADSPOT / LAWAD — app.js */
var __adspotStart = function(C){
  'use strict';
  // 관리자 페이지에서 저장한 콘텐츠(C)가 있으면 사용, 없으면 기본값(D)
  C = (C && typeof C === 'object') ? C : {};
  var D = window.ADSPOT_DEFAULTS || {};
  var has = function(v){ return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length); };
  var pick = function(v, d){ return has(v) ? v : d; };
  var CC = C.contact || {}, DC = D.contact || {};
  var esc = function(s){ return String(s).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); };
  var nl2br = function(s){ return esc(s).replace(/\n/g, '<br>'); };
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');
  var isPC = function(){ return window.matchMedia('(min-width:1025px)').matches; };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 관리자 콘텐츠: 메인 문구 · 푸터 ---------------- */
  (function(){
    var H = C.hero || {};
    var k = document.querySelector('.hero-kicker'); if(k && has(H.kicker)) k.textContent = H.kicker;
    var l = document.querySelector('.hero-lead'); if(l && has(H.lead)) l.innerHTML = nl2br(H.lead);
    var F = Object.assign({}, D.footer || {}, C.footer || {});
    document.querySelectorAll('[data-c]').forEach(function(el){
      var v = F[el.getAttribute('data-c')]; if(!has(v)) return;
      el.textContent = v;
      if(el.tagName === 'A') el.href = 'tel:' + String(v).replace(/[^0-9+]/g,'');
    });
  })();

  /* ---------------- 관리자 콘텐츠: 문구 · 헤드라인 · 이미지/영상 · 포트폴리오 ---------------- */
  // [ ] 로 감싼 부분은 강조, 줄바꿈은 그대로
  var rich = function(s, cls){ return esc(s).replace(/\[([^\]]+)\]/g, '<em class="' + (cls || 'hl-em') + '">$1</em>').replace(/\n/g, '<br>'); };
  (function(){
    var TX = C.texts || {}, DT = D.texts || {};
    document.querySelectorAll('[data-edit]').forEach(function(el){
      var k = el.getAttribute('data-edit'), v = TX[k];
      if(!has(v) || v === DT[k]) return;                     // 바꾸지 않은 문구는 원래 모양(반응형 줄바꿈) 유지
      el.innerHTML = rich(v, el.getAttribute('data-hl'));
    });
    // 메인 헤드라인 (PC / 모바일)
    var HH = C.heroHeadline || {}, DH = D.heroHeadline || {};
    var buildLines = function(txt){
      return String(txt).split('\n').filter(function(l){ return l.trim(); }).map(function(l){
        return '<span class="hl-line"><span>' + esc(l.trim()).replace(/\[([^\]]+)\]/g, '<span class="hl">$1</span>') + '</span></span>';
      }).join('');
    };
    var plain = function(txt){ return String(txt).replace(/[\[\]]/g, '').replace(/\s*\n\s*/g, ' ').trim(); };
    var pcT = has(HH.headlinePc) && HH.headlinePc !== DH.headlinePc ? HH.headlinePc : null;
    var moT = has(HH.headlineMo) && HH.headlineMo !== DH.headlineMo ? HH.headlineMo : null;
    var ht = document.querySelector('.hero-title');
    if(ht && (pcT || moT)){
      if(pcT) ht.querySelector('.ht-pc').innerHTML = buildLines(pcT);
      if(moT) ht.querySelector('.ht-mo').innerHTML = buildLines(moT);
      ht.setAttribute('aria-label', plain(pcT || moT));
    }
    // 이미지 / 영상 교체
    var MD = C.media || {};
    document.querySelectorAll('[data-media]').forEach(function(el){
      var k = el.getAttribute('data-media'), m = MD[k];
      if(!m || !m.url || (D.media && D.media[k] && D.media[k].url === m.url)) return;
      var node;
      if(m.type === 'video'){
        node = document.createElement('video');
        node.muted = true; node.defaultMuted = true; node.playsInline = true;
        node.setAttribute('muted', ''); node.setAttribute('playsinline', ''); node.preload = 'none';
        if(m.poster) node.poster = m.poster;
        node.src = m.url;
        node.loop = true; node.autoplay = true; node.setAttribute('autoplay', ''); node.setAttribute('loop', ''); node.preload = 'auto';   // 아이폰: 자동 재생 표시가 있어야 보일 때 확실히 재생
      } else {
        node = document.createElement('img'); node.alt = ''; node.src = m.url; node.decoding = 'async';
      }
      node.setAttribute('data-media', k); node.setAttribute('data-custom', '1');
      el.parentNode.replaceChild(node, el);
    });
    // 포트폴리오 로고
    var PF = has(C.portfolio) ? C.portfolio.filter(function(p){ return p && p.url; }) : null;
    if(PF && PF.length && JSON.stringify(PF) !== JSON.stringify(D.portfolio)){
      var li = function(p, hidden){ return '<li><img src="' + esc(p.url) + '" alt="' + (hidden ? '' : esc(p.name || '')) + '" loading="lazy" decoding="async"></li>'; };
      var group = function(list){ return '<ul class="marquee-group">' + list.map(function(p){ return li(p); }).join('') + '</ul><ul class="marquee-group" aria-hidden="true">' + list.map(function(p){ return li(p, true); }).join('') + '</ul>'; };
      var pc = document.querySelector('.marquee-pc');
      if(pc) pc.innerHTML = '<div class="marquee-track">' + group(PF) + '</div>';
      var mo = document.querySelector('.marquee-mo');
      if(mo){
        var half = Math.ceil(PF.length / 2), a = PF.slice(0, half), b = PF.slice(half);
        mo.innerHTML = '<div class="marquee-track">' + group(a) + '</div>' + (b.length ? '<div class="marquee-track is-reverse">' + group(b) + '</div>' : '');
      }
    }
  })();

  /* ---------------- 헤더 / 메뉴 ---------------- */
  var header = document.querySelector('.header');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menu-btn');
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));

  function onScroll(){ header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  function closeMenu(){ nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.setAttribute('aria-label','메뉴 열기'); }
  menuBtn.addEventListener('click', function(){
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });

  // PC에서는 "함께하는 시간", "포트폴리오"가 속한 화면 전체로 이동해 한 화면에 맞춰 보이게 함
  var pcTarget = {};
  var allTarget = { time:'identity' };   // '함께하는 시간'은 1개월 단위 계약 문구부터 보이게
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if(!a) return;
    var id = a.getAttribute('href').slice(1);
    if(!id) return;
    if(a.hasAttribute('data-kakao')) return;
    var targetId = allTarget[id] || ((isPC() && pcTarget[id]) ? pcTarget[id] : id);
    var el = document.getElementById(targetId);
    if(!el) return;
    e.preventDefault();
    closeMenu();
    // 등장 효과(translate)와 무관하게 실제 레이아웃 위치로 이동
    var y = 0, n = el; while(n){ y += n.offsetTop; n = n.offsetParent; }
    var mt = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    window.scrollTo({top: Math.max(0, y - mt), behavior: reduceMotion ? 'auto' : 'smooth'});
    if(history.replaceState) history.replaceState(null,'','#'+id);
    if(a.dataset.nav){ setActive(a.dataset.nav, true); setTimeout(syncNav, 1150); }
  });

  var lockActive = 0;
  function setActive(key, lock){
    if(lock) lockActive = Date.now() + 1100;
    var keys = [].concat(key || []);
    links.forEach(function(l){ l.classList.toggle('is-active', keys.indexOf(l.dataset.nav) > -1); });
  }
  // 화면 위쪽 1/3 지점에 걸린 섹션을 기준으로 메뉴 밑줄 표시
  var navMarks = [
    ['main','main'], ['statement','identity'], ['identity','time'],
    ['stories','portfolio'], ['showcase',null], ['why',null],   // 성장 이야기 + 포트폴리오 = '포트폴리오' 메뉴
    ['pricing','pricing'], ['contact','contact']
  ].map(function(m){ return {el:document.getElementById(m[0]), key:m[1], id:m[0]}; }).filter(function(m){ return m.el; });
  function fullyVisible(el){ var r = el.getBoundingClientRect(), hh = header.offsetHeight; return r.top >= hh - 2 && r.bottom <= window.innerHeight + 2; }
  function syncNav(){
    if(Date.now() < lockActive) return;
    var hh = header.offsetHeight, probe = hh + (window.innerHeight - hh) * .33, pc = isPC(), cur = null;
    navMarks.forEach(function(m){
      var lim = m.key ? probe : hh + 24;                      // 메뉴에 없는 섹션은 화면 맨 위에 도착했을 때만
      if(m.el.getBoundingClientRect().top <= lim) cur = m;
    });
    // 문서 맨 아래에 닿으면 마지막 메뉴
    if(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = navMarks[navMarks.length - 1];
    var keys = cur && cur.key ? [cur.key] : [];
    if(pc && cur){
    }
    setActive(keys);
  }
  var navTick = false;
  window.addEventListener('scroll', function(){ if(navTick) return; navTick = true; requestAnimationFrame(function(){ navTick = false; syncNav(); }); }, {passive:true});
  window.addEventListener('resize', syncNav);
  syncNav();

  // 카카오톡 채널 URL이 확정되면 여기만 바꾸면 됩니다.
  var KAKAO_URL = pick(CC.kakaoUrl, DC.kakaoUrl);   // 카카오톡 채널 1:1 채팅 (관리자에서 수정)
  document.querySelectorAll('[data-kakao]').forEach(function(a){
    if(KAKAO_URL){ a.href = KAKAO_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else a.addEventListener('click', function(e){ e.preventDefault(); });
  });

  /* ---------------- 메인: 스크롤에 따라 오브제가 다른 속도로 이동 ---------------- */
  var hero = document.getElementById('main');
  if(!reduceMotion){
    var ticking = false;
    var updateHero = function(){
      ticking = false;
      var h = hero.offsetHeight || 1;
      var p = Math.min(1, Math.max(0, window.scrollY / h));
      hero.style.setProperty('--hp', p.toFixed(4));
    };
    window.addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(updateHero); } }, {passive:true});
    updateHero();
  }

  /* ---------------- 메인 배경: 법원 ↔ 검찰 교차 전환 ---------------- */
  // 순서: 법원 사진 → 검찰 영상 → 법원 타임랩스 → 검찰 영상 → 반복
  var slides = hero.querySelectorAll('.hero-slide');
  // 모바일은 움직이는 장면(타임랩스)부터 시작
  var IS_MO = window.matchMedia('(max-width:767px)').matches;
  var ORDER = [2, 1, 0], PHOTO_MS = 4500, FADE_LEAD = 1.0, VIDEO_MAX = 5;   // PC·모바일 공통: 로고 모션 → 법원 야경 → 도심 야경
  var DISP = {}; ORDER.forEach(function(s){ if(!(s in DISP)) DISP[s] = Object.keys(DISP).length; });
  // 영상별 재생 구간 [시작, 끝] (초) — PC 타임랩스는 시계탑 전체가 보이는 넓은 장면 위주
  var RANGE = {0:[0.2,5.4], 1:[0.1,5.6]};   // 0: 도심 야경, 1: 법원 야경
  slides.forEach(function(s, k){ var v = s.querySelector('video'); if(v && v.getAttribute('data-custom')) delete RANGE[k]; });   // 관리자에서 올린 영상은 처음부터
  function rangeOf(idx){ return RANGE[idx] || [0, VIDEO_MAX]; }
  if(!IS_MO) slides.forEach(function(s){ var v = s.querySelector('video'); if(v && v.dataset.pcPoster) v.poster = v.dataset.pcPoster; });
  var step = 0, photoTimer = null;
  // 아이폰에서 가장 확실한 방식: 영상은 모두 autoplay·loop·muted로 두고(보일 때 기기가 알아서 재생),
  // 장면 전환은 재생 여부와 상관없이 시간 기준으로 진행
  function heroShow(idx){
    slides.forEach(function(s, k){ s.classList.toggle('is-active', k === idx); });
    var v = slides[idx].querySelector('video');
    var rg = rangeOf(idx);
    var dur = v ? Math.max(3500, (rg[1] - rg[0] - .6) * 1000) : PHOTO_MS;
    clearTimeout(photoTimer); photoTimer = setTimeout(next, dur);
    // 배경 진행 표시 (01 / 03)
    var hsCur = document.getElementById('hs-cur'), hsBars = document.querySelectorAll('.hs-bars i');
    if(hsCur){
      var di = DISP[idx];
      hsCur.textContent = '0' + (di + 1);
      hsBars.forEach(function(b, k){
        b.classList.remove('on'); void b.offsetWidth;
        b.classList.toggle('done', k < di);
        if(k === di){ b.style.setProperty('--hs-dur', dur + 'ms'); b.classList.add('on'); }
      });
    }
  }
  // 장면이 보이는 순간 처음 구간부터 재생 (거절되면 조용히 넘어가고, 몇 번 더 시도)
  function ensurePlay(idx){
    var s = slides[idx], v = s.querySelector('video'); if(!v) return;
    try{ if(v.readyState >= 1) v.currentTime = rangeOf(idx)[0]; }catch(e){}
    var tries = 0;
    (function kick(){
      if(!s.classList.contains('is-active')) return;
      if(!v.paused) return;
      var p = v.play(); if(p && p.catch) p.catch(function(){});
      if(++tries < 5) setTimeout(kick, 600);
    })();
  }
  function activate(idx){ heroShow(idx); ensurePlay(idx); }
  function next(){ step = (step + 1) % ORDER.length; activate(ORDER[step]); }
  // 영상이 뒤늦게 준비되면 바로 재생
  slides.forEach(function(s, k){
    var v = s.querySelector('video'); if(!v) return;
    ['loadeddata','canplay'].forEach(function(ev){ v.addEventListener(ev, function(){ if(s.classList.contains('is-active') && v.paused){ var p = v.play(); if(p && p.catch) p.catch(function(){}); } }); });
  });
  slides.forEach(function(s, k){ s.classList.toggle('is-active', k === ORDER[0]); });
  if(slides.length > 1 && !reduceMotion) activate(ORDER[0]);

  /* 야경 톤일 때 히어로 위 헤더를 어둡게 */
  function syncHeaderTone(){
    var dark = hero.classList.contains('hero--night') && window.scrollY < hero.offsetHeight - header.offsetHeight;
    header.classList.toggle('on-dark', dark);
  }
  window.addEventListener('scroll', syncHeaderTone, {passive:true});
  syncHeaderTone();

  /* ---------------- 시작 화면 ---------------- */
  var intro = document.getElementById('intro');
  var root = document.documentElement;
  var heroVideos = document.querySelectorAll('.hero-media video');
  function loadHeroVideos(){
    heroVideos.forEach(function(v){ if(v.paused && v.closest('.hero-slide.is-active')){ var p = v.play(); if(p && p.catch) p.catch(function(){}); } });
  }
  if(root.classList.contains('has-intro')){
    var ended = false;
    var introInner = intro.querySelector('.intro-inner');
    var brandImg = document.querySelector('.brand img');
    var endIntro = function(){
      if(ended) return; ended = true;
      try{ sessionStorage.setItem('adspot-intro','1'); }catch(e){}
      var from = introInner.getBoundingClientRect();
      var to = brandImg.getBoundingClientRect();
      var sc = to.width / from.width;
      introInner.style.transition = 'transform .75s cubic-bezier(.65,0,.25,1)';
      introInner.style.transform = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' + sc + ')';
      intro.classList.add('is-leaving');
      root.classList.remove('intro-on');
      setTimeout(function(){ root.classList.remove('has-intro'); loadHeroVideos(); }, 770);
    };
    // 화면이 실제로 그려진 다음 프레임부터 애니메이션 시작 (첫 순간 멈칫함 방지)
    var go = function(){
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        root.classList.add('intro-go');
        setTimeout(endIntro, 1450);
      }); });
    };
    if(document.readyState === 'complete') go(); else window.addEventListener('load', go, {once:true});
    // 로딩이 늦어도 3초 안에는 시작
    setTimeout(function(){ if(!root.classList.contains('intro-go')) go(); }, 3000);
    intro.addEventListener('click', endIntro);
    window.addEventListener('keydown', endIntro, {once:true});
  } else {
    if(document.readyState === 'complete') loadHeroVideos(); else window.addEventListener('load', loadHeroVideos, {once:true});
  }

  /* ---------------- Apple식 스크롤 연출 ---------------- */
  // 1) 문장이 스크롤에 맞춰 한 단어씩 밝아짐
  var stText = document.getElementById('statement-text');
  var stSec = document.getElementById('statement');
  // 문장: 글자를 한 자씩 나눠 순서대로 떠오르게 (줄 사이 짧은 쉼)
  if(stText){
    var CH = 20, LINE_GAP = 70, t = 0;   // 글자 간격 ms, 줄 사이 ms (빠르게)
    stText.querySelectorAll('.seg').forEach(function(sg){
      var parts = [].slice.call(sg.childNodes).map(function(n){ return {txt:n.textContent, em:n.nodeName === 'EM'}; });
      sg.textContent = '';
      sg.setAttribute('aria-hidden','true');
      parts.forEach(function(pt){
        Array.from(pt.txt).forEach(function(chr){
          if(chr === ' '){ sg.appendChild(document.createTextNode(' ')); return; }
          var sp = document.createElement('span'); sp.className = 'ch' + (pt.em ? ' em' : ''); sp.textContent = chr;
          sp.style.setProperty('--cd', t + 'ms'); sg.appendChild(sp); t += CH;
        });
      });
      t += LINE_GAP;
    });
    stText.setAttribute('aria-label', '애드스팟을 한 번도 만나보지 않은 변호사는 있어도 한 번만 찾는 변호사는 없었습니다.');
    stSec.style.setProperty('--hl-d', Math.max(0, t - 350) + 'ms');
    stSec.style.setProperty('--rule-d', (t + 100) + 'ms');
    stSec.style.setProperty('--sub-d', (t + 1500) + 'ms');
    stSec.style.setProperty('--fill-d', Math.round(t * .25) + 'ms');
    // PC: 셋째 줄 글자 크기를 둘째 줄 폭에 정확히 맞춰 반듯한 블록으로
    var l2 = stText.querySelector('.st-l2'), l3 = stText.querySelector('.st-l3');
    var lineW = function(line){ var ss = line.querySelectorAll('.seg'); var a = ss[0].getBoundingClientRect(), b = ss[ss.length - 1].getBoundingClientRect(); return b.right - a.left; };
    var mSegs = [].slice.call(stText.querySelectorAll('.st-l2 .seg, .st-l3 .seg'));
    var fitLines = function(){
      stText.style.setProperty('--k', 1);
      mSegs.forEach(function(sg){ sg.style.removeProperty('--fs'); sg.style.letterSpacing = ''; });
      if(!window.matchMedia('(min-width:768px)').matches) return;   // 모바일은 가운데 정렬 유지
      var w2 = lineW(l2), w3 = lineW(l3);
      if(w2 > 0 && w3 > 0) stText.style.setProperty('--k', (w2 / w3).toFixed(4));
    };
    // 작은 문구: 글자 사이 간격을 고르게 넓혀 세 줄 폭을 맞춤
    var subs = [].slice.call(stSec.querySelectorAll('.st-sub span'));
    var fitSub = function(){
      subs.forEach(function(s){ s.style.letterSpacing = ''; });
      var ws = subs.map(function(s){ var r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect().width; });
      var W = Math.max.apply(null, ws);
      subs.forEach(function(s, i){
        var n = Array.from(s.textContent).length;
        if(n > 1 && ws[i] < W) s.style.letterSpacing = ((W - ws[i]) / (n - 1)).toFixed(2) + 'px';
      });
    };
    var fitAll = function(){ fitLines(); fitSub(); };
    fitAll();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    window.addEventListener('load', fitAll);
    window.addEventListener('resize', function(){ requestAnimationFrame(fitAll); });
  }
  // 2) 시계 패널·성장 이야기 카드가 화면에 들어오며 살짝 커짐
  var scalers = document.querySelectorAll('.clock, .story');
  var scrollFx = function(){
    var vh = window.innerHeight;
    if(!reduceMotion){
      scalers.forEach(function(el){
        var t = el.getBoundingClientRect().top;
        var p = Math.min(1, Math.max(0, (vh - t) / (vh * .7)));
        el.style.scale = (0.9 + 0.1 * p).toFixed(4);
      });
    }
  };
  // 문장: 화면 가운데쯤 완전히 들어오면 자동 재생, 화면 밖으로 나가면 되감아 다시 볼 수 있음
  if(stSec && stText){
    if('IntersectionObserver' in window && !reduceMotion){
      new IntersectionObserver(function(en){
        if(en[0].isIntersecting){ if(typeof fitAll === 'function') fitAll(); stSec.classList.add('is-on'); }
      }, {threshold:.95, rootMargin:'0px 0px -18% 0px'}).observe(stText);
      new IntersectionObserver(function(en){
        if(!en[0].isIntersecting) stSec.classList.remove('is-on');
      }, {threshold:0}).observe(stSec);
    } else stSec.classList.add('is-on');
  }
  var fxTick = false;
  window.addEventListener('scroll', function(){ if(!fxTick){ fxTick = true; requestAnimationFrame(function(){ fxTick = false; scrollFx(); }); } }, {passive:true});
  window.addEventListener('resize', scrollFx);
  scrollFx();

  /* ---------------- [테스트] 스크롤 쇼케이스 (고정 무대 + 진행도) ---------------- */
  (function(){
  /* ---------------- 스크롤 쇼케이스 (고정 무대 + 진행도) ---------------- */
  var scSec = document.getElementById('showcase');
  if(scSec){
    var st = scSec.querySelector('.sc-stage');
    var L = [].slice.call(scSec.querySelectorAll('.sc-layer'));
    var bars = [].slice.call(scSec.querySelectorAll('.sc-progress i'));
    var scV2 = scSec.querySelector('.sc-l2 video'), scV3 = scSec.querySelector('.sc-l3 video');
    var playIf = function(v, on){
      if(!v) return;
      if(on){ if(v.preload !== 'auto') v.preload = 'auto'; if(v.paused){ var pr = v.play(); if(pr && pr.catch) pr.catch(function(){}); } }
      else if(!v.paused) v.pause();
    };
    var clamp = function(v){ return Math.max(0, Math.min(1, v)); };
    var ease = function(t){ return 1 - Math.pow(1 - t, 3); };
    var inout = function(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; };
    var lerp = function(a, b, t){ return a + (b - a) * t; };
    var seg = function(p, a, b){ return clamp((p - a) / (b - a)); };
    var mo = function(){ return window.matchMedia('(max-width:767px)').matches; };
    var cap = function(el, t){ el.style.setProperty('--co', t.toFixed(3)); el.style.setProperty('--ct', (24 * (1 - t)).toFixed(1) + 'px'); };
    var paint = function(){
      var vh = window.innerHeight, r = scSec.getBoundingClientRect();
      var p = clamp(-r.top / Math.max(1, r.height - vh));
      // 1) 작은 창 → 전체 화면
      var t1 = inout(seg(p, .02, .24));
      st.style.setProperty('--iyt', lerp(mo() ? 30 : 32, 0, t1) + '%');
      st.style.setProperty('--iyb', lerp(mo() ? 18 : 12, 0, t1) + '%');
      st.style.setProperty('--ix', lerp(mo() ? 12 : 32, 0, t1) + '%');
      st.style.setProperty('--ir', lerp(mo() ? 22 : 28, 0, t1) + 'px');
      L[0].style.setProperty('--ms', lerp(1.3, 1.02, t1).toFixed(4));
      L[0].style.setProperty('--shade', seg(p, .16, .26).toFixed(3));
      st.style.setProperty('--io', (1 - seg(p, .02, .12)).toFixed(3));
      st.style.setProperty('--it', (-40 * seg(p, .02, .12)).toFixed(1) + 'px');
      cap(L[0], ease(seg(p, .24, .32)));
      // 2) 두 번째 장면이 덮으며 올라옴 (이미지는 느리게)
      var t2 = inout(seg(p, .38, .54));
      L[1].style.setProperty('--ly', (100 * (1 - t2)).toFixed(2) + '%');
      L[1].classList.toggle('is-moving', t2 > 0 && t2 < 1);
      L[1].style.setProperty('--my', (-18 * (1 - t2)).toFixed(2) + '%');
      L[1].style.setProperty('--ms', lerp(1.18, 1.02, t2).toFixed(4));
      L[0].style.setProperty('--my', (6 * t2).toFixed(2) + '%');
      cap(L[1], ease(seg(p, .54, .62)));
      // 3) 세 번째 장면 (영상)
      var t3 = inout(seg(p, .68, .84));
      L[2].style.setProperty('--ly', (100 * (1 - t3)).toFixed(2) + '%');
      L[2].classList.toggle('is-moving', t3 > 0 && t3 < 1);
      L[2].style.setProperty('--my', (-18 * (1 - t3)).toFixed(2) + '%');
      L[2].style.setProperty('--ms', lerp(1.18, 1.02, t3).toFixed(4));
      L[1].style.setProperty('--my', (6 * t3).toFixed(2) + '%');
      cap(L[2], ease(seg(p, .84, .92)));
      // 진행 표시
      st.style.setProperty('--po', seg(p, .2, .26).toFixed(3));
      bars[0].style.setProperty('--f', seg(p, .2, .38).toFixed(3));
      bars[1].style.setProperty('--f', seg(p, .38, .68).toFixed(3));
      bars[2].style.setProperty('--f', seg(p, .68, .98).toFixed(3));
      playIf(scV2, t2 > .15 && t3 < .98);
      playIf(scV3, t2 > .5);   // 3번째 장면 영상은 2번째 장면이 올라오는 동안 미리 재생 → 검은 화면 없이 바로 보임
    };
    // 쇼케이스에 가까워지면 영상 미리 받기
    // 시계탑 영상: 밝은 시계 구간(0.2~4초)만 반복 — 끝부분의 어두워지는 구간은 재생하지 않음
    if(scV3 && !scV3.getAttribute('data-custom')){
      var LOOP_A = 0.2, LOOP_B = 4.0;
      var clampLoop = function(){ if(scV3.currentTime >= LOOP_B || scV3.currentTime < LOOP_A - .1){ try{ scV3.currentTime = LOOP_A; }catch(e){} } };
      scV3.addEventListener('timeupdate', clampLoop);
      scV3.addEventListener('play', clampLoop);
      scV3.addEventListener('ended', function(){ try{ scV3.currentTime = LOOP_A; }catch(e){} var p = scV3.play(); if(p && p.catch) p.catch(function(){}); });
    }
    var warmed = false;
    var warm = function(){ if(warmed) return; warmed = true; [scV2, scV3].forEach(function(v){ if(v){ v.preload = 'auto'; try{ v.load(); }catch(e){} } }); };
    if('IntersectionObserver' in window) new IntersectionObserver(function(en){ if(en[0].isIntersecting) warm(); }, {rootMargin:'1200px 0px'}).observe(scSec);
    var scActive = false, scLoop = function(){ if(!scActive) return; paint(); requestAnimationFrame(scLoop); };
    if('IntersectionObserver' in window && !reduceMotion){
      new IntersectionObserver(function(en){
        var on = en[0].isIntersecting;
        if(on && !scActive){ scActive = true; requestAnimationFrame(scLoop); }
        else if(!on){ scActive = false; paint(); }
      }, {rootMargin:'120px 0px'}).observe(scSec);
    }
    paint();
  }
  })();

  /* ---------------- 메인: 태블릿·모바일에서 문구 높이를 재서 사진 높이를 자동 결정 (항상 한 화면) ---------------- */
  (function(){
    var heroEl = document.getElementById('main');
    var innerEl = heroEl.querySelector('.hero-inner'), barEl = heroEl.querySelector('.hero-bar');
    var mbarEl = document.querySelector('.mbar'), headerEl = document.querySelector('.header');
    function fitHero(){
      if(!window.matchMedia('(max-width:1024px)').matches){ heroEl.style.removeProperty('--media-h'); return; }
      var isMo = window.matchMedia('(max-width:767px)').matches;
      var vh = window.innerHeight;
      var mb = (mbarEl && getComputedStyle(mbarEl).display !== 'none') ? mbarEl.offsetHeight : 0;
      var hh = headerEl.offsetHeight;
      var content = innerEl.offsetHeight + (barEl ? (isMo ? 18 : 22) + barEl.offsetHeight : 0);
      var overlap = isMo ? (vh < 700 ? 16 : 48) : 0;   // 모바일은 문구가 영상 아래 가장자리에 살짝 겹침
      heroEl.style.setProperty('--ov', overlap + 'px');
      var avail = vh - mb - hh - (isMo ? 16 : 38) - content + overlap;
      var cap = isMo ? Math.round(vh * .62) : 440;
      heroEl.style.setProperty('--media-h', Math.round(Math.max(isMo ? 170 : 112, Math.min(cap, avail))) + 'px');
    }
    fitHero();
    window.addEventListener('resize', function(){ requestAnimationFrame(fitHero); });
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);
    window.addEventListener('load', fitHero);
  })();

  /* ---------------- 스크롤 진입 등장 ---------------- */
  var reveals = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !reduceMotion){
    var rio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('is-in'); rio.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -12% 0px', threshold:.08});
    reveals.forEach(function(el){ rio.observe(el); });
  } else reveals.forEach(function(el){ el.classList.add('is-in'); });

  /* ---------------- 함께하는 시간 (카운트업 → LIVE) ---------------- */
  // 파트너 이름/시작일은 여기서 관리합니다.
  // 파트너별 계약 시작일 (A: 2017년 2월부터 1년 단위, 임의 지정) — 실제 날짜로 바꿔주세요
  var firms = pick(C.firms, D.firms).filter(function(f){ return f && f.name && !isNaN(new Date(f.start).getTime()); });
  var clock = document.getElementById('time');
  var list = document.getElementById('clock-list');
  function pad(n){ return n < 10 ? '0'+n : ''+n; }
  function parts(ms){
    var t = Math.max(0, Math.floor(ms/1000));
    return {d:Math.floor(t/86400).toLocaleString('ko-KR'), h:pad(Math.floor(t%86400/3600)), m:pad(Math.floor(t%3600/60)), s:pad(t%60)};
  }
  /* 오도미터: 자리마다 0~9 숫자 띠(두 벌)를 세로로 미끄러뜨림 → 휴대폰에서도 부드러움 */
  var STRIP = ''; for(var q = 0; q < 20; q++) STRIP += '<i>' + (q % 10) + '</i>';
  function buildGroup(el, str){
    el.innerHTML = '';
    var slots = [];
    Array.from(str).forEach(function(ch){
      if(/\d/.test(ch)){
        var w = document.createElement('span'); w.className = 'dg';
        var s = document.createElement('span'); s.className = 'dg-s'; s.innerHTML = STRIP;
        w.appendChild(s); el.appendChild(w);
        slots.push({s:s, idx:0});
      } else {
        var sep = document.createElement('span'); sep.className = 'dg-sep'; sep.textContent = ch; el.appendChild(sep);
      }
    });
    return slots;
  }
  function place(slot, idx, dur, delay){
    slot.idx = idx;
    slot.s.style.transition = dur ? 'transform ' + dur + 'ms cubic-bezier(.2,.8,.2,1) ' + (delay || 0) + 'ms' : 'none';
    slot.s.style.transform = 'translate3d(0,' + (-idx * 1.12).toFixed(2) + 'em,0)';   // 칸 높이(1.12em)만큼 이동
    clearTimeout(slot.t);
    if(dur && idx >= 10){   // 두 번째 벌에 있으면 끝난 뒤 같은 숫자의 첫 벌로 몰래 되돌림
      slot.t = setTimeout(function(){ place(slot, idx - 10, 0); }, dur + (delay || 0) + 40);
    }
  }
  // 한 칸씩 앞으로 굴러감
  function roll(slots, str, dur){
    var digits = str.replace(/\D/g, '');
    slots.forEach(function(sl, i){
      var nd = +digits[i], cur = sl.idx % 10;
      if(nd === cur) return;
      var steps = (nd - cur + 10) % 10;
      if(sl.idx >= 10) place(sl, sl.idx - 10, 0);
      void sl.s.offsetWidth;
      place(sl, sl.idx + steps, dur);
    });
  }
  // 슬롯머신처럼 한 바퀴 돌아 제자리에 멈춤
  function spin(slots, str, dur, baseDelay){
    var digits = str.replace(/\D/g, '');
    slots.forEach(function(sl, i){ place(sl, 0, 0); });
    void (slots[0] && slots[0].s.offsetWidth);
    // 아이폰 사파리에서도 회전이 생략되지 않도록 두 프레임 뒤에 굴림
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      slots.forEach(function(sl, i){ place(sl, 10 + (+digits[i]), dur, baseDelay + i * 45); });
    }); });
  }
  var rows = firms.map(function(f){
    var li = document.createElement('li');
    li.className = 'clock-row';
    li.innerHTML =
      '<div class="clock-meta"><span class="clock-name"></span><span class="clock-state">집계 중</span></div>' +
      '<div class="timer" role="timer">' +
        '<span class="n d"></span><span class="u">일</span><span class="c">:</span>' +
        '<span class="n h"></span><span class="u">시간</span><span class="c">:</span>' +
        '<span class="n m"></span><span class="u">분</span><span class="c">:</span>' +
        '<span class="n s"></span><span class="u">초</span>' +
      '</div>';
    li.querySelector('.clock-name').textContent = f.name;
    list.appendChild(li);
    var start = new Date(f.start).getTime(), p = parts(Date.now() - start);
    var r = {el:li, start:start, state:li.querySelector('.clock-state'), busy:false, timerEl:li.querySelector('.timer')};
    r.g = {
      d: buildGroup(li.querySelector('.d'), p.d.replace(/\d/g,'0')),
      h: buildGroup(li.querySelector('.h'), '00'),
      m: buildGroup(li.querySelector('.m'), '00'),
      s: buildGroup(li.querySelector('.s'), '00')
    };
    return r;
  });
  var moreBtn = document.getElementById('clock-more');
  if(firms.length > 3){
    moreBtn.hidden = false;
    moreBtn.textContent = '전체 보기';
    moreBtn.addEventListener('click', function(){ clock.classList.add('is-expanded'); });
  }
  function aria(r, p){ r.timerEl.setAttribute('aria-label', p.d + '일 ' + p.h + '시간 ' + p.m + '분 ' + p.s + '초'); }
  function spinRow(r, i, dur, rowStagger){
    var p = parts(Date.now() - r.start + dur);   // 멈출 때의 시각을 미리 반영
    r.busy = true;
    var base = i * rowStagger;
    spin(r.g.d, p.d, dur, base); spin(r.g.h, p.h, dur, base + 80); spin(r.g.m, p.m, dur, base + 140); spin(r.g.s, p.s, dur, base + 200);
    aria(r, p);
    setTimeout(function(){ r.busy = false; tickRow(r); }, dur + base + 300);
  }
  function tickRow(r){
    if(r.busy) return;
    var p = parts(Date.now() - r.start);
    roll(r.g.d, p.d, 600); roll(r.g.h, p.h, 600); roll(r.g.m, p.m, 600); roll(r.g.s, p.s, 520);
    aria(r, p);
  }
  function setStatic(r){
    var p = parts(Date.now() - r.start);
    ['d','h','m','s'].forEach(function(k){ var dg = p[k].replace(/\D/g,''); r.g[k].forEach(function(sl, i){ place(sl, +dg[i], 0); }); });
    aria(r, p);
  }

  var started = false, clockInView = false, replayTimer = null;
  var REPLAY_EVERY = 5000, SPIN_DUR = 1400, ROW_STAGGER = 90;   // 5초마다 (시작 기준) 한 바퀴 돌아 멈춤
  var lastStart = 0;
  function goLive(){
    rows.forEach(function(r){ r.el.classList.add('is-live'); r.state.textContent = 'LIVE'; });
    function tick(){
      rows.forEach(tickRow);
      clock.classList.add('colon-off');
      setTimeout(function(){ clock.classList.remove('colon-off'); }, 500);
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    }
    tick();
    scheduleReplay();
  }
  function scheduleReplay(){
    clearTimeout(replayTimer);
    if(reduceMotion) return;
    var wait = Math.max(0, REPLAY_EVERY - (performance.now() - lastStart));
    replayTimer = setTimeout(function(){
      lastStart = performance.now();
      if(clockInView && !document.hidden) rows.forEach(function(r, i){ spinRow(r, i, SPIN_DUR, ROW_STAGGER); });
      scheduleReplay();
    }, wait);
  }
  function countUp(){
    if(started) return; started = true;
    if(reduceMotion){ rows.forEach(setStatic); goLive(); return; }
    lastStart = performance.now();
    rows.forEach(function(r, i){ spinRow(r, i, 1800, 110); });
    setTimeout(goLive, 1800 + 110 * rows.length);
  }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      var was = clockInView;
      clockInView = en[0].isIntersecting;
      if(clockInView && !started) countUp();
      else if(clockInView && !was && started){ lastStart = 0; scheduleReplay(); }   // 다시 보이면 곧바로 한 번 돌고 5초 주기 재시작
    }, {threshold:.08}).observe(clock);
  } else countUp();

  /* ---------------- 성장 이야기 (한 장씩) ---------------- */
  var stories = (D.stories || []).map(function(s, i){
    var o = (C.stories || [])[i] || {}, r = Object.assign({}, s);
    ['year','from','to','desc'].forEach(function(k){ if(has(o[k])) r[k] = String(o[k]); });
    if(has(o.title)) r.title = nl2br(o.title);
    if(has(o.years) && !isNaN(+o.years)) r.years = +o.years;
    return r;
  });
  var story = document.getElementById('story');
  var dots = document.querySelectorAll('#story-dots button');
  var textBox = story.querySelector('.story-text');
  var yEl = document.getElementById('story-year'), cEl = document.getElementById('story-count');
  var tEl = document.getElementById('story-title'), dEl = document.getElementById('story-desc');
  var cur = 0, hover = false, DELAY = 4500, inView = false;   // 성장 이야기 자동 넘김 4.5초

  // 성장 일러스트: 선이 그려지는 방식 (그때 → 지금)
  var ARTS = ["<svg class=\"viz-art\" viewBox=\"0 0 480 250\" preserveAspectRatio=\"xMidYMid meet\"><defs><linearGradient id=\"lg-spill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f59350\" stop-opacity=\".38\"/><stop offset=\"1\" stop-color=\"#f59350\" stop-opacity=\"0\"/></linearGradient><radialGradient id=\"rg-glow\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#f59350\" stop-opacity=\".28\"/><stop offset=\"1\" stop-color=\"#f59350\" stop-opacity=\"0\"/></radialGradient></defs><path class=\"fglow fb\" style=\"--fd:300ms\" d=\"M44.0 120.0a26.0 26.0 0 1 0 52.0 0a26.0 26.0 0 1 0 -52.0 0\"/><path class=\"f fa\" style=\"--fd:0ms\" d=\"M346.0 94.0H432.0V214.0H346.0Z\"/><path class=\"fspill fa\" style=\"--fd:200ms\" d=\"M346 214H432L462 250H316Z\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:0ms\" d=\"M12.0 214.0L128.0 214.0\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:45ms\" d=\"M22 214V88H118V214\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:90ms\" d=\"M22.0 98.0L118.0 98.0\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:135ms\" d=\"M70 98V112\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:180ms\" d=\"M66.0 116.0a4.0 4.0 0 1 0 8.0 0a4.0 4.0 0 1 0 -8.0 0\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:225ms\" d=\"M34.0 122.0H70.0V214.0H34.0Z\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:270ms\" d=\"M38.0 126.0H66.0V214.0H38.0Z\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:315ms\" d=\"M60.2 172.0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:360ms\" d=\"M40.0 112.0H64.0V118.0H40.0Z\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:405ms\" d=\"M80 178H112M84 178V214M108 178V214\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:450ms\" d=\"M88.0 166.0H102.0V178.0H88.0Z\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:0ms\" d=\"M140.0 214.0L478.0 214.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:22ms\" d=\"M150 214V52H470V214\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:44ms\" d=\"M150.0 64.0L470.0 64.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:66ms\" d=\"M176.0 70.0H216.0V74.0H176.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:88ms\" d=\"M240.0 70.0H280.0V74.0H240.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:110ms\" d=\"M304.0 70.0H344.0V74.0H304.0Z\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:132ms\" d=\"M168.0 112.0H208.0V214.0H168.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:154ms\" d=\"M172.0 116.0H204.0V214.0H172.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:176ms\" d=\"M199.2 166.0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:198ms\" d=\"M176.0 98.0H200.0V105.0H176.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:220ms\" d=\"M174.0 76.0H202.0V92.0H174.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:242ms\" d=\"M178.0 82.0L198.0 82.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:264ms\" d=\"M178.0 87.0L192.0 87.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:286ms\" d=\"M222.0 112.0H262.0V214.0H222.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:308ms\" d=\"M226.0 116.0H258.0V214.0H226.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:330ms\" d=\"M253.2 166.0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:352ms\" d=\"M230.0 98.0H254.0V105.0H230.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:374ms\" d=\"M228.0 76.0H256.0V92.0H228.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:396ms\" d=\"M232.0 82.0L252.0 82.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:418ms\" d=\"M232.0 87.0L246.0 87.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:440ms\" d=\"M276.0 112.0H316.0V214.0H276.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:462ms\" d=\"M280.0 116.0H312.0V214.0H280.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:484ms\" d=\"M307.2 166.0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:506ms\" d=\"M284.0 98.0H308.0V105.0H284.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:528ms\" d=\"M282.0 76.0H310.0V92.0H282.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:550ms\" d=\"M286.0 82.0L306.0 82.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:572ms\" d=\"M286.0 87.0L300.0 87.0\"/><path class=\"s s2 g a\" pathLength=\"1\" style=\"--t:594ms\" d=\"M340.0 86.0H438.0V214.0H340.0Z\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:616ms\" d=\"M346.0 94.0H432.0V214.0H346.0Z\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:638ms\" d=\"M389.0 94.0L389.0 214.0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:660ms\" d=\"M380.8 156.0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:682ms\" d=\"M392.8 156.0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:704ms\" d=\"M368.0 74.0H410.0V84.0H368.0Z\"/><path class=\"s s2 g a\" pathLength=\"1\" style=\"--t:726ms\" d=\"M374.0 79.0L404.0 79.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:748ms\" d=\"M323 214l-3-14h20l-3 14\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:770ms\" d=\"M330 200c-9-10-7-24 0-32M330 200c7-9 11-20 5-30M330 200c-2-11 3-19 9-23\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:792ms\" d=\"M443 214l-3-14h20l-3 14\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:814ms\" d=\"M450 200c-9-10-7-24 0-32M450 200c7-9 11-20 5-30M450 200c-2-11 3-19 9-23\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:836ms\" d=\"M150.0 214.0L146.0 214.7\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:858ms\" d=\"M190.0 214.0L146.0 222.8\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:880ms\" d=\"M230.0 214.0L146.0 235.1\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:902ms\" d=\"M270.0 214.0L162.9 250.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:924ms\" d=\"M310.0 214.0L238.9 250.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:946ms\" d=\"M350.0 214.0L314.9 250.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:968ms\" d=\"M390.0 214.0L390.9 250.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:990ms\" d=\"M430.0 214.0L466.9 250.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1012ms\" d=\"M470.0 214.0L542.9 250.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1034ms\" d=\"M146.0 224.0L482.0 224.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1056ms\" d=\"M146.0 236.0L496.4 236.0\"/></svg>", "<svg class=\"viz-art\" viewBox=\"0 0 480 250\" preserveAspectRatio=\"xMidYMid meet\"><defs><linearGradient id=\"lg-spill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f59350\" stop-opacity=\".38\"/><stop offset=\"1\" stop-color=\"#f59350\" stop-opacity=\"0\"/></linearGradient><radialGradient id=\"rg-glow\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#f59350\" stop-opacity=\".28\"/><stop offset=\"1\" stop-color=\"#f59350\" stop-opacity=\"0\"/></radialGradient></defs><path class=\"bgl\" d=\"M146 212V182H164V164H189V190H207V172H208V212\"/><path class=\"bgl\" d=\"M432 212V182H450V164H475V190H478V212\"/><path class=\"fspill fb\" style=\"--fd:100ms\" d=\"M113 138L150 214H86Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M225.0 95.0H241.0V111.0H225.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M247.0 95.0H263.0V111.0H247.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M269.0 95.0H285.0V111.0H269.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M291.0 95.0H307.0V111.0H291.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M313.0 95.0H329.0V111.0H313.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M335.0 95.0H351.0V111.0H335.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M357.0 95.0H373.0V111.0H357.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M379.0 95.0H395.0V111.0H379.0Z\"/><path class=\"fwin fa\" style=\"--fd:0ms\" d=\"M401.0 95.0H415.0V111.0H401.0Z\"/><path class=\"fglow fa\" style=\"--fd:100ms\" d=\"M210.0 103.0a110.0 110.0 0 1 0 220.0 0a110.0 110.0 0 1 0 -220.0 0\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:0ms\" d=\"M12.0 214.0L128.0 214.0\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:22ms\" d=\"M26.0 70.0H82.0V124.0H26.0Z\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:43ms\" d=\"M54.0 70.0L54.0 124.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:65ms\" d=\"M26.0 97.0L82.0 97.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:87ms\" d=\"M28.0 76.0L52.0 76.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:108ms\" d=\"M28.0 82.0L52.0 82.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:130ms\" d=\"M28.0 88.0L52.0 88.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:152ms\" d=\"M28.0 94.0L52.0 94.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:173ms\" d=\"M28.0 100.0L52.0 100.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:195ms\" d=\"M28.0 106.0L52.0 106.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:217ms\" d=\"M28.0 112.0L52.0 112.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:238ms\" d=\"M28.0 118.0L52.0 118.0\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:260ms\" d=\"M20 168H116\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:282ms\" d=\"M24 168V214M112 168V214\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:303ms\" d=\"M88.0 172.0H110.0V214.0H88.0Z\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:325ms\" d=\"M88.0 186.0L110.0 186.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:347ms\" d=\"M88.0 200.0L110.0 200.0\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:368ms\" d=\"M46 168l5-20h26l-5 20\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:390ms\" d=\"M40.0 168.0L80.0 168.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:412ms\" d=\"M28.0 160.0H42.0V168.0H28.0Z\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:433ms\" d=\"M30.0 156.0H40.0V160.0H30.0Z\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:455ms\" d=\"M100 168h10M105 168l-6-24 12-10\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:477ms\" d=\"M108 131l14 5-7 10z\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:498ms\" d=\"M30 192h26M30 192v-26M43 192v22\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:0ms\" d=\"M140.0 214.0L478.0 214.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:22ms\" d=\"M222.0 26.0H418.0V214.0H222.0Z\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:44ms\" d=\"M214.0 18.0H426.0V26.0H214.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:66ms\" d=\"M282.0 6.0H358.0V18.0H282.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:88ms\" d=\"M222.0 48.0L418.0 48.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:110ms\" d=\"M222.0 70.0L418.0 70.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:132ms\" d=\"M222.0 92.0L418.0 92.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:154ms\" d=\"M222.0 114.0L418.0 114.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:176ms\" d=\"M222.0 136.0L418.0 136.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:198ms\" d=\"M222.0 158.0L418.0 158.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:220ms\" d=\"M244.0 32.0L244.0 174.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:242ms\" d=\"M266.0 32.0L266.0 174.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:264ms\" d=\"M288.0 32.0L288.0 174.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:286ms\" d=\"M310.0 32.0L310.0 174.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:308ms\" d=\"M332.0 32.0L332.0 174.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:330ms\" d=\"M354.0 32.0L354.0 174.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:352ms\" d=\"M376.0 32.0L376.0 174.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:374ms\" d=\"M398.0 32.0L398.0 174.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:396ms\" d=\"M210.0 174.0H430.0V180.0H210.0Z\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:418ms\" d=\"M296.0 184.0H344.0V214.0H296.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:440ms\" d=\"M320.0 184.0L320.0 214.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:462ms\" d=\"M286.0 178.0H354.0V184.0H286.0Z\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:484ms\" d=\"M176 214V156h10\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:506ms\" d=\"M185.0 158.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:528ms\" d=\"M466 214V156h10\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:550ms\" d=\"M475.0 158.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:572ms\" d=\"M182.0 180.0a14.0 14.0 0 1 0 28.0 0a14.0 14.0 0 1 0 -28.0 0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:594ms\" d=\"M196.0 194.0L196.0 214.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:616ms\" d=\"M430.0 180.0a14.0 14.0 0 1 0 28.0 0a14.0 14.0 0 1 0 -28.0 0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:638ms\" d=\"M444.0 194.0L444.0 214.0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:660ms\" d=\"M222.0 92.0H418.0V114.0H222.0Z\"/></svg>", "<svg class=\"viz-art\" viewBox=\"0 0 480 250\" preserveAspectRatio=\"xMidYMid meet\"><defs><linearGradient id=\"lg-spill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f59350\" stop-opacity=\".38\"/><stop offset=\"1\" stop-color=\"#f59350\" stop-opacity=\"0\"/></linearGradient><radialGradient id=\"rg-glow\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#f59350\" stop-opacity=\".28\"/><stop offset=\"1\" stop-color=\"#f59350\" stop-opacity=\"0\"/></radialGradient></defs><path class=\"bgl\" d=\"M160 96V66H178V48H203V74H221V56H246V40H264V68H289V60H307V52H332V70H350V46H375V66H393V48H418V74H436V56H461V40H470V96\"/><path class=\"fspill fb\" style=\"--fd:100ms\" d=\"M62 122L40 174H100L78 122Z\"/><path class=\"fglow fa\" style=\"--fd:150ms\" d=\"M162.0 150.0a150.0 150.0 0 1 0 300.0 0a150.0 150.0 0 1 0 -300.0 0\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:0ms\" d=\"M12.0 214.0L128.0 214.0\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:37ms\" d=\"M70 60V110\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:74ms\" d=\"M56 122l6-12h16l6 12z\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:111ms\" d=\"M36 174H104\"/><path class=\"s s1 b\" pathLength=\"1\" style=\"--t:149ms\" d=\"M70 174V214M56 214h28\"/><path class=\"s s1 g b\" pathLength=\"1\" style=\"--t:186ms\" d=\"M25.0 142.0a7.0 7.0 0 1 0 14.0 0a7.0 7.0 0 1 0 -14.0 0\"/><path class=\"s s1 g b\" pathLength=\"1\" style=\"--t:223ms\" d=\"M18.0 164.4C18.0 151.1 46.0 151.1 46.0 164.4\"/><path class=\"s s1 g b\" pathLength=\"1\" style=\"--t:260ms\" d=\"M101.0 142.0a7.0 7.0 0 1 0 14.0 0a7.0 7.0 0 1 0 -14.0 0\"/><path class=\"s s1 g b\" pathLength=\"1\" style=\"--t:297ms\" d=\"M94.0 164.4C94.0 151.1 122.0 151.1 122.0 164.4\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:334ms\" d=\"M18 188h24M18 188v-22M30 188v26\"/><path class=\"s s2 b\" pathLength=\"1\" style=\"--t:371ms\" d=\"M98 188h24M122 188v-22M110 188v26\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:409ms\" d=\"M52.0 166.0H62.0V174.0H52.0Z\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:446ms\" d=\"M78.0 166.0H88.0V174.0H78.0Z\"/><path class=\"s s3 b\" pathLength=\"1\" style=\"--t:483ms\" d=\"M62.0 170.0H78.0V174.0H62.0Z\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:0ms\" d=\"M140.0 214.0L478.0 214.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:10ms\" d=\"M160.0 36.0H470.0V96.0H160.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:20ms\" d=\"M222.0 36.0L222.0 96.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:30ms\" d=\"M284.0 36.0L284.0 96.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:40ms\" d=\"M346.0 36.0L346.0 96.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:50ms\" d=\"M408.0 36.0L408.0 96.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:60ms\" d=\"M150.0 30.0L476.0 30.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:69ms\" d=\"M190.0 30.0L190.0 40.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:79ms\" d=\"M183 46l3-6h8l3 6z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:89ms\" d=\"M250.0 30.0L250.0 40.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:99ms\" d=\"M243 46l3-6h8l3 6z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:109ms\" d=\"M310.0 30.0L310.0 40.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:119ms\" d=\"M303 46l3-6h8l3 6z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:129ms\" d=\"M370.0 30.0L370.0 40.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:139ms\" d=\"M363 46l3-6h8l3 6z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:149ms\" d=\"M430.0 30.0L430.0 40.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:159ms\" d=\"M423 46l3-6h8l3 6z\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:169ms\" d=\"M188.0 104.4a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0 -6.6 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:179ms\" d=\"M184.7 115.0C184.7 108.7 197.9 108.7 197.9 115.0\"/><path class=\"occ\" d=\"M184.1 111.6H198.5V121.7H184.1Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:188ms\" d=\"M184.1 111.6H198.5V121.7H184.1Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:198ms\" d=\"M191.3 121.7L191.3 126.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:208ms\" d=\"M174.0 126.0L208.6 126.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:218ms\" d=\"M176.2 126.0L176.2 133.2\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:228ms\" d=\"M206.4 126.0L206.4 133.2\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:238ms\" d=\"M245.8 104.4a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0 -6.6 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:248ms\" d=\"M242.5 115.0C242.5 108.7 255.8 108.7 255.8 115.0\"/><path class=\"occ\" d=\"M241.9 111.6H256.3V121.7H241.9Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:258ms\" d=\"M241.9 111.6H256.3V121.7H241.9Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:268ms\" d=\"M249.1 121.7L249.1 126.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:278ms\" d=\"M231.9 126.0L266.4 126.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:288ms\" d=\"M234.0 126.0L234.0 133.2\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:298ms\" d=\"M264.3 126.0L264.3 133.2\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:308ms\" d=\"M303.7 104.4a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0 -6.6 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:317ms\" d=\"M300.4 115.0C300.4 108.7 313.6 108.7 313.6 115.0\"/><path class=\"occ\" d=\"M299.8 111.6H314.2V121.7H299.8Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:327ms\" d=\"M299.8 111.6H314.2V121.7H299.8Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:337ms\" d=\"M307.0 121.7L307.0 126.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:347ms\" d=\"M289.7 126.0L324.3 126.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:357ms\" d=\"M291.9 126.0L291.9 133.2\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:367ms\" d=\"M322.1 126.0L322.1 133.2\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:377ms\" d=\"M361.5 104.4a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0 -6.6 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:387ms\" d=\"M358.2 115.0C358.2 108.7 371.5 108.7 371.5 115.0\"/><path class=\"occ\" d=\"M357.7 111.6H372.1V121.7H357.7Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:397ms\" d=\"M357.7 111.6H372.1V121.7H357.7Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:407ms\" d=\"M364.9 121.7L364.9 126.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:417ms\" d=\"M347.6 126.0L382.1 126.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:427ms\" d=\"M349.7 126.0L349.7 133.2\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:437ms\" d=\"M380.0 126.0L380.0 133.2\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:446ms\" d=\"M419.4 104.4a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0 -6.6 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:456ms\" d=\"M416.1 115.0C416.1 108.7 429.3 108.7 429.3 115.0\"/><path class=\"occ\" d=\"M415.5 111.6H429.9V121.7H415.5Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:466ms\" d=\"M415.5 111.6H429.9V121.7H415.5Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:476ms\" d=\"M422.7 121.7L422.7 126.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:486ms\" d=\"M405.4 126.0L440.0 126.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:496ms\" d=\"M407.6 126.0L407.6 133.2\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:506ms\" d=\"M437.8 126.0L437.8 133.2\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:516ms\" d=\"M182.7 136.2a4.0 4.0 0 1 0 7.9 0a4.0 4.0 0 1 0 -7.9 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:526ms\" d=\"M178.7 148.9C178.7 141.3 194.6 141.3 194.6 148.9\"/><path class=\"occ\" d=\"M178.0 144.8H195.2V156.8H178.0Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:536ms\" d=\"M178.0 144.8H195.2V156.8H178.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:546ms\" d=\"M186.6 156.8L186.6 162.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:556ms\" d=\"M166.0 162.0L207.3 162.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:565ms\" d=\"M168.6 162.0L168.6 170.6\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:575ms\" d=\"M204.7 162.0L204.7 170.6\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:585ms\" d=\"M243.9 136.2a4.0 4.0 0 1 0 7.9 0a4.0 4.0 0 1 0 -7.9 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:595ms\" d=\"M239.9 148.9C239.9 141.3 255.7 141.3 255.7 148.9\"/><path class=\"occ\" d=\"M239.2 144.8H256.4V156.8H239.2Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:605ms\" d=\"M239.2 144.8H256.4V156.8H239.2Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:615ms\" d=\"M247.8 156.8L247.8 162.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:625ms\" d=\"M227.2 162.0L268.5 162.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:635ms\" d=\"M229.8 162.0L229.8 170.6\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:645ms\" d=\"M265.9 162.0L265.9 170.6\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:655ms\" d=\"M305.0 136.2a4.0 4.0 0 1 0 7.9 0a4.0 4.0 0 1 0 -7.9 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:665ms\" d=\"M301.1 148.9C301.1 141.3 316.9 141.3 316.9 148.9\"/><path class=\"occ\" d=\"M300.4 144.8H317.6V156.8H300.4Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:675ms\" d=\"M300.4 144.8H317.6V156.8H300.4Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:685ms\" d=\"M309.0 156.8L309.0 162.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:694ms\" d=\"M288.4 162.0L329.6 162.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:704ms\" d=\"M290.9 162.0L290.9 170.6\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:714ms\" d=\"M327.1 162.0L327.1 170.6\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:724ms\" d=\"M366.2 136.2a4.0 4.0 0 1 0 7.9 0a4.0 4.0 0 1 0 -7.9 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:734ms\" d=\"M362.3 148.9C362.3 141.3 378.1 141.3 378.1 148.9\"/><path class=\"occ\" d=\"M361.6 144.8H378.8V156.8H361.6Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:744ms\" d=\"M361.6 144.8H378.8V156.8H361.6Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:754ms\" d=\"M370.2 156.8L370.2 162.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:764ms\" d=\"M349.5 162.0L390.8 162.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:774ms\" d=\"M352.1 162.0L352.1 170.6\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:784ms\" d=\"M388.2 162.0L388.2 170.6\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:794ms\" d=\"M427.4 136.2a4.0 4.0 0 1 0 7.9 0a4.0 4.0 0 1 0 -7.9 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:804ms\" d=\"M423.4 148.9C423.4 141.3 439.3 141.3 439.3 148.9\"/><path class=\"occ\" d=\"M422.8 144.8H440.0V156.8H422.8Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:813ms\" d=\"M422.8 144.8H440.0V156.8H422.8Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:823ms\" d=\"M431.4 156.8L431.4 162.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:833ms\" d=\"M410.7 162.0L452.0 162.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:843ms\" d=\"M413.3 162.0L413.3 170.6\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:853ms\" d=\"M449.4 162.0L449.4 170.6\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:863ms\" d=\"M175.4 174.0a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:873ms\" d=\"M170.8 188.7C170.8 180.0 189.2 180.0 189.2 188.7\"/><path class=\"occ\" d=\"M170.0 184.0H190.0V198.0H170.0Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:883ms\" d=\"M170.0 184.0H190.0V198.0H170.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:893ms\" d=\"M180.0 198.0L180.0 204.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:903ms\" d=\"M156.0 204.0L204.0 204.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:913ms\" d=\"M159.0 204.0L159.0 214.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:923ms\" d=\"M201.0 204.0L201.0 214.0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:933ms\" d=\"M240.9 174.0a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:942ms\" d=\"M236.3 188.7C236.3 180.0 254.7 180.0 254.7 188.7\"/><path class=\"occ\" d=\"M235.5 184.0H255.5V198.0H235.5Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:952ms\" d=\"M235.5 184.0H255.5V198.0H235.5Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:962ms\" d=\"M245.5 198.0L245.5 204.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:972ms\" d=\"M221.5 204.0L269.5 204.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:982ms\" d=\"M224.5 204.0L224.5 214.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:992ms\" d=\"M266.5 204.0L266.5 214.0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:1002ms\" d=\"M306.4 174.0a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:1012ms\" d=\"M301.8 188.7C301.8 180.0 320.2 180.0 320.2 188.7\"/><path class=\"occ\" d=\"M301.0 184.0H321.0V198.0H301.0Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:1022ms\" d=\"M301.0 184.0H321.0V198.0H301.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1032ms\" d=\"M311.0 198.0L311.0 204.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:1042ms\" d=\"M287.0 204.0L335.0 204.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1052ms\" d=\"M290.0 204.0L290.0 214.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1062ms\" d=\"M332.0 204.0L332.0 214.0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:1071ms\" d=\"M371.9 174.0a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:1081ms\" d=\"M367.3 188.7C367.3 180.0 385.7 180.0 385.7 188.7\"/><path class=\"occ\" d=\"M366.5 184.0H386.5V198.0H366.5Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:1091ms\" d=\"M366.5 184.0H386.5V198.0H366.5Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1101ms\" d=\"M376.5 198.0L376.5 204.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:1111ms\" d=\"M352.5 204.0L400.5 204.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1121ms\" d=\"M355.5 204.0L355.5 214.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1131ms\" d=\"M397.5 204.0L397.5 214.0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:1141ms\" d=\"M437.4 174.0a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0\"/><path class=\"s s1 g a\" pathLength=\"1\" style=\"--t:1151ms\" d=\"M432.8 188.7C432.8 180.0 451.2 180.0 451.2 188.7\"/><path class=\"occ\" d=\"M432.0 184.0H452.0V198.0H432.0Z\"/><path class=\"s s2 mon a\" pathLength=\"1\" style=\"--t:1161ms\" d=\"M432.0 184.0H452.0V198.0H432.0Z\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1171ms\" d=\"M442.0 198.0L442.0 204.0\"/><path class=\"s s1 a\" pathLength=\"1\" style=\"--t:1181ms\" d=\"M418.0 204.0L466.0 204.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1190ms\" d=\"M421.0 204.0L421.0 214.0\"/><path class=\"s s3 a\" pathLength=\"1\" style=\"--t:1200ms\" d=\"M463.0 204.0L463.0 214.0\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:1210ms\" d=\"M144 214l-3-12h18l-3 12\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:1220ms\" d=\"M150 202c-8-9-6-20 0-28M150 202c6-8 9-17 4-26\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:1230ms\" d=\"M466 214l-3-12h18l-3 12\"/><path class=\"s s2 a\" pathLength=\"1\" style=\"--t:1240ms\" d=\"M472 202c-8-9-6-20 0-28M472 202c6-8 9-17 4-26\"/></svg>"];
  var vizEl = document.getElementById('story-viz'), stageEl = document.getElementById('viz-stage');
  var vizTimer = null, vizTimer2 = null;
  function playViz(i){
    var st = stories[i];
    clearTimeout(vizTimer); clearTimeout(vizTimer2);
    vizEl.classList.remove('draw-b', 'is-now');
    stageEl.innerHTML = ARTS[i] || '';
    document.getElementById('viz-state').textContent = '그때';
    document.getElementById('viz-years').textContent = st.years;
    document.getElementById('viz-from').textContent = st.from;
    document.getElementById('viz-to').textContent = st.to;
    if(reduceMotion){ vizEl.classList.add('draw-b', 'is-now'); document.getElementById('viz-state').textContent = '지금'; return; }
    void stageEl.offsetWidth;
    requestAnimationFrame(function(){
      vizEl.classList.add('draw-b');
      vizTimer = setTimeout(function(){
        vizEl.classList.add('is-now');
        document.getElementById('viz-state').textContent = '지금';
      }, 1050);
    });
  }
  // 첫 장면은 화면에 들어왔을 때 그리기 시작 (나갔다 들어오면 다시)
  var vizSeen = false;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      inView = en[0].isIntersecting;
      story.classList.toggle('is-paused', !inView || hover);   // 안 보일 때는 자동 넘김 멈춤
      if(inView && !vizSeen){ vizSeen = true; playViz(cur); restart(); }
      else if(!inView) vizSeen = false;
    }, {threshold:.5}).observe(vizEl);
  } else playViz(0);

  function show(i){
    i = (i + stories.length) % stories.length;
    if(i === cur) return;
    cur = i;
    if(vizSeen) playViz(i);
    dots.forEach(function(d, k){ d.classList.toggle('is-active', k === i); d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    textBox.classList.add('is-fading');
    setTimeout(function(){
      var s = stories[i];
      yEl.textContent = s.year; cEl.textContent = (i+1) + ' / ' + stories.length;
      tEl.innerHTML = s.title; dEl.textContent = s.desc;
      textBox.classList.remove('is-fading');
    }, 280);
  }
  // 자동 넘김: 활성 점의 진행 막대가 다 차면 다음 장으로 (마우스 오버 시 막대도 함께 멈춤)
  story.style.setProperty('--story-delay', DELAY + 'ms');
  if(reduceMotion) story.classList.add('no-auto');
  story.classList.add('is-paused');
  function restart(){
    var d = dots[cur];
    d.classList.remove('is-active'); void d.offsetWidth; d.classList.add('is-active');
  }
  dots.forEach(function(d){
    d.addEventListener('animationend', function(){ if(!reduceMotion && !document.hidden) show(cur + 1); else restart(); });
  });
  document.addEventListener('visibilitychange', function(){ story.classList.toggle('is-paused', document.hidden || hover || !inView); });
  document.getElementById('story-prev').addEventListener('click', function(){ show(cur - 1); restart(); });
  document.getElementById('story-next').addEventListener('click', function(){ show(cur + 1); restart(); });
  dots.forEach(function(d, k){ d.addEventListener('click', function(){ show(k); restart(); }); });
  // 마우스를 올려도 멈추지 않음 (화면 밖에 있을 때만 쉼)

  story.addEventListener('keydown', function(e){
    if(e.key === 'ArrowLeft'){ show(cur - 1); restart(); }
    if(e.key === 'ArrowRight'){ show(cur + 1); restart(); }
  });
  // 모바일 스와이프
  var sx = null;
  story.querySelector('.story-media').addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive:true});
  story.querySelector('.story-media').addEventListener('touchend', function(e){
    if(sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if(Math.abs(dx) > 40){ show(cur + (dx < 0 ? 1 : -1)); restart(); }
  }, {passive:true});
  restart();

  /* ---------------- 가격안내: 금액·분야별 조합은 여기서만 수정 ---------------- */
  // price: 건당 금액(원, 부가세 별도)
  var PLANS = (D.plans || []).map(function(p){
    var o = (C.plans || []).filter(function(x){ return x && x.key === p.key; })[0] || {}, r = Object.assign({}, p);
    if(has(o.name)) r.name = String(o.name);
    if(has(o.desc)) r.desc = String(o.desc);
    if(has(o.price) && !isNaN(+o.price)) r.price = +o.price;
    return r;
  });
  // 분야별 예시 조합 (월 건수) — 실제 추천 건수로 바꿔주세요
  var FIELDS = pick(C.fields, D.fields).filter(function(f){ return f && f.name && f.mix; }).map(function(f){
    return {name:String(f.name), mix:{cafe:+f.mix.cafe||0, influencer:+f.mix.influencer||0, blog:+f.mix.blog||0}};
  });
  var PRICING_NOTE = pick(C.pricingNote, D.pricingNote);
  var won = function(n){ return Math.round(n).toLocaleString('ko-KR'); };

  var listEl = document.getElementById('price-list');
  PLANS.forEach(function(p){
    var li = document.createElement('li');
    li.className = 'price-item';
    li.innerHTML = '<div class="price-item-top"><h3></h3><span class="pr">건당<b>' + won(p.price) + '</b>원</span></div><p></p>';
    li.querySelector('h3').textContent = p.name;
    li.querySelector('p').textContent = p.desc;
    listEl.appendChild(li);
  });

  var tabsEl = document.getElementById('est-tabs'), rowsEl = document.getElementById('est-rows');
  var sumEl = document.getElementById('est-sum'), vatEl = document.getElementById('est-vat');
  var qty = {}, rowRefs = {};
  PLANS.forEach(function(p){
    var li = document.createElement('li');
    li.className = 'est-row';
    li.innerHTML = '<p class="est-row-name"></p>' +
      '<div class="stepper"><button type="button" data-d="-1" aria-label="줄이기">−</button><output aria-live="polite">0</output><button type="button" data-d="1" aria-label="늘리기">+</button></div>' +
      '<p class="est-sub">0원</p>';
    li.querySelector('.est-row-name').innerHTML = '';
    li.querySelector('.est-row-name').appendChild(document.createTextNode(p.name));
    var sm = document.createElement('small'); sm.textContent = '건당 ' + won(p.price) + '원';
    li.querySelector('.est-row-name').appendChild(sm);
    li.querySelectorAll('.stepper button').forEach(function(btn){
      btn.addEventListener('click', function(){
        qty[p.key] = Math.max(0, Math.min(99, (qty[p.key] || 0) + Number(btn.dataset.d)));
        tabsEl.querySelectorAll('.est-tab').forEach(function(t){ t.setAttribute('aria-selected','false'); });
        updateEst();
      });
    });
    rowRefs[p.key] = {out: li.querySelector('output'), sub: li.querySelector('.est-sub')};
    rowsEl.appendChild(li);
  });

  var shown = 0, tweenId = 0;
  function tweenTo(target){
    var from = shown, t0 = performance.now(), id = ++tweenId, dur = reduceMotion ? 0 : 450;
    function f(now){
      if(id !== tweenId) return;
      var p = dur ? Math.min(1, (now - t0)/dur) : 1, e = 1 - Math.pow(1 - p, 3);
      shown = from + (target - from) * e;
      sumEl.textContent = won(shown); vatEl.textContent = won(shown * 1.1);
      if(p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }
  function updateEst(){
    var total = 0;
    PLANS.forEach(function(p){
      var n = qty[p.key] || 0, sub = n * p.price; total += sub;
      rowRefs[p.key].out.textContent = n;
      rowRefs[p.key].sub.textContent = won(sub) + '원';
    });
    tweenTo(total);
  }
  function pickField(i){
    FIELDS.forEach(function(f, k){ tabsEl.children[k].setAttribute('aria-selected', String(k === i)); });
    PLANS.forEach(function(p){ qty[p.key] = FIELDS[i].mix[p.key] || 0; });
    updateEst();
  }
  FIELDS.forEach(function(f, i){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'est-tab'; b.setAttribute('role','tab'); b.textContent = f.name;
    b.addEventListener('click', function(){ pickField(i); });
    tabsEl.appendChild(b);
  });
  pickField(0);

  // 견적 방식 전환: 분야별 추천 조합 / 맞춤 견적
  var modeBtns = document.querySelectorAll('.est-mode button');
  var panels = document.querySelectorAll('.est-panel');
  modeBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      modeBtns.forEach(function(b){ b.setAttribute('aria-selected', String(b === btn)); });
      panels.forEach(function(p){ p.hidden = p.dataset.panel !== btn.dataset.mode; });
    });
  });
  // 맞춤 견적: 분야 + 월 예산만 선택
  var BUDGETS = ['50만원 미만', '50~100만원', '100~200만원', '200만원 이상', '상담 후 결정'];
  var cq = {field:'', budget:''};
  function makeChips(el, items, key){
    items.forEach(function(label){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = label; b.setAttribute('aria-pressed','false');
      b.addEventListener('click', function(){
        el.querySelectorAll('.chip').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        cq[key] = label; updateCq();
      });
      el.appendChild(b);
    });
  }
  function updateCq(){
    var t = document.getElementById('cq-sum');
    if(cq.field && cq.budget) t.textContent = cq.field + ' 분야 · 월 ' + cq.budget + ' 기준으로 조합을 제안드립니다';
    else if(cq.field) t.textContent = cq.field + ' 분야 · 월 예산을 선택해 주세요';
    else if(cq.budget) t.textContent = '월 ' + cq.budget + ' · 분야를 선택해 주세요';
    else t.textContent = '분야와 예산을 선택해 주세요';
  }
  makeChips(document.getElementById('cq-field'), FIELDS.map(function(f){ return f.name; }).concat(['기타']), 'field');
  makeChips(document.getElementById('cq-budget'), BUDGETS, 'budget');

  document.getElementById('pricing-note').textContent = PRICING_NOTE;

  /* ---------------- 연락처 (여기서만 바꾸면 전체 반영) ---------------- */
  var PHONE_TEL = String(pick(CC.phoneTel, DC.phoneTel)).replace(/[^0-9+]/g,''), PHONE_TEXT = pick(CC.phoneText, DC.phoneText);   // 전화 상담 번호 (관리자에서 수정)
  document.querySelectorAll('a[href^="tel:"]:not([data-keep-tel])').forEach(function(a){ a.href = 'tel:' + PHONE_TEL; });
  document.querySelectorAll('[data-phone-text]').forEach(function(el){ el.textContent = PHONE_TEXT; });

  // PC(전화 불가)에서는 전화 버튼을 누르면 번호 안내창을 띄움. 휴대폰은 바로 전화 연결
  var canCall = window.matchMedia('(hover:none) and (pointer:coarse)').matches || /iPhone|Android|Mobile/i.test(navigator.userAgent);
  if(!canCall){
    var pop = document.createElement('div');
    pop.className = 'call-pop'; pop.setAttribute('role','dialog'); pop.setAttribute('aria-label','전화 상담 번호');
    pop.innerHTML = '<p class="cp-k">전화 상담</p><p class="cp-n"></p><div class="cp-a"><button type="button" class="cp-copy">번호 복사</button><button type="button" class="cp-close">닫기</button></div>';
    document.body.appendChild(pop);
    var closePop = function(){ pop.classList.remove('is-on'); };
    pop.querySelector('.cp-close').addEventListener('click', closePop);
    pop.querySelector('.cp-copy').addEventListener('click', function(){
      var n = pop.querySelector('.cp-n').textContent, b = this;
      var done = function(){ b.textContent = '복사됨'; setTimeout(function(){ b.textContent = '번호 복사'; }, 1500); };
      if(navigator.clipboard) navigator.clipboard.writeText(n).then(done, done); else done();
    });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closePop(); });
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href^="tel:"]');
      if(!a){ if(!e.target.closest || !e.target.closest('.call-pop')) closePop(); return; }
      e.preventDefault();
      var num = a.getAttribute('href').replace('tel:','');
      var pretty = num.length === 11 ? num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : num.replace(/^(02)(\d{3,4})(\d{4})$/, '$1-$2-$3');
      pop.querySelector('.cp-n').textContent = pretty;
      pop.classList.add('is-on');
    });
  }

  /* ---------------- 어떤 마케팅을 원하시나요? (채팅) ---------------- */
  // 대화 시나리오: 사무소의 고민 → 애드스팟의 답 (문구는 여기서 수정)
  var CHATS = [
    {name:'법무법인 A', q:'광고비는 계속 나가는데, 실제 상담 문의로는 잘 이어지지 않아요.'},
    {name:'법률사무소 B', q:'이곳저곳에서 꾸준한 마케팅을 했는데 효율이 나오지 않아요.'},
    {name:'법률사무소 C', q:'개업한 지 얼마 안 됐는데, 어디서부터 시작해야 할지 모르겠어요.'}
  ];
  var REPLIES = [
    {t:'그럴듯한 패키지만 팔고, 효과는 단 1%도 책임지지 않는 대행사가 너무 많습니다.'},
    {t:'애드스팟은 법률마케팅만 전문으로, 실제 매출을 만든 사례를 수없이 보유하고 있습니다.'},
    {t:'1개월 단위로 먼저 시작해 보세요. 결과로 다음 달을 결정하시면 됩니다.', gold:true}
  ];
  var whyTabs = document.getElementById('why-tabs');
  var whySec = document.getElementById('why'), whyNum = document.getElementById('why-num');
  var chatBody = document.getElementById('chat-body');
  function playWhy(){
    whySec.classList.remove('is-on'); void whySec.offsetWidth; whySec.classList.add('is-on');
    if(reduceMotion){ whyNum.textContent = '40,000'; return; }
    var t0 = performance.now(), dur = 1500;
    (function f(now){
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      whyNum.textContent = Math.round(40000 * e).toLocaleString('ko-KR');
      if(p < 1) requestAnimationFrame(f);
    })(t0);
  }
  var chatIdx = 0, whyInView = false, chatTimers = [], chatRun = 0;
  function later(fn, ms){ chatTimers.push(setTimeout(fn, ms)); }
  function clearChat(){ chatTimers.forEach(clearTimeout); chatTimers = []; }
  function bubble(cls, text){
    var el = document.createElement('div'); el.className = 'msg ' + cls;
    if(text != null) el.textContent = text; else el.innerHTML = '<i></i><i></i><i></i>';
    chatBody.appendChild(el);
    // 넘치면 오래된 메시지부터 정리
    while(chatBody.scrollHeight > chatBody.clientHeight + 2 && chatBody.children.length > 1) chatBody.removeChild(chatBody.firstElementChild);
    return el;
  }
  function playChat(i){
    clearChat(); var run = ++chatRun;
    chatIdx = i;
    whyTabs.querySelectorAll('.why-tab').forEach(function(t, k){ t.setAttribute('aria-selected', String(k === i)); });
    document.getElementById('chat-name').textContent = CHATS[i].name + ' 님과의 대화';
    [].slice.call(chatBody.children).forEach(function(m){ m.classList.add('leaving'); });
    if(reduceMotion){
      chatBody.innerHTML = '';
      bubble('in', CHATS[i].q); REPLIES.forEach(function(r){ bubble('out' + (r.gold ? ' gold' : ''), r.t); });
      return;
    }
    var t = 350;
    later(function(){ chatBody.innerHTML = ''; bubble('sys', '오늘'); }, t);
    later(function(){ bubble('in typing'); }, t += 300);
    later(function(){ chatBody.lastChild.remove(); bubble('in', CHATS[i].q); }, t += 1000);
    REPLIES.forEach(function(r){
      later(function(){ bubble('out typing'); }, t += 700);
      later(function(){ chatBody.lastChild.remove(); bubble('out' + (r.gold ? ' gold' : ''), r.t); }, t += 950);
    });
    // 다음 사례로 자동 진행
    later(function(){ if(run === chatRun && whyInView && !document.hidden) playChat((i + 1) % CHATS.length); }, t += 3200);
  }
  CHATS.forEach(function(c, i){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'why-tab'; b.setAttribute('role','tab'); b.textContent = c.name;
    b.addEventListener('click', function(){ playChat(i); });
    whyTabs.appendChild(b);
  });
  whyTabs.firstChild.setAttribute('aria-selected','true');
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      var was = whyInView; whyInView = en[0].isIntersecting;
      if(whyInView && !was){ playWhy(); playChat(0); }
      if(!whyInView){ whySec.classList.remove('is-on'); clearChat(); }
    }, {threshold:.4}).observe(whySec);
  } else playChat(0);

  /* ---------------- 빠른 상담 신청 ---------------- */
  var form = document.getElementById('inquiry');
  var iq = {field:'', services:[]};
  function iqChips(el, items, multi, key){
    items.forEach(function(label){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'iq-chip'; b.textContent = label; b.setAttribute('aria-pressed','false');
      b.addEventListener('click', function(){
        if(multi){
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', String(on));
          iq.services = [].slice.call(el.querySelectorAll('[aria-pressed="true"]')).map(function(x){ return x.textContent; });
        } else {
          el.querySelectorAll('.iq-chip').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
          iq.field = label;
        }
      });
      el.appendChild(b);
    });
  }
  var fieldEl = document.getElementById('iq-field'), svcEl = document.getElementById('iq-service');
  iqChips(fieldEl, FIELDS.map(function(f){ return f.name; }).concat(['기타']), false);
  iqChips(svcEl, PLANS.map(function(p){ return p.name; }).concat(['맞춤 견적']), true);
  function pressChip(el, label, multi){
    el.querySelectorAll('.iq-chip').forEach(function(x){
      if(x.textContent === label) x.setAttribute('aria-pressed','true');
      else if(!multi) x.setAttribute('aria-pressed','false');
    });
  }
  // 가격안내에서 선택한 조합을 신청서에 자동으로 채움
  /* ---------------- 견적 조합 → 빠른 상담 신청 (바로 접수) ---------------- */
  var qm = document.getElementById('qm'), qmForm = document.getElementById('qm-form'), qmCombo = null, qmLastFocus = null;
  function comboFromPanel(mode){
    if(mode === 'mix'){
      var tab = tabsEl.querySelector('[aria-selected="true"]'), items = [], total = 0;
      PLANS.forEach(function(p){ var n = qty[p.key] || 0; if(n){ items.push({name:p.name, count:n, price:p.price, subtotal:n * p.price}); total += n * p.price; } });
      return {type:'mix', field:tab ? tab.textContent : '', items:items, total:total};
    }
    return {type:'custom', field:cq.field || '', budget:cq.budget || ''};
  }
  function comboHTML(c){
    var h = '<div class="qs-field">' + esc(c.type === 'mix' ? (c.field || '분야 미선택') + ' 추천 조합' : '맞춤 견적 · ' + (c.field || '분야 미선택')) + '</div>';
    if(c.type === 'mix'){
      c.items.forEach(function(it){ h += '<div class="qs-row"><span>' + esc(it.name) + ' <em>' + it.count + '건 × ' + won(it.price) + '원</em></span><span>' + won(it.subtotal) + '원</span></div>'; });
      h += '<div class="qs-total"><span>월 예상 금액</span><b>' + won(c.total) + '원</b></div><div class="qs-note">부가세 별도 · 부가세 포함 ' + won(Math.round(c.total * 1.1)) + '원</div>';
    } else {
      h += '<div class="qs-row"><span>월 예산</span><span>' + esc(c.budget || '상담 후 결정') + '</span></div>';
    }
    return h;
  }
  function comboText(c){
    if(c.type === 'mix') return '[견적 조합] ' + (c.field ? c.field + ' / ' : '') + c.items.map(function(it){ return it.name + ' ' + it.count + '건'; }).join(', ') + ' / 월 예상 ' + won(c.total) + '원(부가세 별도)';
    return '[맞춤 견적] ' + (c.field ? c.field + ' 분야' : '분야 미선택') + ' / 월 예산 ' + (c.budget || '미선택');
  }
  function qmOpen(c){
    qmCombo = c; qmLastFocus = document.activeElement;
    document.getElementById('qm-sum').innerHTML = comboHTML(c);
    document.getElementById('qm-step-form').hidden = false; document.getElementById('qm-step-done').hidden = true;
    document.getElementById('qm-err').textContent = ''; qmForm.phone.classList.remove('is-invalid');
    qm.hidden = false; document.documentElement.classList.add('qm-open');
    setTimeout(function(){ qmForm.phone.focus(); }, 60);
  }
  function qmClose(){ qm.hidden = true; document.documentElement.classList.remove('qm-open'); if(qmLastFocus && qmLastFocus.focus) qmLastFocus.focus(); }
  qm.addEventListener('click', function(e){ if(e.target.closest('[data-qm-close]')) qmClose(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !qm.hidden) qmClose(); });
  // 서버가 없을 때(미리보기 등)는 기존처럼 아래 상담 신청서에 내용을 채워 안내
  function prefillContact(c){
    svcEl.querySelectorAll('.iq-chip').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
    if(c.field){ pressChip(fieldEl, c.field); iq.field = c.field; }
    if(c.type === 'mix') c.items.forEach(function(it){ pressChip(svcEl, it.name, true); }); else pressChip(svcEl, '맞춤 견적', true);
    iq.services = [].slice.call(svcEl.querySelectorAll('[aria-pressed="true"]')).map(function(x){ return x.textContent; });
    form.message.value = comboText(c);
    if(qmForm.phone.value) form.phone.value = qmForm.phone.value;
    if(qmForm.office.value) form.office.value = qmForm.office.value;
  }
  document.querySelectorAll('.est-panel .est-cta').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      qmOpen(comboFromPanel(btn.closest('.est-panel').dataset.panel));
    });
  });
  qmForm.addEventListener('submit', function(e){
    e.preventDefault();
    var err = document.getElementById('qm-err'), phone = qmForm.phone.value.trim();
    qmForm.phone.classList.remove('is-invalid'); err.textContent = '';
    if(!/^[0-9\-\s+()]{9,}$/.test(phone)){ qmForm.phone.classList.add('is-invalid'); err.textContent = '연락받으실 번호를 입력해 주세요.'; qmForm.phone.focus(); return; }
    if(!qmForm.agree.checked){ err.textContent = '개인정보 수집·이용에 동의해 주세요.'; return; }
    var c = qmCombo, btn = qmForm.querySelector('.qm-submit'); btn.disabled = true; btn.textContent = '접수 중…';
    var services = c.type === 'mix' ? c.items.map(function(it){ return it.name; }) : ['맞춤 견적'];
    fetch('/api/inquiry', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
      office:qmForm.office.value.trim(), phone:phone, field:c.field, services:services, message:comboText(c), agree:true,
      hp:qmForm.website.value, source:'estimate', combo:c
    })})
      .then(function(r){ if(!r.ok) throw new Error('fail'); return r.json(); })
      .then(function(){
        document.getElementById('qm-sum-done').innerHTML = comboHTML(c);
        document.getElementById('qm-done-d').textContent = '확인 후 ' + phone + '로 빠르게 연락드리겠습니다.';
        document.getElementById('qm-step-form').hidden = true; document.getElementById('qm-step-done').hidden = false;
        qmForm.reset();
      })
      .catch(function(){
        // 서버 접수가 안 되면 아래 신청서로 안내
        prefillContact(c); qmClose();
        var t = document.getElementById('contact'); var y = 0, n = t; while(n){ y += n.offsetTop; n = n.offsetParent; }
        window.scrollTo({top:y, behavior:reduceMotion ? 'auto' : 'smooth'});
      })
      .then(function(){ btn.disabled = false; btn.textContent = '상담 신청하기'; });
  });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var err = document.getElementById('iq-error'), phone = form.phone.value.trim();
    form.phone.classList.remove('is-invalid'); err.textContent = '';
    if(!/^[0-9\-\s+()]{9,}$/.test(phone)){ form.phone.classList.add('is-invalid'); err.textContent = '연락받으실 번호를 입력해 주세요.'; form.phone.focus(); return; }
    if(!form.agree.checked){ err.textContent = '개인정보 수집·이용에 동의해 주세요.'; return; }
    var text = '[애드스팟 상담 신청]\n사무소: ' + (form.office.value.trim() || '-') + '\n연락처: ' + phone +
      '\n분야: ' + (iq.field || '-') + '\n관심 서비스: ' + (iq.services.join(', ') || '-') +
      (form.message.value.trim() ? '\n내용: ' + form.message.value.trim() : '');
    var done = document.getElementById('iq-done'), d = document.getElementById('iq-done-d');
    var btn = form.querySelector('.iq-submit'); btn.disabled = true; var btnText = btn.textContent; btn.textContent = '접수 중…';
    var payload = {office:form.office.value.trim(), phone:phone, field:iq.field || '', services:iq.services, message:form.message.value.trim(), agree:true, hp:(form.website && form.website.value) || ''};
    // 1순위: 홈페이지 서버에 접수 → 관리자 페이지에서 확인
    fetch('/api/inquiry', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)})
      .then(function(r){ if(!r.ok) throw new Error('fail'); return r.json(); })
      .then(function(){
        done.classList.add('is-ok');
        done.querySelector('.iq-done-t').textContent = '상담 신청이 접수되었습니다';
        d.textContent = '확인 후 빠르게 연락드리겠습니다. 급하신 경우 전화나 카카오톡으로 바로 문의해 주세요.';
        done.hidden = false; form.reset(); document.querySelectorAll('#inquiry .iq-chip').forEach(function(c){ c.setAttribute('aria-pressed','false'); }); iq.field = ''; iq.services = [];
      })
      .catch(function(){ fallbackSend(); })
      .then(function(){ btn.disabled = false; btn.textContent = btnText; });
    return;
    // 2순위(서버가 없는 미리보기 등): 문자 앱 열기 / 내용 복사
    function fallbackSend(){
    var isMobile = window.matchMedia('(max-width:1024px)').matches || /iPhone|Android/i.test(navigator.userAgent);
    if(isMobile){
      d.textContent = '아래 버튼을 누르면 작성하신 내용이 문자로 채워진 채 열립니다. 전송만 눌러주세요.';
      var sms = done.querySelector('a[href^="tel:"]');
      sms.textContent = '문자로 보내기';
      sms.href = 'sms:' + PHONE_TEL + (/iPhone|iPad/i.test(navigator.userAgent) ? '&' : '?') + 'body=' + encodeURIComponent(text);
    } else {
      d.textContent = '작성하신 내용이 복사되었습니다. 카카오톡 상담창에 붙여넣거나, ' + PHONE_TEXT + '로 전화 주시면 바로 확인해 드립니다.';
      try{ navigator.clipboard && navigator.clipboard.writeText(text); }catch(e2){}
    }
    done.hidden = false;
    }
  });
  form.addEventListener('click', function(e){ if(e.target.closest('.iq-done') && e.target === document.getElementById('iq-done')) document.getElementById('iq-done').hidden = true; });

  /* ---------------- 포트폴리오: 일정한 속도로 이어서 흐름 ---------------- */
  // 속도(px/초)만 정하면 줄 길이와 관계없이 같은 빠르기로 흐릅니다.
  var SPEED_PC = 85, SPEED_MO = 55;
  var tracks = document.querySelectorAll('.marquee-track');
  function setMarqueeSpeed(){
    var sp = window.matchMedia('(max-width:767px)').matches ? SPEED_MO : SPEED_PC;
    tracks.forEach(function(t){
      var g = t.querySelector('.marquee-group');
      var w = g ? g.getBoundingClientRect().width : 0;
      if(w > 0) t.style.setProperty('--dur', (w / sp).toFixed(2) + 's');
    });
  }
  setMarqueeSpeed();
  document.querySelectorAll('.marquee img').forEach(function(im){ if(!im.complete) im.addEventListener('load', setMarqueeSpeed, {once:true}); });
  var mqTimer; window.addEventListener('resize', function(){ clearTimeout(mqTimer); mqTimer = setTimeout(setMarqueeSpeed, 150); });
};
(window.__adspotContent || Promise.resolve(null)).then(__adspotStart, function(){ __adspotStart(null); });
