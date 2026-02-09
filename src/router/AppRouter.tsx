import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import HomePage from "../pages/home/HomePage";
import MyPage from "../pages/me/MyPage";
import LoginPage from "../pages/auth/LoginPage.tsx";
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler.tsx";

export default function AppRouter() {
  const isAuthed = !!localStorage.getItem("accessToken");

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* 기본 진입: 홈 */}
          <Route
            index
            element={
              isAuthed ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* 로그인 */}
          <Route path="/login" element={<LoginPage />} />

          <Route path="/oauth/redirect" element={<OAuth2RedirectHandler />} />

          {/* 홈 */}
          <Route path="/home" element={<HomePage />} />

          {/* TODO: 재고 관리 */}
          {/* <Route path="/inventory" element={<InventoryPage />} /> */}
          {/* <Route path="/inventory/receiving" element={<ReceivingPage />} /> */}
          {/* <Route path="/inventory/disposal" element={<DisposalPage />} /> */}

          {/* TODO: 매출 관리 */}
          {/* <Route path="/sales/upload" element={<SalesUploadPage />} /> */}
          {/* <Route path="/sales/list" element={<SalesListPage />} /> */}
          {/* <Route path="/analytics/sales" element={<SalesAnalyticsPage />} /> */}

          {/* TODO: 문서 OCR */}
          {/* <Route path="/documents/upload" element={<DocumentUploadPage />} /> */}
          {/* <Route path="/documents/history" element={<DocumentHistoryPage />} /> */}

          {/* TODO: 발주 */}
          {/* <Route path="/orders" element={<OrdersPage />} /> */}
          {/* <Route path="/orders/recommendations" element={<RecommendationsPage />} /> */}

          {/* TODO: 대시보드 */}
          {/* <Route path="/analytics" element={<AnalyticsPage />} /> */}

          {/* 마이페이지 */}
          <Route path="/me" element={<MyPage />} />

          {/* 404 처리 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
