import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Edit, Eye, Users, ExternalLink, Mail, Phone, MessageSquare, ImagePlus, PhoneCall, Globe, Truck, Send, Building2 } from "lucide-react";
import SocialTopBar from "@/components/SocialTopBar";
import SubscriptionCard from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { useBusinessStats, useBusinessLeads, useUpdateLeadStatus } from "@/hooks/useBusiness";
import { toast } from "sonner";

const businessLabel = (t?: string | null) =>
  t === "gym" ? "Gym / Fitness Centre" : t === "supplement_store" ? "Supplement Store" : "Business";

const BusinessDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isBusiness, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: stats } = useBusinessStats(user?.id);
  const { data: leads } = useBusinessLeads(user?.id);
  const updateStatus = useUpdateLeadStatus(user?.id);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?role=business", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isBusiness) navigate("/dashboard");
  }, [roleLoading, isBusiness, user, navigate]);

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const initials = (profile?.full_name || "B").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const p = profile as any;

  const onChangeStatus = async (leadId: string, status: "new" | "contacted" | "closed") => {
    try {
      const res: any = await updateStatus.mutateAsync({ leadId, status });
      if (!res?.ok) throw new Error(res?.reason || "Failed");
      toast.success(`Lead marked ${status}`);
    } catch (e: any) {
      toast.error(e.message || "Could not update lead");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <SocialTopBar title="Business" />

      <div className="container mx-auto px-4 pt-20 max-w-5xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-secondary ring-4 ring-primary/20 flex items-center justify-center shrink-0">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-2xl text-muted-foreground">{initials}</span>}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground">{profile?.full_name || "Your Business"}</h1>
              {profile?.username && <p className="text-sm text-primary">@{profile.username}</p>}
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {businessLabel(p?.business_type)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <Badge className="bg-primary/15 text-primary border-primary/40 border">Public Profile</Badge>
                {p?.is_suspended && <Badge variant="destructive">Suspended</Badge>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="hero"><Link to="/business/edit"><Edit className="h-3 w-3 mr-1" /> Edit Profile</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to="/business/gallery"><ImagePlus className="h-3 w-3 mr-1" /> Manage Photos</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to={`/business/${user?.id}`}><ExternalLink className="h-3 w-3 mr-1" /> View Public Profile</Link></Button>
              </div>
            </div>
          </div>
        </motion.div>

        <SubscriptionCard />

        {/* Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Eye} label="Profile Views" value={stats?.views ?? 0} />
          <StatCard icon={Users} label="Leads" value={stats?.leads ?? 0} hint={stats?.leads_new ? `${stats.leads_new} new` : undefined} />
          <StatCard icon={PhoneCall} label="Click to Call" value={stats?.call_clicks ?? 0} />
          <StatCard icon={Globe} label="Website Clicks" value={stats?.website_clicks ?? 0} />
          <StatCard icon={Truck} label="Delivery Requests" value={stats?.delivery_requests ?? 0} />
        </div>

        {/* Leads */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-4">Leads</h2>
          {!leads || leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No leads yet. Share your public profile to start receiving inquiries.</p>
          ) : (
            <ul className="space-y-3">
              {leads.map((l: any) => (
                <li key={l.id} className="rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        {l.name}
                        <StatusBadge status={l.status} />
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{l.email}</a>
                        {l.phone && <a href={`tel:${l.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" />{l.phone}</a>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90 flex gap-2">
                    <MessageSquare className="h-3 w-3 mt-1 shrink-0 text-primary" />
                    {l.message}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {l.phone && (
                      <Button asChild size="sm" variant="outline"><a href={`tel:${l.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a></Button>
                    )}
                    <Button asChild size="sm" variant="outline"><a href={`mailto:${l.email}`}><Send className="h-3 w-3 mr-1" /> Email</a></Button>
                    {l.status !== "contacted" && (
                      <Button size="sm" variant="ghost" onClick={() => onChangeStatus(l.id, "contacted")}>Mark Contacted</Button>
                    )}
                    {l.status !== "closed" && (
                      <Button size="sm" variant="ghost" onClick={() => onChangeStatus(l.id, "closed")}>Mark Closed</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number; hint?: string }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4 shadow-card">
    <Icon className="h-5 w-5 text-primary mb-2" />
    <p className="font-display text-2xl text-foreground">{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    {hint && <p className="text-[10px] text-accent mt-0.5">{hint}</p>}
  </motion.div>
);

const StatusBadge = ({ status }: { status?: string }) => {
  const map: Record<string, string> = {
    new: "bg-primary/15 text-primary border-primary/40",
    contacted: "bg-accent/15 text-accent border-accent/40",
    closed: "bg-muted text-muted-foreground border-border",
  };
  const cls = map[status || "new"] || map.new;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}>{status || "new"}</span>;
};

export default BusinessDashboard;
