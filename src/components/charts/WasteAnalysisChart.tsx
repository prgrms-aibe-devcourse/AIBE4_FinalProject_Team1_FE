import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList} from "recharts";
import type {StockAnalyticResponse} from "@/types/analytics/stockAnalytics.ts";

interface Props {
    data: StockAnalyticResponse[];
}

// 1. 커스텀 툴팁을 위한 Props 타입 정의
interface CustomTooltipProps {
    active?: boolean;
    payload?: {
        payload: StockAnalyticResponse;
    }[];
}

// 2. any 대신 명시적인 타입 사용
const CustomTooltip = ({active, payload}: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">
                    {item.ingredientName}
                </p>
                <div className="flex items-end gap-1">
                    <p className="text-sm font-black text-gray-900">
                        {Number(item.totalWasteAmount).toLocaleString()}원
                    </p>
                    <span className="text-[10px] font-medium text-gray-400 mb-0.5">
                        (총 {item.totalWasteCount}건)
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

// 3. 커스텀 라벨을 위한 Props 타입 정의
interface CustomLabelProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    value?: string | number;
}

// 4. any 대신 명시적인 타입 사용
const CustomLabel = (props: CustomLabelProps) => {
    const {x, y, width, height, value} = props;
    if (x === undefined || y === undefined || width === undefined || height === undefined || value === undefined) {
        return null;
    }

    return (
        <text
            x={x + width + 5}
            y={y + height / 2}
            dy={4} // 수직 중앙 정렬 미세 조정
            fill="#ef4444"
            fontSize={10}
            fontWeight="bold"
            textAnchor="start"
        >
            {Number(value).toLocaleString()}
        </text>
    );
};


const WasteAnalysisChart = ({data}: Props) => {
    // 5. 데이터 가공
    const chartData = [...data]
        .filter(item => Number(item.totalWasteAmount) > 0)
        .sort((a, b) => Number(b.totalWasteAmount) - Number(a.totalWasteAmount))
        .slice(0, 5);

    return (
        <div className="h-full w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{left: -20, right: 60, top: 10, bottom: 10}}
                    barCategoryGap="20%"
                >
                    <XAxis type="number" hide/>
                    <YAxis
                        dataKey="ingredientName"
                        type="category"
                        width={100}
                        tick={{fontSize: 12, fontWeight: 700, fill: '#4b5563'}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        content={<CustomTooltip/>}
                        cursor={{fill: '#f9fafb', radius: 4}}
                    />
                    <Bar
                        dataKey="totalWasteAmount"
                        barSize={18}
                        radius={[0, 6, 6, 0]}
                    >
                        {chartData.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === 0 ? '#ef4444' : '#fca5a5'}
                            />
                        ))}
                        <LabelList
                            dataKey="totalWasteAmount"
                            position="right"
                            content={<CustomLabel/>}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {chartData.length === 0 && (
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 text-center">
                    <span className="text-2xl mb-2 text-gray-300">🎉</span>
                    <span className="text-sm font-bold text-gray-400">폐기 이력이 없습니다!</span>
                </div>
            )}
        </div>
    );
};

export default WasteAnalysisChart;