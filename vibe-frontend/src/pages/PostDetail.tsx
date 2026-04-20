import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  const { token } = useAuth();

  const [post, setPost] = useState<PostDetailPost | null>(null);

  useEffect(() => {
    if (!token || !postId) return;

    const loadPost = async () => {
      const res = await fetch(
        `http://localhost:5000/api/posts/${postId}`,
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
      const BASE_URL = "http://localhost:5000/";
      const resolveUrl = (url?: string) => {
        if (!url) return "";
        return url.startsWith("http")
          ? url
          : `${BASE_URL}${url.replace(/\\/g, "/")}`;
      };

      const imageUrl = resolveUrl(rawImage);

      const username =
        data.author?.username ||
        data.author?.name ||
        "unknown";

      setPost({
        _id: data._id,
        imageUrl,
        caption: data.caption,
        likes: Array.isArray(data.likes) ? data.likes.length : 0,
        user: {
          username,
          avatar: data.author?.avatar || "",
        },
      });
    };

    loadPost();
  }, [token, postId, navigate]);

  if (!post) return null;

  return (
    <PostDetailModal
      open={true}
      post={post}
      onClose={() => navigate(-1)}
    />
  );
}
