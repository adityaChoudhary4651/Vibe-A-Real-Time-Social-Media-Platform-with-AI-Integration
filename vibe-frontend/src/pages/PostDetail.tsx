import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, resolveUrl } from "../config";
import PostDetailModal, {
  PostDetailPost,
} from "@/components/post/PostDetailModal";

/* =====================
   API TYPES
===================== */
type ApiAuthor = {
  username?: string;
  name?: string;
  avatar?: string;
};

type ApiPost = {
  _id: string;
  mediaUrl?: string;
  imageUrl?: string;
  image?: string;
  caption?: string;
  likes?: unknown[];
  author?: ApiAuthor;
};

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [post, setPost] = useState<PostDetailPost | null>(null);

  useEffect(() => {
    if (!token || !postId) return;

    const loadPost = async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        navigate(-1);
        return;
      }

      const data: ApiPost = await res.json();

      const rawImage = data.mediaUrl || data.imageUrl || data.image || "";
      const imageUrl = resolveUrl(rawImage);

      const username =
        data.author?.username ||
        data.author?.name ||
        "unknown";

      const isLiked =
        user && Array.isArray(data.likes)
          ? data.likes.includes(user.id)
          : false;

      setPost({
        _id: data._id,
        imageUrl,
        caption: data.caption,
        likes: Array.isArray(data.likes) ? data.likes.length : 0,
        isLiked,
        user: {
          username,
          avatar: data.author?.avatar || "",
        },
      });
    };

    loadPost();
  }, [token, postId, navigate, user]);

  if (!post) return null;

  return (
    <PostDetailModal
      open={true}
      post={post}
      onClose={() => navigate(-1)}
    />
  );
}
