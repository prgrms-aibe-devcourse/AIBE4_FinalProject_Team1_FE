import { useEffect, useState } from "react";
import { getVendors } from "@/api/reference/vendor";
import type { VendorResponse } from "@/types/reference/vendor";

interface VendorSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (vendor: VendorResponse | null) => void;
    storePublicId: string;
    selectedVendorPublicId?: string | null;
}

export default function VendorSelectModal({
    isOpen,
    onClose,
    onSelect,
    storePublicId,
    selectedVendorPublicId,
}: VendorSelectModalProps) {
    const [vendors, setVendors] = useState<VendorResponse[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<VendorResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [tempSelected, setTempSelected] = useState<string | null>(
        selectedVendorPublicId ?? null
    );

    useEffect(() => {
        if (!isOpen) return;

        const fetchVendors = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getVendors(storePublicId, 'ACTIVE');
                setVendors(data);
                setFilteredVendors(data);
            } catch (err) {
                console.error(err);
                setError("거래처 목록을 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchVendors();
    }, [isOpen, storePublicId]);

    // 검색 필터링
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredVendors(vendors);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = vendors.filter((vendor) =>
            vendor.name.toLowerCase().includes(term) ||
            vendor.contactPerson?.toLowerCase().includes(term) ||
            vendor.phone?.includes(term) ||
            vendor.email?.toLowerCase().includes(term)
        );
        setFilteredVendors(filtered);
    }, [searchTerm, vendors]);

    const handleConfirm = () => {
        const selectedVendor = vendors.find((v) => v.vendorPublicId === tempSelected) ?? null;
        onSelect(selectedVendor);
        onClose();
    };

    const handleCancel = () => {
        setTempSelected(selectedVendorPublicId ?? null);
        setSearchTerm("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div
                className="absolute inset-0"
                onClick={handleCancel}
            />
            <div className="relative w-full max-w-3xl rounded-3xl border border-gray-300 bg-white shadow-2xl">
                {/* 헤더 */}
                <div className="border-b border-gray-200 px-6 py-5 bg-gray-50 flex items-center justify-between rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">거래처 선택</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            입고할 거래처를 선택해 주세요 (ACTIVE 상태만 표시)
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 검색 */}
                <div className="px-6 pt-4 pb-3 bg-white border-b border-gray-100">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="거래처명, 담당자, 전화번호, 이메일 검색..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* 내용 */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="inline-block animate-spin text-4xl text-gray-300 mb-3">⟳</div>
                            <p className="text-sm font-bold text-gray-400">거래처 목록을 불러오는 중...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6">
                            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 font-bold">
                                {error}
                            </div>
                        </div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-gray-400 font-bold text-lg">
                                {searchTerm ? "검색 결과가 없습니다." : "등록된 거래처가 없습니다."}
                            </p>
                            {!searchTerm && (
                                <p className="text-gray-400 text-sm mt-2">거래처를 먼저 등록해주세요.</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* 테이블 헤더 */}
                            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 sticky top-0">
                                <div className="grid grid-cols-12 gap-4 text-xs font-black text-gray-500 uppercase">
                                    <div className="col-span-1 text-center">선택</div>
                                    <div className="col-span-4">거래처명</div>
                                    <div className="col-span-3">담당자</div>
                                    <div className="col-span-4">연락처</div>
                                </div>
                            </div>

                            {/* 선택 안 함 옵션 */}
                            <div
                                onClick={() => setTempSelected(null)}
                                className={`px-6 py-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                    tempSelected === null ? "bg-gray-50" : ""
                                }`}
                            >
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-1 text-center">
                                        <input
                                            type="radio"
                                            name="vendor"
                                            checked={tempSelected === null}
                                            onChange={() => setTempSelected(null)}
                                            className="h-4 w-4 cursor-pointer accent-gray-900"
                                        />
                                    </div>
                                    <div className="col-span-11">
                                        <div className="text-sm font-bold text-gray-700">거래처 선택 안 함</div>
                                        <div className="text-xs text-gray-400 mt-0.5">거래처 정보 없이 입고 등록</div>
                                    </div>
                                </div>
                            </div>

                            {/* 거래처 목록 */}
                            {filteredVendors.map((vendor) => (
                                <div
                                    key={vendor.vendorPublicId}
                                    onClick={() => setTempSelected(vendor.vendorPublicId)}
                                    className={`px-6 py-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                        tempSelected === vendor.vendorPublicId ? "bg-gray-50" : ""
                                    }`}
                                >
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        {/* 라디오 버튼 */}
                                        <div className="col-span-1 text-center">
                                            <input
                                                type="radio"
                                                name="vendor"
                                                checked={tempSelected === vendor.vendorPublicId}
                                                onChange={() => setTempSelected(vendor.vendorPublicId)}
                                                className="h-4 w-4 cursor-pointer accent-gray-900"
                                            />
                                        </div>

                                        {/* 거래처명 */}
                                        <div className="col-span-4">
                                            <div className="font-bold text-gray-900">{vendor.name}</div>
                                        </div>

                                        {/* 담당자 */}
                                        <div className="col-span-3 text-sm text-gray-600">
                                            {vendor.contactPerson || "-"}
                                        </div>

                                        {/* 연락처 */}
                                        <div className="col-span-4">
                                            {vendor.phone && (
                                                <div className="text-sm text-gray-600">{vendor.phone}</div>
                                            )}
                                            {vendor.email && (
                                                <div className="text-xs text-gray-500 mt-0.5">{vendor.email}</div>
                                            )}
                                            {!vendor.phone && !vendor.email && (
                                                <div className="text-sm text-gray-400">-</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {!loading && !error && (
                                <span>
                                    총 <span className="font-bold text-gray-900">{filteredVendors.length}</span>개의 거래처
                                    {searchTerm && <span> (검색됨)</span>}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                            >
                                선택 완료
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
