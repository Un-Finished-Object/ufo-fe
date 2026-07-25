export const SIGNUP_INTEREST_OPTIONS = [
  "빈티지",
  "클래식",
  "로맨틱",
  "캐주얼",
  "오버사이즈",
  "슬림핏",
  "크롭",
  "레귤러핏",
  "아란무늬",
  "배색",
  "메리야스",
] as const;

export const MAX_SIGNUP_INTEREST_COUNT = 3;

const NICKNAME_ADJECTIVES = [
  "포근한",
  "따뜻한",
  "폭신한",
  "말랑한",
  "보드라운",
  "촘촘한",
  "산뜻한",
  "다정한",
  "반짝이는",
  "차분한",
  "몽글한",
  "아늑한",
  "든든한",
  "소담한",
  "귀여운",
  "사랑스런",
  "여유로운",
  "정겨운",
  "화사한",
  "단정한",
] as const;

const NICKNAME_KNITTING_WORDS = [
  "실뭉치",
  "실타래",
  "털실",
  "울실",
  "뜨개코",
  "코바늘",
  "대바늘",
  "뜨개바늘",
  "돗바늘",
  "가디건",
  "스웨터",
  "목도리",
  "양말",
  "조끼",
  "비니",
  "장갑",
  "숄",
  "블랭킷",
  "꽈배기",
  "메리야스",
  "고무단",
  "모티브",
  "케이블",
  "레이스",
  "게이지",
] as const;

export function createRandomNickname() {
  const adjective =
    NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
  const knittingWord =
    NICKNAME_KNITTING_WORDS[Math.floor(Math.random() * NICKNAME_KNITTING_WORDS.length)];
  const number = Math.floor(Math.random() * 100).toString().padStart(2, "0");

  return `${adjective}${knittingWord}${number}`;
}
