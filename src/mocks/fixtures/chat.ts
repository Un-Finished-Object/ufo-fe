type MockChatMessage = {
  messageId: number;
  senderName: string;
  text: string;
  replySenderName?: string;
  replyMessageId?: number;
  createdAt: string;
  deletedAt?: string | null;
};

export const mockChatMessages: MockChatMessage[] = [
  {
    messageId: 1,
    senderName: "한코두코",
    text: "안녕하세요! 같이 즐겁게 떠요.",
    createdAt: "2026-07-16T22:58:03+09:00",
  },
  {
    messageId: 2,
    senderName: "한코두코",
    text: "저는 오늘 게이지부터 내보려고 해요.",
    createdAt: "2026-07-16T22:58:41+09:00",
  },
  {
    messageId: 3,
    senderName: "한코두코",
    text: "다들 어떤 색으로 뜨실 예정인가요?",
    createdAt: "2026-07-16T22:59:12+09:00",
  },
  {
    messageId: 4,
    senderName: "뜨개구름",
    text: "저는 연한 분홍색으로 시작했어요.",
    createdAt: "2026-07-16T23:00:01+09:00",
  },
  {
    messageId: 5,
    senderName: "뜨개구름",
    text: "사진보다 조금 차분한 색이에요.",
    createdAt: "2026-07-16T23:00:24+09:00",
  },
  {
    messageId: 6,
    senderName: "포근공방",
    text: "저는 아이보리로 뜨려고요!",
    createdAt: "2026-07-16T23:00:35+09:00",
  },
  {
    messageId: 7,
    senderName: "뜨개구름",
    text: "아이보리도 정말 예쁠 것 같아요.",
    createdAt: "2026-07-16T23:00:52+09:00",
  },
  {
    messageId: 8,
    senderName: "한코두코",
    text: "좋은 아침이에요. 어제 게이지를 내봤는데 도안보다 한 코 정도 크게 나왔어요.",
    createdAt: "2026-07-17T09:00:02+09:00",
  },
  {
    messageId: 9,
    senderName: "한코두코",
    text: "바늘을 한 호수 줄이는 게 좋을까요?",
    createdAt: "2026-07-17T09:00:38+09:00",
  },
  {
    messageId: 10,
    senderName: "한코두코",
    text: "세탁 후에도 한 코 차이가 유지돼서 완성 치수가 너무 커질까 봐 고민 중입니다. 비슷한 실을 사용해 보신 분이 있다면 조언 부탁드려요.",
    createdAt: "2026-07-17T09:01:07+09:00",
    deletedAt: "2026-07-17T10:15:00+09:00",
  },
  {
    messageId: 11,
    senderName: "실과바늘",
    text: "저는 세탁하면 조금 줄어서 그대로 진행했어요.",
    createdAt: "2026-07-17T09:01:29+09:00",
  },
  {
    messageId: 12,
    senderName: "뜨개구름",
    text: "저도 먼저 스와치를 세탁해 보는 걸 추천해요.\n가로와 세로 길이를 모두 기록해 두면 계산하기 편해요.",
    createdAt: "2026-07-17T09:02:04+09:00",
  },
  {
    messageId: 13,
    senderName: "뜨개구름",
    text: "이 방법으로 확인해 보시면 좋을 것 같아요.",
    replySenderName: "실과바늘",
    replyMessageId: 11,
    createdAt: "2026-07-17T09:02:22+09:00",
  },
  {
    messageId: 14,
    senderName: "뜨개구름",
    text: "궁금한 점이 있으면 또 남겨 주세요!",
    createdAt: "2026-07-17T09:02:49+09:00",
  },
  {
    messageId: 15,
    senderName: "아주긴닉네임을사용하는뜨개친구",
    text: "설명 감사합니다. 저도 같은 방식으로 확인해 볼게요 🧶✨",
    createdAt: "2026-07-17T09:03:10+09:00",
  },
  {
    messageId: 16,
    senderName: "아주긴닉네임을사용하는뜨개친구",
    text: "긴 닉네임과 이모지가 함께 표시되는 경우도 확인해 주세요 😊😊😊",
    createdAt: "2026-07-17T09:03:44+09:00",
  },
  {
    messageId: 17,
    senderName: "뜨개구름",
    text: "줄바꿈없는긴문자열이말풍선밖으로넘치지않고정상적으로다음줄에표시되는지확인하기위한메시지입니다1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    createdAt: "2026-07-17T09:04:05+09:00",
  },
  {
    messageId: 18,
    senderName: "포근공방",
    text: "답장 메시지에 다시 답장하는 경우예요.",
    replySenderName: "뜨개구름",
    replyMessageId: 13,
    createdAt: "2026-07-17T09:05:13+09:00",
    deletedAt: "2026-07-17T10:20:00+09:00",
  },
  {
    messageId: 19,
    senderName: "포근공방",
    text: "같은 시분의 답장 다음에 일반 메시지가 이어집니다.",
    createdAt: "2026-07-17T09:05:39+09:00",
  },
  {
    messageId: 20,
    senderName: "뜨개구름",
    text: "확인했습니다. 소매 분리까지 뜬 뒤 다시 공유할게요!",
    replySenderName: "포근공방",
    replyMessageId: 18,
    createdAt: "2026-07-17T09:06:00+09:00",
  },
];
