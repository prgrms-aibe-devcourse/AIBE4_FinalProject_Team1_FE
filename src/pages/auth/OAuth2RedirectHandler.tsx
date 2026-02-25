import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { socialLogin } from "@/api/auth.ts";
import { setAccessToken } from "@/utils/auth";
import { getMyStores } from "@/api/store.ts";
import { setStorePublicId } from "@/utils/store";

const OAuth2RedirectHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get("code");

        if (code) {
            socialLogin(code)
                .then(async (res) => {
                    const accessToken =
                        res.headers["authorization"] || res.headers["Authorization"];

                    if (accessToken) {
                        setAccessToken(accessToken);

                        // 소속 매장 목록 조회 후 분기
                        const stores = await getMyStores();

                        if (stores.length === 0) {
                            // 매장 없음 → 온보딩
                            navigate("/onboarding", { replace: true });
                        } else {
                            // 매장 있음 → 첫 번째 매장 자동 선택 후 대시보드
                            setStorePublicId(stores[0].storePublicId);
                            navigate("/dashboard", { replace: true });
                        }
                    }
                })
                .catch((err) => {
                    console.error("토큰 교환 실패:", err);
                    alert("로그인 처리에 실패했습니다.");
                    navigate("/login");
                });
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div
                    className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">로그인 처리 중입니다...</p>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;
