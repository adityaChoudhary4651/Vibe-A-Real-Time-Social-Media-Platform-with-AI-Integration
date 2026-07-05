import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Image,
  Film,
  Camera,
  Upload,
  X,
  Loader2,
  Plus,
  Check,
  Sparkles,
  Globe,
  ChevronDown,
  MapPin,
  Tag,
  AtSign,
  Smile,
  Lightbulb,
  Save,
  Send,
  ChevronRight,
  MessageSquare,
  Heart,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { uploadStory } from "@/api/stories";
import { API_BASE_URL, resolveUrl } from "../config";
import { generateVibeAIContent } from "@/api/vibeAI";

/* ======================
   TYPES & CONSTANTS
   ===================== */
type MediaType = "photo" | "reel" | "story";
type Visibility = "public" | "private";

const mediaTypes = [
  { id: "photo" as MediaType, icon: Image, label: "Photo" },
  { id: "reel" as MediaType, icon: Film, label: "Reel" },
  { id: "story" as MediaType, icon: Camera, label: "Story" },
];

const reelCategories = [
  "Funny",
  "Sad",
  "Dance",
  "Music",
  "Food",
  "Travel",
  "General",
];

/* ======================
   GRAPHICAL ASSETS (SVGS)
   ====================== */
interface IllustrationProps {
  isDark: boolean;
}

