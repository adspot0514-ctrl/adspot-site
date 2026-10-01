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
    // 구조화 데이터 (서비스 가격, FAQ 답변)
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

  var ctl = ('AbortController' in window) ? new AbortController() : null;
  var t = setTimeout(function(){ ctl && ctl.abort(); }, 4000);
  fetch('/api/content', {cache:'no-store', signal: ctl ? ctl.signal : undefined})
    .then(function(r){ clearTimeout(t); return r.ok ? r.json() : null; })
    .then(function(C){ if(C && typeof C === 'object' && Object.keys(C).length) apply(C); })
    .catch(function(){});
})();
