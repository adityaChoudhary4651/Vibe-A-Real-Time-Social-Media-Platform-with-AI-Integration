import { StoryGroup } from "@/types/story";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/api/stories`;

/* ======================
   FETCH STORIES
====================== */
export async function fetchStories(token: string): Promise<StoryGroup[]> {
  const res = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch stories");
  }

  return res.json();
}

/* ======================
   UPLOAD STORY
====================== */
export async function uploadStory(file: File, token: string) {
  const formData = new FormData();
  formData.append("media", file); // 🔒 MUST MATCH uploadStory.single("media")

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Story upload failed");
  }

  return res.json();
}

/* ======================
   DELETE STORY
====================== */
export async function deleteStory(storyId: string, token: string) {
  const res = await fetch(`${API_URL}/${storyId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete story");
  }

  return res.json();
}
