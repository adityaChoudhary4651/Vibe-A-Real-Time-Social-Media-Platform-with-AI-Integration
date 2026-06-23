import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

// 1. Search All (Multi-search)
export const useSearchAll = (query: string) => {
  return useQuery({
    queryKey: ["search-all", query],
    queryFn: () =>
      api.get("/search", { params: { q: query } }).then((res) => res.data),
    enabled: !!query,
  });
};

// 2. Search Users (Infinite Query)
export const useSearchUsers = (query: string) => {
  return useInfiniteQuery({
    queryKey: ["search-users", query],
    queryFn: ({ pageParam = 1 }) =>
      api
        .get("/search/users", { params: { q: query, page: pageParam, limit: 12 } })
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
    },
  });
};

// 3. Search Posts & Reels Combined (Infinite Query with media filter)
export const useSearchPosts = (query: string, media: string = "All") => {
  return useInfiniteQuery({
    queryKey: ["search-posts", query, media],
    queryFn: ({ pageParam = 1 }) =>
      api
        .get("/search/posts", { params: { q: query, media, page: pageParam, limit: 12 } })
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
    },
  });
};

// 4. Search Reels Only (Infinite Query)
export const useSearchReels = (query: string) => {
  return useInfiniteQuery({
    queryKey: ["search-reels", query],
    queryFn: ({ pageParam = 1 }) =>
      api
        .get("/search/reels", { params: { q: query, page: pageParam, limit: 12 } })
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
    },
  });
};

// 5. Search Hashtags (Infinite Query)
export const useSearchHashtags = (query: string) => {
  return useInfiniteQuery({
    queryKey: ["search-hashtags", query],
    queryFn: ({ pageParam = 1 }) =>
      api
        .get("/search/hashtags", { params: { q: query, page: pageParam, limit: 12 } })
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
    },
  });
};

// 6. Search Communities (Infinite Query)
export const useSearchCommunities = (query: string) => {
  return useInfiniteQuery({
    queryKey: ["search-communities", query],
    queryFn: ({ pageParam = 1 }) =>
      api
        .get("/search/communities", { params: { q: query, page: pageParam, limit: 12 } })
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
    },
  });
};

// 7. Get Trending Hashtags
export const useTrendingHashtags = (limit: number = 6) => {
  return useQuery({
    queryKey: ["trending-hashtags", limit],
    queryFn: () =>
      api.get("/search/trending", { params: { limit } }).then((res) => res.data),
  });
};

// 8. Get Recent Searches
export const useRecentSearches = () => {
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: () => api.get("/search/recent").then((res) => res.data),
  });
};

// 9. Add Recent Search
export const useAddRecentSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (term: string) =>
      api.post("/search/recent", { term }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-searches"] });
    },
  });
};

// 10. Clear All Recent Searches
export const useClearRecentSearches = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/search/recent").then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-searches"] });
    },
  });
};

// 11. Delete Recent Search Item
export const useDeleteRecentSearchItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/search/recent/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-searches"] });
    },
  });
};

// 12. Get Suggestions
export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () =>
      api.get("/search/suggestions", { params: { q: query } }).then((res) => res.data),
    enabled: !!query,
  });
};

// 13. Sidebar Motivational Thought (Quote)
export const useMotivationalThought = () => {
  return useQuery({
    queryKey: ["motivational-thought"],
    queryFn: () => api.get("/search/quote").then((res) => res.data),
  });
};

// 14. Update Motivational Thought
export const useUpdateMotivationalThought = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { text: string; author?: string }) =>
      api.post("/search/quote", data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motivational-thought"] });
    },
  });
};

// 15. Sidebar Latest User Post
export const useLatestPost = () => {
  return useQuery({
    queryKey: ["sidebar-latest-post"],
    queryFn: () => api.get("/search/sidebar/latest-post").then((res) => res.data),
  });
};

// 16. Sidebar Friends' Latest Posts
export const useFriendsPosts = () => {
  return useQuery({
    queryKey: ["sidebar-friends-posts"],
    queryFn: () => api.get("/search/sidebar/friends-posts").then((res) => res.data),
  });
};

// 17. Sidebar People You May Know
export const usePeopleSuggestions = () => {
  return useQuery({
    queryKey: ["sidebar-people-suggestions"],
    queryFn: () => api.get("/search/sidebar/people-suggestion").then((res) => res.data),
  });
};
