import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MobileTabBar from "@/components/MobileTabBar";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;

const TrainerEditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isTrainer, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [yearsExp, setYearsExp] = useState<string>("");
  const [certifications, setCertifications] = useState("");
  const [hourlyMin, setHourlyMin] = useState<string>("");
  const [hourlyMax, setHourlyMax] = useState<string>("");
  const [locationInput, setLocationInput] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?role=trainer");
  }, [authLoading, user, navigate]);
  useEffect(() => {
    if (!roleLoading && user && !isTrainer) navigate("/dashboard");
  }, [roleLoading, isTrainer, user, navigate]);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFullName(p.full_name || "");
      setBio(p.bio || "");
      setPhone(p.phone || "");
      setYearsExp(p.years_experience != null ? String(p.years_experience) : "");
      setCertifications(p.certifications || "");
      setHourlyMin(p.hourly_min != null ? String(p.hourly_min) : "");
      setHourlyMax(p.hourly_max != null ? String(p.hourly_max) : "");
      setLocation(p.location || "");
      setLocationInput(p.location || "");
      setLat(p.latitude ?? null);
      setLng(p.longitude ?? null);
      setLocationSelected(!!p.location);
      setAvatarPreview(p.avatar_url);
    }
  }, [profile]);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); return; }
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`);
      const d = await r.json();
      setSuggestions(d);
      setShowSugg(true);
    } catch { setSuggestions([]); }
  }, []);

  const onLocChange = (v: string) => {
    setLocationInput(v);
    setLocationSelected(false);
    setLocation("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 400);
  };

  const pickLoc = (s: any) => {
    setLocationInput(s.display_name);
    setLocation(s.display_name);
    setLat(parseFloat(s.lat));
    setLng(parseFloat(s.lon));
    setLocationSelected(true);
    setShowSugg(false);
    setSuggestions([]);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) { toast.error("Only JPG, JPEG, PNG, WEBP allowed"); return; }
    if (f.size > MAX) { toast.error("Image must be 5 MB or less"); return; }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const validate = () => {
    if (!fullName.trim() || fullName.trim().length < 2) return "Enter a valid name";
    if (!/^[a-zA-Z\s'-]+$/.test(fullName.trim())) return "Enter a valid name";
    if (!locationSelected || !location) return "Please select a valid location from the list";
    const min = Number(hourlyMin), max = Number(hourlyMax);
    if (!hourlyMin || !hourlyMax || isNaN(min) || isNaN(max)) return "Enter a valid hourly rate range";
    if (min < 0 || max < 0) return "Only positive numeric values allowed";
    if (min >= max) return "Minimum rate must be less than maximum rate";
    if (bio.trim().length < 20) return "Please provide more details (min 20 chars)";
    if (bio.trim().length > 500) return "Bio cannot exceed 500 characters";
    const yrs = Number(yearsExp);
    if (yearsExp === "" || isNaN(yrs) || yrs < 0 || yrs > 50) return "Enter valid years of experience (0-50)";
    if (!certifications.trim()) return "Certifications & Education is required";
    if (!avatarPreview) return "Profile picture is required";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    try {
      let avatar_url = (profile as any)?.avatar_url || null;
      if (avatarFile && user) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = `${data.publicUrl}?t=${Date.now()}`;
      }

      // updateProfile hook only allows known cols; do raw update for trainer fields
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          location: location.trim(),
          latitude: lat,
          longitude: lng,
          phone: phone.trim() || null,
          years_experience: Number(yearsExp),
          certifications: certifications.trim(),
          hourly_min: Number(hourlyMin),
          hourly_max: Number(hourlyMax),
          avatar_url,
          profile_visibility: "public",
        })
        .eq("id", user!.id);
      if (upErr) throw upErr;

      toast.success("Profile updated successfully.");
      navigate("/trainer-dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    }
  };

  if (authLoading || roleLoading || isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const initials = (fullName || "T").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-2xl">
          <button onClick={() => navigate("/trainer-dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg uppercase tracking-wider">Edit Trainer Profile</h1>
          <div className="w-5" />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div onClick={() => fileRef.current?.click()} className="relative h-28 w-28 rounded-full overflow-hidden bg-secondary cursor-pointer ring-4 ring-primary/20 group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-display text-muted-foreground">{initials}</div>
              )}
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-6 w-6" />
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Change Photo</Button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onFile} className="hidden" />
            <p className="text-[10px] text-muted-foreground">JPG, PNG, WEBP · Max 5 MB</p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Carter" maxLength={50} />
          </div>

          {/* Location */}
          <div className="space-y-1.5 relative">
            <Label>Location <span className="text-destructive">*</span></Label>
            <Input
              value={locationInput}
              onChange={(e) => onLocChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSugg(true)}
              onBlur={() => setTimeout(() => setShowSugg(false), 200)}
              placeholder="Search a city or area..."
            />
            {locationInput && !locationSelected && (
              <p className="text-[10px] text-accent">Please select a location from the dropdown</p>
            )}
            {showSugg && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border bg-card shadow-card max-h-56 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onMouseDown={() => pickLoc(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary border-b border-border last:border-0">
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hourly rate */}
          <div className="space-y-1.5">
            <Label>Hourly Rate Range (CAD) <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" placeholder="Min e.g. 25" value={hourlyMin} onChange={(e) => setHourlyMin(e.target.value)} />
              <span className="text-muted-foreground">–</span>
              <Input type="number" min="0" placeholder="Max e.g. 50" value={hourlyMax} onChange={(e) => setHourlyMax(e.target.value)} />
            </div>
            <p className="text-[10px] text-muted-foreground">Example: $25 – $50</p>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label>Bio & Contact Details <span className="text-destructive">*</span></Label>
              <span className={`text-[10px] ${bio.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>{bio.length}/500</span>
            </div>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={520} placeholder="Tell prospective clients about your training style, specialties, availability..." />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>Contact Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(416) 555-0123" />
          </div>

          {/* Years experience */}
          <div className="space-y-1.5">
            <Label>Years of Experience <span className="text-destructive">*</span></Label>
            <Input type="number" min="0" max="50" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="e.g. 5" />
          </div>

          {/* Certifications */}
          <div className="space-y-1.5">
            <Label>Certifications & Education <span className="text-destructive">*</span></Label>
            <Textarea value={certifications} onChange={(e) => setCertifications(e.target.value)} rows={3} placeholder="CSCS, NSCA-CPT, B.Sc. Kinesiology..." />
          </div>

          <Button variant="hero" className="w-full" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>

          <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div>
              <h3 className="font-display uppercase tracking-wider text-sm text-destructive">Account Management</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently delete your trainer account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setDeleteOpen(true)}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <MobileTabBar />
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
};

export default TrainerEditProfile;
