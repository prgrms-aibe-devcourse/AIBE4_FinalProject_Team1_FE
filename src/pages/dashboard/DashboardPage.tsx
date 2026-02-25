import { useState, useEffect } from 'react';
import { getMyStores } from '@/api/store';
import type { MyStoreResponse } from '@/types';
import { TrendingUp, Package, Users, Calendar } from 'lucide-react';

const DashboardPage = () => {
  const [currentStore, setCurrentStore] = useState<MyStoreResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storesData = await getMyStores();
        if (storesData.length > 0) {
          setCurrentStore(storesData[0]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  if (!currentStore) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">매장을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-gray-600">환영합니다!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">오늘 매출</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">재고 부족</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">-</p>
              </div>
              <Package className="h-8 w-8 text-amber-600" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">직원 수</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">-</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">이번 달</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">-</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <p>활동 내역이 없습니다.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">알림</h2>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <p>알림이 없습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🚧 개발 중</h3>
          <p className="text-sm text-blue-700">
            재고 관리, 매출 분석, 발주 관리 등의 기능은 추후 구현될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
