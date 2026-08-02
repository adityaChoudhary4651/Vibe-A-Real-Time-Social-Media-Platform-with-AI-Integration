import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFollowers } from "@/api/posts";
import { cn } from "@/lib/utils";

type User = {
  username: string;
  name: string;
  avatar?: string;
};

export default function Followers() {
  const { token } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);

  // Theme State
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const { data: followersData = [] } = useQuery<User[]>({
    queryKey: ["followersList", username],
    queryFn: () => getFollowers(token!, username!),
    enabled: !!token && !!username,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (followersData) {
      setUsers(followersData);
    }
  }, [followersData]);

  // Dynamic Theme Colors
  const themeCard = isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]";
  const themeBorder = isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]";
  const themeTextPrimary = isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]";
  const themeTextSecondary = isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]";

  return (
    <div className={cn(
      "w-full min-h-screen p-3 md:p-4.5 lg:p-5 transition-colors duration-300 flex flex-col justify-start items-center select-none",
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F8F4EE] text-[#5A3A22]"
    )}>
      <div className="w-full max-w-[620px] flex flex-col mt-2 md:mt-4">
        
        {/* Navigation Back Header */}
        <button
          onClick={() => navigate(-1)}
          className={cn(
            "flex items-center gap-2 text-xs font-bold active:scale-95 transition-all self-start mb-4 border-none bg-transparent cursor-pointer",
            themeTextSecondary
          )}
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.2]" />
          Back to Profile
        </button>

        {/* Grand Card Wrapper */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-6 flex flex-col transition-colors duration-300",
          themeCard, themeBorder
        )}>
          {/* Header section */}
          <div className="flex items-center gap-3 border-b pb-4 mb-5 border-[#8B5E3C]/10 dark:border-[#3D2A1F]">
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
            )}>
              <Users className={cn("h-5 w-5 stroke-[2.2]", themeTextSecondary)} />
            </div>
            <div className="text-left">
              <h2 className={cn("text-base font-extrabold font-serif leading-tight", themeTextPrimary)}>
                Followers
              </h2>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider leading-none mt-0.5", themeTextSecondary)}>
                @{username}’s followers ({users.length})
              </p>
            </div>
          </div>

          {/* List items scrollable container */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-none">
            {users.map((u) => (
              <Link
                key={u.username}
                to={`/profile/${u.username}`}
                className={cn(
                  "flex items-center justify-between p-3 rounded-[20px] border transition-all duration-200 cursor-pointer active:scale-[0.99]",
                  isDark
                    ? "border-[#3D2A1F]/50 bg-[#1F140E]/40 hover:bg-[#3D2A1F]/30"
                    : "border-[#E3D8C8]/60 bg-[#F8F4EE]/40 hover:bg-[#8B5E3C]/5"
                )}
              >
                {/* User avatar & info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 border border-[#8B5E3C]/10 flex-shrink-0">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="text-sm font-bold uppercase">
                      {u.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-left min-w-0">
                    <p className={cn("text-xs font-extrabold truncate leading-tight", themeTextPrimary)}>
                      {u.name}
                    </p>
                    <p className={cn("text-[9px] font-bold leading-none mt-0.5 truncate", themeTextSecondary)}>
                      @{u.username}
                    </p>
                  </div>
                </div>

                {/* Pill Status */}
                <span className={cn(
                  "text-[9px] font-bold py-1 px-3.5 rounded-full border leading-none uppercase tracking-wide",
                  isDark
                    ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#D2C5B4]"
                    : "bg-[#FFFDF9] border-[#8B5E3C]/15 text-[#8B5E3C]"
                )}>
                  Follower
                </span>
              </Link>
            ))}

            {users.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <UserPlus className={cn("h-8 w-8 opacity-30 mb-2 stroke-[2]", themeTextSecondary)} />
                <p className={cn("text-xs font-semibold italic", themeTextSecondary)}>
                  No followers yet
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
