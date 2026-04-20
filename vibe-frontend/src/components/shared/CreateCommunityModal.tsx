import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (data: { name: string; description: string; image?: string }) => void;
}

export function CreateCommunityModal({ open, onOpenChange, onCreate }: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a community name");
      return;
    }
    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onCreate?.({ name, description, image: imagePreview });
    setIsCreating(false);
    toast.success(`Community "${name}" created!`);
    onOpenChange(false);
    setName("");
    setDescription("");
    setImagePreview(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Create Community
          </DialogTitle>
          <DialogDescription>
            Start a new community and invite others to join
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Community image */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imagePreview} />
                <AvatarFallback className="text-2xl bg-secondary">
                  {name ? name.charAt(0).toUpperCase() : <Users className="h-8 w-8 text-muted-foreground" />}
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
              Add community image
            </button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Community Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Photography Lovers"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your community about?"
              className="w-full min-h-[80px] p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground transition-all duration-200 outline-none text-sm"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/200</p>
          </div>

          {/* Create button */}
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="w-full bg-white text-black hover:bg-white/90 rounded-full shadow-glow-lg h-12 text-base font-bold transition-all"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Community"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}