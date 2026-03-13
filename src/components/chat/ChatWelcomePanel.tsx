interface ChatWelcomePanelProps {
  onQuickQuestion: (question: string) => void;
}

export const ChatWelcomePanel = ({ onQuickQuestion }: ChatWelcomePanelProps) => {
  const quickQuestions = [
    { text: '오늘 재고 현황', query: '오늘 재고 현황을 알려줘' },
    { text: '이번 주 매출', query: '이번 주 매출을 알려줘' },
    { text: '자동 발주 필요 품목', query: '자동 발주가 필요한 품목을 알려줘' },
  ];

  return (
    <div className="flex items-center justify-center h-full bg-white px-6">
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700 max-w-4xl w-full text-center">
        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-gray-100 bg-gray-50 flex items-center justify-center">
            <img
              src="/images/chatbot.png"
              alt="수셰프"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 타이틀 & 설명 */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 italic">수셰프 <span className="text-sky-500 not-italic">AI</span></h1>
          <p className="text-gray-500 text-base">무엇을 도와드릴까요? 재고, 매출, 발주에 대해 물어보세요.</p>
        </div>

        {/* 빠른 질문 버튼 */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          {quickQuestions.map((item, index) => (
            <button
              key={index}
              onClick={() => onQuickQuestion(item.query)}
              className="px-5 py-2.5 bg-white border border-sky-100 text-sky-600 rounded-full hover:bg-sky-50 hover:border-sky-300 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
