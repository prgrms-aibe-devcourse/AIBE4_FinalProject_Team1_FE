export default function MyPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: 프로필 */}
      <aside className="lg:col-span-4 space-y-4">
        {/* 프로필 카드 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 border border-amber-200 grid place-items-center">
              <span className="text-2xl font-black text-amber-900">ㅁ</span>
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900">홍길동</div>
              <div className="text-sm text-slate-500">hong@example.com</div>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 w-full h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
          >
            프로필 편집
          </button>
        </div>

        {/* 계정 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-extrabold text-slate-900 mb-3">계정</div>
          <div className="space-y-2">
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-sm text-slate-700"
            >
              비밀번호 변경
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-sm text-rose-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Right: 설정/리포트 */}
      <section className="lg:col-span-8 space-y-4">
        {/* 리포트 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-extrabold text-slate-900 mb-3">리포트</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left"
              onClick={() => window.alert("월간 리포트: 연결 예정")}
            >
              <div className="text-sm font-extrabold text-slate-900">월간 리포트</div>
              <div className="text-xs text-slate-500 mt-1">생성된 달만 열람 가능</div>
            </button>
            <button
              type="button"
              className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left"
              onClick={() => window.alert("주간 리포트: 연결 예정")}
            >
              <div className="text-sm font-extrabold text-slate-900">주간 리포트</div>
              <div className="text-xs text-slate-500 mt-1">이번 주 소비 분석</div>
            </button>
          </div>
        </div>

        {/* 설정 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-extrabold text-slate-900 mb-3">설정</div>
          <div className="space-y-2">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">카테고리 관리</div>
                <div className="text-xs text-slate-500">지출/수입 카테고리 편집</div>
              </div>
              <span className="text-slate-400">›</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">결제수단 관리</div>
                <div className="text-xs text-slate-500">카드/계좌 등록 및 편집</div>
              </div>
              <span className="text-slate-400">›</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">알림 설정</div>
                <div className="text-xs text-slate-500">예산 초과, 챌린지 알림 등</div>
              </div>
              <span className="text-slate-400">›</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">연동 서비스</div>
                <div className="text-xs text-slate-500">Google 캘린더, 은행 연동</div>
              </div>
              <span className="text-slate-400">›</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
