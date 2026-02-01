import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import PersonalLedgerPage from "../pages/ledger/personal/PersonalLedgerPage";
import SharedPage from "../pages/ledger/shared/SharedPage.tsx";
import ChallengePage from "../pages/challenge/ChallengePage";
import MyPage from "../pages/me/MyPage";
import LoginPage from "../pages/auth/LoginPage.tsx";
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler.tsx";

export default function AppRouter() {
  const isAuthed = !!localStorage.getItem("accessToken");

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* 기본 진입: 개인 가계부(캘린더) */}
          <Route
            index
            element={
              isAuthed ? (
                <Navigate to="/ledger" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* 로그인 */}
          <Route path="/login" element={<LoginPage />} />

          <Route path="/oauth/redirect" element={<OAuth2RedirectHandler />} />

          {/* 개인 가계부 (캘린더) */}
          <Route path="/ledger" element={<PersonalLedgerPage />} />

          {/* 공유 가계부 (공유 캘린더) */}
          <Route path="/shared" element={<SharedPage />} />
          <Route path="/shared/:sharedLedgerId" element={<SharedPage />} />

          {/* 챌린지 */}
          <Route path="/challenge" element={<ChallengePage />} />

          {/* 마이페이지 */}
          <Route path="/me" element={<MyPage />} />

          {/* 404 처리 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
