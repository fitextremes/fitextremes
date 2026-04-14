import { useParams, Link } from "react-router-dom";
import { MapPin, Star, Clock, Phone, Mail, ArrowLeft, Send, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";

const mockBusinesses: Record<string, {
  name: string; type: string; location: string; rating: number;
  services: string[]; pricing: string; bio: string;
  phone: string; email: string; hours: string; gallery: string[];
}> = {
  "1": {
    name: "Iron Paradise Gym", type: "Full Gym", location: "Toronto, ON", rating: 4.8,
    services: ["Weight Training", "Cardio Zone", "Group Classes", "Personal Training", "Sauna"],
    pricing: "$45/month", bio: "Toronto's premier strength training facility with state-of-the-art equipment, expert trainers, and a motivating community atmosphere. Open 24/7 for your convenience.",
    phone: "(416) 555-0789", email: "info@ironparadise.ca", hours: "24/7",
    gallery: ["🏋️", "💪", "🔥", "⚡", "🏆", "🎯"],
  },
  "4": {
    name: "NutriMax Store", type: "Supplement Store", location: "Toronto, ON", rating: 4.7,
    services: ["Protein Powders", "Pre-Workout", "Vitamins", "Recovery", "Meal Prep"],
    pricing: "Varies", bio: "Your one-stop shop for premium supplements, vitamins, and sports nutrition. Expert staff to guide your fitness nutrition journey.",
    phone: "(416) 555-0321", email: "shop@nutrimax.ca", hours: "9 AM – 9 PM",
    gallery: ["💊", "🥤", "🌿", "💪"],
  },
};

const BusinessProfile = () => {
  const { id } = useParams();
  const business = mockBusinesses[id || "1"] || mockBusinesses["1"];
  const [connectOpen, setConnectOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      setSent(true);
      setTimeout(() => { setConnectOpen(false); setSent(false); setMessage(""); }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <Link to="/discover" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-secondary text-4xl">🏋️</div>
                <div className="flex-1">
                  <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">{business.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {business.location}</span>
                    <span className="flex items-center gap-1 text-sm text-accent"><Star className="h-4 w-4 fill-current" /> {business.rating}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {business.hours}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-block rounded-md gradient-accent px-3 py-1 text-xs font-display uppercase tracking-wider text-accent-foreground">{business.type}</span>
                    <span className="font-display text-lg text-primary">{business.pricing}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* About */}
            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">{business.bio}</p>
            </motion.div>

            {/* Services */}
            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">Services</h2>
              <div className="flex flex-wrap gap-2">
                {business.services.map((s) => (
                  <span key={s} className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground">{s}</span>
                ))}
              </div>
            </motion.div>

            {/* Gallery */}
            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">Gallery</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {business.gallery.map((item, i) => (
                  <div key={i} className="flex h-32 items-center justify-center rounded-lg bg-secondary text-4xl">{item}</div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div className="sticky top-20 rounded-xl border border-border bg-card p-6 shadow-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground mb-4">Contact</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> {business.phone}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> {business.email}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground"><Globe className="h-4 w-4 text-primary" /> {business.hours}</div>
              </div>

              {!connectOpen ? (
                <Button variant="accent" className="w-full" size="lg" onClick={() => setConnectOpen(true)}>
                  Contact Business
                </Button>
              ) : (
                <div className="space-y-3">
                  {sent ? (
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <p className="text-sm text-primary font-semibold">✓ Inquiry sent!</p>
                    </div>
                  ) : (
                    <>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 100))} placeholder="Hi, I'd like to learn more..." className="w-full rounded-lg border border-border bg-secondary p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none" rows={3} />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{message.length}/100</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setConnectOpen(false)}>Cancel</Button>
                          <Button variant="accent" size="sm" onClick={handleSend} disabled={!message.trim()}>
                            <Send className="h-3 w-3 mr-1" /> Send
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default BusinessProfile;
