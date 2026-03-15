import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import type {StockAnalyticResponse} from "@/types/analytics/stockAnalytics.ts";

interface Props {
    data: StockAnalyticResponse[];
}

// 1. 커스텀 툴팁을 위한 Props 타입 정의
interface CustomTooltipProps {
    active?: boolean;
    payload?: {
        value: number | string;
    }[];
    label?: string;
}

// 2. any 대신 명시적인 타입 사용
const CustomTooltip = ({active, payload, label}: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
                <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-black text-indigo-600">
                    {String(payload[0].value)}개
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">현재 재고</p>
            </div>
        );
    }
    return null;
};

const StockLevelChart = ({data}: Props) => {
    // 3. 재고가 적은 순으로 정렬
    const chartData = [...data]
        .sort((a, b) => Number(a.currentQuantity) - Number(b.currentQuantity))
        .slice(0, 8); // Top 8 items

    return (
        <div className="h-full w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{top: 5, right: 40, left: 20, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0"/>
                    <XAxis type="number" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false}/>
                    <YAxis
                        dataKey="ingredientName"
                        type="category"
                        width={80}
                        tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                    />

                    <Tooltip
                        cursor={{fill: '#f8fafc', radius: 4}}
                        content={<CustomTooltip/>}
                    />

                    <Bar dataKey="currentQuantity" name="현재 재고" radius={[0, 6, 6, 0]} barSize={16}>
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.isLowStock ? '#ef4444' : '#6366f1'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <span className="text-sm font-bold text-gray-400">데이터 없음</span>
                </div>
            )}
        </div>
    );
};

export default StockLevelChart;