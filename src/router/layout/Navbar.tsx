import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function IconBell({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function IconSearch({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function IconChevronDown({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

type MenuKey = "personal" | "shared" | "profile" | null;

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
                             onMyPage,
                             onLogout,
                         }: {
    name: string;
    email: string;
    onMyPage: () => void;
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
                    onClick={onMyPage}
                    className="w-full text-left rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    마이페이지
                </button>
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
        // nav 높이를 72px로 올렸으니 MegaMenu top도 동일하게 맞춤
        <div data-mega-menu className="fixed left-0 right-0 top-[72px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            {/* 너무 가득 차 보이지 않게 컨텐츠는 중앙/적당한 폭으로 제한 */}
            <div className="mx-auto max-w-5xl px-6 py-6">
                <div className="flex justify-center">
                    {/* 한 줄 유지: grid-flow-col + auto-cols-max */}
                    <div className="grid grid-flow-col auto-cols-max gap-x-16">
                        {sections.map((sec) => (
                            <div key={sec.title} className="min-w-[120px]">
                                {/* 큰 카테고리(굵게/조금 크게) */}
                                <div className="text-[14px] font-extrabold text-slate-400">{sec.title}</div>

                                {/* 하위 메뉴(작게) */}
                                <ul className="mt-3 space-y-2">
                                    {sec.items.map((it) => (
                                        <li key={it.label}>
                                            <button
                                                type="button"
                                                onClick={() => onNavigate(it.path)}
                                                className={cn(
                                                    "text-[13px] font-semibold text-slate-900",
                                                    "rounded-md px-2 py-1 -ml-2",
                                                    "hover:bg-slate-100 transition-colors"
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

    const isAuthed = true; // TODO: 인증 상태로 교체

    // TODO: 실제 유저 정보로 교체
    const user = {
        name: "김소명",
        email: "thaud9696@naver.com",
        avatarUrl: "/images/profile.jpg", // 또는 서버에서 내려주는 URL
    };

    const [openMenu, setOpenMenu] = useState<MenuKey>(null);

    const profileOpen = openMenu === "profile";

    const toggleProfile = () => {
        setOpenMenu((prev) => (prev === "profile" ? null : "profile"));
    };

    const closeAll = () => {
        setOpenMenu(null);
    };

    const handleLogout = () => {
        closeAll();
        window.alert("로그아웃 연결 예정");
    };

    const topItemBase =
        "text-sm font-semibold px-3 py-2 rounded-md transition-colors text-slate-700 hover:text-slate-900 hover:bg-slate-100";
    const topItemOpen = "bg-slate-100 text-slate-900";

    const handleProtectedNav = (path: string) => {
        if (!isAuthed) {
            navigate(`/login?redirect=${encodeURIComponent(path)}`);
            return;
        }
        navigate(path);
    };

    const handleMenuNav = (path: string) => {
        setOpenMenu(null);
        handleProtectedNav(path);
    };

    const toggleMenu = (key: Exclude<MenuKey, null>) => {
        setOpenMenu((prev) => (prev === key ? null : key));
    };

    const personalSections: MenuSection[] = useMemo(
        () => [
            { title: "기록", items: [{ label: "캘린더", path: "/ledger" }] },
            {
                title: "관리",
                items: [
                    { label: "예산", path: "/ledger/budget" },
                    { label: "고정비", path: "/ledger/fixed" },
                    { label: "목표", path: "/ledger/goals" },
                ],
            },
            { title: "분석", items: [{ label: "리포트", path: "/ledger/report" }] },
        ],
        []
    );

    const sharedSections: MenuSection[] = useMemo(
        () => [
            { title: "기록", items: [{ label: "캘린더", path: "/shared" }] },
            {
                title: "팀",
                items: [
                    { label: "팀 관리", path: "/shared/team" },
                    { label: "정산", path: "/shared/settlement" }, // 팀 아래로 이동
                ],
            },
            {
                title: "관리",
                items: [
                    { label: "예산", path: "/shared/budget" },
                    { label: "고정비", path: "/shared/fixed" },
                    { label: "목표", path: "/shared/goals" },
                ],
            },
            { title: "분석", items: [{ label: "리포트", path: "/shared/report" }] },
        ],
        []
    );

    // 바깥 클릭 / ESC로 닫기
    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // 프로필 드롭다운 내부 클릭은 무시
            if (profileWrapRef.current?.contains(target)) return;

            // 메가메뉴 내부 클릭은 무시
            const megaMenu = document.querySelector("[data-mega-menu]");
            if (megaMenu?.contains(target)) return;

            // 토글 버튼 클릭은 무시 (버튼이 자체 처리)
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

    // 라우트가 바뀌면 메뉴 닫기
    useEffect(() => {
        setOpenMenu(null);
    }, [location.pathname]);

    return (
        <nav
            ref={(el) => {
                rootRef.current = el;
            }}
            // h-16 -> h-[72px] 로 세로 높이만 약간 확장
            className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-slate-200 bg-white/98 backdrop-blur"
        >
            <div className="mx-auto max-w-7xl h-full px-6 flex items-center justify-between gap-4">
                {/* Left: Brand */}
                <button
                    type="button"
                    onClick={() => handleProtectedNav("/ledger")}
                    className="flex items-center shrink-0"
                >
                    <img
                        src="/images/dont_worry_logo.png"
                        alt="Don't Worry"
                        // nav 높이 확장에 맞춰 로고도 살짝 키움
                        className="h-16 w-auto object-contain block"
                    />
                </button>

                {/* Center: Nav (활성 색상 제거: hover만 회색) */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        data-menu-toggle
                        onClick={() => toggleMenu("personal")}
                        className={cn(topItemBase, openMenu === "personal" && topItemOpen)}
                        aria-expanded={openMenu === "personal"}
                        aria-haspopup="menu"
                    >
                        <span className="inline-flex items-center gap-1">
                            가계부
                            <IconChevronDown className="h-4 w-4" />
                        </span>
                    </button>

                    <button
                        type="button"
                        data-menu-toggle
                        onClick={() => toggleMenu("shared")}
                        className={cn(topItemBase, openMenu === "shared" && topItemOpen)}
                        aria-expanded={openMenu === "shared"}
                        aria-haspopup="menu"
                    >
                        <span className="inline-flex items-center gap-1">
                            공유가계부
                            <IconChevronDown className="h-4 w-4" />
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleProtectedNav("/challenge")}
                        className={topItemBase}
                    >
                        챌린지
                    </button>

                    <button
                        type="button"
                        onClick={() => (isAuthed ? window.alert("AI 월렛봇 연결 예정") : navigate("/login"))}
                        className="text-sm font-extrabold px-3 py-2 rounded-md transition-colors text-slate-900 hover:bg-slate-100"
                    >
                        AI 월렛봇
                    </button>
                </div>

                {/* Right: Utilities */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 w-[320px]">
                        <IconSearch className="h-4 w-4 text-slate-400" />
                        <input
                            className="w-full outline-none text-sm text-slate-700 placeholder:text-slate-400"
                            placeholder="검색"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isAuthed) {
                                    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
                                }
                            }}
                        />
                    </div>

                    {/* Bell */}
                    <button
                        type="button"
                        className="relative h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 grid place-items-center transition-colors"
                        onClick={() => (isAuthed ? window.alert("알림 패널 연결 예정") : navigate("/login"))}
                        aria-label="알림"
                    >
                        <IconBell className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
                    </button>

                    {/* Profile */}
                    <div ref={profileWrapRef} className="relative">
                        <button
                            type="button"
                            className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 text-slate-900 font-bold grid place-items-center"
                            onClick={toggleProfile}
                            aria-label="프로필"
                            aria-haspopup="menu"
                            aria-expanded={profileOpen}
                        >
                            <span className="text-sm">S</span>
                        </button>

                        {profileOpen && (
                            <ProfileDropdown
                                name={user.name}
                                email={user.email}
                                onMyPage={() => {
                                    closeAll();
                                    handleProtectedNav("/me");
                                }}
                                onLogout={handleLogout}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Mega Menus (세로로 길어지지 않게: 내용만큼만, 가로 한 줄 유지) */}
            {openMenu === "personal" && <MegaMenu sections={personalSections} onNavigate={handleMenuNav} />}

            {openMenu === "shared" && <MegaMenu sections={sharedSections} onNavigate={handleMenuNav} />}
        </nav>
    );
}
