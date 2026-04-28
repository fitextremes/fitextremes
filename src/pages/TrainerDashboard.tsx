import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Edit, Eye, Users, ExternalLink, Mail, Phone, MessageSquare, ImagePlus } from "lucide-react";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import SubscriptionCard from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { useTrainerStats, useTrainerLeads } from "@/hooks/useTrainer";


const TrainerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isTrainer, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: stats } = useTrainerStats(user?.id);
  const { data: leads } = useTrainerLeads(user?.id);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?role=trainer");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isTrainer) navigate("/dashboard");
  }, [roleLoading, isTrainer, user, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const status = computeSubscriptionStatus(
    profile?.trial_started_at ?? null,
    profile?.subscription_status ?? "inactive"
  );

  const initials = (profile?.full_name || "T")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <SocialTopBar title="Profile" />

      <div className="container mx-auto px-4 pt-20 max-w-4xl space-y-6">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-secondary ring-4 ring-primary/20 flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-2xl text-muted-foreground">{initials}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground">
                {profile?.full_name || "Your Name"}
              </h1>
              {profile?.username && <p className="text-sm text-primary">@{profile.username}</p>}
              {profile?.location && <p className="text-sm text-muted-foreground mt-1">{profile.location}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="hero">
                  <Link to="/trainer/edit"><Edit className="h-3 w-3 mr-1" /> Edit Profile</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/profile/gallery"><ImagePlus className="h-3 w-3 mr-1" /> Add Photos</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/trainer/${user?.id}?source=profile`}>
                    <ExternalLink className="h-3 w-3 mr-1" /> View Public Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscription status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Subscription</p>
              <p className="font-display text-xl text-foreground mt-1">{status}</p>
              {profile?.trial_started_at && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Trial started {new Date(profile.trial_started_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Badge className={`border ${statusColor[status]}`}>{status}</Badge>
          </div>
        </motion.div>

        {/* Counters */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <Eye className="h-5 w-5 text-primary mb-2" />
            <p className="font-display text-3xl text-foreground">{stats?.views ?? 0}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Profile Views</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <Users className="h-5 w-5 text-accent mb-2" />
            <p className="font-display text-3xl text-foreground">{stats?.leads ?? 0}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Leads</p>
          </motion.div>
        </div>

        {/* Leads list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-4">
            Recent Leads
          </h2>
          {!leads || leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No leads yet. Share your public profile to start receiving inquiries.
            </p>
          ) : (
            <ul className="space-y-3">
              {leads.map((l) => (
                <li key={l.id} className="rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground">{l.name}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>
                        {l.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{l.phone}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90 flex gap-2">
                    <MessageSquare className="h-3 w-3 mt-1 shrink-0 text-primary" />
                    {l.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      <MobileTabBar />
    </div>
  );
};

export default TrainerDashboard;
