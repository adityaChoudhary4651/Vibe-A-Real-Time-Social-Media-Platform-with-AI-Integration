import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Settings, Grid3X3, Film, Camera, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, resolveUrl } from "../config";
import axios from "axios";
import { toast } from "sonner";

import { EditProfileModal } from "@/components/shared/EditProfileModal";
import { SettingsSheet } from "@/components/shared/SettingsSheet";
import { StoryViewer } from "@/components/shared/StoryViewer";
import { CreateHighlightSheet } from "@/components/shared/CreateHighlightSheet";
import {
  getMyPosts,
  getPublicProfile,
  getPostsByUsername,
  toggleFollow,
} from "@/api/posts";
import { updateProfile } from "@/api/profile";
import { createConversation } from "@/api/conversations";
import { fetchHighlights, deleteHighlight } from "@/api/highlights";

/* =====================
   TYPES
 ===================== */
type ProfileUser = {
  username: string;
  name: string;
  bio: string;
  avatar?: string;
  gender?: string;
  age?: number;
  location?: string;
  interests?: string[];
  tipsReceived: number;
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
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [activeViewerStories, setActiveViewerStories] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* =====================
     FETCH PROFILE
  ===================== */
  const loadProfile = async () => {
    if (!token) return;

    try {
      let profileData: ProfileUser;
      let postData: ProfilePost[];

      if (isPublicProfile && username) {
        profileData = await getPublicProfile(token, username);
        const allPosts = await getPostsByUsername(token, username);
        postData = allPosts.filter((p) => p.type === "post");
      } else {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        profileData = await res.json();
        const myPosts = await getMyPosts(token);
        postData = myPosts.filter((p) => p.type === "post");
      }

      setUser(profileData);
      setPosts(postData);

      // Fetch highlights
      const h = await fetchHighlights(profileData.username);
      setHighlights(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        `${API_BASE_URL}/api/users/me/avatar`,
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

  /* =====================
     HIGHLIGHT DELETION
  ===================== */
  const handleDeleteHighlight = async (id: string) => {
    try {
      await deleteHighlight(id);
      toast.success("Highlight deleted");
      setHighlights((prev) => prev.filter((h) => h._id !== id));
    } catch {
      toast.error("Failed to delete highlight");
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
            className="flex items-center gap-2 text-muted-foreground text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* AVATAR & STATS */}
        <div className="flex items-center gap-6">
          <label className={cn("relative flex-shrink-0", isOwnProfile && "cursor-pointer")}>
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
              <p className="font-bold text-sm sm:text-base">{posts.length}</p>
              <p className="text-[10px] text-muted-foreground">posts</p>
            </div>

            <Link
              to={`/profile/${user.username}/followers`}
              className="text-center"
            >
              <p className="font-bold text-sm sm:text-base">{user.followers}</p>
              <p className="text-[10px] text-muted-foreground">followers</p>
            </Link>

            <Link
              to={`/profile/${user.username}/following`}
              className="text-center"
            >
              <p className="font-bold text-sm sm:text-base">{user.following}</p>
              <p className="text-[10px] text-muted-foreground">following</p>
            </Link>
          </div>
        </div>

        {/* DEMOGRAPHICS & BIO */}
        <div className="space-y-1.5">
          <p className="font-semibold text-base">{user.name || user.username}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>Age: {user.age || 21}</span>
            <span>•</span>
            <span>Loc: {user.location || "Nearby"}</span>
            {user.gender && (
              <>
                <span>•</span>
                <span>{user.gender}</span>
              </>
            )}
            {user.tipsReceived > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-500 font-bold">Tips: ${user.tipsReceived.toFixed(2)}</span>
              </>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-foreground/85">{user.bio}</p>
          )}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {user.interests.map((tag) => (
                <span key={tag} className="text-[9px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* FOLLOW / EDIT ACTIONS */}
        <div className="flex gap-2">
          {isOwnProfile ? (
            <>
              <Button
                variant="secondary"
                className="flex-1 rounded-xl"
                onClick={() => setShowEditProfile(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-xl"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleFollow}
                variant={user.isFollowing ? "secondary" : "default"}
              >
                {user.isFollowing ? "Unfollow" : "Follow"}
              </Button>

              <Button variant="secondary" className="rounded-xl" onClick={handleMessage}>
                Message
              </Button>
            </>
          )}
        </div>

        {/* HIGHLIGHTS CAROUSEL */}
        <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide border-t border-b border-border/40">
          {isOwnProfile && (
            <button
              onClick={() => setShowCreateHighlight(true)}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className="h-12 w-12 rounded-full border border-dashed border-muted-foreground/60 flex items-center justify-center bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <span className="text-lg text-muted-foreground font-bold">+</span>
              </div>
              <span className="text-[9px] mt-1 text-muted-foreground">New</span>
            </button>
          )}

          {highlights.map((h) => (
            <div key={h._id} className="flex flex-col items-center flex-shrink-0 relative group">
              <button
                onClick={() => {
                  setActiveViewerStories(h.stories);
                  setShowViewer(true);
                }}
                className="h-12 w-12 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center"
              >
                <img
                  src={h.stories[0]?.mediaUrl || "/avatar.png"}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
              <span className="text-[9px] mt-1 text-foreground truncate w-12 text-center font-medium">
                {h.name}
              </span>
              {isOwnProfile && (
                <button
                  onClick={() => handleDeleteHighlight(h._id)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-3.5 w-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <span className="text-[8px] font-bold">×</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* POST TABS */}
      <div className="border-t border-border flex">
        <button className="flex-1 py-3 border-b-2 border-primary flex justify-center">
          <Grid3X3 />
        </button>

        <button
          onClick={() => navigate(`/reels?user=${user.username}`)}
          className="flex-1 py-3 border-b-2 border-transparent flex justify-center text-muted-foreground hover:text-foreground transition-colors"
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
            const updated = await updateProfile(token, data);
            setUser((u) => (u ? { ...u, ...updated } : u));
          }}
        />
      )}

      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />

      <CreateHighlightSheet
        open={showCreateHighlight}
        onOpenChange={setShowCreateHighlight}
        onHighlightCreated={loadProfile}
      />

      {showViewer && activeViewerStories.length > 0 && (
        <StoryViewer
          stories={activeViewerStories}
          canDelete={false}
          onClose={() => {
            setShowViewer(false);
            setActiveViewerStories([]);
          }}
        />
      )}
    </div>
  );
}
