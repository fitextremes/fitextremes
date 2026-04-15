import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MobileTabBar from "@/components/MobileTabBar";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const validateFullName = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "Full Name is required";
  if (trimmed.length < 2) return "Name must be at least 2 characters";
  if (trimmed.length > 50) return "Name must be 50 characters or less";
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) return "Enter a valid full name";
  return "";
};

const validateLocation = (value: string): string => {
  if (!value.trim()) return "";
  if (value.length > 100) return "Location must be 100 characters or less";
  if (/[<>\/\\{}]/.test(value)) return "Enter a valid location";
  return "";
};

const validateBio = (value: string): string => {
  if (value.length > 250) return "Bio cannot exceed 250 characters";
  if (/<script|<\/script|<iframe|javascript:/i.test(value)) return "Invalid content detected";
  return "";
};

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setLocationInput(profile.location || "");
      setIsPublic(profile.profile_visibility === "public");
      setAvatarPreview(profile.avatar_url);
      setLocationSelected(!!profile.location);
    }
  }, [profile]);

  const errors = {
    fullName: validateFullName(fullName),
    location: validateLocation(locationInput),
    bio: validateBio(bio),
  };

  const isFormValid = !errors.fullName && !errors.location && !errors.bio;

  // Nominatim location autocomplete
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setLocationSuggestions(data);
      setShowSuggestions(true);
    } catch {
      setLocationSuggestions([]);
    }
  }, []);

  const handleLocationInputChange = (val: string) => {
    setLocationInput(val);
    setLocationSelected(false);
    setLocation("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 400);
  };

  const selectLocation = (suggestion: any) => {
    const displayName = suggestion.display_name;
    setLocationInput(displayName);
    setLocation(displayName);
    setLocationSelected(true);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, and WEBP images are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be less than 5 MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setTouched({ fullName: true, location: true, bio: true });

    if (!isFormValid) {
      toast.error("Please fix the errors before saving");
      return;
    }

    // If location was typed but not selected from dropdown
    if (locationInput.trim() && !locationSelected) {
      toast.error("Please select a location from the dropdown suggestions");
      return;
    }

    try {
      let avatar_url = profile?.avatar_url || null;

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
        profile_visibility: isPublic ? "public" : "private",
      });

      toast.success("Profile updated successfully");
      navigate("/profile");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-2xl">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg uppercase tracking-wider text-foreground">Edit Profile</h1>
          <div className="w-5" /> {/* spacer */}
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 pb-12 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative h-24 w-24 rounded-full bg-secondary overflow-hidden cursor-pointer ring-4 ring-primary/20 group"
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-display text-muted-foreground">
                  {getInitials(fullName || "U")}
                </div>
              )}
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-foreground" />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Change Photo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-[10px] text-muted-foreground">JPG, PNG, WEBP · Max 5 MB</p>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label>Full Name <span className="text-destructive">*</span></Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => handleBlur("fullName")}
              placeholder="John Smith"
              maxLength={50}
              className={touched.fullName && errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {touched.fullName && errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Location with Nominatim autocomplete */}
          <div className="space-y-1.5 relative">
            <Label>Location</Label>
            <Input
              value={locationInput}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              onBlur={() => {
                handleBlur("location");
                // Delay hiding so click on suggestion works
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search a location..."
              maxLength={100}
              className={touched.location && errors.location ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {touched.location && errors.location && (
              <p className="text-xs text-destructive">{errors.location}</p>
            )}
            {locationInput.trim() && !locationSelected && !errors.location && (
              <p className="text-[10px] text-accent">Please select a location from the dropdown</p>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card shadow-card max-h-48 overflow-y-auto">
                {locationSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors border-b border-border last:border-0"
                    onMouseDown={() => selectLocation(s)}
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label>Bio</Label>
              <span className={`text-[10px] ${bio.length > 250 ? "text-destructive" : "text-muted-foreground"}`}>
                {bio.length}/250
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onBlur={() => handleBlur("bio")}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={260}
              className={touched.bio && errors.bio ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {touched.bio && errors.bio && (
              <p className="text-xs text-destructive">{errors.bio}</p>
            )}
          </div>

          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Public Profile</p>
              <p className="text-xs text-muted-foreground">
                {isPublic ? "Anyone can view your profile and posts" : "Your profile is private"}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Save Button */}
          <Button
            variant="hero"
            className="w-full"
            onClick={handleSave}
            disabled={updateProfile.isPending || !isFormValid}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
};

export default EditProfile;
