import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, X, UserPlus, UserCheck, UserX, Send, Heart, MessageCircle, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useMarkNotificationsRead, NotificationItem } from "@/hooks/useNotifications";
import { useRespondFollowRequest } from "@/hooks/useFollowRequest";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

const typeIcon = (type: NotificationItem["type"]) => {
  switch (type) {
    case "follow_request_received":
      return <UserPlus className="h-4 w-4 text-primary" />;
    case "follow_request_sent":
      return <Send className="h-4 w-4 text-muted-foreground" />;
    case "follow_request_accepted":
    case "follow_request_accepted_self":
    case "follow_success":
      return <UserCheck className="h-4 w-4 text-primary" />;
    case "follow_request_declined":
    case "follow_request_declined_self":
      return <UserX className="h-4 w-4 text-destructive" />;
    case "new_follower":
      return <Heart className="h-4 w-4 text-primary" />;
    case "post_reaction":
      return <Smile className="h-4 w-4 text-primary" />;
    case "post_comment":
      return <MessageCircle className="h-4 w-4 text-primary" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const typeText = (n: NotificationItem) => {
  const name = n.actor?.username ? `@${n.actor.username}` : n.actor?.full_name || "Someone";
  switch (n.type) {
    case "follow_request_received": return `${name} requested to follow you`;
    case "follow_request_sent": return `Follow request sent`;
    case "follow_request_accepted": return `${name} accepted your follow request`;
    case "follow_request_accepted_self": return `You accepted ${name}'s follow request`;
    case "follow_request_declined": return `Your follow request was declined`;
    case "follow_request_declined_self": return `You declined ${name}'s follow request`;
    case "new_follower": return `${name} started following you`;
    case "follow_success": return `You started following ${name}`;
    case "post_reaction": return `${name} reacted to your post`;
    case "post_comment": return `${name} commented on your post`;
    default: return "Notification";
  }
};

const Notifications = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const respond = useRespondFollowRequest();

  useEffect(() => {
    if (notifications.some((n) => !n.read)) {
      markRead.mutate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleAccept = (n: NotificationItem) => {
    if (!n.follow_request_id || !n.actor_id) return;
    respond.mutate(
      { requestId: n.follow_request_id, requesterId: n.actor_id, accept: true },
      { onSuccess: () => toast.success("Follower accepted"), onError: () => toast.error("Action failed") }
    );
  };
  const handleDecline = (n: NotificationItem) => {
    if (!n.follow_request_id || !n.actor_id) return;
    respond.mutate(
      { requestId: n.follow_request_id, requesterId: n.actor_id, accept: false },
      { onSuccess: () => toast.success("Request declined"), onError: () => toast.error("Action failed") }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Profile" />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/profile">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>

        <h1 className="font-display text-2xl uppercase tracking-wider text-foreground mb-6">
          Notif<span className="text-gradient-primary">ications</span>
        </h1>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const isRequest = n.type === "follow_request_received";
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card",
                    !n.read && "border-primary/40 bg-primary/5"
                  )}
                >
                  <div className="relative shrink-0">
                    {n.actor?.avatar_url ? (
                      <img src={n.actor.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center text-lg">👤</div>
                    )}
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5 border border-border">
                      {typeIcon(n.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{typeText(n)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                    {isRequest && n.follow_request_id && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="hero" size="sm" onClick={() => handleAccept(n)} disabled={respond.isPending}>
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDecline(n)} disabled={respond.isPending}>
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-destructive shrink-0 mt-2" />}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg">No notifications yet</p>
            <p className="text-sm mt-1">Follow activity will appear here.</p>
          </div>
        )}
      </div>
      <MobileTabBar />
    </div>
  );
};

export default Notifications;
