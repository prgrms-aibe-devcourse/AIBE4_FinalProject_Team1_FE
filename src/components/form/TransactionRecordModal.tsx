import TransactionForm, {type TransactionFormData} from "./TransactionForm";

type TransactionRecordModalProps = {
    onClose: () => void;
    onSubmit: (data: TransactionFormData) => void;
    initialDate?: string;
};

export default function TransactionRecordModal({onClose, onSubmit, initialDate}: TransactionRecordModalProps) {

    const handleSubmit = (data: TransactionFormData) => {
        console.log("Submitting transaction data:", data);
        onSubmit(data);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">지출/수입 기록</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 flex justify-center items-center"
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <TransactionForm 
                        id="transaction-form" 
                        onSubmit={handleSubmit}
                        initialData={initialDate ? {date: initialDate} : undefined}
                    />
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 px-6 rounded-full bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        form="transaction-form"
                        className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition"
                    >
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
