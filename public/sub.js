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

  var ctl = ('AbortController' in window) ? new AbortController() : null;
  var t = setTimeout(function(){ ctl && ctl.abort(); }, 4000);
  fetch('/api/content', {cache:'no-store', signal: ctl ? ctl.signal : undefined})
    .then(function(r){ clearTimeout(t); return r.ok ? r.json() : null; })
    .then(function(C){ if(C && typeof C === 'object' && Object.keys(C).length) apply(C); })
    .catch(function(){});
})();
