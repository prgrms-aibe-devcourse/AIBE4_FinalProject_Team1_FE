import {useState, useEffect} from 'react';
import {getStockAnalysis} from '@/api/analytics/stockAnalytics';
import type {StockAnalyticResponse} from '@/types/analytics/stockAnalytics';
import {
    ExpiryStatusChart,
    StockLevelChart,
    WasteAnalysisChart
} from '@/components/charts';
import {requireStorePublicId} from "@/utils/store.ts";

export default function StockAnalyticsPage() {
    const storePublicId = requireStorePublicId();

    const [data, setData] = useState<StockAnalyticResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysisData = async () => {
        if (!storePublicId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await getStockAnalysis(storePublicId);
            setData(result);
        } catch (error) {
            console.error("분석 데이터 로드 실패:", error);
            setError("데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (storePublicId) {
            fetchAnalysisData();
        }
    }, [storePublicId]);

    // 요약 지표 계산
    const totalItemCount = data.length;
    const totalBatchCount = data.reduce((sum, item) => sum + (item.activeBatchCount || 0), 0);
    const lowStockCount = data.filter(item => item.isLowStock).length;
    const totalWasteCount = data.reduce((sum, item) => sum + (item.totalWasteCount || 0), 0);
    const totalWasteAmount = data.reduce((sum, item) => sum + (item.totalWasteAmount || 0), 0);

    const renderContent = () => {
        if (loading) {
            return (
                <div
                    className="mt-10 rounded-3xl border border-gray-200 bg-white p-20 text-center text-gray-400 font-bold animate-pulse">
                    데이터를 분석하는 중입니다...
                </div>
            );
        }

        if (error) {
            return (
                <div className="mt-10 rounded-3xl border-2 border-red-200 bg-red-50 p-20 text-center">
                    <h3 className="text-lg font-bold text-red-700">오류 발생</h3>
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-white p-20 text-center">
                    <h3 className="text-lg font-bold text-gray-800">분석할 데이터가 없습니다.</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        재고 활동(입고, 폐기 등)이 기록되면 분석 데이터가 표시됩니다.
                    </p>
                </div>
            );
        }

        return (
            <div className="mt-8 space-y-8">
                {/* 1. 핵심 요약 지표 (Summary Cards) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard
                        icon="📦"
                        label="총 관리 품목"
                        value={`${totalItemCount.toLocaleString()}종`}
                        subText="전체 식재료"
                    />
                    <SummaryCard
                        icon="🏷️"
                        label="총 보유 배치"
                        value={`${totalBatchCount.toLocaleString()}건`}
                        subText="유통기한별 입고 건"
                    />
                    <SummaryCard
                        icon="⚠️"
                        label="재고 부족"
                        value={`${lowStockCount.toLocaleString()}건`}
                        subText="발주 필요"
                        isWarning={lowStockCount > 0}
                    />
                    <SummaryCard
                        icon="🗑️"
                        label="총 폐기 현황"
                        value={`${totalWasteCount.toLocaleString()}건`}
                        subText={`손실액: ${totalWasteAmount.toLocaleString()}원`}
                        isWarning={totalWasteCount > 0}
                    />
                </div>

                {/* 2. 차트 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 유통기한 분포 */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4">유통기한 분포</h3>
                        <div className="h-[280px]">
                            <ExpiryStatusChart data={data}/>
                        </div>
                    </div>

                    {/* 재고 부족 */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4">재고 부족 순위</h3>
                        <div className="h-[280px]">
                            <StockLevelChart data={data}/>
                        </div>
                    </div>

                    {/* 폐기 분석 */}
                    <div
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-1">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4">폐기 손실액 (Top 5)</h3>
                        <div className="h-[280px]">
                            <WasteAnalysisChart data={data}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">

                {/* 헤더 섹션 */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            {/* 뱃지 제거됨 */}
                            <h1 className="text-3xl font-black tracking-tight text-gray-900">재고 및 폐기 분석</h1>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">
                            매장의 재고 회전 및 폐기 손실 데이터를 시각적으로 분석합니다.
                        </p>
                    </div>
                    <button
                        onClick={fetchAnalysisData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-800 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        {loading ? '갱신 중...' : '데이터 갱신'}
                    </button>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}

// 공통 카드 컴포넌트
function SummaryCard({icon, label, value, subText, isWarning}: {
    icon: string,
    label: string,
    value: string,
    subText?: string,
    isWarning?: boolean
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className="text-lg opacity-80">{icon}</span>
                </div>
                <div className={`text-2xl font-black ${isWarning ? 'text-red-600' : 'text-gray-900'}`}>
                    {value}
                </div>
            </div>
            {subText && (
                <div className="mt-2 text-xs font-bold text-gray-400">
                    {subText}
                </div>
            )}
        </div>
    );
}