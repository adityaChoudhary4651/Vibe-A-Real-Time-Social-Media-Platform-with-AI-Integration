import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: {
    username: string;
    name: string;
    bio: string;
    avatar?: string;
  };
  onSave: (data: { name: string; bio: string }) => Promise<void>;
}

export function EditProfileModal({
  open,
  onOpenChange,
  currentUser,
  onSave,
}: EditProfileModalProps) {
  const { token } = useAuth();

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ======================
     AVATAR UPLOAD (REAL)
  ====================== */
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append("avatar", file); // 🔥 MUST be "avatar"

      const res = await axios.put(
        "http://localhost:5000/api/users/me/avatar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAvatar(res.data.avatar);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to update profile photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ======================
     SAVE NAME + BIO
  ====================== */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({ name, bio });
      toast.success("Profile updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* AVATAR */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-2xl">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary font-medium"
              disabled={uploadingAvatar}
            >
              Change profile photo
            </button>
          </div>

          {/* NAME */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* BIO */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full min-h-[100px] p-3 rounded-xl bg-secondary/50 border border-border resize-none text-sm"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/150
            </p>
          </div>

          {/* SAVE */}
          <Button
            onClick={handleSave}
            disabled={isSaving || uploadingAvatar}
            size="lg"
            className=" w-full
                       bg-primary text-primary-foreground
                       hover:bg-primary/90
                       shadow-md
                        ">

            {isSaving ? (
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
