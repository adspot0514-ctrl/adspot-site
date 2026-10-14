/* 하단 고정 빠른 상담 바 (PC·모바일 공통) */
(function(){
  'use strict';
  if(/^\/admin/.test(location.pathname) || document.getElementById('qb')) return;
  var CSS = '' +
  ':root{--qb-h:76px}' +
  'body.has-qb{padding-bottom:calc(var(--qb-h) + env(safe-area-inset-bottom,0px))}' +
  'body.has-qb .mbar{display:none !important}' +
  '#qb{position:fixed;left:0;right:0;bottom:0;z-index:60;background:linear-gradient(112deg,#16191e 0,#16191e calc(50% - 40px),#262a31 calc(50% - 39px),#262a31 100%);color:#fff;box-shadow:0 -10px 30px -12px rgba(0,0,0,.35);padding-bottom:env(safe-area-inset-bottom,0px);transition:transform .35s ease;font-family:"Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;letter-spacing:-.01em}' +
  '#qb.qb-off{transform:translateY(110%)}' +
  '#qb *{box-sizing:border-box}' +
  '.qb-in{max-width:1240px;margin:0 auto;height:var(--qb-h);display:flex;align-items:center;gap:18px;padding:0 24px}' +
  '.qb-call{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;flex:0 0 auto}' +
  '.qb-call i{width:auto;height:auto;background:none;display:grid;place-items:center}' +
  '.qb-call svg{width:18px;height:18px;fill:#fff}' +
  '.qb-call{display:grid !important;grid-template-columns:auto auto;grid-template-rows:auto auto;column-gap:7px;row-gap:1px;align-items:center}' +
  '.qb-call i{grid-column:1;grid-row:1}.qb-call>span{display:contents}.qb-call small{grid-column:2;grid-row:1}.qb-call b{grid-column:1/-1;grid-row:2}' +
  '.qb-call small{display:block;font-size:13px;color:rgba(255,255,255,.85);font-weight:600}' +
  '.qb-call b{display:block;font-size:25px;font-weight:800;line-height:1.1;letter-spacing:-.01em}' +
  '.qb-kakao{display:flex;align-items:center;gap:10px;height:46px;padding:0 6px;border-radius:12px;background:transparent;color:#fff;font-weight:800;font-size:20px;letter-spacing:-.02em;text-decoration:none;flex:0 0 auto}' +
  '.qb-kakao:hover{color:#f59350}' +
  '.qb-kakao svg{width:34px;height:34px}' +
  '.qb-sep{width:1px;height:34px;background:rgba(255,255,255,.22);flex:0 0 auto;order:0}' +
  '.qb-call{order:-2}.qb-sep{order:-1}.qb-kakao{order:0}.qb-form{order:1}' +
  '.qb-form{display:flex;align-items:center;gap:10px;margin-left:auto;flex:1 1 auto;justify-content:flex-end;min-width:0}' +
  '.qb-form input[type=text],.qb-form input[type=tel]{height:46px;border:0;border-radius:8px;padding:0 14px;font:inherit;font-size:15px;color:#16191e;background:#fff;width:150px;min-width:0}' +
  '.qb-form input[name=phone]{width:210px}' +
  '.qb-form input:focus{outline:2px solid #f59350;outline-offset:1px}' +
  '.qb-agree{display:flex;align-items:center;gap:7px;font-size:13px;color:rgba(255,255,255,.85);cursor:pointer;white-space:nowrap}' +
  '.qb-agree input{-webkit-appearance:none;appearance:none;width:26px;height:26px;margin:0;border-radius:6px;background:#fff;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}' +
  '.qb-agree input:checked{background:#d9772f}' +
  '.qb-agree input:checked::after{content:"";width:7px;height:12px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:translateY(-1px) rotate(45deg)}' +
  '.qb-agree input:focus-visible{outline:2px solid #f59350;outline-offset:2px}' +
  '.qb-agree button{background:none;border:0;color:rgba(255,255,255,.6);font:inherit;font-size:12px;text-decoration:underline;cursor:pointer;padding:0}' +
  '.qb-go{height:50px;padding:0 26px;border:0;border-radius:8px;background:#d9772f;color:#fff;font:inherit;font-weight:800;font-size:15.5px;cursor:pointer;white-space:nowrap}' +
  '.qb-go:hover{background:#c4661f}.qb-go:disabled{opacity:.6;cursor:default}' +
  '.qb-msg{position:absolute;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);background:#fff;color:#16191e;font-size:14px;font-weight:700;padding:10px 16px;border-radius:12px;box-shadow:0 10px 30px -10px rgba(0,0,0,.4);white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .25s}' +
  '.qb-msg.on{opacity:1}.qb-msg.err{color:#c0392b}.qb-msg.ok{color:#2f8f5b}' +
  '.qb-pol{position:absolute;right:16px;bottom:calc(100% + 10px);width:min(360px,calc(100vw - 32px));background:#fff;color:#3b4250;font-size:13px;line-height:1.65;padding:14px 16px;border-radius:14px;box-shadow:0 10px 30px -10px rgba(0,0,0,.4)}' +
  '.qb-pol b{color:#16191e}' +
  '.qb-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
  '@media (max-width:1100px){.qb-call b{font-size:20px}.qb-kakao{font-size:17px}.qb-form input[type=text]{width:120px}.qb-form input[name=phone]{width:150px}}' +
  /* 모바일: 두 줄 (위: 동의·전화·카톡 / 아래: 입력·신청) */
  '@media (max-width:860px){:root{--qb-h:104px}' +
    '.qb-in{height:var(--qb-h);display:grid;grid-template-columns:1fr auto auto;grid-template-rows:34px 50px;gap:6px 8px;padding:8px 12px 10px}' +
    '.qb-sep{display:none}' +
    '#qb{background:#16191e}.qb-call{grid-column:2;grid-row:1;display:flex !important;gap:6px;height:34px;padding:0 12px;border-radius:9px;background:transparent;border:1px solid rgba(255,255,255,.28)}.qb-call>span{display:inline}.qb-call b{grid-column:auto;grid-row:auto}' +
    '.qb-call i{width:22px;height:22px;background:none}.qb-call svg{width:16px;height:16px}.qb-call small{display:none}.qb-call b{font-size:13.5px}' +
    '.qb-call b .qb-num{display:none}.qb-call b .qb-lbl{display:inline}' +
    '.qb-kakao{grid-column:3;grid-row:1;height:34px;padding:0 12px;border-radius:9px;font-size:13.5px;border:1px solid rgba(255,255,255,.28);gap:6px}.qb-kakao svg{width:22px;height:20px}' +
    '.qb-form{display:contents}' +
    '.qb-agree{grid-column:1;grid-row:1;font-size:12px;gap:6px;min-width:0}.qb-agree span{overflow:hidden;text-overflow:ellipsis}' +
    '.qb-fields{grid-column:1/-1;grid-row:2;display:flex;gap:6px}' +
    '.qb-form input[type=text]{width:34%;height:50px;font-size:16px}.qb-form input[type=tel],.qb-form input[name=phone]{flex:1;width:auto;height:50px;font-size:16px}.qb-agree input{width:20px;height:20px;border-radius:5px}.qb-agree input:checked::after{width:5px;height:9px}' +
    '.qb-go{height:50px;padding:0 16px;font-size:15px}' +
    '.qb-msg{white-space:normal;width:calc(100vw - 32px);text-align:center}}' +
  '@media (min-width:861px){.qb-call b .qb-lbl{display:none}.qb-fields{display:contents}.qb-form input[name=office]{order:1}.qb-form input[name=phone]{order:2}.qb-agree{order:3}.qb-go{order:4}}' +
  '#qb.qb-flash .qb-fields input[name=phone]{animation:qbFlash 1.4s ease 2}' +
  '@keyframes qbFlash{0%,100%{box-shadow:0 0 0 0 rgba(245,147,80,0)}50%{box-shadow:0 0 0 5px rgba(245,147,80,.55)}}' +
  '.qb-target{animation:qbTarget 1.6s ease 2;border-radius:16px}' +
  '@keyframes qbTarget{0%,100%{box-shadow:0 0 0 0 rgba(217,119,47,0)}50%{box-shadow:0 0 0 6px rgba(217,119,47,.35)}}' +
  /* 오른쪽 고정 버튼: 하나의 어두운 띠 안에 같은 모양으로 */
  '.quick{background:#16191e !important;border:1px solid rgba(255,255,255,.14) !important;border-radius:44px !important;padding:18px 10px !important;gap:16px !important;box-shadow:0 16px 34px -12px rgba(22,25,30,.5) !important}' +
  '.quick .quick-btn{width:66px !important;height:auto !important;padding:0 !important;background:transparent !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;color:#fff !important;gap:7px !important;font-size:11.5px !important;font-weight:700 !important;letter-spacing:-.02em;transform:none !important}' +
  '.quick .quick-btn svg{box-sizing:border-box;width:44px !important;height:44px !important;padding:11px;border:1.6px solid rgba(255,255,255,.9);border-radius:50%;fill:none !important;stroke:#fff !important;stroke-width:1.8;transition:border-color .2s,background .2s,stroke .2s}' +
  '.quick .quick-btn svg .fill{fill:#fff !important;stroke:none !important;transition:fill .2s}' +
  '.quick .quick-btn span{color:#fff;transition:color .2s}' +
  '.quick .quick-btn:hover svg,.quick .quick-btn:focus-visible svg{border-color:#f59350;background:rgba(245,147,80,.14);stroke:#f59350 !important}' +
  '.quick .quick-btn:hover svg .fill,.quick .quick-btn:focus-visible svg .fill{fill:#f59350 !important}' +
  '.quick .quick-btn:hover span,.quick .quick-btn:focus-visible span{color:#f59350}' +
  '.quick .quick-btn:focus-visible{outline:none}' +
  '@media (min-width:861px) and (max-width:1239px){.quick{display:flex !important;right:10px !important;padding:14px 6px !important;gap:12px !important}.quick .quick-btn{width:56px !important;font-size:10.5px !important}.quick .quick-btn svg{width:38px !important;height:38px !important;padding:9px}}' +
  '@media (prefers-reduced-motion:reduce){#qb{transition:none}}';

  function build(){
    var st = document.createElement('style'); st.id = 'qb-css'; st.textContent = CSS; document.head.appendChild(st);
    var telA = document.querySelector('a[href^="tel:"]'), kakaoA = document.querySelector('a[data-kakao], a[href*="open.kakao.com"]');
    var tel = telA ? telA.getAttribute('href') : 'tel:01086752328', kakao = kakaoA ? kakaoA.getAttribute('href') : 'https://open.kakao.com/o/sVUpCoQi';
    var fmt = function(t){ var d = t.replace(/[^0-9]/g, ''); return d.length === 11 ? d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : d.length === 10 ? d.replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3') : d; };
    var bar = document.createElement('div'); bar.id = 'qb'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', '빠른 상담 신청');
    bar.innerHTML =
      '<div class="qb-in">' +
        '<a class="qb-call" href="' + tel + '" data-phone><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a11 11 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg></i><span><small>상담 전화</small><b><span class="qb-num">' + fmt(tel) + '</span><span class="qb-lbl" hidden>전화</span></b></span></a>' +
        '<a class="qb-kakao" href="' + kakao + '" target="_blank" rel="noopener" data-kakao><svg viewBox="0 0 36 32" aria-hidden="true"><path fill="#fff" d="M18 2C8.6 2 1 8 1 15.3c0 4.7 3.1 8.8 7.8 11.2l-1.6 5.6c-.1.5.4.9.9.6l6.6-4.4c1.1.2 2.2.3 3.3.3 9.4 0 17-6 17-13.3S27.4 2 18 2z"/><text x="18" y="18.6" text-anchor="middle" font-size="8.6" font-weight="800" font-family="Arial,sans-serif" fill="#16191e">TALK</text></svg>카톡상담</a>' +
        '<span class="qb-sep" aria-hidden="true"></span>' +
        '<form class="qb-form" novalidate>' +
          '<div class="qb-fields"><input type="text" name="office" placeholder="로펌명" autocomplete="organization" aria-label="로펌명"><input type="tel" name="phone" placeholder="연락처" inputmode="tel" autocomplete="tel" aria-label="연락처" required>' +
          '<button type="submit" class="qb-go">무료 상담 신청</button></div>' +
          '<label class="qb-agree"><input type="checkbox" name="agree"><span>개인정보 수집·이용 동의</span><button type="button" class="qb-pv" aria-expanded="false">보기</button></label>' +
          '<input class="qb-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '</form>' +
      '</div>' +
      '<div class="qb-msg" role="status" aria-live="polite"></div>' +
      '<div class="qb-pol" hidden><b>개인정보 수집·이용 안내</b><br>수집 항목: 로펌명, 연락처<br>이용 목적: 상담 신청 확인 및 상담 연락<br>상담을 위한 개인정보(로펌명·연락처) 수집·이용에 동의하지 않으실 수 있으며, 이 경우 빠른 상담 신청이 어렵습니다. 전화·카톡으로 문의하실 수 있습니다.</div>';
    // 모바일 라벨 표시용
    bar.querySelector('.qb-lbl').removeAttribute('hidden');
    document.body.appendChild(bar); document.body.classList.add('has-qb');
    var form = bar.querySelector('form'), msg = bar.querySelector('.qb-msg'), pol = bar.querySelector('.qb-pol'), tm;
    function say(t, cls){ clearTimeout(tm); msg.textContent = t; msg.className = 'qb-msg on ' + (cls || ''); tm = setTimeout(function(){ msg.className = 'qb-msg'; }, 4000); }
    bar.querySelector('.qb-pv').addEventListener('click', function(e){ e.preventDefault(); var o = pol.hidden; pol.hidden = !o; this.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', function(e){ if(!pol.hidden && !e.target.closest('.qb-pol') && !e.target.closest('.qb-pv')) pol.hidden = true; });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var phone = form.phone.value.trim(), btn = form.querySelector('.qb-go');
      if(!/^[0-9\-\s+()]{9,}$/.test(phone)){ say('연락처를 정확히 입력해 주세요.', 'err'); form.phone.focus(); return; }
      if(!form.agree.checked){ say('개인정보 수집·이용에 동의해 주세요.', 'err'); return; }
      var saved = null; try{ saved = JSON.parse(sessionStorage.getItem('adspot-src') || 'null'); }catch(e2){}
      var q = {}; try{ q = Object.fromEntries(new URLSearchParams(location.search)); }catch(e3){}
      var entry = ''; try{ entry = sessionStorage.getItem('adspot-entry') || ''; }catch(e4){}
      var regionForm = document.querySelector('form.rform[data-region]');
      var ad = (saved || q.n_media) ? { region: (saved && saved.region) || (regionForm ? regionForm.getAttribute('data-region') : ''), src: q.n_media ? '네이버 파워링크' : ((saved && saved.src) || ''), kw: q.n_query || q.n_keyword || (saved && saved.kw) || '' } : null;
      btn.disabled = true; var label = btn.textContent; btn.textContent = '접수 중…';
      fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        office: form.office.value.trim(), phone: phone, field: '', services: [], message: '하단 빠른 상담 신청',
        agree: true, hp: form.website.value, source: 'form', ad: ad, page: location.pathname, entry: entry, sid: window.__adspotSid || '' }) })
        .then(function(r){ if(!r.ok) throw new Error(r.status === 429 ? 'rate' : 'fail'); return r.json(); })
        .then(function(){ form.reset(); say('상담 신청이 접수되었습니다. 확인 후 빠르게 연락드리겠습니다.', 'ok'); })
        .catch(function(err){ say(err.message === 'rate' ? '잠시 후 다시 시도해 주세요.' : '접수 중 문제가 생겼습니다. 전화나 카톡으로 문의해 주세요.', 'err'); })
        .then(function(){ btn.disabled = false; btn.textContent = label; });
    });

    // 오른쪽 고정 버튼에 '문의' 추가 (없는 페이지는 전화·카톡·문의 묶음을 새로 만듦)
    var ASK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M8 9h8M8 12h5"/></svg>';
    var quick = document.querySelector('.quick');
    if(!quick){
      quick = document.createElement('aside'); quick.className = 'quick'; quick.setAttribute('aria-label', '빠른 상담');
      quick.innerHTML = '<a class="quick-btn" href="' + tel + '" aria-label="전화 상담"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a11 11 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg><span>전화</span></a>' +
        '<a class="quick-btn is-kakao" href="' + kakao + '" target="_blank" rel="noopener" aria-label="카카오톡 상담"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 5.9l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .8.1 1.2.1 5 0 9-3.1 9-7s-4-7.1-9-7.1z"/></svg><span>카톡</span></a>';
      document.body.appendChild(quick);
    }
    if(!quick.querySelector('.is-ask')){
      var ask = document.createElement('a'); ask.className = 'quick-btn is-ask'; ask.href = '#'; ask.setAttribute('aria-label', '상담 문의하기');
      ask.innerHTML = ASK_SVG + '<span>상담문의</span>'; quick.appendChild(ask);
      var lb = quick.querySelectorAll('.quick-btn span'); if(lb[0]) lb[0].textContent = '전화상담'; if(lb[1]) lb[1].textContent = '카톡상담';
      ask.addEventListener('click', function(e){
        e.preventDefault();
        var target = document.querySelector('#apply form, #apply, #inquiry, #contact form, #contact');
        if(target){
          var box = target.closest('section') || target;
          box.scrollIntoView({behavior: 'smooth', block: 'start'});
          var f = target.matches('form') ? target : target.querySelector('form');
          setTimeout(function(){ var inp = f && (f.querySelector('input[name=office]') || f.querySelector('input[name=phone]') || f.querySelector('input, textarea')); if(inp) inp.focus({preventScroll: true});
            if(f){ f.classList.add('qb-target'); setTimeout(function(){ f.classList.remove('qb-target'); }, 3400); } }, 700);
        } else {   // 신청서가 없는 페이지는 하단 빠른 상담으로
          bar.classList.remove('qb-off'); bar.classList.add('qb-flash'); form.office.focus();
          setTimeout(function(){ bar.classList.remove('qb-flash'); }, 3000);
        }
      });
    }
    // 관리자에서 바꾼 전화번호·카톡 주소 따라가기
    function sync(){
      var t = document.querySelector('.mbar a[href^="tel:"], a[data-phone][href^="tel:"]:not(.qb-call)'), k = document.querySelector('.mbar a[data-kakao], a[data-kakao]:not(.qb-kakao)');
      if(t){ var h = t.getAttribute('href'); var c = bar.querySelector('.qb-call'); c.setAttribute('href', h); bar.querySelector('.qb-num').textContent = fmt(h); }
      if(k) bar.querySelector('.qb-kakao').setAttribute('href', k.getAttribute('href'));
    }
    setTimeout(sync, 1200); setTimeout(sync, 4000);
    // 본문의 상담 신청서가 화면에 보이면 겹치지 않게 잠시 숨김
    var forms = document.querySelectorAll('#apply, #contact, #inquiry, .apply-wrap');
    if(forms.length && 'IntersectionObserver' in window){
      var vis = new Set();
      var io = new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting) vis.add(x.target); else vis.delete(x.target); }); bar.classList.toggle('qb-off', vis.size > 0 && !bar.contains(document.activeElement)); }, {threshold: .25});
      forms.forEach(function(f){ io.observe(f); });
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
