import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, Award, Phone, Mail, ArrowLeft, Loader2, MessageSquare, Send } from "lucide-react";
import ProfileViewHeader from "@/components/ProfileViewHeader";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTrainerProfile, useRecordProfileView, useSubmitLead } from "@/hooks/useTrainer";
import { useTrainerGallery } from "@/hooks/useTrainerGallery";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TrainerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: trainer, isLoading } = useTrainerProfile(id);
  const { data: gallery = [] } = useTrainerGallery(id);
  const recordView = useRecordProfileView();
  const submitLead = useSubmitLead(id || "");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id && user?.id !== id) {
      recordView.mutate(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!trainer) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileViewHeader />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="font-display text-2xl uppercase">Trainer not found</h1>
          <Button asChild variant="outline" className="mt-4"><Link to="/discover">Back to Discover</Link></Button>
        </div>
      </div>
    );
  }

  const initials = (trainer.full_name || "T").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const rate = trainer.hourly_min != null && trainer.hourly_max != null
    ? `$${trainer.hourly_min} – $${trainer.hourly_max} CAD/hr`
    : "Rate on request";

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Name is required");
    if (!validEmail(email)) return toast.error("Enter a valid email");
    if (message.trim().length < 5) return toast.error("Message is too short");
    try {
      await submitLead.mutateAsync({ name, email, phone, message });
      toast.success("Inquiry sent! The trainer will get back to you.");
      setOpen(false);
      setName(""); setEmail(""); setPhone(""); setMessage("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send inquiry");
    }
  };

  const certList = trainer.certifications
    ? trainer.certifications.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <ProfileViewHeader />
      <div className="container mx-auto px-4 pt-20 pb-12">
        {(() => {
          const source = searchParams.get("source");
          const isOwner = !!user && user.id === id;
          const effective = source || (isOwner ? "profile" : "discover");
          const map: Record<string, { to: string; label: string }> = {
            profile: { to: "/trainer-dashboard", label: "Back to Profile" },
            search: { to: "/discover", label: "Back to Search Results" },
            discover: { to: "/discover", label: "Back to Discover" },
          };
          const back = map[effective] ?? map.discover;
          return (
            <Link to={back.to} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> {back.label}
            </Link>
          );
        })()}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="h-24 w-24 shrink-0 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center">
                  {trainer.avatar_url ? (
                    <img src={trainer.avatar_url} alt={trainer.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl text-muted-foreground">{initials}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">{trainer.full_name}</h1>
                  {trainer.username && <p className="text-sm text-primary">@{trainer.username}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {trainer.location && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {trainer.location}
                      </span>
                    )}
                    {trainer.years_experience != null && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" /> {trainer.years_experience}+ years
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-lg text-primary">{rate}</p>
                </div>
              </div>
            </motion.div>

            {trainer.bio && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{trainer.bio}</p>
              </motion.div>
            )}

            {certList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">
                  <Award className="inline h-5 w-5 mr-2 text-primary" />
                  Certifications & Education
                </h2>
                <div className="flex flex-wrap gap-2">
                  {certList.map((c, i) => (
                    <span key={i} className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground">{c}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {gallery.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">Workout Gallery</h2>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                  {gallery.map((g) => (
                    <div key={g.id} className="group rounded-xl overflow-hidden border border-border bg-secondary aspect-square">
                      <img
                        src={g.image_url}
                        alt={g.caption || `${trainer.full_name} gallery`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-20 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground mb-4">Contact</h3>
              <div className="space-y-3 mb-6">
                {trainer.phone && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" /> {trainer.phone}
                  </div>
                )}
                {trainer.email && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground break-all">
                    <Mail className="h-4 w-4 text-primary" /> {trainer.email}
                  </div>
                )}
              </div>

              {user?.id === id ? (
                <>
                  <Button
                    variant="hero"
                    className="w-full cursor-not-allowed"
                    size="lg"
                    disabled
                    aria-disabled="true"
                    title="You cannot connect with your own profile."
                    onClick={(e) => e.preventDefault()}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Connect with {trainer.full_name.split(" ")[0]}
                  </Button>
                  <p className="mt-2 text-xs text-center text-muted-foreground">
                    This is your public profile preview.
                  </p>
                </>
              ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="w-full" size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Connect with {trainer.full_name.split(" ")[0]}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display uppercase tracking-wider">Send an Inquiry</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email *</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Message *</Label>
                      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={500} />
                    </div>
                    <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={submitLead.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {submitLead.isPending ? "Sending..." : "Send Inquiry"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <Footer hidePlatform={user?.id === id} hideForPros={user?.id === id} />
      <MobileTabBar />
    </div>
  );
};

export default TrainerProfilePage;
