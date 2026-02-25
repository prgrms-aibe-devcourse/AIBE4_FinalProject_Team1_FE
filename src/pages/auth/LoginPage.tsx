import React from "react";
import type { SocialProvider } from "@/types";

const LoginPage: React.FC = () => {
  const handleLogin = (provider: SocialProvider): void => {
    console.log(`${provider} 로그인 시도`);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
    window.location.href = `${baseUrl}/oauth2/authorization/${provider}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Main Content - Centered Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/images/logo.png"
                alt="Inventory"
                className="h-24 w-auto"
              />
            </div>
            <p className="text-base text-gray-700 font-medium">
              매출 분석과 재고 관리를 쉽고 똑똑하게
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">로그인</h2>

            <div className="space-y-3">
              <button
                onClick={() => handleLogin("google")}
                className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-900 transition-all hover:border-black hover:bg-gray-50"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-5 w-5 object-contain"
                />
                Google 계정으로 계속하기
              </button>

              <button
                onClick={() => handleLogin("kakao")}
                className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-[#FEE500] bg-[#FEE500] px-4 py-3.5 text-sm font-semibold text-[#191919] transition-all hover:bg-[#FADA0A]"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
                  alt="Kakao"
                  className="h-5 w-5 object-contain"
                />
                카카오 계정으로 계속하기
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                로그인하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하게 됩니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">
              이용약관
            </a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-gray-900 transition-colors">
              개인정보처리방침
            </a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-gray-900 transition-colors">
              고객센터/문의
            </a>
          </div>
          <div className="mt-4 text-center text-xs text-gray-400">
            © 2026 Inventory. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
