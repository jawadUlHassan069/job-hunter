// src/pages/Landing.jsx
import { useState, useEffect } from "react";
import Navbar      from "../components/Landing/Navbar";
import Hero        from "../components/Landing/Hero";
import BentoGrid   from "../components/Landing/BentoGrid";
import Carousel    from "../components/Landing/Carousel";
import TeamSection from "../components/Landing/TeamSection";
import Footer      from "../components/Landing/Footer";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
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
      case "job-scraping":
      case "jobs":
        navigate("/job-scraping");
        break;
      case "dashboard":
        navigate("/dashboard");
        break;
      default:
        console.log("Feature:", feature);
    }
  };

  const onAnalyze = () => navigate("/cv-analysis");

  return (
    <div className="app-shell min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar
        theme={theme}
        setTheme={toggleTheme}
        onAnalyze={onAnalyze}
        isAnalyzePage={false}
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <Hero onFeatureClick={handleFeatureClick} onAnalyze={onAnalyze} />

      <BentoGrid onFeatureClick={handleFeatureClick} />

      <Carousel />

      <TeamSection />

      <Footer onAnalyze={onAnalyze} />
    </div>
  );
}