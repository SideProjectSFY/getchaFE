// 목 데이터 - 팝마트, 애니메이트 스타일 참고
// 카테고리별 대표 이미지 (애니메이트 스타일)
// 실제 애니메이트 온라인샵의 굿즈 이미지 스타일 사용
// 참고: https://www.animate-onlineshop.co.kr
export const categoryImages = {
  'ALL': '/images/images/all.jpg',
  '피규어': '/images/images/figure.jpg',
  '포토카드': '/images/images/photocard.jpg',
  '아크릴 스탠드': '/images/images/acrylic-stand.jpg',
  '키링': '/images/images/keyring.jpg',
  '인형': '/images/images/plush.jpg',
  '포스터': '/images/images/poster.jpg',
  '그 외 굿즈': '/images/images/other.jpg',
  '기타': '/images/images/other.jpg'
}

// 굿즈 목 데이터
export const mockGoods = [
  {
    id: 1,
    title: '【굿즈-피규어】 주술회전 고죠 사토루 피규어',
    sellerNickname: '덕후마스터',
    sellerId: 1,
    animeTitle: '주술회전',
    characterName: '고죠 사토루',
    category: '피규어',
    description: '주술회전 인기 캐릭터 고죠 사토루 피규어입니다. 고퀄리티 제작으로 디테일이 뛰어납니다.',
    images: [
      '/images/images/jujutsu-kaisen-goods.jpg',
      '/images/images/figure.jpg',
      '/images/images/figure-2.jpg'
    ],
    startPrice: 50000,
    currentBid: 75000,
    maxPrice: 150000,
    status: 'ONGOING',
    wishCount: 23,
    bidCount: 5,
    timeRemaining: 86400,
    createdAt: '2024-01-15T10:00:00Z',
    bidders: [
      { id: 2, nickname: '애니러버', bidAmount: 75000 },
      { id: 3, nickname: '굿즈수집가', bidAmount: 70000 }
    ]
  },
  {
    id: 2,
    title: '【굿즈-포토카드】 SPY×FAMILY 아냐 포토카드 세트',
    sellerNickname: '애니컬렉터',
    sellerId: 2,
    animeTitle: 'SPY×FAMILY',
    characterName: '아냐 포저',
    category: '포토카드',
    description: 'SPY×FAMILY 아냐 포토카드 한정판 세트입니다. 총 10장 구성입니다.',
    images: [
      '/images/images/photocard.jpg',
      '/images/images/photocard-1.jpg'
    ],
    startPrice: 30000,
    currentBid: 45000,
    maxPrice: 80000,
    status: 'ONGOING',
    wishCount: 15,
    bidCount: 3,
    timeRemaining: 172800,
    createdAt: '2024-01-14T14:30:00Z',
    bidders: [
      { id: 1, nickname: '덕후마스터', bidAmount: 45000 }
    ]
  },
  {
    id: 3,
    title: '【굿즈-아크릴 스탠드】 하이큐!! 히나타 쇼요 아크릴 스탠드',
    sellerNickname: '볼리버',
    sellerId: 3,
    animeTitle: '하이큐!!',
    characterName: '히나타 쇼요',
    category: '아크릴 스탠드',
    description: '하이큐!! 주인공 히나타 쇼요 아크릴 스탠드입니다.',
    images: [
      '/images/images/anime-acrylic-stand.jpg'
    ],
    startPrice: 25000,
    currentBid: 35000,
    status: 'ONGOING',
    wishCount: 8,
    bidCount: 2,
    timeRemaining: 259200,
    createdAt: '2024-01-13T09:15:00Z',
    bidders: [
      { id: 4, nickname: '스포츠덕후', bidAmount: 35000 }
    ]
  },
  {
    id: 4,
    title: '【굿즈-키링】 원신 파이몬 키링',
    sellerNickname: '게임덕후',
    sellerId: 4,
    animeTitle: '원신',
    characterName: '파이몬',
    category: '키링',
    description: '원신 파이몬 공식 키링입니다. 고품질 아크릴 재질입니다.',
    images: [
      '/images/images/keyring.jpg'
    ],
    startPrice: 15000,
    currentBid: 22000,
    maxPrice: 40000,
    status: 'ONGOING',
    wishCount: 12,
    bidCount: 4,
    timeRemaining: 432000,
    createdAt: '2024-01-12T16:45:00Z',
    bidders: [
      { id: 5, nickname: '원신러버', bidAmount: 22000 }
    ]
  },
  {
    id: 5,
    title: '【굿즈-인형】 진격의 거인 에렌 인형',
    sellerNickname: '거인덕후',
    sellerId: 5,
    animeTitle: '진격의 거인',
    characterName: '에렌 예거',
    category: '인형',
    description: '진격의 거인 에렌 예거 공식 인형입니다. 부드러운 재질로 제작되었습니다.',
    images: [
      '/images/images/plush.jpg',
      '/images/images/attack-on-titan-goods.jpg'
    ],
    startPrice: 40000,
    currentBid: 60000,
    status: 'ONGOING',
    wishCount: 18,
    bidCount: 6,
    timeRemaining: 345600,
    createdAt: '2024-01-11T11:20:00Z',
    bidders: [
      { id: 6, nickname: '거인팬', bidAmount: 60000 }
    ]
  },
  {
    id: 6,
    title: '【굿즈-포스터】 나의 히어로 아카데미아 올마이트 포스터',
    sellerNickname: '히어로팬',
    sellerId: 6,
    animeTitle: '나의 히어로 아카데미아',
    characterName: '올마이트',
    category: '포스터',
    description: '나의 히어로 아카데미아 올마이트 한정 포스터입니다. A2 사이즈입니다.',
    images: [
      '/images/images/poster.jpg'
    ],
    startPrice: 20000,
    currentBid: 28000,
    maxPrice: 50000,
    status: 'ONGOING',
    wishCount: 9,
    bidCount: 3,
    timeRemaining: 518400,
    createdAt: '2024-01-10T13:10:00Z',
    bidders: [
      { id: 7, nickname: '히어로수집가', bidAmount: 28000 }
    ]
  },
  {
    id: 7,
    title: '【굿즈-그 외 굿즈】 블루 아카이브 뱃지 세트',
    sellerNickname: '게임컬렉터',
    sellerId: 7,
    animeTitle: '블루 아카이브',
    category: '그 외 굿즈',
    description: '블루 아카이브 캐릭터 뱃지 세트입니다. 총 5개 구성입니다.',
    images: [
      '/images/images/other.jpg'
    ],
    startPrice: 35000,
    currentBid: 50000,
    status: 'COMPLETED',
    wishCount: 14,
    bidCount: 5,
    timeRemaining: 0,
    completedAt: '2024-01-07T18:00:00Z',
    createdAt: '2024-01-09T15:30:00Z',
    bidders: [
      { id: 8, nickname: '블루아카팬', bidAmount: 50000 }
    ]
  },
  {
    id: 8,
    title: '【굿즈-피규어】 천관사복 미카즈키 피규어',
    sellerNickname: '애니마니아',
    sellerId: 8,
    animeTitle: '천관사복',
    characterName: '미카즈키',
    category: '피규어',
    description: '천관사복 미카즈키 프리미엄 피규어입니다. 한정판입니다.',
    images: [
      '/images/images/figure-3.jpg',
      '/images/images/anime-figure-collectible.jpg'
    ],
    startPrice: 80000,
    currentBid: 120000,
    maxPrice: 200000,
    status: 'COMPLETED',
    wishCount: 31,
    bidCount: 7,
    timeRemaining: 0,
    completedAt: '2024-01-06T21:10:00Z',
    createdAt: '2024-01-08T10:00:00Z',
    bidders: [
      { id: 9, nickname: '천관팬', bidAmount: 120000 }
    ]
  }
]

