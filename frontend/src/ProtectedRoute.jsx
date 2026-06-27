// src/ProtectedRoute.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();

  // Sync check — read token before any render
  const hasToken = (() => {
    try { return !!localStorage.getItem("access_token"); } catch { return false; }
  })();

  useEffect(() => {
    if (!hasToken) navigate("/login", { replace: true });
  }, [hasToken, navigate]);

  // No token → show nothing while redirect happens (no flash of page content)
  if (!hasToken) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg, #060816)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid rgba(29,158,117,0.15)",
          borderTopColor: "#1d9e75",
          animation: "pr-spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}
