export default function Footer() {
    return (
        <footer className="w-full bg-slate-800 py-8">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Left: Brand */}
                    <div>
                        <img src="/images/logo.png" alt="Inventory" className="h-10" />
                        <div className="text-sm text-slate-400 mt-2">매출/재고 운영 자동화 플랫폼</div>
                    </div>

                    {/* Center: Links */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                        <a href="#" className="hover:text-white transition-colors">이용약관</a>
                        <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
                        <a href="#" className="hover:text-white transition-colors">고객센터</a>
                    </div>

                    {/* Right: Copyright */}
                    <div className="text-sm text-slate-500">
                        © 2026 Inventory. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
