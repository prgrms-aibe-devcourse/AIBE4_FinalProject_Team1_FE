import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import PersonalLedgerPage from "../pages/ledger/personal/PersonalLedgerPage";
import SharedPage from "../pages/ledger/shared/SharedPage.tsx";
import ChallengePage from "../pages/challenge/ChallengePage";
import MyPage from "../pages/me/MyPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* 기본 진입: 개인 가계부(캘린더) */}
          <Route index element={<Navigate to="/ledger" replace />} />

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
          <Route path="*" element={<Navigate to="/ledger" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
