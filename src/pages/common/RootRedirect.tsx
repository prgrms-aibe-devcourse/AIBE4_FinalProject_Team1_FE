import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from "@/api/user/user.ts";
import { getAccessToken, removeAccessToken } from "@/utils/auth.ts";

/**
 * 루트 경로(/) 접속 시 유저 정보를 확인하여 적절한 페이지로 리다이렉트
 */
const RootRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkAuthAndRedirect = async () => {
      // 토큰이 없으면 즉시 로그인 페이지로
      const token = getAccessToken();
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        // 실제 유저 정보 API 호출로 인증 상태 확인
        await getUserProfile();

        if (cancelled) {
          return;
        }

        // 인증 성공 시 대시보드로 이동
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("유저 정보 조회 실패:", error);

        // 인증 실패 시 토큰 제거하고 로그인 페이지로
        removeAccessToken();

        if (!cancelled) {
          navigate("/login", { replace: true });
        }
      }
    };

    void checkAuthAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
};

export default RootRedirect;
