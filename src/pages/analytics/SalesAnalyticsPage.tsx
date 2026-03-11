import { useEffect, useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Calendar, DollarSign, ShoppingBag, Award } from 'lucide-react';
import { requireStorePublicId } from '@/utils/store.ts';
import { KPICard } from '@/components/home';
import {
    getSalesSummary, getSalesTrend, getSalesPeak, getMenuRanking
} from '@/api/analytics/salesAnalytics.ts';
import type {
    SalesSummaryResponse, SalesTrendData, SalesPeakData, MenuRankingData, TimeInterval
} from '@/types/analytics/salesAnalytics.ts';

/** 날짜 포맷팅 (YYYY-MM-DD) */
function formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 금액 포맷팅 */
function formatAmount(amount: number): string {
    return amount.toLocaleString('ko-KR');
}

export default function SalesAnalyticsPage() {
    const storePublicId = requireStorePublicId();

    // 이번 달 1일 ~ 오늘 기본 설정
    const today = useMemo(() => new Date(), []);
    const firstDayOfMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);

    const [fromDate, setFromDate] = useState<string>(formatDate(firstDayOfMonth));
    const [toDate, setToDate] = useState<string>(formatDate(today));
    const [interval, setInterval] = useState<TimeInterval>('day');

    // 입력 필드에 표시될 값 (month 선택 시 YYYY-MM, 그 외 YYYY-MM-DD)
    const [displayFrom, setDisplayFrom] = useState<string>(formatDate(firstDayOfMonth));
    const [displayTo, setDisplayTo] = useState<string>(formatDate(today));

    // interval 변경 시 디스플레이 값 동기화
    useEffect(() => {
        if (interval === 'month') {
            setDisplayFrom(fromDate.substring(0, 7)); // YYYY-MM
            setDisplayTo(toDate.substring(0, 7));
        } else {
            // 기존 날짜가 있다면 그대로 사용, 없으면 오늘 기준
            setDisplayFrom(fromDate); 
            setDisplayTo(toDate);
        }
    }, [interval]);

    const handleDisplayFromChange = (val: string) => {
        setDisplayFrom(val);
        if (interval === 'month') {
            setFromDate(`${val}-01`);
        } else {
            setFromDate(val);
        }
    };

    const handleDisplayToChange = (val: string) => {
        setDisplayTo(val);
        if (interval === 'month') {
            // 해당 월의 마지막 날짜 계산
            const [year, month] = val.split('-').map(Number);
            const lastDay = new Date(year, month, 0).getDate();
            setToDate(`${val}-${String(lastDay).padStart(2, '0')}`);
        } else {
            setToDate(val);
        }
    };

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 데이터 상태
    const [summaryData, setSummaryData] = useState<SalesSummaryResponse | null>(null);
    const [trendData, setTrendData] = useState<SalesTrendData[]>([]);
    const [peakData, setPeakData] = useState<SalesPeakData[]>([]);
    const [rankingData, setRankingData] = useState<MenuRankingData[]>([]);

    const fetchAllData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // fromDate(00:00:00) ~ toDate(23:59:59)
            const start = new Date(`${fromDate}T00:00:00`);
            const end = new Date(`${toDate}T23:59:59`);

            const mappedDateRange = { from: start, to: end };

            // 1. 요약 데이터
            const summaryData = await getSalesSummary(storePublicId, mappedDateRange.from, mappedDateRange.to, interval);
            if (summaryData) {
                setSummaryData(summaryData);
            }

            // 2. 추이 데이터 (Trend)
            const trendDataList = await getSalesTrend(storePublicId, mappedDateRange.from, mappedDateRange.to, interval);
            if (trendDataList) {
                setTrendData(trendDataList);
            }

            // 3. 피크 데이터 (Peak)
            const peakDataList = await getSalesPeak(storePublicId, mappedDateRange.from, mappedDateRange.to);
            if (peakDataList) {
                setPeakData(peakDataList);
            }

            // 4. 메뉴 랭킹 데이터 (Menu Ranking)
            const rankingDataList = await getMenuRanking(storePublicId, mappedDateRange.from, mappedDateRange.to, 5);
            if (rankingDataList) {
                setRankingData(rankingDataList);
            }

        } catch (err) {
            console.error('매출 분석 데이터 로드 실패:', err);
            setError('데이터를 불러오는데 실패했습니다. 날짜 범위를 확인해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    // 최초 로딩 및 fromDate/toDate/interval 변경 시에도 수동 조회를 위해 여기서는 effect 제외
    // 사용자가 항상 '조회' 버튼을 누르게끔 유도합니다.
    useEffect(() => {
        fetchAllData();
    }, []);

    // 히트맵용 매트릭스 변환 로직
    // 요일: 월(1) ~ 일(7), 시간: 0 ~ 23
    const daysName = ['월', '화', '수', '목', '금', '토', '일'];
    const heatmapGrid = useMemo(() => {
        // [0: 월, 1: 화... 6: 일] 배열 안에 24시간 배열 세팅
        const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
        let maxOrder = 0;

        peakData.forEach(p => {
            if (p.dayOfWeek >= 1 && p.dayOfWeek <= 7) {
                grid[p.dayOfWeek - 1][p.hour] = p.orderCount;
                if (p.orderCount > maxOrder) maxOrder = p.orderCount;
            }
        });

        return { grid, maxOrder };
    }, [peakData]);

    const getHeatmapColor = (value: number, max: number) => {
        if (value === 0) return 'bg-slate-50 border-slate-100';
        
        // 5단계 명암 처리 (무채색 slate 기반)
        const ratio = value / max;
        if (ratio > 0.8) return 'bg-slate-800 border-slate-900 text-white';
        if (ratio > 0.6) return 'bg-slate-600 border-slate-700 text-white';
        if (ratio > 0.4) return 'bg-slate-400 border-slate-500 text-slate-100';
        if (ratio > 0.2) return 'bg-slate-300 border-slate-400 text-slate-800';
        return 'bg-slate-200 border-slate-300 text-slate-800';
    };

    /** 년/월 선택을 위한 커스텀 컴포넌트 (한국어 고정) */
    const MonthSelector = ({ value, onChange, max }: { value: string, onChange: (val: string) => void, max?: string }) => {
        const [year, month] = value.split('-');
        
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // 최근 5년
        const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

        return (
            <div className="flex items-center gap-1 group">
                <select 
                    value={year} 
                    onChange={(e) => onChange(`${e.target.value}-${month}`)}
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-bold p-0 cursor-pointer hover:text-black transition-colors"
                >
                    {years.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select 
                    value={month} 
                    onChange={(e) => onChange(`${year}-${e.target.value}`)}
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-bold p-0 cursor-pointer hover:text-black transition-colors"
                >
                    {months.map(m => (
                        <option 
                            key={m} 
                            value={m}
                            disabled={!!max && `${year}-${m}` > max.substring(0, 7)}
                        >
                            {parseInt(m)}월
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-6">
            <div className="mx-auto max-w-7xl">
                {/* 헤더 & 필터 영역 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">매출 분석</h1>
                        <p className="mt-3 text-sm text-slate-500">
                            매장의 매출 동향, 인기 메뉴, 피크 시간대를 분석합니다.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {interval === 'month' ? (
                                <MonthSelector 
                                    value={displayFrom} 
                                    onChange={handleDisplayFromChange} 
                                />
                            ) : (
                                <input
                                    type="date"
                                    className="text-sm border-none bg-transparent focus:ring-0 text-slate-700 cursor-pointer font-medium p-0 w-[110px]"
                                    value={displayFrom}
                                    onChange={(e) => handleDisplayFromChange(e.target.value)}
                                />
                            )}
                            <span className="text-slate-300">~</span>
                            {interval === 'month' ? (
                                <MonthSelector 
                                    value={displayTo} 
                                    onChange={handleDisplayToChange}
                                    max={formatDate(today)}
                                />
                            ) : (
                                <input
                                    type="date"
                                    className="text-sm border-none bg-transparent focus:ring-0 text-slate-700 cursor-pointer font-medium p-0 w-[110px]"
                                    value={displayTo}
                                    onChange={(e) => handleDisplayToChange(e.target.value)}
                                    max={formatDate(today)}
                                />
                            )}
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                        <select
                            className="text-sm border-none bg-transparent focus:ring-0 text-slate-700 font-medium cursor-pointer"
                            value={interval}
                            onChange={(e) => setInterval(e.target.value as TimeInterval)}
                        >
                            <option value="day">일별 보기</option>
                            <option value="week">주별 보기</option>
                            <option value="month">월별 보기</option>
                        </select>

                        <button
                            onClick={fetchAllData}
                            disabled={isLoading}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? '조회 중...' : '조회'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
                        <p className="text-sm font-semibold text-rose-700 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </p>
                    </div>
                )}

                {/* KPI 요약 4구 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {(() => {
                        const getComparisonLabel = () => {
                            if (interval === 'month') return "전월 대비";
                            if (interval === 'week') return "전주 대비";
                            if (fromDate === toDate) return "전일 대비";
                            return "전기 대비"; // Previous period for custom range
                        };
                        const comparisonLabel = getComparisonLabel();

                        return (
                            <>
                                <KPICard
                                    title="총 매출액"
                                    value={summaryData ? `${formatAmount(summaryData.totalAmount)}원` : '0원'}
                                    change={summaryData && summaryData.totalAmountGrowthRate !== null ? { 
                                        value: Number(Math.abs(summaryData.totalAmountGrowthRate).toFixed(2)), 
                                        label: comparisonLabel 
                                    } : undefined}
                                    trend={summaryData && summaryData.totalAmountGrowthRate !== null ? (summaryData.totalAmountGrowthRate >= 0 ? "up" : "down") : undefined}
                                    icon={<DollarSign className="w-6 h-6 text-slate-700" />}
                                />
                                <KPICard
                                    title="총 주문 건수"
                                    value={summaryData ? `${summaryData.totalOrderCount}건` : '0건'}
                                    change={summaryData && summaryData.orderCountGrowthRate !== null ? { 
                                        value: Number(Math.abs(summaryData.orderCountGrowthRate).toFixed(2)), 
                                        label: comparisonLabel 
                                    } : undefined}
                                    trend={summaryData && summaryData.orderCountGrowthRate !== null ? (summaryData.orderCountGrowthRate >= 0 ? "up" : "down") : undefined}
                                    icon={<ShoppingBag className="w-6 h-6 text-slate-700" />}
                                />
                                <KPICard
                                    title="평균 객단가"
                                    value={summaryData ? `${formatAmount(summaryData.averageOrderAmount)}원` : '0원'}
                                    change={summaryData && summaryData.avgAmountGrowthRate !== null ? { 
                                        value: Number(Math.abs(summaryData.avgAmountGrowthRate).toFixed(2)), 
                                        label: comparisonLabel 
                                    } : undefined}
                                    trend={summaryData && summaryData.avgAmountGrowthRate !== null ? (summaryData.avgAmountGrowthRate >= 0 ? "up" : "down") : undefined}
                                    icon={<DollarSign className="w-6 h-6 text-slate-700" />}
                                />
                                <KPICard
                                    title="최대 주문 금액"
                                    value={summaryData ? `${formatAmount(summaryData.maxOrderAmount)}원` : '0원'}
                                    change={summaryData && summaryData.maxAmountGrowthRate !== null ? { 
                                        value: Number(Math.abs(summaryData.maxAmountGrowthRate).toFixed(2)), 
                                        label: comparisonLabel 
                                    } : undefined}
                                    trend={summaryData && summaryData.maxAmountGrowthRate !== null ? (summaryData.maxAmountGrowthRate >= 0 ? "up" : "down") : undefined}
                                    icon={<Award className="w-6 h-6 text-slate-700" />}
                                />
                            </>
                        );
                    })()}
                </div>

                {/* 차트 영역 - 추이 & 랭킹 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* 매출 추이 (Line Chart) */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">매출 추이</h2>
                            <p className="text-sm text-slate-500 mt-1">선택한 기간 동안의 매출 흐름입니다.</p>
                        </div>
                        <div className="h-[350px] w-full mt-4">
                            {!trendData || trendData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            dy={10}
                                            tickFormatter={(tick) => {
                                                if (interval === 'day') return tick.substring(5, 10); // MM-DD
                                                if (interval === 'week') return `${tick.substring(0, 4)}주차`; // YYYY주차
                                                if (interval === 'month') {
                                                    const [y, m] = tick.split('-');
                                                    return `${y}년 ${m}월`;
                                                }
                                                return tick;
                                            }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: ValueType | undefined) => {
                                                if (value === undefined) return ['0원', '매출액'];
                                                return [`${formatAmount(Number(value))}원`, '매출액'];
                                            }}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="totalAmount"
                                            stroke="#0f172a"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* 인기 메뉴 (Bar Chart) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">인기 메뉴 TOP 5</h2>
                            <p className="text-sm text-slate-500 mt-1">가장 많이 팔린 메뉴입니다.</p>
                        </div>
                        <div className="h-[350px] w-full mt-4">
                            {!rankingData || rankingData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={rankingData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="menuName"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                                            width={80}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: ValueType | undefined, name: NameType | undefined) => {
                                                if (value === undefined || name === undefined) return ['0', ''];
                                                const labelName = String(name);
                                                if (labelName === "totalQuantity") return [`${Number(value)}개`, '판매 수량'];
                                                return [value, labelName];
                                            }}
                                        />
                                        <Bar
                                            dataKey="totalQuantity"
                                            fill="#334155"
                                            radius={[0, 4, 4, 0]}
                                            barSize={20}
                                            label={{ position: 'right', fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* 요일 시간대 피크 히트맵 */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-900">요일 및 시간대별 붐빔 정도</h2>
                        <p className="text-sm text-slate-500 mt-1">진한 색일수록 주문이 많았던 시간대입니다.</p>
                    </div>

                    <div className="w-full overflow-x-auto pb-4">
                        <div className="min-w-200">
                            {/* X축 시간 라벨 */}
                            <div className="flex ml-12 mb-2">
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div key={i} className="flex-1 text-center text-xs font-semibold text-slate-400">
                                        {i}
                                    </div>
                                ))}
                            </div>

                            {/* 바디 (요일 + 그리드) */}
                            <div className="space-y-1">
                                {heatmapGrid.grid.map((hours, dayIndex) => (
                                    <div key={dayIndex} className="flex items-center">
                                        {/* Y축 요일 라벨 */}
                                        <div className="w-12 text-sm font-bold text-slate-600 text-right pr-4">
                                            {daysName[dayIndex]}
                                        </div>
                                        {/* 한 요일의 24시간 블록 */}
                                        <div className="flex flex-1 gap-1">
                                            {hours.map((val, hourIndex) => (
                                                <div
                                                    key={hourIndex}
                                                    className={`h-8 flex-1 rounded text-[10px] flex items-center justify-center border transition-colors ${getHeatmapColor(val, heatmapGrid.maxOrder)}`}
                                                    title={`${daysName[dayIndex]}요일 ${hourIndex}시: ${val}건`}
                                                >
                                                    {val > 0 && heatmapGrid.maxOrder < 50 ? val : ''}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 범례 */}
                            <div className="mt-6 flex justify-end items-center gap-2 text-xs font-medium text-slate-500">
                                <span>적음</span>
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded bg-slate-50 border border-slate-100"></div>
                                    <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300"></div>
                                    <div className="w-4 h-4 rounded bg-slate-400 border border-slate-500"></div>
                                    <div className="w-4 h-4 rounded bg-slate-600 border border-slate-700"></div>
                                    <div className="w-4 h-4 rounded bg-slate-800 border border-slate-900"></div>
                                </div>
                                <span>많음</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