// 인기 굿즈 목 데이터 (완료된 경매 포함)
export const mockPopularGoods = [
  mockGoods[0],
  mockGoods[6], // 완료된 경매
  mockGoods[1],
  mockGoods[4],
  mockGoods[7], // 완료된 경매
  mockGoods[2]
].filter(Boolean)

// 추천 굿즈 목 데이터 (완료 상태 확인용)
export const mockRecommendedGoods = [
  mockGoods[6], // COMLETED
  mockGoods[0],
  mockGoods[7], // COMPLETED
  mockGoods[3]
].filter(Boolean)

// 댓글 목 데이터
export const mockComments = {
  1: [
    {
      id: 1,
      authorId: 2,
      authorNickname: '애니러버',
      content: '정말 멋진 피규어네요! 품질이 어떤가요?',
      createdAt: '2024-01-15T11:00:00Z',
      parentId: null,
      replies: [
        {
          id: 2,
          authorId: 1,
          authorNickname: '덕후마스터',
          content: '네, 정말 고퀄리티입니다! 디테일이 뛰어나요.',
          createdAt: '2024-01-15T11:30:00Z',
          parentId: 1,
          replies: []
        }
      ]
    },
    {
      id: 3,
      authorId: 3,
      authorNickname: '굿즈수집가',
      content: '배송은 어떻게 되나요?',
      createdAt: '2024-01-15T12:00:00Z',
      parentId: null,
      replies: []
    }
  ],
  2: [
    {
      id: 4,
      authorId: 1,
      authorNickname: '덕후마스터',
      content: '아냐 포토카드 너무 귀여워요!',
      createdAt: '2024-01-14T15:00:00Z',
      parentId: null,
      replies: [
        {
          id: 5,
          authorId: 2,
          authorNickname: '애니컬렉터',
          content: '감사합니다! 한정판이라 희귀하답니다.',
          createdAt: '2024-01-14T15:15:00Z',
          parentId: 4,
          replies: []
        }
      ]
    }
  ],
  3: [
    {
      id: 6,
      authorId: 4,
      authorNickname: '스포츠덕후',
      content: '히나타 아크릴 스탠드 최고예요!',
      createdAt: '2024-01-13T10:00:00Z',
      parentId: null,
      replies: []
    }
  ],
  4: [
    {
      id: 7,
      authorId: 5,
      authorNickname: '원신러버',
      content: '파이몬 키링 너무 귀여워요!',
      createdAt: '2024-01-12T17:00:00Z',
      parentId: null,
      replies: []
    }
  ],
  5: [
    {
      id: 8,
      authorId: 6,
      authorNickname: '거인팬',
      content: '에렌 인형 상태가 어떤가요?',
      createdAt: '2024-01-11T12:00:00Z',
      parentId: null,
      replies: [
        {
          id: 9,
          authorId: 5,
          authorNickname: '거인덕후',
          content: '새상품 수준입니다! 포장도 완벽해요.',
          createdAt: '2024-01-11T12:30:00Z',
          parentId: 8,
          replies: []
        }
      ]
    }
  ],
  6: [
    {
      id: 10,
      authorId: 7,
      authorNickname: '히어로수집가',
      content: '올마이트 포스터 사이즈가 궁금해요!',
      createdAt: '2024-01-10T14:00:00Z',
      parentId: null,
      replies: []
    }
  ],
  7: [
    {
      id: 11,
      authorId: 8,
      authorNickname: '블루아카팬',
      content: '뱃지 세트 구성이 궁금합니다!',
      createdAt: '2024-01-09T16:00:00Z',
      parentId: null,
      replies: []
    }
  ],
  8: [
    {
      id: 12,
      authorId: 9,
      authorNickname: '천관팬',
      content: '미카즈키 피규어 정말 멋지네요!',
      createdAt: '2024-01-08T11:00:00Z',
      parentId: null,
      replies: [
        {
          id: 13,
          authorId: 8,
          authorNickname: '애니마니아',
          content: '감사합니다! 한정판이라 희귀합니다.',
          createdAt: '2024-01-08T11:20:00Z',
          parentId: 12,
          replies: []
        }
      ]
    }
  ]
}

