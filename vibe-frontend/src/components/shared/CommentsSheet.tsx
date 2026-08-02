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
  postId?: string;
  storyId?: string;
  onCommentAdded?: (count: number) => void;
}

interface RepliesSectionProps {
  parentCommentId: string;
  token: string;
  onReplyTo: (comment: Comment) => void;
  onDeleteComment: (commentId: string) => void;
  onLikeComment: (commentId: string) => void;
  isDesktop: boolean;
}

function RepliesSection({
  parentCommentId,
  token,
  onReplyTo,
  onDeleteComment,
  onLikeComment,
  isDesktop,
}: RepliesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/replies/${parentCommentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReplies(data);
    } catch (err) {
      console.error("Failed to fetch replies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      fetchReplies();
    }
  }, [expanded, parentCommentId]);

  useEffect(() => {
    if (!socket || !expanded) return;

    const handleReplyUpdate = (data: { type: string; parentCommentId: string; comment: Comment }) => {
      if (data.parentCommentId !== parentCommentId) return;

      if (data.type === "add" && data.comment) {
        setReplies((prev) => {
          if (prev.find(r => r._id === data.comment._id)) return prev;
          return [...prev, data.comment];
        });
      }
    };

    socket.on("reply_update", handleReplyUpdate);
    return () => {
      socket.off("reply_update", handleReplyUpdate);
    };
  }, [socket, expanded, parentCommentId]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="ml-10 mt-2 pl-3 border-l-2 border-[#8B5E3C]/20 dark:border-[#3D2A1F] space-y-3">
      {!expanded ? (
        <button
          onClick={handleToggle}
          className="text-[11px] font-bold text-[#8B5E3C] dark:text-[#D2C5B4] hover:underline cursor-pointer flex items-center gap-1"
        >
          ▶ View replies
        </button>
      ) : (
        <>
          <button
            onClick={handleToggle}
            className="text-[11px] font-bold text-[#8B5E3C] dark:text-[#D2C5B4] hover:underline mb-1 cursor-pointer flex items-center gap-1"
          >
            ▼ Hide replies
          </button>
          {loading && <p className="text-[10px] text-muted-foreground">Loading replies...</p>}
          {replies.map((reply) => (
            <div key={reply._id} className="flex gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={reply.author?.avatar || ""} />
                <AvatarFallback>
                  {reply.author?.username?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-foreground/80">
                  {reply.author?.username ?? "user"}
                </p>
                <p className="text-[11px] text-foreground">{reply.text}</p>
                <div className="flex gap-2.5 mt-1 text-[10px] text-muted-foreground font-semibold">
                  <button
                    onClick={() => onReplyTo(reply)}
                    className="hover:text-foreground cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-1">
                <button
                  onClick={() => {
                    onLikeComment(reply._id);
                    setReplies(prev => prev.map(r => r._id === reply._id ? { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1 } : r));
                  }}
                  className="flex flex-col items-center"
                >
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5",
                      reply.isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-[9px]">{reply.likesCount}</span>
                </button>
                {reply.canDelete && (
                  <button
                    onClick={async () => {
                      await onDeleteComment(reply._id);
                      setReplies(prev => prev.filter(r => r._id !== reply._id));
                    }}
                    className="p-0.5 rounded-full hover:bg-muted text-red-500 cursor-pointer"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ======================
   COMPONENT
   ====================== */
export function CommentsSheet({
  open,
  onOpenChange,
  postId,
  storyId,
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
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const queryClient = useQueryClient();

  const isStory = Boolean(storyId);
  const targetId = storyId || postId;
  const targetType = isStory ? "story" : "post";

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery<Comment[]>({
    queryKey: ["comments", targetType, targetId, page],
    queryFn: async () => {
      const url = isStory
        ? `${API_BASE_URL}/api/comments/story/${storyId}?page=${page}&limit=15`
        : `${API_BASE_URL}/api/comments/${postId}?page=${page}&limit=15`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    },
    enabled: open && !!token && !!targetId,
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

  // Reset page when switching posts/stories
  useEffect(() => {
    setPage(1);
    setReplyingTo(null);
  }, [postId, storyId]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ======================
     REAL-TIME UPDATES
     ====================== */
  useEffect(() => {
    if (!open || !socket || !targetId) return;

    if (isStory) {
      socket.emit("join_story", targetId);
    } else {
      socket.emit("join_post", targetId);
    }

    const handleCommentUpdate = (data: { type: string; postId?: string; storyId?: string; comment?: Comment; commentId?: string }) => {
      const isMatch = isStory ? data.storyId === targetId : data.postId === targetId;
      if (!isMatch) return;

      if (data.type === "add" && data.comment) {
        setComments((prev) => {
          if (prev.find(c => c._id === data.comment!._id)) return prev;
          return [data.comment!, ...prev];
        });
      } else if (data.type === "delete" && data.commentId) {
        setComments((prev) => prev.filter(c => c._id !== data.commentId));
      }
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
      if (!isStory) {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["reels"] });
        queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
        queryClient.invalidateQueries({ queryKey: ["postDetail", targetId] });
      }
    };

    const handleReplyUpdate = (data: { type: string; postId?: string; storyId?: string; parentCommentId: string; comment: Comment }) => {
      const isMatch = isStory ? data.storyId === targetId : data.postId === targetId;
      if (!isMatch) return;

      // Invalidate the replies query for this comment so it updates real-time!
      queryClient.invalidateQueries({ queryKey: ["replies", data.parentCommentId] });
    };

    socket.on("comment_update", handleCommentUpdate);
    socket.on("reply_update", handleReplyUpdate);

    return () => {
      socket.off("comment_update", handleCommentUpdate);
      socket.off("reply_update", handleReplyUpdate);
      if (isStory) {
        socket.emit("leave_story", targetId);
      } else {
        socket.emit("leave_post", targetId);
      }
    };
  }, [open, socket, targetId, isStory, targetType]);

  useEffect(() => {
    if (onCommentAdded) {
      onCommentAdded(comments.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length]);

  /* ======================
     ADD COMMENT / REPLY
     ====================== */
  const handleSendComment = async () => {
    if (!newComment.trim() || !token || isSending) return;

    setIsSending(true);
    try {
      const isReply = Boolean(replyingTo);
      const url = isReply
        ? `${API_BASE_URL}/api/comments/reply/${replyingTo!._id}`
        : isStory
          ? `${API_BASE_URL}/api/comments/story/${storyId}`
          : `${API_BASE_URL}/api/comments/${postId}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment }),
      });

      const data = await res.json();

      if (isReply) {
        // Invalidate replies for this parent so it fetches the new list
        queryClient.invalidateQueries({ queryKey: ["replies", replyingTo!._id] });
        setReplyingTo(null);
      } else {
        setComments((prev) => {
          if (prev.find(c => c._id === data._id)) return prev;
          return [data, ...prev];
        });
        queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
        if (!isStory) {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["reels"] });
          queryClient.invalidateQueries({ queryKey: ["userPosts"] });
          queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
          queryClient.invalidateQueries({ queryKey: ["postDetail", targetId] });
        }
        onCommentAdded?.(data.commentsCount);
      }

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
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
      if (!isStory) {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["reels"] });
        queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
        queryClient.invalidateQueries({ queryKey: ["postDetail", targetId] });
      }
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
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
      queryClient.invalidateQueries({ queryKey: ["replies", commentId] });
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
            <div key={comment._id} className="flex flex-col gap-1 border-b border-border/25 pb-3">
              <div className="flex gap-3">
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
                  <div className="flex gap-2.5 mt-1 text-xs text-muted-foreground font-semibold">
                    <button
                      onClick={() => setReplyingTo(comment)}
                      className="hover:text-foreground cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
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

              {/* Collapsible Nested Replies */}
              <RepliesSection
                parentCommentId={comment._id}
                token={token}
                onReplyTo={(parentReply) => setReplyingTo(parentReply)}
                onDeleteComment={handleDeleteComment}
                onLikeComment={handleLikeComment}
                isDesktop={isDesktop}
              />
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
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background">
          {replyingTo && (
            <div className="flex justify-between items-center bg-muted/65 rounded-t-xl px-4 py-1.5 text-xs text-muted-foreground border-b border-border">
              <span>Replying to <span className="font-semibold text-foreground">@{replyingTo.author?.username || "user"}</span></span>
              <button onClick={() => setReplyingTo(null)} className="hover:text-foreground font-bold text-sm px-1.5 cursor-pointer">
                ×
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 p-4">
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
