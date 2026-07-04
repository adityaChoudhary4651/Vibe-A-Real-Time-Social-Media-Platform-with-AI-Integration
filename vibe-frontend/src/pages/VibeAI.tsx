import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Hash, Lightbulb, MessageSquare, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { generateVibeAIContent, type VibeAIType } from "@/api/vibeAI";
import { cn } from "@/lib/utils";

/* =====================
   TOOL DEFINITIONS
   ===================== */
const tools: {
  id: VibeAIType;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  description: string;
  color: string;
}[] = [
  {
    id: "caption",
    label: "Caption Generator",
    icon: Wand2,
    placeholder: "Describe your post... e.g. Sunset at the beach",
    description: "Generate a catchy social media caption",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "hashtags",
    label: "Hashtag Generator",
    icon: Hash,
    placeholder: "Enter your topic... e.g. fitness workout",
    description: "Get 10 trending hashtags for your post",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "postIdea",
    label: "Post Idea Generator",
    icon: Lightbulb,
    placeholder: "Enter a content theme... e.g. travel content",
    description: "Discover 5 creative post ideas",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "comment",
    label: "Comment Generator",
    icon: MessageSquare,
    placeholder: "Describe context... e.g. friend posted gym progress",
    description: "Generate a thoughtful comment",
    color: "from-emerald-500 to-teal-500",
  },
];

/* =====================
   RESULT DISPLAY
   ===================== */
function ResultCard({
  result,
  type,
  isDark,
  themeCard,
  themeBorder,
  themeTextPrimary,
  themeTextSecondary
}: {
  result: string;
  type: VibeAIType;
  isDark: boolean;
  themeCard: string;
  themeBorder: string;
  themeTextPrimary: string;
  themeTextSecondary: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = result.split("\n").filter(Boolean);
  const isList = type === "postIdea" && lines.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className={cn(
        "relative mt-5 rounded-[20px] border p-5 transition-colors duration-300",
        unreadHighlightColor(isDark), themeBorder
      )}
    >
      <div className="flex items-center justify-between mb-3.5">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", themeTextSecondary)}>
          AI Generated
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-95",
            isDark
              ? "bg-[#1F140E]/40 border-[#3D2A1F] text-[#D2C5B4]"
              : "bg-[#F2E8DC]/40 border-[#8B5E3C]/8 text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-[#FFFDF9]"
          )}
          aria-label="Copy to Clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 stroke-[2.2]" />
          )}
        </button>
      </div>

      {isList ? (
        <ul className="space-y-3">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-3 text-xs font-semibold leading-relaxed text-left">
              <span className={cn(
                "flex-shrink-0 h-6 w-6 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5",
                isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-white"
              )}>
                {i + 1}
              </span>
              <span className={themeTextPrimary}>{line.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-xs font-semibold leading-relaxed text-left", themeTextPrimary)}>{result}</p>
      )}
    </motion.div>
  );
}

// Custom Helper colors for generated text highlights
function unreadHighlightColor(isDark: boolean) {
  return isDark ? "bg-[#3D2A1F]/30" : "bg-[#F2E8DC]/30";
}

/* =====================
   MAIN PAGE
   ===================== */
