import axios from "@/lib/axios";

export const getConversations = async () => {
  const res = await axios.get("/conversations");
  return res.data;
};

export const createConversation = async (userId: string) => {
  const res = await axios.post(`/conversations/${userId}`);
  return res.data;
};
