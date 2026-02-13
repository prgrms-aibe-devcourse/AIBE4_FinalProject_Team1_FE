import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { KPICard, ActionButton } from "../../components/home";

// 아이콘 컴포넌트들
function IconUpload() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function IconLightBulb() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconBox() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  // 매출 추이 데이터 (최근 7일)
  const salesTrendData = [
    { date: "2/3", sales: 850000 },
    { date: "2/4", sales: 920000 },
    { date: "2/5", sales: 780000 },
    { date: "2/6", sales: 950000 },
    { date: "2/7", sales: 1100000 },
    { date: "2/8", sales: 980000 },
    { date: "2/9", sales: 1050000 },
  ];

  // 요일×시간대 피크 데이터 (간략화)
  const peakHoursData = [
    { hour: "11시", value: 45 },
    { hour: "12시", value: 120 },
    { hour: "13시", value: 85 },
    { hour: "18시", value: 95 },
    { hour: "19시", value: 140 },
    { hour: "20시", value: 110 },
  ];

  // 소진 상위 재료
  const topIngredientsData = [
    { name: "양파", usage: 15 },
    { name: "대파", usage: 12 },
    { name: "돼지고기", usage: 10 },
    { name: "고추", usage: 8 },
    { name: "마늘", usage: 7 },
  ];

  // TODO: 실제로는 API에서 가져올 매장 정보
  const stores = [
    { id: 1, name: "모수 서울" },
    { id: 2, name: "모수 부산" },
  ];

  const selectedStore = stores[0];
  const dataDate = "2026.02.09";
  const lastUpdated = "14:20";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 매장 선택 드롭다운 */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-slate-300 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-700">매장:</span>
                <span className="text-base font-bold text-slate-900">
                  {selectedStore.name}
                </span>
                <svg
                  className="h-5 w-5 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 데이터 기준일/신선도 */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">데이터 기준:</span>
              <span className="font-semibold text-slate-900">{dataDate}</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">최근 반영:</span>
              <span className="font-semibold text-slate-900">{lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* 핵심 KPI 요약 */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">핵심 지표</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="오늘 매출"
              value="1,050"
              unit="만원"
              change={{ value: 7.1, label: "전일 대비" }}
              trend="up"
              icon={<IconCurrency />}
              onClick={() => navigate("/sales/daily")}
            />
            <KPICard
              title="이번 주 매출"
              value="6,630"
              unit="만원"
              change={{ value: 12.5, label: "전주 대비" }}
              trend="up"
              icon={<IconCurrency />}
              onClick={() => navigate("/sales/weekly")}
            />
            <KPICard
              title="원가율 (추정)"
              value="32.5"
              unit="%"
              change={{ value: -2.3, label: "전월 대비" }}
              trend="down"
              icon={<IconChart />}
              onClick={() => navigate("/analytics/cost")}
            />
            <KPICard
              title="폐기 손실"
              value="145"
              unit="천원"
              change={{ value: 18.2, label: "전월 대비" }}
              trend="up"
              icon={<IconBox />}
              onClick={() => navigate("/inventory/disposal")}
            />
            <KPICard
              title="재고 부족 품목"
              value="8"
              unit="건"
              icon={<IconBox />}
              onClick={() => navigate("/inventory/low-stock")}
            />
            <KPICard
              title="발주 추천 건수"
              value="12"
              unit="건"
              icon={<IconLightBulb />}
              onClick={() => navigate("/orders/recommendations")}
            />
          </div>
        </section>

        {/* 3. 간단 차트 */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">매출 분석</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 매출 추이 (7일) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                매출 추이 (최근 7일)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `${value / 10000}만`}
                  />
                  <Tooltip
                    formatter={(value) =>
                      `${Number(value).toLocaleString()}원`
                    }
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 소진 상위 재료 TOP */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                소진 상위 재료 TOP 5
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topIngredientsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" style={{ fontSize: "12px" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value) => `${value}kg`}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="usage" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 요일×시간대 피크 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-4">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              시간대별 주문량 (오늘)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: "12px" }} />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value) => `${value}건`}
                />
                <Tooltip
                  formatter={(value) => `${value}건`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4. 바로가기 액션 (CTA) */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">빠른 작업</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionButton
              label="매출 업로드"
              description="CSV/엑셀 파일로 매출 데이터 업로드"
              icon={<IconUpload />}
              onClick={() => navigate("/sales/upload")}
            />
            <ActionButton
              label="문서 업로드"
              description="발주서/영수증 자동 처리"
              icon={<IconDocument />}
              onClick={() => navigate("/documents/upload")}
            />
            <ActionButton
              label="입고 확정"
              description="발주 확정 및 재고 반영"
              icon={<IconCheck />}
              onClick={() => navigate("/inventory/receiving")}
            />
            <ActionButton
              label="발주 추천 보기"
              description="AI 기반 발주 추천 확인"
              icon={<IconLightBulb />}
              onClick={() => navigate("/orders/recommendations")}
            />
            <ActionButton
              label="운영 리포트"
              description="월간 운영 리포트 생성/보기"
              icon={<IconChart />}
              onClick={() => navigate("/reports")}
            />
            <ActionButton
              label="챗봇 열기"
              description="AI 챗봇으로 데이터 질의응답"
              icon={<IconChat />}
              onClick={() => window.alert("챗봇 연결 예정")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
