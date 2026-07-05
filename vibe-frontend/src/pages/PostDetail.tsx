import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, resolveUrl } from "../config";
import { ProfileFeedViewer } from "@/components/profile/ProfileFeedViewer";
import { FeedPost } from "@/components/post/FeedPostCard";
import { toggleLike } from "@/api/posts";
import { CommentsSheet } from "@/components/shared/CommentsSheet";
import { ShareSheet } from "@/components/shared/ShareSheet";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!token || !postId) return;

    const loadPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          navigate(-1);
          return;
        }

        const data = await res.json();

        const rawImage = data.mediaUrl || data.imageUrl || data.image || "";
        const imageUrl = resolveUrl(rawImage);

        const isLiked = user && Array.isArray(data.likes)
          ? data.likes.includes(user.id || (user as any)._id)
          : false;

        const formattedPost: FeedPost = {
          _id: data._id,
          imageUrl,
          caption: data.caption || "",
          author: {
            _id: data.author?._id || "",
            name: data.author?.name || data.author?.username || "Unknown",
            username: data.author?.username,
            avatar: resolveUrl(data.author?.avatar),
          },
          likes: data.likes || [],
          comments: data.comments || [],
          commentsCount: data.commentsCount || data.comments?.length || 0,
          sharesCount: data.sharesCount || 0,
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Just now",
          isLiked,
        };

        setPost(formattedPost);
      } catch (err) {
        console.error(err);
        navigate(-1);
      }
    };

    loadPost();
  }, [token, postId, navigate, user]);

  const handleLikePost = async (id: string) => {
    if (!token || !post) return;
    try {
      await toggleLike(token, id);
      const isCurrentlyLiked = post.isLiked;
      setPost({
        ...post,
        isLiked: !isCurrentlyLiked,
        likes: isCurrentlyLiked
          ? post.likes.slice(1) // simple optimistic remove
          : [...post.likes, "new_like_id"], // simple optimistic add
      });
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  if (!post) return null;

  return (
    <>
      <ProfileFeedViewer
        posts={[post]}
        initialPostId={post._id}
        onClose={() => navigate(-1)}
        onLike={handleLikePost}
        onCommentClick={setActiveCommentsPostId}
        onShareClick={() => setShowShare(true)}
        onTipClick={() => {}}
      />
      
      <CommentsSheet
        open={activeCommentsPostId !== null}
        onOpenChange={(open) => !open && setActiveCommentsPostId(null)}
        postId={activeCommentsPostId || ""}
        onCommentAdded={() => {}}
      />

      <ShareSheet
        open={showShare}
        onOpenChange={setShowShare}
      />
    </>
  );
}
