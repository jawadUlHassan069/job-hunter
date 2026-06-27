// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing        from "./pages/Landing";
import AuthPage       from "./pages/Auth";
import CVAnalysisPage from "./pages/CVAnalysisPage";
import CVMaker        from "./pages/CVMaker";
import DashboardPage  from "./pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Protected */}
        <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/cv-analysis" element={<ProtectedRoute><CVAnalysisPage /></ProtectedRoute>} />
        <Route path="/cv-maker"    element={<ProtectedRoute><CVMaker /></ProtectedRoute>} />

        {/* Legacy / missing routes — redirect instead of 404 */}
        <Route path="/job-scraping" element={<Navigate to="/cv-analysis" replace />} />
        <Route path="/jobs"         element={<Navigate to="/cv-analysis" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
