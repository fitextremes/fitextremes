import { useParams, Link } from "react-router-dom";
import { MapPin, Star, Clock, Award, Phone, Mail, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import ProfileViewHeader from "@/components/ProfileViewHeader";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import ConnectButton from "@/components/ConnectButton";

const mockTrainers: Record<string, {
  name: string; location: string; rating: number; specialty: string;
  rate: string; bio: string; experience: string; certifications: string[];
  phone: string; email: string; gallery: string[];
}> = {
  "1": {
    name: "Alex Carter", location: "Toronto, ON", rating: 5.0,
    specialty: "Strength & Conditioning", rate: "$40–$60/hr",
    bio: "Certified strength and conditioning specialist with 8+ years of experience helping clients build functional strength and improve athletic performance.",
    experience: "8+ years", certifications: ["CSCS", "NSCA-CPT", "Precision Nutrition L1"],
    phone: "(416) 555-0123", email: "alex@fitextremes.com",
    gallery: ["🏋️", "💪", "🔥", "⚡"],
  },
  "2": {
    name: "Maria Santos", location: "Vancouver, BC", rating: 4.9,
    specialty: "Weight Loss", rate: "$35–$50/hr",
    bio: "Passionate about helping people transform their lives through sustainable fitness and nutrition habits.",
    experience: "6 years", certifications: ["ACE-CPT", "CanFitPro", "Nutrition Coach"],
    phone: "(604) 555-0456", email: "maria@fitextremes.com",
    gallery: ["🏃", "🧘", "🥗", "✨"],
  },
};

const TrainerProfile = () => {
  const { id } = useParams();
  const trainer = mockTrainers[id || "1"] || mockTrainers["1"];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <ProfileViewHeader />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <Link to="/discover" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-secondary text-4xl">💪</div>
                <div className="flex-1">
                  <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">{trainer.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {trainer.location}</span>
                    <span className="flex items-center gap-1 text-sm text-accent"><Star className="h-4 w-4 fill-current" /> {trainer.rating}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {trainer.experience}</span>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block rounded-md gradient-primary px-3 py-1 text-xs font-display uppercase tracking-wider text-primary-foreground">{trainer.specialty}</span>
                    <span className="ml-2 font-display text-lg text-primary">{trainer.rate}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">{trainer.bio}</p>
            </motion.div>

            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">
                <Award className="inline h-5 w-5 mr-2 text-primary" /> Certifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {trainer.certifications.map((cert) => (
                  <span key={cert} className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground">{cert}</span>
                ))}
              </div>
            </motion.div>

            <motion.div className="rounded-xl border border-border bg-card p-8 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-4">Gallery</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {trainer.gallery.map((item, i) => (
                  <div key={i} className="flex h-32 items-center justify-center rounded-lg bg-secondary text-4xl">{item}</div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div className="sticky top-20 rounded-xl border border-border bg-card p-6 shadow-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground mb-4">Contact</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> {trainer.phone}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> {trainer.email}</div>
              </div>
              <ConnectButton
                targetType="trainer"
                targetId={id || "1"}
                targetName={trainer.name.split(" ")[0]}
              />
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default TrainerProfile;
