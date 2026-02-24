import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "../utils/auth";
import MainLayout from "./layout/MainLayout";
import HomePage from "../pages/home/HomePage";
import MyPage from "../pages/me/MyPage";
import LoginPage from "../pages/auth/LoginPage";
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler";
import StocktakePage from "../pages/inventory/StocktakePage";
import StocktakeListPage from "../pages/inventory/StocktakeListPage";
import IngredientPage from "../pages/ingredient/IngredientPage";
import MenuPage from "../pages/menu/MenuPage";
import VendorPage from "../pages/vendor/VendorPage";

export default function AppRouter() {
  const isAuthed = !!getAccessToken();

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

          {/* 재고 관리 */}
          <Route path="/inventory/stocktakes" element={<StocktakeListPage />} />
          <Route path="/inventory/stocktakes/new" element={<StocktakePage />} />
          <Route path="/inventory/ingredients" element={<IngredientPage />} />
          {/* <Route path="/inventory" element={<InventoryPage />} /> */}
          {/* <Route path="/inventory/receiving" element={<ReceivingPage />} /> */}
          {/* <Route path="/inventory/disposal" element={<DisposalPage />} /> */}

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
