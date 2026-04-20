import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStories, deleteStory } from "@/api/stories";
import { BackendStory, StoryGroup } from "@/types/story";
import { useAuth } from "@/contexts/AuthContext";
import { StoryViewer } from "@/components/shared/StoryViewer";
import { AddStorySheet } from "@/components/shared/AddStorySheet";
import { toast } from "sonner";

export function StoriesBar() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const [activeStories, setActiveStories] =
    useState<BackendStory[] | null>(null);
  const [activeOwnerId, setActiveOwnerId] =
    useState<string | null>(null);
  const [showAddStory, setShowAddStory] = useState(false);

  const { data = [] } = useQuery<StoryGroup[]>({
    queryKey: ["stories"],
    queryFn: () => fetchStories(token!),
    enabled: !!token,
  });

  return (
    <>
      {/* STORIES BAR */}
      <div className="flex gap-5 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* ADD STORY */}
        <button
          onClick={() => setShowAddStory(true)}
          className="flex flex-col items-center min-w-[72px]"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-2xl text-zinc-400">+</span>
            </div>
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-black">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>
          <span className="text-xs mt-1 text-zinc-400">Add story</span>
        </button>

        {/* USER STORIES */}
        {data.map((group) => (
          <button
            key={group.user._id}
            onClick={() => {
              setActiveStories(group.stories);
              setActiveOwnerId(group.user._id);
            }}
            className="flex flex-col items-center min-w-[72px]"
          >
            <div className="p-[2px] rounded-full border-2 border-blue-500">
              <img
                src={group.user.avatar || "/avatar.png"}
                alt="avatar"
                className="h-16 w-16 rounded-full object-cover"
              />
            </div>
            <span className="text-xs mt-1 text-zinc-300 truncate w-16 text-center">
              {group.user.username}
            </span>
          </button>
        ))}
      </div>

      {/* STORY VIEWER */}
      {activeStories && (
        <StoryViewer
          stories={activeStories}
          canDelete={activeOwnerId === (user?._id || user?.id)}
          onDelete={async (storyId) => {
            try {
              await deleteStory(storyId, token!);
              toast.success("Story deleted");
              setActiveStories(null);
              queryClient.invalidateQueries({ queryKey: ["stories"] });
            } catch {
              toast.error("Failed to delete story");
            }
          }}
          onClose={() => setActiveStories(null)}
        />
      )}

      {/* ADD STORY SHEET */}
      <AddStorySheet
        open={showAddStory}
        onOpenChange={setShowAddStory}
        onStoryAdded={() =>
          queryClient.invalidateQueries({ queryKey: ["stories"] })
        }
      />
    </>
  );
}
