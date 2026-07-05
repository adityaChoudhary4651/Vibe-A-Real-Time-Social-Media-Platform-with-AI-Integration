import React, { useEffect, useRef } from "react";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { FeedPostCard, FeedPost } from "@/components/post/FeedPostCard";

interface ProfileFeedViewerProps {
  posts: FeedPost[];
  initialPostId: string;
  onClose: () => void;
  onLike: (postId: string) => void;
  onCommentClick: (postId: string) => void;
  onShareClick: (postId: string) => void;
  onTipClick: (post: FeedPost) => void;
}

export function ProfileFeedViewer({
  posts,
  initialPostId,
  onClose,
  onLike,
  onCommentClick,
  onShareClick,
  onTipClick,
}: ProfileFeedViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Full screen dark theme for feed viewer
  const viewerTheme = {
    cardBorder: "border-transparent",
    card: "bg-black",
    shadow: "shadow-none",
    accentButton: "bg-[#8B5E3C] hover:bg-[#4A3428] text-white",
  };

  useEffect(() => {
    // Scroll to the initial post on mount
    if (containerRef.current) {
      const targetElement = containerRef.current.querySelector(
        `[data-post-id="${initialPostId}"]`
      );
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  }, [initialPostId]);

  const handleScrollDown = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
    }
  };

  const handleScrollUp = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -(window.innerHeight * 0.7), behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-white/10 shrink-0 z-10 bg-black/80 backdrop-blur-md">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h2 className="ml-4 text-lg font-bold">Posts</h2>
      </div>

      {/* Scrollable Snap Feed */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide bg-black pb-20 sm:pb-0"
      >
        {posts.map((post) => (
          <div
            key={post._id}
            data-post-id={post._id}
            className="w-full h-full snap-start snap-always flex items-center justify-center p-0 sm:p-4"
          >
            {/* We constrain the FeedPostCard to take up height but not overflow */}
            <div className="w-full h-full sm:h-auto sm:max-h-[85vh] flex justify-center">
              <FeedPostCard
                post={post}
                theme={viewerTheme}
                variant="large"
                onLike={onLike}
                onCommentClick={onCommentClick}
                onShareClick={() => onShareClick(post._id)}
                onTipClick={onTipClick}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Up/Down Navigation Indicators */}
      <div className="hidden sm:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-[110]">
        <button
          onClick={handleScrollUp}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all active:scale-90 border border-white/20 shadow-lg group"
          title="Previous Post"
        >
          <ChevronUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
        </button>
        <button
          onClick={handleScrollDown}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all active:scale-90 border border-white/20 shadow-lg group"
          title="Next Post"
        >
          <ChevronDown className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
