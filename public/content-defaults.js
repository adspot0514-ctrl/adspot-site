/* ADSPOT — 홈페이지 기본 콘텐츠 (관리자 페이지에서 저장한 값이 없을 때 사용) */
window.ADSPOT_DEFAULTS = {
  contact: { phoneTel: '01086752328', phoneText: '010-8675-2328', kakaoUrl: 'https://pf.kakao.com/_HYZrG/chat' },
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
  footer: { company: '애드스팟', ceo: '이종원, 양태호', bizno: '642-70-00165', address: '서울특별시 서초구 사임당로 174 9층 905호', phone1: '02-523-0514', phone2: '010-8675-2328' }
};
