import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <main className="mx-auto max-w-7xl w-full px-6 pt-28 pb-10 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
