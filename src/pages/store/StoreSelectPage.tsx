import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyStores, setDefaultStore } from '@/api/store';
import type { MyStoreResponse } from '@/types';
import { Store as StoreIcon, CheckCircle, Loader2 } from 'lucide-react';

const StoreSelectPage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<MyStoreResponse[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await getMyStores();
        setStores(data);

        // 대표 매장이 이미 있으면 자동으로 대시보드로 이동
        const defaultStore = data.find((s) => s.isDefault);
        if (defaultStore) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // 매장이 1개면 자동 선택
        if (data.length === 1) {
          setSelectedStoreId(data[0].storeId);
        }
      } catch (err) {
        console.error('Failed to fetch stores:', err);
        setError('매장 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!selectedStoreId) {
      setError('매장을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await setDefaultStore(selectedStoreId);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Failed to set default store:', err);
      setError(err.response?.data?.message || '대표 매장 설정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">매장 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <StoreIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">대표 매장 선택</h1>
            <p className="text-gray-600">
              여러 매장에 소속되어 있습니다. 기본으로 사용할 대표 매장을 선택해주세요.
            </p>
            <p className="text-sm text-indigo-600 mt-2 font-medium">
              * 대표 매장은 나중에 변경할 수 있습니다.
            </p>
          </div>

          {/* Store List */}
          <div className="space-y-3 mb-6">
            {stores.map((store) => (
              <button
                key={store.storeId}
                onClick={() => setSelectedStoreId(store.storeId)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedStoreId === store.storeId
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {store.storeName}
                      </h3>
                      {selectedStoreId === store.storeId && (
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {store.myRole === 'OWNER' ? '대표' : '직원'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      사업자번호: {store.businessRegistrationNumber}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedStoreId || submitting}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                설정 중...
              </>
            ) : (
              '대표 매장으로 설정하고 시작하기'
            )}
          </button>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              대표 매장은 로그인 시 기본으로 선택되는 매장입니다.<br />
              매장 관리 메뉴에서 언제든지 변경할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSelectPage;
