import api from "@/lib/axios";

export async function createCommunity(data: { name: string; description: string; avatar?: string; category?: string }) {
  const res = await api.post("/communities", data);
  return res.data;
}

export async function fetchCommunities(query?: string) {
  const res = await api.get(`/communities${query ? `?q=${query}` : ""}`);
  return res.data;
}

export async function toggleCommunityJoin(id: string) {
  const res = await api.put(`/communities/${id}/join`);
  return res.data;
}

export async function fetchCommunityMessages(id: string) {
  const res = await api.get(`/communities/${id}/messages`);
  return res.data;
}

export async function sendCommunityMessage(id: string, text: string) {
  const res = await api.post(`/communities/${id}/messages`, { text });
  return res.data;
}

export async function updateCommunity(id: string, data: { description?: string; avatar?: string }) {
  const res = await api.patch(`/communities/${id}`, data);
  return res.data;
}
