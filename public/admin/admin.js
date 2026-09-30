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
      footer: Object.assign({}, D.footer, C.footer || {}),
      heroHeadline: Object.assign({}, D.heroHeadline, C.heroHeadline || {}),
      texts: Object.assign({}, D.texts, C.texts || {}),
      media: Object.assign({}, D.media, C.media || {}),
      portfolio: pick(C.portfolio, D.portfolio).map(function(p){ return {name:p.name || '', url:p.url}; })
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
      '<div class="grid2">' + f('전화 상담 번호', 'phoneText', M.contact.phoneText, {hint:'예) 010-8675-2328'}) + f('카카오톡 채널 주소', 'kakaoUrl', M.contact.kakaoUrl, {hint:'예) https://pf.kakao.com/_xxxx/chat'}) + '</div>', true);
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
      footer: {company:v('company'), ceo:v('ceo'), bizno:v('bizno'), address:v('address'), phone1:v('phone1'), phone2:v('phone2')},
      heroHeadline: {headlinePc:v('headlinePc'), headlineMo:v('headlineMo')},
      texts: $$('[name^="tx_"]').reduce(function(o, el){ o[el.name.slice(3)] = el.value.trim(); return o; }, {}),
      media: JSON.parse(JSON.stringify(mediaState)),
      portfolio: $$('#pf-rows .pf-row').map(function(r){ return {name:$('[name=pf_name]', r).value.trim(), url:r.dataset.url}; })
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
