import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/api/user/auth.ts";
import { getUserProfile } from "@/api/user/user.ts";
import { getMyStores } from "@/api/store/store.ts";
import { getAccessToken, removeAccessToken } from "@/utils/auth.ts";
import type { UserProfileResponse, StoreMemberRole } from "@/types";
import NotificationBell from "@/components/notification/NotificationBell";
import { useNotifications } from "@/contexts/NotificationContext";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function IconBell({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconChevronDown({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M5.5 7.5 10 12l4.5-4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

type MenuKey = "analytics" | "inventory" | "orders" | "standards" | "profile" | null;

type MenuItem = {
    label: string;
    path: string;
};

type MenuSection = {
    title: string;
    items: MenuItem[];
};

function ProfileDropdown({
                             name,
                             email,
                             onStoreManage,
                             onLogout,
                         }: {
    name: string;
    email: string;
    onStoreManage: () => void;
    onLogout: () => void;
}) {
    return (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-lg p-3 z-50">
            <div className="px-2 pb-3 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-900">{name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{email}</div>
            </div>
            <div className="pt-2 space-y-1">
                <button
                    type="button"
                    onClick={onStoreManage}
                    className="w-full text-left rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    매장 관리
                </button>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full text-left rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    로그아웃
                </button>
            </div>
        </div>
    );
}

function MegaMenu({
                      sections,
                      onNavigate,
                  }: {
    sections: MenuSection[];
    onNavigate: (path: string) => void;
}) {
    return (
        <div
            data-mega-menu
            className="fixed left-0 right-0 top-[72px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur"
        >
            <div className="mx-auto max-w-5xl px-6 py-6">
                <div className="flex justify-center">
                    <div className="grid grid-flow-col auto-cols-max gap-x-16">
                        {sections.map((sec) => (
                            <div key={sec.title} className="min-w-[120px]">
                                <div className="text-[14px] font-black text-slate-800">
                                    {sec.title}
                                </div>

                                <ul className="mt-3 space-y-2">
                                    {sec.items.map((it) => (
                                        <li key={it.label}>
                                            <button
                                                type="button"
                                                onClick={() => onNavigate(it.path)}
                                                className={cn(
                                                    "text-[13px] font-bold text-slate-700",
                                                    "rounded-md px-2 py-1 -ml-2",
                                                    "hover:bg-slate-100 transition-colors",
                                                )}
                                            >
                                                {it.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const rootRef = useRef<HTMLElement | null>(null);
    const profileWrapRef = useRef<HTMLDivElement | null>(null);

    const isAuthed = !!getAccessToken();
    const [user, setUser] = useState<UserProfileResponse | null>(null);
    const [defaultStoreRole, setDefaultStoreRole] = useState<StoreMemberRole | null>(null);

    const [openMenu, setOpenMenu] = useState<MenuKey>(null);

    const { unreadCount } = useNotifications();

    useEffect(() => {
        const fetchUserAndStore = async () => {
            const token = getAccessToken();
            if (!token) {
                setUser(null);
                setDefaultStoreRole(null);
                return;
            }
            try {
                const userData = await getUserProfile();
                setUser(userData);

                const stores = await getMyStores();
                const activeStores = stores.filter((s) => s.memberStatus === 'ACTIVE');
                const defaultStore = activeStores.find((s) => s.isDefault);
                if (defaultStore) {
                    setDefaultStoreRole(defaultStore.myRole);
                } else {
                    setDefaultStoreRole(null);
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                setUser(null);
                setDefaultStoreRole(null);
            }
        };
        fetchUserAndStore();
    }, []);

    const profileOpen = openMenu === "profile";

    const toggleProfile = () => {
        setOpenMenu((prev) => (prev === "profile" ? null : "profile"));
    };

    const closeAll = () => {
        setOpenMenu(null);
    };

    const handleLogout = async () => {
        closeAll();
        try {
            await logout();
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            removeAccessToken();
            navigate("/login");
        }
    };

    const topItemBase =
        "text-sm font-bold px-3 py-2 rounded-md transition-colors text-slate-700 hover:text-slate-900 hover:bg-slate-100";
    const topItemOpen = "bg-slate-100 text-slate-900";

    const handleProtectedNav = (path: string) => {
        const currentAuthed = !!getAccessToken();
        console.log("Navigating to:", path, "currentAuthed:", currentAuthed);

        if (!currentAuthed) {
            console.warn("User not authenticated, redirecting to login");
            if (location.pathname !== "/login") {
                navigate(`/login?redirect=${encodeURIComponent(path)}`);
            }
            return;
        }
        navigate(path);
    };

    const handleMenuNav = (path: string) => {
        console.log("Menu item clicked:", path);
        setOpenMenu(null);
        handleProtectedNav(path);
    };

    const toggleMenu = (key: Exclude<MenuKey, null>) => {
        setOpenMenu((prev) => (prev === key ? null : key));
    };

    const standardsSections: MenuSection[] = useMemo(
        () => {
            const sections: MenuSection[] = [
                {
                    title: "기준정보",
                    items: [
                        { label: "재료 관리", path: "/stock/ingredients" },
                        { label: "메뉴 관리", path: "/sales/menu" },
                        { label: "거래처 관리", path: "/vendors" },
                    ],
                },
            ];

            if (defaultStoreRole === 'OWNER') {
                sections.push({
                    title: "직원·초대관리",
                    items: [
                        { label: "직원 관리", path: "/stores/members" },
                        { label: "초대 코드", path: "/stores/invitations" },
                    ],
                });
            }

            return sections;
        },
        [defaultStoreRole],
    );

    const ordersSections: MenuSection[] = useMemo(
        () => [
            {
                title: "주문",
                items: [
                    { label: "주문 현황", path: "/orders" },
                    { label: "매출 내역", path: "/sales/list" },
                    { label: "테이블 관리", path: "/orders/tables" },
                ],
            },
        ],
        [],
    );

    const inventorySections: MenuSection[] = useMemo(
        () => [
            {
                title: "재고",
                items: [
                    { label: "재고 현황", path: "/stock" },
                    { label: "실사 재고 관리", path: "/stock/stocktakes" },
                    { label: "폐기 관리", path: "/stock/disposal" },
                ],
            },
            {
                title: "발주",
                items: [
                    { label: "발주 목록", path: "/purchase-orders" },
                    { label: "발주 등록", path: "/purchase-orders/new" },
                ],
            },
            {
                title: "입고",
                items: [
                    { label: "입고 목록", path: "/stock/inbound" },
                    { label: "입고 등록", path: "/stock/inbound/new" },
                    { label: "증빙 보관함", path: "/stock/inbound/documents" },
                ],
            },
            {
                title: "이력",
                items: [
                    { label: "재고 이력", path: "/stock/log" },
                    { label: "재고 부족 현황", path: "/stock/shortages" },
                ],
            },
        ],
        [],
    );

    const analyticsSections: MenuSection[] = useMemo(
        () => [
            {
                title: "분석",
                items: [
                    { label: "매출 분석", path: "/analytics/sales" },
                    { label: "재고 분석", path: "/analytics/stock" },
                ],
            },
            {
                title: "리포트",
                items: [
                    { label: "운영 리포트", path: "/reports" },
                    { label: "리포트 발행", path: "/reports/generate" },
                ],
            },
        ],
        [],
    );

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (profileWrapRef.current?.contains(target)) return;

            const megaMenu = document.querySelector("[data-mega-menu]");
            if (megaMenu?.contains(target)) return;

            if (target.closest("[data-menu-toggle]")) return;

            setOpenMenu(null);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenMenu(null);
        };

        document.addEventListener("mousedown", onMouseDown);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    useEffect(() => {
        setOpenMenu(null);
    }, [location.pathname]);

    return (
        <nav
            ref={(el) => {
                rootRef.current = el;
            }}
            className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-slate-200 bg-white/98 backdrop-blur"
        >
            <div className="mx-auto max-w-7xl h-full px-6 flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={() => {
                        if (location.pathname.startsWith("/onboarding")) {
                            return;
                        }
                        handleProtectedNav("/dashboard");
                    }}
                    className="flex items-center shrink-0"
                >
                    <img
                        src="/images/logo.png"
                        alt="Inventory"
                        className="h-16 w-auto object-contain block"
                    />
                </button>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        data-menu-toggle
                        onClick={() => toggleMenu("standards")}
                        className={cn(topItemBase, openMenu === "standards" && topItemOpen)}
                        aria-expanded={openMenu === "standards"}
                        aria-haspopup="menu"
                    >
            <span className="inline-flex items-center gap-1">
              매장
              <IconChevronDown className="h-4 w-4" />
            </span>
                    </button>

                    <button
                        type="button"
                        data-menu-toggle
                        onClick={() => toggleMenu("orders")}
                        className={cn(topItemBase, openMenu === "orders" && topItemOpen)}
                        aria-expanded={openMenu === "orders"}
                        aria-haspopup="menu"
                    >
            <span className="inline-flex items-center gap-1">
              주문
              <IconChevronDown className="h-4 w-4" />
            </span>
                    </button>

                    <button
                        type="button"
                        data-menu-toggle
                        onClick={() => toggleMenu("inventory")}
                        className={cn(topItemBase, openMenu === "inventory" && topItemOpen)}
                        aria-expanded={openMenu === "inventory"}
                        aria-haspopup="menu"
                    >
            <span className="inline-flex items-center gap-1">
              재고
              <IconChevronDown className="h-4 w-4" />
            </span>
                    </button>

                    <button
                        type="button"
                        data-menu-toggle
                        onClick={() => toggleMenu("analytics")}
                        className={cn(topItemBase, openMenu === "analytics" && topItemOpen)}
                        aria-expanded={openMenu === "analytics"}
                        aria-haspopup="menu"
                    >
            <span className="inline-flex items-center gap-1">
              분석
              <IconChevronDown className="h-4 w-4" />
            </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleProtectedNav("/chat")}
                        className="text-sm font-extrabold px-3 py-2 rounded-md transition-colors text-slate-900 hover:bg-slate-100"
                    >
                        챗봇
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {isAuthed ? (
                        <NotificationBell unreadCount={unreadCount} />
                    ) : (
                        <button
                            type="button"
                            className="relative h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 grid place-items-center transition-colors"
                            onClick={() => navigate("/login")}
                            aria-label="알림"
                        >
                            <IconBell className="h-5 w-5" />
                        </button>
                    )}

                    {isAuthed ? (
                        <div ref={profileWrapRef} className="relative">
                            <button
                                type="button"
                                className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden text-slate-900 font-bold grid place-items-center"
                                onClick={toggleProfile}
                                aria-label="프로필"
                                aria-haspopup="menu"
                                aria-expanded={profileOpen}
                            >
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random&color=fff`}
                                        alt={user?.name}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </button>

                            {profileOpen && (
                                <ProfileDropdown
                                    name={user?.name || "사용자"}
                                    email={user?.email || "로딩 중..."}
                                    onStoreManage={() => {
                                        closeAll();
                                        handleProtectedNav("/stores/manage");
                                    }}
                                    onLogout={handleLogout}
                                />
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-95"
                        >
                            로그인
                        </button>
                    )}
                </div>
            </div>

            {openMenu === "standards" && (
                <MegaMenu sections={standardsSections} onNavigate={handleMenuNav} />
            )}

            {openMenu === "orders" && (
                <MegaMenu sections={ordersSections} onNavigate={handleMenuNav} />
            )}

            {openMenu === "inventory" && (
                <MegaMenu sections={inventorySections} onNavigate={handleMenuNav} />
            )}

            {openMenu === "analytics" && (
                <MegaMenu sections={analyticsSections} onNavigate={handleMenuNav} />
            )}
        </nav>
    );
}