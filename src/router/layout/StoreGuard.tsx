import axios from 'axios';
import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { getMyStores } from '@/api/store/store.ts';
import { getStorePublicId, setStorePublicId } from '@/utils/store';
import { getAccessToken } from '@/utils/auth';
import type { MyStoreResponse } from '@/types';

type GuardState = 'loading' | 'ok' | 'onboarding' | 'login' | 'error';

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

                const activeStores = stores.filter((s) => s.memberStatus === 'ACTIVE');

                if (!stores || stores.length === 0 || activeStores.length === 0) {
                    setGuardState('onboarding');
                    return;
                }

                const currentId = getStorePublicId();
                const matched = currentId
                    ? activeStores.find((store) => store.storePublicId === currentId)
                    : undefined;

                if (!matched) {
                    const selected = selectStoreByRule(activeStores);
                    setStorePublicId(selected.storePublicId);
                }

                setGuardState('ok');
            } catch (err) {
                console.error('[StoreGuard] 매장 목록 조회 실패:', err);

                if (cancelled) return;

                if (axios.isAxiosError(err)) {
                    const status = err.response?.status;
                    if (status === 401 || status === 403) {
                        setGuardState('login');
                        return;
                    }
                }

                setGuardState('error');
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
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
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

    if (state === 'error') {
        return (
            <div className="flex min-h-screen items-center justify-center px-6">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-lg font-bold text-slate-900">
                        매장 정보를 불러오지 못했습니다.
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        일시적인 네트워크 문제이거나 서버 응답이 지연되고 있습니다.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return <Outlet />;
}