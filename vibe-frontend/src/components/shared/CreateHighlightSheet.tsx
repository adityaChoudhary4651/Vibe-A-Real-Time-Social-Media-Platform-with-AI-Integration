import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { fetchStories } from "@/api/stories";
import { createHighlight } from "@/api/highlights";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type StoryPick = {
  id: string;
  title: string;
  timestamp: string;
  mediaUrl: string;
};

export function CreateHighlightSheet({
  open,
  onOpenChange,
  onHighlightCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHighlightCreated?: () => void;
}) {
  const { token, user } = useAuth();
  const [name, setName] = useState("");
  const [stories, setStories] = useState<StoryPick[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && token && user) {
      setLoading(true);
      fetchStories(token)
        .then((groups) => {
          const myUserId = user.id || (user as any)._id;
          const myGroup = groups.find((g) => String(g.user._id) === String(myUserId));
          if (myGroup) {
            const list = myGroup.stories.map((s) => ({
              id: s._id,
              title: s.mediaType === "video" ? "Video Story" : "Photo Story",
              timestamp: new Date(s.createdAt).toLocaleDateString() + " " + new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              mediaUrl: s.mediaUrl,
            }));
            setStories(list);
          } else {
            setStories([]);
          }
        })
        .catch(() => {
          toast.error("Failed to load stories");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, token, user]);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const canCreate = name.trim().length > 0 && selectedCount > 0 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const selectedIds = Object.keys(selected).filter((key) => selected[key]);
      await createHighlight(name.trim(), selectedIds);
      toast.success("Highlight created!");
      setName("");
      setSelected({});
      onOpenChange(false);
      onHighlightCreated?.();
    } catch {
      toast.error("Failed to create highlight");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0">
        <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Highlight</SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Travels"
              disabled={creating}
            />
            <p className="text-xs text-muted-foreground">
              Select your active stories to group into this highlight.
            </p>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : stories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No active stories to select from. Upload a story first!
              </p>
            ) : (
              stories.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
                >
                  <Checkbox
                    checked={!!selected[s.id]}
                    onCheckedChange={(v) =>
                      setSelected((prev) => ({ ...prev, [s.id]: Boolean(v) }))
                    }
                    disabled={creating}
                  />
                  <img
                    src={s.mediaUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover bg-muted flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.timestamp}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!canCreate}
              onClick={handleCreate}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
