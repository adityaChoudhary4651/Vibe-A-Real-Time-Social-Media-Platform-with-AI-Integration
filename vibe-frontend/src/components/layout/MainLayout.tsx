import { Outlet, useLocation } from "react-router-dom";
import { DesktopSidebar, MobileBottomNav, MobileHeader } from "./Navigation";
import { SocketNotificationListener } from "@/components/shared/SocketNotificationListener";
import { useMemo, useState, useEffect } from "react";

type LayoutOutletContext = {
  setHideBottomNav: (hide: boolean) => void;
};

export function MainLayout() {
  const location = useLocation();
  const [hideBottomNav, setHideBottomNav] = useState(false);

  // Hide nav on reels (full-screen)
  const isReelsPage = location.pathname === "/reels";
  const isMessagesPage = location.pathname === "/messages";
  const isConversationsPage = location.pathname === "/conversations";
  const isCreatePage = location.pathname === "/create";
  const isCommunitiesPage = location.pathname === "/communities";
  const isNotificationsPage = location.pathname === "/notifications";
  const isVibeAIPage = location.pathname === "/vibe-ai";

  const isCustomStaticPage = isCreatePage || isMessagesPage || isCommunitiesPage || isNotificationsPage || isVibeAIPage;

  const outletContext = useMemo<LayoutOutletContext>(() => ({ setHideBottomNav }), []);

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
    <div className={`min-h-screen w-full max-w-full transition-colors duration-300 ${
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F5F0E8] text-[#4A3428]"
    } ${isCustomStaticPage || isConversationsPage ? "h-screen overflow-hidden" : ""}`}>
      <SocketNotificationListener />
      <div className="flex w-full h-full">
        <DesktopSidebar />

        <main className={`flex-1 w-full max-w-full ${
          isConversationsPage || isCustomStaticPage ? "h-screen overflow-hidden flex flex-col" : "min-h-screen"
        }`}>
          {/* Hide header on reels, messages, and discover (full-screen) */}
          {!isReelsPage && !isMessagesPage && !isConversationsPage && !isCustomStaticPage && <MobileHeader />}
          <div className={isReelsPage || isConversationsPage || isCustomStaticPage ? "h-full flex-1 min-h-0" : "pb-20 lg:pb-8"}>
            <Outlet context={outletContext} />
          </div>
        </main>

      </div>

      {/* Hide nav on reels page, and allow pages (like in-chat) to request nav hidden */}
      {!isReelsPage && !hideBottomNav && <MobileBottomNav />}
    </div>
  );
}
