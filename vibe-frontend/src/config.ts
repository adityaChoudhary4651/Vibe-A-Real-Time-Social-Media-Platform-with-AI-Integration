export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000";

// Helper to resolve media URLs from backend storage or Cloudinary
export const resolveUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  // Remove starting slash if present
  const sanitizedUrl = url.startsWith("/") ? url.substring(1) : url;
  return `${API_BASE_URL}/${sanitizedUrl}`;
};
