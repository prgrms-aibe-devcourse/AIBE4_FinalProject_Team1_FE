import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createStore, getMyStores, setDefaultStore } from '@/api/store/store.ts';
import { acceptInvitation } from '@/api/store/invitation.ts';
import type { MyStoreResponse, StoreManageTabType } from '@/types';
import { Store as StoreIcon, Star, Loader2 } from 'lucide-react';

const StoreManagePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stores, setStores] = useState<MyStoreResponse[]>([]);
  const [_currentStore, setCurrentStore] = useState<MyStoreResponse | null>(null);

  // 쿼리 파라미터에서 초기 탭 설정
  const initialTab = (searchParams.get('tab') as StoreManageTabType) || 'list';
  const [activeTab, setActiveTab] = useState<StoreManageTabType>(initialTab);

  // 매장 목록 조회
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesData = await getMyStores();
        setStores(storesData);
        const defaultStore = storesData.find((s) => s.isDefault);
        if (defaultStore) {
          setCurrentStore(defaultStore);
        } else if (storesData.length > 0) {
          setCurrentStore(storesData[0]);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };
    fetchStores();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab') as StoreManageTabType;
    if (tab && ['list', 'create', 'join'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 매장 생성
  const [storeName, setStoreName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // 초대 코드
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleCreateStore = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!storeName.trim()) {
      setCreateError('매장명을 입력해주세요.');
      return;
    }

    if (!businessNumber.trim() || !/^\d{10}$/.test(businessNumber)) {
      setCreateError('사업자등록번호는 10자리 숫자여야 합니다.');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await createStore({
        name: storeName,
        businessRegistrationNumber: businessNumber
      });

      // 생성한 매장을 기본 매장으로 설정
      await setDefaultStore(response.storePublicId);

      // 대시보드로 즉시 이동
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setCreateError(err.response?.data?.message || '매장 생성에 실패했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinWithCode = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError('');

    if (!inviteCode.trim()) {
      setJoinError('초대 코드를 입력해주세요.');
      return;
    }

    setJoinLoading(true);
    try {
      const response = await acceptInvitation({
        code: inviteCode
      });

      // 가입 후 매장 목록을 다시 가져옴
      const updatedStores = await getMyStores();
      setStores(updatedStores);

      // 방금 가입한 매장 찾기
      const joinedStore = updatedStores.find((s) => s.storeId === response.storeId);
      if (joinedStore) {
        // 가입한 매장을 기본 매장으로 설정
        await setDefaultStore(joinedStore.storePublicId);
      }

      // 대시보드로 즉시 이동
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setJoinError('유효하지 않은 초대 코드입니다.');
      } else {
        setJoinError(err.response?.data?.message || '가입에 실패했습니다.');
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSetDefaultStore = async (storePublicId: string) => {
    try {
      await setDefaultStore(storePublicId);
      const updatedStores = await getMyStores();
      setStores(updatedStores);
      const newDefault = updatedStores.find((s) => s.storePublicId === storePublicId);
      if (newDefault) {
        setCurrentStore(newDefault);
      }
    } catch (err) {
      console.error('Failed to set default store:', err);
      alert('대표 매장 설정에 실패했습니다.');
    }
  };

  const handleSelectStore = (store: MyStoreResponse) => {
    setCurrentStore(store);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">매장 관리</h1>
          <p className="mt-2 text-gray-600">소속된 매장을 관리하고 새로운 매장을 추가하세요</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'list'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              내 매장 목록
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'create'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              새 매장 등록
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'join'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              초대 코드로 가입
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="rounded-lg bg-white border border-gray-200 p-6">
          {activeTab === 'list' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">소속 매장</h2>

              {stores.length === 0 ? (
                <div className="text-center py-12">
                  <StoreIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">등록된 매장이 없습니다</p>
                  <div className="mt-6 flex gap-3 justify-center">
                    <button
                      onClick={() => setActiveTab('create')}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                    >
                      새 매장 등록
                    </button>
                    <button
                      onClick={() => setActiveTab('join')}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      초대 코드로 가입
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map((store: MyStoreResponse) => (
                    <div
                      key={store.storeId}
                      className={`rounded-lg border-2 p-4 transition-all ${
                        store.isDefault
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{store.storeName}</h3>
                            {store.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-xs font-semibold text-white">
                                <Star className="w-3 h-3 fill-current" />
                                대표 매장
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              역할: <span className="font-semibold">{store.myRole === 'OWNER' ? '대표' : '직원'}</span>
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              사업자번호: {store.businessRegistrationNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!store.isDefault && (
                            <button
                              onClick={() => handleSetDefaultStore(store.storePublicId)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              대표 매장으로 설정
                            </button>
                          )}
                          <button
                            onClick={() => handleSelectStore(store)}
                            className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
                          >
                            선택
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateStore} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">새 매장 등록</h2>
                <p className="text-sm text-gray-600 mb-6">매장 정보를 입력하여 새로운 매장을 생성하세요</p>
              </div>

              <div>
                <label htmlFor="storeName" className="block text-sm font-semibold text-gray-900 mb-2">
                  매장명 <span className="text-red-600">*</span>
                </label>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                  placeholder="예: 서울 강남점"
                />
              </div>

              <div>
                <label htmlFor="businessNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                  사업자등록번호 <span className="text-red-600">*</span>
                </label>
                <input
                  id="businessNumber"
                  type="text"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow font-mono"
                  placeholder="0000000000"
                  maxLength={10}
                />
                <p className="mt-2 text-xs text-gray-500">10자리 숫자를 입력해주세요</p>
              </div>

              {createError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{createError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  '매장 만들기'
                )}
              </button>
            </form>
          )}

          {activeTab === 'join' && (
            <form onSubmit={handleJoinWithCode} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">초대 코드로 가입</h2>
                <p className="text-sm text-gray-600 mb-6">받은 초대 코드를 입력하여 매장에 참여하세요</p>
              </div>

              <div>
                <label htmlFor="inviteCode" className="block text-sm font-semibold text-gray-900 mb-2">
                  초대 코드 <span className="text-red-600">*</span>
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow font-mono tracking-wider"
                  placeholder="12345678"
                />
              </div>

              {joinError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{joinError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={joinLoading}
                className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joinLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '가입하기'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreManagePage;
