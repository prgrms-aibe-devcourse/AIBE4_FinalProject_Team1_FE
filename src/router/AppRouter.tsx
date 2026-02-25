import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "../utils/auth";
import MainLayout from "./layout/MainLayout";
import StoreGuard from "./layout/StoreGuard";

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
import ReceivingPage from "../pages/stock/ReceivingPage";
import ReceiveRegistrationPage from "../pages/stock/ReceiveRegistrationPage";
import StockDocumentsPage from "../pages/stock/StockDocumentsPage";
import DisposalPage from "../pages/stock/DisposalPage";
import StockPage from "../pages/stock/StockPage";

// Dining
import DiningTablePage from "../pages/dining/diningTablePage";

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

                    {/* 매장 선택이 완료된 후 접근 */}
                    <Route element={<StoreGuard />}>
                        {/* 대시보드 */}
                        <Route path="/dashboard" element={<DashboardPage />} />

                        {/* 매장 관리 */}
                        <Route path="/stores/manage" element={<StoreManagePage />} />

                        {/* 재고 관리 */}
                        <Route path="/stock/" element={<StockPage />} />
                        <Route path="/stock/stocktakes" element={<StocktakeListPage />} />
                        <Route path="/stock/stocktakes/new" element={<StocktakePage />} />
                        <Route path="/stock/ingredients" element={<IngredientPage />} />
                        <Route path="/stock/receiving" element={<ReceivingPage />} />
                        <Route path="/stock/receiving/new" element={<ReceiveRegistrationPage />} />
                        <Route path="/stock/receiving/documents" element={<StockDocumentsPage />} />
                        <Route path="/stock/disposal" element={<DisposalPage />} />

                        {/* 매출 관리 */}
                        <Route path="/sales/menu" element={<MenuPage />} />

                        {/* 주문 관리 */}
                        <Route path="/orders/tables" element={<DiningTablePage />} />

                        {/* 거래처 관리 */}
                        <Route path="/vendors" element={<VendorPage />} />

                        {/* 마이페이지 */}
                        <Route path="/me" element={<MyPage />} />
                    </Route>

                    {/* 404 처리 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
