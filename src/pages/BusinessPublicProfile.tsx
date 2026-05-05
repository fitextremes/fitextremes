import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, ArrowLeft, Loader2, MessageSquare, Send, Globe, Instagram, Truck, Clock, Building2 } from "lucide-react";
import ProfileViewHeader from "@/components/ProfileViewHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useBusinessProfile, useBusinessGallery, useSubmitBusinessLead, useRecordBusinessEvent } from "@/hooks/useBusiness";
import { useRecordProfileView } from "@/hooks/useTrainer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const businessLabel = (t?: string | null) =>
  t === "gym" ? "Gym / Fitness Centre" : t === "supplement_store" ? "Supplement Store" : "Business";

const deliveryLabel = (t?: string | null) =>
  t === "yes" ? "Available" : t === "no" ? "Not available" : t === "local" ? "Local only" : t === "canada_wide" ? "Canada wide" : null;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BusinessPublicProfile = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isPreview = location.pathname === "/business/profile/public-preview";
  const id = isPreview ? user?.id : paramId;
  const isSelfProfile = !!user && !!id && user.id === id;
  const actionsDisabled = isPreview || isSelfProfile;
  const { data: business, isLoading } = useBusinessProfile(id);
  const { data: gallery = [] } = useBusinessGallery(id);
  const recordView = useRecordProfileView();
  const recordEvent = useRecordBusinessEvent();
  const submitLead = useSubmitBusinessLead(id || "");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isPreview && id && user?.id !== id) recordView.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id, isPreview]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!business || business.is_suspended) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileViewHeader />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="font-display text-2xl uppercase">Business not found</h1>
          <Button asChild variant="outline" className="mt-4"><Link to="/discover">Back to Discover</Link></Button>
        </div>
      </div>
    );
  }

  const initials = (business.full_name || "B").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Name is required");
    if (!validEmail(email)) return toast.error("Enter a valid email");
    if (message.trim().length < 5) return toast.error("Message is too short");
    try {
      await submitLead.mutateAsync({ name, email, phone, message });
      toast.success("Inquiry sent! The business will get back to you.");
      setOpen(false); setName(""); setEmail(""); setPhone(""); setMessage("");
    } catch (e: any) { toast.error(e.message || "Failed to send"); }
  };

  const trackClick = (eventType: any) => {
    if (id) recordEvent.mutate({ businessId: id, eventType });
  };

  const source = searchParams.get("source");
  const isOwner = !!user && user.id === id;
  const effective = source || (isOwner ? "profile" : "discover");
  const back: Record<string, { to: string; label: string }> = {
    profile: { to: "/business-dashboard", label: "Back to Dashboard" },
    search: { to: "/discover", label: "Back to Search Results" },
    discover: { to: "/discover", label: "Back to Discover" },
  };
  const b = back[effective] ?? back.discover;
  const hours = (business.business_hours || {}) as Record<string, string>;
  const hasHours = DAYS.some((d) => hours[d]);

  const previewDisabled = (e: React.MouseEvent) => {
    if (actionsDisabled) {
      e.preventDefault();
      e.stopPropagation();
      toast.info(isSelfProfile ? "This is your business profile" : "Disabled in preview mode");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {isPreview ? (
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <button
              onClick={() => navigate("/business-dashboard")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              aria-label="Back to Business Dashboard"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h1 className="font-display text-base sm:text-lg uppercase tracking-wider text-foreground">
              Public Profile Preview
            </h1>
            <div className="w-16" />
          </div>
        </div>
      ) : (
        <ProfileViewHeader />
      )}
      <div className="container mx-auto px-4 pt-20 pb-12">
        {isPreview ? (
          <div className="mb-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
            Preview Mode — This is how users see your profile. Engagement actions are disabled.
          </div>
        ) : (
          <Link to={b.to} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {b.label}
          </Link>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="h-24 w-24 shrink-0 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center">
                  {business.avatar_url ? <img src={business.avatar_url} alt={business.full_name} className="h-full w-full object-cover" /> : <span className="font-display text-2xl text-muted-foreground">{initials}</span>}
                </div>
                <div className="flex-1">
                  <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">{business.full_name}</h1>
                  {business.username && <p className="text-sm text-primary">@{business.username}</p>}
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2"><Building2 className="h-4 w-4" /> {businessLabel(business.business_type)}</p>
                  {business.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {business.location}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {business.bio && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{business.bio}</p>
              </motion.div>
            )}

            {hasHours && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Business Hours</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {DAYS.map((d) => (
                    <div key={d} className="flex justify-between border border-border rounded-lg px-3 py-2 bg-secondary/40">
                      <span className="font-display uppercase text-xs text-muted-foreground">{d}</span>
                      <span className="text-foreground">{hours[d] || "—"}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {gallery.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">Gallery</h2>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                  {gallery.map((g: any) => (
                    <div key={g.id} className="group rounded-xl overflow-hidden border border-border bg-secondary aspect-square">
                      <img src={g.image_url} alt={g.caption || business.full_name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-20 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground mb-4">Contact</h3>
              <div className="space-y-3 mb-5">
                {business.phone && (
                  <a href={`tel:${business.phone}`} onClick={() => trackClick("call_click")} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary">
                    <Phone className="h-4 w-4 text-primary" /> {business.phone}
                  </a>
                )}
                {business.email && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground break-all">
                    <Mail className="h-4 w-4 text-primary" /> {business.email}
                  </div>
                )}
                {business.website_url && (
                  <a href={business.website_url} target="_blank" rel="noreferrer" onClick={() => trackClick("website_click")} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary break-all">
                    <Globe className="h-4 w-4 text-primary" /> Website
                  </a>
                )}
                {business.instagram_url && (
                  <a href={business.instagram_url} target="_blank" rel="noreferrer" onClick={() => trackClick("instagram_click")} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary">
                    <Instagram className="h-4 w-4 text-primary" /> Instagram
                  </a>
                )}
                {business.home_delivery && deliveryLabel(business.home_delivery) && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 text-primary" /> Delivery: {deliveryLabel(business.home_delivery)}
                  </div>
                )}
              </div>

              <div className={`space-y-2 ${isPreview ? "opacity-60 pointer-events-none" : ""}`} aria-disabled={isPreview}>
                {business.whatsapp_number && (
                  <Button asChild={!isPreview} variant="outline" className="w-full" disabled={isPreview} onClick={isPreview ? previewDisabled : () => trackClick("whatsapp_click")}>
                    {isPreview ? (
                      <span>WhatsApp</span>
                    ) : (
                      <a href={`https://wa.me/${business.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
                    )}
                  </Button>
                )}
                {business.phone && (
                  <Button asChild={!isPreview} variant="outline" className="w-full" disabled={isPreview} onClick={isPreview ? previewDisabled : () => trackClick("call_click")}>
                    {isPreview ? (
                      <span className="inline-flex items-center"><Phone className="h-4 w-4 mr-2" /> Call</span>
                    ) : (
                      <a href={`tel:${business.phone}`}><Phone className="h-4 w-4 mr-2" /> Call</a>
                    )}
                  </Button>
                )}

                {isPreview ? (
                  <Button variant="hero" className="w-full" size="lg" disabled>
                    <MessageSquare className="h-4 w-4 mr-2" /> Connect
                  </Button>
                ) : (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button variant="hero" className="w-full" size="lg">
                        <MessageSquare className="h-4 w-4 mr-2" /> Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-display uppercase tracking-wider">Contact {business.full_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Message *</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={500} /></div>
                        <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={submitLead.isPending}>
                          <Send className="h-4 w-4 mr-2" /> {submitLead.isPending ? "Sending..." : "Send Inquiry"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer hidePlatform hideForPros />
    </div>
  );
};

export default BusinessPublicProfile;
