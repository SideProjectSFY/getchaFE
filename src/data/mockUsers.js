// 계정 목데이터
export const mockUsers = [
  {
    id: 1,
    username: 'user_ssafy',
    password: '1234',
    nickname: '싸피유저',
    name: '김싸피',
    email: 'user@ssafy.com',
    accountBank: '신한은행',
    accountNumber: '110-222-333333',
    profileImage: 'https://images.unsplash.com/photo-1607604274033-5332875d6501?w=200&h=200&fit=crop&q=80',
    favoriteAnimes: [
      { id: 10002, title: { romaji: '귀멸의 칼날' }, coverImage: { large: '/images/images/demon-slayer-goods.jpg' } },
      { id: 10003, title: { romaji: '진격의 거인' }, coverImage: { large: '/images/images/attack-on-titan-goods.jpg' } },
      { id: 10004, title: { romaji: '블루 아카이브' }, coverImage: { large: '/images/images/other.jpg' } }
    ],
    favoriteCategories: ['포토카드', '인형'],
    balance: 520000,
    lockedAmount: 75000,
    participatedAuctionIds: [2, 5, 7],          // 참여 중/종료된 경매
    registeredAuctionIds: [4, 8],                // 내가 등록한 경매(진행/종료 혼합)
    wishlist: [1, 3, 6],                         // 찜한 목록
    notifications: [
      {
        id: 4001,
        type: 'BID_UPDATE',
        message: 'SPY×FAMILY 아냐 포토카드에 새로운 입찰이 들어왔어요!',
        goodsId: 2,
        read: false,
        createdAt: '2024-02-01T09:00:00Z'
      },
      {
        id: 4002,
        type: 'AUCTION_ENDING',
        message: '블루 아카이브 뱃지 세트 경매가 곧 종료됩니다.',
        goodsId: 7,
        read: false,
        createdAt: '2024-02-01T08:30:00Z'
      }
    ]
  }
]

// 로그인 검증 함수 (이메일 기반)
export function validateUserByEmail(email, password) {
  return mockUsers.find(user => user.email === email && user.password === password)
}

// 사용자 ID로 찾기
export function getUserById(id) {
  return mockUsers.find(user => user.id === id)
}

