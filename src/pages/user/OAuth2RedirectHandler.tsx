import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { socialLogin } from "@/api/user/auth.ts";
import { setAccessToken } from "@/utils/auth.ts";

const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      socialLogin(code)
        .then((res) => {
          const accessToken =
            res.headers["authorization"] || res.headers["Authorization"];

          if (accessToken) {
            setAccessToken(accessToken);

            // 로그인 전에 저장해 둔 리다이렉트 경로가 있으면 우선 사용
            const redirectPath = localStorage.getItem("post_login_redirect");
            if (redirectPath) {
              localStorage.removeItem("post_login_redirect");
              navigate(redirectPath, { replace: true });
            } else {
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중입니다...</p>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;
