import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout() {
  const location = useLocation();

  // 로그인 관련 페이지에서는 Navbar와 Footer 숨기기
  const isAuthPage = ['/login', '/oauth/redirect'].includes(location.pathname);
  // 챗봇 페이지는 전체 화면 사용
  const isChatPage = location.pathname === '/chat';

  if (isAuthPage || isChatPage) {
    return (
      <div className="min-h-screen bg-gray-100 text-slate-900">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900 flex flex-col">
      <Navbar />
      <main className="mx-auto max-w-7xl w-full px-6 pt-28 pb-10 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