// 댓글 가져오기 함수
export function getCommentsByGoodsId(goodsId) {
  return mockComments[goodsId] || []
}

export function getGoodsByIds(ids = []) {
  if (!Array.isArray(ids)) return []
  return mockGoods.filter(goods => ids.includes(goods.id))
}

export const mockWishlistByUser = {
  default: [1, 2, 3],
  1: [1, 4, 7],
  2: [2, 5, 6],
  3: [3, 8, 1]
}

export const mockTransactions = {
  default: [
    {
      id: 'txn-default-1',
      type: 'DEPOSIT',
      description: '지갑 충전',
      amount: 200000,
      createdAt: '2024-01-15T08:00:00Z'
    },
    {
      id: 'txn-default-2',
      type: 'BID',
      description: '고죠 사토루 피규어 입찰 참여',
      amount: -75000,
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'txn-default-3',
      type: 'BID_UNLOCK',
      description: '히나타 아크릴 스탠드 예치금 환불',
      amount: 35000,
      createdAt: '2024-01-14T18:30:00Z'
    }
  ],
  1: [
    {
      id: 'txn-1-1',
      type: 'DEPOSIT',
      description: '골드 충전 (카드 결제)',
      amount: 300000,
      createdAt: '2024-01-16T10:00:00Z'
    },
    {
      id: 'txn-1-2',
      type: 'BID',
      description: '고죠 사토루 피규어 입찰',
      amount: -75000,
      createdAt: '2024-01-16T11:15:00Z'
    },
    {
      id: 'txn-1-3',
      type: 'WIN',
      description: '블루 아카이브 뱃지 세트 낙찰 정산',
      amount: -50000,
      createdAt: '2024-01-15T21:00:00Z'
    },
    {
      id: 'txn-1-4',
      type: 'BID_UNLOCK',
      description: '히나타 아크릴 스탠드 예치금 환불',
      amount: 35000,
      createdAt: '2024-01-14T18:30:00Z'
    }
  ],
  2: [
    {
      id: 'txn-2-1',
      type: 'DEPOSIT',
      description: '골드 충전 (계좌 이체)',
      amount: 150000,
      createdAt: '2024-01-15T13:00:00Z'
    },
    {
      id: 'txn-2-2',
      type: 'BID_LOCK',
      description: '에렌 인형 입찰 예치금 Lock',
      amount: -60000,
      createdAt: '2024-01-15T14:10:00Z'
    },
    {
      id: 'txn-2-3',
      type: 'BID',
      description: '올마이트 포스터 입찰',
      amount: -28000,
      createdAt: '2024-01-14T09:45:00Z'
    },
    {
      id: 'txn-2-4',
      type: 'BID_UNLOCK',
      description: '파이몬 키링 예치금 해제',
      amount: 22000,
      createdAt: '2024-01-13T19:20:00Z'
    }
  ],
  3: [
    {
      id: 'txn-3-1',
      type: 'DEPOSIT',
      description: '골드 충전 (간편 결제)',
      amount: 500000,
      createdAt: '2024-01-17T08:30:00Z'
    },
    {
      id: 'txn-3-2',
      type: 'BID',
      description: '천관사복 미카즈키 피규어 입찰',
      amount: -120000,
      createdAt: '2024-01-17T09:00:00Z'
    },
    {
      id: 'txn-3-3',
      type: 'WIN',
      description: '고죠 사토루 피규어 낙찰',
      amount: -80000,
      createdAt: '2024-01-16T20:10:00Z'
    },
    {
      id: 'txn-3-4',
      type: 'REFUND',
      description: '아냐 포토카드 입찰 취소 환불',
      amount: 45000,
      createdAt: '2024-01-15T17:40:00Z'
    }
  ]
}

