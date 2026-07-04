import { Outlet, useLocation } from "react-router-dom";
import { DesktopSidebar, MobileBottomNav, MobileHeader } from "./Navigation";
import { SuggestedUsers } from "@/components/shared/SuggestedUsers";
import { SocketNotificationListener } from "@/components/shared/SocketNotificationListener";
import { motion } from "framer-motion";
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
  const isDiscoverPage = location.pathname === "/discover";
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
      isCustomStaticPage 
        ? (isDark ? "bg-[#1F140E] text-[#F5F0E8] h-screen overflow-hidden" : "bg-[#F5F0E8] text-[#4A3428] h-screen overflow-hidden") 
        : "bg-background"
    }`}>
      <SocketNotificationListener />
      <div className="flex w-full h-full">
        <DesktopSidebar />

        <main className={`flex-1 w-full max-w-full ${
          isDiscoverPage || isCustomStaticPage ? "h-screen overflow-hidden flex flex-col" : "min-h-screen"
        }`}>
          {/* Hide header on reels, messages, and discover (full-screen) */}
          {!isReelsPage && !isMessagesPage && !isDiscoverPage && !isCustomStaticPage && <MobileHeader />}
          <div className={isReelsPage || isDiscoverPage || isCustomStaticPage ? "h-full flex-1 min-h-0" : "pb-20 lg:pb-8"}>
            <Outlet context={outletContext} />
          </div>
        </main>

        {/* Right sidebar for larger screens */}
        {location.pathname !== "/search" && location.pathname !== "/discover" && location.pathname !== "/create" && location.pathname !== "/messages" && location.pathname !== "/communities" && location.pathname !== "/notifications" && location.pathname !== "/vibe-ai" && !location.pathname.startsWith("/profile") && (
          <aside className="hidden xl:block w-80 h-screen sticky top-0 border-l border-border p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Footer info links */}

              <div className="text-xs text-muted-foreground space-y-2">
                <p>About · Help · Press · API · Jobs · Privacy · Terms</p>
                <p>© 2026 Vibe Social Platform</p>
              </div>
            </motion.div>
          </aside>
        )}
      </div>

      {/* Hide nav on reels page, and allow pages (like in-chat) to request nav hidden */}
      {!isReelsPage && !hideBottomNav && <MobileBottomNav />}
    </div>
  );
}
