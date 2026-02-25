import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { getMyStores } from '@/api/store';
import { getStorePublicId, setStorePublicId } from '@/utils/store';
import { getAccessToken } from '@/utils/auth';
import type { MyStoreResponse } from '@/types';

type GuardState = 'loading' | 'ok' | 'onboarding' | 'login';

const selectStoreByRule = (stores: MyStoreResponse[]): MyStoreResponse => {
  const defaultStore = stores.find((store) => store.isDefault);
  if (defaultStore) return defaultStore;

  const withDisplayOrder = stores.filter(
    (store) => typeof (store as any).displayOrder === 'number',
  );
  if (withDisplayOrder.length > 0) {
    return [...withDisplayOrder].sort(
      (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    )[0];
  }

  const withCreatedAt = stores.filter((store) => (store as any).createdAt);
  if (withCreatedAt.length > 0) {
    return [...withCreatedAt].sort(
      (a: any, b: any) =>
        new Date((a as any).createdAt).getTime() -
        new Date((b as any).createdAt).getTime(),
    )[0];
  }

  const withNumericId = stores.filter(
    (store) => typeof (store as any).id === 'number',
  );
  if (withNumericId.length > 0) {
    return [...withNumericId].sort(
      (a: any, b: any) => (a.id ?? 0) - (b.id ?? 0),
    )[0];
  }

  return stores[0];
};

export default function StoreGuard() {
  const location = useLocation();
  const [state, setGuardState] = useState<GuardState>('loading');

  useEffect(() => {
    let cancelled = false;

    const bootstrapStore = async () => {
      const token = getAccessToken();
      if (!token) {
        setGuardState('login');
        return;
      }

      try {
        const stores = await getMyStores();
        if (cancelled) return;

        if (!stores || stores.length === 0) {
          setGuardState('onboarding');
          return;
        }

        const currentId = getStorePublicId();
        const matched = currentId
          ? stores.find((store) => store.storePublicId === currentId)
          : undefined;

        if (!matched) {
          const selected = selectStoreByRule(stores);
          setStorePublicId(selected.storePublicId);
        }

        setGuardState('ok');
      } catch (err) {
        console.error('[StoreGuard] 매장 목록 조회 실패:', err);
        if (!cancelled) setGuardState('login');
      }
    };

    bootstrapStore();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-slate-500">매장 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (state === 'onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  if (state === 'login') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
