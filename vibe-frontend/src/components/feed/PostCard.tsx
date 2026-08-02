import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CommentsSheet } from "@/components/shared/CommentsSheet";
import { ShareSheet } from "@/components/shared/ShareSheet";
import { TipModal } from "@/components/shared/TipModal";
import { PostOptionsSheet } from "@/components/shared/PostOptionsSheet";
import { toggleLike, deletePost, editPost, toggleSave } from "@/api/posts";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

/* ======================
   TYPES
====================== */
interface BackendPost {
  _id: string;

  /* MEDIA */
  mediaUrl?: string;
  mediaType?: "image" | "video";

  /* LEGACY (do NOT remove, keeps old posts safe) */
  imageUrl?: string;
  image?: string;

  caption?: string;
  createdAt?: string;

  author?: {
    _id?: string;
    username?: string;
    name?: string;
    avatar?: string;
  };

  user?: {
    username: string;
    avatar: string;
    verified: boolean;
  };

  likes?: number;
  comments?: number;
  timeAgo?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface PostCardProps {
  post: BackendPost;
}

export function PostCard({ post }: PostCardProps) {
  const { token, user: authUser } = useAuth();
  const queryClient = useQueryClient();

  /* ======================
     USER ADAPTER (✅ FIXED)
  ====================== */
  const postUser = {
    username:
      post.author?.username ||
      post.user?.username ||
      "unknown",

    avatar:
      post.author?.avatar ||
      post.user?.avatar ||
      "",
  };

 const image = post.mediaUrl || "";

  const timeAgo = post.timeAgo ?? "just now";

  /* ======================
     STATE
  ====================== */
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.comments ?? 0);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);

  const [showHeart, setShowHeart] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption ?? "");

  /* ======================
     HANDLERS
  ====================== */
  const handleLike = async () => {
    if (!token) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikes((p) => (nextLiked ? p + 1 : p - 1));

    try {
      const data = await toggleLike(token, post._id);
      setLikes(data.likesCount);
      setIsLiked(data.isLiked);
    } catch {
      setIsLiked(isLiked);
      setLikes((p) => (isLiked ? p + 1 : p - 1));
    }
  };

  const handleSave = async () => {
    if (!token) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      const data = await toggleSave(token, post._id);
      setIsSaved(data.isSaved);
    } catch {
      setIsSaved(isSaved);
    }
  };

  const handleDeletePost = async () => {
    if (!token) return;
    await deletePost(token, post._id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    setShowOptions(false);
  };

  const handleEditPost = () => {
    setEditedCaption(post.caption ?? "");
    setIsEditing(true);
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikes((p) => p + 1);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const isOwner =
    authUser?.username &&
    postUser.username &&
    authUser.username === postUser.username;

  return (
    <>
      <article className="border-b border-border w-full overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={postUser.avatar} />
              <AvatarFallback>
                {postUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <Link to={`/profile/${postUser.username}`}>
                <p className="font-semibold cursor-pointer hover:underline">
                  {postUser.username}
                </p>
              </Link>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowOptions(true)}
          >
            <MoreHorizontal />
          </Button>
        </div>

        {/* IMAGE */}
        <div
          className="relative aspect-square bg-muted"
          onDoubleClick={handleDoubleTap}
        >
          <img src={image} className="h-full w-full object-cover" />
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Heart className="h-24 w-24 fill-white text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACTIONS */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <button onClick={handleLike}>
                <Heart
                  className={cn(
                    "h-6 w-6",
                    isLiked && "fill-destructive text-destructive"
                  )}
                />
              </button>

              <button onClick={() => setShowComments(true)}>
                <MessageCircle className="h-6 w-6" />
              </button>

              <button onClick={() => setShowShare(true)}>
                <Send className="h-6 w-6" />
              </button>

              <button onClick={() => setShowTip(true)}>
                <DollarSign className="h-6 w-6 text-primary" />
              </button>
            </div>

            <button onClick={handleSave}>
              <Bookmark
                className={cn("h-6 w-6", isSaved && "fill-foreground")}
              />
            </button>
          </div>


          <p className="text-sm font-semibold">{likes} likes</p>

          {/* CAPTION */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm resize-none"
                rows={3}
                autoFocus
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!token) return;
                    await editPost(token, post._id, editedCaption);
                    queryClient.invalidateQueries({ queryKey: ["posts"] });
                    setIsEditing(false);
                  }}
                >
                  Save
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm">
              <span className="font-semibold">{postUser.username}</span>{" "}
              {post.caption}
            </p>
          )}

          {commentsCount > 0 && (
            <button
              className="text-sm text-muted-foreground"
              onClick={() => setShowComments(true)}
            >
              View all {commentsCount} comments
            </button>
          )}
        </div>
      </article>

      {/* SHEETS */}
      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        postId={post._id}
        onCommentAdded={setCommentsCount}
      />

      <ShareSheet open={showShare} onOpenChange={setShowShare} postId={post._id} />

      <TipModal
        open={showTip}
        onOpenChange={setShowTip}
        creatorName={postUser.username}
      />

      <PostOptionsSheet
        open={showOptions}
        onOpenChange={setShowOptions}
        isOwner={isOwner}
        onDelete={handleDeletePost}
        onEdit={handleEditPost}
      />
    </>
  );
}
