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

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredVendors(vendors);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = vendors.filter((vendor) =>
            vendor.name.toLowerCase().includes(term) ||
            vendor.contactPerson?.toLowerCase().includes(term) ||
            vendor.phone?.includes(term)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
            <div
                className="absolute inset-0"
                onClick={handleCancel}
            />
            <div className="relative w-full max-w-4xl rounded-lg border border-gray-300 bg-white">
                <div className="border-b border-gray-300 px-6 py-4 bg-white flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">거래처 선택</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            입고에 연결할 거래처를 선택합니다.
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 pt-4 pb-3 bg-gray-50 border-b border-gray-200">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="거래처명, 담당자, 연락처로 검색"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                </div>

                <div className="max-h-[50vh] overflow-y-auto bg-white">
                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="inline-block animate-spin text-3xl text-gray-400 mb-2">⟳</div>
                            <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6">
                            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        </div>
                    ) : filteredVendors.length === 0 && !searchTerm ? (
                        <div className="py-16 text-center text-sm text-gray-500">
                            등록된 거래처가 없습니다.
                        </div>
                    ) : (
                        <div>
                            <div className="bg-gray-50 border-b border-gray-200 px-6 py-2.5 sticky top-0">
                                <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-600">
                                    <div className="col-span-1 text-center">선택</div>
                                    <div className="col-span-5">거래처명</div>
                                    <div className="col-span-3">담당자</div>
                                    <div className="col-span-3">연락처</div>
                                </div>
                            </div>

                            <div
                                onClick={() => setTempSelected(null)}
                                className={`px-6 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                    tempSelected === null ? "bg-gray-50 border-l-2 border-l-gray-900" : ""
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
                                        <div className="text-sm text-gray-900">거래처 미지정</div>
                                        <div className="text-xs text-gray-500 mt-0.5">거래처 없이 입고를 등록합니다.</div>
                                    </div>
                                </div>
                            </div>

                            {filteredVendors.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-500">
                                    조회된 거래처가 없습니다.
                                </div>
                            ) : (
                                filteredVendors.map((vendor) => (
                                    <div
                                        key={vendor.vendorPublicId}
                                        onClick={() => setTempSelected(vendor.vendorPublicId)}
                                        className={`px-6 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                            tempSelected === vendor.vendorPublicId ? "bg-gray-50 border-l-2 border-l-gray-900" : ""
                                        }`}
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-1 text-center">
                                                <input
                                                    type="radio"
                                                    name="vendor"
                                                    checked={tempSelected === vendor.vendorPublicId}
                                                    onChange={() => setTempSelected(vendor.vendorPublicId)}
                                                    className="h-4 w-4 cursor-pointer accent-gray-900"
                                                />
                                            </div>

                                            <div className="col-span-5">
                                                <div className="text-sm text-gray-900">{vendor.name}</div>
                                            </div>

                                            <div className="col-span-3 text-sm text-gray-700">
                                                {vendor.contactPerson || "-"}
                                            </div>

                                            <div className="col-span-3 text-sm text-gray-700">
                                                {vendor.phone || "-"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-300 px-6 py-3 bg-gray-50 flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                        {!loading && !error && (
                            <span>조회 결과 {filteredVendors.length}건</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="rounded bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-black"
                        >
                            선택
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
