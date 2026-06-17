import axios from "@/lib/axios";

export const createHighlight = async (name: string, storyIds: string[]) => {
  const res = await axios.post("/highlights", { name, storyIds });
  return res.data;
};

export const fetchHighlights = async (username: string) => {
  const res = await axios.get(`/highlights/user/${username}`);
  return res.data;
};

export const deleteHighlight = async (id: string) => {
  const res = await axios.delete(`/highlights/${id}`);
  return res.data;
};
