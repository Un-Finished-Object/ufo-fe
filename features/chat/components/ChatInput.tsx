type ChatInputProps = {
  value: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ChatInput({
  value,
  isSending,
  onChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <form
      className="flex items-center rounded-xl border border-[#f0b2b2] px-4 py-3"
      aria-label="메시지 입력"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="chat-message" className="sr-only">
        메시지 입력
      </label>
      <input
        id="chat-message"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="뜨개감지(으)로 대화해보세요."
        className="w-full bg-transparent text-sm font-semibold text-[#7f7f7f] placeholder:text-[#a6a6a6] focus:outline-none"
      />
      <button
        type="submit"
        className="ml-2 text-sm font-semibold text-[#4a82ff] disabled:text-[#a0b6f2]"
        aria-label="메시지 보내기"
        disabled={isSending || value.trim().length === 0}
      >
        {isSending ? "전송중" : "보내기"}
      </button>
    </form>
  );
}
