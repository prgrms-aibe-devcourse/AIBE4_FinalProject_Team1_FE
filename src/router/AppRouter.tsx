import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import StoreGuard from "./layout/StoreGuard";

// Auth
import LoginPage from "../pages/user/LoginPage.tsx";
import OAuth2RedirectHandler from "../pages/user/OAuth2RedirectHandler.tsx";

// Dashboard
import DashboardPage from "../pages/sales/DashboardPage.tsx";

// User
import MyPage from "../pages/user/MyPage";

// Store
import StoreManagePage from "../pages/store/StoreManagePage";
import OnboardingPage from "../pages/store/OnboardingPage";
import StoreMemberPage from "../pages/store/StoreMemberPage";

// Invitation
import InviteLandingPage from "../pages/store/InviteLandingPage.tsx";
import InvitationManagePage from "../pages/store/InvitationManagePage.tsx";

// Inventory (Stock)
import StockTakePage from "../pages/stock/StockTakePage.tsx";
import StockTakeListPage from "../pages/stock/StockTakeListPage.tsx";
import StockShortagePage from "../pages/stock/StockShortagePage.tsx";
import IngredientPage from "../pages/reference/IngredientPage.tsx";
import MenuPage from "../pages/reference/MenuPage.tsx";
import VendorPage from "../pages/reference/VendorPage.tsx";
import StockInboundPage from "../pages/stock/StockInboundPage";
import StockInboundRegistrationPage from "../pages/stock/StockInboundRegistrationPage";
import StockDocumentsPage from "../pages/stock/StockDocumentsPage";
import DisposalPage from "../pages/stock/DisposalPage";
import StockPage from "../pages/stock/StockPage";
import StockLogPage from "../pages/stock/StockLogPage.tsx";
import InboundDetailPage from "../pages/stock/InboundDetailPage.tsx";

// Dining
import DiningTablePage from "../pages/sales/DiningTablePage.tsx";

// Sales
import SalesOrderListPage from "../pages/sales/SalesOrderListPage";

// SalesLedger
import SalesLedgerPage from "../pages/sales/SalesLedgerPage";

// Purchases
import PurchaseOrderListPage from "../pages/purchase/PurchaseOrderListPage";
import PurchaseOrderCreatePage from "../pages/purchase/PurchaseOrderCreatePage";

// Common
import NotFoundPage from "../pages/common/NotFoundPage";
import RootRedirect from "../pages/common/RootRedirect";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    {/* 기본 진입 - API 호출로 유저 정보 확인 후 리다이렉트 */}
                    <Route index element={<RootRedirect />} />

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
                        <Route path="/stores/members" element={<StoreMemberPage />} />
                        <Route path="/stores/invitations" element={<InvitationManagePage />} />

                        {/* 재고 관리 */}
                        <Route path="/stock/" element={<StockPage />} />
                        <Route path="/stock/stocktakes" element={<StockTakeListPage />} />
                        <Route path="/stock/stocktakes/new" element={<StockTakePage />} />
                        <Route path="/stock/stocktakes/:sheetPublicId" element={<StockTakePage />} />
                        <Route path="/stock/ingredients" element={<IngredientPage />} />
                        <Route path="/stock/inbound" element={<StockInboundPage />} />
                        <Route path="/stock/inbound/new" element={<StockInboundRegistrationPage />} />
                        <Route path="/stock/inbound/documents" element={<StockDocumentsPage />} />
                        <Route path="/stock/inbound/:inboundPublicId" element={<InboundDetailPage />} />
                        <Route path="/stock/disposal" element={<DisposalPage />} />
                        <Route path="/stock/log" element={<StockLogPage />} />
                        <Route path="/stock/shortages" element={<StockShortagePage />} />

                        {/* 매출 관리 */}
                        <Route path="/sales/menu" element={<MenuPage />} />
                        <Route path="/sales/list" element={<SalesLedgerPage />} />

                        {/* 주문 관리 */}
                        <Route path="/orders" element={<SalesOrderListPage />} />
                        <Route path="/orders/tables" element={<DiningTablePage />} />

                        {/* 발주 관리 */}
                        <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
                        <Route path="/purchase-orders/new" element={<PurchaseOrderCreatePage />} />

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
