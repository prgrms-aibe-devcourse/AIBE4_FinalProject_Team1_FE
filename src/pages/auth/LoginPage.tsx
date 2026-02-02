import React from "react";

type SocialProvider = "google" | "kakao";

const LoginPage: React.FC = () => {
  const handleLogin = (provider: SocialProvider): void => {
    console.log(`${provider} 로그인 시도`);
    window.location.href = `http://localhost/oauth2/authorization/${provider}`;
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">로그인</h2>
          <p className="mt-2 text-sm text-gray-600">
            서비스를 이용하기 위해 로그인이 필요합니다.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => handleLogin("google")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Google 계정으로 로그인
          </button>

          <button
            onClick={() => handleLogin("kakao")}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191919] transition-all hover:bg-[#FADA0A] active:scale-[0.98]"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
              alt="Kakao"
              className="h-5 w-5"
            />
            카카오톡으로 로그인
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>
            도움이 필요하신가요?{" "}
            <span className="cursor-pointer underline">고객센터 문의</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
