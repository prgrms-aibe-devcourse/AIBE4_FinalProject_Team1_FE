import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "../utils/auth";
import MainLayout from "./layout/MainLayout";

// Auth
import LoginPage from "../pages/auth/LoginPage";
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler";

// Dashboard
import DashboardPage from "../pages/dashboard/DashboardPage";

// User
import MyPage from "../pages/user/MyPage";

// Store
import StoreManagePage from "../pages/store/StoreManagePage";
import OnboardingPage from "../pages/store/OnboardingPage";

// Invitation
import InviteLandingPage from "../pages/invitation/InviteLandingPage";

// Inventory (Stock)
import StocktakePage from "../pages/stock/StocktakePage";
import StocktakeListPage from "../pages/stock/StocktakeListPage";
import IngredientPage from "../pages/ingredient/IngredientPage";
import MenuPage from "../pages/menu/MenuPage";
import VendorPage from "../pages/vendor/VendorPage";

// Common
import NotFoundPage from "../pages/common/NotFoundPage";

export default function AppRouter() {
  const isAuthed = !!getAccessToken();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* 기본 진입 */}
          <Route
            index
            element={
              isAuthed ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 인증 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth/redirect" element={<OAuth2RedirectHandler />} />

          {/* 온보딩 */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* 초대 */}
          <Route path="/invite" element={<InviteLandingPage />} />

          {/* 대시보드 */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* 매장 관리 */}
          <Route path="/stores/manage" element={<StoreManagePage />} />

          {/* 재고 관리 */}
          <Route path="/inventory/stocktakes" element={<StocktakeListPage />} />
          <Route path="/inventory/stocktakes/new" element={<StocktakePage />} />
          <Route path="/inventory/ingredients" element={<IngredientPage />} />

          {/* TODO: 매출 관리 */}
          <Route path="/sales/menu" element={<MenuPage />} />
          {/* <Route path="/sales/upload" element={<SalesUploadPage />} /> */}
          {/* <Route path="/sales/list" element={<SalesListPage />} /> */}
          {/* <Route path="/analytics/sales" element={<SalesAnalyticsPage />} /> */}

          {/* TODO: 문서 OCR */}
          {/* <Route path="/documents/upload" element={<DocumentUploadPage />} /> */}
          {/* <Route path="/documents/history" element={<DocumentHistoryPage />} /> */}

          {/* 거래처 관리 */}
          <Route path="/vendors" element={<VendorPage />} />

          {/* TODO: 발주 */}
          {/* <Route path="/orders" element={<OrdersPage />} /> */}
          {/* <Route path="/orders/recommendations" element={<RecommendationsPage />} /> */}

          {/* 마이페이지 */}
          <Route path="/me" element={<MyPage />} />

          {/* 404 처리 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
