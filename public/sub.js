/* 안내 페이지: 관리자에서 저장한 콘텐츠(가격·분야·연락처·사업자 정보)를 불러와 반영 */
(function(){
  'use strict';
  if(location.protocol === 'file:') return;
  var D = window.ADSPOT_DEFAULTS || {};
  var has = function(v){ return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length); };
  var esc = function(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var won = function(n){ return (+n || 0).toLocaleString('ko-KR'); };

  function apply(C){
    // 값 합치기 (메인 페이지와 같은 규칙)
    var plans = (D.plans || []).map(function(p){
      var o = (C.plans || []).filter(function(x){ return x && x.key === p.key; })[0] || {}, r = Object.assign({}, p);
      if(has(o.name)) r.name = String(o.name);
      if(has(o.desc)) r.desc = String(o.desc);
      if(has(o.price) && !isNaN(+o.price)) r.price = +o.price;
      return r;
    });
    var fields = (has(C.fields) ? C.fields : (D.fields || [])).filter(function(f){ return f && f.name && f.mix; });
    var month = function(mix){ return plans.reduce(function(s, p){ return s + (+mix[p.key] || 0) * p.price; }, 0); };
    var contact = Object.assign({}, D.contact || {}, C.contact || {});
    var footer = Object.assign({}, D.footer || {}, C.footer || {});

    // 채널·단가 표
    document.querySelectorAll('[data-sub="plans"]').forEach(function(tb){
      tb.innerHTML = plans.map(function(p){ return '<tr><th scope="row">' + esc(p.name) + '</th><td><b>' + won(p.price) + '</b>원 / 건</td><td>' + esc(p.desc) + '</td></tr>'; }).join('');
    });
    // 채널 카드 (법률마케팅 페이지)
    document.querySelectorAll('[data-sub="plan-cards"]').forEach(function(box){
      box.innerHTML = plans.map(function(p){ return '<div class="card"><span class="num">' + won(p.price) + '원</span><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p></div>'; }).join('');
    });
    // 분야별 추천 조합 표
    document.querySelectorAll('[data-sub="fields"]').forEach(function(tb){
      tb.innerHTML = fields.map(function(f){ var m = f.mix;
        return '<tr><th scope="row">' + esc(f.name) + '</th><td>' + (+m.cafe || 0) + '건</td><td>' + (+m.influencer || 0) + '건</td><td>' + (+m.blog || 0) + '건</td></tr>'; }).join('');   // 월 합계 금액은 표시하지 않음
    });
    // FAQ 속 금액·전화번호
    var tots = fields.map(function(f){ return month(f.mix); });
    var set = function(k, v){ document.querySelectorAll('[data-faq="' + k + '"]').forEach(function(el){ el.textContent = v; }); };
    set('plans', plans.map(function(p){ return p.name + ' 건당 ' + won(p.price) + '원'; }).join(', '));
    if(tots.length) set('range', '월 약 ' + Math.round(Math.min.apply(null, tots) / 10000) + '만~' + Math.round(Math.max.apply(null, tots) / 10000) + '만 원');
    if(has(contact.phoneText)) set('phone', contact.phoneText);
    // 전화·카카오톡 버튼
    var tel = String(contact.phoneTel || contact.phoneText || '').replace(/[^0-9+]/g, '');
    if(tel) document.querySelectorAll('a[data-phone]').forEach(function(a){ a.href = 'tel:' + tel; });
    if(has(contact.phoneText)) document.querySelectorAll('[data-phone-text]').forEach(function(el){ el.textContent = contact.phoneText; });
    if(has(contact.kakaoUrl) && /^https?:\/\//.test(contact.kakaoUrl)) document.querySelectorAll('a[data-kakao]').forEach(function(a){ a.href = contact.kakaoUrl; });
    // 푸터 사업자 정보
    document.querySelectorAll('[data-c]').forEach(function(el){
      var v = footer[el.getAttribute('data-c')]; if(!has(v)) return;
      el.textContent = v;
      if(el.tagName === 'A') el.href = 'tel:' + String(v).replace(/[^0-9+]/g, '');
    });
    // 지역 추천 패키지 월 금액 (현재 단가로 다시 계산)
    var priceOf = {}; plans.forEach(function(p){ priceOf[p.key] = p.price; });
    document.querySelectorAll('[data-pkg]').forEach(function(box){
      var total = ['cafe','influencer','blog'].reduce(function(s, k){ return s + (+box.getAttribute('data-' + k) || 0) * (priceOf[k] || 0); }, 0);
      var txt = '월 약 ' + Math.round(total / 10000).toLocaleString('ko-KR') + '만 원';
      box.querySelectorAll('[data-pkg-total]').forEach(function(el){ el.textContent = txt; });
      set('pkg', txt);
    });
    // 관리자에서 고친 문구 (왜 애드스팟인가 등)
    var T = Object.assign({}, D.texts || {}, C.texts || {});
    document.querySelectorAll('[data-t]').forEach(function(el){
      var v = T[el.getAttribute('data-t')]; if(!has(v)) return;
      var hl = el.getAttribute('data-hl');
      el.innerHTML = hl ? esc(v).replace(hl, '<em>' + esc(hl) + '</em>') : esc(v);
    });
    // 포트폴리오 로고
    var pf = has(C.portfolio) ? C.portfolio : (D.portfolio || []);
    document.querySelectorAll('[data-sub="portfolio"]').forEach(function(ul){
      ul.innerHTML = pf.filter(function(x){ return x && x.url; }).map(function(x){
        var src = /^(https?:)?\//.test(x.url) ? x.url : '/' + x.url;
        return '<li><img loading="lazy" src="' + esc(src) + '" alt="' + esc(x.name || '') + '"></li>'; }).join('');
    });
    initCalc(plans, fields);
    // 상담 신청서 분야 선택지
    document.querySelectorAll('[data-sub="field-options"]').forEach(function(sel){
      var cur = sel.value;
      sel.innerHTML = '<option value="">선택</option>' + fields.map(function(f){ return '<option>' + esc(f.name) + '</option>'; }).join('') + '<option>기타</option>';
      sel.value = cur;
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(sc){
      try{
        var g = JSON.parse(sc.textContent), items = document.querySelectorAll('.faq-item .faq-a');
        (g['@graph'] || []).forEach(function(n){
          if(n['@type'] === 'Service' && n.offers) n.offers = plans.map(function(p){
            return {'@type':'Offer', name:p.name, priceSpecification:{'@type':'UnitPriceSpecification', price:p.price, priceCurrency:'KRW', unitText:'건', valueAddedTaxIncluded:false}};
          });
          if(n['@type'] === 'FAQPage') n.mainEntity.forEach(function(q, i){ if(items[i]) q.acceptedAnswer.text = items[i].textContent.trim(); });
        });
        sc.textContent = JSON.stringify(g);
      }catch(e){}
    });
  }

  /* ---------------- 방문 통계 · 행동 기록 (개인정보 없이 페이지·유입 경로·행동만 기록) ---------------- */
  (function(){
    try{
      if(location.protocol === 'file:' || /^\/admin/.test(location.pathname)) return;
      var q = new URLSearchParams(location.search);
      var vid = localStorage.getItem('adspot-vid');
      if(!vid){ vid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4); localStorage.setItem('adspot-vid', vid); }
      var saved = null; try{ saved = JSON.parse(sessionStorage.getItem('adspot-src') || 'null'); }catch(e){}
      var host = ''; try{ host = document.referrer ? new URL(document.referrer).hostname : ''; }catch(e){}
      var ext = host && host !== location.hostname;
      // 유입 채널 판별: 광고(파워링크) 표시가 있으면 광고, 아니면 들어온 곳(검색·블로그·카페 등)
      var paid = q.get('n_media') || q.get('ch') === 'pl' || /^(cpc|ppc|paid|powerlink)$/i.test(q.get('utm_medium') || '') || !!q.get('r');   // 지역 광고 랜딩(?r=)은 광고 전용 주소
      var s = paid ? (q.get('n_media') || q.get('ch') === 'pl' || q.get('r') ? '네이버 파워링크' : '광고(' + (q.get('utm_source') || '기타') + ')')
            : (q.get('utm_source') ? q.get('utm_source') : (ext ? (/blog\.naver/.test(host) ? '네이버 블로그' : /cafe\.naver/.test(host) ? '네이버 카페' : /(^|\.)naver\.com$/.test(host) ? '네이버 검색'
              : /google\./.test(host) ? '구글 검색' : /daum\.net/.test(host) ? '다음 검색' : /kakao/.test(host) ? '카카오' : /bing\./.test(host) ? '빙 검색' : /(instagram|facebook|youtube)\./.test(host) ? 'SNS' : '다른 사이트')
            : ((function(){ try{ return sessionStorage.getItem('adspot-entry'); }catch(e){ return ''; } })() || (saved && saved.src) || (host ? '사이트 내 이동' : '직접 방문'))));   // 사이트 안 이동은 처음 들어온 채널을 이어받음
      // 이 방문(세션)이 처음 들어온 채널을 기억 → 상담 신청 때 함께 저장
      try{ if(!sessionStorage.getItem('adspot-entry') && s !== '사이트 내 이동') sessionStorage.setItem('adspot-entry', s); }catch(e){}
      var r = (q.get('r') || (saved && saved.region) || '').toLowerCase().slice(0, 20);
      var k = q.get('n_keyword') || q.get('n_query') || q.get('utm_term') || (saved && saved.kw) || '';
      if(paid || q.get('utm_source')){ try{ sessionStorage.setItem('adspot-src', JSON.stringify({region: r, kw: k, src: s})); }catch(e){} }
      var sid = sessionStorage.getItem('adspot-sid');
      if(!sid){ sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5); sessionStorage.setItem('adspot-sid', sid); }
      window.__adspotSid = sid;
      var beacon = function(obj){
        var data = JSON.stringify(obj);
        if(navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([data], {type: 'application/json'}));
        else fetch('/api/track', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: data, keepalive: true});
      };
      beacon({p: location.pathname, v: vid, sid: sid, s: s, r: r, k: k});
      var once = {};
      var act = window.__adspotAct = function(a, val, uniq){
        if(uniq){ if(once[a]) return; once[a] = 1; }
        beacon({type: 'act', p: location.pathname, v: vid, sid: sid, a: String(a).slice(0, 40), val: val == null ? '' : String(val).slice(0, 60)});
      };
      // 클릭 행동 (전화 · 카톡 · 메뉴 · 상담 버튼 · 견적 계산기 · FAQ)
      document.addEventListener('click', function(e){
        var el = e.target.closest && e.target.closest('a, button, summary, [role=tab]'); if(!el) return;
        var href = el.getAttribute('href') || '', txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
        if(/^tel:/.test(href)) return act('전화 클릭', href.replace('tel:', ''));
        if(/kakao/.test(href) || el.hasAttribute('data-kakao')) return act('카톡 클릭');
        if(el.closest('#nav, .nav')) return act('메뉴 이동', txt);
        if(el.closest('.faq-item') && el.tagName === 'SUMMARY') return act('FAQ 열기', txt);
        if(el.closest('#est-tabs, .est-tabs') || (el.tagName === 'BUTTON' && el.closest('#pricing'))) return act('견적 계산기 사용', txt, true);
        if(/^\/regions\//.test(href) || /marketing\/$/.test(href)) return act('안내 페이지 이동', txt);
      }, true);
      // 신청서 작성 시작 (처음 입력할 때 한 번)
      document.addEventListener('focusin', function(e){ if(e.target.closest && e.target.closest('form') && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) act('신청서 작성 시작', '', true); }, true);
      // 스크롤 깊이
      var marks = [50, 90];
      addEventListener('scroll', function(){
        var h = document.documentElement.scrollHeight - innerHeight; if(h <= 0) return;
        var pct = scrollY / h * 100;
        while(marks.length && pct >= marks[0]){ var m = marks.shift(); act(m >= 90 ? '페이지 끝까지 스크롤' : '절반 이상 스크롤', '', true); }
      }, {passive: true});
      // 머문 시간 (페이지를 떠나거나 다른 앱으로 갈 때 기록)
      var t0 = Date.now(), sent = false;
      var stay = function(){ if(sent) return; var sec = Math.round((Date.now() - t0) / 1000); if(sec >= 1){ sent = true; act('머문 시간', sec); } };
      addEventListener('pagehide', stay);
      document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') stay(); });
    }catch(e){}
  })();

  // 지역 페이지 상담 신청 → 관리자 문의 목록에 '유입: ○○ 지역 페이지'로 저장
  document.querySelectorAll('form.rform').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = form.querySelector('.rmsg'), btn = form.querySelector('button[type=submit]');
      var phone = form.phone.value.trim();
      msg.className = 'rmsg';
      if(!/^[0-9\-\s+()]{9,}$/.test(phone)){ msg.textContent = '연락처를 정확히 입력해 주세요.'; msg.classList.add('err'); form.phone.focus(); return; }
      if(!form.agree.checked){ msg.textContent = '개인정보 수집·이용에 동의해 주세요.'; msg.classList.add('err'); return; }
      var saved = null; try{ saved = JSON.parse(sessionStorage.getItem('adspot-src') || 'null'); }catch(e2){}
      var q = {}; try{ q = Object.fromEntries(new URLSearchParams(location.search)); }catch(e3){}
      var ad = { region: form.getAttribute('data-region') || '', src: q.n_media ? '네이버 파워링크' : ((saved && saved.src) || '지역 페이지'), kw: q.n_keyword || q.n_query || (saved && saved.kw) || '' };
      btn.disabled = true; var label = btn.textContent; btn.textContent = '접수 중…';
      fetch('/api/inquiry', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        office: form.office.value.trim(), phone: phone, field: form.field.value, services: [], message: form.message.value.trim(),
        agree: true, hp: form.website.value, source: 'form', ad: ad, page: location.pathname, entry: (function(){ try{ return sessionStorage.getItem('adspot-entry') || ''; }catch(e){ return ''; } })(), sid: window.__adspotSid || '' })})
        .then(function(r){ if(!r.ok) throw new Error('fail'); return r.json(); })
        .then(function(){ form.reset(); msg.textContent = '상담 신청이 접수되었습니다. 확인 후 빠르게 연락드리겠습니다.'; msg.classList.add('ok'); })
        .catch(function(){ msg.textContent = '접수 중 문제가 생겼습니다. 전화나 카카오톡으로 문의해 주세요.'; msg.classList.add('err'); })
        .then(function(){ btn.disabled = false; btn.textContent = label; });
    });
  });

  /* ---------------- 지역 페이지 월 광고비 계산기 ---------------- */
  function initCalc(plans, fields){
    var box = document.querySelector('[data-calc]'); if(!box || !plans || !plans.length) return;
    var region = box.getAttribute('data-calc');
    var pk = document.querySelector('[data-pkg]');
    var num = function(el, k){ return el ? (+el.getAttribute('data-' + k) || 0) : 0; };
    var opts = [];
    if(pk) opts.push({name: region + ' 추천', field: '', mix: {cafe: num(pk,'cafe'), influencer: num(pk,'influencer'), blog: num(pk,'blog')}});
    (fields || []).forEach(function(f){ opts.push({name: f.name, field: f.name, mix: f.mix}); });
    var won = function(n){ return (Math.round(n) || 0).toLocaleString('ko-KR'); };
    var esc = function(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
    var qty = {}, cur = 0;
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 금액이 바뀔 때 숫자가 굴러가듯 올라가거나 내려감 (메인 페이지와 같은 느낌)
    function roll(el, to){
      var from = +el.getAttribute('data-v') || 0; el.setAttribute('data-v', to);
      if(el._raf) cancelAnimationFrame(el._raf);
      if(still || from === to){ el.textContent = won(to); return; }
      var t0 = null, dur = 520;
      (function step(t){
        if(t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = won(from + (to - from) * e);
        if(k < 1) el._raf = requestAnimationFrame(step);
      })(performance.now());
    }
    box.innerHTML =
      '<div class="calc-tabs" role="tablist" aria-label="분야 선택">' + opts.map(function(o, i){ return '<button type="button" role="tab" class="calc-tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + esc(o.name) + '</button>'; }).join('') + '</div>' +
      '<ul class="calc-rows">' + plans.map(function(p){
        return '<li class="calc-row" data-k="' + esc(p.key) + '"><div class="calc-name"><b>' + esc(p.name) + '</b><small>건당 ' + won(p.price) + '원</small></div>' +
          '<div class="calc-qty"><button type="button" data-d="-1" aria-label="' + esc(p.name) + ' 1건 줄이기">−</button><output aria-live="polite">0</output><span>건</span><button type="button" data-d="1" aria-label="' + esc(p.name) + ' 1건 늘리기">+</button></div>' +
          '<p class="calc-sub"><b>0</b>원</p></li>'; }).join('') + '</ul>' +
      '<div class="calc-total"><div><p class="calc-label">월 예상 금액 <span>부가세 별도</span></p><p class="calc-sum"><b>0</b>원</p></div><p class="calc-vat">부가세 포함 <span>0</span>원</p></div>' +
      '<button type="button" class="btn btn-gold calc-cta">이 조합으로 상담 신청</button>';
    function render(){
      var total = 0;
      plans.forEach(function(p){
        var row = box.querySelector('.calc-row[data-k="' + p.key + '"]'), n = qty[p.key] || 0, sub = n * p.price; total += sub;
        row.querySelector('output').textContent = n; roll(row.querySelector('.calc-sub b'), sub);
      });
      roll(box.querySelector('.calc-sum b'), total);
      roll(box.querySelector('.calc-vat span'), Math.round(total * 1.1));
      return total;
    }
    function pick(i){
      cur = i; plans.forEach(function(p){ qty[p.key] = +opts[i].mix[p.key] || 0; });
      box.querySelectorAll('.calc-tab').forEach(function(t){ t.setAttribute('aria-selected', String(+t.getAttribute('data-i') === i)); });
      render();
    }
    box.addEventListener('click', function(e){
      var t = e.target.closest('.calc-tab'); if(t){ pick(+t.getAttribute('data-i')); return; }
      var b = e.target.closest('.calc-qty button');
      if(b){ var k = b.closest('.calc-row').getAttribute('data-k'); qty[k] = Math.max(0, Math.min(99, (qty[k] || 0) + (+b.getAttribute('data-d')))); render(); return; }
      if(e.target.closest('.calc-cta')){
        var total = render(), o = opts[cur];
        var items = plans.filter(function(p){ return qty[p.key]; }).map(function(p){ return p.name + ' ' + qty[p.key] + '건'; });
        var form = document.querySelector('form.rform');
        if(form){
          if(o.field && form.field) form.field.value = o.field;
          form.message.value = '[견적 조합] ' + o.name + ' / ' + (items.join(', ') || '건수 미선택') + ' / 월 예상 ' + won(total) + '원(부가세 별도)';
          var target = document.getElementById('apply') || form;
          target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
          setTimeout(function(){ try{ form.phone.focus({preventScroll: true}); }catch(e2){ form.phone.focus(); } }, 450);
        }
      }
    });
    pick(0);
  }

  initCalc((D.plans || []), (D.fields || []).filter(function(f){ return f && f.name && f.mix; }));

  /* ---------------- 무료 노출 진단 버튼 → 상담 신청서 채우기 ---------------- */
  document.querySelectorAll('[data-diag]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      var form = document.querySelector('form.rform'); if(!form) return;
      e.preventDefault();
      form.message.value = '[무료 노출 진단 요청] ' + btn.getAttribute('data-diag') + ' 지역 키워드 노출 상태 진단을 받고 싶습니다.';
      var target = document.getElementById('apply') || form;
      target.scrollIntoView({behavior: (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth', block: 'start'});
      setTimeout(function(){ try{ form.phone.focus({preventScroll: true}); }catch(e2){ form.phone.focus(); } }, 450);
    });
  });

  /* ---------------- 생활권 탭 ---------------- */
  document.querySelectorAll('.zt').forEach(function(box){
    box.classList.add('js-zt');
    var tabs = [].slice.call(box.querySelectorAll('.zt-tab')), panels = [].slice.call(box.querySelectorAll('.zt-panel'));
    function show(i, focus){
      tabs.forEach(function(t, k){ t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach(function(p, k){ p.hidden = k !== i; });
      if(focus) tabs[i].focus();
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ show(i); });
      t.addEventListener('keydown', function(e){
        var n = tabs.length, j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
        if(j > -1){ e.preventDefault(); show(j, true); }
      });
    });
    show(0);
  });

  /* ---------------- 함께하는 시간: 메인과 같은 카운트업 → LIVE ---------------- */
  function initClock(firmList){
    var clock = document.querySelector('.tm-sec .clock'), list = clock && clock.querySelector('.clock-list'); if(!list) return;
    var firms = (firmList || []).filter(function(f){ return f && f.name && !isNaN(new Date(f.start).getTime()); });
    var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function pad(n){ return n < 10 ? '0' + n : '' + n; }
    function parts(ms){ var t = Math.max(0, Math.floor(ms / 1000)); return {d:Math.floor(t / 86400).toLocaleString('ko-KR'), h:pad(Math.floor(t % 86400 / 3600)), m:pad(Math.floor(t % 3600 / 60)), s:pad(t % 60)}; }
    var STRIP = ''; for(var q = 0; q < 20; q++) STRIP += '<i>' + (q % 10) + '</i>';
    function buildGroup(el, str){
      el.innerHTML = ''; var slots = [];
      Array.from(str).forEach(function(ch){
        if(/\d/.test(ch)){ var w = document.createElement('span'); w.className = 'dg'; var s = document.createElement('span'); s.className = 'dg-s'; s.innerHTML = STRIP; w.appendChild(s); el.appendChild(w); slots.push({s:s, idx:0}); }
        else { var sep = document.createElement('span'); sep.className = 'dg-sep'; sep.textContent = ch; el.appendChild(sep); }
      });
      return slots;
    }
    function place(slot, idx, dur, delay){
      slot.idx = idx;
      slot.s.style.transition = dur ? 'transform ' + dur + 'ms cubic-bezier(.2,.8,.2,1) ' + (delay || 0) + 'ms' : 'none';
      slot.s.style.transform = 'translate3d(0,' + (-idx * 1.12).toFixed(2) + 'em,0)';
      clearTimeout(slot.t);
      if(dur && idx >= 10) slot.t = setTimeout(function(){ place(slot, idx - 10, 0); }, dur + (delay || 0) + 40);
    }
    function roll(slots, str, dur){
      var digits = str.replace(/\D/g, '');
      slots.forEach(function(sl, i){ var nd = +digits[i], cur = sl.idx % 10; if(nd === cur) return; var steps = (nd - cur + 10) % 10; if(sl.idx >= 10) place(sl, sl.idx - 10, 0); void sl.s.offsetWidth; place(sl, sl.idx + steps, dur); });
    }
    function spin(slots, str, dur, baseDelay){
      var digits = str.replace(/\D/g, '');
      slots.forEach(function(sl){ place(sl, 0, 0); }); void (slots[0] && slots[0].s.offsetWidth);
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ slots.forEach(function(sl, i){ place(sl, 10 + (+digits[i]), dur, baseDelay + i * 45); }); }); });
    }
    var rows = firms.map(function(f){
      var li = document.createElement('li'); li.className = 'clock-row';
      li.innerHTML = '<div class="clock-meta"><span class="clock-name"></span><span class="clock-state">집계 중</span></div>' +
        '<div class="timer" role="timer"><span class="n d"></span><span class="u">일</span><span class="c">:</span><span class="n h"></span><span class="u">시간</span><span class="c">:</span><span class="n m"></span><span class="u">분</span><span class="c">:</span><span class="n s"></span><span class="u">초</span></div>';
      li.querySelector('.clock-name').textContent = f.name; list.appendChild(li);
      var start = new Date(f.start).getTime(), p = parts(Date.now() - start);
      var r = {el:li, start:start, state:li.querySelector('.clock-state'), busy:false, timerEl:li.querySelector('.timer')};
      r.g = {d:buildGroup(li.querySelector('.d'), p.d.replace(/\d/g, '0')), h:buildGroup(li.querySelector('.h'), '00'), m:buildGroup(li.querySelector('.m'), '00'), s:buildGroup(li.querySelector('.s'), '00')};
      return r;
    });
    var moreBtn = clock.querySelector('.clock-more');
    if(moreBtn && firms.length > 3){ moreBtn.hidden = false; moreBtn.addEventListener('click', function(){ clock.classList.add('is-expanded'); }); }
    function aria(r, p){ r.timerEl.setAttribute('aria-label', p.d + '일 ' + p.h + '시간 ' + p.m + '분 ' + p.s + '초'); }
    function spinRow(r, i, dur, st){ var p = parts(Date.now() - r.start + dur); r.busy = true; var b = i * st; spin(r.g.d, p.d, dur, b); spin(r.g.h, p.h, dur, b + 80); spin(r.g.m, p.m, dur, b + 140); spin(r.g.s, p.s, dur, b + 200); aria(r, p); setTimeout(function(){ r.busy = false; tickRow(r); }, dur + b + 300); }
    function tickRow(r){ if(r.busy) return; var p = parts(Date.now() - r.start); roll(r.g.d, p.d, 600); roll(r.g.h, p.h, 600); roll(r.g.m, p.m, 600); roll(r.g.s, p.s, 520); aria(r, p); }
    function setStatic(r){ var p = parts(Date.now() - r.start); ['d','h','m','s'].forEach(function(k){ var dg = p[k].replace(/\D/g, ''); r.g[k].forEach(function(sl, i){ place(sl, +dg[i], 0); }); }); aria(r, p); }
    var started = false, inView = false, replay = null, lastStart = 0, REPLAY = 5000, SPIN = 1400, STAG = 90;
    function goLive(){
      rows.forEach(function(r){ r.el.classList.add('is-live'); r.state.textContent = 'LIVE'; });
      (function tick(){ rows.forEach(tickRow); clock.classList.add('colon-off'); setTimeout(function(){ clock.classList.remove('colon-off'); }, 500); setTimeout(tick, 1000 - (Date.now() % 1000) + 5); })();
      schedule();
    }
    function schedule(){
      clearTimeout(replay); if(reduceMotion) return;
      var wait = Math.max(0, REPLAY - (performance.now() - lastStart));
      replay = setTimeout(function(){ lastStart = performance.now(); if(inView && !document.hidden) rows.forEach(function(r, i){ spinRow(r, i, SPIN, STAG); }); schedule(); }, wait);
    }
    function countUp(){
      if(started) return; started = true;
      if(reduceMotion){ rows.forEach(setStatic); goLive(); return; }
      lastStart = performance.now(); rows.forEach(function(r, i){ spinRow(r, i, 1800, 110); }); setTimeout(goLive, 1800 + 110 * rows.length);
    }
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ var was = inView; inView = en[0].isIntersecting; if(inView && !started) countUp(); else if(inView && !was && started){ lastStart = 0; schedule(); } }, {threshold:.08}).observe(clock);
    } else countUp();
  }

  /* ---------------- 함께하는 시간 · 포트폴리오 (메인 페이지와 같은 데이터) ---------------- */
  var PF_LEGACY = ['assets/portfolio/jeiel.png','assets/portfolio/changkyung.png','assets/portfolio/yungang.png','assets/portfolio/anlab.png','assets/portfolio/saero.png','assets/portfolio/central.png','assets/portfolio/simpyeong.png'];
  var sharedDone = false;
  function pfSrc(url){
    var m = /^\/?assets\/portfolio\/([a-z0-9_-]+)\.png$/i.exec(url || '');
    if(m) return '/assets/portfolio/sm/' + m[1] + '.webp';   // 기본 로고는 가벼운 버전
    return /^(https?:|\/)/.test(url) ? url : '/' + url;
  }
  function initPortfolio(C){
    var box = document.querySelector('.pf-sec'); if(!box) return;
    var list = Array.isArray(C.portfolio) ? C.portfolio.filter(function(p){ return p && p.url; }) : [];
    var legacy = list.length === PF_LEGACY.length && list.every(function(p, i){ return p.url === PF_LEGACY[i]; });
    if(list.length && !legacy){
      var li = function(p, h){ return '<li><img src="' + esc(pfSrc(p.url)) + '" alt="' + (h ? '' : esc(p.name || '')) + '" loading="lazy" decoding="async" height="52"></li>'; };
      var grp = function(L){ return '<ul class="marquee-group">' + L.map(function(p){ return li(p); }).join('') + '</ul><ul class="marquee-group" aria-hidden="true">' + L.map(function(p){ return li(p, true); }).join('') + '</ul>'; };
      var pc = box.querySelector('.marquee-pc'), mo = box.querySelector('.marquee-mo'), half = Math.ceil(list.length / 2);
      if(pc) pc.innerHTML = '<div class="marquee-track">' + grp(list) + '</div>';
      if(mo) mo.innerHTML = '<div class="marquee-track">' + grp(list.slice(0, half)) + '</div>' + (list.length > 1 ? '<div class="marquee-track is-reverse">' + grp(list.slice(half)) + '</div>' : '');
    }
    var SPEED_PC = 85, SPEED_MO = 55;
    function setSpeed(){
      var sp = window.matchMedia('(max-width:767px)').matches ? SPEED_MO : SPEED_PC;
      box.querySelectorAll('.marquee-track').forEach(function(t){ var g = t.querySelector('.marquee-group'), w = g ? g.getBoundingClientRect().width : 0; if(w > 0) t.style.setProperty('--dur', (w / sp).toFixed(2) + 's'); });
    }
    setSpeed();
    box.querySelectorAll('img').forEach(function(im){ if(!im.complete) im.addEventListener('load', setSpeed, {once:true}); });
    var tm; window.addEventListener('resize', function(){ clearTimeout(tm); tm = setTimeout(setSpeed, 150); });
  }
  function applySharedTexts(C){
    var TX = C.texts || {}, DT = D.texts || {};
    document.querySelectorAll('.tm-sec [data-edit], .pf-sec [data-edit]').forEach(function(el){
      var k = el.getAttribute('data-edit'), v = TX[k];
      if(!has(v) || v === DT[k]) return;
      el.innerHTML = esc(v).replace(/\[([^\]]+)\]/g, '<em>$1</em>').replace(/\n/g, '<br>');
    });
  }
  function initShared(C){
    if(sharedDone) return; sharedDone = true;
    C = C || {};
    applySharedTexts(C);
    initPortfolio(C);
    initClock((Array.isArray(C.firms) && C.firms.length) ? C.firms : (D.firms || []));
  }

  /* ---------------- 지역 페이지 움직임: 화면에 들어올 때 한 번 ---------------- */
  (function(){
    if(!('IntersectionObserver' in window) || !document.body.classList.contains('rg')) return;
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.documentElement; root.classList.add('js-rv');
    var io = new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); if(e.target.__onIn){ var f = e.target.__onIn; e.target.__onIn = null; f(); } io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px', threshold:.12});
    var watch = function(el, i, fn){ if(!el) return; el.classList.add('rv'); if(i != null) el.style.setProperty('--i', i); if(fn) el.__onIn = fn; io.observe(el); };
    var watchOnly = function(el, fn){ if(!el) return; if(fn) el.__onIn = fn; io.observe(el); };
    // 섹션 제목·소개, 카드 묶음
    document.querySelectorAll('main > section:not(.hero) .wrap > .kicker, main > section:not(.hero) .wrap > .h2, main > section:not(.hero) .wrap > .p').forEach(function(el){ watch(el, 0); });
    ['.mk-stat','.mk-card','.diag-item','.cards:not([data-sub=plan-cards]) .card','.flow li','.calc','.zt','.faq-item','.mk-map','.why-box','.apply-wrap','.tm-facts > div'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el, i){ watch(el, i % 6); });
    });
    // 숫자 카드: 0부터 올라감
    function countUp(el){
      var raw = el.textContent.trim(), m = raw.match(/^([\d,]+)(\.\d+)?$/); if(!m || still) return;
      var dec = m[2] ? m[2].length - 1 : 0, to = parseFloat(raw.replace(/,/g, '')), t0 = null, dur = 1200;
      var fmt = function(v){ return v.toLocaleString('ko-KR', {minimumFractionDigits:dec, maximumFractionDigits:dec}); };
      el.textContent = fmt(0);
      requestAnimationFrame(function step(t){ if(t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if(k < 1) requestAnimationFrame(step); else el.textContent = raw; });
    }
    document.querySelectorAll('.mk-stat').forEach(function(card){ var n = card.querySelector('.mk-n'); if(n){ var orig = n.textContent; card.__onIn = function(){ n.textContent = orig; countUp(n); }; } });
    var ws = document.querySelector('.why-stat b'); if(ws) watchOnly(ws.parentNode, function(){ countUp(ws); });
    // 막대
    document.querySelectorAll('.mk-fill').forEach(function(f){ f.style.setProperty('--w', f.style.width || '0%'); });
    document.querySelectorAll('.mk-bar').forEach(function(b){ watchOnly(b); });
    // 진단 단계
    document.querySelectorAll('.diag-meter').forEach(function(mt){ mt.querySelectorAll('i').forEach(function(i, k){ i.style.setProperty('--k', k); }); });
    document.querySelectorAll('.diag').forEach(function(d){ watchOnly(d); });
    // 사진
    document.querySelectorAll('.band, .flow-photo, .apply-photo').forEach(function(p){ watchOnly(p); });
    // 휴대폰: 검색어 입력 → 결과 등장 (화면에 보이는 동안 반복)
    document.querySelectorAll('.mock').forEach(function(mock){
      var q = mock.querySelector('.mock-search span');
      mock.querySelectorAll('.mock-list li').forEach(function(li, i){ li.style.setProperty('--i', i); var b = li.querySelector('.mock-badge'); if(b) b.style.setProperty('--i', i); });
      var full = q ? q.textContent : '';
      if(still || !q){ mock.classList.add('is-done'); return; }
      var chars = Array.from(full), timer = null, visible = false, running = false;
      function play(){
        if(running) return; running = true;
        clearTimeout(timer); mock.classList.remove('is-done'); q.textContent = ''; q.classList.add('typing');
        var n = 0;
        timer = setTimeout(function type(){
          n++; q.textContent = chars.slice(0, n).join('');
          if(n < chars.length) timer = setTimeout(type, 160);
          else timer = setTimeout(function(){
            q.classList.remove('typing'); mock.classList.add('is-done');
            timer = setTimeout(function(){ running = false; if(visible && !document.hidden) play(); }, 7000);   // 결과를 7초 보여준 뒤 다시
          }, 450);
        }, 500);
      }
      q.textContent = ''; q.classList.add('typing');
      new IntersectionObserver(function(en){ visible = en[0].isIntersecting; if(visible) play(); }, {threshold:.45}).observe(mock);
    });
    // 상품 카드: 금액이 0부터 올라감
    document.querySelectorAll('[data-sub=plan-cards]').forEach(function(box){
      watchOnly(box, function(){
        if(still) return;
        box.querySelectorAll('.num').forEach(function(n, i){
          var raw = n.textContent.trim(), m = raw.match(/^([\d,]+)(\D*)$/); if(!m) return;
          var to = +m[1].replace(/,/g, ''), unit = m[2], t0 = null, dur = 1100, delay = 250 + i * 150;
          n.textContent = '0' + unit;
          setTimeout(function(){ requestAnimationFrame(function step(t){ if(t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            n.textContent = Math.round(to * e / 1000 * (k < 1 ? 1 : 1)) * 1000 > to ? raw : (Math.round(to * e / 1000) * 1000).toLocaleString('ko-KR') + unit; if(k < 1) requestAnimationFrame(step); else n.textContent = raw; }); }, delay);
        });
      });
    });
    // 진행 방식: 1→4단계가 차례로 켜지며 반복 (보이는 동안만)
    document.querySelectorAll('.flow').forEach(function(flow){
      if(still) return;
      var items = [].slice.call(flow.querySelectorAll('li')); if(items.length < 2) return;
      var idx = -1, t = null, on = false;
      function step(){
        idx = (idx + 1) % (items.length + 1);
        items.forEach(function(li, k){ li.classList.toggle('is-active', k === idx); li.classList.toggle('is-done', k < idx); });
        t = setTimeout(function(){ if(on && !document.hidden) step(); else t = null; }, idx === items.length ? 900 : 1600);
      }
      new IntersectionObserver(function(en){ on = en[0].isIntersecting; if(on){ flow.classList.add('is-cycling'); if(!t){ setTimeout(step, 700); } } }, {threshold:.35}).observe(flow);
    });
    // 빠르게 넘겨서 지나친 요소도 빠짐없이 보이도록: 스크롤이 멈추면 화면 위쪽에 있는 것은 모두 표시
    var sweepT; function sweep(){ var lim = window.innerHeight; document.querySelectorAll('.rv:not(.is-in), [data-sub=plan-cards]:not(.is-in), .mk-bar:not(.is-in), .diag:not(.is-in), .band:not(.is-in), .flow-photo:not(.is-in), .apply-photo:not(.is-in), .why-box:not(.is-in)').forEach(function(el){ if(el.getBoundingClientRect().top < lim){ el.classList.add('is-in'); if(el.__onIn){ var f = el.__onIn; el.__onIn = null; f(); } io.unobserve(el); } }); }
    window.addEventListener('scroll', function(){ clearTimeout(sweepT); sweepT = setTimeout(sweep, 180); }, {passive:true});
  })();

  var ctl = ('AbortController' in window) ? new AbortController() : null;
  var t = setTimeout(function(){ ctl && ctl.abort(); }, 4000);
  fetch('/api/content', {cache:'no-store', signal: ctl ? ctl.signal : undefined})
    .then(function(r){ clearTimeout(t); return r.ok ? r.json() : null; })
    .then(function(C){ var ok = C && typeof C === 'object' && Object.keys(C).length; if(ok) apply(C); initShared(ok ? C : {}); if(ok) applySharedTexts(C); })
    .catch(function(){ initShared({}); });
  setTimeout(function(){ initShared({}); }, 1500);   // 응답이 늦으면 기본값으로 먼저 시작
})();
