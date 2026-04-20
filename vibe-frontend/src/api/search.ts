import axios from "@/lib/axios";

export const searchUsers = async (q: string) => {
  const res = await axios.get(`/search/users?q=${q}`);
  return res.data;
};

export const searchPosts = async (q: string) => {
  const res = await axios.get(`/search/posts?q=${q}`);
  return res.data;
};
