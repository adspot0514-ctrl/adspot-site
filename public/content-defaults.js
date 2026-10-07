/* ADSPOT — 홈페이지 기본 콘텐츠 (관리자 페이지에서 저장한 값이 없을 때 사용) */
window.ADSPOT_DEFAULTS = {
  contact: { phoneTel: '01086752328', phoneText: '010-8675-2328', kakaoUrl: 'https://open.kakao.com/o/sVUpCoQi' },
  hero: {
    kicker: '10년 전부터, 법무법인이 선택한 법률마케팅',
    lead: '애드스팟은 법무법인 내부 홍보팀으로 시작한 만큼\n실제 변호사님의 특수성에 적합한 온라인 마케팅을 진단 후,\n시기에 고려한 맞춤형 광고를 집행합니다.'
  },
  firms: [
    {name:'법무법인 A', start:'2017-02-14T10:30:00+09:00'},
    {name:'법무법인 B', start:'2018-05-21T14:20:00+09:00'},
    {name:'법무법인 C', start:'2019-03-11T09:45:00+09:00'},
    {name:'법무법인 D', start:'2020-08-03T16:10:00+09:00'},
    {name:'법무법인 E', start:'2021-06-17T11:05:00+09:00'}
  ],
  stories: [
    {year:'10년 전', years:10, title:'작은 방의 파트너에서,<br>함께 이끄는 대표로.', desc:'법무법인 작은 방을 사용하던 파트너 변호사에서 수십 명의 구성원 변호사들과 함께하는 대표변호사로.',
      from:'파트너 변호사 1인', to:'구성원 변호사 수십 명', before:1, after:34},
    {year:'9년 전', years:9, title:'혼자 시작한 사무소에서,<br>한 층을 이끄는 대표로.', desc:'1인 체제의 작은 법률사무소에서 서초동 빌딩 한 층을 이끄는 대표변호사로. 그 시간에도 함께했습니다.',
      from:'1인 법률사무소', to:'빌딩 한 층의 사무소', before:1, after:28},
    {year:'8년 전', years:8, title:'두 사람이 시작한 곳에서,<br>수십 명이 함께하는 조직으로.', desc:'2명이 운영하던 법률사무소에서 수십 명의 직원이 함께하는 조직으로. 성장의 시간에도 애드스팟과 함께합니다.',
      from:'2명의 사무소', to:'수십 명의 조직', before:2, after:40}
  ],
  plans: [
    {key:'cafe', name:'대표 카페', desc:'지역 주민과 잠재 의뢰인이 모이는 대표 카페에 사무소를 노출합니다.', price:80000},
    {key:'influencer', name:'인플루언서 블로그', desc:'영향력 있는 블로거의 정보성 콘텐츠로 검색 노출을 확보합니다.', price:100000},
    {key:'blog', name:'준최적화 블로그', desc:'검색 노출에 유리한 준최적화 블로그로 분야 키워드 콘텐츠를 꾸준히 발행합니다.', price:10000}
  ],
  fields: [
    {name:'형사', mix:{cafe:25, influencer:25, blog:30}},
    {name:'이혼·가사', mix:{cafe:20, influencer:20, blog:20}},
    {name:'분양권·부동산', mix:{cafe:25, influencer:20, blog:20}},
    {name:'금융사기·계좌정지', mix:{cafe:15, influencer:15, blog:30}},
    {name:'민사·기타', mix:{cafe:10, influencer:10, blog:20}}
  ],
  pricingNote: '모든 금액은 건당 금액이며 부가세 별도입니다. 분야별 조합은 예시이며, 1개월 단위 계약으로 상담을 통해 건수를 확정합니다.',
  footer: { company: '애드스팟', ceo: '이종원, 양태호', bizno: '642-70-00165', address: '서울특별시 서초구 사임당로 174 9층 905호', phone1: '010-8675-2328', phone2: '' },
  heroHeadline: {"headlinePc": "[검사장, 부장검사] 출신 대표변호사\n모두가 찾는 애드스팟입니다.", "headlineMo": "[검사장, 부장검사] 출신\n대표변호사 모두가 찾는\n애드스팟입니다."},
  texts: {
    "st.sub1": "장기 계약으로 묶어두지 않습니다.",
    "st.sub2": "매달 다시 선택받는 광고,",
    "st.sub3": "그 결과가 곧 애드스팟입니다.",
    "id.kicker": "애드스팟",
    "id.title": "1개월 단위 계약으로\n현재까지 연속 진행중",
    "id.lead": "장기 계약으로 묶어두지 않습니다. 매달 다시 선택받아야 이어지는 구조이기에, 함께한 시간이 곧 결과에 대한 평가입니다.",
    "id.f1y": "2015",
    "id.f1": "법무법인 내부 홍보팀에서 시작",
    "id.f2y": "2017",
    "id.f2": "애드스팟 법률마케팅 서비스 시작",
    "id.f3y": "매월",
    "id.f3": "재계약으로 이어지는 파트너십",
    "clock.title": "함께하는 시간",
    "clock.sub": "계약 시작일부터 지금까지, 한 번도 멈추지 않은 시간",
    "stories.kicker": "성장 이야기",
    "stories.title": "여전히 애드스팟과 함께하고 있습니다.",
    "sc.intro1": "서초동,",
    "sc.intro2": "법조의 중심에서",
    "sc.y1": "2015",
    "sc.t1": "법무법인 내부 홍보팀에서\n시작했습니다.",
    "sc.y2": "2017",
    "sc.t2": "변호사님들의 파트너,\n애드스팟이 되었습니다.",
    "sc.y3": "지금",
    "sc.t3": "1개월 단위 계약으로,\n결과로 신뢰를 쌓아갑니다.",
    "why.kicker": "왜 애드스팟인가",
    "why.era": "변호사 4만명 시대,",
    "why.j1": "홀로 개업",
    "why.j1s": "변호사 1인 사무소에서",
    "why.j2": "30–50인 규모 법무법인",
    "why.j2s": "구성원·직원과 함께하는 조직으로",
    "why.j3": "소득 상위 10% 대표변호사",
    "why.j3s": "블로그 마케팅으로 [단 1년]",
    "why.quote": "법률 전문 애드스팟에서만 가능합니다.",
    "why.q": "어떤 마케팅을 원하시나요?",
    "pr.kicker": "가격안내",
    "pr.title": "분야에 맞게,\n시기에 맞게 추천드립니다.",
    "pr.custom": "상품을 따로 고르지 않아도 됩니다. 분야와 월 예산만 알려주시면 카페·인플루언서·준최적화 블로그를 가장 효과적으로 조합해 견적을 드립니다.",
    "ct.kicker": "상담문의",
    "ct.title": "지금 우리 로펌에 맞는\n마케팅이\n무엇인지부터\n진단해 드립니다.",
    "ct.lead": "분야, 지역, 현재 운영 중인 채널을 알려주시면 1개월 단위로 시작할 수 있는 방안을 제안드립니다.",
    "ct.f1": "문의 접수",
    "ct.f1s": "전화·카톡·신청서 중 편한 방법으로",
    "ct.f2": "현황 진단",
    "ct.f2s": "분야와 지역, 현재 채널의 노출 상태 확인",
    "ct.f3": "1개월 단위 제안",
    "ct.f3s": "한 달부터 시작하고, 결과로 다음 달 결정",
    "ct.t1": "2015년 법무법인 내부 홍보팀에서 출발",
    "ct.t2": "법률 분야만 전문으로",
    "ct.t3": "1개월 단위 계약"
},
  media: {
    "hero.city": {
        "type": "video",
        "url": "assets/hero/city_night.mp4",
        "poster": "assets/hero/city_night_poster.jpg"
    },
    "hero.court": {
        "type": "video",
        "url": "assets/hero/court_night.mp4",
        "poster": "assets/hero/court_night_poster.jpg"
    },
    "sc.m1": {
        "type": "image",
        "url": "assets/hero/court_angle.jpg"
    },
    "sc.m2": {
        "type": "image",
        "url": "assets/hero/partner_towers.jpg"
    },
    "sc.m3": {
        "type": "video",
        "url": "assets/hero/court_timelapse.mp4",
        "poster": "assets/hero/court_timelapse_poster.jpg"
    }
},
  portfolio: [
    {
        "name": "법무법인 제이엘",
        "url": "assets/portfolio/jeiel.png"
    },
    {
        "name": "법무법인 창경",
        "url": "assets/portfolio/changkyung.png"
    },
    {
        "name": "법무법인 윤강",
        "url": "assets/portfolio/yungang.png"
    },
    {
        "name": "법무법인 에이앤랩",
        "url": "assets/portfolio/anlab.png"
    },
    {
        "name": "법무법인 새로",
        "url": "assets/portfolio/saero.png"
    },
    {
        "name": "법무법인 서울센트럴",
        "url": "assets/portfolio/central.png"
    },
    {
        "name": "법무법인 심평",
        "url": "assets/portfolio/simpyeong.png"
    },
    {
        "name": "ARIS International Lawyers",
        "url": "assets/portfolio/airs.png"
    },
    {
        "name": "법률사무소 강물",
        "url": "assets/portfolio/kangmul.png"
    },
    {
        "name": "법무법인 기세",
        "url": "assets/portfolio/gise.png"
    },
    {
        "name": "법률사무소 위인",
        "url": "assets/portfolio/wiin.png"
    },
    {
        "name": "법무법인 주인",
        "url": "assets/portfolio/juin.png"
    }
]
};
