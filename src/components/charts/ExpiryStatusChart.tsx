import {PieChart, Pie, Cell, ResponsiveContainer, Tooltip} from 'recharts';
import type {StockAnalyticResponse} from "@/types/analytics/stockAnalytics.ts";

// --- 타입 정의 ---
interface ChartData {
    name: string;
    value: number;
    color: string;
    percent: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: {
        payload: ChartData;
    }[];
}

// --- 커스텀 툴팁 컴포넌트 ---
const CustomTooltip = ({active, payload}: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 shadow-lg backdrop-blur-sm">
                <p className="text-sm font-bold" style={{color: data.color}}>
                    {data.name}
                </p>
                <p className="mt-2 text-xs text-gray-600">
                    <span className="font-bold">수량:</span> {String(data.value)}개
                </p>
                <p className="text-xs text-gray-600">
                    <span className="font-bold">비중:</span> {data.percent}%
                </p>
            </div>
        );
    }
    return null;
};

// --- 메인 차트 컴포넌트 ---
const ExpiryStatusChart = ({data}: { data: StockAnalyticResponse[] }) => {
    const COLORS = ['#ef4444', '#f59e0b', '#10b981']; // 위험, 주의, 안전

    // 데이터 가공 로직
    const processData = (): ChartData[] => {
        let risk = 0, warning = 0, safe = 0;
        const now = new Date();

        data.forEach(item => {
            if (!item.minExpirationDate) {
                safe++;
                return;
            }
            const diffTime = new Date(item.minExpirationDate).getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 3) risk++;
            else if (diffDays <= 7) warning++;
            else safe++;
        });

        const total = risk + warning + safe;

        return [
            {name: '위험', value: risk, color: COLORS[0], percent: total > 0 ? (risk / total * 100).toFixed(1) : '0.0'},
            {
                name: '주의',
                value: warning,
                color: COLORS[1],
                percent: total > 0 ? (warning / total * 100).toFixed(1) : '0.0'
            },
            {name: '안전', value: safe, color: COLORS[2], percent: total > 0 ? (safe / total * 100).toFixed(1) : '0.0'},
        ];
    };

    const chartData = processData();
    const totalItems = data.length;

    // 데이터가 아예 없는 경우 처리 (빈 도넛 방지)
    const hasData = chartData.some(d => d.value > 0);

    return (
        <div className="flex flex-col h-full w-full">
            {/* 차트 영역 */}
            <div className="flex-1 relative min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={hasData ? chartData : [{name: '데이터 없음', value: 1, color: '#e5e7eb', percent: '0'}]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius="60%" // 두께감 조절
                            outerRadius="90%"
                            paddingAngle={0} // 간격을 0으로 설정하여 꽉 찬 원형 유지
                            startAngle={90}
                            endAngle={-270}
                            stroke="none" // 테두리 선 제거
                        >
                            {hasData ? (
                                chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color}/>
                                ))
                            ) : (
                                <Cell key="cell-empty" fill="#f3f4f6"/>
                            )}
                        </Pie>
                        {hasData && <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip/>}/>}
                    </PieChart>
                </ResponsiveContainer>

                {/* 중앙 텍스트 복구 (도넛이 얇아져서 다시 넣어도 괜찮음) */}
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Total</div>
                    <div className="text-2xl font-black text-gray-900">{totalItems}</div>
                </div>
            </div>

            {/* 범례 영역 */}
            <div className="flex justify-center items-center gap-4 pt-2 pb-1">
                {chartData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: entry.color}}/>
                        <span className="text-xs font-bold text-gray-500">
                            {entry.name}
                            <span className="text-gray-400 font-normal ml-1">
                                ({entry.percent}%)
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpiryStatusChart;