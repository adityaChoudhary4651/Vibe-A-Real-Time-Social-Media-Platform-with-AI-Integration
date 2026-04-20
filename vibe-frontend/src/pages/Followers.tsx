import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getFollowers } from "@/api/posts";

type User = {
  username: string;
  name: string;
  avatar?: string;
};

export default function Followers() {
  const { token } = useAuth();
  const { username } = useParams();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!token || !username) return;
    getFollowers(token, username).then(setUsers);
  }, [token, username]);

  return (
    <div className="p-4 space-y-6">
      {/* HEADER */}
      <h2 className="text-lg font-semibold">Followers</h2>

      {/* LIST */}
      <div className="space-y-3">
        {users.map((user) => (
          <Link
            key={user.username}
            to={`/profile/${user.username}`}
            className="
              flex items-center justify-between
              p-3 rounded-xl
              border border-border
              bg-background
              hover:bg-muted/40
              transition
            "
          >
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <Avatar className="h-11 w-11">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </div>
            </div>

            {/* RIGHT (visual only) */}
            <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
              Follower
            </span>
          </Link>
        ))}

        {users.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            No followers yet
          </p>
        )}
      </div>
    </div>
  );
}
