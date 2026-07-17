export const mockUser = {
  userId: 1,
  email: "knitter@ufo.test",
  nickname: "뜨개구름",
  profileImage: "/mock/plush-pink.svg",
  joinDate: 1735689600000,
};

export const mockPatterns = [
  { id: 1, title: "포근한 라글란 스웨터", thumbnailUrl: "/mock/pattern-card.svg", author: "뜨개구름" },
  { id: 2, title: "봄날의 케이블 가디건", thumbnailUrl: "/mock/plush-pink.svg", author: "실과바늘" },
  { id: 3, title: "매일 쓰는 니트 베스트", thumbnailUrl: "/mock/plush-white.svg", author: "한코두코" },
  { id: 4, title: "초보자를 위한 목도리", thumbnailUrl: "/mock/banner-blue.svg", author: "포근공방" },
];

export const mockPatternDetail = {
  id: 1,
  title: "포근한 라글란 스웨터",
  images: ["/mock/pattern-card.svg"],
  author: "뜨개구름",
  stats: { views: 1280, scraps: 86 },
  meta: {
    category: "clothes",
    subCategory: "sweater",
    gauge: "10cm × 10cm = 20코 × 28단",
    originalNeedle: "4.0mm, 4.5mm 줄바늘",
    requiredYarnAmount: "약 900m",
    size: "S (M) L",
    actualSize: "가슴둘레 96 (104) 112cm",
    originalYarn: [{
      originalYarnSetId: 1,
      firstYarn: {
        yarnId: 1,
        yarnName: "메리노 포근",
        weight: 50,
        cost: 9000,
        component: "메리노울 100%",
        store: "UFO 실가게",
        length: 120,
      },
      secondYarn: null,
      subYarn: null,
    }],
  },
};

export const mockChats = [{
  patternId: 1,
  chatId: 101,
  chatName: "포근한 라글란 함께 떠요",
  chatImageUrl: "/mock/pattern-card.svg",
  favorite: true,
  isHidden: false,
  unRead: 2,
  lastMessage: "소매 분리까지 떴어요!",
  createdAt: "2026-07-17T09:00:00+09:00",
}];
