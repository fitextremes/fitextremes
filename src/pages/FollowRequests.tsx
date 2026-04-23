import { Link, useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIncomingFollowRequests,
  useRespondFollowRequest,
} from "@/hooks/useFollowRequest";
import { toast } from "sonner";

const FollowRequests = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: requests, isLoading } = useIncomingFollowRequests();
  const respond = useRespondFollowRequest();

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

  const handleRespond = (
    requestId: string,
    requesterId: string,
    accept: boolean
  ) => {
    respond.mutate(
      { requestId, requesterId, accept },
      {
        onSuccess: () =>
          toast.success(accept ? "Follower accepted" : "Request declined"),
        onError: () => toast.error("Action failed"),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Profile" />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/profile">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
          </Link>
        </Button>

        <h1 className="font-display text-2xl uppercase tracking-wider text-foreground mb-6">
          Follow <span className="text-gradient-primary">Requests</span>
        </h1>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req: any, i: number) => {
              const p = req.profiles;
              return (
                <motion.div
                  key={req.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/user/${p?.username || req.requester_id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-lg overflow-hidden">
                      {p?.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p?.full_name || "User"}
                      </p>
                      {p?.username && (
                        <p className="text-xs text-primary truncate">
                          @{p.username}
                        </p>
                      )}
                      {p?.location && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() =>
                        handleRespond(req.id, req.requester_id, true)
                      }
                      disabled={respond.isPending}
                      aria-label="Accept"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleRespond(req.id, req.requester_id, false)
                      }
                      disabled={respond.isPending}
                      aria-label="Decline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No pending requests</p>
            <p className="text-sm mt-1">
              You'll see follow requests from private accounts here.
            </p>
          </div>
        )}
      </div>
      <MobileTabBar />
    </div>
  );
};

export default FollowRequests;
