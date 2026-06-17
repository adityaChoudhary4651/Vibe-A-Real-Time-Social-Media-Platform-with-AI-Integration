import axios from "@/lib/axios";

export const getConversations = async () => {
  const res = await axios.get("/conversations");
  return res.data;
};

export const createConversation = async (userId: string) => {
  const res = await axios.post(`/conversations/${userId}`);
  return res.data;
};

export const muteConversation = async (id: string) => {
  const res = await axios.put(`/conversations/${id}/mute`);
  return res.data;
};

export const archiveConversation = async (id: string) => {
  const res = await axios.put(`/conversations/${id}/archive`);
  return res.data;
};

export const favoriteConversation = async (id: string) => {
  const res = await axios.put(`/conversations/${id}/favorite`);
  return res.data;
};

export const deleteConversation = async (id: string) => {
  const res = await axios.delete(`/conversations/${id}`);
  return res.data;
};
