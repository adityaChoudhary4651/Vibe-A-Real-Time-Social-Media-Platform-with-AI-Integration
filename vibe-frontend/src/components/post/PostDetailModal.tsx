import { X, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toggleLike } from "@/api/posts";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { CommentsSheet } from "@/components/shared/CommentsSheet";

type Author = {
  username?: string;
  avatar?: string;
};

type CommentPreview = {
  _id: string;
  text: string;
  user: {
    username: string;
  };
};

type PostDetailModalProps = {
  open: boolean;
  onClose: () => void;
  post: {
    _id: string;
    imageUrl: string;
    caption?: string;
    likes: number;
    isLiked?: boolean;
    author?: Author;
    commentsPreview?: CommentPreview[];
  };
};

export default function PostDetailModal({
  open,
  onClose,
  post,
}: PostDetailModalProps) {
  const { token } = useAuth();
  const { socket } = useSocket();

  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [showComments, setShowComments] = useState(false);

  /* ======================
     REAL-TIME UPDATES
  ====================== */
  useEffect(() => {
    if (!open || !socket || !post?._id) return;

    // Join the post room
    socket.emit("join_post", post._id);

    // Listen for like updates
    const handleLikeUpdate = (data: { postId: string; likesCount: number }) => {
      if (data.postId === post._id) {
        setLikes(data.likesCount);
      }
    };

    socket.on("like_update", handleLikeUpdate);

    return () => {
      socket.off("like_update", handleLikeUpdate);
      socket.emit("leave_post", post._id);
    };
  }, [open, socket, post?._id]);

  if (!open) return null;

  const username = post.author?.username;
  const avatar = post.author?.avatar ?? "";

  const handleLike = async () => {
    if (!token) return;

    const next = !isLiked;
    setIsLiked(next);
    setLikes((p) => (next ? p + 1 : p - 1));

    try {
      const res = await toggleLike(token, post._id);
      setLikes(res.likesCount);
      setIsLiked(res.isLiked);
    } catch {
      setIsLiked(!next);
      setLikes((p) => (next ? p - 1 : p + 1));
    }
  };

  return (
    <>
      {/* BACKDROP */}
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-2">
        {/* CARD */}
        <div
          className="
            bg-background
            w-full h-full
            md:h-[90vh] md:max-w-5xl
            rounded-none md:rounded-2xl
            overflow-hidden
            border border-border/80
            shadow-2xl
            flex flex-col md:flex-row
          "
        >
          {/* IMAGE */}
          <div className="bg-black flex items-center justify-center md:flex-1">
            <img
              src={post.imageUrl}
              alt="post"
              className="w-full max-h-[55vh] md:max-h-full object-contain"
            />
          </div>

          {/* DETAILS */}
          <div className="flex flex-col md:w-[420px] h-full border-t md:border-t-0 md:border-l border-border">
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b">
              {/* ONLY SHOW USER UI IF USERNAME EXISTS & IS NOT "unknown" */}
              {username && username !== "unknown" ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{username}</span>
                </div>
              ) : (
                <div />
              )}

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-4 px-4 py-3 border-b">
              <button onClick={handleLike}>
                <Heart
                  className={`h-6 w-6 transition ${
                    isLiked ? "fill-red-500 text-red-500" : "text-foreground"
                  }`}
                />
              </button>

              <button onClick={() => setShowComments(true)}>
                <MessageCircle className="h-6 w-6 text-foreground" />
              </button>

              <span className="text-sm font-semibold ml-auto">
                {likes} likes
              </span>
            </div>

            {/* CAPTION */}
            {post.caption && (
              <div className="px-4 py-3 text-sm border-b leading-relaxed">
                {username && username !== "unknown" && (
                  <span className="font-semibold mr-2">{username}</span>
                )}
                <span className="text-muted-foreground">
                  {post.caption}
                </span>
              </div>
            )}

            {/* COMMENTS PREVIEW */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm">
              {post.commentsPreview && post.commentsPreview.length > 0 ? (
                post.commentsPreview.map((c) => (
                  <div key={c._id}>
                    <span className="font-semibold mr-2">
                      {c.user.username}
                    </span>
                    {c.text}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic">
                  No comments yet.
                </p>
              )}
            </div>

            {/* ADD COMMENT CTA */}
            <button
              onClick={() => setShowComments(true)}
              className="
                border-t
                px-4 py-3
                text-sm
                text-muted-foreground
                text-left
                hover:bg-muted/40
              "
            >
              Add a comment…
            </button>
          </div>
        </div>
      </div>

      {/* FULL COMMENTS */}
      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        postId={post._id}
      />
    </>
  );
}
