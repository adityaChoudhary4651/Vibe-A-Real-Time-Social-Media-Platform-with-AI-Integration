import { useEffect, useState } from "react";
import { ActivitySidebar } from "@/components/shared/ActivitySidebar";

export default function ActivityPage() {
  const isDarkState = () => localStorage.getItem("vibe_theme") === "dark";
  const [isDark, setIsDark] = useState(isDarkState);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(isDarkState());
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  return (
    <div className="min-h-screen w-full py-6 px-4 md:px-8 max-w-lg mx-auto">
      <ActivitySidebar className="w-full" isMobilePage={true} />
    </div>
  );
}
