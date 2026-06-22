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

export async function fetchDiscoveryUsers(gender?: string, search?: string) {
  const params: any = {};
  if (gender && gender !== "All") params.gender = gender;
  if (search) params.q = search;
  const res = await api.get("/users/discovery", { params });
  return res.data;
}

export async function toggleFollow(username: string) {
  const res = await api.put(`/users/${username}/follow`);
  return res.data;
}

export async function sendTip(username: string, amount: number) {
  const res = await api.post(`/tips/${username}`, { amount });
  return res.data;
}