import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import HomeContainer from "../pages/home/HomeContainer";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomeContainer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
