// FETCH PROFILE
export async function fetchProfile(token: string) {
  const res = await fetch("http://localhost:5000/api/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Unauthorized");
  }
  return data;
}
// DELETE POST
export async function deletePost(token: string, postId: string) {
  const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
}
// UPDATE PROFILE
const API_BASE = "http://localhost:5000";

export async function updateProfile(
  token: string,
  payload: { bio: string }
) {
  const res = await fetch(`${API_BASE}/api/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}
export const getPublicProfile = async (
  username: string,
  token: string
) => {
  const res = await fetch(
    `http://localhost:5000/api/users/${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to load profile");
  }

  return res.json();
};

export const fetchFollowers = async (username: string, token: string) => {
  const res = await fetch(`http://localhost:5000/api/users/${username}/followers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to load followers");
  }

  return res.json();
};

