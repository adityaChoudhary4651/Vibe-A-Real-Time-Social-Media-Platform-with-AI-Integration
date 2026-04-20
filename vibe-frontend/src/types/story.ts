export interface StoryUser {
  _id: string;
  username: string;
  avatar?: string;
}

export interface BackendStory {
  _id: string;
  user: StoryUser;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroup {
  user: StoryUser;
  stories: BackendStory[];
}
