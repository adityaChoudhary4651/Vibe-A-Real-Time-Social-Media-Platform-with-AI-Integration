import { Post } from "@/types/post";
import api from "@/lib/axios";
import { API_BASE_URL } from "../config";

const API_BASE = API_BASE_URL;

/* ======================
   FETCH ALL POSTS
====================== */
export async function fetchPosts(token: string) {
  const res = await fetch(`${API_BASE}/api/posts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch posts");
  return data;
}

/* ======================
   CREATE POST (CLOUDINARY)
====================== */

export async function createPost(
  token: string,
  formData: FormData
) {
  const res = await api.post("/posts", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ DO NOT set Content-Type manually
    },
  });

  return res.data;
}


/* ======================
   TOGGLE LIKE
====================== */
export async function toggleLike(token: string, postId: string) {
  const res = await fetch(
    `${API_BASE}/api/posts/${postId}/like`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to toggle like");
  return data;
}

/* ======================
   DELETE POST
====================== */
export async function deletePost(token: string, postId: string) {
  const res = await fetch(
    `${API_BASE}/api/posts/${postId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete post");
  }

  return res.json();
}

/* ======================
   EDIT POST
====================== */
export async function editPost(
  token: string,
  postId: string,
  caption: string
) {
  const res = await fetch(
    `${API_BASE}/api/posts/${postId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ caption }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to edit post");
  }

  return res.json();
}

/* ======================
   GET MY POSTS
====================== */
export async function getMyPosts(token: string) {
  const res = await fetch(`${API_BASE}/api/posts/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch my posts");
  return data;
}

/* ======================
   TOGGLE FOLLOW
====================== */
export async function toggleFollow(
  token: string,
  username: string
) {
  const res = await fetch(
    `${API_BASE}/api/users/${username}/follow`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Follow failed");
  return data;
}

/* ======================
   GET PUBLIC PROFILE
====================== */
export const getPublicProfile = async (
  token: string,
  username: string
) => {
  const res = await fetch(
    `${API_BASE}/api/users/${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load profile");
  return data;
};

/* ======================
   GET FOLLOWERS
====================== */
export const getFollowers = async (
  token: string,
  username: string
) => {
  const res = await fetch(
    `${API_BASE}/api/users/${username}/followers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch followers");
  return data;
};

/* ======================
   GET FOLLOWING
====================== */
export const getFollowing = async (
  token: string,
  username: string
) => {
  const res = await fetch(
    `${API_BASE}/api/users/${username}/following`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch following");
  return data;
};

/* ======================
   GET POSTS BY USERNAME
====================== */
export const getPostsByUsername = async (
  token: string,
  username: string
) => {
  const res = await fetch(
    `${API_BASE}/api/posts/user/${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch posts");
  return data;
};

/* ======================
   GET POST BY ID
====================== */
export const getPostById = async (
  token: string,
  postId: string
): Promise<Post> => {
  const res = await fetch(
    `${API_BASE}/api/posts/${postId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load post");
  return data;
};

export const getMyReels = async (token: string) => {
  const res = await fetch(`${API_BASE}/api/posts/me/reels`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getReelsByUsername = async (
  token: string,
  username: string
) => {
  const res = await fetch(
    `${API_BASE}/api/posts/user/${username}/reels`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.json();
};
