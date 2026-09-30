/* ADSPOT 관리자 페이지 */
(function(){
  'use strict';
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
  var D = window.ADSPOT_DEFAULTS || {};
  var TOKEN_KEY = 'adspot-admin-token';
  var token = sessionStorage.getItem(TOKEN_KEY) || '';

  function toast(msg){ var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function(){ t.classList.remove('on'); }, 2200); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function api(method, path, body){
    return fetch('/api' + path, {method:method, headers:Object.assign({'Content-Type':'application/json'}, token ? {Authorization:'Bearer ' + token} : {}), body: body ? JSON.stringify(body) : undefined})
      .then(function(r){
        return r.json().catch(function(){ return {}; }).then(function(j){
          if(r.status === 401 && path.indexOf('/admin/login') !== 0){ logout(true); throw new Error('로그인이 만료되었습니다.'); }
          if(!r.ok || j.ok === false) throw new Error(j.error || ('오류 (' + r.status + ')'));
          return j;
        });
      });
  }

  /* ---------------- 로그인 ---------------- */
  function showApp(){ $('#login').hidden = true; $('#app').hidden = false; loadInquiries(); loadContent(); }
  function logout(expired){ token = ''; sessionStorage.removeItem(TOKEN_KEY); $('#app').hidden = true; $('#login').hidden = false; if(expired) $('#login-err').textContent = '다시 로그인해 주세요.'; }
  $('#login-form').addEventListener('submit', function(e){
    e.preventDefault();
    var btn = $('#login-form .btn'); btn.disabled = true; $('#login-err').textContent = '';
    api('POST', '/admin/login', {password: e.target.password.value})
      .then(function(j){ token = j.token; sessionStorage.setItem(TOKEN_KEY, token); e.target.reset(); showApp(); })
      .catch(function(err){ $('#login-err').textContent = err.message; })
      .then(function(){ btn.disabled = false; });
  });
  $('#logout').addEventListener('click', function(){ logout(false); });

  /* ---------------- 탭 ---------------- */
  $$('.tabs button').forEach(function(b){
    b.addEventListener('click', function(){
      $$('.tabs button').forEach(function(x){ x.setAttribute('aria-selected', String(x === b)); });
      $('#tab-inq').hidden = b.dataset.tab !== 'inq';
      $('#tab-content').hidden = b.dataset.tab !== 'content';
    });
  });

  /* ---------------- 상담문의 ---------------- */
  var items = [], filter = 'all', query = '';
  var ST = {new:'신규', contacted:'연락함', done:'완료'};
  function fmt(iso){ var d = new Date(iso); var p = function(n){ return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '.' + p(d.getMonth()+1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function loadInquiries(){
    return api('GET', '/admin/inquiries').then(function(j){ items = j.items || []; renderInquiries(); }).catch(function(err){ toast(err.message); });
  }
  function renderInquiries(){
    var n = items.filter(function(i){ return i.status === 'new'; }).length;
    var b = $('#new-count'); b.hidden = !n; b.textContent = n;
    var q = query.toLowerCase();
    var list = items.filter(function(i){
      if(filter !== 'all' && i.status !== filter) return false;
      if(!q) return true;
      return [i.office, i.phone, i.field, i.message, i.memo, (i.services || []).join(' ')].join(' ').toLowerCase().indexOf(q) > -1;
    });
    $('#inq-empty').hidden = list.length > 0;
    $('#inq-empty').textContent = items.length ? '조건에 맞는 문의가 없습니다.' : '아직 접수된 상담문의가 없습니다.';
    $('#inq-list').innerHTML = list.map(function(i){
      return '<li class="inq' + (i.status === 'new' ? ' is-new' : '') + '" data-id="' + esc(i.id) + '">' +
        '<div><div class="inq-top"><span class="inq-office">' + esc(i.office || '(사무소명 미입력)') + '</span><span class="pill ' + esc(i.status) + '">' + (ST[i.status] || i.status) + '</span>' + (i.source === 'estimate' ? '<span class="pill src">견적 조합으로 신청</span>' : '') + '<span class="inq-date">' + fmt(i.createdAt) + '</span></div>' +
        '<dl class="inq-meta"><dt>연락처</dt><dd><a href="tel:' + esc(String(i.phone).replace(/[^0-9+]/g,'')) + '">' + esc(i.phone) + '</a></dd>' +
        '<dt>분야</dt><dd>' + esc(i.field || '-') + '</dd><dt>관심 서비스</dt><dd>' + esc((i.services || []).join(', ') || '-') + '</dd></dl>' +
        comboHTML(i.combo) + (i.message && !i.combo ? '<p class="inq-msg">' + esc(i.message) + '</p>' : '') + '</div>' +
        '<div class="inq-side"><label>진행 상태</label><select data-act="status">' +
          ['new','contacted','done'].map(function(s){ return '<option value="' + s + '"' + (i.status === s ? ' selected' : '') + '>' + ST[s] + '</option>'; }).join('') +
        '</select><label>메모</label><textarea data-act="memo" placeholder="통화 내용, 다음 연락일 등">' + esc(i.memo || '') + '</textarea>' +
        '<div class="row"><button type="button" class="btn btn-danger" data-act="delete">삭제</button><button type="button" class="btn" data-act="save-memo">메모 저장</button></div></div></li>';
    }).join('');
  }
  $('#inq-list').addEventListener('change', function(e){
    if(e.target.dataset.act !== 'status') return;
    var id = e.target.closest('.inq').dataset.id;
    api('PATCH', '/admin/inquiries/' + id, {status: e.target.value}).then(function(j){ replace(j.item); toast('상태를 변경했습니다.'); }).catch(function(err){ toast(err.message); });
  });
  $('#inq-list').addEventListener('click', function(e){
    var act = e.target.dataset && e.target.dataset.act; if(!act) return;
    var li = e.target.closest('.inq'), id = li.dataset.id;
    if(act === 'save-memo'){
      api('PATCH', '/admin/inquiries/' + id, {memo: $('[data-act=memo]', li).value}).then(function(j){ replace(j.item); toast('메모를 저장했습니다.'); }).catch(function(err){ toast(err.message); });
    }
    if(act === 'delete'){
      if(!confirm('이 문의를 삭제할까요? 되돌릴 수 없습니다.')) return;
      api('DELETE', '/admin/inquiries/' + id).then(function(){ items = items.filter(function(x){ return x.id !== id; }); renderInquiries(); toast('삭제했습니다.'); }).catch(function(err){ toast(err.message); });
    }
  });
  function comboHTML(c){
    if(!c) return '';
    var h = '<div class="inq-combo"><div class="ic-head">' + esc(c.type === 'mix' ? (c.field || '분야 미선택') + ' 추천 조합' : '맞춤 견적 · ' + (c.field || '분야 미선택')) + '</div>';
    if(c.type === 'mix'){
      (c.items || []).forEach(function(it){ h += '<div class="ic-row"><span>' + esc(it.name) + ' <em>' + it.count + '건 × ' + (+it.price).toLocaleString('ko-KR') + '원</em></span><span>' + (+it.subtotal).toLocaleString('ko-KR') + '원</span></div>'; });
      h += '<div class="ic-total"><span>월 예상 금액 (부가세 별도)</span><b>' + (+c.total).toLocaleString('ko-KR') + '원</b></div>';
    } else h += '<div class="ic-row"><span>월 예산</span><span>' + esc(c.budget || '상담 후 결정') + '</span></div>';
    return h + '</div>';
  }
  function replace(it){ items = items.map(function(x){ return x.id === it.id ? it : x; }); renderInquiries(); }
  $$('#inq-filter button').forEach(function(b){
    b.addEventListener('click', function(){ filter = b.dataset.f; $$('#inq-filter button').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); renderInquiries(); });
  });
  $('#inq-search').addEventListener('input', function(e){ query = e.target.value.trim(); renderInquiries(); });
  $('#inq-refresh').addEventListener('click', function(){ loadInquiries().then(function(){ toast('새로고침했습니다.'); }); });
  $('#inq-csv').addEventListener('click', function(){
    var head = ['접수일시','사무소명','연락처','분야','관심 서비스','문의 내용','월 예상 금액','상태','메모'];
    var cell = function(v){ return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var rows = items.map(function(i){ return [fmt(i.createdAt), i.office, i.phone, i.field, (i.services || []).join(', '), i.message, i.combo && i.combo.type === 'mix' ? i.combo.total : '', ST[i.status] || i.status, i.memo].map(cell).join(','); });
    var blob = new Blob(['\ufeff' + [head.map(cell).join(',')].concat(rows).join('\r\n')], {type:'text/csv;charset=utf-8'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '애드스팟_상담문의_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
  });

  /* ---------------- 홈페이지 수정 ---------------- */
  var saved = {};
  var dirty = false;
  function markDirty(on){ dirty = on; var m = $('#save-msg'); m.textContent = on ? '저장하지 않은 변경 사항이 있습니다.' : (saved.updatedAt ? '마지막 저장: ' + fmt(saved.updatedAt) : '아직 저장한 적이 없습니다. (기본값 표시 중)'); m.classList.toggle('dirty', on); }
  window.addEventListener('beforeunload', function(e){ if(dirty){ e.preventDefault(); e.returnValue = ''; } });
  function merged(){
    var C = saved || {};
    var pick = function(v, d){ return (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) ? v : d; };
    var br2nl = function(s){ return String(s || '').replace(/<br\s*\/?>/gi, '\n'); };
    return {
      contact: Object.assign({}, D.contact, C.contact || {}),
      hero: Object.assign({}, D.hero, C.hero || {}),
      firms: pick(C.firms, D.firms).map(function(f){ return {name:f.name, date:String(f.start).slice(0,10)}; }),
      plans: (D.plans || []).map(function(p){ var o = (C.plans || []).filter(function(x){ return x.key === p.key; })[0] || {}; return Object.assign({}, p, o); }),
      fields: pick(C.fields, D.fields).map(function(f){ return {name:f.name, mix:Object.assign({cafe:0, influencer:0, blog:0}, f.mix)}; }),
      pricingNote: pick(C.pricingNote, D.pricingNote),
      stories: (D.stories || []).map(function(s, i){ var o = (C.stories || [])[i] || {}; var r = Object.assign({}, s, o); r.title = br2nl(r.title); return r; }),
      footer: Object.assign({}, D.footer, C.footer || {})
    };
  }
  function f(label, name, value, opt){
    opt = opt || {};
    var inp = opt.area ? '<textarea name="' + name + '" rows="' + (opt.rows || 3) + '">' + esc(value) + '</textarea>'
      : '<input name="' + name + '" type="' + (opt.type || 'text') + '" value="' + esc(value) + '"' + (opt.attrs || '') + '>';
    return '<label class="f"><span>' + label + (opt.hint ? '<em>' + opt.hint + '</em>' : '') + '</span>' + inp + '</label>';
  }
  function sec(title, sub, body, open){ return '<details class="sec"' + (open ? ' open' : '') + '><summary><span>' + title + (sub ? '<small>' + sub + '</small>' : '') + '</span></summary><div class="sec-body">' + body + '</div></details>'; }
  function won(n){ return (+n || 0).toLocaleString('ko-KR'); }
  function firmRow(fm){ return '<div class="rowf firm">' + f('파트너 이름', 'firm_name', fm.name) + f('계약 시작일', 'firm_date', fm.date, {type:'date'}) + '<button type="button" class="icon-btn" data-del>×</button></div>'; }
  function fieldRow(fl, plans){
    var sum = plans.reduce(function(s, p){ return s + (+fl.mix[p.key] || 0) * (+p.price || 0); }, 0);
    return '<div class="rowf field">' + f('분야', 'field_name', fl.name) + f('카페', 'field_cafe', fl.mix.cafe, {type:'number', attrs:' min="0" max="999"'}) +
      f('인플루언서', 'field_influencer', fl.mix.influencer, {type:'number', attrs:' min="0" max="999"'}) + f('준최 블로그', 'field_blog', fl.mix.blog, {type:'number', attrs:' min="0" max="999"'}) +
      '<span class="sum">월 ' + won(sum) + '원</span><button type="button" class="icon-btn" data-del>×</button></div>';
  }
  function renderContent(){
    var M = merged();
    var h = '';
    h += sec('연락처', '전화 상담 버튼 · 카카오톡 버튼',
      '<div class="grid2">' + f('전화 상담 번호', 'phoneText', M.contact.phoneText, {hint:'예) 010-8675-2328'}) + f('카카오톡 채널 주소', 'kakaoUrl', M.contact.kakaoUrl, {hint:'예) https://pf.kakao.com/_xxxx/chat'}) + '</div>', true);
    h += sec('메인 문구', '첫 화면 헤드라인 위·아래 문구',
      f('상단 작은 문구', 'kicker', M.hero.kicker) + f('설명 문장', 'lead', M.hero.lead, {area:true, rows:3, hint:'줄바꿈은 PC에서 그대로 적용'}));
    h += sec('함께하는 시간', '파트너 이름과 계약 시작일',
      '<div class="rows" id="firm-rows">' + M.firms.map(firmRow).join('') + '</div><button type="button" class="btn add" data-add="firm">+ 파트너 추가</button>');
    h += sec('상품 가격', '가격안내의 상품 3가지',
      M.plans.map(function(p){ return '<div class="item" data-plan="' + esc(p.key) + '"><div class="item-head">' + esc(p.name) + '</div><div class="grid2">' + f('상품명', 'plan_name', p.name) + f('건당 가격(원)', 'plan_price', p.price, {type:'number', attrs:' min="0" step="1000"'}) + '</div>' + f('설명', 'plan_desc', p.desc, {area:true, rows:2}) + '</div>'; }).join(''));
    h += sec('분야별 추천 조합', '견적 계산기 탭과 월 건수',
      '<div class="rows" id="field-rows">' + M.fields.map(function(x){ return fieldRow(x, M.plans); }).join('') + '</div><button type="button" class="btn add" data-add="field">+ 분야 추가</button>' +
      f('가격 안내 문구', 'pricingNote', M.pricingNote, {area:true, rows:2}));
    h += sec('성장 이야기', '슬라이드 3장의 문구',
      M.stories.map(function(s, i){ return '<div class="item" data-story="' + i + '"><div class="item-head">' + (i+1) + '번째 이야기</div><div class="grid2">' + f('연도 표시', 'st_year', s.year, {hint:'예) 10년 전'}) + f('함께한 기간(년)', 'st_years', s.years, {type:'number', attrs:' min="0" max="99"'}) + '</div>' +
        f('제목', 'st_title', s.title, {area:true, rows:2, hint:'줄바꿈 가능'}) + f('설명', 'st_desc', s.desc, {area:true, rows:2}) +
        '<div class="grid2">' + f('그림 아래 왼쪽(그때)', 'st_from', s.from) + f('그림 아래 오른쪽(지금)', 'st_to', s.to) + '</div></div>'; }).join(''));
    h += sec('푸터 사업자 정보', '홈페이지 맨 아래',
      '<div class="grid3">' + f('상호', 'company', M.footer.company) + f('대표자', 'ceo', M.footer.ceo) + f('사업자등록번호', 'bizno', M.footer.bizno) + '</div>' +
      f('소재지', 'address', M.footer.address) + '<div class="grid2">' + f('대표번호 1', 'phone1', M.footer.phone1) + f('대표번호 2', 'phone2', M.footer.phone2) + '</div>');
    $('#content-form').innerHTML = h;
    markDirty(false);
  }
  function loadContent(){
    return api('GET', '/admin/content').then(function(j){ saved = j.content || {}; renderContent(); }).catch(function(err){ toast(err.message); });
  }
  function currentPlans(){ return $$('[data-plan]').map(function(el){ return {key:el.dataset.plan, name:$('[name=plan_name]', el).value.trim(), price:+$('[name=plan_price]', el).value || 0, desc:$('[name=plan_desc]', el).value.trim()}; }); }
  function refreshSums(){
    var plans = currentPlans();
    $$('#field-rows .rowf').forEach(function(r){
      var mix = {cafe:+$('[name=field_cafe]', r).value || 0, influencer:+$('[name=field_influencer]', r).value || 0, blog:+$('[name=field_blog]', r).value || 0};
      var sum = plans.reduce(function(s, p){ return s + (mix[p.key] || 0) * p.price; }, 0);
      $('.sum', r).textContent = '월 ' + won(sum) + '원';
    });
  }
  var form = $('#content-form');
  form.addEventListener('input', function(){ markDirty(true); refreshSums(); });
  form.addEventListener('click', function(e){
    if(e.target.hasAttribute('data-del')){ e.target.closest('.rowf').remove(); markDirty(true); }
    var add = e.target.dataset && e.target.dataset.add;
    if(add === 'firm'){ $('#firm-rows').insertAdjacentHTML('beforeend', firmRow({name:'', date:new Date().toISOString().slice(0,10)})); markDirty(true); }
    if(add === 'field'){ $('#field-rows').insertAdjacentHTML('beforeend', fieldRow({name:'', mix:{cafe:10, influencer:10, blog:20}}, currentPlans())); markDirty(true); refreshSums(); }
  });
  function collect(){
    var v = function(n, r){ var el = $('[name=' + n + ']', r || form); return el ? el.value.trim() : ''; };
    var errs = [];
    var firms = $$('#firm-rows .rowf').map(function(r){ return {name:v('firm_name', r), start:v('firm_date', r) ? v('firm_date', r) + 'T10:00:00+09:00' : ''}; }).filter(function(x){ return x.name || x.start; });
    firms.forEach(function(x){ if(!x.name || !x.start) errs.push('함께하는 시간: 이름과 시작일을 모두 입력해 주세요.'); });
    var fields = $$('#field-rows .rowf').map(function(r){ return {name:v('field_name', r), mix:{cafe:+v('field_cafe', r) || 0, influencer:+v('field_influencer', r) || 0, blog:+v('field_blog', r) || 0}}; }).filter(function(x){ return x.name; });
    if(!fields.length) errs.push('분야별 추천 조합: 분야를 1개 이상 입력해 주세요.');
    var phone = v('phoneText');
    if(phone && !/^[0-9\-\s+()]{9,}$/.test(phone)) errs.push('연락처: 전화번호 형식을 확인해 주세요.');
    var kakao = v('kakaoUrl');
    if(kakao && !/^https?:\/\//.test(kakao)) errs.push('연락처: 카카오톡 주소는 https:// 로 시작해야 합니다.');
    return {errs:errs, content:{
      contact: {phoneText:phone, phoneTel:phone.replace(/[^0-9+]/g,''), kakaoUrl:kakao},
      hero: {kicker:v('kicker'), lead:v('lead')},
      firms: firms,
      plans: currentPlans(),
      fields: fields,
      pricingNote: v('pricingNote'),
      stories: $$('[data-story]').map(function(el){ return {year:v('st_year', el), years:+v('st_years', el) || 0, title:v('st_title', el), desc:v('st_desc', el), from:v('st_from', el), to:v('st_to', el)}; }),
      footer: {company:v('company'), ceo:v('ceo'), bizno:v('bizno'), address:v('address'), phone1:v('phone1'), phone2:v('phone2')}
    }};
  }
  $('#content-save').addEventListener('click', function(){
    var r = collect();
    if(r.errs.length){ alert(r.errs.filter(function(x, i, a){ return a.indexOf(x) === i; }).join('\n')); return; }
    var btn = this; btn.disabled = true;
    api('PUT', '/admin/content', {content:r.content})
      .then(function(j){ saved = Object.assign({}, r.content, {updatedAt:j.updatedAt}); markDirty(false); toast('저장했습니다. 홈페이지에 반영되었습니다.'); })
      .catch(function(err){ toast('저장 실패: ' + err.message); })
      .then(function(){ btn.disabled = false; });
  });
  $('#content-reload').addEventListener('click', function(){ if(!dirty || confirm('저장하지 않은 변경 사항을 버릴까요?')) renderContent(); });

  /* 시작 */
  if(token){ showApp(); } else { $('#login').hidden = false; }
})();
