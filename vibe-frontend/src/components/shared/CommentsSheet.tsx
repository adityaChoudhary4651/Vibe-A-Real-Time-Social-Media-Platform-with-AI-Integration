import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Heart, Send, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { API_BASE_URL } from "../../config";

/* ======================
   TYPES
====================== */
interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  author?: {
    username: string;
    avatar?: string;
  };
  likesCount: number;
  isLiked: boolean;
  canDelete: boolean;
}

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onCommentAdded?: (count: number) => void;
}

/* ======================
   COMPONENT
====================== */
export function CommentsSheet({
  open,
  onOpenChange,
  postId,
  onCommentAdded,
}: CommentsSheetProps) {
  const { token, user } = useAuth();
  const { socket } = useSocket();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [liking, setLiking] = useState<Set<string>>(new Set());
  const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 640);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const queryClient = useQueryClient();

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery<Comment[]>({
    queryKey: ["comments", postId, page],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/comments/${postId}?page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    },
    enabled: open && !!token && !!postId,
  });

  // Sync state values
  useEffect(() => {
    if (commentsData) {
      if (page === 1) {
        setComments(commentsData);
      } else {
        setComments((prev) => {
          const existingIds = new Set(prev.map(c => c._id));
          const newComments = commentsData.filter(c => !existingIds.has(c._id));
          return [...prev, ...newComments];
        });
      }
      setHasMore(commentsData.length === 15);
    }
  }, [commentsData, page]);

  useEffect(() => {
    setLoading(isCommentsLoading);
  }, [isCommentsLoading]);

  // Reset page when switching posts
  useEffect(() => {
    setPage(1);
  }, [postId]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ======================
     REAL-TIME UPDATES
     ====================== */
  useEffect(() => {
    if (!open || !socket || !postId) return;

    // Join the post room
    socket.emit("join_post", postId);

    // Listen for comment updates
    const handleCommentUpdate = (data: { type: string; postId: string; comment?: Comment; commentId?: string }) => {
      if (data.postId !== postId) return;

      if (data.type === "add" && data.comment) {
        setComments((prev) => {
          // Avoid duplicates
          if (prev.find(c => c._id === data.comment!._id)) return prev;
          return [data.comment!, ...prev];
        });
      } else if (data.type === "delete" && data.commentId) {
        setComments((prev) => prev.filter(c => c._id !== data.commentId));
      }
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["postDetail", postId] });
    };

    socket.on("comment_update", handleCommentUpdate);

    return () => {
      socket.off("comment_update", handleCommentUpdate);
      socket.emit("leave_post", postId);
    };
  }, [open, socket, postId]);

  useEffect(() => {
    if (onCommentAdded) {
      onCommentAdded(comments.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length]);

  /* ======================
     ADD COMMENT
     ====================== */
  const handleSendComment = async () => {
    if (!newComment.trim() || !token || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/comments/${postId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newComment }),
        }
      );

      const data = await res.json();
      setComments((prev) => {
        // Prevent duplicate addition if socket arrived first
        if (prev.find(c => c._id === data._id)) return prev;
        return [data, ...prev];
      });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["postDetail", postId] });
      onCommentAdded?.(data.commentsCount);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setIsSending(false);
    }
  };

  /* ======================
     DELETE COMMENT
  ====================== */
  const handleDeleteComment = async (commentId: string) => {
    if (!token || !commentId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["postDetail", postId] });
      onCommentAdded?.(data.commentsCount);
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  /* ======================
     LIKE COMMENT (SAFE)
  ====================== */
const handleLikeComment = async (commentId: string) => {
  if (!token || !commentId) return;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/comments/like/${commentId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Like failed");
      return;
    }

    const updatedComment = await res.json();

    setComments(prev =>
      prev.map(c =>
        c._id === updatedComment._id ? updatedComment : c
      )
    );
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });
  } catch (err) {
    console.error("Like error:", err);
  }
};




  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isDesktop ? "right" : "bottom"} 
        className={cn(
          "px-0 flex flex-col",
          isDesktop ? "w-[33vw] min-w-[320px] max-w-[400px] sm:max-w-none h-full border-l border-border" : "h-[70vh] rounded-t-3xl"
        )}
      >
        <SheetHeader className="px-4 pb-4 border-b border-border">
          <SheetTitle className="text-center">Comments</SheetTitle>
        </SheetHeader>

        {/* COMMENTS */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading && (
            <p className="text-center text-sm text-muted-foreground">
              Loading...
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              {/* Avatar */}
              <Avatar className="h-9 w-9">
                <AvatarImage src={comment.author?.avatar || ""} />
                <AvatarFallback>
                  {comment.author?.username?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {comment.author?.username ?? "user"}
                </p>
                <p className="text-sm">{comment.text}</p>
              </div>

              {/* Right actions */}
              <div className="relative flex items-start gap-2">
                {/* Like */}
                <button
                  onClick={() => handleLikeComment(comment._id)}
                  className="flex flex-col items-center"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      comment.isLiked
                        ? "fill-destructive text-destructive"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="text-xs">{comment.likesCount}</span>
                </button>

                {/* Three dots + Delete */}
                {comment.canDelete && (
                  <>
                    <button
                      onClick={() =>
                        setOpenMenuCommentId(
                          openMenuCommentId === comment._id
                            ? null
                            : comment._id
                        )
                      }
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openMenuCommentId === comment._id && (
                      <div className="absolute right-0 top-6 w-28 bg-background border border-border rounded-md shadow-md z-50">
                        <button
                          onClick={() => {
                            handleDeleteComment(comment._id);
                            setOpenMenuCommentId(null);
                          }}
                          className="w-full px-2 py-2 text-sm text-red-500 hover:bg-muted text-left"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {hasMore && comments.length > 0 && !loading && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-full text-center text-xs font-semibold py-2.5 text-muted-foreground hover:text-foreground border border-dashed rounded-lg border-border mt-2"
            >
              Load more comments
            </button>
          )}
        </div>

        {/* ADD COMMENT */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>

            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
              disabled={isSending}
            />

            <Button
              size="icon"
              variant="ghost"
              disabled={!newComment.trim() || isSending}
              onClick={handleSendComment}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
