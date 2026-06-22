import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { updateCommunity } from "@/api/community";
import { resolveUrl } from "@/config";

interface CommunitySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: {
    _id: string;
    name: string;
    description: string;
    avatar: string;
  };
  onUpdate?: (updated: any) => void;
}

export function CommunitySettingsModal({ open, onOpenChange, community, onUpdate }: CommunitySettingsModalProps) {
  const [description, setDescription] = useState(community.description);
  const [imagePreview, setImagePreview] = useState<string | undefined>(community.avatar);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDescription(community.description);
      setImagePreview(community.avatar);
    }
  }, [open, community]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const updated = await updateCommunity(community._id, {
        description,
        avatar: imagePreview,
      });
      onUpdate?.(updated);
      toast.success("Community settings updated!");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update community settings");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Community Settings
          </DialogTitle>
          <DialogDescription>
            Update your community's presence and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Community image */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={resolveUrl(imagePreview)} />
                <AvatarFallback className="text-3xl bg-secondary">
                  {community.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary font-medium"
            >
              Change community image
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Community Name</label>
            <p className="text-lg font-bold">{community.name}</p>
            <p className="text-[10px] text-muted-foreground italic">Name cannot be changed</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your community about?"
              className="w-full min-h-[100px] p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground transition-all duration-200 outline-none text-sm"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{description?.length || 0}/200</p>
          </div>

          {/* Update button */}
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full bg-white text-black hover:bg-white/90 rounded-full shadow-glow-lg h-12 text-base font-bold transition-all"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
