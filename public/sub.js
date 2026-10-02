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

  /* ---------------- 방문 통계 (개인정보 없이 페이지·유입 경로만 기록) ---------------- */
  (function(){
    try{
      if(location.protocol === 'file:' || /^\/admin/.test(location.pathname)) return;
      var q = new URLSearchParams(location.search);
      var vid = localStorage.getItem('adspot-vid');
      if(!vid){ vid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4); localStorage.setItem('adspot-vid', vid); }
      var saved = null; try{ saved = JSON.parse(sessionStorage.getItem('adspot-src') || 'null'); }catch(e){}
      var host = ''; try{ host = document.referrer ? new URL(document.referrer).hostname : ''; }catch(e){}
      var ext = host && host !== location.hostname;
      var s = q.get('n_media') ? '네이버 광고' : (q.get('utm_source') || (ext ? (/naver/.test(host) ? '네이버 검색' : /google/.test(host) ? '구글 검색' : /daum/.test(host) ? '다음 검색' : /kakao/.test(host) ? '카카오' : /bing/.test(host) ? '빙 검색' : '다른 사이트')
            : ((saved && saved.src) || (host ? '사이트 내 이동' : '직접 방문'))));
      var r = (q.get('r') || (saved && saved.region) || '').toLowerCase().slice(0, 20);
      var k = q.get('n_keyword') || q.get('n_query') || q.get('utm_term') || (saved && saved.kw) || '';
      if(q.get('n_media') || q.get('utm_source') || q.get('r')){ try{ sessionStorage.setItem('adspot-src', JSON.stringify({region: r, kw: k, src: s})); }catch(e){} }
      var data = JSON.stringify({p: location.pathname, v: vid, s: s, r: r, k: k});
      if(navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([data], {type: 'application/json'}));
      else fetch('/api/track', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: data, keepalive: true});
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
      var ad = { region: form.getAttribute('data-region') || '', src: q.n_media ? '네이버 광고' : ((saved && saved.src) || '지역 페이지'), kw: q.n_keyword || q.n_query || (saved && saved.kw) || '' };
      btn.disabled = true; var label = btn.textContent; btn.textContent = '접수 중…';
      fetch('/api/inquiry', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        office: form.office.value.trim(), phone: phone, field: form.field.value, services: [], message: form.message.value.trim(),
        agree: true, hp: form.website.value, source: 'form', ad: ad, page: location.pathname })})
        .then(function(r){ if(!r.ok) throw new Error('fail'); return r.json(); })
        .then(function(){ form.reset(); msg.textContent = '상담 신청이 접수되었습니다. 확인 후 빠르게 연락드리겠습니다.'; msg.classList.add('ok'); })
        .catch(function(){ msg.textContent = '접수 중 문제가 생겼습니다. 전화나 카카오톡으로 문의해 주세요.'; msg.classList.add('err'); })
        .then(function(){ btn.disabled = false; btn.textContent = label; });
    });
  });

  var ctl = ('AbortController' in window) ? new AbortController() : null;
  var t = setTimeout(function(){ ctl && ctl.abort(); }, 4000);
  fetch('/api/content', {cache:'no-store', signal: ctl ? ctl.signal : undefined})
    .then(function(r){ clearTimeout(t); return r.ok ? r.json() : null; })
    .then(function(C){ if(C && typeof C === 'object' && Object.keys(C).length) apply(C); })
    .catch(function(){});
})();
