import { useState, useEffect } from 'react';
import { getUserProfile } from '@/api/user/user.ts';
import { getMyStores } from '@/api/store/store.ts';
import type { UserProfileResponse, MyStoreResponse } from '@/types';
import { User, Mail, Store as StoreIcon } from 'lucide-react';

export default function MyPage() {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [stores, setStores] = useState<MyStoreResponse[]>([]);
  const [currentStore, setCurrentStore] = useState<MyStoreResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, storesData] = await Promise.all([
          getUserProfile(),
          getMyStores()
        ]);
        setUser(userData);
        setStores(storesData);
        if (storesData.length > 0) {
          setCurrentStore(storesData[0]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-6">마이페이지</h1>

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">내 정보</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">이름</p>
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">이메일</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {currentStore && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 선택된 매장</h2>
              <div className="flex items-center gap-3">
                <StoreIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{currentStore.storeName}</p>
                  <p className="text-sm text-gray-600">
                    역할:{' '}
                    {currentStore.myRole === 'OWNER'
                      ? '대표'
                      : '직원'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">매장 통계</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-indigo-50 p-4">
                <p className="text-sm text-indigo-600">소속 매장 수</p>
                <p className="mt-1 text-2xl font-bold text-indigo-900">{stores.length}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">대표 권한</p>
                <p className="mt-1 text-2xl font-bold text-green-900">
                  {stores.filter((s: MyStoreResponse) => s.myRole === 'OWNER').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
