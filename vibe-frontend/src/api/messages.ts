import axios from "@/lib/axios";

export const getMessages = async (conversationId: string) => {
  const res = await axios.get(`/messages/${conversationId}`);
  return res.data;
};

export const sendMessage = async (
  conversationId: string,
  text: string,
  imageFile?: File
) => {
  if (imageFile) {
    const formData = new FormData();
    if (text) formData.append("text", text);
    formData.append("image", imageFile);

    const res = await axios.post(`/messages/${conversationId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } else {
    const res = await axios.post(`/messages/${conversationId}`, { text });
    return res.data;
  }
};

export const markMessageRead = async (messageId: string) => {
  await axios.patch(`/messages/${messageId}/read`);
};

export const getUnreadMessageCount = async () => {
  const res = await axios.get("/messages/me/unread");
  return res.data.count;
};
