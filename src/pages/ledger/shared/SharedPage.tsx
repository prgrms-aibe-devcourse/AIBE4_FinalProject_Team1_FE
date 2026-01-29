export default function SharedPage() {
  return (
    <div className="space-y-6">
      {/* 상단: 공유가계부 선택 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-100 border border-violet-200 grid place-items-center">
              <span className="text-violet-700 font-black">F</span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">가족 가계부</div>
              <div className="text-xs text-slate-500">멤버 4명</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
            >
              전환
            </button>
            <button
              type="button"
              className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
            >
              관리
            </button>
          </div>
        </div>
      </div>

      {/* 공유 캘린더 영역 (placeholder) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[400px]">
        <div className="text-center text-slate-500">
          <div className="text-lg font-extrabold text-slate-900 mb-2">공유 캘린더</div>
          <p className="text-sm">
            여기에 공유가계부 캘린더 뷰가 들어갑니다.
          </p>
          <p className="text-sm mt-1">
            개인 가계부와 동일한 캘린더 UI를 공유용으로 구성하시면 됩니다.
          </p>
          <div className="mt-6 space-y-2 text-xs text-slate-400">
            <p>- 상단: 공유가계부 전환(드롭다운) + 핀/최근</p>
            <p>- 관리(드로어/모달): 초대/멤버/권한/나가기/정산</p>
          </div>
        </div>
      </div>
    </div>
  );
}
