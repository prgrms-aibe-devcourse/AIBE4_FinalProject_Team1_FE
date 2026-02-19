import { useState } from "react";

export default function DisposalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const disposalItems = [
    {
      id: 1,
      date: "2024-05-21",
      name: "우유 1L (서울우유)",
      identifier: "ID: ST-MILK-001",
      quantity: "12 EA",
      loss: "₩31,200",
      reason: "유통기한 경과",
      reasonColor: "red",
      status: "approved",
    },
    {
      id: 2,
      date: "2024-05-20",
      name: "청경채 1kg",
      identifier: "공급처: 동국농산",
      quantity: "3 kg",
      loss: "₩18,000",
      reason: "부패/변질",
      reasonColor: "orange",
      status: "approved",
    },
    {
      id: 3,
      date: "2024-05-22",
      name: "냉동 삼겹살 5kg",
      identifier: "LOT: 20240520-B2",
      quantity: "1 box",
      loss: "₩125,000",
      reason: "포장 파손",
      reasonColor: "gray",
      status: "pending",
    },
    {
      id: 4,
      date: "2024-05-18",
      name: "참기름 1.8L",
      identifier: "Barcode: 880222...",
      quantity: "1 EA",
      loss: "₩28,500",
      reason: "기타",
      reasonColor: "gray",
      status: "approved",
    },
  ];

  const getReasonClass = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-50 text-red-600";
      case "orange":
        return "bg-orange-50 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex flex-col space-y-6 relative">
      {/* 모달 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleModal}
      ></div>

      {/* 우측 슬라이드 모달 (새 폐기 등록 창) */}
      <div
        className={`fixed top-0 right-0 h-full w-[450px] bg-white z-[110] shadow-2xl flex flex-col transform transition-transform duration-300 ${
          isModalOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
              <i className="ph-bold ph-trash"></i>
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight">
              새 폐기 등록
            </h2>
          </div>
          <button
            onClick={toggleModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
          >
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 품목 선택 */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              폐기 품목 검색
            </label>
            <div className="relative">
              <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="재고에서 품목을 검색하세요..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          {/* 수량 및 단위 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                폐기 수량
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-red-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                단위
              </label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                <option>EA (개)</option>
                <option>KG (킬로그램)</option>
                <option>BOX (박스)</option>
                <option>L (리터)</option>
              </select>
            </div>
          </div>

          {/* 폐기 사유 */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              폐기 사유
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-red-500 hover:text-red-600 transition-all">
                유통기한 경과
              </button>
              <button className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-red-500 hover:text-red-600 transition-all">
                부패 및 변질
              </button>
              <button className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-red-500 hover:text-red-600 transition-all">
                포장 파손
              </button>
              <button className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-red-500 hover:text-red-600 transition-all">
                기타 사유
              </button>
            </div>
          </div>

          {/* 사진 첨부 */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              증빙 사진 (선택)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer">
              <i className="ph ph-camera text-3xl text-gray-300"></i>
              <p className="text-xs text-gray-400">
                사진을 촬영하거나 업로드하세요
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={toggleModal}
            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-all"
          >
            취소
          </button>
          <button
            onClick={() => {
              alert("폐기 등록이 완료되었습니다.");
              toggleModal();
            }}
            className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-red-100"
          >
            폐기 등록 요청
          </button>
        </div>
      </div>

      {/* 페이지 헤더 */}
      <div className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-xl z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="ph-fill ph-trash text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                폐기<span className="text-gray-400">관리</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                Waste Control System
              </p>
            </div>
          </div>

          {/* 페이지 메뉴 */}
          <div className="flex gap-6 h-16">
            <button className="flex items-center px-2 text-sm font-bold text-white border-b-2 border-white transition-all">
              폐기 현황
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={toggleModal}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md group"
          >
            <i className="ph ph-plus-circle text-lg group-hover:animate-[shake_0.2s_ease-in-out_infinite]"></i>{" "}
            새 폐기 등록
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="space-y-6">
        {/* 상단 요약 카드 */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                이번 달 폐기 손실액
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  ₩428,500
                </span>
                <span className="text-xs font-bold text-red-500 flex items-center">
                  <i className="ph ph-caret-up"></i> 5.2%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <i className="ph-fill ph-trend-down text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                결재 대기
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600">03</span>
                <span className="text-xs font-bold text-gray-400">
                  건 미승인
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <i className="ph-fill ph-stamp text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                최다 발생 사유
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-gray-800">
                  유통기한 경과
                </span>
                <span className="text-[10px] text-gray-400 font-bold">
                  (전체 64%)
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <i className="ph-fill ph-warning-circle text-2xl"></i>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="품목명, 바코드, 처리자 검색..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-black focus:bg-white transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer">
                <option>전체 폐기 사유</option>
                <option>유통기한 경과</option>
                <option>부패/변질</option>
                <option>포장 파손</option>
                <option>검수 부적격</option>
              </select>
              <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer">
                <option>모든 상태</option>
                <option>승인 완료</option>
                <option>결재 대기</option>
                <option>반려</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 bg-white">
              <i className="ph ph-calendar-blank"></i> 05.01 ~ 05.22
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gray-800 hover:bg-black rounded-xl transition-all shadow-sm">
              <i className="ph ph-download-simple"></i> 리포트 다운로드
            </button>
          </div>
        </div>

        {/* 폐기 리스트 테이블 */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                  처리일자
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                  품목 정보
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                  폐기량
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                  손실 추정액
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                  사유
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-center">
                  결재
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {disposalItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    item.status === "pending" ? "bg-blue-50/20" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-[11px]">
                    {item.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {item.identifier}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{item.quantity}</td>
                  <td className="px-6 py-4 font-bold text-red-500">
                    {item.loss}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold ${getReasonClass(
                        item.reasonColor
                      )}`}
                    >
                      {item.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        item.status === "approved"
                          ? "bg-[#ecfdf5] text-[#10b981]"
                          : item.status === "pending"
                          ? "bg-[#eff6ff] text-[#3b82f6] shadow-sm ring-1 ring-blue-200"
                          : "bg-[#fef2f2] text-[#ef4444]"
                      }`}
                    >
                      {item.status === "approved"
                        ? "승인완료"
                        : item.status === "pending"
                        ? "결재 대기"
                        : "반려"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Page 1 of 5 (Total 18 Items)
            </p>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-black transition-all">
                <i className="ph ph-caret-left"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600 text-white font-bold text-xs">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-black transition-all">
                <i className="ph ph-caret-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
