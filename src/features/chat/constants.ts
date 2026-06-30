export const chatRoomFilters = ["UFO", "즐겨찾기", "안읽음", "FO"] as const;
export type ChatRoomFilter = (typeof chatRoomFilters)[number];
