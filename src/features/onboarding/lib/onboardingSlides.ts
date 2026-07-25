export type OnboardingSlide = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description?: string;
  overlayClassName: string;
};

export const onboardingSlides = [
  {
    imageSrc: "/onboarding/intro.svg",
    imageAlt: "실과 바늘, 도안 정보가 펼쳐진 뜨개 메인 화면",
    title: "뜨개 프로젝트,\n어디서부터 시작해야 할까요?",
    description: "실, 바늘, 도안…\n찾아봐야 할 정보가 너무 많아요.",
    overlayClassName: "bg-black/30",
  },
  {
    imageSrc: "/onboarding/interest-recommendation.svg",
    imageAlt: "관심사 태그와 맞춤 뜨개 도안 추천 화면",
    title: "내 취향에 맞는 도안을\n추천받아요",
    overlayClassName: "bg-black/30",
  },
  {
    imageSrc: "/onboarding/chat-room.svg",
    imageAlt: "뜨개 프로젝트 참여자들의 실시간 채팅방 화면",
    title: "뜨개하다 막히는 순간,\n바로 이야기해보세요",
    overlayClassName: "bg-black/30",
  },
  {
    imageSrc: "/onboarding/pattern-yarn-detail.svg",
    imageAlt: "도안의 원작실과 대체실 정보를 정리한 상세 화면",
    title: "흩어진 뜨개 정보를\n한 곳에서 제공해요",
    overlayClassName: "bg-black/30",
  },
] satisfies OnboardingSlide[];
