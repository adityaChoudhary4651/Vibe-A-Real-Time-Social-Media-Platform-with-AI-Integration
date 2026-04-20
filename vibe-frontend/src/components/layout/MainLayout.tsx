import { Outlet, useLocation } from "react-router-dom";
import { DesktopSidebar, MobileBottomNav, MobileHeader } from "./Navigation";
import { SuggestedUsers } from "@/components/shared/SuggestedUsers";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type LayoutOutletContext = {
  setHideBottomNav: (hide: boolean) => void;
};

export function MainLayout() {
  const location = useLocation();
  const [hideBottomNav, setHideBottomNav] = useState(false);

  // Hide nav on reels (full-screen)
  const isReelsPage = location.pathname === "/reels";
  const isMessagesPage = location.pathname === "/messages";

  const outletContext = useMemo<LayoutOutletContext>(() => ({ setHideBottomNav }), []);

  return (
    <div className="min-h-screen bg-background w-full max-w-full">
      <div className="flex w-full">
        <DesktopSidebar />

        <main className="flex-1 min-h-screen w-full max-w-full lg:max-w-2xl xl:max-w-3xl">
          {/* Hide header on reels and messages for full-screen experience */}
          {!isReelsPage && !isMessagesPage && <MobileHeader />}
          <div className={isReelsPage ? "" : "pb-20 lg:pb-8"}>
            <Outlet context={outletContext} />
          </div>
        </main>

        {/* Right sidebar for larger screens */}
        <aside className="hidden xl:block w-80 h-screen sticky top-0 border-l border-border p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-4">
                Suggested for you
              </h3>
              <SuggestedUsers />
            </div>

            <div className="text-xs text-muted-foreground space-y-2">
              <p>About · Help · Press · API · Jobs · Privacy · Terms</p>
              <p>© 2024 Vibe from Lovable</p>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* Hide nav on reels page, and allow pages (like in-chat) to request nav hidden */}
      {!isReelsPage && !hideBottomNav && <MobileBottomNav />}
    </div>
  );
}
