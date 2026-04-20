import api from "@/lib/axios";

export type VibeAIType = "caption" | "hashtags" | "postIdea" | "comment";

export async function generateVibeAIContent(type: VibeAIType, prompt: string): Promise<string> {
  const res = await api.post("/vibe-ai", { type, prompt });
  return res.data.result;
}