export default function VibeAI() {
  const [activeTool, setActiveTool] = useState<VibeAIType>("caption");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Nightmode theme tracking state
  const isDarkState = () => localStorage.getItem("vibe_theme") === "dark";
  const [isDark, setIsDark] = useState(isDarkState);

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

  const currentTool = tools.find((t) => t.id === activeTool)!;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const text = await generateVibeAIContent(activeTool, prompt.trim());
      setResult(text);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || "";
      let displayMsg = "Something went wrong. Please try again.";

      if (serverMsg.toLowerCase().includes("quota") || serverMsg.toLowerCase().includes("rate")) {
        displayMsg = "⚠️ API quota exceeded. Please wait a moment or generate a new Gemini API key at aistudio.google.com.";
      } else if (serverMsg.toLowerCase().includes("key") || serverMsg.toLowerCase().includes("invalid")) {
        displayMsg = "❌ Invalid API key. Please check your GEMINI_API_KEY in the backend .env file.";
      } else if (serverMsg) {
        displayMsg = serverMsg;
      }

      toast.error(displayMsg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleToolChange = (id: VibeAIType) => {
    setActiveTool(id);
    setResult(null);
    setPrompt("");
  };

  // Dynamic Theme Colors
  const themeCard = isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]";
  const themeBorder = isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]";
  const themeTextPrimary = isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]";
  const themeTextSecondary = isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]";

  return (
    <div className={cn(
      "w-full h-full flex items-center justify-center p-3 md:p-4.5 lg:p-5 overflow-hidden select-none transition-colors duration-300",
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F8F4EE] text-[#5A3A22]"
    )}>
      
      {/* Centered Vibe AI Card */}
      <Card variant="outline" className={cn(
        "w-full rounded-[24px] border p-6 flex flex-col h-full min-h-0 overflow-hidden relative transition-colors duration-300",
        themeCard, themeBorder
      )}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-5 flex-shrink-0">
          <div>
            <h1 className={cn("text-3xl font-extrabold font-serif tracking-tight leading-none mb-1.5 transition-colors duration-300", themeTextPrimary)}>
              Vibe AI{" "}
              <span className="bg-gradient-to-r from-[#8B5E3C] to-purple-400 dark:from-[#D2C5B4] dark:to-purple-300 bg-clip-text text-transparent">
                Assistant
              </span>
            </h1>
            <p className={cn("text-xs font-semibold opacity-90 transition-colors duration-300", themeTextSecondary)}>
              Generate captions, hashtags, post ideas, and comments instantly.
            </p>
          </div>

          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
            isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8]" : "bg-[#F2E8DC]/30 border-[#8B5E3C]/10 text-[#8B5E3C]"
          )}>
            <Sparkles className="h-3 w-3 animate-pulse" />
            Google Gemini AI
          </div>
        </div>

        {/* Scrollable Workspace panel */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-none">
          
          {/* Tool Selector Cards */}
          <div className="grid grid-cols-2 gap-4">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <motion.button
                  key={tool.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToolChange(tool.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-2.5 p-4 rounded-[20px] border text-left transition-all duration-300 overflow-hidden shadow-none",
                    isActive
                      ? (isDark ? "bg-[#3D2A1F] border-[#3D2A1F]" : "bg-[#F2E8DC]/60 border-[#E3D8C8]")
                      : (isDark ? "bg-transparent border-[#3D2A1F] hover:bg-[#3D2A1F]/30" : "bg-transparent border-[#E3D8C8] hover:bg-[#F2E8DC]/20")
                  )}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    tool.color
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="relative">
                    <p className={cn("text-xs font-extrabold", themeTextPrimary)}>
                      {tool.label}
                    </p>
                    <p className={cn("text-[10px] leading-tight font-semibold mt-1 opacity-80", themeTextSecondary)}>
                      {tool.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Input Area */}
          <div className={cn(
            "rounded-[20px] border p-4.5 space-y-3.5 transition-colors duration-300",
            isDark ? "bg-[#1F140E]/40 border-[#3D2A1F]" : "bg-[#F2E8DC]/10 border-[#E3D8C8]"
          )}>
            <div className="flex items-center gap-2.5">
              {(() => {
                const Icon = currentTool.icon;
                return (
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br", currentTool.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                );
              })()}
              <div className="text-left">
                <p className={cn("text-xs font-extrabold leading-none", themeTextPrimary)}>{currentTool.label}</p>
                <p className={cn("text-[10px] font-bold leading-none mt-1 opacity-70", themeTextSecondary)}>{currentTool.description}</p>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={currentTool.placeholder}
              rows={3}
              className={cn(
                "w-full resize-none rounded-xl border p-3.5 text-xs font-semibold placeholder-[#8B5E3C]/50 outline-none transition-all duration-300 shadow-none",
                isDark
                  ? "bg-[#1F140E]/40 border-[#3D2A1F] text-[#F5F0E8] focus:border-[#F5F0E8]/30"
                  : "bg-[#FFFDF9] border-[#E3D8C8] text-[#5A3A22] focus:border-[#8B5E3C]/50"
              )}
            />

            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className={cn(
                "w-full h-11 rounded-full font-bold text-xs text-white border-none shadow-none active:scale-95 disabled:opacity-40",
                isDark ? "bg-[#3D2A1F] hover:bg-[#3D2A1F]/90" : "bg-[#8B5E3C] hover:bg-[#8B5E3C]/95"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 stroke-[2.2]" />
                  Generate with AI
                  <span className="ml-1.5 opacity-65 font-normal hidden sm:inline">(⌘ + Enter)</span>
                </>
              )}
            </Button>
          </div>

          {/* Result displaying block */}
          <AnimatePresence mode="wait">
            {result && (
              <ResultCard
                key={result}
                result={result}
                type={activeTool}
                isDark={isDark}
                themeCard={themeCard}
                themeBorder={themeBorder}
                themeTextPrimary={themeTextPrimary}
                themeTextSecondary={themeTextSecondary}
              />
            )}
          </AnimatePresence>

          {/* Prompt Tips */}
          <div className={cn(
            "rounded-[16px] border p-4.5 text-left transition-colors duration-300",
            isDark ? "bg-[#1F140E]/30 border-[#3D2A1F]/60" : "bg-[#F2E8DC]/15 border-[#E3D8C8]/60"
          )}>
            <p className={cn("text-[11px] font-bold mb-2.5", themeTextPrimary)}>💡 Tips for better results</p>
            <ul className={cn("text-[10px] font-semibold space-y-1.5 opacity-80", themeTextSecondary)}>
              <li>• Be specific: "Sunset on Santorini beach with golden light" works better than "beach"</li>
              <li>• For hashtags, include your niche and style</li>
              <li>• Regenerate multiple times for different variations</li>
            </ul>
          </div>

        </div>

      </Card>
    </div>
  );
}
