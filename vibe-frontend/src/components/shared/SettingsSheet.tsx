import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User, Lock, Bell, Moon, HelpCircle, LogOut, LogIn, UserPlus, ChevronRight, Shield, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { id: "account", icon: User, label: "Account Settings" },
      { id: "privacy", icon: Lock, label: "Privacy" },
      { id: "security", icon: Shield, label: "Security" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "notifications", icon: Bell, label: "Notifications" },
      { id: "appearance", icon: Palette, label: "Appearance" },
      { id: "dark_mode", icon: Moon, label: "Dark Mode" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", icon: HelpCircle, label: "Help & Support" },
    ],
  },
];

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAction = (id: string) => {
    if (id === "dark_mode") {
      const isCurrentlyDark = document.documentElement.classList.contains("dark");
      if (isCurrentlyDark) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("vibe_dark_mode", "false");
        localStorage.setItem("vibe_theme", "light");
        toast.success("Light mode enabled ☀️");
      } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("vibe_dark_mode", "true");
        localStorage.setItem("vibe_theme", "dark");
        toast.success("Dark mode enabled 🌙");
      }
      window.dispatchEvent(new Event("themeChange"));
      return;
    }
    toast.success(`Opening ${id.replace("_", " ")}...`);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    onOpenChange(false);
  };

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/login");
  };

  const handleSignup = () => {
    onOpenChange(false);
    navigate("/signup");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription className="hidden">Manage your account settings and preferences.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {group.title}
              </p>
              <div className="bg-secondary/50 rounded-xl overflow-hidden">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAction(item.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary active:bg-secondary/80 transition-all duration-200 border-b border-border/50 last:border-0 touch-manipulation"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Auth Actions Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 pt-4 border-t border-border"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {isAuthenticated ? "Session" : "Account"}
            </p>
            
            {isAuthenticated ? (
              <Button
                variant="destructive"
                className="w-full h-12 transition-all duration-200 active:scale-[0.98]"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
                  onClick={handleLogin}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 transition-all duration-200 active:scale-[0.98]"
                  onClick={handleSignup}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </motion.div>

          <p className="text-xs text-center text-muted-foreground pt-4">
            Vibe v1.0.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
