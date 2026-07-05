import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  MessageCircle,
  Share2,
  DollarSign,
  MoreHorizontal,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";

export interface FeedPost {
  _id: string;
  imageUrl: string;
  caption: string;
  author: {
    _id: string;
    name: string;
    username?: string;
    avatar?: string;
    isVerified?: boolean;
    category?: string;
  };
  likes: string[];
  commentsCount?: number;
  comments: any[];
  sharesCount?: number;
  createdAt: string;
  isLiked?: boolean;
}

interface FeedPostCardProps {
  post: FeedPost;
  theme: {
    cardBorder: string;
    card: string;
    shadow: string;
    accentButton: string;
  };
  onLike: (postId: string) => void;
  onCommentClick: (postId: string) => void;
  onShareClick: () => void;
  onTipClick: (post: FeedPost) => void;
  variant?: "default" | "large";
}

export function FeedPostCard({
  post,
  theme,
  onLike,
  onCommentClick,
  onShareClick,
  onTipClick,
  variant = "default",
}: FeedPostCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`w-full ${
        variant === "large"
          ? "sm:w-[600px] md:w-[800px] lg:w-[1000px] sm:h-[450px] md:h-[550px] lg:h-[650px]"
          : "sm:w-[520px] md:w-[540px] sm:h-[280px]"
      } aspect-[4/5] max-h-[85vh] min-h-[450px] sm:aspect-auto shrink-0 flex flex-col sm:flex-row rounded-[24px] overflow-hidden border-0 sm:border ${theme.cardBorder} bg-neutral-900 sm:${theme.card} shadow-sm sm:${theme.shadow} transition-all duration-300 relative group`}
    >
      {/* Media Background (Full size on mobile, left side on desktop) */}
      <div className={`absolute inset-0 sm:relative ${
        variant === "large" ? "sm:w-[65%] md:w-[65%] lg:w-[70%]" : "sm:w-full"
      } h-full bg-neutral-100 dark:bg-neutral-900 shrink-0`}>
        <img
          src={post.imageUrl}
          alt={post.caption}
          className="w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800";
          }}
        />
        {/* Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 ${variant === "large" ? "sm:hidden" : ""}`} />
      </div>

      {/* Top Right Options (Mobile Only or Default Variant) */}
      <div className={`absolute top-4 right-4 z-10 text-white ${variant === "large" ? "sm:hidden" : ""}`}>
        <MoreHorizontal className="h-6 w-6 opacity-80" />
      </div>

      {/* Overlay / Right Panel for Large Variant */}
      <div className={`absolute inset-0 z-10 w-full ${
        variant === "large" ? "sm:relative sm:w-[35%] md:w-[35%] lg:w-[30%] sm:flex sm:bg-inherit sm:border-l" : "flex bg-transparent sm:bg-transparent sm:border-l-0"
      } p-4 sm:p-5 flex-col justify-end sm:justify-between pointer-events-none sm:pointer-events-auto bg-transparent border-l-0 border-[#C8B9A6]/20 dark:border-[#3D2A1F]/30 overflow-hidden`}>
        {/* Desktop Author Header */}
        <div className={`hidden ${variant === "large" ? "sm:flex" : "sm:hidden"} items-center justify-between`}>
          <div
            onClick={() => navigate(`/profile/${post.author.username || post.author.name}`)}
            className="flex flex-col xl:flex-row items-center gap-2.5 min-w-0 cursor-pointer group/author"
          >
            <img
              src={
                post.author.avatar ||
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
              }
              alt={post.author.name}
              className="h-8 w-8 rounded-full object-cover border border-[#8B5E3C]/30 transition-transform group-hover/author:scale-105"
            />
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold truncate group-hover/author:underline">
                  {post.author.name}
                </span>
                {post.author.isVerified && (
                  <CheckCircle2 className="h-3 w-3 text-[#8B5E3C] fill-[#EFE6DA] shrink-0" />
                )}
              </div>
              <span className="text-[10px] opacity-60 font-medium block">
                {post.createdAt}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Caption */}
        <p className={`hidden ${variant === "large" ? "sm:block" : "sm:hidden"} text-xs font-medium leading-relaxed opacity-85 my-3 line-clamp-3`}>
          {post.caption}
        </p>

        {/* Desktop Engagement Actions */}
        <div className={`hidden ${variant === "large" ? "sm:block" : "sm:hidden"} space-y-3`}>
          <div className="flex flex-row items-center justify-between border-t border-[#C8B9A6]/20 pt-3 text-[10px] opacity-80 font-bold">
            <button
              onClick={() => onLike(post._id)}
              className="flex flex-row items-center gap-1.5 hover:text-red-500 transition-colors pointer-events-auto"
            >
              <Heart
                className={`h-4.5 w-4.5 transition-transform duration-300 active:scale-125 ${
                  post.isLiked ? "text-red-500 fill-red-500" : ""
                }`}
              />
              <span>{post.likes.length}</span>
            </button>

            <div
              onClick={() => onCommentClick(post._id)}
              className="flex flex-row items-center gap-1.5 cursor-pointer hover:opacity-85 pointer-events-auto"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentsCount || 0}</span>
            </div>

            <div
              onClick={() => onShareClick()}
              className="flex flex-row items-center gap-1.5 cursor-pointer hover:opacity-85 pointer-events-auto"
            >
              <Share2 className="h-4 w-4" />
              <span>{post.sharesCount || 0}</span>
            </div>
          </div>

          <button
            onClick={() => onTipClick(post)}
            className={`w-full py-2.5 px-4 flex-row rounded-[16px] text-xs font-bold uppercase tracking-wider transition-colors duration-300 flex items-center justify-center gap-2 pointer-events-auto ${theme.accentButton}`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Tip Creator</span>
          </button>
        </div>

        {/* Overlay Layout Container (Mobile or Default Variant on Desktop) */}
        <div className={`flex items-end justify-between w-full h-full ${variant === "large" ? "sm:hidden" : ""}`}>
          {/* Left Info Area */}
          <div className="flex flex-col gap-2 flex-1 pr-4 mb-2 pointer-events-auto">
            <div
              onClick={() => navigate(`/profile/${post.author.username || post.author.name}`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={
                  post.author.avatar ||
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                }
                alt={post.author.name}
                className="h-9 w-9 rounded-full object-cover border border-[#8B5E3C]"
              />
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold text-white drop-shadow-md">
                  {post.author.username || post.author.name}
                </span>
                {post.author.isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#3b82f6] fill-white drop-shadow-md" />
                )}
              </div>
            </div>
            <p className="text-xs font-medium text-white/90 line-clamp-2 drop-shadow-md">
              {post.caption}
            </p>
            <p className="text-[11px] font-medium text-[#D4A373] line-clamp-1 drop-shadow-md">
              #vibe #trending
            </p>
          </div>

          {/* Right Action Icons Stack */}
          <div className="flex flex-col items-center gap-5 pb-2 pointer-events-auto">
            <button
              onClick={() => onLike(post._id)}
              className="flex flex-col items-center gap-1.5 group/btn"
            >
              <Heart
                className={`h-7 w-7 drop-shadow-lg ${
                  post.isLiked ? "text-red-500 fill-red-500" : "text-white"
                }`}
              />
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {post.likes.length}
              </span>
            </button>

            <button
              onClick={() => onCommentClick(post._id)}
              className="flex flex-col items-center gap-1.5 group/btn"
            >
              <MessageCircle className="h-7 w-7 text-white drop-shadow-lg" />
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {post.commentsCount || 0}
              </span>
            </button>

            <button
              onClick={() => onShareClick()}
              className="flex flex-col items-center gap-1.5 group/btn"
            >
              <Share2 className="h-7 w-7 text-white drop-shadow-lg" />
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {post.sharesCount || 0}
              </span>
            </button>

            <button
              onClick={() => onTipClick(post)}
              className="flex flex-col items-center gap-1.5 group/btn mt-1"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#6B46C1] to-[#3B82F6] shadow-lg flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-[#E9D8FD] drop-shadow-md">
                Pay
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
