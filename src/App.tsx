import "./App.css";

import { Route, Routes } from "react-router-dom";

import Diary from "./pages/Diary";
import FoodDetails from "./pages/FoodDetails";
import Header from "./components/Header";
import Home from "./pages/Home";
import InstallPrompt from "./components/InstallPrompt";
import ScanFood from "./pages/ScanFood";

function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<ScanFood />} />
          <Route path="/food/:id" element={<FoodDetails />} />
          <Route path="/diary" element={<Diary />} />
          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <InstallPrompt />
    </div>
  );
}

export default App;
