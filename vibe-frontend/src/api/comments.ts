import { API_BASE_URL } from "../config";
const API_BASE = API_BASE_URL;

export async function fetchComments(token: string, postId: string) {
  const res = await fetch(`${API_BASE}/api/comments/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function addComment(
  token: string,
  postId: string,
  text: string
) {
  const res = await fetch(`${API_BASE}/api/comments/${postId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}
