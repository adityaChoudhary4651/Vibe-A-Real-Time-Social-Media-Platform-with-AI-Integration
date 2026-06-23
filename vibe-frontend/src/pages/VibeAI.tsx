import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Hash, Lightbulb, MessageSquare, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
function ResultCard({ result, type }: { result: string; type: VibeAIType }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Format post ideas as a list
  const lines = result.split("\n").filter(Boolean);
  const isList = type === "postIdea" && lines.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative mt-6 rounded-2xl bg-secondary/60 border border-border p-5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          AI Generated
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 w-8 rounded-full hover:bg-primary/10"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {isList ? (
        <ul className="space-y-2.5">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground">{line.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground leading-relaxed">{result}</p>
      )}
    </motion.div>
  );
}

/* =====================
   MAIN PAGE
===================== */
export default function VibeAI() {
  const [activeTool, setActiveTool] = useState<VibeAIType>("caption");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4"
          >
            <Sparkles className="h-3 w-3" />
            Powered by Google Gemini AI
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2"
          >
            Vibe AI{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Creator Assistant
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm lg:text-base"
          >
            Generate captions, hashtags, post ideas, and comments with AI — instantly.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 space-y-6">
        {/* Tool Selector Cards */}
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleToolChange(tool.id)}
                className={cn(
                  "relative flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all duration-200 overflow-hidden",
                  isActive
                    ? "border-primary/60 bg-primary/8 shadow-md shadow-primary/10"
                    : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="toolHighlight"
                    className="absolute inset-0 bg-primary/5 rounded-2xl"
                  />
                )}
                <div
                  className={cn(
                    "relative h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    tool.color
                  )}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="relative">
                  <p className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                    {tool.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Input Area */}
        <motion.div
          key={activeTool}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl bg-card border border-border p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = currentTool.icon;
              return (
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br", currentTool.color)}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              );
            })()}
            <div>
              <p className="text-sm font-semibold">{currentTool.label}</p>
              <p className="text-[11px] text-muted-foreground">{currentTool.description}</p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
            placeholder={currentTool.placeholder}
            rows={3}
            className="w-full resize-none rounded-xl bg-secondary/50 border border-border p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none transition-all duration-200"
          />

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 font-bold text-sm transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
                <span className="ml-2 text-xs opacity-60 font-normal hidden sm:inline">(⌘ + Enter)</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && <ResultCard key={result} result={result} type={activeTool} />}
        </AnimatePresence>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-secondary/30 border border-border/50 p-4"
        >
          <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Tips for better results</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Be specific: "Sunset on Santorini beach with golden light" works better than "beach"</li>
            <li>• For hashtags, include your niche and style</li>
            <li>• Regenerate multiple times for different variations</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
