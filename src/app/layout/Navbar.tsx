import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="h-14 border-b flex items-center px-6 justify-between">
      <div className="font-bold text-lg">
        <Link to="/">LOGO</Link>
      </div>

      <div>
        <Link to="/" className="text-sm font-medium">
          홈
        </Link>
      </div>

      <div>
        <button
          type="button"
          className="text-sm text-gray-600 cursor-default"
        >
          로그인
        </button>
      </div>
    </nav>
  );
}
