import { Link } from "react-router-dom";
import { Bell, Check, X, UserPlus, UserCheck, UserX, Send, Heart, MessageCircle, Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, useMarkNotificationsRead, NotificationItem } from "@/hooks/useNotifications";
import { useRespondFollowRequest } from "@/hooks/useFollowRequest";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeIcon = (type: NotificationItem["type"]) => {
  switch (type) {
    case "follow_request_received":
      return <UserPlus className="h-4 w-4 text-primary" />;
    case "follow_request_sent":
      return <Send className="h-4 w-4 text-muted-foreground" />;
    case "follow_request_accepted":
    case "follow_request_accepted_self":
      return <UserCheck className="h-4 w-4 text-primary" />;
    case "follow_request_declined":
    case "follow_request_declined_self":
      return <UserX className="h-4 w-4 text-destructive" />;
    case "new_follower":
      return <Heart className="h-4 w-4 text-primary" />;
    case "follow_success":
      return <UserCheck className="h-4 w-4 text-primary" />;
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
    case "follow_request_received":
      return `${name} requested to follow you`;
    case "follow_request_sent":
      return `Follow request sent`;
    case "follow_request_accepted":
      return `${name} accepted your follow request`;
    case "follow_request_accepted_self":
      return `You accepted ${name}'s follow request`;
    case "follow_request_declined":
      return `Your follow request was declined`;
    case "follow_request_declined_self":
      return `You declined ${name}'s follow request`;
    case "new_follower":
      return `${name} started following you`;
    case "follow_success":
      return `You started following ${name}`;
    case "post_reaction":
      return `${name} reacted to your post`;
    case "post_comment":
      return `${name} commented on your post`;
    default:
      return "Notification";
  }
};

interface Props {
  className?: string;
}

const NotificationBell = ({ className }: Props) => {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const respond = useRespondFollowRequest();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      markRead.mutate(undefined);
    }
  };

  const handleAccept = (n: NotificationItem) => {
    if (!n.follow_request_id || !n.actor_id) return;
    respond.mutate(
      { requestId: n.follow_request_id, requesterId: n.actor_id, accept: true },
      {
        onSuccess: () => toast.success("Follower accepted"),
        onError: () => toast.error("Action failed"),
      }
    );
  };

  const handleDecline = (n: NotificationItem) => {
    if (!n.follow_request_id || !n.actor_id) return;
    respond.mutate(
      { requestId: n.follow_request_id, requesterId: n.actor_id, accept: false },
      {
        onSuccess: () => toast.success("Request declined"),
        onError: () => toast.error("Action failed"),
      }
    );
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative text-muted-foreground hover:text-primary transition-colors",
            className
          )}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] sm:w-[380px] p-0 max-h-[70vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Notifications
          </h3>
          <Link to="/notifications" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.slice(0, 12).map((n) => {
                const isRequest = n.type === "follow_request_received" && n.request_pending;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-3 hover:bg-secondary/50 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        {n.actor?.avatar_url ? (
                          <img
                            src={n.actor.avatar_url}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm">
                            👤
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5 border border-border">
                          {typeIcon(n.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {typeText(n)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                        {isRequest && n.follow_request_id && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAccept(n)}
                              disabled={respond.isPending}
                              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" /> Accept
                            </button>
                            <button
                              onClick={() => handleDecline(n)}
                              disabled={respond.isPending}
                              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                            >
                              <X className="h-3 w-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-destructive shrink-0 mt-1.5" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
