import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BusinessEditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isBusiness, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [delivery, setDelivery] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [hours, setHours] = useState<Record<string, string>>(Object.fromEntries(DAYS.map((d) => [d, ""])));

  const [locationInput, setLocationInput] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSugg, setShowSugg] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { if (!authLoading && !user) navigate("/login?role=business", { replace: true }); }, [authLoading, user, navigate]);
  useEffect(() => { if (!roleLoading && user && !isBusiness) navigate("/dashboard"); }, [roleLoading, isBusiness, user, navigate]);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFullName(p.full_name || "");
      setBio(p.bio || "");
      setPhone(p.phone || "");
      setWebsite(p.website_url || "");
      setWhatsapp(p.whatsapp_number || "");
      setInstagram(p.instagram_url || "");
      setDelivery(p.home_delivery || "");
      setBusinessType(p.business_type || "");
      setLocation(p.location || "");
      setLocationInput(p.location || "");
      setLat(p.latitude ?? null); setLng(p.longitude ?? null);
      setLocationSelected(!!p.location);
      setAvatarPreview(p.avatar_url);
      if (p.business_hours && typeof p.business_hours === "object") {
        setHours({ ...Object.fromEntries(DAYS.map((d) => [d, ""])), ...p.business_hours });
      }
    }
  }, [profile]);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); return; }
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`);
      const d = await r.json();
      setSuggestions(d); setShowSugg(true);
    } catch { setSuggestions([]); }
  }, []);

  const onLocChange = (v: string) => {
    setLocationInput(v); setLocationSelected(false); setLocation("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 400);
  };
  const pickLoc = (s: any) => {
    setLocationInput(s.display_name); setLocation(s.display_name);
    setLat(parseFloat(s.lat)); setLng(parseFloat(s.lon));
    setLocationSelected(true); setShowSugg(false); setSuggestions([]);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!ACCEPTED.includes(f.type)) { toast.error("Only JPG, JPEG, PNG, WEBP allowed"); return; }
    if (f.size > MAX) { toast.error("Image must be 5 MB or less"); return; }
    setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f));
  };

  const validate = () => {
    if (!fullName.trim() || fullName.trim().length < 2) return "Enter a valid business name";
    if (!businessType) return "Select a business type";
    if (!locationSelected || !location) return "Please select a valid location from the list";
    if (bio.trim().length < 20) return "Bio must be at least 20 characters";
    if (bio.trim().length > 500) return "Bio cannot exceed 500 characters";
    if (!delivery) return "Select a home delivery option";
    if (!avatarPreview) return "Profile picture is required";
    if (website && !/^https?:\/\/.+\..+/i.test(website)) return "Website must start with http(s)://";
    if (instagram && !/^https?:\/\/.+\..+/i.test(instagram)) return "Instagram link must start with http(s)://";
    if (whatsapp && !/^\+?[0-9\s\-()]{6,20}$/.test(whatsapp)) return "Enter a valid WhatsApp number";
    return null;
  };

  const handleSave = async () => {
    const err = validate(); if (err) { toast.error(err); return; }
    setSaving(true);
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
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          location: location.trim(),
          latitude: lat,
          longitude: lng,
          phone: phone.trim() || null,
          business_type: businessType,
          website_url: website.trim() || null,
          whatsapp_number: whatsapp.trim() || null,
          instagram_url: instagram.trim() || null,
          home_delivery: delivery,
          business_hours: hours,
          avatar_url,
          profile_visibility: "public",
        })
        .eq("id", user!.id);
      if (upErr) throw upErr;

      toast.success("Profile updated successfully");
      navigate("/business-dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || roleLoading || isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const initials = (fullName || "B").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-2xl">
          <button onClick={() => navigate("/business-dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg uppercase tracking-wider">Edit Business Profile</h1>
          <div className="w-5" />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div onClick={() => fileRef.current?.click()} className="relative h-28 w-28 rounded-full overflow-hidden bg-secondary cursor-pointer ring-4 ring-primary/20 group">
              {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-2xl font-display text-muted-foreground">{initials}</div>}
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="h-6 w-6" /></div>
            </div>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Upload Profile Picture</Button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onFile} className="hidden" />
            <p className="text-[10px] text-muted-foreground">JPG, PNG, WEBP · Max 5 MB</p>
          </div>

          <div className="space-y-1.5">
            <Label>Business Name <span className="text-destructive">*</span></Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={50} />
          </div>

          <div className="space-y-1.5">
            <Label>Business Type <span className="text-destructive">*</span></Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="supplement_store">Supplement Store</SelectItem>
                <SelectItem value="gym">Fitness Centre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 relative">
            <Label>Location <span className="text-destructive">*</span></Label>
            <Input
              value={locationInput}
              onChange={(e) => onLocChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSugg(true)}
              onBlur={() => setTimeout(() => setShowSugg(false), 200)}
              placeholder="Search a city or address..."
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

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label>Bio & Contact Details <span className="text-destructive">*</span></Label>
              <span className={`text-[10px] ${bio.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>{bio.length}/500</span>
            </div>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={520} placeholder="Tell people about your business..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(416) 555-0123" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1 416 555 0123" />
            </div>
            <div className="space-y-1.5">
              <Label>Website URL</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Home Delivery <span className="text-destructive">*</span></Label>
            <Select value={delivery} onValueChange={setDelivery}>
              <SelectTrigger><SelectValue placeholder="Select delivery option" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="local">Local Only</SelectItem>
                <SelectItem value="canada_wide">Canada Wide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Business Hours</Label>
            <div className="space-y-2">
              {DAYS.map((d) => (
                <div key={d} className="grid grid-cols-[60px_1fr] gap-2 items-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{d}</span>
                  <Input value={hours[d] || ""} onChange={(e) => setHours({ ...hours, [d]: e.target.value })} placeholder="e.g. 9:00 AM – 9:00 PM or Closed" />
                </div>
              ))}
            </div>
          </div>

          <Button variant="hero" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessEditProfile;
