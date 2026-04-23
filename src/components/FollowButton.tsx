import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Clock, Loader2 } from "lucide-react";
import { useFollowState, useFollowAction } from "@/hooks/useFollowRequest";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  isPrivate: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "hero" | "outline" | "ghost";
  iconOnly?: boolean;
  className?: string;
}

/**
 * Privacy-aware follow button.
 * - Public target → Follow / Following (immediate, with unfollow).
 * - Private target → Follow / Requested (cancellable) / Following (after accept).
 */
const FollowButton = ({
  targetUserId,
  isPrivate,
  size = "sm",
  variant,
  iconOnly = false,
  className,
}: FollowButtonProps) => {
  const { data: state = "none", isLoading } = useFollowState(targetUserId);
  const action = useFollowAction();

  if (state === "self") return null;

  const handleClick = () => {
    action.mutate(
      { targetUserId, isPrivate, currentState: state },
      {
        onSuccess: (res) => {
          const messages: Record<string, string> = {
            followed: "Now following",
            unfollowed: "Unfollowed",
            request_sent: "Follow request sent",
            request_cancelled: "Request cancelled",
          };
          toast.success(messages[res.action] || "Done");
        },
        onError: () => toast.error("Action failed. Please try again."),
      }
    );
  };

  const busy = isLoading || action.isPending;

  let label = "Follow";
  let icon = <UserPlus className="h-4 w-4" />;
  let resolvedVariant: "hero" | "outline" | "ghost" = variant ?? "hero";

  if (state === "following") {
    label = "Following";
    icon = <UserMinus className="h-4 w-4" />;
    resolvedVariant = variant ?? "outline";
  } else if (state === "requested") {
    label = "Requested";
    icon = <Clock className="h-4 w-4" />;
    resolvedVariant = variant ?? "outline";
  }

  return (
    <Button
      variant={resolvedVariant}
      size={size}
      onClick={handleClick}
      disabled={busy}
      className={className}
      title={state === "requested" ? "Tap to cancel request" : state === "following" ? "Tap to unfollow" : "Follow"}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {!iconOnly && <span className="ml-2">{label}</span>}
    </Button>
  );
};

export default FollowButton;
