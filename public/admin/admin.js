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
      $('#tab-region').hidden = b.dataset.tab !== 'region';
      $('#tab-stats').hidden = b.dataset.tab !== 'stats';
      if(b.dataset.tab === 'stats') loadStats();
      if(b.dataset.tab === 'region') renderRegion();
    });
  });

  /* ---------------- 상담문의 ---------------- */
  var items = [], filter = 'all', query = '';
  var ST = {new:'신규', contacted:'연락함', done:'완료'};
  function fmt(iso){ var d = new Date(iso); var p = function(n){ return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '.' + p(d.getMonth()+1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function loadInquiries(){
    return api('GET', '/admin/inquiries').then(function(j){ items = j.items || []; renderInquiries(); }).catch(function(err){ toast(err.message); });
  }
  function srcText(i){ var s = i.ad; if(!s || typeof s !== 'object') return ''; return [s.region ? s.region + ' 지역' : '', s.src || '', s.kw ? '키워드: ' + s.kw : ''].filter(Boolean).join(' · '); }
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
        '<dt>분야</dt><dd>' + esc(i.field || '-') + '</dd><dt>관심 서비스</dt><dd>' + esc((i.services || []).join(', ') || '-') + '</dd>' + (srcText(i) ? '<dt>유입</dt><dd class="inq-src">' + esc(srcText(i)) + '</dd>' : '') + '</dl>' +
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
    var head = ['접수일시','사무소명','연락처','분야','관심 서비스','문의 내용','월 예상 금액','유입','상태','메모'];
    var cell = function(v){ return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var rows = items.map(function(i){ return [fmt(i.createdAt), i.office, i.phone, i.field, (i.services || []).join(', '), i.message, i.combo && i.combo.type === 'mix' ? i.combo.total : '', srcText(i), ST[i.status] || i.status, i.memo].map(cell).join(','); });
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
      footer: Object.assign({}, D.footer, C.footer || {}),
      heroHeadline: Object.assign({}, D.heroHeadline, C.heroHeadline || {}),
      texts: Object.assign({}, D.texts, C.texts || {}),
      media: Object.assign({}, D.media, C.media || {}),
      portfolio: (function(){ var L = ['assets/portfolio/jeiel.png','assets/portfolio/changkyung.png','assets/portfolio/yungang.png','assets/portfolio/anlab.png','assets/portfolio/saero.png','assets/portfolio/central.png','assets/portfolio/simpyeong.png']; var leg = Array.isArray(C.portfolio) && C.portfolio.length === L.length && C.portfolio.every(function(p, i){ return p && p.url === L[i]; });
        return pick(leg ? null : C.portfolio, D.portfolio); })().map(function(p){ return {name:p.name || '', url:p.url}; })
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
  /* ---------- 섹션 문구 ---------- */
  var TEXT_LABELS = {
    'st.sub1':'작은 문구 1줄','st.sub2':'작은 문구 2줄','st.sub3':'작은 문구 3줄',
    'id.kicker':'작은 제목','id.title':'큰 제목','id.lead':'설명','id.f1y':'연혁 1 · 연도','id.f1':'연혁 1 · 내용','id.f2y':'연혁 2 · 연도','id.f2':'연혁 2 · 내용','id.f3y':'연혁 3 · 연도','id.f3':'연혁 3 · 내용','clock.title':'시계 제목','clock.sub':'시계 설명',
    'stories.kicker':'작은 제목','stories.title':'큰 제목',
    'sc.intro1':'도입 문구 1줄','sc.intro2':'도입 문구 2줄','sc.y1':'연도','sc.y2':'연도','sc.y3':'연도','sc.t1':'문구','sc.t2':'문구','sc.t3':'문구',
    'why.kicker':'작은 제목','why.era':'숫자 아래 문구','why.j1':'성장 경로 1','why.j1s':'성장 경로 1 · 설명','why.j2':'성장 경로 2','why.j2s':'성장 경로 2 · 설명','why.j3':'성장 경로 3','why.j3s':'성장 경로 3 · 설명','why.quote':'강조 문장','why.q':'채팅 제목',
    'pr.kicker':'작은 제목','pr.title':'큰 제목','pr.custom':'맞춤 견적 설명',
    'ct.kicker':'작은 제목','ct.title':'큰 제목','ct.lead':'설명','ct.f1':'진행 1','ct.f1s':'진행 1 · 설명','ct.f2':'진행 2','ct.f2s':'진행 2 · 설명','ct.f3':'진행 3','ct.f3s':'진행 3 · 설명','ct.t1':'신뢰 포인트 1','ct.t2':'신뢰 포인트 2','ct.t3':'신뢰 포인트 3'
  };
  var TEXT_GROUPS = [
    {title:'애드스팟 문장 섹션', sub:'큰 문장 아래 작은 문구', keys:['st.sub1','st.sub2','st.sub3']},
    {title:'함께하는 시간 섹션', sub:'제목 · 설명 · 연혁', keys:['id.kicker','id.title','id.lead','id.f1y','id.f1','id.f2y','id.f2','id.f3y','id.f3','clock.title','clock.sub']},
    {title:'포트폴리오 섹션 제목', sub:'성장 이야기 위 제목', keys:['stories.kicker','stories.title']},
    {title:'왜 애드스팟인가 섹션', sub:'제목 · 성장 경로 · 강조 문장', keys:['why.kicker','why.era','why.j1','why.j1s','why.j2','why.j2s','why.j3','why.j3s','why.quote','why.q']},
    {title:'가격안내 섹션 제목', sub:'제목 · 맞춤 견적 설명', keys:['pr.kicker','pr.title','pr.custom']},
    {title:'상담문의 섹션', sub:'제목 · 설명 · 진행 순서 · 신뢰 포인트', keys:['ct.kicker','ct.title','ct.lead','ct.f1','ct.f1s','ct.f2','ct.f2s','ct.f3','ct.f3s','ct.t1','ct.t2','ct.t3']}
  ];
  function tx(k, M, area){ return f(TEXT_LABELS[k] || k, 'tx_' + k, (M.texts || {})[k] || '', area ? {area:true, rows:2, hint:'줄바꿈 가능 · [ ] 안은 강조'} : {}); }

  /* ---------- 사진 · 영상 ---------- */
  var mediaState = {};
  function srcOf(url){ return /^(https?:|\/|data:|blob:)/.test(url) ? url : '../' + url; }
  function previewHTML(m){
    if(!m || !m.url) return '<span class="m-empty">없음</span>';
    return m.type === 'video' ? '<video src="' + esc(srcOf(m.url)) + '"' + (m.poster ? ' poster="' + esc(srcOf(m.poster)) + '"' : '') + ' muted playsinline loop autoplay></video><span class="m-badge">영상</span>'
      : '<img src="' + esc(srcOf(m.url)) + '" alt=""><span class="m-badge">사진</span>';
  }
  function mediaBox(key, label){
    var isDefault = D.media && D.media[key] && mediaState[key] && D.media[key].url === mediaState[key].url;
    return '<div class="media" data-mkey="' + key + '"><div class="m-label">' + label + '</div><div class="m-prev">' + previewHTML(mediaState[key]) + '</div>' +
      '<div class="m-act"><label class="btn btn-primary">사진·영상 올리기<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" data-media-input hidden></label>' +
      '<button type="button" class="btn" data-media-reset' + (isDefault ? ' disabled' : '') + '>기본으로</button></div><div class="m-status"></div></div>';
  }
  function pfRow(p){
    return '<div class="pf-row" data-url="' + esc(p.url) + '"><div class="pf-logo"><img src="' + esc(srcOf(p.url)) + '" alt=""></div>' +
      '<label class="f"><span>로펌 이름</span><input name="pf_name" value="' + esc(p.name) + '"></label>' +
      '<label class="btn">교체<input type="file" accept="image/png,image/jpeg,image/webp" data-pf-replace hidden></label>' +
      '<button type="button" class="icon-btn" data-pf-up title="위로">↑</button><button type="button" class="icon-btn" data-del-pf title="삭제">×</button><span class="m-status"></span></div>';
  }
  function rid(){ var s = ''; while(s.length < 16) s += Math.random().toString(36).slice(2); return s.slice(0, 16); }
  function loadImage(file){ return new Promise(function(res, rej){ var u = URL.createObjectURL(file), im = new Image(); im.onload = function(){ res(im); }; im.onerror = function(){ rej(new Error('이미지를 읽을 수 없습니다.')); }; im.src = u; }); }
  function canvasBlob(cv, type, q){ return new Promise(function(res){ cv.toBlob(function(b){ res(b); }, type, q); }); }
  // 사진은 올리기 전에 웹용 크기로 줄임 (로고는 투명 배경 유지)
  function prepareImage(file, opt){
    if(file.type === 'image/gif') return Promise.resolve(file);
    return loadImage(file).then(function(im){
      var max = opt.max || 2400, w = im.naturalWidth, h = im.naturalHeight, r = Math.min(1, max / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * r); cv.height = Math.round(h * r);
      var ctx = cv.getContext('2d'); if(!opt.png){ ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); }
      ctx.drawImage(im, 0, 0, cv.width, cv.height);
      return canvasBlob(cv, opt.png ? 'image/png' : 'image/jpeg', .86);
    });
  }
  // 영상 첫 장면을 표지(포스터)로 만듦 → 영상이 뜨기 전 검은 화면 대신 보임
  function videoPoster(file){
    return new Promise(function(res){
      var v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
      var done = function(b){ res(b); }, to = setTimeout(function(){ done(null); }, 8000);
      v.addEventListener('loadeddata', function(){ try{ v.currentTime = Math.min(.3, (v.duration || 1) / 2); }catch(e){ clearTimeout(to); done(null); } });
      v.addEventListener('seeked', function(){
        var r = Math.min(1, 1600 / (v.videoWidth || 1600)), cv = document.createElement('canvas');
        cv.width = Math.round((v.videoWidth || 1600) * r); cv.height = Math.round((v.videoHeight || 900) * r);
        cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
        canvasBlob(cv, 'image/jpeg', .82).then(function(b){ clearTimeout(to); done(b); });
      }, {once:true});
      v.addEventListener('error', function(){ clearTimeout(to); done(null); });
    });
  }
  // 3MB 조각으로 나눠 올림
  function uploadBlob(blob, type, name, onProgress){
    var CH = 3 * 1024 * 1024, id = rid(), n = Math.max(1, Math.ceil(blob.size / CH)), i = 0;
    function next(){
      if(i >= n) return api('POST', '/admin/upload/' + id + '/finish', {parts:n, type:type, name:name});
      var part = blob.slice(i * CH, (i + 1) * CH);
      return fetch('/api/admin/upload/' + id + '/' + i, {method:'PUT', headers:{Authorization:'Bearer ' + token, 'Content-Type':'application/octet-stream'}, body:part})
        .then(function(r){ if(r.status === 401){ logout(true); throw new Error('로그인이 만료되었습니다.'); } if(!r.ok) throw new Error('업로드 실패 (' + r.status + ')'); i++; onProgress && onProgress(i / n); return next(); });
    }
    return next();
  }
  function uploadFile(file, opt, status){
    opt = opt || {};
    var isVideo = /^video\//.test(file.type);
    if(!isVideo && !/^image\//.test(file.type)) return Promise.reject(new Error('사진 또는 영상 파일만 올릴 수 있습니다.'));
    if(isVideo && file.size > 25 * 1024 * 1024) return Promise.reject(new Error('영상은 25MB 이하만 올릴 수 있습니다. 길이를 줄이거나 압축해 주세요.'));
    if(isVideo && file.size > 6 * 1024 * 1024 && !confirm('영상이 ' + (file.size / 1048576).toFixed(1) + 'MB입니다.\n휴대폰에서는 6MB가 넘는 영상이 늦게 뜨거나 멈춰 보일 수 있습니다.\n(권장: 10초 이내, 3~5MB)\n\n그래도 올릴까요?')) return Promise.reject(new Error('업로드를 취소했습니다.'));
    status('준비 중…');
    if(!isVideo){
      return prepareImage(file, opt).then(function(b){
        var type = b.type || file.type; status('올리는 중…');
        return uploadBlob(b, type, file.name, function(p){ status('올리는 중… ' + Math.round(p * 100) + '%'); });
      }).then(function(j){ return {type:'image', url:j.url}; });
    }
    var type = file.type === 'video/quicktime' ? 'video/quicktime' : file.type;
    return videoPoster(file).then(function(pb){
      var posterP = pb ? uploadBlob(pb, 'image/jpeg', 'poster.jpg').then(function(j){ return j.url; }) : Promise.resolve(null);
      return posterP.then(function(posterUrl){
        return uploadBlob(file, type, file.name, function(p){ status('영상 올리는 중… ' + Math.round(p * 100) + '%'); }).then(function(j){ var m = {type:'video', url:j.url}; if(posterUrl) m.poster = posterUrl; return m; });
      });
    });
  }

  function renderContent(){
    var M = merged();
    var h = '';
    h += sec('연락처', '전화 상담 버튼 · 카카오톡 버튼',
      '<div class="grid2">' + f('전화 상담 번호', 'phoneText', M.contact.phoneText, {hint:'예) 010-8675-2328'}) + f('카카오톡 채널 주소', 'kakaoUrl', M.contact.kakaoUrl, {hint:'예) https://open.kakao.com/o/xxxx'}) + '</div>', true);
    mediaState = JSON.parse(JSON.stringify(M.media));
    h += sec('메인 첫 화면', '헤드라인 · 문구 · 배경 사진/영상',
      f('상단 작은 문구', 'kicker', M.hero.kicker) +
      '<div class="grid2">' + f('헤드라인 (PC)', 'headlinePc', M.heroHeadline.headlinePc, {area:true, rows:2, hint:'[ ] 안은 주황색 · 줄바꿈 그대로'}) +
      f('헤드라인 (모바일)', 'headlineMo', M.heroHeadline.headlineMo, {area:true, rows:3, hint:'모바일은 짧게 3줄 권장'}) + '</div>' +
      f('설명 문장', 'lead', M.hero.lead, {area:true, rows:3, hint:'줄바꿈은 PC에서 그대로 적용'}) +
      '<p class="sub-h">배경 장면 <em>1번은 로고 모션(고정), 2·3번은 사진이나 영상으로 바꿀 수 있습니다.</em></p>' +
      '<div class="grid2">' + mediaBox('hero.court', '배경 2 · 법원 야경') + mediaBox('hero.city', '배경 3 · 도심 야경') + '</div>', true);
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
    h += sec('서초동 쇼케이스', '3장면의 연도 · 문구 · 사진/영상',
      '<div class="grid2">' + tx('sc.intro1', M) + tx('sc.intro2', M) + '</div>' +
      [1,2,3].map(function(n){ return '<div class="item"><div class="item-head">' + n + '번째 장면</div><div class="grid-media"><div>' + tx('sc.y' + n, M) + tx('sc.t' + n, M, true) + '</div>' + mediaBox('sc.m' + n, '사진 / 영상') + '</div></div>'; }).join(''));
    h += sec('포트폴리오 로고', '흐르는 로고 줄 · 교체 · 추가 · 삭제',
      '<p class="hint small">로고는 가로로 긴 PNG(배경 투명)를 권장합니다. 올리면 자동으로 알맞은 크기로 줄어듭니다.</p>' +
      '<div class="rows" id="pf-rows">' + M.portfolio.map(pfRow).join('') + '</div>' +
      '<label class="btn add">+ 로고 추가<input type="file" accept="image/png,image/jpeg,image/webp" data-pf-add hidden></label>');
    TEXT_GROUPS.forEach(function(g){
      h += sec(g.title, g.sub, g.keys.map(function(k){ return tx(k, M, /title|lead|custom|\.t\d/.test(k)); }).join(''));
    });
    h += sec('푸터 사업자 정보', '홈페이지 맨 아래',
      '<div class="grid3">' + f('상호', 'company', M.footer.company) + f('대표자', 'ceo', M.footer.ceo) + f('사업자등록번호', 'bizno', M.footer.bizno) + '</div>' +
      '<div class="grid2">' + f('소재지', 'address', M.footer.address) + f('대표번호', 'phone1', M.footer.phone1, {hint:'푸터에 표시되는 번호 1개'}) + '</div>');
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
  form.addEventListener('change', function(e){
    var inp = e.target;
    if(inp.hasAttribute('data-media-input') && inp.files[0]){
      var box = inp.closest('.media'), key = box.dataset.mkey, st = $('.m-status', box);
      var setS = function(t){ st.textContent = t; };
      uploadFile(inp.files[0], {max:2400}, setS).then(function(m){
        mediaState[key] = m; $('.m-prev', box).innerHTML = previewHTML(m); $('[data-media-reset]', box).disabled = false;
        setS('올렸습니다. 저장하기를 누르면 홈페이지에 반영됩니다.'); markDirty(true);
      }).catch(function(err){ setS(err.message); }).then(function(){ inp.value = ''; });
    }
    if((inp.hasAttribute('data-pf-replace') || inp.hasAttribute('data-pf-add')) && inp.files[0]){
      var row = inp.closest('.pf-row'), st2 = row ? $('.m-status', row) : null;
      var setS2 = function(t){ if(st2) st2.textContent = t; else toast(t); };
      uploadFile(inp.files[0], {max:900, png:true}, setS2).then(function(m){
        if(row){ row.dataset.url = m.url; $('.pf-logo img', row).src = m.url; setS2('교체했습니다.'); }
        else { $('#pf-rows').insertAdjacentHTML('beforeend', pfRow({name:'', url:m.url})); toast('로고를 추가했습니다. 이름을 입력해 주세요.'); }
        markDirty(true);
      }).catch(function(err){ setS2(err.message); }).then(function(){ inp.value = ''; });
    }
  });
  form.addEventListener('click', function(e){
    var t = e.target;
    if(t.hasAttribute('data-media-reset')){
      var box = t.closest('.media'), key = box.dataset.mkey;
      mediaState[key] = JSON.parse(JSON.stringify(D.media[key])); $('.m-prev', box).innerHTML = previewHTML(mediaState[key]); t.disabled = true;
      $('.m-status', box).textContent = '기본 사진/영상으로 되돌렸습니다.'; markDirty(true);
    }
    if(t.hasAttribute('data-del-pf')){ if(confirm('이 로고를 뺄까요?')){ t.closest('.pf-row').remove(); markDirty(true); } }
    if(t.hasAttribute('data-pf-up')){ var r = t.closest('.pf-row'); if(r.previousElementSibling){ r.parentNode.insertBefore(r, r.previousElementSibling); markDirty(true); } }
  });
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
    if(!v('headlinePc') || !v('headlineMo')) errs.push('메인 첫 화면: 헤드라인을 입력해 주세요.');
    if(!$$('#pf-rows .pf-row').length) errs.push('포트폴리오 로고: 로고를 1개 이상 남겨 주세요.');
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
      footer: {company:v('company'), ceo:v('ceo'), bizno:v('bizno'), address:v('address'), phone1:v('phone1'), phone2:''},
      heroHeadline: {headlinePc:v('headlinePc'), headlineMo:v('headlineMo')},
      texts: $$('[name^="tx_"]').reduce(function(o, el){ o[el.name.slice(3)] = el.value.trim(); return o; }, {}),
      media: JSON.parse(JSON.stringify(mediaState)),
      portfolio: $$('#pf-rows .pf-row').map(function(r){ return {name:$('[name=pf_name]', r).value.trim(), url:r.dataset.url}; }),
      regionPages: saved.regionPages || {}
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


  /* ---------------- 지역 페이지 ---------------- */
  var RD = window.ADSPOT_REGION_DEFAULTS || {};
  var rgSlug = Object.keys(RD)[0] || '';
  (function(){
    var sel = $('#rg-sel'); if(!sel) return;
    sel.innerHTML = Object.keys(RD).map(function(k){ return '<option value="' + k + '">' + esc(RD[k].name) + ' (' + esc(RD[k].full) + ')</option>'; }).join('');
    sel.addEventListener('change', function(){ if(rgDirty && !confirm('저장하지 않은 변경 사항을 버릴까요?')){ sel.value = rgSlug; return; } rgSlug = sel.value; renderRegion(); });
  })();
  var rgDirty = false;
  function rgMark(on){ rgDirty = on; var m = $('#rg-msg'); var has = saved.regionPages && saved.regionPages[rgSlug];
    m.textContent = on ? '저장하지 않은 변경 사항이 있습니다.' : (has ? '관리자 수정본이 적용 중입니다.' : '기본 문구가 적용 중입니다.'); m.classList.toggle('dirty', on); }
  function priceNow(){ var P = {}; ((saved.plans && saved.plans.length) ? saved.plans : (D.plans || [])).forEach(function(p){ P[p.key] = +p.price || 0; });
    (D.plans || []).forEach(function(p){ if(!P[p.key]) P[p.key] = +p.price || 0; }); return P; }
  function rgTotal(){ var P = priceNow(), f = $('#rg-form');
    var n = function(k){ var el = $('[name=pk_' + k + ']', f); return el ? (+el.value || 0) : 0; };
    var t = n('cafe') * P.cafe + n('influencer') * P.influencer + n('blog') * P.blog;
    $('#rg-total').textContent = '월 약 ' + Math.round(t / 10000).toLocaleString('ko-KR') + '만 원 (부가세 별도, 현재 단가 기준)'; }
  function renderRegion(){
    if(!rgSlug || !RD[rgSlug]) return;
    var d = RD[rgSlug], s = (saved.regionPages || {})[rgSlug] || {};
    var val = function(k){ return (s[k] !== undefined && s[k] !== '') ? s[k] : d[k]; };
    var pk = Object.assign({}, d.pkg, s.pkg || {});
    var fq = (d.faq || []).map(function(q, i){ var o = (s.faq || [])[i] || {}; return {q: o.q || q.q, a: o.a || q.a}; });
    $('#rg-view').href = '/regions/' + rgSlug + '/';
    var h = '';
    h += sec('검색 결과에 보이는 정보', '네이버·구글 검색 결과의 제목과 설명',
      f('검색 제목', 'rg_title', val('title'), {hint:'40자 안팎 권장'}) + f('검색 설명', 'rg_desc', val('desc'), {area:true, rows:2, hint:'80~120자 권장'}), true);
    h += sec('페이지 첫 화면', '큰 제목과 소개 문장',
      f('큰 제목', 'rg_h1', val('h1'), {area:true, rows:2, hint:'줄바꿈 가능'}) + f('소개 문장', 'rg_lead', val('lead'), {area:true, rows:3}), true);
    h += '<div id="rg-pkg-wrap">' + sec(esc(d.name) + ' 지역 추천 패키지', '월 건수 (금액은 자동 계산)',
      '<div class="grid3">' + f('대표 카페 (건)', 'pk_cafe', pk.cafe, {type:'number', attrs:' min="0" max="999"'}) + f('인플루언서 블로그 (건)', 'pk_influencer', pk.influencer, {type:'number', attrs:' min="0" max="999"'}) + f('준최적화 블로그 (건)', 'pk_blog', pk.blog, {type:'number', attrs:' min="0" max="999"'}) + '</div><p class="hint" id="rg-total"></p>', true) + '</div>';
    h += sec(esc(d.name) + ' 이야기 · 사례', '입력하면 페이지에 새 영역으로 표시됩니다 (비우면 숨김)',
      f('지역 이야기', 'rg_story', s.story || '', {area:true, rows:6, hint:'실제 진행 사례, 지역 특징 등. 빈 줄로 문단 구분'}), true);
    h += sec('자주 묻는 질문', '질문과 답변 3개',
      fq.map(function(q, i){ return '<div class="item"><div class="item-head">질문 ' + (i + 1) + '</div>' + f('질문', 'rg_q' + i, q.q) + f('답변', 'rg_a' + i, q.a, {area:true, rows:3}) + '</div>'; }).join(''));
    h += '<div id="rg-extra"><p class="hint">페이지 세부 문구·사진을 불러오는 중…</p></div>';
    $('#rg-form').innerHTML = h; rgTotal(); rgMark(false);
    rgLoadExtra(rgSlug, s);
  }
  /* ---------- 지역 페이지 세부 문구·사진 (페이지에 표시된 항목을 읽어 자동으로 칸을 만듦) ---------- */
  var rgDef = {}, rgImgDef = {}, rgImg = {};
  function rgElText(el){
    var t = el.getAttribute('data-et');
    if(t === 'tags' || t === 'tags-main' || t === 'li') return Array.prototype.map.call(el.children, function(c){ return c.textContent.trim(); }).filter(Boolean).join(', ');
    var tmp = document.createElement('div'); tmp.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, '\n');
    return tmp.textContent.replace(/[ \t]+\n/g, '\n').trim();
  }
  function rgImgBox(key, label, url){
    var changed = !!rgImg[key];
    return '<div class="media" data-rg-ikey="' + esc(key) + '"><div class="m-label">' + esc(label) + '</div><div class="m-prev"><img src="' + esc(url) + '" alt=""><span class="m-badge">사진</span></div>' +
      '<div class="m-act"><label class="btn btn-primary">사진 바꾸기<input type="file" accept="image/*" data-rg-img hidden></label>' +
      '<button type="button" class="btn" data-rg-img-reset' + (changed ? '' : ' disabled') + '>기본 사진으로</button></div><div class="m-status"></div></div>';
  }
  function rgLoadExtra(slug, s){
    var box = $('#rg-extra'); rgDef = {}; rgImgDef = {}; rgImg = Object.assign({}, (s && s.img) || {});
    fetch('/regions/' + slug + '/?admin-raw=1', {cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.text(); }).then(function(html){
      if(slug !== rgSlug) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      $('#rg-pkg-wrap').hidden = !doc.querySelector('[data-pkg]');
      var groups = [], byName = {};
      var add = function(g, item){ if(!byName[g]){ byName[g] = []; groups.push(g); } byName[g].push(item); };
      doc.querySelectorAll('[data-e],[data-ei]').forEach(function(el){
        var lab = (el.getAttribute('data-el') || '').split('|'), g = lab[0] || '기타', name = lab[1] || '';
        if(el.hasAttribute('data-ei')){ var k = el.getAttribute('data-ei'); rgImgDef[k] = el.getAttribute('src'); add(g, {img:true, key:k, name:name}); }
        else { var k2 = el.getAttribute('data-e'); rgDef[k2] = rgElText(el); add(g, {key:k2, name:name}); }
      });
      if(!groups.length){ box.innerHTML = ''; return; }
      var tx = (s && s.text) || {};
      box.innerHTML = '<p class="hint" style="margin:18px 0 10px">아래는 페이지의 세부 문구와 사진입니다. 바꾼 칸만 저장되고, 나머지는 기본 문구가 그대로 쓰입니다.</p>' +
        groups.map(function(g){
          var items = byName[g];
          var body = items.filter(function(it){ return it.img; }).map(function(it){ return rgImgBox(it.key, it.name, rgImg[it.key] ? srcOf(rgImg[it.key]) : rgImgDef[it.key]); }).join('');
          body += items.filter(function(it){ return !it.img; }).map(function(it){
            var v = (tx[it.key] !== undefined && tx[it.key] !== '') ? tx[it.key] : rgDef[it.key];
            var long = v.length > 38 || v.indexOf('\n') > -1;
            return f(esc(it.name), 'rx_' + it.key, v, long ? {area:true, rows:Math.min(5, Math.max(2, Math.ceil(v.length / 45)))} : {});
          }).join('');
          return sec(esc(g), items.length + '개 항목', body);
        }).join('');
    }).catch(function(){ if(slug === rgSlug) box.innerHTML = '<p class="hint">세부 문구를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>'; });
  }
  $('#rg-form').addEventListener('change', function(e){
    var inp = e.target;
    if(!inp.hasAttribute('data-rg-img') || !inp.files[0]) return;
    var mb = inp.closest('.media'), key = mb.dataset.rgIkey, st = $('.m-status', mb);
    uploadFile(inp.files[0], {max:2000}, function(t){ st.textContent = t; }).then(function(m){
      rgImg[key] = m.url; $('.m-prev img', mb).src = srcOf(m.url); $('[data-rg-img-reset]', mb).disabled = false;
      st.textContent = '올렸습니다. 저장하기를 누르면 페이지에 반영됩니다.'; rgMark(true);
    }).catch(function(err){ st.textContent = err.message; }).then(function(){ inp.value = ''; });
  });
  $('#rg-form').addEventListener('click', function(e){
    var b = e.target.closest('[data-rg-img-reset]'); if(!b) return;
    var mb = b.closest('.media'), key = mb.dataset.rgIkey;
    delete rgImg[key]; $('.m-prev img', mb).src = rgImgDef[key]; b.disabled = true; $('.m-status', mb).textContent = '기본 사진으로 바꿨습니다. 저장하기를 누르면 반영됩니다.'; rgMark(true);
  });
  $('#rg-form').addEventListener('input', function(){ rgMark(true); rgTotal(); });
  function rgCollect(){
    var d = RD[rgSlug], f = $('#rg-form'), v = function(n){ var el = $('[name=' + n + ']', f); return el ? el.value.trim() : ''; };
    var o = {title:v('rg_title'), desc:v('rg_desc'), h1:v('rg_h1'), lead:v('rg_lead'), story:v('rg_story'),
      pkg:{cafe:+v('pk_cafe') || 0, influencer:+v('pk_influencer') || 0, blog:+v('pk_blog') || 0},
      faq:(d.faq || []).map(function(_, i){ return {q:v('rg_q' + i), a:v('rg_a' + i)}; })};
    // 기본값과 같은 문구는 저장하지 않음 (나중에 기본 문구가 바뀌어도 따라가도록)
    ['title','desc','h1','lead'].forEach(function(k){ if(o[k] === d[k]) o[k] = ''; });
    o.faq = o.faq.map(function(q, i){ return {q: q.q === d.faq[i].q ? '' : q.q, a: q.a === d.faq[i].a ? '' : q.a}; });
    var text = {};
    Object.keys(rgDef).forEach(function(k){ var el = $('[name="rx_' + k + '"]', f); if(!el) return; var val = el.value.trim(); if(val && val !== rgDef[k]) text[k] = val; });
    if(Object.keys(text).length) o.text = text;
    var img = {}; Object.keys(rgImg).forEach(function(k){ if(rgImg[k] && rgImgDef.hasOwnProperty(k)) img[k] = rgImg[k]; });
    if(Object.keys(img).length) o.img = img;
    return o;
  }
  function rgPut(pages, okMsg){
    var content = Object.assign({}, saved, {regionPages: pages}); delete content.updatedAt;
    var btns = $$('#rg-bar .btn'); btns.forEach(function(b){ b.disabled = true; });
    return api('PUT', '/admin/content', {content:content})
      .then(function(j){ saved = Object.assign({}, content, {updatedAt:j.updatedAt}); renderRegion(); toast(okMsg); })
      .catch(function(err){ toast('저장 실패: ' + err.message); })
      .then(function(){ btns.forEach(function(b){ b.disabled = false; }); });
  }
  $('#rg-save').addEventListener('click', function(){
    var pages = Object.assign({}, saved.regionPages || {}); pages[rgSlug] = rgCollect();
    rgPut(pages, RD[rgSlug].name + ' 지역 페이지를 저장했습니다.');
  });
  $('#rg-reset').addEventListener('click', function(){
    if(!confirm(RD[rgSlug].name + ' 지역 페이지를 기본 문구로 되돌릴까요?')) return;
    var pages = Object.assign({}, saved.regionPages || {}); delete pages[rgSlug];
    rgPut(pages, '기본 문구로 되돌렸습니다.');
  });


  /* ---------------- 통계 ---------------- */
  var stDays = 7;
  var PAGE_NAMES = {'/':'메인', '/lawyer-marketing/':'변호사마케팅 안내', '/law-firm-marketing/':'법무법인마케팅 안내', '/legal-marketing/':'법률마케팅 안내', '/regions/':'전국 서비스 지역'};
  var AD_REGION = {gwangju:'광주', jeonnam:'전남'};
  Object.keys(window.ADSPOT_REGION_DEFAULTS || {}).forEach(function(k){ AD_REGION[k] = window.ADSPOT_REGION_DEFAULTS[k].name; PAGE_NAMES['/regions/' + k + '/'] = window.ADSPOT_REGION_DEFAULTS[k].name + ' 지역 페이지'; });
  var DEV = {m:'모바일', pc:'PC'};
  var num = function(n){ return (+n || 0).toLocaleString('ko-KR'); };
  var pct = function(a, b){ return b ? (Math.round(a / b * 1000) / 10) + '%' : '-'; };
  function bars(list, map){
    if(!list || !list.length) return '<p class="empty-s">아직 데이터가 없습니다.</p>';
    var max = Math.max.apply(null, list.map(function(x){ return x.count; }));
    return '<ul class="st-bars">' + list.map(function(x){ var label = (map && map[x.name]) || x.name;
      return '<li><span class="l">' + esc(label) + '</span><span class="b"><i style="width:' + Math.max(3, x.count / max * 100) + '%"></i></span><span class="n">' + num(x.count) + '</span></li>'; }).join('') + '</ul>';
  }
  function loadStats(){
    $('#st-cards').innerHTML = '<p class="empty-s">불러오는 중…</p>';
    return api('GET', '/admin/stats?days=' + stDays).then(function(j){
      $('#st-period').textContent = (j.from === j.to ? j.to : j.from + ' ~ ' + j.to) + ' (한국 시간 기준)';
      var t = j.totals;
      $('#st-cards').innerHTML = [['방문 수', num(t.views)], ['방문자', num(t.visitors)], ['상담 신청', num(t.inquiries)], ['전환율', pct(t.inquiries, t.visitors)]]
        .map(function(c){ return '<div class="st-card"><span>' + c[0] + '</span><b>' + c[1] + '</b></div>'; }).join('');
      var max = Math.max.apply(null, j.daily.map(function(d){ return d.views; }).concat([1]));
      $('#st-chart').innerHTML = j.daily.map(function(d){
        return '<div class="col" title="' + d.day + ' · 방문 ' + d.views + ' · 방문자 ' + d.visitors + ' · 신청 ' + d.inquiries + '"><span class="v">' + (d.views || '') + '</span><i style="height:' + (d.views / max * 100) + '%"></i>' + (d.inquiries ? '<em>' + d.inquiries + '건</em>' : '') + '<small>' + d.day.slice(5).replace('-', '.') + '</small></div>'; }).join('');
      $('#st-pages').innerHTML = j.pages.length ? '<table><thead><tr><th>페이지</th><th>방문 수</th><th>방문자</th><th>상담 신청</th><th>전환율</th></tr></thead><tbody>' +
        j.pages.map(function(p){ return '<tr><th><a href="' + esc(p.path) + '" target="_blank" rel="noopener">' + esc(PAGE_NAMES[p.path] || p.path) + '</a></th><td>' + num(p.views) + '</td><td>' + num(p.visitors) + '</td><td>' + num(p.inquiries) + '</td><td>' + pct(p.inquiries, p.visitors) + '</td></tr>'; }).join('') + '</tbody></table>'
        : '<p class="empty-s">아직 데이터가 없습니다.</p>';
      var CH_COLOR = {'광고':'ad', '자연 유입':'org', '직접·기타':'etc'};
      $('#st-ch').innerHTML = (j.channels || []).map(function(c){
        return '<div class="ch ' + CH_COLOR[c.name] + '"><b>' + c.name + '</b><dl><dt>방문 수</dt><dd>' + num(c.views) + '</dd><dt>방문자</dt><dd>' + num(c.visitors) + '</dd><dt>상담 신청</dt><dd>' + num(c.inquiries) + '</dd><dt>전환율</dt><dd>' + pct(c.inquiries, c.visitors) + '</dd></dl></div>'; }).join('');
      var det = j.sourcesDetail || [];
      $('#st-src').innerHTML = det.length ? '<ul class="st-bars">' + det.map(function(x){ var max = det[0].count || 1;
        return '<li><span class="l"><i class="tag ' + CH_COLOR[x.group] + '">' + (x.group === '자연 유입' ? '자연' : x.group === '광고' ? '광고' : '직접') + '</i>' + esc(x.name) + '</span><span class="b"><i style="width:' + Math.max(3, x.count / max * 100) + '%"></i></span><span class="n">' + num(x.count) + (x.inquiries ? ' · 신청 ' + x.inquiries : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="empty-s">아직 데이터가 없습니다.</p>';
      $('#st-region').innerHTML = bars(j.regions, AD_REGION);
      var sec2 = function(n){ n = +n || 0; return n >= 60 ? Math.floor(n / 60) + '분 ' + (n % 60) + '초' : n + '초'; };
      var pname = function(p){ return PAGE_NAMES[p] || p; };
      $('#st-land').innerHTML = (j.landings || []).length ? '<table><thead><tr><th>첫 페이지</th><th>방문</th><th>광고 유입</th><th>이탈률</th><th>평균 머문 시간</th><th>연락</th><th>상담 신청</th></tr></thead><tbody>' +
        j.landings.map(function(l){ return '<tr><th>' + esc(pname(l.path)) + '</th><td>' + num(l.sessions) + '</td><td>' + num(l.paid) + '</td><td>' + pct(l.bounce, l.sessions) + '</td><td>' + sec2(l.avgStay) + '</td><td>' + num(l.contact) + '</td><td>' + num(l.inquiries) + '</td></tr>'; }).join('') + '</tbody></table>'
        : '<p class="empty-s">아직 데이터가 없습니다.</p>';
      var tot = j.sessionsCount || 0;
      $('#st-act').innerHTML = tot ? '<ul class="st-bars">' + (j.behavior || []).map(function(b){
        return '<li><span class="l">' + esc(b.name) + '</span><span class="b"><i style="width:' + Math.max(2, b.sessions / tot * 100) + '%"></i></span><span class="n">' + num(b.sessions) + '명 · ' + pct(b.sessions, tot) + '</span></li>'; }).join('') + '</ul><p class="hint" style="margin:10px 0 0">전체 방문 ' + num(tot) + '건 중 해당 행동을 한 방문 수입니다.</p>'
        : '<p class="empty-s">아직 데이터가 없습니다.</p>';
      var GTAG = {'광고':'ad', '자연 유입':'org', '직접·기타':'etc'};
      $('#st-journey').innerHTML = (j.journeys || []).length ? '<ol class="jr">' + j.journeys.map(function(x){
        var d = new Date(x.start), hh = function(n){ return (n < 10 ? '0' : '') + n; };
        var when = (d.getMonth() + 1) + '.' + d.getDate() + ' ' + hh(d.getHours()) + ':' + hh(d.getMinutes());
        var steps = x.steps.map(function(st){
          if(st.kind === 'page') return '<span class="st-p">' + esc(pname(st.p)) + '</span>';
          var cls = /상담 신청/.test(st.a) ? 'st-a win' : /전화|카톡/.test(st.a) ? 'st-a hot' : 'st-a';
          return '<span class="' + cls + '">' + esc(st.a) + (st.val && !/^\d+$/.test(st.val) && st.a !== '전화 클릭' ? ' · ' + esc(st.val) : '') + '<small>' + sec2(st.sec) + '</small></span>';
        }).join('<i class="arr">›</i>');
        return '<li' + (x.converted ? ' class="conv"' : '') + '><div class="jr-h"><b>' + when + '</b><i class="tag ' + (GTAG[x.group] || 'etc') + '">' + esc(x.src || '확인 불가') + '</i>' + (x.kw ? '<span class="kw">키워드: ' + esc(x.kw) + '</span>' : '') +
          '<span class="meta">' + (x.dev === 'm' ? '모바일' : 'PC') + ' · ' + x.pages + '페이지 · ' + sec2(x.stay) + (x.converted ? ' · <b class="ok">상담 신청</b>' : x.contacted ? ' · <b class="hot">연락 시도</b>' : '') + '</span></div><div class="jr-s">' + steps + '</div></li>'; }).join('') + '</ol>'
        : '<p class="empty-s">아직 데이터가 없습니다.</p>';
      $('#st-kw').innerHTML = bars(j.keywords);
      $('#st-dev').innerHTML = bars(j.devices, DEV);
    }).catch(function(err){ $('#st-cards').innerHTML = '<p class="empty-s">' + esc(err.message) + '</p>'; });
  }
  $$('#st-range button').forEach(function(b){ b.addEventListener('click', function(){ stDays = +b.dataset.d; $$('#st-range button').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); loadStats(); }); });
  $('#st-refresh').addEventListener('click', loadStats);


  /* ---------------- 백업 · 복원 · 검색엔진 알림 ---------------- */
  $('#bk-down').addEventListener('click', function(){
    api('GET', '/admin/backup').then(function(j){
      var blob = new Blob([JSON.stringify(j, null, 1)], {type:'application/json'});
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '애드스팟_백업_' + new Date().toISOString().slice(0,10) + '.json'; a.click();
      toast('백업 파일을 내려받았습니다. (상담 ' + (j.inquiries || []).length + '건)');
    }).catch(function(err){ toast('백업 실패: ' + err.message); });
  });
  $('#bk-up').addEventListener('change', function(e){
    var file = e.target.files[0]; e.target.value = ''; if(!file) return;
    var r = new FileReader();
    r.onload = function(){
      var data; try{ data = JSON.parse(r.result); }catch(err){ toast('백업 파일 형식이 아닙니다.'); return; }
      var n = (data.inquiries || []).length;
      if(!confirm('백업 파일을 불러올까요?\n- 홈페이지 수정 내용: ' + (data.content ? '있음 (현재 내용을 덮어씁니다)' : '없음') + '\n- 상담 내역: ' + n + '건 (같은 건은 덮어쓰고, 나머지는 추가)')) return;
      var from = prompt('관리자에서 올린 이미지·영상도 예전 사이트에서 가져올까요?\n가져오려면 예전 사이트 주소를 입력하세요. (건너뛰려면 비워두세요)', 'https://xn--hy1bj5x75biyv.com') || '';
      toast('불러오는 중입니다…');
      api('POST', '/admin/restore', {data:data, fromOrigin:from.trim()}).then(function(j){
        var x = j.result || {};
        alert('불러오기 완료\n- 홈페이지 수정 내용: ' + (x.content ? '반영' : '없음') + '\n- 상담 내역: ' + x.inquiries + '건\n- 이미지·영상: ' + x.media + '개' + ((x.mediaFailed || []).length ? '\n- 가져오지 못한 파일: ' + x.mediaFailed.join(', ') : ''));
        loadInquiries(); loadContent();
      }).catch(function(err){ toast('불러오기 실패: ' + err.message); });
    };
    r.readAsText(file);
  });
  $('#ix-ping').addEventListener('click', function(){
    api('POST', '/admin/indexnow').then(function(j){
      var ok = (j.results || []).filter(function(r){ return r.status >= 200 && r.status < 300; }).length;
      toast('검색엔진 알림 전송: ' + ok + '/' + (j.results || []).length + '곳 접수 (페이지 ' + j.count + '개)');
    }).catch(function(err){ toast('알림 실패: ' + err.message); });
  });

  /* 시작 */
  if(token){ showApp(); } else { $('#login').hidden = false; }
})();
