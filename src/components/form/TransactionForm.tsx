import {useState} from "react";
import {cn} from "../calendar"; // cn 유틸리티 임포트

// TODO: 실제 데이터 타입으로 교체해야 함
export type TransactionFormData = {
    amount: number;
    date: string; // YYYY-MM-DD
    type: 'expense' | 'income';
    method: 'cash' | 'card' | 'bank';
    category: string;
    payee: string;
    memo: string;
    tags: string[];
};

type TransactionFormProps = {
    id?: string;
    initialData?: Partial<TransactionFormData>;
    onSubmit: (data: TransactionFormData) => void;
};

const CATEGORIES = ['식비', '교통', '주거/통신', '쇼핑', '여가/문화', '의료/건강', '급여', '용돈', '기타수입', '기타지출'];

export default function TransactionForm({id, initialData, onSubmit}: TransactionFormProps) {
    const [formData, setFormData] = useState<TransactionFormData>({
        amount: initialData?.amount ?? 0,
        date: initialData?.date ?? new Date().toISOString().split('T')[0],
        type: initialData?.type ?? 'expense',
        method: initialData?.method ?? 'card',
        category: initialData?.category ?? '식비',
        payee: initialData?.payee ?? '',
        memo: initialData?.memo ?? '',
        tags: initialData?.tags ?? [],
    });
    const [tagInput, setTagInput] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replaceAll(',', '');
        const amount = parseInt(value, 10) || 0;
        setFormData(prev => ({...prev, amount}));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !formData.tags.includes(newTag)) {
                setFormData(prev => ({...prev, tags: [...prev.tags, newTag]}));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove),
        }));
    };

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form id={id} onSubmit={handleSubmit} className="space-y-5">
            {/* 금액 & 타입 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1.5">금액</label>
                    <input
                        type="text"
                        id="amount"
                        name="amount"
                        value={formData.amount.toLocaleString()}
                        onChange={handleAmountChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-semibold"
                        placeholder="0"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1.5">타입</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={cn(
                            "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-semibold",
                            formData.type === 'expense' ? 'text-rose-600' : 'text-blue-700'
                        )}
                    >
                        <option value="expense" className="text-rose-600">지출</option>
                        <option value="income" className="text-blue-700">수입</option>
                    </select>
                </div>
            </div>

            {/* 결제 수단 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">결제 수단</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['card', 'cash', 'bank'] as const).map((method) => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setFormData(prev => ({...prev, method}))}
                            className={cn(
                                "px-3 py-2 border rounded-lg text-sm font-semibold transition-colors",
                                formData.method === method
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            {method === 'card' ? '카드' : method === 'cash' ? '현금' : '은행'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 날짜 */}
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1.5">날짜</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>

            {/* 가맹점 */}
            <div>
                <label htmlFor="payee" className="block text-sm font-medium text-slate-700 mb-1.5">가맹점</label>
                <input
                    type="text"
                    id="payee"
                    name="payee"
                    value={formData.payee}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 스타벅스 강남점"
                />
            </div>

            {/* 카테고리 */}
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">카테고리</label>
                <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            {/* 메모 */}
            <div>
                <label htmlFor="memo" className="block text-sm font-medium text-slate-700 mb-1.5">메모</label>
                <textarea
                    id="memo"
                    name="memo"
                    value={formData.memo}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="상세 내역을 입력하세요"
                />
            </div>

            {/* 태그 */}
            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1.5">태그</label>
                <div className="p-2 border border-slate-300 rounded-lg">
                    <input
                        type="text"
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="w-full border-none focus:ring-0"
                        placeholder="스페이스 또는 엔터로 태그 추가"
                    />
                </div>
                {formData.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {formData.tags.map(tag => (
                            <div key={tag}
                                 className="flex items-center gap-1.5 bg-slate-200 rounded-full px-3 py-1 text-sm font-medium text-slate-700">
                                <span>#{tag}</span>
                                <button type="button" onClick={() => removeTag(tag)}
                                        className="text-slate-500 hover:text-slate-800 font-bold text-xs">×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </form>
    );
}
