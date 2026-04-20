import api from "@/lib/axios";
export async function uploadAvatar(
  token: string,
  file: File
) {
  const formData = new FormData();
  formData.append("avatar", file); // 👈 MUST match backend

  const res = await api.put("/users/me/avatar", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export async function fetchDiscoveryUsers() {
  const res = await api.get("/users/discovery");
  return res.data;
}

export async function toggleFollow(username: string) {
  const res = await api.put(`/users/${username}/follow`);
  return res.data;
}