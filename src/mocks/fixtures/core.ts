export const mockUser = {
  userId: 1,
  email: "knitter@ufo.test",
  nickname: "뜨개구름",
  profileImage: "/mock/plush-pink.svg",
  joinDate: 2,
  role: "ADMIN" as const,
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
    originalYarn: [
      {
        originalYarnSetId: 1,
        firstYarn: {
          yarnId: 1,
          yarnName: "메리노 포근",
          ply: 2,
          weight: 50,
          cost: 9000,
          component: "메리노울 100%",
          store: "UFO 실가게",
          length: 120,
        },
        secondYarn: {
          yarnId: 2,
          yarnName: "메리노 포인트 핑크",
          ply: 2,
          weight: 50,
          cost: 8500,
          component: "메리노울 100%",
          store: "UFO 실가게",
          length: 120,
        },
        subYarn: null,
      },
      {
        originalYarnSetId: 2,
        firstYarn: {
          yarnId: 1,
          yarnName: "메리노 포근",
          ply: 2,
          weight: 50,
          cost: 9000,
          component: "메리노울 100%",
          store: "UFO 실가게",
          length: 120,
        },
        secondYarn: {
          yarnId: 3,
          yarnName: "메리노 포인트 블루",
          ply: 2,
          weight: 50,
          cost: 8500,
          component: "메리노울 100%",
          store: "UFO 실가게",
          length: 120,
        },
        subYarn: null,
      },
      {
        originalYarnSetId: 3,
        firstYarn: {
          yarnId: 4,
          yarnName: "알파카 포근",
          ply: 1,
          weight: 50,
          cost: 11000,
          component: "알파카 90%, 나일론 10%",
          store: "솜솜뜨개",
          length: 130,
        },
        secondYarn: {
          yarnId: 5,
          yarnName: "알파카 포인트",
          ply: 1,
          weight: 50,
          cost: 10500,
          component: "알파카 90%, 나일론 10%",
          store: "솜솜뜨개",
          length: 130,
        },
        subYarn: null,
      },
    ],
  },
};

export const mockPatternDetails = Object.fromEntries(
  mockPatterns.map((pattern) => [
    pattern.id,
    {
      ...mockPatternDetail,
      ...pattern,
      images: [pattern.thumbnailUrl],
      meta: {
        ...mockPatternDetail.meta,
        originalYarn:
          pattern.id === mockPatternDetail.id
            ? mockPatternDetail.meta.originalYarn
            : [],
      },
    },
  ]),
);

const mockYarnNames = [
  "데일리 메리노",
  "앨모",
  "포근 알파카",
  "클라우드 울",
  "소프트 캐시미어",
];

function createMockAlternativeYarns(originalYarnSetId: number, roleOffset: number) {
  return Array.from({ length: 15 }, (_, index) => {
    const ranking = index + 1;
    const altId = originalYarnSetId * 1000 + roleOffset + ranking;

    return {
      altId,
      ranking,
      yarnId: altId + 100,
      yarnName: `${mockYarnNames[index % mockYarnNames.length]} ${ranking}`,
      ply: (index % 4) + 1,
      weight: 50 + (index % 3) * 25,
      cost: 7500 + index * 500,
      component: index % 2 === 0 ? "메리노울 100%" : "알파카 90%, 나일론 10%",
      store: index % 2 === 0 ? "UFO 실가게" : "솜솜뜨개",
      length: 120 + index * 5,
      componentScore: Math.max(70, 100 - index),
      lengthScore: Math.max(70, 98 - index),
      gaugeScore: Math.max(70, 96 - index),
      needleScore: Math.max(70, 94 - index),
      username: "admin",
    };
  });
}

export function createMockPatternAlternatives(originalYarnSetId: number) {
  const originalYarnSet = mockPatternDetail.meta.originalYarn.find(
    (yarnSet) => yarnSet.originalYarnSetId === originalYarnSetId,
  );

  return {
    originalYarnSetId,
    firstYarn: originalYarnSet?.firstYarn
      ? createMockAlternativeYarns(originalYarnSetId, 0)
      : [],
    secondYarn: originalYarnSet?.secondYarn
      ? createMockAlternativeYarns(originalYarnSetId, 100)
      : [],
    subYarn: originalYarnSet?.subYarn
      ? createMockAlternativeYarns(originalYarnSetId, 200)
      : [],
  };
}

export const mockChats = [{
  patternId: 1,
  chatId: 101,
  chatName: "포근한 라글란 함께 떠요",
  chatImageUrl: "/mock/pattern-card.svg",
  nickname: "뜨개구름",
  favorite: true,
  isHidden: false,
  unRead: 2,
  lastMessage: "소매 분리까지 떴어요!",
  createdAt: "2026-07-17T09:00:00+09:00",
}];