const UploadIllustration = ({ isDark }: IllustrationProps) => {
  const folderBack = isDark ? "#0A0604" : "#F2E8DC";
  const strokeColor = isDark ? "#D2C5B4" : "#8B5E3C";
  const cardBg = isDark ? "#0A0604" : "#FFFDF9";
  const folderFront = isDark ? "#140C09" : "#FFFDF9";
  const circleFill = isDark ? "#251711" : "#8B5E3C";
  const accentBeige = isDark ? "#251711" : "#E6D3BE";

  return (
    <svg width="120" height="90" viewBox="0 0 180 130" fill="none" className="mx-auto select-none pointer-events-none mb-2">
      {/* Folder Back */}
      <path d="M15 110V32C15 27.5817 18.5817 24 23 24H60L72 38H157C161.418 38 165 41.5817 165 46V110C165 114.418 161.418 118 157 118H23C18.5817 118 15 114.418 15 110Z" fill={folderBack} stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Floating Photo Card */}
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="42" y="40" width="58" height="42" rx="4" fill={cardBg} stroke={strokeColor} strokeWidth="1" strokeLinejoin="round" />
        <circle cx="54" cy="50" r="3" fill={accentBeige} stroke={strokeColor} strokeWidth="0.8" />
        <path d="M46 76L58 64L67 72L80 58L93 76H46Z" fill={folderBack} stroke={strokeColor} strokeWidth="0.8" strokeLinejoin="round" />
      </motion.g>

      {/* Floating Video/Film Strip Card */}
      <motion.g
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <rect x="90" y="28" width="48" height="52" rx="4" fill={cardBg} stroke={strokeColor} strokeWidth="1" strokeLinejoin="round" />
        {/* Film holes left */}
        <rect x="94" y="32" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />
        <rect x="94" y="40" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />
        <rect x="94" y="48" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />
        <rect x="94" y="56" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />

        {/* Film holes right */}
        <rect x="131.5" y="32" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />
        <rect x="131.5" y="40" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />
        <rect x="131.5" y="48" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />
        <rect x="131.5" y="56" width="2.5" height="2.5" rx="0.5" fill={strokeColor} />

        {/* Video Screen inside */}
        <rect x="100.5" y="34" width="27" height="40" rx="2" fill={accentBeige} stroke={strokeColor} strokeWidth="0.8" />
        <polygon points="110,50 110,58 118,54" fill={strokeColor} />
      </motion.g>

      {/* Folder Front Overlay */}
      <path d="M15 56C15 51.5817 18.5817 48 23 48H157C161.418 48 165 51.5817 165 56V110C165 114.418 161.418 118 157 118H23C18.5817 118 15 114.418 15 110V56Z" fill={folderFront} stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Upload Center Plus Circle */}
      <circle cx="90" cy="82" r="15" fill={circleFill} stroke={folderFront} strokeWidth="2.2" />
      <path d="M90 75V89M83 82H97" stroke={folderFront} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const MountainSketch = ({ isDark }: IllustrationProps) => {
  const fillGrad = isDark ? "url(#beige-gradient-dark)" : "url(#beige-gradient-light)";
  const strokeLine = isDark ? "rgba(25, 20, 13, 0.14)" : "rgba(139,94,60,0.14)";
  const strokeDash = isDark ? "rgba(16, 10, 3, 0.07)" : "rgba(139,94,60,0.07)";
  const outlinePlant = isDark ? "rgba(210,197,180,0.2)" : "rgba(139,94,60,0.2)";

  return (
    <svg viewBox="0 0 320 80" fill="none" className="w-full absolute bottom-0 left-0 right-0 pointer-events-none opacity-50 rounded-b-[24px] h-[40px]">
      <path d="M0 80L50 40L100 70L160 30L220 62L270 20L320 80H0Z" fill={fillGrad} />
      <path d="M0 80L50 40L100 70L160 30L220 62L270 20L320 80" stroke={strokeLine} strokeWidth="1" strokeLinecap="round" />
      <path d="M35 55L65 80M135 48L175 80M250 36L285 80" stroke={strokeDash} strokeWidth="0.8" strokeDasharray="2 2" />

      {/* Minimal floral outlines */}
      <path d="M15 80C16 72 20 68 22 80" stroke={outlinePlant} strokeWidth="0.8" />
      <path d="M18 80C19 69 23 66 25 80" stroke={outlinePlant} strokeWidth="0.8" />
      <path d="M295 80C296 74 298 75 299 80" stroke={outlinePlant} strokeWidth="0.8" />
      <path d="M297 80C299 70 301 68 303 80" stroke={outlinePlant} strokeWidth="0.8" />

      <defs>
        <linearGradient id="beige-gradient-light" x1="160" y1="20" x2="160" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(230, 211, 190, 0.02)" />
          <stop offset="1" stopColor="rgba(230, 211, 190, 0.35)" />
        </linearGradient>
        <linearGradient id="beige-gradient-dark" x1="160" y1="20" x2="160" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(42, 29, 22, 0.02)" />
          <stop offset="1" stopColor="rgba(42, 29, 22, 0.35)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default function Create() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ======================
     STATE
     ====================== */
  const isDarkState = () => localStorage.getItem("vibe_theme") === "dark";
  const [isDark, setIsDark] = useState(isDarkState);

  const [mediaType, setMediaType] = useState<MediaType>("photo");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [category, setCategory] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Layout Sub-Features
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationValue, setLocationValue] = useState("");
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);

  const [allowComments, setAllowComments] = useState(true);
  const [allowLikes, setAllowLikes] = useState(true);
  const [shareToFeed, setShareToFeed] = useState(true);

  // AI Prompt State
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const canShare =
    mediaType === "story"
      ? Boolean(selectedFile)
      : Boolean(selectedFile || caption.trim());

  /* ======================
     THEME OBSERVER
     ====================== */
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(isDarkState());
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  /* ======================
     INITIALIZATION & DRAFTS
     ====================== */
  useEffect(() => {
    // Load local draft if available
    const savedDraft = localStorage.getItem("vibe_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.caption) setCaption(draft.caption);
        if (draft.mediaType) setMediaType(draft.mediaType);
        if (draft.visibility) setVisibility(draft.visibility);
        if (draft.category) setCategory(draft.category);
        if (draft.location) {
          setLocationValue(draft.location);
          setShowLocationInput(true);
        }
        if (draft.allowComments !== undefined) setAllowComments(draft.allowComments);
        if (draft.allowLikes !== undefined) setAllowLikes(draft.allowLikes);
        if (draft.shareToFeed !== undefined) setShareToFeed(draft.shareToFeed);

        toast.info("Restored draft vibe ✨", {
          description: "Your previous caption and settings have been restored.",
        });
      } catch (err) {
        console.error("Failed to restore draft", err);
      }
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const clearSelected = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setCategory("");
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* ======================
     AI CAPTION GENERATION
     ====================== */
  const handleGenerateAICaption = async () => {
    if (!aiTopic.trim()) {
      toast.warning("Describe your vibe first!");
      return;
    }

    try {
      setIsGeneratingAI(true);
      const responseText = await generateVibeAIContent("caption", aiTopic);
      if (responseText) {
        setCaption(responseText);
        toast.success("AI Caption generated!");
        setShowAIPrompt(false);
      } else {
        toast.error("No result from Vibe AI");
      }
    } catch (err) {
      console.error(err);
      toast.error("Vibe AI generation failed");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  /* ======================
     DRAFT ACTION
     ====================== */
  const handleSaveDraft = () => {
    const draft = {
      caption,
      mediaType,
      visibility,
      category,
      location: locationValue,
      allowComments,
      allowLikes,
      shareToFeed
    };
    localStorage.setItem("vibe_draft", JSON.stringify(draft));
    toast.success("Draft saved successfully 🎉", {
      description: "Retrieved automatically when you next open this creator studio.",
    });
  };

  /* ======================
     PUBLISH VIBE
     ====================== */
  const handleShare = async () => {
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    if (mediaType === "story" && !selectedFile) {
      toast.error("Please select a photo/video for your story");
      return;
    }

    if (mediaType === "reel" && !category) {
      toast.error("Please select a category for your reel");
      return;
    }

    try {
      setIsSharing(true);

      // STORY FLOW
      if (mediaType === "story") {
        await uploadStory(selectedFile!, token);
        toast.success("Story uploaded successfully 🎉");
        localStorage.removeItem("vibe_draft");
        clearSelected();
        queryClient.invalidateQueries({ queryKey: ["stories"] });
        navigate("/");
        return;
      }

      // POST/REEL FLOW
      const formData = new FormData();
      if (selectedFile) {
        if (mediaType === "reel") {
          formData.append("media", selectedFile);
        } else {
          formData.append("image", selectedFile);
        }
      }

      formData.append("type", mediaType === "reel" ? "reel" : "post");

      let finalCaption = caption;
      if (locationValue) {
        finalCaption += ` \n📍 ${locationValue}`;
      }
      if (finalCaption) {
        formData.append("caption", finalCaption);
      }

      formData.append("visibility", visibility === "public" ? "Public" : "Private");

      if (mediaType === "reel") {
        formData.append("category", category || "General");
      }

      const endpoint =
        mediaType === "reel"
          ? `${API_BASE_URL}/api/reels`
          : `${API_BASE_URL}/api/posts`;

      await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(mediaType === "reel" ? "Reel published successfully 🎬" : "Vibe post shared successfully ✨");

      // Clear draft after success
      localStorage.removeItem("vibe_draft");

      clearSelected();
      setCaption("");
      setLocationValue("");
      setShowLocationInput(false);
      setVisibility("public");

      queryClient.invalidateQueries({
        queryKey: mediaType === "reel" ? ["reels"] : ["posts"],
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Publishing failed. Please check your file size and type.");
    } finally {
      setIsSharing(false);
    }
  };

  // Dynamic Theme Colors
  const themeCard = isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]";
  const themeBorder = isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]";
  const themeTextPrimary = isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]";
  const themeTextSecondary = isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]";

  return (
    <div className={cn(
      "w-full h-[calc(100dvh-78px-env(safe-area-inset-bottom))] lg:h-screen overflow-hidden font-sans flex flex-col xl:flex-row p-3 pb-1 lg:p-5 lg:gap-5 transition-colors duration-300",
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F8F4EE] text-[#5A3A22]"
    )}>
      {/* ========================================================
          1. CENTER CONTENT: Large Creator Workspace (Columns 1 & 2)
             Rendered in a single grand soft-edged card matching mockup
          ======================================================== */}
      <Card variant="outline" className={cn(
        "flex-1 border-none bg-transparent p-0 lg:border lg:p-5 flex flex-col justify-start lg:justify-between h-full min-h-0 overflow-hidden relative select-none transition-colors duration-300 shadow-none lg:shadow-sm",
        isDark ? "lg:bg-[#2A1D16] lg:border-[#3D2A1F]" : "lg:bg-[#FFFDF9] lg:border-[#E3D8C8]"
      )}>

        {/* MOBILE HEADER */}
        <div className="flex lg:hidden justify-between items-center mb-3 mt-1 flex-shrink-0">
          <div>
            <h1 className={cn("text-lg font-extrabold tracking-tight leading-none", themeTextPrimary)}>Create something new</h1>
            <p className={cn("text-[10px] flex items-center gap-1 mt-1 font-medium", themeTextSecondary)}>
              Share your moments, your way <Sparkles className={cn("h-3 w-3", isDark ? "text-[#FFB07C]" : "text-[#8B5E3C]")} />
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors border active:scale-95",
              isDark ? "bg-[#1F140E]/40 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/12 text-[#8B5E3C]"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* HEADER */}
        <div className="hidden lg:flex justify-between items-start mb-4 flex-shrink-0">
          <div>
            <h1 className={cn("text-3xl font-extrabold font-serif tracking-tight leading-none mb-1 transition-colors duration-300", themeTextPrimary)}>
              Create something new
            </h1>
            <p className={cn("text-xs font-semibold opacity-90 flex items-center gap-1.5 transition-colors duration-300", themeTextSecondary)}>
              Share your moments, your way <Sparkles className={cn("h-3.5 w-3.5 stroke-[2]", isDark ? "fill-[#D2C5B4]/10 text-[#D2C5B4]" : "fill-[#8B5E3C]/10 text-[#8B5E3C]")} />
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95 flex-shrink-0",
              isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
            )}
            aria-label="Close Creator Workspace"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* MEDIA SWITCHER TABS */}
        <div className={cn(
          "grid grid-cols-3 rounded-[16px] lg:rounded-[20px] p-1.5 mb-3 lg:mb-4 w-full max-w-none lg:max-w-lg border flex-shrink-0 transition-colors duration-300",
          isDark ? "bg-[#140C09] border-[#3D2A1F]/30" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/8"
        )}>
          {mediaTypes.map((type) => {
            const isActive = mediaType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setMediaType(type.id);
                  clearSelected();
                }}
                className={cn(
                  "relative flex items-center justify-center gap-2 py-2 lg:py-2.5 rounded-[12px] lg:rounded-[16px] text-xs font-bold transition-all duration-300",
                  isActive
                    ? (isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-[#FFFDF9]")
                    : (isDark ? "text-[#D2C5B4]/80 hover:bg-[#3D2A1F]/30 hover:text-[#F5F0E8]" : "text-[#8B5E3C]/80 hover:bg-[#8B5E3C]/6 hover:text-[#5A3A22]")
                )}
              >
                <type.icon className="h-4 w-4 stroke-[2.2]" />
                <span>{type.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center scale-90"
                    style={{ backgroundColor: "#FFFDF9" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  >
                    <Check className="h-2 w-2 stroke-[3.5] text-[#8B5E3C]" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* DOUBLE COLUMN CREATION WORKSPACE */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 lg:gap-6 items-stretch flex-1 min-h-0 mb-2 lg:mb-4 overflow-hidden pr-0">

          {/* LEFT SIDE: Media Upload Card */}
          <div className={cn(
            "border rounded-[20px] lg:rounded-[24px] p-3 lg:p-5 flex flex-col justify-between flex-[1] min-h-[90px] max-h-[170px] lg:h-full lg:min-h-0 lg:max-h-none overflow-hidden transition-colors duration-300 flex-shrink-1",
            themeCard, themeBorder, themeTextPrimary
          )}>
            <div className="flex-1 flex flex-col justify-center items-center min-h-0 overflow-hidden w-full">
              <AnimatePresence mode="wait">
                {previewUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={cn(
                      "w-full h-full relative rounded-[16px] overflow-hidden border flex items-center justify-center max-h-full",
                      themeBorder, isDark ? "bg-[#1F140E]/20" : "bg-[#F2E8DC]/10"
                    )}
                  >
                    {mediaType === "reel" ? (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={clearSelected}
                      className={cn(
                        "absolute top-3 right-3 rounded-full p-1.5 border transition-colors active:scale-95",
                        isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#D2C5B4] hover:bg-[#1F140E]" : "bg-[#FFFDF9] border-[#8B5E3C]/12 text-[#8B5E3C] hover:bg-[#F2E8DC]"
                      )}
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </motion.div>
                ) : (
                  <label
                    className={cn(
                      "w-full h-full border border-dashed rounded-[16px] lg:rounded-[20px] flex flex-col items-center justify-center cursor-pointer p-3 lg:p-4 transition-colors group min-h-0",
                      isDark ? "border-[#3D2A1F]/60 bg-[#2A1D16]/10 hover:border-[#D2C5B4]/50" : "border-[#8B5E3C]/20 bg-[#F2E8DC]/5 hover:border-[#8B5E3C]/40"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center flex-shrink-1 min-h-0 scale-90 lg:scale-100">
                      <div className="relative mb-2">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-[#3D2A1F] text-[#D2C5B4]" : "bg-[#8B5E3C]/10 text-[#8B5E3C]")}>
                          <Plus className="h-5 w-5 stroke-[3]" />
                        </div>
                      </div>
                      <span className={cn("text-xs font-extrabold tracking-tight mb-0.5", themeTextPrimary)}>
                        Add a {mediaType === "reel" ? "video" : "photo"}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 mt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }}
                        className={cn(
                          "border rounded-[12px] py-1 px-3 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1",
                          isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#D2C5B4] hover:bg-[#1F140E]" : "bg-[#FFFDF9] border-[#8B5E3C]/12 text-[#8B5E3C] hover:bg-[#F2E8DC]"
                        )}
                      >
                        <Image className="h-3 w-3 stroke-[2.2]" />
                        Gallery
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }}
                        className={cn(
                          "border rounded-[12px] py-1 px-3 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1",
                          isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#D2C5B4] hover:bg-[#1F140E]" : "bg-[#FFFDF9] border-[#8B5E3C]/12 text-[#8B5E3C] hover:bg-[#F2E8DC]"
                        )}
                      >
                        <Camera className="h-3 w-3 stroke-[2.2]" />
                        Camera
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={mediaType === "reel" ? "video/*" : "image/*"}
                      hidden
                      onChange={(e) =>
                        e.target.files && handleFileSelect(e.target.files[0])
                      }
                    />
                  </label>
                )}
              </AnimatePresence>
            </div>

            {/* PREVIEWS & THUMBNAILS ROW */}
            <div className={cn("hidden lg:flex mt-3 pt-3 border-t items-center gap-3 overflow-x-auto min-h-[48px] flex-shrink-0 scrollbar-none", themeBorder)}>
              {previewUrl && (
                <div className={cn("relative w-10 h-10 rounded-[12px] overflow-hidden border flex-shrink-0 group", themeBorder)}>
                  {mediaType === "reel" ? (
                    <video src={previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview small" />
                  )}
                  <button
                    onClick={clearSelected}
                    className="absolute inset-0 bg-[#5A3A22]/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-[#FFFDF9] stroke-[2.5]" />
                  </button>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={Boolean(previewUrl)}
                className={cn(
                  "w-10 h-10 rounded-[12px] border border-dashed flex items-center justify-center transition-colors flex-shrink-0",
                  isDark ? "border-[#3D2A1F]/60 text-[#D2C5B4] hover:bg-[#2A1D16]/50" : "border-[#8B5E3C]/30 text-[#8B5E3C] hover:bg-[#F2E8DC]/20",
                  previewUrl && "opacity-40 cursor-not-allowed"
                )}
              >
                <Plus className="h-4 w-4 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Caption Editor & AI Generator */}
          <div className="flex flex-col gap-2.5 flex-[1.4] min-h-[150px] lg:h-full lg:min-h-0 overflow-hidden pb-0">

            {/* Caption Card */}
            <div className={cn(
              "border rounded-[20px] lg:rounded-[24px] p-3 flex flex-col justify-between flex-1 min-h-[70px] max-h-[110px] lg:h-auto lg:min-h-0 lg:max-h-none overflow-hidden transition-colors duration-300",
              themeCard, themeBorder, themeTextPrimary
            )}>
              <div className="flex flex-col justify-start h-full min-h-0 relative">
                <div className="flex justify-between items-center mb-0.5 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", themeTextSecondary)}>Caption</span>
                  <span className={cn("text-[10px] font-semibold", themeTextSecondary)}>{caption.length}/2200</span>
                </div>

                {/* TEXTAREA CONTAINER */}
                <div className={cn("relative flex-1 min-h-0 border rounded-[12px] p-2 bg-transparent", themeBorder)}>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption that describes your vibe..."
                    style={{ background: "transparent" }}
                    className={cn(
                      "w-full h-full text-xs bg-transparent border-none outline-none focus:ring-0 resize-none pr-8 font-sans overflow-hidden transition-colors duration-300",
                      themeTextPrimary,
                      isDark ? "placeholder-[#D2C5B4]/30" : "placeholder-[#8B5E3C]/40"
                    )}
                    disabled={isSharing}
                  />
                  {/* Inline AI and Emoji Buttons */}
                  <div className="absolute right-1 bottom-1 flex flex-col gap-1 p-0.5">
                    <button
                      onClick={() => setShowAIPrompt(true)}
                      className={cn("p-1 rounded-full hover:bg-[#8B5E3C]/20 transition-colors lg:hidden flex items-center justify-center", isDark ? "bg-[#3D2A1F] text-[#D2C5B4]" : "bg-[#8B5E3C]/10 text-[#8B5E3C]")}
                    >
                      <Sparkles className="h-3 w-3 stroke-[2]" />
                    </button>
                    <button className={cn("p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity", themeTextSecondary)}>
                      <Smile className="h-3.5 w-3.5 stroke-[2]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* HELPER ROW ACTIONS - BELOW CAPTION ON MOBILE */}
            <div className="flex flex-wrap gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCaption((prev) => prev + " #")}
                className={cn(
                  "border rounded-full py-1 px-3 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1",
                  isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#D2C5B4] hover:bg-[#1F140E]" : "bg-[#FFFDF9] border-[#8B5E3C]/12 text-[#8B5E3C] hover:bg-[#F2E8DC]"
                )}
              >
                <Tag className="h-3 w-3 stroke-[2] text-[#8B5E3C] dark:text-[#D2C5B4]" />
                Tags
              </button>
              <button
                type="button"
                onClick={() => setShowLocationInput(!showLocationInput)}
                className={cn(
                  "border rounded-full py-1 px-3 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1",
                  isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#D2C5B4] hover:bg-[#1F140E]" : "bg-[#FFFDF9] border-[#8B5E3C]/12 text-[#8B5E3C] hover:bg-[#F2E8DC]"
                )}
              >
                <MapPin className="h-3 w-3 stroke-[2] text-[#8B5E3C] dark:text-[#D2C5B4]" />
                Location
              </button>
              <button
                type="button"
                onClick={() => setCaption((prev) => prev + " @")}
                className={cn(
                  "border rounded-full py-1 px-3 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1",
                  isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#D2C5B4] hover:bg-[#1F140E]" : "bg-[#FFFDF9] border-[#8B5E3C]/12 text-[#8B5E3C] hover:bg-[#F2E8DC]"
                )}
              >
                <AtSign className="h-3 w-3 stroke-[2] text-[#8B5E3C] dark:text-[#D2C5B4]" />
                Mention
              </button>
            </div>

            {/* LOCATION SLIDE DOWN INPUT */}
            <AnimatePresence>
              {showLocationInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className={cn("flex items-center gap-2 p-1.5 border rounded-[10px]", themeBorder, isDark ? "bg-[#1F140E]/20" : "bg-[#F2E8DC]/30")}>
                    <MapPin className="h-3 w-3 flex-shrink-0 text-[#8B5E3C] dark:text-[#D2C5B4]" />
                    <input
                      type="text"
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
                      placeholder="e.g. Paris, France"
                      style={{ background: "transparent" }}
                      className={cn("w-full bg-transparent text-xs outline-none placeholder-[#8B5E3C]/50 font-medium", themeTextPrimary)}
                    />
                    {locationValue && (
                      <button onClick={() => setLocationValue("")}>
                        <X className="h-3 w-3 text-[#8B5E3C] hover:text-[#5A3A22] dark:text-[#D2C5B4]" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* REEL CATEGORY SELECTION (IF REEL) */}
            {mediaType === "reel" && (
              <div className={cn("pt-1.5 border-t flex-shrink-0", themeBorder)}>
                <label className={cn("text-[9px] font-bold uppercase tracking-wider block mb-1", themeTextSecondary)}>Reel Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={cn("w-full py-1 px-2 border rounded-[10px] text-xs font-semibold outline-none focus:border-[#8B5E3C] transition-colors", themeCard, themeBorder, themeTextPrimary)}
                >
                  <option value="">Select Category</option>
                  {reelCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* AUDIENCE SELECTOR */}
            <div className={cn("pt-1.5 border-t relative flex-shrink-0", themeBorder)}>
              <span className={cn("text-[9px] font-bold uppercase tracking-wider block mb-1", themeTextSecondary)}>Audience</span>
              <button
                type="button"
                onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
                className={cn(
                  "w-full border rounded-[12px] p-1.5 flex items-center justify-between text-left transition-colors",
                  isDark ? "bg-[#1F140E]/20 hover:bg-[#1F140E]/40 border-[#3D2A1F]" : "bg-[#F2E8DC]/10 hover:bg-[#F2E8DC]/20 border-[#E3D8C8]"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", isDark ? "bg-[#3D2A1F] text-[#D2C5B4]" : "bg-[#8B5E3C]/10 text-[#8B5E3C]")}>
                    <Globe className="h-3 w-3" />
                  </div>
                  <div>
                    <p className={cn("text-[11px] font-bold leading-tight", themeTextPrimary)}>
                      {visibility === "public" ? "Public" : "Private"}
                    </p>
                    <p className={cn("text-[9px] font-semibold leading-none mt-0.5", themeTextSecondary)}>
                      {visibility === "public" ? "Anyone on or off Vibe" : "Only your followers"}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-[#8B5E3C] dark:text-[#D2C5B4]" />
              </button>

              <AnimatePresence>
                {showAudienceDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={cn("absolute z-10 left-0 right-0 mt-1 border rounded-[12px] overflow-hidden", themeCard, themeBorder)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setVisibility("public");
                        setShowAudienceDropdown(false);
                      }}
                      className={cn("w-full px-4 py-2 hover:bg-[#F2E8DC]/30 text-left border-b flex items-center justify-between", themeBorder)}
                    >
                      <div>
                        <p className={cn("text-xs font-bold", themeTextPrimary)}>Public</p>
                        <p className={cn("text-[9px] font-semibold text-[#8B5E3C]")}>Anyone on or off Vibe</p>
                      </div>
                      {visibility === "public" && <Check className={cn("h-3.5 w-3.5", themeTextSecondary)} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVisibility("private");
                        setShowAudienceDropdown(false);
                      }}
                      className="w-full px-4 py-2 hover:bg-[#F2E8DC]/30 text-left flex items-center justify-between"
                    >
                      <div>
                        <p className={cn("text-xs font-bold", themeTextPrimary)}>Private</p>
                        <p className={cn("text-[9px] font-semibold text-[#8B5E3C]")}>Only your followers</p>
                      </div>
                      {visibility === "private" && <Check className={cn("h-3.5 w-3.5", themeTextSecondary)} />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* POST SETTING TOGGLES */}
            <div className={cn("pt-1.5 border-t space-y-1.5 flex-shrink-0", themeBorder)}>
              {[
                { label: "Allow comments", state: allowComments, setter: setAllowComments, icon: MessageSquare },
                { label: "Allow likes", state: allowLikes, setter: setAllowLikes, icon: Heart },
                { label: "Share to feed", state: shareToFeed, setter: setShareToFeed, icon: Share2 },
              ].map((toggle) => (
                <div key={toggle.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                     <toggle.icon className="h-3.5 w-3.5 text-[#8B5E3C]/60 dark:text-[#D2C5B4]/60" />
                     <span className={cn("text-[11px] font-bold leading-none", themeTextPrimary)}>{toggle.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle.setter(!toggle.state)}
                    className={cn(
                      "w-8 h-4.5 rounded-full relative p-0.5 transition-colors duration-200 focus:outline-none flex items-center",
                      toggle.state ? (isDark ? "bg-[#E8AC7D]" : "bg-[#8B5E3C]") : "bg-[#C8B9A6]/30"
                    )}
                  >
                    <div
                      className={cn("w-3.5 h-3.5 rounded-full transition-transform duration-200 bg-white")}
                      style={{ transform: toggle.state ? "translateX(14px)" : "translateX(0px)" }}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* AI Generator Card */}
            <div className={cn("hidden lg:flex border rounded-[16px] lg:rounded-[24px] p-2.5 lg:p-3.5 flex-col justify-between overflow-hidden relative flex-shrink-0", themeBorder, isDark ? "bg-[#1F140E]/40" : "bg-[#F2E8DC]/20")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", isDark ? "bg-[#3D2A1F] text-[#D2C5B4]" : "bg-[#8B5E3C]/8 text-[#8B5E3C]")}>
                  <Sparkles className="h-4 w-4 stroke-[2]" />
                </div>
                <div className="flex-1">
                  <h4 className={cn("text-xs font-bold", themeTextPrimary)}>Let AI write for you</h4>
                  <p className={cn("text-[10px] font-semibold leading-tight", themeTextSecondary)}>Get the perfect caption with Vibe AI</p>
                </div>
                {!showAIPrompt && (
                  <button
                    type="button"
                    onClick={() => setShowAIPrompt(true)}
                    className={cn(
                      "text-[10px] font-bold rounded-[10px] py-1.5 px-3.5 transition-all duration-200 flex-shrink-0",
                      isDark ? "bg-[#3D2A1F] text-[#F5F0E8] hover:bg-[#3D2A1F]/80" : "bg-[#8B5E3C] text-[#FFFDF9] hover:bg-[#8B5E3C]/90"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate
                  </button>
                )}
              </div>

              {/* SLIDEOUT AI PROMPT INPUT */}
              <AnimatePresence>
                {showAIPrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn("mt-2.5 pt-2 border-t space-y-2 overflow-hidden", themeBorder)}
                  >
                    <p className={cn("text-[9px] font-bold uppercase tracking-wider", themeTextSecondary)}>Describe your post topic</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="e.g. sunset at the beach"
                        style={{ background: isDark ? "#2A1D16" : "#FFFDF9" }}
                        className={cn("flex-1 p-1.5 border rounded-[8px] text-[11px] placeholder-[#8B5E3C]/40 outline-none font-medium", themeCard, themeBorder, themeTextPrimary)}
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAICaption}
                        disabled={isGeneratingAI || !aiTopic.trim()}
                        className={cn(
                          "text-[10px] font-bold px-3 rounded-[8px] transition-colors flex items-center justify-center",
                          isDark ? "bg-[#3D2A1F] text-[#F5F0E8] disabled:opacity-40" : "bg-[#8B5E3C] text-[#FFFDF9] disabled:opacity-40"
                        )}
                      >
                        {isGeneratingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : "Go"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAIPrompt(false)}
                      className={cn("text-[9px] font-bold block mt-0.5 text-left", themeTextSecondary)}
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION BAR - STRICTLY CONSTRAINED */}
        <div className={cn("flex items-center justify-between p-3 border-t lg:border-0 lg:border-t flex-shrink-0 transition-colors duration-300 mt-2 lg:mt-0 rounded-[20px] lg:rounded-none",
          themeCard, themeBorder
        )}>
          <button
            type="button"
            onClick={handleSaveDraft}
            className={cn(
              "border rounded-[12px] lg:rounded-[14px] py-2 lg:py-2.5 px-4 lg:px-4.5 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5",
              isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#FFFDF9] border-[#8B5E3C]/15 text-[#8B5E3C]"
            )}
          >
            <Save className="h-3.5 w-3.5 stroke-[2]" />
            Save Draft
          </button>

          <div className={cn(
            "flex items-center gap-1 rounded-[12px] lg:rounded-[14px] group hover:scale-[1.01] active:scale-95 transition-all duration-200",
            isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-[#FFFDF9]"
          )}>
            <button
              type="button"
              onClick={handleShare}
              disabled={!canShare || isSharing}
              className="py-2 lg:py-2.5 px-4 lg:px-5 text-xs font-bold flex items-center gap-1.5"
            >
              {isSharing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 stroke-[2]" />
                  {mediaType === "story" ? "Share to Story" : mediaType === "reel" ? "Share Reel" : "Share Vibe"}
                </>
              )}
            </button>
            <div className={cn("w-[1px] h-4 lg:h-5", "bg-[#FFFDF9]/20", isDark ? "lg:bg-[#F5F0E8]/20" : "bg-[#FFFDF9]/20")} />
            <button className={cn("py-2 lg:py-2.5 px-2 flex items-center justify-center rounded-r-[12px] lg:rounded-r-[14px]", "hover:bg-[#FFFDF9]/10", isDark ? "lg:hover:bg-[#F5F0E8]/10" : "lg:hover:bg-[#FFFDF9]/10")} aria-label="More options">
              <ChevronRight className="h-3.5 w-3.5 rotate-90 stroke-[2.2]" />
            </button>
          </div>
        </div>

      </Card>

      {/* ========================================================
          2. RIGHT SIDEBAR: Creator recommendations (Column 3)
          ======================================================== */}
      <div className="hidden xl:flex w-[320px] flex-shrink-0 flex-col justify-between h-full overflow-hidden select-none">

        {/* Creator Tips card */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-4 relative overflow-hidden text-left flex-1 my-4 flex flex-col justify-center min-h-0 transition-colors duration-300",
          themeCard, themeBorder
        )}>
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", themeTextPrimary)}>Create better with Vibe</h3>
            <Lightbulb className={cn("h-4 w-4 stroke-[2] flex-shrink-0", themeTextSecondary)} />
          </div>
          <ul className={cn("space-y-1.5 text-xs font-semibold leading-relaxed flex-1 flex flex-col justify-center min-h-0", themeTextPrimary)}>
            <li className="flex items-start gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", isDark ? "bg-[#D2C5B4]" : "bg-[#8B5E3C]")} />
              <span>Use high quality photos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", isDark ? "bg-[#D2C5B4]" : "bg-[#8B5E3C]")} />
              <span>Good lighting works best</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", isDark ? "bg-[#D2C5B4]" : "bg-[#8B5E3C]")} />
              <span>Tell your story in the caption</span>
            </li>
          </ul>
        </Card>

        {/* Beautiful quote card */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-5 min-h-[135px] flex flex-col justify-between relative text-left flex-shrink-0 transition-colors duration-300",
          themeCard, themeBorder
        )}>
          <div>
            <span className={cn("font-serif text-3xl leading-none select-none block h-3", isDark ? "text-[#D2C5B4]/20" : "text-[#8B5E3C]/20")}>“</span>
            <p className={cn("font-serif text-base italic font-bold leading-normal mt-1 pr-4 relative z-2", themeTextPrimary)}>
              Your vibe attracts your tribe.
            </p>
          </div>
          <div className="flex justify-between items-center mt-3 relative z-2">
            <span className={cn("text-[9px] font-bold uppercase tracking-widest opacity-75", themeTextSecondary)}>— Vibe</span>
          </div>
          <MountainSketch isDark={isDark} />
        </Card>

      </div>

      {/* PROCESSING OVERLAY */}
      <AnimatePresence>
        {isSharing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-50 backdrop-blur-[4px] flex flex-col items-center justify-center gap-4 text-center", isDark ? "bg-[#1F140E]/60" : "bg-[#5A3A22]/40")}
          >
            <div className={cn("border p-8 rounded-[24px] flex flex-col items-center max-w-sm", themeCard, themeBorder)}>
              <Loader2 className={cn("h-10 w-10 animate-spin mb-4", themeTextSecondary)} />
              <h2 className={cn("text-xl font-bold font-serif mb-1", themeTextPrimary)}>
                Publishing Vibe
              </h2>
              <p className={cn("text-xs font-semibold mb-4", themeTextSecondary)}>
                Please wait while we upload your media assets...
              </p>
              <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isDark ? "bg-[#1F140E]" : "bg-[#F2E8DC]")}>
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "90%" }}
                  transition={{ duration: 6, ease: "easeOut" }}
                  className={cn("h-full", isDark ? "bg-[#D2C5B4]" : "bg-[#8B5E3C]")}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
