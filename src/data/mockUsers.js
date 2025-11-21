// 계정 목데이터
export const mockUsers = [
  {
    id: 1,
    username: 'testuser',
    password: 'test1234',
    nickname: '덕후마스터',
    name: '홍길동',
    email: 'test@example.com',
    accountBank: '카카오뱅크',
    accountNumber: '333333-01-123456',
    profileImage: 'https://images.unsplash.com/photo-1607604274033-5332875d6501?w=200&h=200&fit=crop&q=80',
    favoriteAnimes: [
      { id: 1, title: { romaji: '주술회전' }, coverImage: { large: 'https://images.unsplash.com/photo-1607604274033-5332875d6501?w=200&h=200&fit=crop&q=80' } }
    ],
    favoriteCategories: ['피규어', '포토카드'],
    balance: 500000,
    lockedAmount: 0,
    participatedAuctionIds: [1, 2, 7],
    registeredAuctionIds: [4],
    notifications: [
      {
        id: 1001,
        type: 'BID_UPDATE',
        message: '고죠 사토루 피규어에 새로운 입찰이 들어왔어요!',
        goodsId: 1,
        read: false,
        createdAt: '2024-01-18T09:00:00Z'
      },
      {
        id: 1002,
        type: 'AUCTION_ENDING',
        message: '블루 아카이브 뱃지 세트 경매가 곧 종료됩니다.',
        goodsId: 7,
        read: false,
        createdAt: '2024-01-18T08:30:00Z'
      }
    ]
  },
  {
    id: 2,
    username: 'animefan',
    password: 'anime1234',
    nickname: '애니러버',
    name: '김철수',
    email: 'anime@example.com',
    accountBank: '신한은행',
    accountNumber: '110-123-456789',
    profileImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&q=80',
    favoriteAnimes: [
      { id: 2, title: { romaji: 'SPY×FAMILY' }, coverImage: { large: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=200&fit=crop&q=80' } }
    ],
    favoriteCategories: ['포토카드', '아크릴 스탠드'],
    balance: 300000,
    lockedAmount: 75000,
    participatedAuctionIds: [2, 5],
    registeredAuctionIds: [6],
    notifications: [
      {
        id: 2001,
        type: 'AUCTION_ENDING',
        message: '에렌 인형 경매 종료 1시간 전입니다.',
        goodsId: 5,
        read: false,
        createdAt: '2024-01-17T20:00:00Z'
      },
      {
        id: 2002,
        type: 'BID_UPDATE',
        message: '올마이트 포스터 경매에 새 입찰이 도착했습니다.',
        goodsId: 6,
        read: true,
        createdAt: '2024-01-16T15:00:00Z'
      }
    ]
  },
  {
    id: 3,
    username: 'collector',
    password: 'collect1234',
    nickname: '굿즈수집가',
    name: '이영희',
    email: 'collector@example.com',
    accountBank: '국민은행',
    accountNumber: '123456-78-901234',
    profileImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&h=200&fit=crop&q=80',
    favoriteAnimes: [
      { id: 3, title: { romaji: '하이큐!!' }, coverImage: { large: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&q=80' } }
    ],
    favoriteCategories: ['피규어', '인형'],
    balance: 800000,
    lockedAmount: 0,
    participatedAuctionIds: [3, 8],
    registeredAuctionIds: [1, 8],
    notifications: [
      {
        id: 3001,
        type: 'TRADE_SUCCESS',
        message: '미카즈키 피규어 경매가 종료되었습니다. 결과를 확인하세요.',
        goodsId: 8,
        read: false,
        createdAt: '2024-01-15T18:30:00Z'
      }
    ]
  }
]

// 로그인 검증 함수
export function validateUser(username, password) {
  return mockUsers.find(user => user.username === username && user.password === password)
}

// 사용자 ID로 찾기
export function getUserById(id) {
  return mockUsers.find(user => user.id === id)
}

