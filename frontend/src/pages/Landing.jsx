// src/pages/Landing.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar      from "../components/Landing/Navbar";
import Hero        from "../components/Landing/Hero";
import BentoGrid   from "../components/Landing/BentoGrid";
import Carousel    from "../components/Landing/Carousel";
import TeamSection from "../components/Landing/TeamSection";
import Footer      from "../components/Landing/Footer";

export default function Landing() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, [navigate]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleFeatureClick = (feature) => {
    switch (feature) {
      case "cv-analysis":
      case "analyze":
        navigate("/cv-analysis");
        break;
      case "cv-maker":
        navigate("/cv-maker");
        break;
      case "dashboard":
        navigate("/dashboard");
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="landing-shell"
      style={{ minHeight:"100vh", overflowX:"hidden" }}
    >
      <Navbar
        theme={theme}
        setTheme={toggleTheme}
        onAnalyze={() => navigate("/cv-analysis")}
        isAnalyzePage={false}
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <Hero onFeatureClick={handleFeatureClick} />

      <BentoGrid onFeatureClick={handleFeatureClick} />

      <Carousel />

      <TeamSection />

      <Footer onFeatureClick={handleFeatureClick} onAnalyze={() => navigate("/cv-analysis")} />
    </div>
  );
}
