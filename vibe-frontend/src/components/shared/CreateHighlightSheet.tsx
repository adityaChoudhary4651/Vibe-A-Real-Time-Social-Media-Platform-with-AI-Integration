import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type StoryPick = {
  id: string;
  title: string;
  timestamp: string;
};

const mockStories: StoryPick[] = [
  { id: "s1", title: "Beach sunset", timestamp: "2d ago" },
  { id: "s2", title: "Coffee run", timestamp: "3d ago" },
  { id: "s3", title: "Studio day", timestamp: "5d ago" },
  { id: "s4", title: "Weekend hike", timestamp: "1w ago" },
];

export function CreateHighlightSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const canCreate = name.trim().length > 0 && selectedCount > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0">
        <div className="p-4 space-y-4">
          <SheetHeader>
            <SheetTitle>Create Highlight</SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Travels"
            />
            <p className="text-xs text-muted-foreground">
              Select stories to include (mock selection).
            </p>
          </div>

          <div className="space-y-2">
            {mockStories.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-3"
              >
                <Checkbox
                  checked={!!selected[s.id]}
                  onCheckedChange={(v) =>
                    setSelected((prev) => ({ ...prev, [s.id]: Boolean(v) }))
                  }
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.timestamp}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!canCreate}
              onClick={() => {
                // UI-only: pretend we created it, then close.
                setName("");
                setSelected({});
                onOpenChange(false);
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
