import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    full_name: string;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    profile_visibility: string;
  };
}

const EditProfileDialog = ({ open, onOpenChange, profile }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [visibility, setVisibility] = useState(profile.profile_visibility);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const updateProfile = useUpdateProfile();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      let avatar_url = profile.avatar_url;

      if (avatarFile && user) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }

      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatar_url,
        profile_visibility: visibility,
      });
      toast.success("Profile updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-full bg-secondary overflow-hidden cursor-pointer ring-2 ring-primary/20"
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🏋️</div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Change Photo
            </Button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Toronto, ON" />
          </div>

          <div className="space-y-1.5">
            <Label>Profile Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="hero" className="w-full" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
