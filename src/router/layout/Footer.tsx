export default function Footer() {
    return (
        <footer className="w-full bg-[#F5F3F0] py-8">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Left: Brand */}
                    <div>
                        <img src="/images/dont_worry_logo.png" alt="Don't Worry" className="h-10" />
                        <div className="text-sm text-slate-500 mt-2">쉽게 기록하는 똑똑한 캘린더 가계부</div>
                    </div>

                    {/* Center: Links */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                        <a href="#" className="hover:text-slate-900 transition-colors">이용약관</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">개인정보처리방침</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">고객센터</a>
                    </div>

                    {/* Right: Copyright */}
                    <div className="text-sm text-slate-400">
                        © 2026 Don't Worry. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
