import { useState, useRef, useEffect } from "react";
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
import { API_BASE_URL } from "../../config";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: {
    username: string;
    name: string;
    bio: string;
    avatar?: string;
    gender?: string;
    age?: number;
    location?: string;
    interests?: string[];
  };
  onSave: (data: {
    name: string;
    bio: string;
    gender: string;
    age: number;
    location: string;
    interests: string[];
  }) => Promise<void>;
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
  const [gender, setGender] = useState(currentUser.gender ?? "Non-binary");
  const [age, setAge] = useState(currentUser.age ?? 21);
  const [location, setLocation] = useState(currentUser.location ?? "Nearby");
  const [interestsText, setInterestsText] = useState(
    currentUser.interests ? currentUser.interests.join(", ") : "Vibe"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with currentUser when modal opens
  useEffect(() => {
    if (open) {
      setName(currentUser.name);
      setBio(currentUser.bio);
      setAvatar(currentUser.avatar ?? "");
      setGender(currentUser.gender ?? "Non-binary");
      setAge(currentUser.age ?? 21);
      setLocation(currentUser.location ?? "Nearby");
      setInterestsText(currentUser.interests ? currentUser.interests.join(", ") : "Vibe");
    }
  }, [open, currentUser]);

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axios.put(
        `${API_BASE_URL}/api/users/me/avatar`,
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const interestsArray = interestsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave({
        name,
        bio,
        gender,
        age: Number(age),
        location,
        interests: interestsArray,
      });
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* AVATAR */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-2xl">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
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
              className="text-xs text-primary font-medium"
              disabled={uploadingAvatar}
            >
              Change profile photo
            </button>
          </div>

          {/* NAME */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* BIO */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full min-h-[80px] p-2.5 rounded-xl bg-secondary/50 border border-border resize-none text-sm outline-none"
              maxLength={150}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {bio.length}/150
            </p>
          </div>

          {/* GENDER */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-sm outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          {/* AGE */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Age</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              placeholder="Your age"
            />
          </div>

          {/* LOCATION */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, US"
            />
          </div>

          {/* INTERESTS */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Interests (comma separated)</label>
            <Input
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="e.g. Travel, Music, Fitness"
            />
          </div>

          {/* SAVE */}
          <Button
            onClick={handleSave}
            disabled={isSaving || uploadingAvatar}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md mt-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
