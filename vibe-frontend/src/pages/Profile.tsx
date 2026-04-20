import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Settings, Grid3X3, Film, Camera, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

import { EditProfileModal } from "@/components/shared/EditProfileModal";
import { SettingsSheet } from "@/components/shared/SettingsSheet";
import {
  getMyPosts,
  getPublicProfile,
  getPostsByUsername,
  toggleFollow,
} from "@/api/posts";
import { updateProfile } from "@/api/profile";
import { createConversation } from "@/api/conversations";

/* =====================
   TYPES
===================== */
type ProfileUser = {
  username: string;
  name: string;
  bio: string;
  avatar?: string;
  followers: number;
  following: number;
  isFollowing?: boolean;
  _id?: string;
};

type ProfilePost = {
  _id: string;
  mediaUrl?: string;
  imageUrl?: string;
  type: "post";
};

/* =====================
   HELPERS
===================== */
const BASE_URL = "http://localhost:5000/";

const resolveUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith("http")
    ? url
    : `${BASE_URL}${url.replace(/\\/g, "/")}`;
};

/* =====================
   COMPONENT
===================== */
export default function Profile() {
  const { token, user: authUser } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();

  const isPublicProfile = Boolean(username);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* =====================
     FETCH PROFILE
  ===================== */
  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      try {
        if (isPublicProfile && username) {
          const profile = await getPublicProfile(token, username);
          const allPosts = await getPostsByUsername(token, username);

          setUser(profile);
          setPosts(allPosts.filter((p) => p.type === "post"));
        } else {
          const res = await fetch("http://localhost:5000/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const profile = await res.json();
          const myPosts = await getMyPosts(token);

          setUser(profile);
          setPosts(myPosts.filter((p) => p.type === "post"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token, username]);

  /* =====================
     FOLLOW / UNFOLLOW
  ===================== */
  const handleFollow = async () => {
    if (!token || !user) return;

    const res = await toggleFollow(token, user.username);
    setUser({
      ...user,
      followers: res.followers,
      isFollowing: res.isFollowing,
    });
  };

  /* =====================
     MESSAGE USER
  ===================== */
  const handleMessage = async () => {
  if (!user?._id) return;

  try {
    const conversation = await createConversation(user._id);
    navigate(`/messages?conversation=${conversation._id}`);
  } catch (err) {
    console.error(err);
  }
};


  /* =====================
     AVATAR UPLOAD
  ===================== */
  const handleAvatarChange = async (file: File) => {
    if (!token) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axios.put(
        "http://localhost:5000/api/users/me/avatar",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser((u) => (u ? { ...u, avatar: res.data.avatar } : u));
      toast.success("Profile photo updated");
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return <div className="p-6">Loading profile…</div>;
  if (!user) return <div className="p-6">Profile not found</div>;

  const isOwnProfile = authUser?.username === user.username;

  /* =====================
     UI
  ===================== */
  return (
    <div className="w-full pb-6">
      {isPublicProfile && (
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-6">
          <label className={cn("relative", isOwnProfile && "cursor-pointer")}>
            <Avatar className="h-20 w-20">
              <AvatarImage src={resolveUrl(user.avatar)} />
              <AvatarFallback>
                {user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {isOwnProfile && (
              <>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingAvatar}
                  onChange={(e) =>
                    e.target.files && handleAvatarChange(e.target.files[0])
                  }
                />
              </>
            )}
          </label>

          <div className="flex justify-around flex-1">
            <div className="text-center">
              <p className="font-bold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">posts</p>
            </div>

            <Link
              to={`/profile/${user.username}/followers`}
              className="text-center"
            >
              <p className="font-bold">{user.followers}</p>
              <p className="text-xs text-muted-foreground">followers</p>
            </Link>

            <Link
              to={`/profile/${user.username}/following`}
              className="text-center"
            >
              <p className="font-bold">{user.following}</p>
              <p className="text-xs text-muted-foreground">following</p>
            </Link>
          </div>
        </div>

        <div>
          <p className="font-semibold">{user.username}</p>
          {user.bio && (
            <p className="text-sm text-muted-foreground">{user.bio}</p>
          )}
        </div>

        <div className="flex gap-2">
          {isOwnProfile ? (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowEditProfile(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                className="flex-1"
                onClick={handleFollow}
                variant={user.isFollowing ? "secondary" : "default"}
              >
                {user.isFollowing ? "Unfollow" : "Follow"}
              </Button>

              <Button variant="secondary" onClick={handleMessage}>
                Message
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border flex">
        <button className="flex-1 py-3 border-b-2 border-primary flex justify-center">
          <Grid3X3 />
        </button>

        <button
          onClick={() => navigate(`/reels?user=${user.username}`)}
          className="flex-1 py-3 border-b-2 border-transparent flex justify-center"
        >
          <Film />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border">
        {posts.map((post) => (
          <Link key={post._id} to={`/post/${post._id}`}>
            <motion.img
              src={resolveUrl(post.mediaUrl || post.imageUrl)}
              className="aspect-square object-cover"
              whileHover={{ opacity: 0.85 }}
            />
          </Link>
        ))}
      </div>

      {isOwnProfile && (
        <EditProfileModal
          open={showEditProfile}
          onOpenChange={setShowEditProfile}
          currentUser={user}
          onSave={async (data) => {
            if (!token) return;
            const updated = await updateProfile(token, { bio: data.bio });
            setUser((u) => (u ? { ...u, bio: updated.bio } : u));
          }}
        />
      )}

      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
