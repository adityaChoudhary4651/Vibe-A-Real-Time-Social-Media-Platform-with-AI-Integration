import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

/* USERS */
export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: ["search-users", query],
    queryFn: () =>
      api.get("/search/users", { params: { q: query } }).then(res => res.data),
    enabled: !!query,
  });
};

/* POSTS (HASHTAGS) */
export const useSearchPosts = (query: string) => {
  return useQuery({
    queryKey: ["search-posts", query],
    queryFn: () =>
      api.get("/search/posts", { params: { q: query } }).then(res => res.data),
    enabled: !!query,
  });
};
